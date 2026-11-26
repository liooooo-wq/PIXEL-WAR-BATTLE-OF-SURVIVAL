import { ARENA_HEIGHT, ARENA_WIDTH } from './levels';
import {
  EnemyState,
  FloatingText,
  LevelConfig,
  Obstacle,
  Particle,
  Pickup,
  PlayerState,
  Projectile,
} from './types';

function pxRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function drawArenaBackground(
  ctx: CanvasRenderingContext2D,
  level: LevelConfig
): void {
  pxRect(ctx, 0, 0, ARENA_WIDTH, ARENA_HEIGHT, level.floorColor);

  // Pixel tile grid & subtle tactical floor texture
  const tile = 30;
  for (let gx = 0; gx < ARENA_WIDTH; gx += tile) {
    for (let gy = 0; gy < ARENA_HEIGHT; gy += tile) {
      if ((gx / tile + gy / tile) % 2 === 0) {
        pxRect(ctx, gx, gy, tile, tile, level.floorAccent);
      }
      ctx.fillStyle = level.gridColor;
      ctx.fillRect(gx, gy, tile, 1);
      ctx.fillRect(gx, gy, 1, tile);

      // Deterministic pixel speckle for retro ground texture
      if (((gx * 7 + gy * 13) % 11) === 0) {
        pxRect(ctx, gx + 8, gy + 10, 3, 3, level.gridColor);
      }
      if (((gx * 3 + gy * 17) % 13) === 0) {
        pxRect(ctx, gx + 18, gy + 21, 2, 2, level.gridColor);
      }
    }
  }

  // Perimeter border walls
  const bw = 12;
  pxRect(ctx, 0, 0, ARENA_WIDTH, bw, level.wallColor);
  pxRect(ctx, 0, ARENA_HEIGHT - bw, ARENA_WIDTH, bw, level.wallColor);
  pxRect(ctx, 0, 0, bw, ARENA_HEIGHT, level.wallColor);
  pxRect(ctx, ARENA_WIDTH - bw, 0, bw, ARENA_HEIGHT, level.wallColor);

  // Inner dark border outline
  ctx.strokeStyle = '#090b10';
  ctx.lineWidth = 2;
  ctx.strokeRect(bw, bw, ARENA_WIDTH - bw * 2, ARENA_HEIGHT - bw * 2);
}

export function drawObstacle(ctx: CanvasRenderingContext2D, obs: Obstacle, wallColor: string): void {
  const x = Math.round(obs.x);
  const y = Math.round(obs.y);
  const w = Math.round(obs.w);
  const h = Math.round(obs.h);

  // Drop shadow
  pxRect(ctx, x + 3, y + 4, w, h, 'rgba(0,0,0,0.42)');

  if (obs.type === 'crate') {
    pxRect(ctx, x, y, w, h, '#8a5a32');
    pxRect(ctx, x + 2, y + 2, w - 4, h - 4, '#a87040');
    pxRect(ctx, x + 4, y + 4, w - 8, 3, '#c48a54');
    // Cross plank
    pxRect(ctx, x + 5, y + Math.floor(h / 2) - 2, w - 10, 4, '#6b4222');
    pxRect(ctx, x + Math.floor(w / 2) - 2, y + 5, 4, h - 10, '#6b4222');
    // Damage cracks
    if (obs.hp < obs.maxHp * 0.65) {
      pxRect(ctx, x + 7, y + 7, 10, 2, '#3d2410');
      pxRect(ctx, x + 13, y + 9, 2, 9, '#3d2410');
    }
  } else if (obs.type === 'barrel') {
    pxRect(ctx, x + 2, y, w - 4, h, '#991b1b');
    pxRect(ctx, x + 4, y + 2, w - 8, h - 4, '#dc2626');
    pxRect(ctx, x + 2, y + 5, w - 4, 3, '#cbd5e1');
    pxRect(ctx, x + 2, y + h - 8, w - 4, 3, '#cbd5e1');
    // Hazard yellow stripe
    pxRect(ctx, x + 8, y + 10, w - 16, 6, '#facc15');
  } else if (obs.type === 'sandbag') {
    pxRect(ctx, x, y, w, h, '#78684a');
    const bagW = 16;
    const bagH = 10;
    for (let bx = x + 2; bx < x + w - 4; bx += bagW) {
      for (let by = y + 2; by < y + h - 4; by += bagH) {
        pxRect(ctx, bx, by, Math.min(bagW - 2, x + w - bx - 2), Math.min(bagH - 2, y + h - by - 2), '#a8946c');
        pxRect(ctx, bx + 2, by + 2, 6, 2, '#c7b388');
      }
    }
  } else if (obs.type === 'building') {
    pxRect(ctx, x, y, w, h, '#272c35');
    pxRect(ctx, x + 3, y + 3, w - 6, h - 6, '#39414f');
    pxRect(ctx, x + 6, y + 6, w - 12, h - 12, '#4a5568');
    // Rooftop details / vents
    pxRect(ctx, x + 12, y + 12, 16, 12, '#1f252e');
    pxRect(ctx, x + 14, y + 14, 12, 2, '#64748b');
    pxRect(ctx, x + 14, y + 18, 12, 2, '#64748b');
    if (w >= 70 && h >= 70) {
      pxRect(ctx, x + w - 26, y + h - 24, 14, 12, '#1e293b');
      pxRect(ctx, x + w - 24, y + h - 22, 10, 8, '#38bdf8');
    }
  } else {
    // Solid tactical wall
    pxRect(ctx, x, y, w, h, '#1e242c');
    pxRect(ctx, x + 2, y + 2, w - 4, h - 4, wallColor);
    pxRect(ctx, x + 3, y + 3, w - 6, 4, 'rgba(255,255,255,0.2)');
    // Brick seams
    for (let bx = x + 14; bx < x + w - 4; bx += 16) {
      pxRect(ctx, bx, y + 2, 2, h - 4, 'rgba(0,0,0,0.28)');
    }
  }

  if (obs.hitFlash > 0) {
    pxRect(ctx, x, y, w, h, 'rgba(255,255,255,0.45)');
  }
}

