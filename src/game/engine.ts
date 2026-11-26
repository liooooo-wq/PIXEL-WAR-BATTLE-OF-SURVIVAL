import { audio } from './audio';
import { ARENA_HEIGHT, ARENA_WIDTH, DUEL_ARENA, LEVELS } from './levels';
import {
  drawArenaBackground,
  drawEnemy,
  drawFloatingTexts,
  drawObstacle,
  drawParticles,
  drawPickup,
  drawPlayer,
  drawProjectile,
} from './sprites';
import {
  getDamageMultiplier,
  getEffectiveMaxHp,
  getEffectiveSpeed,
  getFireRateMultiplier,
  WEAPONS,
} from './storage';
import {
  EnemyState,
  EnemyType,
  FloatingText,
  GameMode,
  GameResultSummary,
  HudSnapshot,
  LevelConfig,
  Obstacle,
  Particle,
  Pickup,
  PickupType,
  PlayerState,
  PlayOverlay,
  Projectile,
  SaveData,
  WeaponId,
} from './types';

interface VirtualInput {
  moveX: number;
  moveY: number;
  firing: boolean;
}

const ENEMY_TEMPLATES: Record<
  EnemyType,
  {
    name: string;
    hp: number;
    speed: number;
    damage: number;
    fireCooldown: number;
    radius: number;
    points: number;
    coinDrop: number;
    isElite: boolean;
    isBoss: boolean;
    shieldFront?: boolean;
  }
> = {
  grunt: {
    name: 'Grunt',
    hp: 45,
    speed: 78,
    damage: 14,
    fireCooldown: 1.55,
    radius: 13,
    points: 100,
    coinDrop: 10,
    isElite: false,
    isBoss: false,
  },
  scout: {
    name: 'Scout',
    hp: 40,
    speed: 122,
    damage: 13,
    fireCooldown: 1.15,
    radius: 12,
    points: 100,
    coinDrop: 12,
    isElite: false,
    isBoss: false,
  },
  rifleman: {
    name: 'Rifleman',
    hp: 65,
    speed: 92,
    damage: 16,
    fireCooldown: 0.85,
    radius: 13,
    points: 100,
    coinDrop: 15,
    isElite: false,
    isBoss: false,
  },
  enforcer: {
    name: 'Enforcer',
    hp: 110,
    speed: 96,
    damage: 20,
    fireCooldown: 0.95,
    radius: 15,
    points: 200,
    coinDrop: 24,
    isElite: true,
    isBoss: false,
  },
  sniper: {
    name: 'Sniper',
    hp: 75,
    speed: 82,
    damage: 28,
    fireCooldown: 1.85,
    radius: 13,
    points: 200,
    coinDrop: 26,
    isElite: true,
    isBoss: false,
  },
  juggernaut: {
    name: 'Juggernaut',
    hp: 185,
    speed: 68,
    damage: 22,
    fireCooldown: 1.05,
    radius: 17,
    points: 200,
    coinDrop: 32,
    isElite: true,
    isBoss: false,
    shieldFront: true,
  },
  laser_trooper: {
    name: 'Laser Trooper',
    hp: 115,
    speed: 112,
    damage: 24,
    fireCooldown: 0.9,
    radius: 14,
    points: 200,
    coinDrop: 30,
    isElite: true,
    isBoss: false,
  },
  mini_boss: {
    name: 'IRON GOLIATH',
    hp: 680,
    speed: 78,
    damage: 26,
    fireCooldown: 0.95,
    radius: 28,
    points: 500,
    coinDrop: 120,
    isElite: true,
    isBoss: true,
  },
  final_boss: {
    name: 'OVERLORD VEX',
    hp: 1250,
    speed: 86,
    damage: 30,
    fireCooldown: 0.8,
    radius: 32,
    points: 1000,
    coinDrop: 250,
    isElite: true,
    isBoss: true,
  },
};

