import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from 'firebase/auth';
import confetti from 'canvas-confetti';
import {
  GameId,
  PlayerStats,
  Achievement,
  ShopItem,
  SaveData,
  DriveFileInfo,
} from '../types';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  setCachedAccessToken,
} from '../services/firebase';
import {
  findSaveFileOnDrive,
  uploadSaveToDrive,
  downloadSaveFromDrive,
  deleteSaveFileFromDrive,
} from '../services/driveService';
import { sound } from '../services/audioService';

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_play',
    title: 'Bước Đầu Nhập Cuộc',
    description: 'Chơi bất kỳ minigame nào lần đầu tiên.',
    icon: '🎮',
    rewardCoins: 50,
    unlocked: false,
  },
  {
    id: 'snake_50',
    title: 'Rắn Khổng Lồ',
    description: 'Đạt trên 50 điểm trong game Rắn Săn Mồi.',
    icon: '🐍',
    rewardCoins: 100,
    unlocked: false,
  },
  {
    id: 'brick_1000',
    title: 'Phá Hoại Đỉnh Cao',
    description: 'Ghi được 1.000 điểm trong Phá Gạch Ánh Sáng.',
    icon: '🧱',
    rewardCoins: 120,
    unlocked: false,
  },
  {
    id: 'fusion_512',
    title: 'Nhà Hợp Nhất',
    description: 'Tạo được ô số 512 trở lên trong 2048 Neon Fusion.',
    icon: '✨',
    rewardCoins: 150,
    unlocked: false,
  },
  {
    id: 'fusion_2048',
    title: 'Huyền Thoại 2048',
    description: 'Chinh phục ô số 2048 vinh quang!',
    icon: '🏆',
    rewardCoins: 300,
    unlocked: false,
  },
  {
    id: 'memory_ace',
    title: 'Siêu Trí Nhớ',
    description: 'Chiến thắng Lật Thẻ Trí Nhớ trong vòng dưới 45 giây.',
    icon: '🧠',
    rewardCoins: 120,
    unlocked: false,
  },
  {
    id: 'bird_15',
    title: 'Phi Công Cừ Khôi',
    description: 'Vượt qua 15 cột ống trong Cánh Chim Phiêu Lưu.',
    icon: '🪶',
    rewardCoins: 150,
    unlocked: false,
  },
  {
    id: 'math_streak',
    title: 'Thần Đồng Toán Học',
    description: 'Đạt chuỗi đúng 12 câu liên tiếp trong Đấu Trí Toán Học.',
    icon: '⚡',
    rewardCoins: 120,
    unlocked: false,
  },
  {
    id: 'cloud_backup',
    title: 'Bảo Vệ Đám Mây',
    description: 'Đồng bộ sao lưu dữ liệu lên Google Drive thành công.',
    icon: '☁️',
    rewardCoins: 200,
    unlocked: false,
  },
  {
    id: 'coin_500',
    title: 'Tỉ Phú Arcade',
    description: 'Sở hữu từ 500 Xu Arcade trở lên.',
    icon: '💰',
    rewardCoins: 150,
    unlocked: false,
  },
];

