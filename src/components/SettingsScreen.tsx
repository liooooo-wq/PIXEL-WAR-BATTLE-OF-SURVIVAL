import React, { useEffect, useState } from 'react';
import { ArrowLeft, Maximize, Minimize, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { audio } from '../game/audio';
import { GameSettings } from '../game/types';

interface SettingsScreenProps {
  settings: GameSettings;
  onUpdateSettings: (next: GameSettings) => void;
  onResetProgress: () => void;
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onResetProgress,
  onBack,
}) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(
    typeof document !== 'undefined' ? Boolean(document.fullscreenElement) : false
  );
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    audio.uiClick();
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen denial inside restricted iframes
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl bg-[#131924] border-2 border-slate-700 p-6 sm:p-8 pixel-frame space-y-6">
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <h2 className="font-arcade text-lg sm:text-xl text-white">PENGATURAN GAME</h2>
          <button
            onClick={() => {
              audio.uiClick();
              onBack();
            }}
            className="pixel-btn bg-slate-800 hover:bg-slate-700 text-slate-100 font-arcade text-[10px] px-4 py-2.5 border-2 border-slate-600 flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>MENU UTAMA</span>
          </button>
        </div>

        {/* Music Controls */}
        <div className="bg-[#0e131b] border-2 border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              {settings.musicEnabled ? (
                <Volume2 className="w-5 h-5 text-amber-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-500" />
              )}
              <span className="font-arcade text-xs text-white">MUSIK LATAR</span>
            </div>

            <button
              onClick={() => {
                audio.unlock();
                audio.uiClick();
                onUpdateSettings({ ...settings, musicEnabled: !settings.musicEnabled });
              }}
              className={`pixel-btn font-arcade text-[10px] px-4 py-2 border-2 cursor-pointer whitespace-nowrap ${
                settings.musicEnabled
                  ? 'bg-emerald-500 text-slate-950 border-emerald-200'
                  : 'bg-slate-700 text-slate-300 border-slate-500'
              }`}
            >
              {settings.musicEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.musicVolume * 100)}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  musicVolume: Number(e.target.value) / 100,
                })
              }
              aria-label="Volume Musik"
              className="w-full accent-amber-400 cursor-pointer"
            />
            <span className="font-mono-num text-sm font-bold text-amber-300 w-12 text-right">
              {Math.round(settings.musicVolume * 100)}%
            </span>
          </div>
        </div>

        {/* SFX Controls */}
        <div className="bg-[#0e131b] border-2 border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              {settings.sfxEnabled ? (
                <Volume2 className="w-5 h-5 text-sky-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-500" />
              )}
              <span className="font-arcade text-xs text-white">EFEK SUARA (SFX)</span>
            </div>

            <button
              onClick={() => {
                audio.unlock();
                const next = !settings.sfxEnabled;
                onUpdateSettings({ ...settings, sfxEnabled: next });
                if (next) setTimeout(() => audio.uiClick(), 20);
              }}
              className={`pixel-btn font-arcade text-[10px] px-4 py-2 border-2 cursor-pointer whitespace-nowrap ${
                settings.sfxEnabled
                  ? 'bg-emerald-500 text-slate-950 border-emerald-200'
                  : 'bg-slate-700 text-slate-300 border-slate-500'
              }`}
            >
              {settings.sfxEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.sfxVolume * 100)}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  sfxVolume: Number(e.target.value) / 100,
                })
              }
              onMouseUp={() => audio.shootPistol()}
              aria-label="Volume Efek Suara"
              className="w-full accent-sky-400 cursor-pointer"
            />
            <span className="font-mono-num text-sm font-bold text-sky-300 w-12 text-right">
              {Math.round(settings.sfxVolume * 100)}%
            </span>
          </div>
        </div>

        {/* Fullscreen & Reset */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <button
            onClick={toggleFullscreen}
            className="pixel-btn bg-[#1e293b] hover:bg-[#2a3850] text-white font-arcade text-[10px] py-3.5 px-4 border-2 border-slate-600 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            <span>{isFullscreen ? 'KELUAR FULLSCREEN' : 'LAYAR PENUH'}</span>
          </button>

          {!confirmReset ? (
            <button
              onClick={() => {
                audio.uiClick();
                setConfirmReset(true);
              }}
              className="pixel-btn bg-rose-950/70 hover:bg-rose-900 text-rose-200 font-arcade text-[10px] py-3.5 px-4 border-2 border-rose-700 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RESET PROGRES</span>
            </button>
          ) : (
            <button
              onClick={() => {
                audio.explosion();
                onResetProgress();
                setConfirmReset(false);
              }}
              className="pixel-btn bg-rose-600 hover:bg-rose-500 text-white font-arcade text-[10px] py-3.5 px-4 border-2 border-rose-200 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <span>KONFIRMASI RESET!</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