export function drawPickup(ctx: CanvasRenderingContext2D, p: Pickup): void {
  const bob = Math.sin(p.bobPhase) * 3;
  const x = Math.round(p.x);
  const y = Math.round(p.y + bob);

  // Subtle shadow
  pxRect(ctx, x - 7, p.y + 8, 14, 4, 'rgba(0,0,0,0.4)');

  if (p.type === 'coin') {
    const squeeze = Math.abs(Math.cos(p.bobPhase * 1.4));
    const w = Math.max(4, Math.round(12 * squeeze));
    pxRect(ctx, x - w / 2 - 1, y - 7, w + 2, 14, '#92400e');
    pxRect(ctx, x - w / 2, y - 6, w, 12, '#facc15');
    if (w >= 6) {
      pxRect(ctx, x - 1, y - 3, 2, 6, '#fef08a');
    }
  } else if (p.type === 'medkit') {
    pxRect(ctx, x - 9, y - 8, 18, 16, '#1e293b');
    pxRect(ctx, x - 8, y - 7, 16, 14, '#f8fafc');
    pxRect(ctx, x - 2, y - 5, 4, 10, '#ef4444');
    pxRect(ctx, x - 5, y - 2, 10, 4, '#ef4444');
  } else if (p.type === 'life') {
    // Pixel Heart
    const pts = [
      [-6, -4, 4, 4],
      [2, -4, 4, 4],
      [-8, -2, 16, 4],
      [-6, 2, 12, 3],
      [-4, 5, 8, 2],
      [-2, 7, 4, 2],
    ];
    ctx.fillStyle = '#991b1b';
    pts.forEach(([ox, oy, pw, ph]) => ctx.fillRect(x + ox - 1, y + oy - 1, pw + 2, ph + 2));
    ctx.fillStyle = '#f43f5e';
    pts.forEach(([ox, oy, pw, ph]) => ctx.fillRect(x + ox, y + oy, pw, ph));
    pxRect(ctx, x - 5, y - 3, 2, 2, '#fecdd3');
  } else if (p.type === 'speed') {
    pxRect(ctx, x - 8, y - 8, 16, 16, '#0369a1');
    pxRect(ctx, x - 6, y - 6, 12, 12, '#38bdf8');
    pxRect(ctx, x - 1, y - 4, 4, 4, '#fef08a');
    pxRect(ctx, x - 3, y, 4, 4, '#fef08a');
  } else if (p.type === 'power') {
    pxRect(ctx, x - 9, y - 9, 18, 18, '#9a3412');
    pxRect(ctx, x - 7, y - 7, 14, 14, '#f97316');
    pxRect(ctx, x - 2, y - 5, 4, 10, '#fef08a');
    pxRect(ctx, x - 5, y - 2, 10, 4, '#fef08a');
  } else if (p.type === 'triple') {
    // Triple Shot Skill Orb (3 pixel bullets inside violet crate)
    pxRect(ctx, x - 9, y - 9, 18, 18, '#581c87');
    pxRect(ctx, x - 7, y - 7, 14, 14, '#a855f7');
    pxRect(ctx, x - 5, y - 4, 3, 8, '#fde047');
    pxRect(ctx, x - 1, y - 5, 3, 10, '#fef08a');
    pxRect(ctx, x + 3, y - 4, 3, 8, '#fde047');
  }
}

