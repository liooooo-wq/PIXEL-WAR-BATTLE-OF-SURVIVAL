import React, { useState } from 'react';
import { Award, Coins, Home, RotateCcw, Skull, Trophy } from 'lucide-react';
import { audio } from '../game/audio';
import { GameResultSummary, SaveData } from '../game/types';
import { RetryPaymentMethod, RetryPaymentModal } from './RetryPaymentModal';

interface ResultScreenProps {
  result: GameResultSummary;
  saveData: SaveData;
  onPlayAgain: () => void;
  onPayRetryLevel: (level: number, method: RetryPaymentMethod) => void;
  onTopUpWallet: (amount: number) => void;
  onBackToMenu: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  result,
  saveData,
  onPlayAgain,
  onPayRetryLevel,
  onTopUpWallet,
  onBackToMenu,
}) => {
  const [showRetryModal, setShowRetryModal] = useState(false);
  const isVictory = result.won;
  const highScore = saveData.highScore;
  const canPaidRetry = !isVictory && result.mode !== 'duel' && result.levelReached > 1;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex items-center justify-center p-4 sm:p-8">
      <div
        className={`w-full max-w-2xl border-2 p-6 sm:p-8 pixel-frame space-y-6 ${
          isVictory
            ? 'bg-[#121c22] border-amber-400'
            : 'bg-[#171219] border-rose-700'
        }`}
      >
        {/* Status Banner */}
        <div className="text-center space-y-3 border-b border-slate-800 pb-5">
          <div className="flex justify-center">
            {isVictory ? (
              <div className="w-16 h-16 bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center animate-float-slow">
                <Trophy className="w-9 h-9 text-amber-400" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center">
                <Skull className="w-9 h-9 text-rose-400" />
              </div>
            )}
          </div>

          {result.isCampaignVictory ? (
            <>
              <h2 className="font-arcade text-2xl sm:text-3xl text-amber-400 drop-shadow-[0_3px_0_#000]">
                YOU WIN!
              </h2>
              <p className="text-sm sm:text-base text-emerald-300 font-semibold">
                Selamat! Overlord Vex telah dikalahkan dan seluruh 10 level berhasil ditaklukkan!
              </p>
            </>
          ) : result.mode === 'duel' ? (
            <>
              <h2 className="font-arcade text-xl sm:text-2xl text-amber-400">
                {result.duelWinner === 0
                  ? 'SERI (DRAW)!'
                  : `PLAYER ${result.duelWinner} MENANG!`}
              </h2>
              <p className="text-sm text-slate-300">
                Pertandingan 2P Fair Duel selesai.
              </p>
            </>
          ) : (
            <>
              <h2
                className={`font-arcade text-xl sm:text-2xl ${
                  isVictory ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isVictory ? 'MISI SELESAI!' : 'GAME OVER — KALAH'}
              </h2>
              <p className="text-sm text-slate-300">
                {isVictory
                  ? 'Pertempuran berhasil dimenangkan!'
                  : `Gugur pada Level ${result.levelReached}. Tingkatkan senjata di Shop dan coba lagi!`}
              </p>
            </>
          )}

          {result.isNewHighScore && result.totalScore > 0 && (
            <div className="inline-flex items-center gap-2 font-arcade text-[10px] text-yellow-300 pt-1">
              <Award className="w-4 h-4" />
              <span>REKOR HIGH SCORE BARU!</span>
            </div>
          )}
        </div>

        {/* Summary Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono-num">
          <div className="bg-[#0d121a] border border-slate-800 p-4 flex items-center justify-between">
            <span className="text-sm text-slate-400">Total Skor</span>
            <strong className="text-lg text-amber-400">
              {result.totalScore.toLocaleString('id-ID')}
            </strong>
          </div>

          <div className="bg-[#0d121a] border border-slate-800 p-4 flex items-center justify-between">
            <span className="text-sm text-slate-400">High Score</span>
            <strong className="text-lg text-white">
              {Math.max(highScore, result.totalScore).toLocaleString('id-ID')}
            </strong>
          </div>

          <div className="bg-[#0d121a] border border-slate-800 p-4 flex items-center justify-between">
            <span className="text-sm text-slate-400">Level Tertinggi Selesai</span>
            <strong className="text-lg text-emerald-400">
              Level {result.highestLevelCompleted} / 10
            </strong>
          </div>

          <div className="bg-[#0d121a] border border-slate-800 p-4 flex items-center justify-between">
            <span className="text-sm text-slate-400">Musuh Dikalahkan</span>
            <strong className="text-lg text-sky-400">{result.totalKills}</strong>
          </div>

          <div className="bg-[#0d121a] border border-slate-800 p-4 flex items-center justify-between">
            <span className="text-sm text-slate-400">Nyawa Tersisa</span>
            <strong className="text-lg text-rose-400">{result.livesRemaining}</strong>
          </div>

          <div className="bg-[#0d121a] border border-slate-800 p-4 flex items-center justify-between">
            <span className="text-sm text-slate-400 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-yellow-400" />
              Koin Diperoleh
            </span>
            <strong className="text-lg text-yellow-300">+{result.coinsEarned}</strong>
          </div>
        </div>

        {result.mode !== 'single' && (
          <div className="bg-[#0d121a] border border-slate-800 p-4 flex flex-wrap items-center justify-around gap-4 text-sm font-mono-num">
            <span>
              Skor Player 1: <strong className="text-blue-400">{result.p1Score ?? 0}</strong>
            </span>
            <span>
              Skor Player 2: <strong className="text-amber-400">{result.p2Score ?? 0}</strong>
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {canPaidRetry && (
            <button
              onClick={() => {
                audio.uiClick();
                setShowRetryModal(true);
              }}
              className="w-full pixel-btn bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-arcade text-xs py-4 px-5 border-2 border-emerald-200 flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              <span>ULANG LEVEL {result.levelReached} (BAYAR Rp 1.000)</span>
            </button>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => {
                audio.uiClick();
                onPlayAgain();
              }}
              className="pixel-btn bg-amber-500 hover:bg-amber-400 text-slate-950 font-arcade text-xs py-4 px-5 border-2 border-amber-200 flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{canPaidRetry ? 'ULANG LEVEL 1 (GRATIS)' : 'MAIN LAGI'}</span>
            </button>

            <button
              onClick={() => {
                audio.uiClick();
                onBackToMenu();
              }}
              className="pixel-btn bg-slate-800 hover:bg-slate-700 text-white font-arcade text-xs py-4 px-5 border-2 border-slate-600 flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap"
            >
              <Home className="w-4 h-4" />
              <span>MENU UTAMA</span>
            </button>
          </div>
        </div>
      </div>

      {showRetryModal && canPaidRetry && (
        <RetryPaymentModal
          level={result.levelReached}
          coins={saveData.coins}
          walletBalance={saveData.walletBalance}
          onConfirmPayment={(method) => {
            setShowRetryModal(false);
            onPayRetryLevel(result.levelReached, method);
          }}
          onTopUpWallet={onTopUpWallet}
          onCancel={() => setShowRetryModal(false)}
        />
      )}
    </div>
  );
};
