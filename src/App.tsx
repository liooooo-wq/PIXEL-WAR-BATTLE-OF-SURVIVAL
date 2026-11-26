import { useCallback, useEffect, useRef, useState } from 'react';
import { GameArena } from './components/GameArena';
import { HowToPlayScreen } from './components/HowToPlayScreen';
import { LevelSelectScreen } from './components/LevelSelectScreen';
import { MainMenu } from './components/MainMenu';
import { ResultScreen } from './components/ResultScreen';
import { RETRY_PRICE_RP, RetryPaymentMethod } from './components/RetryPaymentModal';
import { SettingsScreen } from './components/SettingsScreen';
import { ShopScreen } from './components/ShopScreen';
import { TwoPlayerModal } from './components/TwoPlayerModal';
import { audio } from './game/audio';
import {
  getUpgradeCost,
  loadSaveData,
  resetSaveData,
  saveGameData,
  WEAPONS,
} from './game/storage';
import {
  GameMode,
  GameResultSummary,
  GameSettings,
  SaveData,
  ScreenState,
  UpgradeLevels,
  WeaponId,
} from './game/types';

export default function App() {
  const [saveData, setSaveData] = useState<SaveData>(() => loadSaveData());
  const [screen, setScreen] = useState<ScreenState>('MENU');
  const [activeMode, setActiveMode] = useState<GameMode>('single');
  const [startLevel, setStartLevel] = useState<number>(1);
  const [runNonce, setRunNonce] = useState<number>(0);
  const [lastResult, setLastResult] = useState<GameResultSummary | null>(null);
  const committedSessionCoinsRef = useRef(0);

  useEffect(() => {
    audio.updateSettings(saveData.settings);
  }, [saveData.settings]);

  const commitSave = useCallback((updater: (prev: SaveData) => SaveData) => {
    setSaveData((prev) => {
      const next = updater(prev);
      saveGameData(next);
      return next;
    });
  }, []);

  const launchGame = useCallback((mode: GameMode, level: number) => {
    audio.unlock();
    setActiveMode(mode);
    setStartLevel(level);
    setRunNonce((n) => n + 1);
    setScreen('PLAYING');
  }, []);

  const handleProgressCommit = useCallback(
    (patch: {
      coinsEarned: number;
      score: number;
      completedLevel?: number;
      resetToLevelOne?: boolean;
    }) => {
      commitSave((prev) => {
        const nextHighest = patch.completedLevel
          ? Math.max(prev.highestLevelCompleted, patch.completedLevel)
          : prev.highestLevelCompleted;
        const nextUnlocked = patch.resetToLevelOne
          ? 1
          : patch.completedLevel
            ? Math.min(10, Math.max(prev.unlockedLevel, patch.completedLevel + 1))
            : prev.unlockedLevel;

        return {
          ...prev,
          coins: prev.coins + patch.coinsEarned,
          highScore: Math.max(prev.highScore, patch.score),
          highestLevelCompleted: nextHighest,
          unlockedLevel: nextUnlocked,
        };
      });
    },
    [commitSave]
  );

  const handleSessionProgress = useCallback(
    (patch: {
      coinsEarned: number;
      score: number;
      completedLevel?: number;
      resetToLevelOne?: boolean;
    }) => {
      const deltaCoins = Math.max(0, patch.coinsEarned - committedSessionCoinsRef.current);
      committedSessionCoinsRef.current = patch.coinsEarned;
      handleProgressCommit({
        coinsEarned: deltaCoins,
        score: patch.score,
        completedLevel: patch.completedLevel,
        resetToLevelOne: patch.resetToLevelOne,
      });
    },
    [handleProgressCommit]
  );

  const handleStartNewRun = useCallback(
    (mode: GameMode, level: number) => {
      committedSessionCoinsRef.current = 0;
      launchGame(mode, level);
    },
    [launchGame]
  );

  const handleBuyOrEquipWeapon = (weaponId: WeaponId) => {
    const spec = WEAPONS[weaponId];
    if (saveData.ownedWeapons.includes(weaponId)) {
      audio.uiClick();
      commitSave((prev) => ({ ...prev, equippedWeapon: weaponId }));
      return;
    }
    if (saveData.coins >= spec.price) {
      audio.upgrade();
      commitSave((prev) => ({
        ...prev,
        coins: prev.coins - spec.price,
        ownedWeapons: [...prev.ownedWeapons, weaponId],
        equippedWeapon: weaponId,
      }));
    }
  };

  const handleUpgradeStat = (key: keyof UpgradeLevels) => {
    const currentLv = saveData.upgrades[key];
    const maxLv = key === 'bonusLives' ? 2 : 5;
    if (currentLv >= maxLv) return;
    const cost = getUpgradeCost(key, currentLv);
    if (saveData.coins < cost) return;

    audio.upgrade();
    commitSave((prev) => ({
      ...prev,
      coins: prev.coins - cost,
      upgrades: {
        ...prev.upgrades,
        [key]: currentLv + 1,
      },
    }));
  };

  const handleUpdateSettings = (nextSettings: GameSettings) => {
    commitSave((prev) => ({ ...prev, settings: nextSettings }));
  };

  const handleResetProgress = () => {
    const fresh = resetSaveData();
    setSaveData(fresh);
  };

  const handleTopUpWallet = useCallback(
    (amount: number) => {
      commitSave((prev) => ({
        ...prev,
        walletBalance: prev.walletBalance + amount,
      }));
    },
    [commitSave]
  );

  const handlePayRetryLevel = useCallback(
    (mode: GameMode, level: number, method: RetryPaymentMethod) => {
      commitSave((prev) => {
        if (method === 'coins') {
          if (prev.coins < RETRY_PRICE_RP) return prev;
          return {
            ...prev,
            coins: prev.coins - RETRY_PRICE_RP,
            unlockedLevel: Math.max(prev.unlockedLevel, level),
          };
        }
        if (method === 'wallet') {
          if (prev.walletBalance < RETRY_PRICE_RP) return prev;
          return {
            ...prev,
            walletBalance: prev.walletBalance - RETRY_PRICE_RP,
            unlockedLevel: Math.max(prev.unlockedLevel, level),
          };
        }
        // Direct QRIS / E-Wallet payment of Rp 1.000
        return {
          ...prev,
          unlockedLevel: Math.max(prev.unlockedLevel, level),
        };
      });
      handleStartNewRun(mode, level);
    },
    [commitSave, handleStartNewRun]
  );

  if (screen === 'MENU') {
    return (
      <MainMenu
        saveData={saveData}
        onPlayGame={() => handleStartNewRun('single', saveData.unlockedLevel)}
        onSinglePlayer={() => handleStartNewRun('single', 1)}
        onTwoPlayer={() => setScreen('TWO_PLAYER_SELECT')}
        onLevelSelect={() => setScreen('LEVEL_SELECT')}
        onShop={() => setScreen('SHOP')}
        onHowToPlay={() => setScreen('HOW_TO_PLAY')}
        onSettings={() => setScreen('SETTINGS')}
      />
    );
  }

  if (screen === 'TWO_PLAYER_SELECT') {
    return (
      <TwoPlayerModal
        unlockedLevel={saveData.unlockedLevel}
        onStartCoop={(lvl) => handleStartNewRun('coop', lvl)}
        onStartDuel={() => handleStartNewRun('duel', 0)}
        onBack={() => setScreen('MENU')}
      />
    );
  }

  if (screen === 'LEVEL_SELECT') {
    return (
      <LevelSelectScreen
        unlockedLevel={saveData.unlockedLevel}
        highestCompleted={saveData.highestLevelCompleted}
        onSelectLevel={(lvl, mode) => handleStartNewRun(mode, lvl)}
        onBack={() => setScreen('MENU')}
      />
    );
  }

  if (screen === 'SHOP') {
    return (
      <ShopScreen
        saveData={saveData}
        onBuyOrEquipWeapon={handleBuyOrEquipWeapon}
        onUpgradeStat={handleUpgradeStat}
        onBack={() => setScreen('MENU')}
      />
    );
  }

  if (screen === 'HOW_TO_PLAY') {
    return <HowToPlayScreen onBack={() => setScreen('MENU')} />;
  }

  if (screen === 'SETTINGS') {
    return (
      <SettingsScreen
        settings={saveData.settings}
        onUpdateSettings={handleUpdateSettings}
        onResetProgress={handleResetProgress}
        onBack={() => setScreen('MENU')}
      />
    );
  }

  if (screen === 'PLAYING') {
    return (
      <GameArena
        key={runNonce}
        mode={activeMode}
        startLevel={startLevel}
        saveData={saveData}
        onProgressCommit={handleSessionProgress}
        onFinishRun={(summary) => {
          setLastResult(summary);
          setScreen('RESULT');
        }}
        onRestartRun={(lvl) => handleStartNewRun(activeMode, lvl)}
        onPayRetryLevel={(lvl, method) => handlePayRetryLevel(activeMode, lvl, method)}
        onTopUpWallet={handleTopUpWallet}
        onOpenShopFromPause={() => setScreen('SHOP')}
        onExitToMenu={() => setScreen('MENU')}
      />
    );
  }

  if (screen === 'RESULT' && lastResult) {
    return (
      <ResultScreen
        result={lastResult}
        saveData={saveData}
        onPlayAgain={() =>
          handleStartNewRun(lastResult.mode, lastResult.mode === 'duel' ? 0 : 1)
        }
        onPayRetryLevel={(lvl, method) => handlePayRetryLevel(lastResult.mode, lvl, method)}
        onTopUpWallet={handleTopUpWallet}
        onBackToMenu={() => setScreen('MENU')}
      />
    );
  }

  return null;
}