export function drawPlayer(ctx: CanvasRenderingContext2D, p: PlayerState, time: number): void {
  if (!p.alive) return;

  // Invulnerability blink
  if (p.invulnTimer > 0 && Math.floor(time * 16) % 2 === 0) {
    // Draw translucent shield ring even on blink-off frame
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(Math.round(p.x - 18), Math.round(p.y - 20), 36, 40);
    return;
  }

  const x = Math.round(p.x);
  const y = Math.round(p.y + (p.victoryBounce > 0 ? -Math.abs(Math.sin(time * 12)) * 8 : 0));

  // Shadow
  pxRect(ctx, x - 10, Math.round(p.y) + 11, 20, 5, 'rgba(0,0,0,0.45)');

  // Invuln aura
  if (p.invulnTimer > 0) {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 17, y - 19, 34, 38);
  }

  // Damage boost aura
  if (p.damageBoostTimer > 0) {
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 16, y - 18, 32, 36);
  }

  // Triple shot aura
  if (p.tripleShotTimer > 0) {
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 19, y - 21, 38, 42);
  }

  const isP1 = p.id === 1;
  const helmetDark = isP1 ? '#1e3a8a' : '#7c2d12';
  const helmetLight = isP1 ? '#3b82f6' : '#f59e0b';
  const suitColor = isP1 ? '#1d4ed8' : '#b45309';
  const suitDark = isP1 ? '#1e293b' : '#451a03';
  const visorColor = isP1 ? '#38bdf8' : '#fde047';

  const facingLeft = p.aimX < -0.15;
  const legOffset = Math.sin(p.walkPhase) * 3;

  // Legs (walking cycle)
  pxRect(ctx, x - 7, y + 6 + legOffset, 5, 7, suitDark);
  pxRect(ctx, x + 2, y + 6 - legOffset, 5, 7, suitDark);

  // Boots
  pxRect(ctx, x - 8, y + 11 + legOffset, 6, 3, '#0f172a');
  pxRect(ctx, x + 2, y + 11 - legOffset, 6, 3, '#0f172a');

  // Torso / Tactical Vest
  pxRect(ctx, x - 9, y - 5, 18, 12, suitColor);
  pxRect(ctx, x - 6, y - 3, 12, 8, suitDark);
  pxRect(ctx, x - 3, y - 1, 6, 4, helmetLight);

  // Head & Pixel Helmet
  pxRect(ctx, x - 8, y - 16, 16, 12, helmetDark);
  pxRect(ctx, x - 7, y - 15, 14, 7, helmetLight);
  // Face / Tactical Visor
  pxRect(ctx, x - 5, y - 9, 10, 5, '#fed7aa');
  const visorX = facingLeft ? x - 6 : x - 2;
  pxRect(ctx, visorX, y - 9, 8, 3, visorColor);

  // Weapon rendered rotating along aim vector
  const angle = Math.atan2(p.aimY, p.aimX);
  const recoil = p.recoilTimer > 0 ? -3 : 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  if (p.weapon === 'pistol') {
    pxRect(ctx, 8 + recoil, -2, 10, 4, '#475569');
    pxRect(ctx, 8 + recoil, 1, 4, 4, '#1e293b');
  } else if (p.weapon === 'rifle') {
    pxRect(ctx, 6 + recoil, -3, 18, 5, '#334155');
    pxRect(ctx, 12 + recoil, -4, 8, 2, '#94a3b8');
    pxRect(ctx, 6 + recoil, 1, 5, 4, '#78350f');
  } else {
    // Plasma Laser Gun
    pxRect(ctx, 6 + recoil, -4, 18, 7, '#0f172a');
    pxRect(ctx, 9 + recoil, -2, 12, 3, '#38bdf8');
    pxRect(ctx, 21 + recoil, -3, 4, 5, '#7dd3fc');
  }

  // Muzzle flash
  if (p.recoilTimer > 0.05) {
    const flashColor = p.weapon === 'laser' ? '#38bdf8' : '#fef08a';
    pxRect(ctx, 24 + recoil, -4, 7, 8, flashColor);
  }
  ctx.restore();

  // Hit flash overlay
  if (p.hitFlash > 0) {
    pxRect(ctx, x - 9, y - 16, 18, 29, 'rgba(255,255,255,0.65)');
  }

  // Player tag above head (P1 / P2)
  ctx.font = 'bold 9px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = isP1 ? '#60a5fa' : '#fbbf24';
  ctx.fillText(isP1 ? 'P1' : 'P2', x, y - 21);
}

