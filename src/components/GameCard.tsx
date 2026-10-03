import React from 'react';
import { Play, Trophy, Gamepad2, ArrowRight } from 'lucide-react';
import { GameInfo, GameId } from '../types';
import { useGame } from '../context/GameContext';

interface GameCardProps {
  game: GameInfo;
  onSelect: (gameId: GameId) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onSelect }) => {
  const { stats } = useGame();

  const highScore = stats.highScores[game.id] || 0;
  const playCount = stats.gamesPlayedCount[game.id] || 0;

  return (
    <div
      onClick={() => onSelect(game.id)}
      className="group relative rounded-3xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 p-5 sm:p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-900/20 hover:-translate-y-1 cursor-pointer flex flex-col justify-between overflow-hidden"
    >
      {/* Decorative gradient glow on hover */}
      <div
        className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity ${game.gradient}`}
      />

      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg border border-white/10 group-hover:scale-110 transition-transform ${game.gradient}`}
          >
            {game.icon}
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
            {game.category}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-black text-slate-100 group-hover:text-cyan-300 transition-colors">
          {game.title}
        </h3>
        <p className="text-xs text-cyan-400/80 font-medium mb-2">{game.subtitle}</p>
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {game.description}
        </p>
      </div>

      {/* Footer stats & Play Action */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-amber-300 font-semibold">
            <Trophy size={13} className="text-amber-400" />
            <span>{highScore.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500 text-[11px]">
            <Gamepad2 size={13} />
            <span>{playCount} ván</span>
          </div>
        </div>

        <button
          className="flex items-center gap-1 text-xs font-bold text-slate-200 group-hover:text-white bg-slate-800 group-hover:bg-cyan-600 px-3 py-1.5 rounded-xl transition-all shadow-sm group-hover:shadow-md group-hover:shadow-cyan-600/30"
        >
          <span>Chơi</span>
          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