export class PixelWarEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private rafId: number | null = null;
  private lastTime = 0;
  private elapsedTime = 0;

  private mode: GameMode = 'single';
  private currentLevelNum = 1;
  private levelConfig: LevelConfig = LEVELS[0];
  private saveData: SaveData;

  private p1!: PlayerState;
  private p2: PlayerState | null = null;
  private enemies: EnemyState[] = [];
  private spawnQueue: EnemyType[] = [];
  private spawnTimer = 0;
  private totalEnemiesInLevel = 0;

  private obstacles: Obstacle[] = [];
  private projectiles: Projectile[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private pickups: Pickup[] = [];

  private nextId = 1;
  private overlay: PlayOverlay = 'NONE';
  private duelWinner: 1 | 2 | 0 | null = null;
  private duelDropTimer = 6;
  private screenShake = 0;
  private highestLevelClearedThisRun = 0;
  private sessionScore = 0;
  private sessionCoins = 0;
  private sessionKills = 0;
  private levelBonusReward: HudSnapshot['levelBonusReward'] = null;
  private victoryFireworkTimer = 0;

  private keys = new Set<string>();
  private mousePos: { x: number; y: number } | null = null;
  private mouseDown = false;
  private virtualInput: VirtualInput = { moveX: 0, moveY: 0, firing: false };

  private onHudUpdate: (hud: HudSnapshot) => void;
  private onProgressCommit: (patch: {
    coinsEarned: number;
    score: number;
    completedLevel?: number;
    resetToLevelOne?: boolean;
  }) => void;
  private onFinishRun: (summary: GameResultSummary) => void;

  private hudSyncTimer = 0;

  constructor(
    canvas: HTMLCanvasElement,
    saveData: SaveData,
    callbacks: {
      onHudUpdate: (hud: HudSnapshot) => void;
      onProgressCommit: (patch: {
        coinsEarned: number;
        score: number;
        completedLevel?: number;
        resetToLevelOne?: boolean;
      }) => void;
      onFinishRun: (summary: GameResultSummary) => void;
    }
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context unavailable');
    this.ctx = context;
    this.saveData = saveData;
    this.onHudUpdate = callbacks.onHudUpdate;
    this.onProgressCommit = callbacks.onProgressCommit;
    this.onFinishRun = callbacks.onFinishRun;

    this.bindInputListeners();
  }

  public updateSaveData(saveData: SaveData): void {
    this.saveData = saveData;
  }

  public setVirtualInput(input: Partial<VirtualInput>): void {
    this.virtualInput = { ...this.virtualInput, ...input };
  }

  public startNewRun(mode: GameMode, startLevel: number): void {
    this.mode = mode;
    this.currentLevelNum = mode === 'duel' ? 0 : Math.max(1, Math.min(10, startLevel));
    this.sessionScore = 0;
    this.sessionCoins = 0;
    this.sessionKills = 0;
    this.highestLevelClearedThisRun = 0;
    this.duelWinner = null;

    const baseMaxHp = mode === 'duel' ? 120 : getEffectiveMaxHp(this.saveData.upgrades);
    const startLives = mode === 'duel' ? 3 : 3 + this.saveData.upgrades.bonusLives;
    const startWeapon: WeaponId = mode === 'duel' ? 'pistol' : this.saveData.equippedWeapon;

    this.p1 = this.createPlayer(1, 90, ARENA_HEIGHT / 2, baseMaxHp, startLives, startWeapon);
    if (mode === 'coop' || mode === 'duel') {
      const p2X = mode === 'duel' ? ARENA_WIDTH - 90 : 90;
      const p2Y = mode === 'duel' ? ARENA_HEIGHT / 2 : ARENA_HEIGHT / 2 + 64;
      if (mode === 'coop') {
        this.p1.y = ARENA_HEIGHT / 2 - 44;
      }
      this.p2 = this.createPlayer(2, p2X, p2Y, baseMaxHp, startLives, startWeapon);
      if (mode === 'duel') {
        this.p2.aimX = -1;
        this.p2.aimY = 0;
      }
    } else {
      this.p2 = null;
    }

    this.loadLevel(this.currentLevelNum);
    this.startLoop();
  }

  public loadNextLevel(): void {
    if (this.currentLevelNum >= 10) return;
    this.currentLevelNum += 1;
    this.loadLevel(this.currentLevelNum);
  }

  public restartCurrentRun(): void {
    const startFrom =
      this.mode === 'duel' ? 0 : this.overlay === 'GAME_OVER' ? 1 : this.currentLevelNum;
    this.startNewRun(this.mode, startFrom);
  }

  public togglePause(): void {
    if (this.overlay === 'NONE') {
      this.overlay = 'PAUSED';
      audio.stopMusic();
      this.emitHud();
    } else if (this.overlay === 'PAUSED') {
      this.overlay = 'NONE';
      audio.startMusic(this.levelConfig.isBossLevel);
      this.lastTime = performance.now();
      this.emitHud();
    }
  }

  public switchPlayerWeapon(playerId: 1 | 2, weaponId: WeaponId): void {
    const target = playerId === 1 ? this.p1 : this.p2;
    if (!target) return;
    if (this.mode !== 'duel' && !this.saveData.ownedWeapons.includes(weaponId)) return;
    target.weapon = weaponId;
    audio.uiClick();
    this.emitHud();
  }

  public destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    audio.stopMusic();
    this.unbindInputListeners();
  }

  private createPlayer(
    id: 1 | 2,
    x: number,
    y: number,
    maxHp: number,
    lives: number,
    weapon: WeaponId
  ): PlayerState {
    return {
      id,
      x,
      y,
      radius: 13,
      vx: 0,
      vy: 0,
      aimX: 1,
      aimY: 0,
      hp: maxHp,
      maxHp,
      lives,
      maxLives: Math.max(lives, 5),
      weapon,
      fireTimer: 0,
      invulnTimer: 1.5,
      hitFlash: 0,
      walkPhase: 0,
      recoilTimer: 0,
      victoryBounce: 0,
      score: 0,
      kills: 0,
      coinsCollected: 0,
      alive: true,
      speedBoostTimer: 0,
      damageBoostTimer: 0,
      tripleShotTimer: 0,
    };
  }

  private loadLevel(levelNum: number): void {
    this.levelConfig = levelNum === 0 ? DUEL_ARENA : LEVELS[levelNum - 1];
    this.overlay = 'NONE';
    this.levelBonusReward = null;
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.pickups = [];
    this.duelDropTimer = 5;

    // Position players cleanly
    this.p1.x = 76;
    this.p1.y = this.mode === 'coop' ? ARENA_HEIGHT / 2 - 48 : ARENA_HEIGHT / 2;
    this.p1.aimX = 1;
    this.p1.aimY = 0;
    this.p1.invulnTimer = 1.6;
    this.p1.victoryBounce = 0;
    if (!this.p1.alive && this.p1.lives > 0) {
      this.p1.alive = true;
      this.p1.hp = this.p1.maxHp;
    }

    if (this.p2) {
      this.p2.x = this.mode === 'duel' ? ARENA_WIDTH - 76 : 76;
      this.p2.y = this.mode === 'duel' ? ARENA_HEIGHT / 2 : ARENA_HEIGHT / 2 + 48;
      this.p2.aimX = this.mode === 'duel' ? -1 : 1;
      this.p2.aimY = 0;
      this.p2.invulnTimer = 1.6;
      this.p2.victoryBounce = 0;
      if (!this.p2.alive && this.p2.lives > 0) {
        this.p2.alive = true;
        this.p2.hp = this.p2.maxHp;
      }
    }

    // Build obstacles
    this.obstacles = this.levelConfig.obstacles.map((o) => ({
      ...o,
      id: this.nextId++,
      hitFlash: 0,
    }));

    // Build enemy spawn queue
    this.spawnQueue = [];
    for (const wave of this.levelConfig.waves) {
      for (let i = 0; i < wave.count; i++) {
        this.spawnQueue.push(wave.type);
      }
    }

    // In 2P Co-Op add slight extra non-boss enemies for balanced fun
    if (this.mode === 'coop' && !this.levelConfig.isBossLevel) {
      const extra = Math.max(2, Math.floor(this.spawnQueue.length * 0.35));
      for (let i = 0; i < extra; i++) {
        this.spawnQueue.push(this.spawnQueue[i % this.spawnQueue.length]);
      }
    }

    this.totalEnemiesInLevel = this.spawnQueue.length;
    this.spawnTimer = 0.25;

    // Immediately spawn first few enemies
    const initialCount = this.levelConfig.isBossLevel ? this.spawnQueue.length : Math.min(4, this.spawnQueue.length);
    for (let i = 0; i < initialCount; i++) {
      this.spawnNextEnemy();
    }

    if (this.levelConfig.isBossLevel) {
      audio.bossWarning();
      this.addFloatingText(
        ARENA_WIDTH / 2,
        110,
        `WARNING: ${this.levelConfig.bossName ?? 'BOSS'}!`,
        '#f43f5e',
        2.2,
        1.35
      );
    }

    audio.startMusic(this.levelConfig.isBossLevel);
    this.emitHud();
  }

  private spawnNextEnemy(): void {
    const nextType = this.spawnQueue.shift();
    if (!nextType) return;

    const tpl = ENEMY_TEMPLATES[nextType];
    const cfg = this.levelConfig;

    // Pick safe spawn point mostly on right/top/bottom edges away from players
    let sx = ARENA_WIDTH - 65;
    let sy = ARENA_HEIGHT / 2;
    if (tpl.isBoss) {
      sx = ARENA_WIDTH - 110;
      sy = ARENA_HEIGHT / 2;
    } else {
      for (let attempt = 0; attempt < 15; attempt++) {
        const edge = Math.random();
        if (edge < 0.65) {
          sx = ARENA_WIDTH - 48 - Math.random() * 90;
          sy = 48 + Math.random() * (ARENA_HEIGHT - 96);
        } else if (edge < 0.82) {
          sx = ARENA_WIDTH * 0.45 + Math.random() * (ARENA_WIDTH * 0.45);
          sy = 42;
        } else {
          sx = ARENA_WIDTH * 0.45 + Math.random() * (ARENA_WIDTH * 0.45);
          sy = ARENA_HEIGHT - 42;
        }
        if (!this.collidesAnyObstacle(sx, sy, tpl.radius + 4) && this.distToNearestPlayer(sx, sy) > 190) {
          break;
        }
      }
    }

    const hpScale = tpl.isBoss && this.mode === 'coop' ? 1.45 : 1;
    const maxHp = Math.round(tpl.hp * cfg.enemyHpMult * hpScale);

    this.enemies.push({
      id: this.nextId++,
      type: nextType,
      name: tpl.name,
      x: sx,
      y: sy,
      radius: tpl.radius,
      vx: 0,
      vy: 0,
      aimX: -1,
      aimY: 0,
      hp: maxHp,
      maxHp,
      speed: tpl.speed * cfg.enemySpeedMult,
      damage: Math.round(tpl.damage * cfg.enemyDamageMult),
      fireCooldown: tpl.fireCooldown / (0.75 + cfg.aggression * 0.45),
      fireTimer: 0.4 + Math.random() * 0.8,
      points: tpl.points,
      coinDrop: tpl.coinDrop,
      isElite: tpl.isElite,
      isBoss: tpl.isBoss,
      hitFlash: 0,
      walkPhase: Math.random() * Math.PI * 2,
      aiTimer: 0.5 + Math.random(),
      strafeDir: Math.random() < 0.5 ? -1 : 1,
      dashTimer: 0,
      dashCooldown: 4.5,
      dashVx: 0,
      dashVy: 0,
      specialTimer: 3.2,
      shieldFront: Boolean(tpl.shieldFront),
      summonCount: 0,
    });
  }

  private distToNearestPlayer(x: number, y: number): number {
    let best = Infinity;
    if (this.p1.alive) best = Math.min(best, Math.hypot(this.p1.x - x, this.p1.y - y));
    if (this.p2?.alive) best = Math.min(best, Math.hypot(this.p2.x - x, this.p2.y - y));
    return best;
  }

  private startLoop(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.lastTime = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - this.lastTime) / 1000));
      this.lastTime = now;
      this.update(dt);
      this.render();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private update(dt: number): void {
    if (this.overlay === 'PAUSED' || this.overlay === 'LEVEL_CLEAR' || this.overlay === 'GAME_OVER') {
      return;
    }

    this.elapsedTime += dt;

    if (this.overlay === 'YOU_WIN') {
      this.victoryFireworkTimer -= dt;
      if (this.victoryFireworkTimer <= 0) {
        this.victoryFireworkTimer = 0.45;
        this.spawnExplosion(
          100 + Math.random() * (ARENA_WIDTH - 200),
          80 + Math.random() * (ARENA_HEIGHT - 180),
          ['#facc15', '#38bdf8', '#f43f5e', '#10b981'][Math.floor(Math.random() * 4)],
          22
        );
      }
      this.updateParticles(dt);
      this.updateFloatingTexts(dt);
      return;
    }

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 28);
    }

    // Update players
    this.updatePlayer(this.p1, dt);
    if (this.p2) {
      this.updatePlayer(this.p2, dt);
    }

    // Spawn queued enemies gradually (higher pressure from level 5+)
    if (this.mode !== 'duel' && this.spawnQueue.length > 0) {
      this.spawnTimer -= dt;
      const maxConcurrent =
        this.currentLevelNum >= 5
          ? Math.min(12, 5 + Math.floor(this.currentLevelNum * 0.7))
          : Math.min(6, 3 + Math.floor(this.currentLevelNum * 0.6));
      if (this.spawnTimer <= 0 && this.enemies.length < maxConcurrent) {
        this.spawnNextEnemy();
        this.spawnTimer =
          this.currentLevelNum >= 5
            ? Math.max(0.45, 1.45 - this.currentLevelNum * 0.1)
            : Math.max(0.85, 1.9 - this.currentLevelNum * 0.11);
      }
    }

    // In 2P Duel mode, spawn balanced center powerups periodically
    if (this.mode === 'duel') {
      this.duelDropTimer -= dt;
      if (this.duelDropTimer <= 0) {
        this.duelDropTimer = 7.5;
        const types: PickupType[] = ['medkit', 'speed', 'power', 'triple'];
        const pick = types[Math.floor(Math.random() * types.length)];
        this.pickups.push({
          id: this.nextId++,
          type: pick,
          x: ARENA_WIDTH / 2 + (Math.random() - 0.5) * 80,
          y: 80 + Math.random() * (ARENA_HEIGHT - 160),
          value: 35,
          life: 14,
          bobPhase: 0,
        });
      }
    }

    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updatePickups(dt);
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);

    for (const obs of this.obstacles) {
      if (obs.hitFlash > 0) obs.hitFlash = Math.max(0, obs.hitFlash - dt);
    }

    // Check Win / Loss conditions
    this.checkMatchConditions();

    this.hudSyncTimer -= dt;
    if (this.hudSyncTimer <= 0) {
      this.hudSyncTimer = 0.08;
      this.emitHud();
    }
  }

  private updatePlayer(p: PlayerState, dt: number): void {
    if (!p.alive) return;

    if (p.fireTimer > 0) p.fireTimer = Math.max(0, p.fireTimer - dt);
    if (p.invulnTimer > 0) p.invulnTimer = Math.max(0, p.invulnTimer - dt);
    if (p.hitFlash > 0) p.hitFlash = Math.max(0, p.hitFlash - dt);
    if (p.recoilTimer > 0) p.recoilTimer = Math.max(0, p.recoilTimer - dt);
    if (p.speedBoostTimer > 0) p.speedBoostTimer = Math.max(0, p.speedBoostTimer - dt);
    if (p.damageBoostTimer > 0) p.damageBoostTimer = Math.max(0, p.damageBoostTimer - dt);
    if (p.tripleShotTimer > 0) p.tripleShotTimer = Math.max(0, p.tripleShotTimer - dt);

    let mx = 0;
    let my = 0;
    let wantFire = false;

    if (p.id === 1) {
      if (this.keys.has('KeyW')) my -= 1;
      if (this.keys.has('KeyS')) my += 1;
      if (this.keys.has('KeyA')) mx -= 1;
      if (this.keys.has('KeyD')) mx += 1;

      if (this.mode === 'single') {
        if (this.keys.has('ArrowUp')) my -= 1;
        if (this.keys.has('ArrowDown')) my += 1;
        if (this.keys.has('ArrowLeft')) mx -= 1;
        if (this.keys.has('ArrowRight')) mx += 1;
        wantFire =
          this.keys.has('KeyF') ||
          this.keys.has('Space') ||
          this.mouseDown ||
          this.virtualInput.firing;
        mx += this.virtualInput.moveX;
        my += this.virtualInput.moveY;
      } else {
        wantFire = this.keys.has('KeyF');
      }
    } else {
      // Player 2 strictly Arrow keys + L
      if (this.keys.has('ArrowUp')) my -= 1;
      if (this.keys.has('ArrowDown')) my += 1;
      if (this.keys.has('ArrowLeft')) mx -= 1;
      if (this.keys.has('ArrowRight')) mx += 1;
      wantFire = this.keys.has('KeyL');
    }

    const len = Math.hypot(mx, my);
    if (len > 0) {
      mx /= Math.max(1, len);
      my /= Math.max(1, len);
      p.walkPhase += dt * 15;
    }

    const baseSpeed = this.mode === 'duel' ? 200 : getEffectiveSpeed(this.saveData.upgrades);
    const speed = baseSpeed * (p.speedBoostTimer > 0 ? 1.32 : 1);

    this.moveCircleWithCollisions(p, mx * speed * dt, my * speed * dt);

    // Aiming: if single player & mouse moved recently and mouse button or aiming active, aim toward cursor; otherwise facing direction
    if (p.id === 1 && this.mode === 'single' && this.mouseDown && this.mousePos) {
      const dx = this.mousePos.x - p.x;
      const dy = this.mousePos.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d > 4) {
        p.aimX = dx / d;
        p.aimY = dy / d;
      }
    } else if (len > 0.1) {
      p.aimX = mx / len;
      p.aimY = my / len;
    }

    if (wantFire && p.fireTimer <= 0) {
      this.firePlayerWeapon(p);
    }
  }

  private firePlayerWeapon(p: PlayerState): void {
    const spec = WEAPONS[p.weapon];
    const rateMult = this.mode === 'duel' ? 1 : getFireRateMultiplier(this.saveData.upgrades);
    const hasPower = p.damageBoostTimer > 0;
    const dmgMult =
      (this.mode === 'duel' ? 1 : getDamageMultiplier(this.saveData.upgrades)) *
      (hasPower ? 1.75 : 1);

    p.fireTimer = spec.fireCooldown / rateMult;
    p.recoilTimer = 0.11;

    const baseAngle = Math.atan2(p.aimY, p.aimX);
    const shotOffsets = p.tripleShotTimer > 0 ? [-0.18, 0, 0.18] : [0];

    for (const offset of shotOffsets) {
      const angle = baseAngle + offset + (Math.random() - 0.5) * spec.spread;
      const vx = Math.cos(angle) * spec.projectileSpeed;
      const vy = Math.sin(angle) * spec.projectileSpeed;

      this.projectiles.push({
        id: this.nextId++,
        ownerType: p.id === 1 ? 'player1' : 'player2',
        x: p.x + Math.cos(angle) * 20,
        y: p.y + Math.sin(angle) * 20,
        vx,
        vy,
        radius: spec.projectileSize + (hasPower ? 1 : 0),
        damage: Math.round(spec.baseDamage * dmgMult),
        color: hasPower ? '#fb923c' : spec.color,
        glowColor: hasPower ? '#ea580c' : spec.glowColor,
        weapon: p.weapon,
        pierce: spec.pierce,
        hitIds: [],
        life: 1.8,
      });
    }

    if (p.weapon === 'pistol') audio.shootPistol();
    else if (p.weapon === 'rifle') audio.shootRifle();
    else audio.shootLaser();
  }

  private updateEnemies(dt: number): void {
    for (const e of this.enemies) {
      if (e.hitFlash > 0) e.hitFlash = Math.max(0, e.hitFlash - dt);

      const target = this.getTargetPlayer(e.x, e.y);
      if (!target) continue;

      const dx = target.x - e.x;
      const dy = target.y - e.y;
      const dist = Math.max(1, Math.hypot(dx, dy));
      const dirX = dx / dist;
      const dirY = dy / dist;

      e.aimX = dirX;
      e.aimY = dirY;

      // Boss special attacks & dashes
      if (e.isBoss) {
        this.updateBossBehavior(e, target, dist, dirX, dirY, dt);
      } else {
        this.updateRegularEnemyBehavior(e, dist, dirX, dirY, dt);
      }
    }
  }

  private updateRegularEnemyBehavior(
    e: EnemyState,
    dist: number,
    dirX: number,
    dirY: number,
    dt: number
  ): void {
    e.aiTimer -= dt;
    if (e.aiTimer <= 0) {
      e.aiTimer = 0.7 + Math.random() * 1.1;
      e.strafeDir = Math.random() < 0.5 ? -1 : 1;
    }

    let moveX = dirX;
    let moveY = dirY;

    const preferredMin = e.type === 'sniper' ? 270 : e.type === 'juggernaut' ? 85 : 140;
    const preferredMax = e.type === 'sniper' ? 390 : 240;

    if (dist < preferredMin) {
      // Back up / strafe
      moveX = -dirX * 0.5 + -dirY * e.strafeDir * 0.85;
      moveY = -dirY * 0.5 + dirX * e.strafeDir * 0.85;
    } else if (dist < preferredMax) {
      // Tactical strafe while firing
      const strafeWeight = 0.4 + this.levelConfig.aggression * 0.45;
      moveX = -dirY * e.strafeDir * strafeWeight + dirX * 0.25;
      moveY = dirX * e.strafeDir * strafeWeight + dirY * 0.25;
    }

    const mlen = Math.hypot(moveX, moveY) || 1;
    const prevX = e.x;
    const prevY = e.y;
    this.moveCircleWithCollisions(e, (moveX / mlen) * e.speed * dt, (moveY / mlen) * e.speed * dt);

    // If blocked by obstacle, slide perpendicular
    if (Math.hypot(e.x - prevX, e.y - prevY) < e.speed * dt * 0.2) {
      this.moveCircleWithCollisions(
        e,
        -dirY * e.strafeDir * e.speed * dt,
        dirX * e.strafeDir * e.speed * dt
      );
    }

    e.walkPhase += dt * 10;

    // Attack firing
    e.fireTimer -= dt;
    const range = e.type === 'sniper' ? 680 : 460;
    if (e.fireTimer <= 0 && dist < range) {
      e.fireTimer = e.fireCooldown * (0.85 + Math.random() * 0.35);
      this.fireEnemyProjectile(e, dirX, dirY);
    }
  }

  private updateBossBehavior(
    e: EnemyState,
    target: PlayerState,
    dist: number,
    dirX: number,
    dirY: number,
    dt: number
  ): void {
    const enraged = e.hp < e.maxHp * 0.5;
    const spd = e.speed * (enraged ? 1.25 : 1);

    if (e.dashTimer > 0) {
      e.dashTimer -= dt;
      this.moveCircleWithCollisions(e, e.dashVx * dt, e.dashVy * dt);
      if (Math.hypot(e.x - target.x, e.y - target.y) < e.radius + target.radius + 4) {
        this.damagePlayer(target, Math.round(e.damage * 0.9));
      }
    } else {
      e.dashCooldown -= dt;
      if (e.dashCooldown <= 0 && dist > 110) {
        e.dashCooldown = enraged ? 3.2 : 4.8;
        e.dashTimer = 0.45;
        e.dashVx = dirX * (enraged ? 430 : 380);
        e.dashVy = dirY * (enraged ? 430 : 380);
        this.addFloatingText(e.x, e.y - 36, 'CHARGE!', '#f97316', 0.8, 1.0);
      } else {
        const moveX = dist > 160 ? dirX : -dirY * e.strafeDir;
        const moveY = dist > 160 ? dirY : dirX * e.strafeDir;
        this.moveCircleWithCollisions(e, moveX * spd * dt, moveY * spd * dt);
        e.walkPhase += dt * 8;
      }
    }

    // Standard spread cannon fire
    e.fireTimer -= dt;
    if (e.fireTimer <= 0) {
      e.fireTimer = e.fireCooldown * (enraged ? 0.64 : 0.88);
      const baseAngle = Math.atan2(dirY, dirX);
      const spreadCount =
        e.type === 'final_boss' ? (enraged ? 7 : 5) : enraged ? 5 : 3;
      const step = 0.2;
      const start = -((spreadCount - 1) / 2) * step;
      for (let i = 0; i < spreadCount; i++) {
        const a = baseAngle + start + i * step;
        this.spawnBossShot(e, Math.cos(a), Math.sin(a), enraged ? 370 : 335, e.damage, 'boss_orb');
      }
    }

    // Special radial missile/laser burst & reinforcements
    e.specialTimer -= dt;
    if (e.specialTimer <= 0) {
      e.specialTimer = enraged ? 2.8 : 4.0;
      const count = e.type === 'final_boss' ? (enraged ? 14 : 10) : enraged ? 10 : 8;
      for (let i = 0; i < count; i++) {
        const a = (Math.PI * 2 * i) / count + this.elapsedTime;
        this.spawnBossShot(
          e,
          Math.cos(a),
          Math.sin(a),
          enraged ? 305 : 275,
          Math.round(e.damage * 0.9),
          e.type === 'final_boss' ? 'boss_missile' : 'boss_orb'
        );
      }
      audio.explosion();

      // Summon elite minions during boss battle
      const maxSummons = e.type === 'final_boss' ? 5 : 3;
      if (e.summonCount < maxSummons && this.enemies.length < 7) {
        e.summonCount++;
        this.spawnQueue.push(e.type === 'final_boss' ? 'laser_trooper' : 'enforcer');
      }
    }
  }

  private fireEnemyProjectile(e: EnemyState, dirX: number, dirY: number): void {
    const isSniper = e.type === 'sniper';
    const isLaser = e.type === 'laser_trooper';
    const spd = isSniper ? 560 : isLaser ? 480 : this.currentLevelNum >= 5 ? 340 : 300;
    const baseAngle = Math.atan2(dirY, dirX);
    const inaccuracy = (1 - this.levelConfig.aggression) * 0.2;

    // From level 5+, Enforcers & Laser Troopers fire multi-shot bursts
    const shotAngles =
      isLaser && this.currentLevelNum >= 7
        ? [-0.14, 0, 0.14]
        : e.type === 'enforcer' && this.currentLevelNum >= 5
          ? [-0.08, 0.08]
          : [0];

    for (const offset of shotAngles) {
      const a = baseAngle + offset + (Math.random() - 0.5) * inaccuracy;
      this.projectiles.push({
        id: this.nextId++,
        ownerType: 'enemy',
        x: e.x + Math.cos(a) * (e.radius + 6),
        y: e.y + Math.sin(a) * (e.radius + 6),
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        radius: isSniper ? 5 : 4,
        damage: e.damage,
        color: isLaser ? '#38bdf8' : isSniper ? '#f43f5e' : '#fb923c',
        glowColor: isLaser ? '#0369a1' : '#991b1b',
        weapon: isSniper || isLaser ? 'sniper_bolt' : 'enemy_bullet',
        pierce: false,
        hitIds: [],
        life: 2.6,
      });
    }
  }

  private spawnBossShot(
    e: EnemyState,
    dx: number,
    dy: number,
    speed: number,
    damage: number,
    weapon: 'boss_orb' | 'boss_missile'
  ): void {
    this.projectiles.push({
      id: this.nextId++,
      ownerType: 'enemy',
      x: e.x + dx * (e.radius + 8),
      y: e.y + dy * (e.radius + 8),
      vx: dx * speed,
      vy: dy * speed,
      radius: weapon === 'boss_missile' ? 7 : 6,
      damage,
      color: weapon === 'boss_missile' ? '#facc15' : '#f43f5e',
      glowColor: '#be123c',
      weapon,
      pierce: false,
      hitIds: [],
      life: 3.5,
    });
  }

  private getTargetPlayer(ex: number, ey: number): PlayerState | null {
    const aliveList: PlayerState[] = [];
    if (this.p1.alive) aliveList.push(this.p1);
    if (this.p2?.alive) aliveList.push(this.p2);
    if (aliveList.length === 0) return null;
    if (aliveList.length === 1) return aliveList[0];

    const d1 = Math.hypot(aliveList[0].x - ex, aliveList[0].y - ey);
    const d2 = Math.hypot(aliveList[1].x - ex, aliveList[1].y - ey);
    return d1 <= d2 ? aliveList[0] : aliveList[1];
  }

  private updateProjectiles(dt: number): void {
    const remaining: Projectile[] = [];

    for (const pr of this.projectiles) {
      pr.life -= dt;
      if (pr.life <= 0) continue;

      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;

      // Arena bounds
      if (pr.x < 12 || pr.x > ARENA_WIDTH - 12 || pr.y < 12 || pr.y > ARENA_HEIGHT - 12) {
        this.spawnSparks(pr.x, pr.y, pr.color, 4);
        continue;
      }

      // Check obstacle hit
      let hitWall = false;
      for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const obs = this.obstacles[i];
        if (
          pr.x + pr.radius > obs.x &&
          pr.x - pr.radius < obs.x + obs.w &&
          pr.y + pr.radius > obs.y &&
          pr.y - pr.radius < obs.y + obs.h
        ) {
          hitWall = true;
          this.spawnSparks(pr.x, pr.y, pr.color, 5);
          if (obs.destructible) {
            obs.hp -= pr.damage;
            obs.hitFlash = 0.08;
            if (obs.hp <= 0) {
              this.destroyObstacle(obs, i, pr.ownerType);
            }
          }
          break;
        }
      }
      if (hitWall) continue;

      // Hit targets
      let consumed = false;
      if (pr.ownerType === 'player1' || pr.ownerType === 'player2') {
        const shooter = pr.ownerType === 'player1' ? this.p1 : this.p2;

        // In 2P Duel mode, check hit against other player
        if (this.mode === 'duel' && this.p2) {
          const opponent = pr.ownerType === 'player1' ? this.p2 : this.p1;
          if (
            opponent.alive &&
            Math.hypot(pr.x - opponent.x, pr.y - opponent.y) < pr.radius + opponent.radius
          ) {
            const killed = this.damagePlayer(opponent, pr.damage);
            if (shooter) {
              shooter.score += 25;
              if (killed) shooter.kills += 1;
            }
            this.spawnSparks(pr.x, pr.y, '#ef4444', 8);
            consumed = true;
          }
        }

        // Check enemies
        if (!consumed) {
          for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if (pr.hitIds.includes(e.id)) continue;
            if (Math.hypot(pr.x - e.x, pr.y - e.y) < pr.radius + e.radius) {
              pr.hitIds.push(e.id);
              this.damageEnemy(e, i, pr.damage, pr.vx, pr.vy, shooter);
              if (!pr.pierce) {
                consumed = true;
                break;
              }
            }
          }
        }
      } else {
        // Enemy projectile hitting players
        const targets = [this.p1, this.p2].filter((pl): pl is PlayerState => Boolean(pl && pl.alive));
        for (const pl of targets) {
          if (Math.hypot(pr.x - pl.x, pr.y - pl.y) < pr.radius + pl.radius) {
            this.damagePlayer(pl, pr.damage);
            this.spawnSparks(pr.x, pr.y, '#ef4444', 7);
            consumed = true;
            break;
          }
        }
      }

      if (!consumed) {
        remaining.push(pr);
      }
    }

    this.projectiles = remaining;
  }

  private destroyObstacle(
    obs: Obstacle,
    index: number,
    ownerType: Projectile['ownerType']
  ): void {
    this.obstacles.splice(index, 1);
    const cx = obs.x + obs.w / 2;
    const cy = obs.y + obs.h / 2;

    if (obs.type === 'barrel') {
      // Explosive barrel damages nearby enemies & players!
      audio.explosion();
      this.screenShake = 8;
      this.spawnExplosion(cx, cy, '#f97316', 26);
      const blastRadius = 105;

      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        if (Math.hypot(e.x - cx, e.y - cy) < blastRadius + e.radius) {
          const shooter = ownerType === 'player2' ? this.p2 : this.p1;
          this.damageEnemy(e, i, 75, e.x - cx, e.y - cy, shooter);
        }
      }
      if (this.mode === 'duel') {
        [this.p1, this.p2].forEach((pl) => {
          if (pl && pl.alive && Math.hypot(pl.x - cx, pl.y - cy) < blastRadius) {
            this.damagePlayer(pl, 40);
          }
        });
      }
    } else if (obs.type === 'crate') {
      audio.hit();
      this.spawnExplosion(cx, cy, '#a87040', 12);
      // Chance to drop coin or medkit!
      const r = Math.random();
      if (r < 0.45) {
        this.pickups.push({
          id: this.nextId++,
          type: 'coin',
          x: cx,
          y: cy,
          value: 15,
          life: 16,
          bobPhase: 0,
        });
      } else if (r < 0.65) {
        this.pickups.push({
          id: this.nextId++,
          type: 'medkit',
          x: cx,
          y: cy,
          value: 30,
          life: 16,
          bobPhase: 0,
        });
      } else if (r < 0.8) {
        const skillPool: PickupType[] = ['triple', 'power', 'speed'];
        this.pickups.push({
          id: this.nextId++,
          type: skillPool[Math.floor(Math.random() * skillPool.length)],
          x: cx,
          y: cy,
          value: 1,
          life: 16,
          bobPhase: 0,
        });
      }
    } else {
      this.spawnExplosion(cx, cy, '#a8946c', 10);
    }
  }

  private damageEnemy(
    e: EnemyState,
    index: number,
    rawDamage: number,
    vx: number,
    vy: number,
    shooter: PlayerState | null
  ): void {
    let finalDamage = rawDamage;

    // Juggernaut frontal shield mitigation
    if (e.shieldFront) {
      const dot = (vx * e.aimX + vy * e.aimY) / (Math.hypot(vx, vy) || 1);
      if (dot < -0.25) {
        finalDamage = Math.max(4, Math.round(rawDamage * 0.45));
        this.addFloatingText(e.x, e.y - 24, 'SHIELD', '#94a3b8', 0.65, 0.85);
      }
    }

    e.hp -= finalDamage;
    e.hitFlash = 0.09;
    audio.hit();
    this.spawnSparks(e.x, e.y, '#facc15', 5);

    if (e.hp <= 0) {
      this.enemies.splice(index, 1);
      audio.explosion();
      this.screenShake = Math.max(this.screenShake, e.isBoss ? 12 : 4);
      this.spawnExplosion(e.x, e.y, e.isBoss ? '#f43f5e' : '#f97316', e.isBoss ? 42 : 16);

      this.sessionScore += e.points;
      this.sessionKills += 1;
      if (shooter) {
        shooter.score += e.points;
        shooter.kills += 1;
      }

      // Floating score popup!
      this.addFloatingText(
        e.x,
        e.y - 16,
        `+${e.points}`,
        e.isBoss ? '#facc15' : e.isElite ? '#38bdf8' : '#fef08a',
        1.1,
        e.isBoss ? 1.3 : 1.0
      );

      // Direct coin reward + dropped pickup coins
      const instantCoins = Math.ceil(e.coinDrop * 0.6);
      this.sessionCoins += instantCoins;
      if (shooter) shooter.coinsCollected += instantCoins;

      this.pickups.push({
        id: this.nextId++,
        type: 'coin',
        x: e.x + (Math.random() - 0.5) * 16,
        y: e.y + (Math.random() - 0.5) * 16,
        value: Math.max(4, Math.floor(e.coinDrop * 0.5)),
        life: 18,
        bobPhase: 0,
      });

      // Chance for medkit, rare heart, or combat skill drop!
      const dropRoll = Math.random();
      if (dropRoll < 0.13) {
        this.pickups.push({
          id: this.nextId++,
          type: 'medkit',
          x: e.x,
          y: e.y,
          value: 30,
          life: 16,
          bobPhase: 1,
        });
      } else if (dropRoll < 0.17 && !e.isBoss) {
        this.pickups.push({
          id: this.nextId++,
          type: 'life',
          x: e.x,
          y: e.y,
          value: 1,
          life: 18,
          bobPhase: 2,
        });
      }

      // Enemy Skill Drop (Triple Shot 3x, Damage Boost, Speed Boost)
      const skillChance = e.isElite ? 0.38 : 0.24;
      if (!e.isBoss && Math.random() < skillChance) {
        const sr = Math.random();
        const skillType: PickupType =
          sr < 0.44 ? 'triple' : sr < 0.84 ? 'power' : 'speed';
        this.pickups.push({
          id: this.nextId++,
          type: skillType,
          x: e.x + (Math.random() - 0.5) * 20,
          y: e.y + (Math.random() - 0.5) * 20,
          value: 1,
          life: 18,
          bobPhase: 0.5,
        });
      }
    }
  }

  private damagePlayer(p: PlayerState, amount: number): boolean {
    if (!p.alive || p.invulnTimer > 0) return false;

    p.hp -= amount;
    p.hitFlash = 0.14;
    this.screenShake = Math.max(this.screenShake, 5);
    audio.playerHurt();

    if (p.hp <= 0) {
      p.lives -= 1;
      this.spawnExplosion(p.x, p.y, p.id === 1 ? '#3b82f6' : '#f59e0b', 18);

      if (p.lives > 0) {
        // Lose 1 life, recover HP, brief invulnerability shield
        p.hp = p.maxHp;
        p.invulnTimer = 2.6;
        this.addFloatingText(p.x, p.y - 26, '-1 NYAWA!', '#f43f5e', 1.3, 1.05);
      } else {
        p.hp = 0;
        p.alive = false;
        this.addFloatingText(p.x, p.y - 26, 'ELIMINATED', '#ef4444', 1.5, 1.1);
      }
      this.emitHud();
      return true;
    }

    return false;
  }

  private updatePickups(dt: number): void {
    const players = [this.p1, this.p2].filter((pl): pl is PlayerState => Boolean(pl && pl.alive));
    const remaining: Pickup[] = [];

    for (const pk of this.pickups) {
      pk.life -= dt;
      pk.bobPhase += dt * 4.5;
      if (pk.life <= 0) continue;

      let collected = false;
      for (const pl of players) {
        if (Math.hypot(pl.x - pk.x, pl.y - pk.y) < pl.radius + 15) {
          collected = true;
          if (pk.type === 'coin') {
            this.sessionCoins += pk.value;
            pl.coinsCollected += pk.value;
            audio.coin();
            this.addFloatingText(pk.x, pk.y - 12, `+${pk.value} KOIN`, '#facc15', 0.9, 0.95);
          } else if (pk.type === 'medkit') {
            pl.hp = Math.min(pl.maxHp, pl.hp + pk.value);
            audio.heart();
            this.addFloatingText(pk.x, pk.y - 12, `+${pk.value} HP`, '#10b981', 0.9, 0.95);
          } else if (pk.type === 'life') {
            pl.lives = Math.min(pl.maxLives, pl.lives + 1);
            audio.heart();
            this.addFloatingText(pk.x, pk.y - 14, '+1 NYAWA!', '#f43f5e', 1.2, 1.05);
          } else if (pk.type === 'speed') {
            pl.speedBoostTimer = 8.0;
            audio.upgrade();
            this.addFloatingText(pk.x, pk.y - 12, 'SPEED UP!', '#38bdf8', 1.1, 0.95);
          } else if (pk.type === 'power') {
            pl.damageBoostTimer = 9.0;
            audio.upgrade();
            this.addFloatingText(pk.x, pk.y - 12, 'DAMAGE +75%!', '#f97316', 1.2, 1.0);
          } else if (pk.type === 'triple') {
            pl.tripleShotTimer = 9.0;
            audio.upgrade();
            this.addFloatingText(pk.x, pk.y - 14, 'TRIPLE SHOT 3X!', '#c084fc', 1.2, 1.0);
          }
          break;
        }
      }

      if (!collected) remaining.push(pk);
    }

    this.pickups = remaining;
  }

  private checkMatchConditions(): void {
    if (this.overlay !== 'NONE') return;

    if (this.mode === 'duel') {
      const p1Dead = !this.p1.alive;
      const p2Dead = !this.p2?.alive;
      if (p1Dead || p2Dead) {
        if (p1Dead && p2Dead) this.duelWinner = 0;
        else if (p2Dead) this.duelWinner = 1;
        else this.duelWinner = 2;

        if (this.duelWinner === 1) this.p1.victoryBounce = 1;
        if (this.duelWinner === 2 && this.p2) this.p2.victoryBounce = 1;

        this.overlay = 'YOU_WIN';
        audio.stopMusic();
        audio.youWin();
        const duelCoins = 75;
        this.sessionCoins += duelCoins;
        const totalDuelScore = Math.max(this.p1.score, this.p2?.score ?? 0) + 300;
        this.sessionScore = totalDuelScore;
        this.onProgressCommit({ coinsEarned: this.sessionCoins, score: this.sessionScore });
        this.emitHud();
      }
      return;
    }

    // Single / Co-Op loss check: losing resets campaign progress back to Level 1
    const anyAlive = this.p1.alive || Boolean(this.p2?.alive);
    if (!anyAlive) {
      this.overlay = 'GAME_OVER';
      audio.stopMusic();
      audio.gameOver();
      this.onProgressCommit({
        coinsEarned: this.sessionCoins,
        score: this.sessionScore,
        resetToLevelOne: true,
      });
      this.emitHud();
      return;
    }

    // Level Clear check
    if (this.spawnQueue.length === 0 && this.enemies.length === 0) {
      this.highestLevelClearedThisRun = Math.max(this.highestLevelClearedThisRun, this.currentLevelNum);
      const scoreBonus = 300;
      const coinBonus = this.levelConfig.clearCoinBonus;
      this.sessionScore += scoreBonus;
      this.sessionCoins += coinBonus;

      let gotLife = false;
      if (this.levelConfig.rewardLife) {
        gotLife = true;
        if (this.p1.alive) this.p1.lives = Math.min(this.p1.maxLives, this.p1.lives + 1);
        if (this.p2?.alive) this.p2.lives = Math.min(this.p2.maxLives, this.p2.lives + 1);
      }

      // Revive fallen teammate in 2P Co-Op on level clear with 1 life if they ran out
      if (this.mode === 'coop' && this.p2) {
        if (!this.p1.alive) {
          this.p1.alive = true;
          this.p1.lives = 1;
          this.p1.hp = this.p1.maxHp;
        }
        if (!this.p2.alive) {
          this.p2.alive = true;
          this.p2.lives = 1;
          this.p2.hp = this.p2.maxHp;
        }
      }

      this.p1.victoryBounce = 1;
      if (this.p2) this.p2.victoryBounce = 1;

      this.levelBonusReward = { scoreBonus, coinBonus, gotLife };

      this.onProgressCommit({
        coinsEarned: this.sessionCoins,
        score: this.sessionScore,
        completedLevel: this.currentLevelNum,
      });

      audio.stopMusic();
      if (this.currentLevelNum >= 10) {
        this.overlay = 'YOU_WIN';
        audio.youWin();
      } else {
        this.overlay = 'LEVEL_CLEAR';
        audio.levelClear();
      }
      this.emitHud();
    }
  }

  public finishToResult(): void {
    const won = this.overlay === 'YOU_WIN';
    const isCampaignVictory = won && this.mode !== 'duel' && this.currentLevelNum >= 10;
    const livesRemaining =
      this.mode === 'coop' && this.p2
        ? this.p1.lives + this.p2.lives
        : this.p1.lives;

    this.onFinishRun({
      won,
      isCampaignVictory,
      mode: this.mode,
      levelReached: this.mode === 'duel' ? 1 : this.currentLevelNum,
      highestLevelCompleted: Math.max(
        this.saveData.highestLevelCompleted,
        this.highestLevelClearedThisRun
      ),
      totalScore: this.sessionScore,
      isNewHighScore: this.sessionScore > this.saveData.highScore,
      totalKills: this.sessionKills,
      livesRemaining: Math.max(0, livesRemaining),
      coinsEarned: this.sessionCoins,
      duelWinner: this.duelWinner,
      p1Score: this.p1.score,
      p2Score: this.p2?.score,
    });
  }

  private moveCircleWithCollisions(
    entity: { x: number; y: number; radius: number },
    dx: number,
    dy: number
  ): void {
    const minX = 12 + entity.radius;
    const maxX = ARENA_WIDTH - 12 - entity.radius;
    const minY = 12 + entity.radius;
    const maxY = ARENA_HEIGHT - 12 - entity.radius;

    // Resolve X axis
    entity.x = Math.max(minX, Math.min(maxX, entity.x + dx));
    for (const obs of this.obstacles) {
      if (this.circleRectOverlap(entity.x, entity.y, entity.radius, obs)) {
        if (dx > 0) entity.x = obs.x - entity.radius - 0.1;
        else if (dx < 0) entity.x = obs.x + obs.w + entity.radius + 0.1;
      }
    }

    // Resolve Y axis
    entity.y = Math.max(minY, Math.min(maxY, entity.y + dy));
    for (const obs of this.obstacles) {
      if (this.circleRectOverlap(entity.x, entity.y, entity.radius, obs)) {
        if (dy > 0) entity.y = obs.y - entity.radius - 0.1;
        else if (dy < 0) entity.y = obs.y + obs.h + entity.radius + 0.1;
      }
    }
  }

  private circleRectOverlap(cx: number, cy: number, r: number, rect: Obstacle): boolean {
    const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy < r * r;
  }

  private collidesAnyObstacle(cx: number, cy: number, r: number): boolean {
    return this.obstacles.some((obs) => this.circleRectOverlap(cx, cy, r, obs));
  }

  private spawnSparks(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 45 + Math.random() * 140;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        size: 3 + Math.floor(Math.random() * 3),
        color,
        life: 0.18 + Math.random() * 0.22,
        maxLife: 0.4,
      });
    }
  }

  private spawnExplosion(x: number, y: number, color: string, count: number): void {
    const palette = [color, '#fef08a', '#f97316', '#94a3b8'];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 210;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        size: 4 + Math.floor(Math.random() * 5),
        color: palette[i % palette.length],
        life: 0.25 + Math.random() * 0.45,
        maxLife: 0.7,
      });
    }
  }

  private addFloatingText(
    x: number,
    y: number,
    text: string,
    color: string,
    life = 1.0,
    scale = 1.0
  ): void {
    this.floatingTexts.push({
      x,
      y,
      vy: -32,
      text,
      color,
      life,
      maxLife: life,
      scale,
    });
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= 0.94;
      pt.vy *= 0.94;
    }
  }

  private updateFloatingTexts(dt: number): void {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.y += ft.vy * dt;
    }
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.save();

    if (this.screenShake > 0.2) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
    }

    drawArenaBackground(ctx, this.levelConfig);

    for (const obs of this.obstacles) {
      drawObstacle(ctx, obs, this.levelConfig.wallColor);
    }

    for (const pk of this.pickups) {
      drawPickup(ctx, pk);
    }

    for (const e of this.enemies) {
      drawEnemy(ctx, e, this.elapsedTime);
    }

    drawPlayer(ctx, this.p1, this.elapsedTime);
    if (this.p2) {
      drawPlayer(ctx, this.p2, this.elapsedTime);
    }

    for (const pr of this.projectiles) {
      drawProjectile(ctx, pr);
    }

    drawParticles(ctx, this.particles);
    drawFloatingTexts(ctx, this.floatingTexts);

    ctx.restore();
  }

  private emitHud(): void {
    const activeBoss = this.enemies.find((e) => e.isBoss) ?? null;

    this.onHudUpdate({
      mode: this.mode,
      level: this.currentLevelNum,
      levelName: this.levelConfig.name,
      enemiesRemaining: this.enemies.length + this.spawnQueue.length,
      totalEnemiesInLevel: this.totalEnemiesInLevel,
      totalScore: this.sessionScore,
      sessionCoins: this.sessionCoins,
      totalKills: this.sessionKills,
      p1: {
        hp: Math.max(0, Math.round(this.p1.hp)),
        maxHp: this.p1.maxHp,
        lives: Math.max(0, this.p1.lives),
        maxLives: this.p1.maxLives,
        weapon: this.p1.weapon,
        score: this.p1.score,
        kills: this.p1.kills,
        alive: this.p1.alive,
        invuln: this.p1.invulnTimer > 0,
        skills: {
          triple: Math.ceil(this.p1.tripleShotTimer),
          power: Math.ceil(this.p1.damageBoostTimer),
          speed: Math.ceil(this.p1.speedBoostTimer),
        },
      },
      p2: this.p2
        ? {
            hp: Math.max(0, Math.round(this.p2.hp)),
            maxHp: this.p2.maxHp,
            lives: Math.max(0, this.p2.lives),
            maxLives: this.p2.maxLives,
            weapon: this.p2.weapon,
            score: this.p2.score,
            kills: this.p2.kills,
            alive: this.p2.alive,
            invuln: this.p2.invulnTimer > 0,
            skills: {
              triple: Math.ceil(this.p2.tripleShotTimer),
              power: Math.ceil(this.p2.damageBoostTimer),
              speed: Math.ceil(this.p2.speedBoostTimer),
            },
          }
        : null,
      boss: activeBoss
        ? {
            name: activeBoss.name,
            hp: Math.max(0, Math.round(activeBoss.hp)),
            maxHp: activeBoss.maxHp,
          }
        : null,
      overlay: this.overlay,
      duelWinner: this.duelWinner,
      levelBonusReward: this.levelBonusReward,
    });
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    audio.unlock();
    const blockScrollKeys = [
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Space',
    ];
    if (blockScrollKeys.includes(e.code)) {
      e.preventDefault();
    }

    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (this.overlay === 'NONE' || this.overlay === 'PAUSED') {
        this.togglePause();
      }
      return;
    }

    // Weapon hotkeys for P1 (1, 2, 3 or Q)
    if (e.code === 'Digit1') this.switchPlayerWeapon(1, 'pistol');
    if (e.code === 'Digit2') this.switchPlayerWeapon(1, 'rifle');
    if (e.code === 'Digit3') this.switchPlayerWeapon(1, 'laser');
    if (e.code === 'KeyQ') {
      const order: WeaponId[] = ['pistol', 'rifle', 'laser'];
      const avail = this.mode === 'duel' ? order : order.filter((w) => this.saveData.ownedWeapons.includes(w));
      const next = avail[(avail.indexOf(this.p1.weapon) + 1) % avail.length];
      this.switchPlayerWeapon(1, next);
    }

    // Weapon cycle for P2 (Slash / Period / ShiftRight)
    if (this.p2 && (e.code === 'Period' || e.code === 'Slash')) {
      const order: WeaponId[] = ['pistol', 'rifle', 'laser'];
      const avail = this.mode === 'duel' ? order : order.filter((w) => this.saveData.ownedWeapons.includes(w));
      const next = avail[(avail.indexOf(this.p2.weapon) + 1) % avail.length];
      this.switchPlayerWeapon(2, next);
    }

    this.keys.add(e.code);
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private handleMouseMove = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    this.mousePos = {
      x: ((e.clientX - rect.left) / rect.width) * ARENA_WIDTH,
      y: ((e.clientY - rect.top) / rect.height) * ARENA_HEIGHT,
    };
  };

  private handleMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0) return;
    audio.unlock();
    this.handleMouseMove(e);
    this.mouseDown = true;
  };

  private handleMouseUp = (): void => {
    this.mouseDown = false;
  };

  private handleBlur = (): void => {
    this.keys.clear();
    this.mouseDown = false;
  };

  private bindInputListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
  }

  private unbindInputListeners(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
  }
}
