import React, { useState } from 'react';
import {
  Gamepad2,
  Trophy,
  Award,
  ShoppingBag,
  Cloud,
  Sparkles,
  Shuffle,
  Search,
  CheckCircle2,
  ChevronRight,
  Flame,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { GameProvider, useGame } from './context/GameContext';
import { Navbar } from './components/Navbar';
import { GameCard } from './components/GameCard';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { AchievementList } from './components/AchievementList';
import { ShopModal } from './components/ShopModal';
import { GameId, GameInfo } from './types';
import { sound } from './services/audioService';

// Minigames
import { SnakeGame } from './games/SnakeGame';
import { BrickBreakerGame } from './games/BrickBreakerGame';
import { Game2048 } from './games/Game2048';
import { MemoryGame } from './games/MemoryGame';
import { FlappyBirdGame } from './games/FlappyBirdGame';
import { SpeedMathGame } from './games/SpeedMathGame';

const MINIGAMES: GameInfo[] = [
  {
    id: 'snake',
    title: 'Rắn Săn Mồi Neon',
    subtitle: 'Kinh điển & Bùng nổ tốc độ',
    icon: '🐍',
    category: 'Arcade',
    color: '#06b6d4',
    gradient: 'bg-gradient-to-tr from-cyan-600 to-teal-500',
    description: 'Điều khiển rắn săn các loại táo năng lượng, ngôi sao vàng và băng tinh né tránh tường và đuôi.',
  },
  {
    id: 'brick',
    title: 'Phá Gạch Ánh Sáng',
    subtitle: 'Vật lý nảy góc & Vật phẩm bom',
    icon: '🧱',
    category: 'Arcade',
    color: '#ec4899',
    gradient: 'bg-gradient-to-tr from-pink-600 to-rose-500',
    description: 'Bắn bóng phá tan các lớp gạch kiên cố, kích nổ gạch bom và bắt lấy ngọc nâng cấp thanh đỡ.',
  },
  {
    id: '2048',
    title: '2048 Neon Fusion',
    subtitle: 'Giải đố chiến thuật & Ghép ô',
    icon: '✨',
    category: 'Puzzle',
    color: '#f59e0b',
    gradient: 'bg-gradient-to-tr from-amber-500 to-yellow-400',
    description: 'Trượt các ô số cùng giá trị để hợp nhất thành ô 2048 huyền thoại với tính năng hoàn tác (Undo).',
  },
  {
    id: 'memory',
    title: 'Lật Thẻ Trí Nhớ',
    subtitle: 'Rèn luyện phản xạ ghi nhớ',
    icon: '🧠',
    category: 'Trí Tuệ',
    color: '#8b5cf6',
    gradient: 'bg-gradient-to-tr from-purple-600 to-indigo-500',
    description: 'Tìm kiếm và lật các cặp biểu tượng tương ứng nhanh nhất có thể với 3 cấp độ thử thách.',
  },
  {
    id: 'flappy',
    title: 'Cánh Chim Phiêu Lưu',
    subtitle: 'Vượt chướng ngại vật trên không',
    icon: '🪶',
    category: 'Phản Xạ',
    color: '#10b981',
    gradient: 'bg-gradient-to-tr from-emerald-500 to-teal-600',
    description: 'Giữ thăng bằng và đập cánh vượt qua những đường ống hẹp cùng các đồng xu thưởng bay lơ lửng.',
  },
  {
    id: 'math',
    title: 'Đấu Trí Toán Học',
    subtitle: 'Siêu tốc 5 giây & Chuỗi Fever',
    icon: '⚡',
    category: 'Trí Tuệ',
    color: '#3b82f6',
    gradient: 'bg-gradient-to-tr from-blue-600 to-cyan-500',
    description: 'Giải nhanh các phép tính trong 5 giây tích tắc, duy trì chuỗi bất bại để nhân 4 lần số điểm!',
  },
];

const MainContent: React.FC = () => {
  const { stats, activeTheme, hasGoogleAuth, driveFile } = useGame();

  const [activeGameId, setActiveGameId] = useState<GameId | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isDriveOpen, setIsDriveOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);

  const activeGame = MINIGAMES.find((g) => g.id === activeGameId);

  const categories = ['Tất cả', 'Arcade', 'Puzzle', 'Phản Xạ', 'Trí Tuệ'];

  const filteredGames = MINIGAMES.filter((g) => {
    const matchesCategory = selectedCategory === 'Tất cả' || g.category === selectedCategory;
    const matchesSearch =
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleRandomPlay = () => {
    sound.playPowerup();
    const randomIndex = Math.floor(Math.random() * MINIGAMES.length);
    setActiveGameId(MINIGAMES[randomIndex].id);
  };

  const handleSelectGame = (gameId: GameId) => {
    sound.playClick();
    setActiveGameId(gameId);
  };

  // Theme wrapper classes
  const getThemeClass = () => {
    switch (activeTheme) {
      case 'theme_retro':
        return 'bg-[#0f0e17] text-[#fffffe]';
      case 'theme_sunset':
        return 'bg-[#180a24] text-[#fbe5ff]';
      case 'theme_matrix':
        return 'bg-[#030d06] text-[#bbf7d0]';
      default:
        return 'bg-slate-950 text-slate-100';
    }
  };

  return (
    <div className={`min-h-screen ${getThemeClass()} flex flex-col font-sans transition-colors duration-300`}>
      {/* Top Navbar */}
      <Navbar
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenAchievements={() => setIsAchievementsOpen(true)}
        onOpenShop={() => setIsShopOpen(true)}
        onOpenDrive={() => setIsDriveOpen(true)}
        onGoHome={() => setActiveGameId(null)}
        activeGameTitle={activeGame?.title}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {activeGameId ? (
          // Active Game Screen
          <div>
            {activeGameId === 'snake' && <SnakeGame onBack={() => setActiveGameId(null)} />}
            {activeGameId === 'brick' && <BrickBreakerGame onBack={() => setActiveGameId(null)} />}
            {activeGameId === '2048' && <Game2048 onBack={() => setActiveGameId(null)} />}
            {activeGameId === 'memory' && <MemoryGame onBack={() => setActiveGameId(null)} />}
            {activeGameId === 'flappy' && <FlappyBirdGame onBack={() => setActiveGameId(null)} />}
            {activeGameId === 'math' && <SpeedMathGame onBack={() => setActiveGameId(null)} />}
          </div>
        ) : (
          // Hub View
          <div className="space-y-8 animate-fade-in">
            {/* Hero Banner */}
            <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-cyan-500/20 p-6 sm:p-8 overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-3">
                    <Sparkles size={14} />
                    <span>Trung Tâm Minigame Arcade Đỉnh Cao</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                    Chơi Game Thả Ga,{' '}
                    <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-pink-400 bg-clip-text text-transparent">
                      Lưu Trữ Google Drive
                    </span>
                  </h1>
                  <p className="text-slate-400 text-sm sm:text-base max-w-xl mt-2 leading-relaxed">
                    Khám phá 6 trò chơi arcade hấp dẫn, vượt qua các thử thách để nhận Xu Arcade và đồng bộ dữ liệu an toàn lên tài khoản Google Drive của bạn.
                  </p>
                </div>

                {/* Quick Action Hub Buttons */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                  <button
                    onClick={handleRandomPlay}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
                  >
                    <Shuffle size={18} />
                    <span>Chơi Ngẫu Nhiên</span>
                  </button>

                  <button
                    onClick={() => setIsDriveOpen(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 font-bold text-sm shadow-lg active:scale-95 transition-all"
                  >
                    <Cloud size={18} />
                    <span>{hasGoogleAuth ? 'Quản Lý Cloud Drive' : 'Đồng Bộ Drive'}</span>
                  </button>
                </div>
              </div>

              {/* Quick Player Stats Bar */}
              <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                    <Gamepad2 size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Tổng Trận Đấu</span>
                    <span className="text-lg font-bold text-slate-100">{stats.gamesPlayed} ván</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                    <Trophy size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Tổng Điểm Tích Lũy</span>
                    <span className="text-lg font-bold text-amber-300">{stats.totalScore.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                    <Award size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Xu Arcade</span>
                    <span className="text-lg font-bold text-purple-300">{stats.coins.toLocaleString()} xu</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Google Drive</span>
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                      {hasGoogleAuth ? 'Đã liên kết' : 'Chưa liên kết'}
                      {hasGoogleAuth && <CheckCircle2 size={13} />}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters & Search Header */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              {/* Category Pills */}
              <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                        : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative min-w-[240px]">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Tìm kiếm minigame..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Minigames Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredGames.map((game) => (
                <GameCard key={game.id} game={game} onSelect={handleSelectGame} />
              ))}
            </div>

            {filteredGames.length === 0 && (
              <div className="py-12 text-center text-slate-500">
                <p className="text-sm">Không tìm thấy minigame phù hợp với từ khóa.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950/60 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">PlayVerse Arcade Hub</span>
            <span>•</span>
            <span>Tích hợp lưu trữ đám mây Google Drive an toàn</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setIsLeaderboardOpen(true)}
              className="hover:text-amber-400 transition-colors"
            >
              Kỷ Lục
            </button>
            <button
              onClick={() => setIsAchievementsOpen(true)}
              className="hover:text-purple-400 transition-colors"
            >
              Thành Tựu
            </button>
            <button
              onClick={() => setIsShopOpen(true)}
              className="hover:text-emerald-400 transition-colors"
            >
              Cửa Hàng
            </button>
            <button
              onClick={() => setIsDriveOpen(true)}
              className="hover:text-cyan-400 transition-colors"
            >
              Google Drive
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <GoogleDriveModal isOpen={isDriveOpen} onClose={() => setIsDriveOpen(false)} />
      <LeaderboardModal isOpen={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)} />
      <AchievementList isOpen={isAchievementsOpen} onClose={() => setIsAchievementsOpen(false)} />
      <ShopModal isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <GameProvider>
      <MainContent />
    </GameProvider>
  );
}
