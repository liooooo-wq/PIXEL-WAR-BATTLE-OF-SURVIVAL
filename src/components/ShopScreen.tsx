import React from 'react';
import {
  ArrowLeft,
  Check,
  Coins,
  Crosshair,
  Heart,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';
import { audio } from '../game/audio';
import {
  getDamageMultiplier,
  getEffectiveMaxHp,
  getEffectiveSpeed,
  getFireRateMultiplier,
  getUpgradeCost,
  WEAPONS,
} from '../game/storage';
import { SaveData, UpgradeLevels, WeaponId } from '../game/types';

interface ShopScreenProps {
  saveData: SaveData;
  onBuyOrEquipWeapon: (weaponId: WeaponId) => void;
  onUpgradeStat: (key: keyof UpgradeLevels) => void;
  onBack: () => void;
}

export const ShopScreen: React.FC<ShopScreenProps> = ({
  saveData,
  onBuyOrEquipWeapon,
  onUpgradeStat,
  onBack,
}) => {
  const weaponOrder: WeaponId[] = ['pistol', 'rifle', 'laser'];

  const upgradeCards: {
    key: keyof UpgradeLevels;
    title: string;
    desc: string;
    maxLv: number;
    currentStat: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'damage',
      title: 'Weapon Damage',
      desc: 'Tingkatkan kekuatan serangan semua senjata (+22% per level).',
      maxLv: 5,
      currentStat: `${Math.round(getDamageMultiplier(saveData.upgrades) * 100)}% DMG`,
      icon: <Crosshair className="w-5 h-5 text-rose-400" />,
    },
    {
      key: 'fireRate',
      title: 'Fire Rate',
      desc: 'Tembak peluru lebih cepat (+14% kecepatan serangan per level).',
      maxLv: 5,
      currentStat: `${Math.round(getFireRateMultiplier(saveData.upgrades) * 100)}% SPD`,
      icon: <Zap className="w-5 h-5 text-amber-400" />,
    },
    {
      key: 'maxHp',
      title: 'Armor & Max HP',
      desc: 'Perkuat ketahanan prajurit (+25 Max HP per level).',
      maxLv: 5,
      currentStat: `${getEffectiveMaxHp(saveData.upgrades)} HP`,
      icon: <Shield className="w-5 h-5 text-emerald-400" />,
    },
    {
      key: 'speed',
      title: 'Combat Boots',
      desc: 'Tingkatkan kelincahan bergerak dan menghindar serangan musuh.',
      maxLv: 5,
      currentStat: `${getEffectiveSpeed(saveData.upgrades)} VEL`,
      icon: <Sparkles className="w-5 h-5 text-sky-400" />,
    },
    {
      key: 'bonusLives',
      title: 'Extra Life Pack',
      desc: 'Tambah nyawa awal setiap permainan dimulai (maksimal 5 nyawa).',
      maxLv: 2,
      currentStat: `${3 + saveData.upgrades.bonusLives} Nyawa Awal`,
      icon: <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="font-arcade text-lg sm:text-2xl text-white">ARMORY &amp; SHOP</h2>
            <p className="text-sm text-slate-400 mt-1">
              Gunakan koin hasil pertempuran untuk membeli senjata baru dan meningkatkan kemampuan prajurit.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-[#161d29] border-2 border-yellow-600/80 px-4 py-2 flex items-center gap-2 font-mono-num">
              <Coins className="w-5 h-5 text-yellow-400" />
              <span className="font-bold text-yellow-300 text-base">
                {saveData.coins.toLocaleString('id-ID')} KOIN
              </span>
            </div>

            <button
              onClick={() => {
                audio.uiClick();
                onBack();
              }}
              className="pixel-btn bg-slate-800 hover:bg-slate-700 text-slate-100 font-arcade text-[10px] px-4 py-2.5 border-2 border-slate-600 flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>KEMBALI</span>
            </button>
          </div>
        </div>

        {/* Weapons Section */}
        <section className="space-y-4">
          <h3 className="font-arcade text-sm text-amber-400">1. SENJATA TEMPUR</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {weaponOrder.map((wid) => {
              const w = WEAPONS[wid];
              const owned = saveData.ownedWeapons.includes(wid);
              const equipped = saveData.equippedWeapon === wid;
              const canAfford = saveData.coins >= w.price;

              return (
                <div
                  key={wid}
                  className={`border-2 p-5 flex flex-col justify-between gap-5 pixel-frame ${
                    equipped
                      ? 'bg-[#1a2232] border-amber-400'
                      : 'bg-[#131924] border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-arcade text-xs text-white">{w.name}</span>
                      {equipped && (
                        <span className="font-arcade text-[9px] text-amber-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> DIPAKAI
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-300 leading-relaxed">{w.description}</p>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-mono-num text-slate-300 bg-[#0d1118] border border-slate-800 p-3">
                      <div>Damage: <strong className="text-rose-400">{w.baseDamage}</strong></div>
                      <div>Cooldown: <strong className="text-sky-400">{w.fireCooldown}s</strong></div>
                      <div>Kecepatan: <strong className="text-amber-300">{w.projectileSpeed}</strong></div>
                      <div>Tembus: <strong className="text-emerald-400">{w.pierce ? 'YA' : 'TIDAK'}</strong></div>
                    </div>
                  </div>

                  {owned ? (
                    <button
                      disabled={equipped}
                      onClick={() => onBuyOrEquipWeapon(wid)}
                      className={`w-full py-3 px-4 font-arcade text-[10px] border-2 whitespace-nowrap ${
                        equipped
                          ? 'bg-emerald-900/50 text-emerald-300 border-emerald-700 cursor-default'
                          : 'pixel-btn bg-sky-500 hover:bg-sky-400 text-slate-950 border-sky-200 cursor-pointer'
                      }`}
                    >
                      {equipped ? 'SEDANG DIGUNAKAN' : 'PAKAI SENJATA'}
                    </button>
                  ) : (
                    <button
                      disabled={!canAfford}
                      onClick={() => onBuyOrEquipWeapon(wid)}
                      className={`w-full py-3 px-4 font-arcade text-[10px] border-2 flex items-center justify-center gap-2 whitespace-nowrap ${
                        canAfford
                          ? 'pixel-btn bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-200 cursor-pointer'
                          : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                      }`}
                    >
                      <Coins className="w-4 h-4" />
                      <span>BELI ({w.price} KOIN)</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Character Upgrades Section */}
        <section className="space-y-4">
          <h3 className="font-arcade text-sm text-sky-400">2. UPGRADE KEMAMPUAN PRAJURIT</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {upgradeCards.map((u) => {
              const currentLv = saveData.upgrades[u.key];
              const isMax = currentLv >= u.maxLv;
              const cost = isMax ? 0 : getUpgradeCost(u.key, currentLv);
              const canAfford = !isMax && saveData.coins >= cost;

              return (
                <div
                  key={u.key}
                  className="bg-[#131924] border-2 border-slate-700 p-5 flex flex-col justify-between gap-4 pixel-frame"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        {u.icon}
                        <span className="font-arcade text-xs text-white">{u.title}</span>
                      </div>
                      <span className="font-mono-num text-xs font-bold text-amber-400">
                        {u.currentStat}
                      </span>
                    </div>

                    <p className="text-sm text-slate-300 leading-relaxed">{u.desc}</p>

                    {/* Level Pips */}
                    <div className="flex items-center gap-1.5 pt-1">
                      {Array.from({ length: u.maxLv }).map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-2.5 flex-1 border border-black/60 ${
                            idx < currentLv ? 'bg-amber-400' : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    disabled={isMax || !canAfford}
                    onClick={() => onUpgradeStat(u.key)}
                    className={`w-full py-3 px-4 font-arcade text-[10px] border-2 flex items-center justify-center gap-2 whitespace-nowrap ${
                      isMax
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800 cursor-default'
                        : canAfford
                        ? 'pixel-btn bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-200 cursor-pointer'
                        : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    {isMax ? (
                      <span>LEVEL MAKSIMAL</span>
                    ) : (
                      <>
                        <Coins className="w-4 h-4" />
                        <span>UPGRADE ({cost} KOIN)</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