const DEFAULT_SHOP_ITEMS: ShopItem[] = [
  {
    id: 'theme_cyber',
    name: 'Giao diện Cyber Neon',
    type: 'theme',
    price: 0,
    description: 'Phong cách cyberpunk phát sáng rực rỡ (Mặc định).',
    unlocked: true,
    icon: '🌌',
  },
  {
    id: 'theme_retro',
    name: 'Giao diện Retro Arcade 80s',
    type: 'theme',
    price: 150,
    description: 'Cảm giác màn hình thùng máy arcade cổ điển.',
    unlocked: false,
    icon: '🕹️',
  },
  {
    id: 'theme_sunset',
    name: 'Giao diện Hoàng Hôn Pastel',
    type: 'theme',
    price: 250,
    description: 'Tông màu tím hồng êm dịu phong cách synthwave.',
    unlocked: false,
    icon: '🌅',
  },
  {
    id: 'theme_matrix',
    name: 'Giao diện Ma Trận Hacker',
    type: 'theme',
    price: 350,
    description: 'Màu xanh lục mã nhị phân ma trận bí ẩn.',
    unlocked: false,
    icon: '💻',
  },
  {
    id: 'skin_gold_snake',
    name: 'Skin Rắn Vàng Hoàng Gia',
    type: 'skin',
    price: 200,
    description: 'Da rắn mạ vàng lấp lánh cho game Rắn Săn Mồi.',
    unlocked: false,
    icon: '👑',
  },
  {
    id: 'skin_laser_paddle',
    name: 'Thanh Đỡ Laser Plasma',
    type: 'skin',
    price: 200,
    description: 'Hiệu ứng ánh sáng plasma sắc nét cho Phá Gạch.',
    unlocked: false,
    icon: '⚡',
  },
];

const INITIAL_STATS: PlayerStats = {
  gamesPlayed: 0,
  totalScore: 0,
  coins: 100, // starting bonus
  streakDays: 1,
  lastPlayedDate: new Date().toISOString().slice(0, 10),
  highScores: {
    snake: 0,
    brick: 0,
    '2048': 0,
    memory: 0,
    flappy: 0,
    math: 0,
  },
  gamesPlayedCount: {
    snake: 0,
    brick: 0,
    '2048': 0,
    memory: 0,
    flappy: 0,
    math: 0,
  },
};

