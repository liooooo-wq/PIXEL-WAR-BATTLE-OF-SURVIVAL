import { SaveData, UpgradeLevels, WeaponId, WeaponSpec } from './types';

const STORAGE_KEY = 'pixel_war_battle_survival_save_v1';

export const WEAPONS: Record<WeaponId, WeaponSpec> = {
  pistol: {
    id: 'pistol',
    name: 'Tactical Pistol',
    description: 'Senjata standar andal dengan kecepatan tembak seimbang.',
    price: 0,
    baseDamage: 24,
    fireCooldown: 0.28,
    projectileSpeed: 540,
    projectileSize: 5,
    color: '#fbbf24',
    glowColor: '#f59e0b',
    pierce: false,
    spread: 0.03,
  },
  rifle: {
    id: 'rifle',
    name: 'Assault Rifle',
    description: 'Tembakan otomatis cepat dengan peluru beruntun berkecepatan tinggi.',
    price: 180,
    baseDamage: 19,
    fireCooldown: 0.13,
    projectileSpeed: 680,
    projectileSize: 5,
    color: '#fde047',
    glowColor: '#eab308',
    pierce: false,
    spread: 0.07,
  },
  laser: {
    id: 'laser',
    name: 'Plasma Laser Gun',
    description: 'Sinar energi berkecepatan super yang menembus musuh dan memberi damage besar.',
    price: 420,
    baseDamage: 48,
    fireCooldown: 0.34,
    projectileSpeed: 880,
    projectileSize: 7,
    color: '#38bdf8',
    glowColor: '#0284c7',
    pierce: true,
    spread: 0.0,
  },
};

export const DEFAULT_SAVE: SaveData = {
  unlockedLevel: 1,
  highestLevelCompleted: 0,
  highScore: 0,
  coins: 0,
  walletBalance: 0,
  ownedWeapons: ['pistol'],
  equippedWeapon: 'pistol',
  upgrades: {
    damage: 1,
    fireRate: 1,
    maxHp: 1,
    speed: 1,
    bonusLives: 0,
  },
  settings: {
    musicVolume: 0.45,
    sfxVolume: 0.7,
    musicEnabled: true,
    sfxEnabled: true,
  },
};

export function loadSaveData(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_SAVE);
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      unlockedLevel: clampInt(parsed.unlockedLevel ?? 1, 1, 10),
      highestLevelCompleted: clampInt(parsed.highestLevelCompleted ?? 0, 0, 10),
      highScore: Math.max(0, Number(parsed.highScore ?? 0)),
      coins: Math.max(0, Number(parsed.coins ?? 0)),
      walletBalance: Math.max(0, Number(parsed.walletBalance ?? 0)),
      ownedWeapons: Array.isArray(parsed.ownedWeapons) && parsed.ownedWeapons.length > 0
        ? (parsed.ownedWeapons.filter((w): w is WeaponId => w === 'pistol' || w === 'rifle' || w === 'laser'))
        : ['pistol'],
      equippedWeapon:
        parsed.equippedWeapon === 'pistol' || parsed.equippedWeapon === 'rifle' || parsed.equippedWeapon === 'laser'
          ? parsed.equippedWeapon
          : 'pistol',
      upgrades: {
        damage: clampInt(parsed.upgrades?.damage ?? 1, 1, 5),
        fireRate: clampInt(parsed.upgrades?.fireRate ?? 1, 1, 5),
        maxHp: clampInt(parsed.upgrades?.maxHp ?? 1, 1, 5),
        speed: clampInt(parsed.upgrades?.speed ?? 1, 1, 5),
        bonusLives: clampInt(parsed.upgrades?.bonusLives ?? 0, 0, 2),
      },
      settings: {
        musicVolume: clampFloat(parsed.settings?.musicVolume ?? 0.45, 0, 1),
        sfxVolume: clampFloat(parsed.settings?.sfxVolume ?? 0.7, 0, 1),
        musicEnabled: parsed.settings?.musicEnabled ?? true,
        sfxEnabled: parsed.settings?.sfxEnabled ?? true,
      },
    };
  } catch {
    return structuredClone(DEFAULT_SAVE);
  }
}

export function saveGameData(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function resetSaveData(): SaveData {
  const fresh = structuredClone(DEFAULT_SAVE);
  saveGameData(fresh);
  return fresh;
}

export function getUpgradeCost(key: keyof UpgradeLevels, currentLevel: number): number {
  if (key === 'bonusLives') {
    return currentLevel === 0 ? 250 : 500;
  }
  const baseCosts: Record<Exclude<keyof UpgradeLevels, 'bonusLives'>, number> = {
    damage: 90,
    fireRate: 95,
    maxHp: 80,
    speed: 75,
  };
  return Math.round(baseCosts[key] * Math.pow(1.65, currentLevel - 1));
}

export function getEffectiveMaxHp(upgrades: UpgradeLevels): number {
  return 100 + (upgrades.maxHp - 1) * 25;
}

export function getEffectiveSpeed(upgrades: UpgradeLevels): number {
  return 185 + (upgrades.speed - 1) * 18;
}

export function getDamageMultiplier(upgrades: UpgradeLevels): number {
  return 1 + (upgrades.damage - 1) * 0.22;
}

export function getFireRateMultiplier(upgrades: UpgradeLevels): number {
  return 1 + (upgrades.fireRate - 1) * 0.14;
}

function clampInt(val: number, min: number, max: number): number {
  const n = Math.floor(Number(val));
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function clampFloat(val: number, min: number, max: number): number {
  const n = Number(val);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}
