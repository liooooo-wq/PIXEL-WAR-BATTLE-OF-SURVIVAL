import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Coins,
  Crosshair,
  Heart,
  Home,
  Maximize,
  Pause,
  Play,
  RotateCcw,
  ShoppingBag,
  Skull,
  Trophy,
} from 'lucide-react';
import { audio } from '../game/audio';
import { PixelWarEngine } from '../game/engine';
import { ARENA_HEIGHT, ARENA_WIDTH } from '../game/levels';
import { WEAPONS } from '../game/storage';
import {
  GameMode,
  GameResultSummary,
  HudSnapshot,
  SaveData,
  WeaponId,
} from '../game/types';
import { PixelHearts } from './PixelHearts';
import { RetryPaymentMethod, RetryPaymentModal } from './RetryPaymentModal';

interface GameArenaProps {
  mode: GameMode;
  startLevel: number;
  saveData: SaveData;
  onProgressCommit: (patch: {
    coinsEarned: number;
    score: number;
    completedLevel?: number;
    resetToLevelOne?: boolean;
  }) => void;
  onFinishRun: (summary: GameResultSummary) => void;
  onRestartRun?: (level: number) => void;
  onPayRetryLevel?: (level: number, method: RetryPaymentMethod) => void;
  onTopUpWallet?: (amount: number) => void;
  onOpenShopFromPause?: () => void;
  onExitToMenu: () => void;
}

