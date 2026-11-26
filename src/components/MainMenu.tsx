import React from 'react';
import {
  Crosshair,
  Gamepad2,
  HelpCircle,
  Map,
  Play,
  Settings,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { SaveData } from '../game/types';
import { audio } from '../game/audio';

interface MainMenuProps {
  saveData: SaveData;
  onPlayGame: () => void;
  onSinglePlayer: () => void;
  onTwoPlayer: () => void;
  onLevelSelect: () => void;
  onShop: () => void;
  onHowToPlay: () => void;
  onSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  saveData,
  onPlayGame,
  onSinglePlayer,
  onTwoPlayer,
  onLevelSelect,
  onShop,
  onHowToPlay,
  onSettings,
}) => {
  const handleAction = (fn: () => void) => {
    audio.unlock();
    audio.uiClick();
    fn();
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0b0e14] flex flex-col justify-between">
      {/* Generated Pixel Art Battlefield Backdrop + Scrim */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#141a24] via-[#0e131b] to-[#090b10]">
        <img
          src="/src/assets/images/pixel_war_arena_bg_1795652740368.jpg"
          alt="Pixel War Battlefield Arena"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover opacity-35 pixel-canvas"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0e14]/85 via-[#0b0e14]/65 to-[#0b0e14]" />
      </div>

      {/* Top Subtle Status Strip (Unboxed clean metadata) */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-8 pt-5 pb-3 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5 text-amber-400">
          <Crosshair className="w-5 h-5 shrink-0" />
          <span className="font-arcade text-[11px] sm:text-xs tracking-wider whitespace-nowrap">
            PIXEL WAR ARCADE
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300 font-mono-num">
          <span>
            HIGH SCORE: <strong className="text-amber-400">{saveData.highScore.toLocaleString('id-ID')}</strong>
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>
            KOIN: <strong className="text-yellow-300">{saveData.coins.toLocaleString('id-ID')}</strong>
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>
            LEVEL TERBUKA: <strong className="text-emerald-400">{saveData.unlockedLevel}/10</strong>
          </span>
        </div>
      </header>

      {/* Main Center Arcade Stage */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-8 py-8 flex-1 flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16">
        {/* Left: Title & Arcade Hero Showcase */}
        <div className="w-full lg:w-1/2 text-center lg:text-left space-y-6">
          <div className="space-y-3">
            <p className="font-ui text-xs sm:text-sm font-bold tracking-[0.22em] text-amber-400 uppercase">
              2D Tactical Pixel Combat
            </p>
            <h1 className="font-arcade text-2xl sm:text-4xl xl:text-[42px] leading-tight text-white drop-shadow-[0_4px_0_#000] [text-wrap:balance]">
              PIXEL WAR:
              <span className="block text-amber-400 mt-2">
                BATTLE OF SURVIVAL
              </span>
            </h1>
          </div>

          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Bertahan hidup di 10 arena perang Pixel Art yang semakin menantang. Kalahkan pasukan musuh, kumpulkan koin untuk meningkatkan senjata, dan taklukkan Final Boss!
          </p>

          {/* Animated Pixel Soldiers Preview Strip */}
          <div className="flex items-center justify-center lg:justify-start gap-6 pt-2">
            <div className="flex items-center gap-3 bg-[#141923]/90 border-2 border-slate-700 px-4 py-3 pixel-frame">
              <div className="w-8 h-8 bg-blue-600 border-2 border-blue-300 flex items-center justify-center animate-float-slow">
                <div className="w-4 h-2 bg-sky-300" />
              </div>
              <div className="text-left">
                <div className="font-arcade text-[10px] text-blue-300">PLAYER 1</div>
                <div className="text-xs text-slate-400">WASD + F / Mouse</div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#141923]/90 border-2 border-slate-700 px-4 py-3 pixel-frame">
              <div className="w-8 h-8 bg-amber-600 border-2 border-amber-300 flex items-center justify-center animate-float-slow">
                <div className="w-4 h-2 bg-yellow-200" />
              </div>
              <div className="text-left">
                <div className="font-arcade text-[10px] text-amber-300">PLAYER 2</div>
                <div className="text-xs text-slate-400">Panah + L (Lokal)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Primary Arcade Menu Buttons */}
        <nav
          aria-label="Menu Utama"
          className="w-full max-w-md bg-[#121721]/95 border-2 border-slate-700 p-5 sm:p-6 pixel-frame space-y-3"
        >
          <button
            onClick={() => handleAction(onPlayGame)}
            className="w-full pixel-btn bg-amber-500 hover:bg-amber-400 text-slate-950 font-arcade text-xs sm:text-sm py-4 px-5 border-2 border-amber-200 flex items-center justify-center gap-3 cursor-pointer whitespace-nowrap"
          >
            <Play className="w-5 h-5 fill-slate-950 shrink-0" />
            <span>PLAY GAME</span>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => handleAction(onSinglePlayer)}
              className="pixel-btn bg-[#1e293b] hover:bg-[#29374e] text-white font-arcade text-[10px] sm:text-[11px] py-3.5 px-4 border-2 border-slate-600 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Gamepad2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span>SINGLE PLAYER</span>
            </button>

            <button
              onClick={() => handleAction(onTwoPlayer)}
              className="pixel-btn bg-[#1e293b] hover:bg-[#29374e] text-white font-arcade text-[10px] sm:text-[11px] py-3.5 px-4 border-2 border-slate-600 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Users className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>TWO PLAYER</span>
            </button>
          </div>

          <button
            onClick={() => handleAction(onLevelSelect)}
            className="w-full pixel-btn bg-[#1b2230] hover:bg-[#253042] text-slate-100 font-arcade text-[11px] py-3.5 px-4 border-2 border-slate-600 flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap"
          >
            <Map className="w-4 h-4 text-amber-400 shrink-0" />
            <span>LEVEL SELECT</span>
          </button>

          <button
            onClick={() => handleAction(onShop)}
            className="w-full pixel-btn bg-[#1b2230] hover:bg-[#253042] text-slate-100 font-arcade text-[11px] py-3.5 px-4 border-2 border-slate-600 flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap"
          >
            <ShoppingBag className="w-4 h-4 text-yellow-400 shrink-0" />
            <span>SHOP ({saveData.coins} KOIN)</span>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => handleAction(onHowToPlay)}
              className="pixel-btn bg-[#161c28] hover:bg-[#20293a] text-slate-200 font-arcade text-[10px] py-3 px-4 border-2 border-slate-700 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>HOW TO PLAY</span>
            </button>

            <button
              onClick={() => handleAction(onSettings)}
              className="pixel-btn bg-[#161c28] hover:bg-[#20293a] text-slate-200 font-arcade text-[10px] py-3 px-4 border-2 border-slate-700 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Settings className="w-4 h-4 text-slate-300 shrink-0" />
              <span>SETTINGS</span>
            </button>
          </div>
        </nav>
      </main>

      <footer className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-8 py-4 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>PIXEL WAR: BATTLE OF SURVIVAL · 10 Levels · Local Co-Op &amp; Fair Duel</span>
        <span>Tekan P / ESC saat bermain untuk Pause</span>
      </footer>
    </div>
  );
};
