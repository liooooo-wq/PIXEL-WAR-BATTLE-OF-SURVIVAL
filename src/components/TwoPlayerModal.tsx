import React from 'react';
import { ArrowLeft, Shield, Swords, Users } from 'lucide-react';
import { audio } from '../game/audio';

interface TwoPlayerModalProps {
  unlockedLevel: number;
  onStartCoop: (level: number) => void;
  onStartDuel: () => void;
  onBack: () => void;
}

export const TwoPlayerModal: React.FC<TwoPlayerModalProps> = ({
  unlockedLevel,
  onStartCoop,
  onStartDuel,
  onBack,
}) => {
  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-3xl bg-[#131924] border-2 border-slate-700 p-6 sm:p-8 pixel-frame space-y-6">
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-emerald-400 shrink-0" />
            <h2 className="font-arcade text-base sm:text-xl text-white">MODE TWO PLAYER</h2>
          </div>
          <button
            onClick={() => {
              audio.uiClick();
              onBack();
            }}
            className="pixel-btn bg-slate-800 hover:bg-slate-700 text-slate-200 font-arcade text-[10px] px-4 py-2.5 border-2 border-slate-600 flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>KEMBALI</span>
          </button>
        </div>

        {/* Fair Controls Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#0e131b] border-2 border-blue-900/80 p-4 space-y-2">
            <div className="font-arcade text-xs text-blue-400">PLAYER 1 (BIRU)</div>
            <div className="text-sm text-slate-300 space-y-1">
              <div>Gerak: <span className="font-mono-num font-bold text-white">W, A, S, D</span></div>
              <div>Menyerang: <span className="font-mono-num font-bold text-amber-400">F</span></div>
              <div>Ganti Senjata: <span className="font-mono-num font-bold text-sky-300">Q / 1-3</span></div>
            </div>
          </div>

          <div className="bg-[#0e131b] border-2 border-amber-900/80 p-4 space-y-2">
            <div className="font-arcade text-xs text-amber-400">PLAYER 2 (EMAS)</div>
            <div className="text-sm text-slate-300 space-y-1">
              <div>Gerak: <span className="font-mono-num font-bold text-white">Tombol Panah</span></div>
              <div>Menyerang: <span className="font-mono-num font-bold text-amber-400">L</span></div>
              <div>Ganti Senjata: <span className="font-mono-num font-bold text-sky-300">. atau /</span></div>
            </div>
          </div>
        </div>

        {/* Two Fair Match Formats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          <div className="bg-[#18202e] border-2 border-emerald-700/70 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <Shield className="w-5 h-5 shrink-0" />
                <h3 className="font-arcade text-xs">2P CO-OP SURVIVAL</h3>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Bekerja sama dalam 1 arena melawan 10 level pasukan musuh &amp; Boss! Masing-masing memiliki Health Bar, 3 nyawa, dan penghitung skor adil.
              </p>
            </div>
            <button
              onClick={() => {
                audio.uiClick();
                onStartCoop(unlockedLevel);
              }}
              className="w-full pixel-btn bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-arcade text-[11px] py-3.5 px-4 border-2 border-emerald-200 cursor-pointer whitespace-nowrap"
            >
              MULAI 2P CO-OP (LV {unlockedLevel})
            </button>
          </div>

          <div className="bg-[#18202e] border-2 border-rose-700/70 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-rose-400">
                <Swords className="w-5 h-5 shrink-0" />
                <h3 className="font-arcade text-xs">2P FAIR DUEL (1 VS 1)</h3>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Pertandingan adil antar 2 pemain! HP identik (120), 3 nyawa, spawn simetris, akses senjata seimbang, dan pickup di tengah arena.
              </p>
            </div>
            <button
              onClick={() => {
                audio.uiClick();
                onStartDuel();
              }}
              className="w-full pixel-btn bg-rose-500 hover:bg-rose-400 text-white font-arcade text-[11px] py-3.5 px-4 border-2 border-rose-200 cursor-pointer whitespace-nowrap"
            >
              MULAI 2P VS DUEL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