export function drawEnemy(ctx: CanvasRenderingContext2D, e: EnemyState, time: number): void {
  const x = Math.round(e.x);
  const y = Math.round(e.y);

  // Shadow
  pxRect(ctx, x - e.radius * 0.75, y + e.radius * 0.72, e.radius * 1.5, 6, 'rgba(0,0,0,0.45)');

  const leg = Math.sin(e.walkPhase) * (e.isBoss ? 4 : 3);
  const facingLeft = e.aimX < 0;

  if (e.type === 'mini_boss') {
    // IRON GOLIATH MECH (Large Pixel Boss)
    pxRect(ctx, x - 20, y + 14 + leg, 13, 14, '#334155');
    pxRect(ctx, x + 7, y + 14 - leg, 13, 14, '#334155');
    // Armored Body
    pxRect(ctx, x - 26, y - 20, 52, 38, '#475569');
    pxRect(ctx, x - 22, y - 16, 44, 30, '#64748b');
    // Shoulder cannons
    pxRect(ctx, x - 32, y - 14, 10, 20, '#1e293b');
    pxRect(ctx, x + 22, y - 14, 10, 20, '#1e293b');
    // Glowing red core & visor
    pxRect(ctx, x - 12, y - 28, 24, 12, '#334155');
    pxRect(ctx, x - 8, y - 24, 16, 5, '#ef4444');
    pxRect(ctx, x - 6, y - 2, 12, 10, '#f97316');
    if (Math.floor(time * 8) % 2 === 0) {
      pxRect(ctx, x - 3, y + 1, 6, 4, '#fef08a');
    }
  } else if (e.type === 'final_boss') {
    // OVERLORD VEX (Massive Dark Purple/Crimson Boss)
    pxRect(ctx, x - 24, y + 16 + leg, 15, 16, '#3b0764');
    pxRect(ctx, x + 9, y + 16 - leg, 15, 16, '#3b0764');
    // Spiked Shoulders
    pxRect(ctx, x - 36, y - 24, 14, 24, '#581c87');
    pxRect(ctx, x + 22, y - 24, 14, 24, '#581c87');
    pxRect(ctx, x - 38, y - 28, 6, 8, '#f43f5e');
    pxRect(ctx, x + 32, y - 28, 6, 8, '#f43f5e');
    // Core Chassis
    pxRect(ctx, x - 28, y - 22, 56, 42, '#4c1d95');
    pxRect(ctx, x - 22, y - 16, 44, 30, '#6b21a8');
    // Crown / Horned Helmet
    pxRect(ctx, x - 14, y - 34, 28, 14, '#1e1b4b');
    pxRect(ctx, x - 16, y - 38, 5, 8, '#facc15');
    pxRect(ctx, x + 11, y - 38, 5, 8, '#facc15');
    // Glowing eyes
    pxRect(ctx, x - 9, y - 28, 6, 4, '#f43f5e');
    pxRect(ctx, x + 3, y - 28, 6, 4, '#f43f5e');
    // Plasma Reactor Chest
    pxRect(ctx, x - 8, y - 4, 16, 14, '#0f172a');
    pxRect(ctx, x - 5, y - 1, 10, 8, Math.floor(time * 10) % 2 === 0 ? '#ec4899' : '#38bdf8');
  } else {
    // Standard & Elite Enemy Soldiers
    const palette: Record<string, { body: string; helmet: string; eye: string }> = {
      grunt: { body: '#65a30d', helmet: '#3f6212', eye: '#ef4444' },
      scout: { body: '#ea580c', helmet: '#9a3412', eye: '#fde047' },
      rifleman: { body: '#dc2626', helmet: '#7f1d1d', eye: '#fef08a' },
      enforcer: { body: '#7c3aed', helmet: '#4c1d95', eye: '#38bdf8' },
      sniper: { body: '#0d9488', helmet: '#134e4a', eye: '#f43f5e' },
      juggernaut: { body: '#475569', helmet: '#1e293b', eye: '#f97316' },
      laser_trooper: { body: '#0284c7', helmet: '#0c4a6e', eye: '#7dd3fc' },
    };
    const pal = palette[e.type] ?? palette.grunt;
    const sizeScale = e.type === 'juggernaut' ? 1.25 : e.type === 'enforcer' ? 1.1 : 1.0;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sizeScale, sizeScale);

    // Legs
    pxRect(ctx, -6, 6 + leg, 4, 6, '#1e293b');
    pxRect(ctx, 2, 6 - leg, 4, 6, '#1e293b');

    // Torso
    pxRect(ctx, -8, -5, 16, 12, pal.body);
    pxRect(ctx, -5, -3, 10, 7, '#0f172a');

    // Head
    pxRect(ctx, -7, -15, 14, 11, pal.helmet);
    pxRect(ctx, facingLeft ? -6 : -1, -9, 7, 3, pal.eye);

    // Gun arm
    const angle = Math.atan2(e.aimY, e.aimX);
    ctx.save();
    ctx.rotate(angle);
    pxRect(ctx, 6, -2, e.type === 'sniper' ? 18 : 12, 4, '#334155');
    if (e.shieldFront) {
      // Riot Shield in front of Juggernaut
      pxRect(ctx, 11, -12, 5, 24, '#94a3b8');
      pxRect(ctx, 12, -9, 3, 18, '#38bdf8');
    }
    ctx.restore();

    ctx.restore();
  }

  // Hit flash
  if (e.hitFlash > 0) {
    pxRect(ctx, x - e.radius, y - e.radius, e.radius * 2, e.radius * 2, 'rgba(255,255,255,0.55)');
  }

  // Mini HP bar above damaged non-boss enemies
  if (!e.isBoss && e.hp < e.maxHp) {
    const bw = Math.max(24, e.radius * 1.8);
    const bx = x - bw / 2;
    const by = y - e.radius - 10;
    pxRect(ctx, bx - 1, by - 1, bw + 2, 5, '#090b10');
    const ratio = Math.max(0, e.hp / e.maxHp);
    pxRect(ctx, bx, by, bw * ratio, 3, ratio > 0.4 ? '#ef4444' : '#facc15');
  }
}