interface GameContextType {
  user: User | null;
  hasGoogleAuth: boolean;
  isLoggingIn: boolean;
  driveFile: DriveFileInfo | null;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncTime: string | null;
  stats: PlayerStats;
  achievements: Achievement[];
  shopItems: ShopItem[];
  activeTheme: string;
  isMuted: boolean;
  loginGoogle: () => Promise<void>;
  logoutGoogle: () => Promise<void>;
  syncToDrive: () => Promise<void>;
  restoreFromDrive: () => Promise<boolean>;
  deleteCloudSave: () => Promise<boolean>;
  recordGameResult: (gameId: GameId, score: number, coinsEarned: number, metadata?: Record<string, unknown>) => void;
  buyShopItem: (item: ShopItem) => boolean;
  setActiveTheme: (themeId: string) => void;
  toggleSound: () => void;
  unlockAchievement: (achievementId: string) => void;
  refreshDriveStatus: () => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [hasGoogleAuth, setHasGoogleAuth] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [driveFile, setDriveFile] = useState<DriveFileInfo | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Sound state
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());

  // Player state
  const [stats, setStats] = useState<PlayerStats>(() => {
    try {
      const saved = localStorage.getItem('playverse_stats');
      return saved ? JSON.parse(saved) : INITIAL_STATS;
    } catch {
      return INITIAL_STATS;
    }
  });

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    try {
      const saved = localStorage.getItem('playverse_achievements');
      return saved ? JSON.parse(saved) : DEFAULT_ACHIEVEMENTS;
    } catch {
      return DEFAULT_ACHIEVEMENTS;
    }
  });

  const [shopItems, setShopItems] = useState<ShopItem[]>(() => {
    try {
      const saved = localStorage.getItem('playverse_shop_items');
      return saved ? JSON.parse(saved) : DEFAULT_SHOP_ITEMS;
    } catch {
      return DEFAULT_SHOP_ITEMS;
    }
  });

  const [activeTheme, setActiveThemeState] = useState<string>(() => {
    return localStorage.getItem('playverse_active_theme') || 'theme_cyber';
  });

  // Save to local storage whenever local state changes
  useEffect(() => {
    localStorage.setItem('playverse_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('playverse_achievements', JSON.stringify(achievements));
  }, [achievements]);

  useEffect(() => {
    localStorage.setItem('playverse_shop_items', JSON.stringify(shopItems));
  }, [shopItems]);

  useEffect(() => {
    localStorage.setItem('playverse_active_theme', activeTheme);
  }, [activeTheme]);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setCachedAccessToken(token);
        setHasGoogleAuth(true);
      },
      () => {
        setUser(null);
        setHasGoogleAuth(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const refreshDriveStatus = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      setDriveFile(null);
      return;
    }
    try {
      const file = await findSaveFileOnDrive();
      setDriveFile(file);
      if (file?.modifiedTime) {
        setLastSyncTime(new Date(file.modifiedTime).toLocaleTimeString('vi-VN'));
      }
    } catch (err) {
      console.warn('Could not inspect Google Drive:', err);
    }
  }, []);

  useEffect(() => {
    if (user && hasGoogleAuth) {
      refreshDriveStatus();
    } else {
      setDriveFile(null);
    }
  }, [user, hasGoogleAuth, refreshDriveStatus]);

  // Google Sign-in action
  const loginGoogle = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setHasGoogleAuth(true);
        sound.playPowerup();
        confetti({ particleCount: 50, spread: 60 });
        await refreshDriveStatus();
      }
    } catch (err: unknown) {
      console.error('Google Sign-in failed', err);
      throw err;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logoutGoogle = async () => {
    await logout();
    setUser(null);
    setHasGoogleAuth(false);
    setDriveFile(null);
    sound.playClick();
  };

  const toggleSound = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      sound.playClick();
    }
  };

  const unlockAchievement = useCallback((achievementId: string) => {
    setAchievements((prev) => {
      const idx = prev.findIndex((a) => a.id === achievementId);
      if (idx === -1 || prev[idx].unlocked) return prev;

      const target = prev[idx];
      const updated = [...prev];
      updated[idx] = {
        ...target,
        unlocked: true,
        unlockedAt: new Date().toISOString(),
      };

      // Add reward coins
      setStats((s) => ({
        ...s,
        coins: s.coins + target.rewardCoins,
      }));

      sound.playPowerup();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
      });

      return updated;
    });
  }, []);

  // Save current data to Google Drive
  const syncToDrive = async () => {
    setSyncStatus('syncing');
    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Bạn cần kết nối Google Drive trước.');
      }

      const currentSaveData: SaveData = {
        version: 1,
        updatedAt: new Date().toISOString(),
        playerId: user?.uid || 'guest_player',
        playerName: user?.displayName || 'PlayVerse Player',
        stats,
        achievements,
        inventory: shopItems.filter((i) => i.unlocked).map((i) => i.id),
        activeTheme,
      };

      const fileInfo = await uploadSaveToDrive(currentSaveData);
      setDriveFile(fileInfo);
      setLastSyncTime(new Date().toLocaleTimeString('vi-VN'));
      setSyncStatus('synced');
      sound.playPowerup();
      confetti({ particleCount: 60, spread: 80 });

      // Unlock achievement for cloud sync
      unlockAchievement('cloud_backup');
    } catch (err: unknown) {
      console.error('Error syncing to Google Drive:', err);
      setSyncStatus('error');
      throw err;
    }
  };

  // Restore data from Google Drive
  const restoreFromDrive = async (): Promise<boolean> => {
    setSyncStatus('syncing');
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Vui lòng đăng nhập Google.');

      const existingFile = await findSaveFileOnDrive();
      if (!existingFile) {
        throw new Error('Chưa tìm thấy bản sao lưu nào của PlayVerse trên Google Drive của bạn.');
      }

      const cloudData = await downloadSaveFromDrive(existingFile.id);

      // Merge stats
      if (cloudData.stats) {
        setStats(cloudData.stats);
      }
      if (cloudData.achievements) {
        setAchievements(cloudData.achievements);
      }
      if (cloudData.inventory) {
        setShopItems((prev) =>
          prev.map((item) => ({
            ...item,
            unlocked: item.unlocked || cloudData.inventory.includes(item.id),
          }))
        );
      }
      if (cloudData.activeTheme) {
        setActiveThemeState(cloudData.activeTheme);
      }

      setDriveFile(existingFile);
      setLastSyncTime(new Date().toLocaleTimeString('vi-VN'));
      setSyncStatus('synced');
      sound.playPowerup();
      confetti({ particleCount: 70, spread: 90 });
      return true;
    } catch (err: unknown) {
      console.error('Error restoring from Google Drive:', err);
      setSyncStatus('error');
      throw err;
    }
  };

  // Delete cloud save file
  const deleteCloudSave = async (): Promise<boolean> => {
    try {
      if (!driveFile?.id) {
        const found = await findSaveFileOnDrive();
        if (!found) return true;
        await deleteSaveFileFromDrive(found.id);
      } else {
        await deleteSaveFileFromDrive(driveFile.id);
      }
      setDriveFile(null);
      setSyncStatus('idle');
      sound.playPop();
      return true;
    } catch (err: unknown) {
      console.error('Error deleting cloud save:', err);
      throw err;
    }
  };

  // Record game result after playing
  const recordGameResult = (
    gameId: GameId,
    score: number,
    coinsEarned: number,
    metadata?: Record<string, unknown>
  ) => {
    setStats((prev) => {
      const newHighScores = {
        ...prev.highScores,
        [gameId]: Math.max(prev.highScores[gameId] || 0, score),
      };

      const newPlayedCount = {
        ...prev.gamesPlayedCount,
        [gameId]: (prev.gamesPlayedCount[gameId] || 0) + 1,
      };

      const newCoins = prev.coins + coinsEarned;

      return {
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
        totalScore: prev.totalScore + score,
        coins: newCoins,
        highScores: newHighScores,
        gamesPlayedCount: newPlayedCount,
      };
    });

    // Check achievement triggers
    unlockAchievement('first_play');

    if (gameId === 'snake' && score >= 50) {
      unlockAchievement('snake_50');
    }
    if (gameId === 'brick' && score >= 1000) {
      unlockAchievement('brick_1000');
    }
    if (gameId === '2048') {
      const maxTile = metadata?.maxTile as number | undefined;
      if (maxTile && maxTile >= 512) unlockAchievement('fusion_512');
      if (maxTile && maxTile >= 2048) unlockAchievement('fusion_2048');
    }
    if (gameId === 'memory') {
      const timeSeconds = metadata?.seconds as number | undefined;
      if (timeSeconds && timeSeconds <= 45) unlockAchievement('memory_ace');
    }
    if (gameId === 'flappy' && score >= 15) {
      unlockAchievement('bird_15');
    }
    if (gameId === 'math') {
      const streak = metadata?.streak as number | undefined;
      if (streak && streak >= 12) unlockAchievement('math_streak');
    }

    if (stats.coins + coinsEarned >= 500) {
      unlockAchievement('coin_500');
    }
  };

  const buyShopItem = (item: ShopItem): boolean => {
    if (item.unlocked) {
      if (item.type === 'theme') {
        setActiveThemeState(item.id);
        sound.playClick();
      }
      return true;
    }

    if (stats.coins < item.price) {
      sound.playGameOver();
      return false;
    }

    // Deduct coins and unlock
    setStats((prev) => ({
      ...prev,
      coins: prev.coins - item.price,
    }));

    setShopItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, unlocked: true } : i))
    );

    if (item.type === 'theme') {
      setActiveThemeState(item.id);
    }

    sound.playPowerup();
    confetti({ particleCount: 50, spread: 60 });
    return true;
  };

  const setActiveTheme = (themeId: string) => {
    setActiveThemeState(themeId);
    sound.playClick();
  };

  return (
    <GameContext.Provider
      value={{
        user,
        hasGoogleAuth,
        isLoggingIn,
        driveFile,
        syncStatus,
        lastSyncTime,
        stats,
        achievements,
        shopItems,
        activeTheme,
        isMuted,
        loginGoogle,
        logoutGoogle,
        syncToDrive,
        restoreFromDrive,
        deleteCloudSave,
        recordGameResult,
        buyShopItem,
        setActiveTheme,
        toggleSound,
        unlockAchievement,
        refreshDriveStatus,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