export const GameArena: React.FC<GameArenaProps> = ({
  mode,
  startLevel,
  saveData,
  onProgressCommit,
  onFinishRun,
  onRestartRun,
  onPayRetryLevel,
  onTopUpWallet,
  onOpenShopFromPause,
  onExitToMenu,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<PixelWarEngine | null>(null);
  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [showTouchPad, setShowTouchPad] = useState<boolean>(false);
  const [showRetryModal, setShowRetryModal] = useState<boolean>(false);

  // Track latest callbacks safely without re-instantiating engine
  const callbacksRef = useRef({ onProgressCommit, onFinishRun });
  callbacksRef.current = { onProgressCommit, onFinishRun };

  // Keep touch pad auto-enabled on narrow/touch viewports
  useEffect(() => {
    const checkTouch = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setShowTouchPad(hasTouch && window.innerWidth < 1024);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new PixelWarEngine(canvas, saveData, {
      onHudUpdate: (snapshot) => setHud(snapshot),
      onProgressCommit: (patch) => callbacksRef.current.onProgressCommit(patch),
      onFinishRun: (summary) => callbacksRef.current.onFinishRun(summary),
    });

    engineRef.current = engine;
    engine.startNewRun(mode, startLevel);

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
    // Run only when mode or startLevel changes for a new session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, startLevel]);

  useEffect(() => {
    engineRef.current?.updateSaveData(saveData);
  }, [saveData]);

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

  const setVirtualDir = (dx: number, dy: number) => {
    engineRef.current?.setVirtualInput({ moveX: dx, moveY: dy });
  };

  const setVirtualFire = (firing: boolean) => {
    audio.unlock();
    engineRef.current?.setVirtualInput({ firing });
  };

  const availWeapons: WeaponId[] =
    mode === 'duel'
      ? ['pistol', 'rifle', 'laser']
      : (['pistol', 'rifle', 'laser'] as WeaponId[]).filter((w) =>
          saveData.ownedWeapons.includes(w)
        );

  return (
    <div className="min-h-screen bg-[#080a0f] text-slate-100 flex flex-col items-center justify-between p-2 sm:p-4 select-none">
      {/* Top Unobtrusive Tactical HUD */}
      <header className="w-full max-w-[1160px] bg-[#121721] border-2 border-slate-700 px-3 py-2.5 sm:px-4 sm:py-3 pixel-frame grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
        {/* Player 1 Status */}
        <div className="lg:col-span-4 flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-arcade text-[10px] text-blue-400">P1</span>
              <PixelHearts
                lives={hud?.p1.lives ?? 3}
                maxLives={hud?.p1.maxLives ?? 3}
                size="sm"
              />
            </div>
            <span className="font-mono-num text-xs font-bold text-slate-200">
              HP: {hud?.p1.hp ?? 100}/{hud?.p1.maxHp ?? 100}
              {hud?.p1.invuln ? ' · SHIELD' : ''}
            </span>
          </div>

          <div className="w-full h-3 bg-slate-900 border border-slate-700 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-[width] duration-100"
              style={{
                width: `${hud ? Math.max(0, (hud.p1.hp / hud.p1.maxHp) * 100) : 100}%`,
              }}
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {availWeapons.map((wid) => {
              const active = hud?.p1.weapon === wid;
              return (
                <button
                  key={wid}
                  onClick={() => engineRef.current?.switchPlayerWeapon(1, wid)}
                  className={`px-2 py-0.5 text-[10px] font-arcade border cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-amber-500 text-slate-950 border-amber-200'
                      : 'bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700'
                  }`}
                >
                  {WEAPONS[wid].name.split(' ').pop()}
                </button>
              );
            })}
            {hud?.p1.skills.triple ? (
              <span className="font-mono-num text-[11px] font-bold text-purple-300 ml-1">
                3X:{hud.p1.skills.triple}s
              </span>
            ) : null}
            {hud?.p1.skills.power ? (
              <span className="font-mono-num text-[11px] font-bold text-orange-400 ml-1">
                DMG+:{hud.p1.skills.power}s
              </span>
            ) : null}
            {hud?.p1.skills.speed ? (
              <span className="font-mono-num text-[11px] font-bold text-sky-300 ml-1">
                SPD+:{hud.p1.skills.speed}s
              </span>
            ) : null}
          </div>
        </div>

        {/* Center Mission & Score Counters */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center text-center gap-1 border-y lg:border-y-0 lg:border-x border-slate-800 py-2 lg:py-0 px-2">
          <div className="font-arcade text-[10px] sm:text-xs text-amber-400">
            {hud?.mode === 'duel'
              ? '2P FAIR DUEL ARENA'
              : `LEVEL ${hud?.level ?? startLevel} · ${hud?.levelName ?? ''}`}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono-num text-slate-200">
            {hud?.mode !== 'duel' && (
              <span>
                MUSUH: <strong className="text-rose-400">{hud?.enemiesRemaining ?? 0}</strong>
              </span>
            )}
            <span>
              SKOR: <strong className="text-white">{(hud?.totalScore ?? 0).toLocaleString('id-ID')}</strong>
            </span>
            <span className="flex items-center gap-1 text-yellow-300">
              <Coins className="w-3.5 h-3.5 text-yellow-400" />
              <strong>+{hud?.sessionCoins ?? 0}</strong>
            </span>
          </div>
        </div>

        {/* Right: P2 Status (if 2P) + Pause / Fullscreen Actions */}
        <div className="lg:col-span-4 flex items-center justify-between lg:justify-end gap-3">
          {hud?.p2 ? (
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-arcade text-[10px] text-amber-400">P2</span>
                  <PixelHearts
                    lives={hud.p2.lives}
                    maxLives={hud.p2.maxLives}
                    size="sm"
                  />
                </div>
                <span className="font-mono-num text-xs font-bold text-slate-200">
                  HP: {hud.p2.hp}/{hud.p2.maxHp}
                </span>
              </div>
              <div className="w-full h-3 bg-slate-900 border border-slate-700 overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-[width] duration-100"
                  style={{
                    width: `${Math.max(0, (hud.p2.hp / hud.p2.maxHp) * 100)}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono-num text-slate-400">
                <span>P1: {hud.p1.score}</span>
                <span className="text-purple-300">
                  {hud.p2.skills.triple ? `3X:${hud.p2.skills.triple}s ` : ''}
                  {hud.p2.skills.power ? `DMG+:${hud.p2.skills.power}s ` : ''}
                  {hud.p2.skills.speed ? `SPD+:${hud.p2.skills.speed}s` : ''}
                </span>
                <span>P2: {hud.p2.score}</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 font-mono-num hidden sm:block">
              WASD / Panah · F / Klik Tembak
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => engineRef.current?.togglePause()}
              title="Pause / Resume (P)"
              className="pixel-btn bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 border-2 border-slate-600 flex items-center gap-1.5 font-arcade text-[10px] cursor-pointer whitespace-nowrap"
            >
              {hud?.overlay === 'PAUSED' ? (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span>RESUME</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-400" />
                  <span>PAUSE</span>
                </>
              )}
            </button>

            <button
              onClick={toggleFullscreen}
              title="Layar Penuh"
              aria-label="Layar Penuh"
              className="pixel-btn bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 border-2 border-slate-600 cursor-pointer"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Boss Health Bar Banner */}
      {hud?.boss && (
        <div className="w-full max-w-[1160px] mt-2 bg-[#1c1018] border-2 border-rose-600 px-4 py-2 flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <Skull className="w-4 h-4 text-rose-400" />
            <span className="font-arcade text-[10px] sm:text-xs text-rose-300">
              {hud.boss.name}
            </span>
          </div>
          <div className="flex-1 h-4 bg-slate-950 border border-rose-900 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-600 to-amber-500 transition-[width] duration-100"
              style={{ width: `${Math.max(0, (hud.boss.hp / hud.boss.maxHp) * 100)}%` }}
            />
          </div>
          <span className="font-mono-num text-xs font-bold text-rose-200 shrink-0">
            {hud.boss.hp} / {hud.boss.maxHp}
          </span>
        </div>
      )}

      {/* Main Canvas Arena Viewport */}
      <main className="relative w-full max-w-[1160px] my-2 flex-1 flex items-center justify-center">
        <div className="relative w-full aspect-video max-h-[74vh] bg-black border-2 border-slate-700 pixel-frame overflow-hidden">
          <canvas
            ref={canvasRef}
            width={ARENA_WIDTH}
            height={ARENA_HEIGHT}
            className="w-full h-full object-contain pixel-canvas block cursor-crosshair"
          />

          {/* PAUSED OVERLAY */}
          {hud?.overlay === 'PAUSED' && (
            <div className="absolute inset-0 bg-[#0b0e14]/85 flex items-center justify-center p-4 z-20">
              <div className="w-full max-w-sm bg-[#131924] border-2 border-amber-400 p-6 pixel-frame text-center space-y-4">
                <h3 className="font-arcade text-lg text-amber-400">GAME DIJEDA</h3>
                <p className="text-sm text-slate-300">
                  Ambil napas sejenak, prajurit. Pertempuran menunggumu!
                </p>
                <div className="space-y-2.5 pt-2">
                  <button
                    onClick={() => engineRef.current?.togglePause()}
                    className="w-full pixel-btn bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-arcade text-xs py-3 border-2 border-emerald-200 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>RESUME</span>
                  </button>
                  <button
                    onClick={() => {
                      audio.uiClick();
                      if (onRestartRun && hud) {
                        onRestartRun(hud.mode === 'duel' ? 0 : hud.level);
                      } else {
                        engineRef.current?.restartCurrentRun();
                      }
                    }}
                    className="w-full pixel-btn bg-slate-800 hover:bg-slate-700 text-white font-arcade text-xs py-3 border-2 border-slate-600 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>RESTART LEVEL</span>
                  </button>
                  <button
                    onClick={() => {
                      audio.uiClick();
                      onExitToMenu();
                    }}
                    className="w-full pixel-btn bg-rose-950 hover:bg-rose-900 text-rose-200 font-arcade text-xs py-3 border-2 border-rose-700 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Home className="w-4 h-4" />
                    <span>MENU UTAMA</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* LEVEL CLEAR OVERLAY */}
          {hud?.overlay === 'LEVEL_CLEAR' && (
            <div className="absolute inset-0 bg-[#0b0e14]/85 flex items-center justify-center p-4 z-20">
              <div className="w-full max-w-md bg-[#121c24] border-2 border-emerald-400 p-6 pixel-frame text-center space-y-4">
                <div className="font-arcade text-lg text-emerald-400">
                  LEVEL {hud.level} SELESAI!
                </div>
                <p className="text-sm text-slate-300">{hud.levelName} berhasil diamankan.</p>

                {hud.levelBonusReward && (
                  <div className="bg-[#0b1017] border border-slate-700 p-4 space-y-2 text-sm font-mono-num">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bonus Level Selesai</span>
                      <strong className="text-amber-300">+{hud.levelBonusReward.scoreBonus} Poin</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Hadiah Koin</span>
                      <strong className="text-yellow-300">+{hud.levelBonusReward.coinBonus} Koin</strong>
                    </div>
                    {hud.levelBonusReward.gotLife && (
                      <div className="flex items-center justify-center gap-2 text-rose-400 font-bold pt-1">
                        <Heart className="w-4 h-4 fill-rose-500" />
                        <span>BONUS +1 NYAWA DITERIMA!</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2.5 pt-2">
                  <button
                    onClick={() => {
                      audio.uiClick();
                      engineRef.current?.loadNextLevel();
                    }}
                    className="w-full pixel-btn bg-amber-500 hover:bg-amber-400 text-slate-950 font-arcade text-xs py-3.5 border-2 border-amber-200 cursor-pointer"
                  >
                    NEXT LEVEL (LV {hud.level + 1})
                  </button>

                  <div className="grid grid-cols-2 gap-2.5">
                    {onOpenShopFromPause && (
                      <button
                        onClick={() => {
                          audio.uiClick();
                          onOpenShopFromPause();
                        }}
                        className="pixel-btn bg-slate-800 hover:bg-slate-700 text-yellow-300 font-arcade text-[10px] py-3 border-2 border-slate-600 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>SHOP</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        audio.uiClick();
                        onExitToMenu();
                      }}
                      className={`pixel-btn bg-slate-800 hover:bg-slate-700 text-slate-200 font-arcade text-[10px] py-3 border-2 border-slate-600 flex items-center justify-center gap-1.5 cursor-pointer ${
                        onOpenShopFromPause ? '' : 'col-span-2'
                      }`}
                    >
                      <Home className="w-3.5 h-3.5" />
                      <span>MENU</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GAME OVER OVERLAY */}
          {hud?.overlay === 'GAME_OVER' && (
            <div className="absolute inset-0 bg-[#0b0e14]/88 flex items-center justify-center p-4 z-20">
              <div className="w-full max-w-md bg-[#1a1118] border-2 border-rose-600 p-6 pixel-frame text-center space-y-4">
                <Skull className="w-10 h-10 text-rose-500 mx-auto" />
                <h3 className="font-arcade text-xl text-rose-400">GAME OVER</h3>
                <p className="text-sm text-slate-300">
                  Semua nyawa telah habis di Level {hud.level}. Total Skor:{' '}
                  <strong className="text-amber-300 font-mono-num">
                    {hud.totalScore.toLocaleString('id-ID')}
                  </strong>
                  <span className="block text-xs text-rose-300 mt-1">
                    Karena kalah, permainan harus diulang dari Level 1.
                  </span>
                </p>
                <div className="space-y-2.5 pt-2">
                  {hud.mode !== 'duel' && hud.level > 1 && onPayRetryLevel && (
                    <button
                      onClick={() => {
                        audio.uiClick();
                        setShowRetryModal(true);
                      }}
                      className="w-full pixel-btn bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-arcade text-[11px] py-3.5 border-2 border-emerald-200 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>ULANG LEVEL {hud.level} (Rp 1.000)</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      audio.uiClick();
                      if (onRestartRun) {
                        onRestartRun(hud.mode === 'duel' ? 0 : 1);
                      } else {
                        engineRef.current?.restartCurrentRun();
                      }
                    }}
                    className="w-full pixel-btn bg-amber-500 hover:bg-amber-400 text-slate-950 font-arcade text-xs py-3.5 border-2 border-amber-200 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{hud.mode === 'duel' ? 'RESTART DUEL' : 'ULANG DARI LEVEL 1 (GRATIS)'}</span>
                  </button>
                  <button
                    onClick={() => {
                      audio.uiClick();
                      engineRef.current?.finishToResult();
                    }}
                    className="w-full pixel-btn bg-sky-600 hover:bg-sky-500 text-white font-arcade text-xs py-3 border-2 border-sky-300 cursor-pointer"
                  >
                    LIHAT HASIL PERTANDINGAN
                  </button>
                  <button
                    onClick={() => {
                      audio.uiClick();
                      onExitToMenu();
                    }}
                    className="w-full pixel-btn bg-slate-800 hover:bg-slate-700 text-slate-200 font-arcade text-xs py-3 border-2 border-slate-600 cursor-pointer"
                  >
                    MENU UTAMA
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* YOU WIN OVERLAY (Final Boss Defeated or 2P Duel Winner) */}
          {hud?.overlay === 'YOU_WIN' && (
            <div className="absolute inset-0 bg-[#0b0e14]/75 flex items-center justify-center p-4 z-20">
              <div className="w-full max-w-md bg-[#131d24]/95 border-2 border-amber-400 p-6 pixel-frame text-center space-y-4">
                <Trophy className="w-12 h-12 text-amber-400 mx-auto animate-float-slow" />
                <h3 className="font-arcade text-2xl text-amber-400">
                  {hud.mode === 'duel'
                    ? hud.duelWinner === 0
                      ? 'SERI!'
                      : `PLAYER ${hud.duelWinner} MENANG!`
                    : 'YOU WIN!'}
                </h3>
                <p className="text-sm text-emerald-300">
                  {hud.mode === 'duel'
                    ? 'Pertandingan adil 1 vs 1 selesai!'
                    : 'Final Boss OVERLORD VEX telah dikalahkan! Kamu adalah Pahlawan Survival!'}
                </p>
                <div className="font-mono-num text-sm bg-[#0b1017] border border-slate-700 p-3 flex justify-around">
                  <span>
                    Skor: <strong className="text-amber-300">{hud.totalScore.toLocaleString('id-ID')}</strong>
                  </span>
                  <span>
                    Koin: <strong className="text-yellow-300">+{hud.sessionCoins}</strong>
                  </span>
                </div>
                <div className="space-y-2.5 pt-1">
                  <button
                    onClick={() => {
                      audio.uiClick();
                      engineRef.current?.finishToResult();
                    }}
                    className="w-full pixel-btn bg-amber-500 hover:bg-amber-400 text-slate-950 font-arcade text-xs py-3.5 border-2 border-amber-200 cursor-pointer"
                  >
                    HALAMAN HASIL &amp; REKOR
                  </button>
                  <button
                    onClick={() => {
                      audio.uiClick();
                      engineRef.current?.restartCurrentRun();
                    }}
                    className="w-full pixel-btn bg-emerald-600 hover:bg-emerald-500 text-white font-arcade text-xs py-3 border-2 border-emerald-300 cursor-pointer"
                  >
                    MAIN LAGI
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Responsive Mobile / Touch Virtual Controls (for HP / Tablet) */}
      {(showTouchPad || mode === 'single') && (
        <div className="w-full max-w-[1160px] lg:hidden flex items-center justify-between gap-4 px-2 pb-2">
          {/* Virtual D-Pad */}
          <div className="grid grid-cols-3 gap-1.5 w-36">
            <div />
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                setVirtualDir(0, -1);
              }}
              onTouchEnd={() => setVirtualDir(0, 0)}
              onMouseDown={() => setVirtualDir(0, -1)}
              onMouseUp={() => setVirtualDir(0, 0)}
              className="bg-slate-800 active:bg-amber-500 border-2 border-slate-600 p-3 flex items-center justify-center"
              aria-label="Atas"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            <div />
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                setVirtualDir(-1, 0);
              }}
              onTouchEnd={() => setVirtualDir(0, 0)}
              onMouseDown={() => setVirtualDir(-1, 0)}
              onMouseUp={() => setVirtualDir(0, 0)}
              className="bg-slate-800 active:bg-amber-500 border-2 border-slate-600 p-3 flex items-center justify-center"
              aria-label="Kiri"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                setVirtualDir(0, 1);
              }}
              onTouchEnd={() => setVirtualDir(0, 0)}
              onMouseDown={() => setVirtualDir(0, 1)}
              onMouseUp={() => setVirtualDir(0, 0)}
              className="bg-slate-800 active:bg-amber-500 border-2 border-slate-600 p-3 flex items-center justify-center"
              aria-label="Bawah"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                setVirtualDir(1, 0);
              }}
              onTouchEnd={() => setVirtualDir(0, 0)}
              onMouseDown={() => setVirtualDir(1, 0)}
              onMouseUp={() => setVirtualDir(0, 0)}
              className="bg-slate-800 active:bg-amber-500 border-2 border-slate-600 p-3 flex items-center justify-center"
              aria-label="Kanan"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Virtual Fire Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              setVirtualFire(true);
            }}
            onTouchEnd={() => setVirtualFire(false)}
            onMouseDown={() => setVirtualFire(true)}
            onMouseUp={() => setVirtualFire(false)}
            className="pixel-btn bg-rose-600 active:bg-rose-500 border-2 border-rose-300 w-24 h-24 rounded-none flex flex-col items-center justify-center gap-1 font-arcade text-[10px] text-white"
          >
            <Crosshair className="w-7 h-7" />
            <span>TEMBAK</span>
          </button>
        </div>
      )}

      {showRetryModal && hud && onPayRetryLevel && (
        <RetryPaymentModal
          level={hud.level}
          coins={saveData.coins}
          walletBalance={saveData.walletBalance}
          onConfirmPayment={(method) => {
            setShowRetryModal(false);
            onPayRetryLevel(hud.level, method);
          }}
          onTopUpWallet={(amt) => onTopUpWallet?.(amt)}
          onCancel={() => setShowRetryModal(false)}
        />
      )}
    </div>
  );
};
