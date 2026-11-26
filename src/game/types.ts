export type GameMode = 'single' | 'coop' | 'duel';

export type WeaponId = 'pistol' | 'rifle' | 'laser';

export type ScreenState =
  | 'MENU'
  | 'TWO_PLAYER_SELECT'
  | 'LEVEL_SELECT'
  | 'SHOP'
  | 'HOW_TO_PLAY'
  | 'SETTINGS'
  | 'PLAYING'
  | 'RESULT';

export type PlayOverlay = 'NONE' | 'PAUSED' | 'LEVEL_CLEAR' | 'GAME_OVER' | 'YOU_WIN';

export type EnemyType =
  | 'grunt'
  | 'scout'
  | 'rifleman'
  | 'enforcer'
  | 'sniper'
  | 'juggernaut'
  | 'laser_trooper'
  | 'mini_boss'
  | 'final_boss';

export type ObstacleType = 'wall' | 'crate' | 'sandbag' | 'building' | 'barrel';

export interface GameSettings {
  musicVolume: number; // 0 to 1
  sfxVolume: number; // 0 to 1
  musicEnabled: boolean;
  sfxEnabled: boolean;
}

export interface UpgradeLevels {
  damage: number; // 1 to 5
  fireRate: number; // 1 to 5
  maxHp: number; // 1 to 5
  speed: number; // 1 to 5
  bonusLives: number; // 0 to 2 (total starting lives 3 + bonusLives)
}

export interface SaveData {
  unlockedLevel: number; // 1 to 10
  highestLevelCompleted: number; // 0 to 10
  highScore: number;
  coins: number;
  walletBalance: number;
  ownedWeapons: WeaponId[];
  equippedWeapon: WeaponId;
  upgrades: UpgradeLevels;
  settings: GameSettings;
}

export interface WeaponSpec {
  id: WeaponId;
  name: string;
  description: string;
  price: number;
  baseDamage: number;
  fireCooldown: number; // seconds
  projectileSpeed: number;
  projectileSize: number;
  color: string;
  glowColor: string;
  pierce: boolean;
  spread: number;
}

export interface Obstacle {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  type: ObstacleType;
  hp: number;
  maxHp: number;
  destructible: boolean;
  hitFlash: number;
}

export interface PlayerState {
  id: 1 | 2;
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  aimX: number;
  aimY: number;
  hp: number;
  maxHp: number;
  lives: number;
  maxLives: number;
  weapon: WeaponId;
  fireTimer: number;
  invulnTimer: number;
  hitFlash: number;
  walkPhase: number;
  recoilTimer: number;
  victoryBounce: number;
  score: number;
  kills: number;
  coinsCollected: number;
  alive: boolean;
  speedBoostTimer: number;
  damageBoostTimer: number;
  tripleShotTimer: number;
}

export interface EnemyState {
  id: number;
  type: EnemyType;
  name: string;
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  aimX: number;
  aimY: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  fireCooldown: number;
  fireTimer: number;
  points: number;
  coinDrop: number;
  isElite: boolean;
  isBoss: boolean;
  hitFlash: number;
  walkPhase: number;
  aiTimer: number;
  strafeDir: number;
  dashTimer: number;
  dashCooldown: number;
  dashVx: number;
  dashVy: number;
  specialTimer: number;
  shieldFront: boolean;
  summonCount: number;
}

export interface Projectile {
  id: number;
  ownerType: 'player1' | 'player2' | 'enemy';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  glowColor: string;
  weapon: WeaponId | 'enemy_bullet' | 'sniper_bolt' | 'boss_orb' | 'boss_missile';
  pierce: boolean;
  hitIds: number[];
  life: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  gravity?: number;
}

export interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  scale?: number;
}

export type PickupType = 'coin' | 'medkit' | 'life' | 'speed' | 'power' | 'triple';

export interface Pickup {
  id: number;
  type: PickupType;
  x: number;
  y: number;
  value: number;
  life: number;
  bobPhase: number;
}

export interface WaveEntry {
  type: EnemyType;
  count: number;
}

export interface LevelConfig {
  level: number;
  name: string;
  subtitle: string;
  difficultyLabel: string;
  floorColor: string;
  floorAccent: string;
  gridColor: string;
  wallColor: string;
  isBossLevel: boolean;
  bossName?: string;
  rewardLife: boolean;
  clearCoinBonus: number;
  enemySpeedMult: number;
  enemyHpMult: number;
  enemyDamageMult: number;
  aggression: number; // 0.3 to 1.0
  waves: WaveEntry[];
  obstacles: Omit<Obstacle, 'id' | 'hitFlash'>[];
}

export interface HudSnapshot {
  mode: GameMode;
  level: number;
  levelName: string;
  enemiesRemaining: number;
  totalEnemiesInLevel: number;
  totalScore: number;
  sessionCoins: number;
  totalKills: number;
  p1: {
    hp: number;
    maxHp: number;
    lives: number;
    maxLives: number;
    weapon: WeaponId;
    score: number;
    kills: number;
    alive: boolean;
    invuln: boolean;
    skills: {
      triple: number;
      power: number;
      speed: number;
    };
  };
  p2: {
    hp: number;
    maxHp: number;
    lives: number;
    maxLives: number;
    weapon: WeaponId;
    score: number;
    kills: number;
    alive: boolean;
    invuln: boolean;
    skills: {
      triple: number;
      power: number;
      speed: number;
    };
  } | null;
  boss: {
    name: string;
    hp: number;
    maxHp: number;
  } | null;
  overlay: PlayOverlay;
  duelWinner: 1 | 2 | 0 | null;
  levelBonusReward: {
    scoreBonus: number;
    coinBonus: number;
    gotLife: boolean;
  } | null;
}

export interface GameResultSummary {
  won: boolean;
  isCampaignVictory: boolean;
  mode: GameMode;
  levelReached: number;
  highestLevelCompleted: number;
  totalScore: number;
  isNewHighScore: boolean;
  totalKills: number;
  livesRemaining: number;
  coinsEarned: number;
  duelWinner?: 1 | 2 | 0 | null;
  p1Score?: number;
  p2Score?: number;
}
