export type GameId = 'snake' | 'brick' | '2048' | 'memory' | 'flappy' | 'math';

export interface GameInfo {
  id: GameId;
  title: string;
  subtitle: string;
  icon: string;
  category: 'Arcade' | 'Puzzle' | 'Phản Xạ' | 'Trí Tuệ';
  color: string;
  gradient: string;
  description: string;
}

export interface PlayerStats {
  gamesPlayed: number;
  totalScore: number;
  coins: number;
  streakDays: number;
  lastPlayedDate: string;
  highScores: Record<GameId, number>;
  gamesPlayedCount: Record<GameId, number>;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rewardCoins: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: { current: number; max: number };
}

export interface ShopItem {
  id: string;
  name: string;
  type: 'theme' | 'skin';
  price: number;
  description: string;
  unlocked: boolean;
  icon: string;
}

export interface SaveData {
  version: number;
  updatedAt: string;
  playerId: string;
  playerName: string;
  stats: PlayerStats;
  achievements: Achievement[];
  inventory: string[];
  activeTheme: string;
}

export interface DriveFileInfo {
  id: string;
  name: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
}
