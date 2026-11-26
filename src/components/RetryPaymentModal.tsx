import React, { useState } from 'react';
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Coins,
  Eye,
  EyeOff,
  KeyRound,
  Store,
  Wallet,
  X,
} from 'lucide-react';
import { audio } from '../game/audio';

export type RetryPaymentMethod = 'qris' | 'wallet' | 'coins';

interface RetryPaymentModalProps {
  level: number;
  coins: number;
  walletBalance: number;
  onConfirmPayment: (method: RetryPaymentMethod) => void;
  onTopUpWallet: (amount: number) => void;
  onCancel: () => void;
}

export const RETRY_PRICE_RP = 1000;
const STAND_VERIFICATION_CODE = 'PAMERANCOCOKIN';

export const RetryPaymentModal: React.FC<RetryPaymentModalProps> = ({
  level,
  coins,
  walletBalance,
  onConfirmPayment,
  onTopUpWallet,
  onCancel,
}) => {
  const [step, setStep] = useState<'payment' | 'code'>('payment');
  const [selectedMethod, setSelectedMethod] = useState<RetryPaymentMethod>('qris');
  const [standCode, setStandCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [processing, setProcessing] = useState(false);

  const canPayWallet = walletBalance >= RETRY_PRICE_RP;
  const canPayCoins = coins >= RETRY_PRICE_RP;
  const canSubmitPayment =
    selectedMethod === 'qris' ||
    (selectedMethod === 'wallet' && canPayWallet) ||
    (selectedMethod === 'coins' && canPayCoins);

  const handleStepOneContinue = () => {
    if (!canSubmitPayment || processing) return;
    audio.uiClick();
    if (selectedMethod === 'qris') {
      setCodeError('');
      setStandCode('');
      setStep('code');
      return;
    }
    setProcessing(true);
    window.setTimeout(() => {
      audio.upgrade();
      onConfirmPayment(selectedMethod);
    }, 400);
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (processing) return;
    const normalized = standCode.trim().toUpperCase();
    if (normalized !== STAND_VERIFICATION_CODE) {
      audio.playerHurt();
      setCodeError('Kode panitia salah! Silahkan minta panitia stand memasukkan kode yang benar.');
      return;
    }

    audio.uiClick();
    setCodeError('');
    setProcessing(true);
    window.setTimeout(() => {
      audio.upgrade();
      onConfirmPayment('qris');
    }, 350);
  };

  if (step === 'code') {
    return (
      <div
        className="fixed inset-0 z-50 bg-[#07090e]/92 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stand-code-title"
      >
        <form
          onSubmit={handleVerifyCode}
          className="w-full max-w-md bg-[#131924] border-2 border-emerald-400 p-5 sm:p-6 pixel-frame space-y-4 text-left"
        >
          <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <KeyRound className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <h3 id="stand-code-title" className="font-arcade text-xs sm:text-sm text-emerald-400">
                  KODE PANITIA STAND
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Diisi oleh panitia stand untuk melanjutkan Level {level}.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                audio.uiClick();
                onCancel();
              }}
              aria-label="Tutup"
              className="p-1.5 text-slate-400 hover:text-white border border-slate-700 bg-slate-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <label htmlFor="stand-code-input" className="block text-xs font-semibold text-slate-200">
              Masukkan Kode Verifikasi Panitia Stand:
            </label>
            <div className="relative flex items-center">
              <input
                id="stand-code-input"
                type={showCode ? 'text' : 'password'}
                value={standCode}
                onChange={(e) => {
                  setStandCode(e.target.value);
                  if (codeError) setCodeError('');
                }}
                autoFocus
                autoComplete="off"
                placeholder="Masukkan kode panitia..."
                className="w-full bg-[#0b0e14] border-2 border-slate-600 focus:border-emerald-400 outline-none px-3.5 py-3 pr-11 font-mono-num text-sm font-bold tracking-widest text-white uppercase"
              />
              <button
                type="button"
                onClick={() => setShowCode((v) => !v)}
                aria-label={showCode ? 'Sembunyikan kode' : 'Lihat kode'}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {codeError && (
              <p className="text-xs font-semibold text-rose-400" role="alert">
                {codeError}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="submit"
              disabled={processing || standCode.trim().length === 0}
              className={`py-3 px-4 font-arcade text-[10px] border-2 flex items-center justify-center gap-2 whitespace-nowrap ${
                !processing && standCode.trim().length > 0
                  ? 'pixel-btn bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-200 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{processing ? 'MEMBUKA LEVEL...' : 'VERIFIKASI & MAIN'}</span>
            </button>

            <button
              type="button"
              disabled={processing}
              onClick={() => {
                audio.uiClick();
                setStep('payment');
              }}
              className="pixel-btn bg-slate-800 hover:bg-slate-700 text-slate-200 font-arcade text-[10px] py-3 px-4 border-2 border-slate-600 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>KEMBALI</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-[#07090e]/90 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="retry-popup-title"
    >
      <div className="w-full max-w-md bg-[#131924] border-2 border-amber-400 p-5 sm:p-6 pixel-frame space-y-4 text-left">
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 id="retry-popup-title" className="font-arcade text-xs sm:text-sm text-amber-400">
              ULANG DARI LEVEL {level}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Lanjutkan langsung dari Level {level} tanpa mengulang dari Level 1.
            </p>
          </div>
          <button
            onClick={() => {
              audio.uiClick();
              onCancel();
            }}
            aria-label="Tutup"
            className="p-1.5 text-slate-400 hover:text-white border border-slate-700 bg-slate-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Prominent Pop-up Notice for Stand Committee Payment */}
        <div className="bg-amber-500/15 border-2 border-amber-400 p-4 text-center space-y-2">
          <Store className="w-8 h-8 text-amber-400 mx-auto" />
          <p className="font-arcade text-xs sm:text-sm text-white leading-relaxed">
            Silahkan bayar kepada panitia stand
          </p>
          <p className="font-mono-num text-base font-bold text-emerald-400">
            Biaya Ulang Level {level}: Rp 1.000
          </p>
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-300">Pilih Cara Pembayaran:</div>

          {/* 1. Panitia Stand (Tunai / QRIS) */}
          <button
            type="button"
            onClick={() => {
              audio.uiClick();
              setSelectedMethod('qris');
            }}
            className={`w-full p-3 border-2 text-left flex items-center justify-between gap-3 cursor-pointer ${
              selectedMethod === 'qris'
                ? 'bg-[#1a2434] border-amber-400'
                : 'bg-[#0e131b] border-slate-700 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Banknote className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-sm font-bold text-white">Bayar ke Panitia Stand</div>
                <div className="text-xs text-slate-400">Tunai / QRIS Stand · Verifikasi kode</div>
              </div>
            </div>
            <span className="font-mono-num text-xs font-bold text-emerald-400">Rp 1.000</span>
          </button>

          {/* 2. Saldo Dompet */}
          <button
            type="button"
            onClick={() => {
              audio.uiClick();
              setSelectedMethod('wallet');
            }}
            className={`w-full p-3 border-2 text-left flex items-center justify-between gap-3 cursor-pointer ${
              selectedMethod === 'wallet'
                ? 'bg-[#1a2434] border-amber-400'
                : 'bg-[#0e131b] border-slate-700 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Wallet className="w-5 h-5 text-sky-400 shrink-0" />
              <div>
                <div className="text-sm font-bold text-white">Saldo Dompet Game</div>
                <div className="text-xs text-slate-400 font-mono-num">
                  Saldo: Rp {walletBalance.toLocaleString('id-ID')}
                </div>
              </div>
            </div>
            <span
              className={`font-mono-num text-xs font-bold ${
                canPayWallet ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {canPayWallet ? 'CUKUP' : 'KURANG'}
            </span>
          </button>

          {/* 3. Koin Game */}
          <button
            type="button"
            onClick={() => {
              audio.uiClick();
              setSelectedMethod('coins');
            }}
            className={`w-full p-3 border-2 text-left flex items-center justify-between gap-3 cursor-pointer ${
              selectedMethod === 'coins'
                ? 'bg-[#1a2434] border-amber-400'
                : 'bg-[#0e131b] border-slate-700 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Coins className="w-5 h-5 text-yellow-400 shrink-0" />
              <div>
                <div className="text-sm font-bold text-white">Tukar Koin Game</div>
                <div className="text-xs text-slate-400 font-mono-num">
                  Koin Anda: {coins.toLocaleString('id-ID')} / 1.000
                </div>
              </div>
            </div>
            <span
              className={`font-mono-num text-xs font-bold ${
                canPayCoins ? 'text-yellow-300' : 'text-rose-400'
              }`}
            >
              1.000 KOIN
            </span>
          </button>
        </div>

        {selectedMethod === 'wallet' && !canPayWallet && (
          <div className="bg-[#0d121a] border border-slate-800 p-3 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-300">Saldo kurang untuk bayar Rp 1.000.</span>
            <button
              type="button"
              onClick={() => {
                audio.coin();
                onTopUpWallet(5000);
              }}
              className="pixel-btn bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-arcade text-[9px] px-3 py-2 border-2 border-emerald-200 cursor-pointer whitespace-nowrap"
            >
              + ISI SALDO Rp 5.000
            </button>
          </div>
        )}

        {/* Confirm / Cancel Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            disabled={!canSubmitPayment || processing}
            onClick={handleStepOneContinue}
            className={`py-3 px-4 font-arcade text-[10px] border-2 flex items-center justify-center gap-2 whitespace-nowrap ${
              canSubmitPayment && !processing
                ? 'pixel-btn bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-200 cursor-pointer'
                : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              {processing
                ? 'MEMPROSES...'
                : selectedMethod === 'qris'
                  ? 'MASUKKAN KODE'
                  : 'BAYAR Rp 1.000'}
            </span>
          </button>

          <button
            type="button"
            disabled={processing}
            onClick={() => {
              audio.uiClick();
              onCancel();
            }}
            className="pixel-btn bg-slate-800 hover:bg-slate-700 text-slate-200 font-arcade text-[10px] py-3 px-4 border-2 border-slate-600 cursor-pointer whitespace-nowrap"
          >
            BATAL
          </button>
        </div>
      </div>
    </div>
  );
};