export function drawProjectile(ctx: CanvasRenderingContext2D, pr: Projectile): void {
  const x = Math.round(pr.x);
  const y = Math.round(pr.y);

  if (pr.weapon === 'laser' || pr.weapon === 'sniper_bolt') {
    const angle = Math.atan2(pr.vy, pr.vx);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    pxRect(ctx, -10, -3, 20, 6, pr.glowColor);
    pxRect(ctx, -8, -1.5, 16, 3, '#ffffff');
    ctx.restore();
  } else if (pr.weapon === 'boss_missile') {
    const angle = Math.atan2(pr.vy, pr.vx);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    pxRect(ctx, -8, -4, 14, 8, '#dc2626');
    pxRect(ctx, 2, -3, 5, 6, '#facc15');
    pxRect(ctx, -11, -2, 4, 4, '#f97316');
    ctx.restore();
  } else {
    pxRect(ctx, x - pr.radius - 1, y - pr.radius - 1, pr.radius * 2 + 2, pr.radius * 2 + 2, pr.glowColor);
    pxRect(ctx, x - pr.radius, y - pr.radius, pr.radius * 2, pr.radius * 2, pr.color);
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  for (const pt of particles) {
    const alpha = Math.max(0, pt.life / pt.maxLife);
    ctx.globalAlpha = alpha;
    pxRect(ctx, pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size, pt.color);
  }
  ctx.globalAlpha = 1;
}

export function drawFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[]): void {
  ctx.textAlign = 'center';
  for (const ft of texts) {
    const alpha = Math.min(1, (ft.life / ft.maxLife) * 1.4);
    ctx.globalAlpha = alpha;
    const size = Math.round(10 * (ft.scale ?? 1));
    ctx.font = `bold ${size}px "Press Start 2P", monospace`;
    ctx.fillStyle = '#090b10';
    ctx.fillText(ft.text, Math.round(ft.x) + 1, Math.round(ft.y) + 1);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, Math.round(ft.x), Math.round(ft.y));
  }
  ctx.globalAlpha = 1;
}
