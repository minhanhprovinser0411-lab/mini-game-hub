import React, { useState } from 'react';
import { X, Trophy, Medal, Award, Flame, Gamepad2 } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { GameId } from '../types';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGame?: GameId;
}

const GAMES_LIST: { id: GameId; name: string; icon: string; unit: string }[] = [
  { id: 'snake', name: 'Rắn Săn Mồi', icon: '🐍', unit: 'điểm' },
  { id: 'brick', name: 'Phá Gạch Ánh Sáng', icon: '🧱', unit: 'điểm' },
  { id: '2048', name: '2048 Neon Fusion', icon: '✨', unit: 'điểm' },
  { id: 'memory', name: 'Lật Thẻ Trí Nhớ', icon: '🧠', unit: 'điểm' },
  { id: 'flappy', name: 'Cánh Chim Phiêu Lưu', icon: '🪶', unit: 'cột' },
  { id: 'math', name: 'Đấu Trí Toán Học', icon: '⚡', unit: 'điểm' },
];

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  initialGame = 'snake',
}) => {
  const { stats, user } = useGame();
  const [selectedGame, setSelectedGame] = useState<GameId>(initialGame);

  if (!isOpen) return null;

  const currentHighScore = stats.highScores[selectedGame] || 0;
  const currentPlays = stats.gamesPlayedCount[selectedGame] || 0;
  const gameInfo = GAMES_LIST.find((g) => g.id === selectedGame) || GAMES_LIST[0];

  // Hall of fame sample records with player ranking
  const simulatedLeaderboard = [
    { rank: 1, name: 'CyberDragon_VN', score: Math.max(currentHighScore + 120, 240), badge: '👑' },
    { rank: 2, name: 'ArcadeQueen_99', score: Math.max(currentHighScore + 60, 180), badge: '🥈' },
    { rank: 3, name: user?.displayName || 'Bạn (Hiện tại)', score: currentHighScore, badge: '🥉', isUser: true },
    { rank: 4, name: 'PixelNinja_PRO', score: Math.max(Math.floor(currentHighScore * 0.8), 90), badge: '⭐' },
    { rank: 5, name: 'GamerZero', score: Math.max(Math.floor(currentHighScore * 0.6), 50), badge: '⚡' },
  ].sort((a, b) => b.score - a.score).map((item, idx) => ({ ...item, rank: idx + 1 }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl text-white relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
              <Trophy size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">
                Bảng Vinh Danh Arcade
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Kỷ lục điểm số cao nhất của các game thủ PlayVerse
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

        {/* Game Tabs */}
        <div className="flex gap-2 overflow-x-auto py-3 my-2 scrollbar-none">
          {GAMES_LIST.map((game) => (
            <button
              key={game.id}
              onClick={() => setSelectedGame(game.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                selectedGame === game.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-bold'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <span>{game.icon}</span>
              <span>{game.name}</span>
            </button>
          ))}
        </div>

        {/* Player Personal Stat Highlight */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-900 border border-amber-500/20 rounded-2xl p-4 my-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl">
              {gameInfo.icon}
            </div>
            <div>
              <span className="text-xs text-slate-400">Kỷ lục cá nhân của bạn</span>
              <div className="text-2xl font-black text-amber-300">
                {currentHighScore.toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-400">{gameInfo.unit}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Số trận đã đấu</span>
            <div className="text-lg font-bold text-slate-200 flex items-center justify-end gap-1">
              <Gamepad2 size={16} className="text-amber-400" />
              <span>{currentPlays} ván</span>
            </div>
          </div>
        </div>

        {/* Ranking List */}
        <div className="space-y-2 mt-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block px-1">
            Top 5 Cao Thủ - {gameInfo.name}
          </span>
          {simulatedLeaderboard.map((player) => (
            <div
              key={player.name}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                player.isUser
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                  : 'bg-slate-800/40 border-slate-800 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    player.rank === 1
                      ? 'bg-amber-500 text-black'
                      : player.rank === 2
                      ? 'bg-slate-300 text-black'
                      : player.rank === 3
                      ? 'bg-amber-700 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {player.rank}
                </span>
                <span className="font-semibold text-sm flex items-center gap-1.5">
                  {player.name}
                  {player.isUser && (
                    <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.2 rounded font-bold">
                      BẠN
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-base text-amber-300">
                  {player.score.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400">{gameInfo.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-200 underline transition-colors"
          >
            Đóng bảng xếp hạng
          </button>
        </div>
      </div>
    </div>
  );
};
