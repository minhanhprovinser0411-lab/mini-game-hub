import React from 'react';
import {
  Gamepad2,
  Coins,
  Volume2,
  VolumeX,
  Trophy,
  Award,
  ShoppingBag,
  Cloud,
  CheckCircle2,
} from 'lucide-react';
import { useGame } from '../context/GameContext';

interface NavbarProps {
  onOpenLeaderboard: () => void;
  onOpenAchievements: () => void;
  onOpenShop: () => void;
  onOpenDrive: () => void;
  onGoHome: () => void;
  activeGameTitle?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenLeaderboard,
  onOpenAchievements,
  onOpenShop,
  onOpenDrive,
  onGoHome,
  activeGameTitle,
}) => {
  const { stats, isMuted, toggleSound, hasGoogleAuth, user, driveFile, achievements } = useGame();

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onGoHome}
            className="flex items-center gap-2.5 text-left group transition-transform active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-pink-500 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-cyan-400 group-hover:text-pink-400 transition-colors">
                <Gamepad2 size={22} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-teal-300 to-pink-400 bg-clip-text text-transparent">
                  PlayVerse
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hidden sm:inline-block">
                  Arcade
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Minigame Hub & Cloud Saves
              </p>
            </div>
          </button>

          {activeGameTitle && (
            <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-800 text-sm">
              <span className="text-slate-500">/</span>
              <span className="font-semibold text-slate-200">{activeGameTitle}</span>
            </div>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Coins Badge */}
          <div
            onClick={onOpenShop}
            title="Xu Arcade - Nhấn để mở Cửa Hàng"
            className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded-full cursor-pointer transition-all active:scale-95"
          >
            <Coins size={16} className="text-amber-400 animate-pulse" />
            <span className="text-xs sm:text-sm font-bold text-amber-300">
              {stats.coins.toLocaleString()}
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'Bật âm thanh retro' : 'Tắt âm thanh'}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX size={18} className="text-slate-500" /> : <Volume2 size={18} className="text-cyan-400" />}
          </button>

          {/* Leaderboard button */}
          <button
            onClick={onOpenLeaderboard}
            title="Bảng xếp hạng & Kỷ lục"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-amber-400 transition-colors"
          >
            <Trophy size={18} />
          </button>

          {/* Achievements button with count */}
          <button
            onClick={onOpenAchievements}
            title="Thành tựu đã mở khóa"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-purple-400 transition-colors relative"
          >
            <Award size={18} />
            {unlockedCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unlockedCount}
              </span>
            )}
          </button>

          {/* Shop button */}
          <button
            onClick={onOpenShop}
            title="Cửa hàng Arcade"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 transition-colors hidden sm:flex"
          >
            <ShoppingBag size={18} />
          </button>

          {/* Google Drive Status / Connect Button */}
          <button
            onClick={onOpenDrive}
            title="Đồng bộ Google Drive"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              hasGoogleAuth
                ? 'bg-blue-950/40 border-blue-500/40 text-blue-300 hover:bg-blue-900/40'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
          >
            <Cloud size={16} className={hasGoogleAuth ? 'text-blue-400' : 'text-slate-400'} />
            {hasGoogleAuth ? (
              <span className="hidden sm:inline-block flex items-center gap-1">
                Drive Synced
                {driveFile && <CheckCircle2 size={12} className="text-emerald-400 inline" />}
              </span>
            ) : (
              <span className="hidden sm:inline-block">Google Drive</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
