import React, { useState } from 'react';
import { ArrowLeft, Heart, Lock, Play, Skull, Users } from 'lucide-react';
import { LEVELS } from '../game/levels';
import { GameMode } from '../game/types';
import { audio } from '../game/audio';

interface LevelSelectScreenProps {
  unlockedLevel: number;
  highestCompleted: number;
  onSelectLevel: (level: number, mode: GameMode) => void;
  onBack: () => void;
}

export const LevelSelectScreen: React.FC<LevelSelectScreenProps> = ({
  unlockedLevel,
  highestCompleted,
  onSelectLevel,
  onBack,
}) => {
  const [mode, setMode] = useState<'single' | 'coop'>('single');

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="font-arcade text-lg sm:text-2xl text-white">PILIH LEVEL (1 - 10)</h2>
            <p className="text-sm text-slate-400 mt-1">
              Selesaikan level untuk membuka arena berikutnya. Level yang sudah terbuka dapat dimainkan ulang.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#141a24] border-2 border-slate-700 p-1">
              <button
                onClick={() => {
                  audio.uiClick();
                  setMode('single');
                }}
                className={`px-3 py-2 font-arcade text-[10px] cursor-pointer whitespace-nowrap ${
                  mode === 'single' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
                }`}
              >
                1 PLAYER
              </button>
              <button
                onClick={() => {
                  audio.uiClick();
                  setMode('coop');
                }}
                className={`px-3 py-2 font-arcade text-[10px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  mode === 'coop' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>2P CO-OP</span>
              </button>
            </div>

            <button
              onClick={() => {
                audio.uiClick();
                onBack();
              }}
              className="pixel-btn bg-slate-800 hover:bg-slate-700 text-slate-100 font-arcade text-[10px] px-4 py-2.5 border-2 border-slate-600 flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>MENU</span>
            </button>
          </div>
        </div>

        {/* 10 Levels Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {LEVELS.map((lvl) => {
            const isUnlocked = lvl.level <= unlockedLevel;
            const isCompleted = lvl.level <= highestCompleted;
            const totalEnemies = lvl.waves.reduce((acc, w) => acc + w.count, 0);

            return (
              <div
                key={lvl.level}
                className={`border-2 p-4 flex flex-col justify-between gap-4 pixel-frame transition-colors ${
                  isUnlocked
                    ? lvl.isBossLevel
                      ? 'bg-[#1f1622] border-rose-700/80'
                      : 'bg-[#141a24] border-slate-600'
                    : 'bg-[#0e1218] border-slate-800 opacity-60'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono-num">
                    <span className="font-arcade text-xs text-amber-400">LV {lvl.level}</span>
                    {isCompleted ? (
                      <span className="text-emerald-400 font-bold">SELESAI</span>
                    ) : isUnlocked ? (
                      <span className="text-sky-400 font-bold">TERBUKA</span>
                    ) : (
                      <Lock className="w-4 h-4 text-slate-500" />
                    )}
                  </div>

                  <div
                    className="h-2 w-full border border-black/50"
                    style={{ backgroundColor: lvl.floorColor }}
                  />

                  <h3 className="font-arcade text-xs text-white leading-snug">{lvl.name}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{lvl.subtitle}</p>

                  <div className="text-xs text-slate-400 space-y-1 pt-1 font-mono-num">
                    <div>Tingkat: <span className="text-slate-200">{lvl.difficultyLabel}</span></div>
                    <div>Musuh: <span className="text-slate-200">{totalEnemies} unit</span></div>
                    <div>Bonus Koin: <span className="text-yellow-400">+{lvl.clearCoinBonus}</span></div>
                    {lvl.rewardLife && (
                      <div className="flex items-center gap-1 text-rose-400 font-bold">
                        <Heart className="w-3.5 h-3.5 fill-rose-500" />
                        <span>Reward +1 Nyawa</span>
                      </div>
                    )}
                    {lvl.isBossLevel && (
                      <div className="flex items-center gap-1 text-rose-300 font-bold">
                        <Skull className="w-3.5 h-3.5" />
                        <span>{lvl.bossName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  disabled={!isUnlocked}
                  onClick={() => {
                    audio.uiClick();
                    onSelectLevel(lvl.level, mode);
                  }}
                  className={`w-full py-2.5 px-3 font-arcade text-[10px] border-2 flex items-center justify-center gap-2 whitespace-nowrap ${
                    isUnlocked
                      ? 'pixel-btn bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-200 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                  }`}
                >
                  {isUnlocked ? (
                    <>
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      <span>MAIN</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>TERKUNCI</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
