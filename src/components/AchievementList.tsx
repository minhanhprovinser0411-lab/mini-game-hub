import React from 'react';
import { X, Award, CheckCircle2, Lock, Coins } from 'lucide-react';
import { useGame } from '../context/GameContext';

interface AchievementListProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AchievementList: React.FC<AchievementListProps> = ({ isOpen, onClose }) => {
  const { achievements, stats } = useGame();

  if (!isOpen) return null;

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const progressPercent = Math.round((unlockedCount / achievements.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-purple-500/30 rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl text-white relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-purple-400">
              <Award size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-300 to-pink-400 bg-clip-text text-transparent">
                Hệ Thống Thành Tựu
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Hoàn thành thử thách để nhận huy hiệu và Xu Arcade quý giá
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="my-5 bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
          <div className="flex justify-between items-center text-xs font-semibold mb-2">
            <span className="text-slate-300">Tiến độ mở khóa</span>
            <span className="text-purple-400">
              {unlockedCount} / {achievements.length} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 shadow-md shadow-purple-500/30"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                ach.unlocked
                  ? 'bg-purple-950/20 border-purple-500/40 text-purple-100'
                  : 'bg-slate-800/40 border-slate-800/80 text-slate-400 opacity-70'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                    ach.unlocked
                      ? 'bg-purple-500/20 border border-purple-500/30'
                      : 'bg-slate-800 border border-slate-700'
                  }`}
                >
                  {ach.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-100">{ach.title}</h4>
                    {ach.unlocked ? (
                      <CheckCircle2 size={15} className="text-emerald-400" />
                    ) : (
                      <Lock size={13} className="text-slate-500" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{ach.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl text-amber-300 font-bold text-xs shrink-0">
                <Coins size={13} />
                <span>+{ach.rewardCoins}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-200 underline transition-colors"
          >
            Đóng danh hiệu
          </button>
        </div>
      </div>
    </div>
  );
};
