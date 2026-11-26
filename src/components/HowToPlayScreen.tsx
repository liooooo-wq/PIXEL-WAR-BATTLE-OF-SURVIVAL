import React from 'react';
import { ArrowLeft, Award, Crosshair, Gamepad2, Heart, ShieldAlert, Users } from 'lucide-react';
import { audio } from '../game/audio';

interface HowToPlayScreenProps {
  onBack: () => void;
}

export const HowToPlayScreen: React.FC<HowToPlayScreenProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <h2 className="font-arcade text-lg sm:text-2xl text-white">CARA BERMAIN</h2>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Single Player */}
          <div className="bg-[#131924] border-2 border-slate-700 p-5 pixel-frame space-y-3">
            <div className="flex items-center gap-2.5 text-sky-400">
              <Gamepad2 className="w-5 h-5" />
              <h3 className="font-arcade text-xs">SINGLE PLAYER (1P)</h3>
            </div>
            <ul className="text-sm text-slate-300 space-y-2 leading-relaxed">
              <li><strong className="text-white">Bergerak:</strong> Tombol <span className="font-mono-num text-amber-300">W A S D</span> atau <span className="font-mono-num text-amber-300">Panah</span> (atau D-Pad di layar HP).</li>
              <li><strong className="text-white">Menembak:</strong> Tekan <span className="font-mono-num text-amber-300">F</span>, <span className="font-mono-num text-amber-300">Spasi</span>, atau <span className="font-mono-num text-amber-300">Klik Kiri Mouse</span> untuk membidik langsung ke kursor.</li>
              <li><strong className="text-white">Ganti Senjata:</strong> Tombol <span className="font-mono-num text-amber-300">1, 2, 3</span> atau <span className="font-mono-num text-amber-300">Q</span>.</li>
              <li><strong className="text-white">Pause:</strong> Tekan <span className="font-mono-num text-amber-300">P</span> atau <span className="font-mono-num text-amber-300">ESC</span>.</li>
            </ul>
          </div>

          {/* Two Player */}
          <div className="bg-[#131924] border-2 border-slate-700 p-5 pixel-frame space-y-3">
            <div className="flex items-center gap-2.5 text-emerald-400">
              <Users className="w-5 h-5" />
              <h3 className="font-arcade text-xs">TWO PLAYER (2P LOKAL)</h3>
            </div>
            <ul className="text-sm text-slate-300 space-y-2 leading-relaxed">
              <li><strong className="text-blue-400">Player 1:</strong> Gerak <span className="font-mono-num text-white">W A S D</span>, Menyerang <span className="font-mono-num text-amber-300">F</span>, Ganti Senjata <span className="font-mono-num text-sky-300">Q</span>.</li>
              <li><strong className="text-amber-400">Player 2:</strong> Gerak <span className="font-mono-num text-white">Tombol Panah</span>, Menyerang <span className="font-mono-num text-amber-300">L</span>, Ganti Senjata <span className="font-mono-num text-sky-300">. /</span>.</li>
              <li>Tersedia mode <strong className="text-white">2P Co-Op (10 Level)</strong> dan <strong className="text-white">2P Fair Duel (1 vs 1)</strong> dengan kondisi awal seimbang.</li>
            </ul>
          </div>

          {/* HP, Nyawa & Berlindung */}
          <div className="bg-[#131924] border-2 border-slate-700 p-5 pixel-frame space-y-3">
            <div className="flex items-center gap-2.5 text-rose-400">
              <Heart className="w-5 h-5 fill-rose-500" />
              <h3 className="font-arcade text-xs">HP, NYAWA &amp; PERLINDUNGAN</h3>
            </div>
            <ul className="text-sm text-slate-300 space-y-2 leading-relaxed">
              <li>Setiap pemain memulai dengan <strong className="text-white">3 Nyawa</strong> (ikon hati) dan Health Bar penuh.</li>
              <li>Saat HP habis, 1 nyawa berkurang, HP dipulihkan penuh, dan kamu mendapat <strong className="text-sky-300">perisai kebal sementara</strong> (2.6 detik).</li>
              <li>Berlindunglah di balik <strong className="text-white">tembok batu &amp; bangunan</strong>. Peti kayu bisa dihancurkan untuk menjatuhkan Koin, Medkit, atau Skill!</li>
              <li>Musuh yang dikalahkan dapat menjatuhkan <strong className="text-purple-300">Skill Triple Shot (3 Peluru)</strong>, <strong className="text-orange-400">Damage +75%</strong>, dan <strong className="text-sky-300">Speed Up</strong> sementara!</li>
              <li>Hati-hati dengan <strong className="text-rose-400">Barel Merah</strong> — tembak saat musuh berada di dekatnya untuk ledakan besar!</li>
            </ul>
          </div>

          {/* Skor & Boss */}
          <div className="bg-[#131924] border-2 border-slate-700 p-5 pixel-frame space-y-3">
            <div className="flex items-center gap-2.5 text-amber-400">
              <Award className="w-5 h-5" />
              <h3 className="font-arcade text-xs">SISTEM POIN &amp; BOSS</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm font-mono-num text-slate-300">
              <div>Musuh Biasa: <strong className="text-amber-300">+100</strong></div>
              <div>Musuh Kuat/Elit: <strong className="text-sky-300">+200</strong></div>
              <div>Mini Boss (Lv 9): <strong className="text-orange-400">+500</strong></div>
              <div>Final Boss (Lv 10): <strong className="text-rose-400">+1.000</strong></div>
              <div className="col-span-2 pt-1 border-t border-slate-800">
                Menyelesaikan 1 Level: <strong className="text-emerald-400">+300 Poin &amp; Bonus Koin</strong>
              </div>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 pt-1">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Level 5, 8, dan 9 memberikan hadiah +1 Nyawa tambahan saat selesai!</span>
            </p>
          </div>
        </div>

        <div className="bg-[#131924] border-2 border-slate-700 p-5 pixel-frame flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Crosshair className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="text-sm text-slate-200">
              Tips Pro: Kunjungi <strong>SHOP</strong> sebelum menghadapi Level 7–10 untuk membeli <strong>Plasma Laser Gun</strong> dan upgrade armor!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
