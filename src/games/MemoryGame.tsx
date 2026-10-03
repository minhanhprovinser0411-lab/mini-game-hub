import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Trophy, Coins, Clock, Footprints, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGame } from '../context/GameContext';
import { sound } from '../services/audioService';

interface Card {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const ALL_SYMBOLS = ['👾', '🚀', '💎', '⚡', '🕹️', '🔮', '🛸', '🤖', '🪐', '🎯', '👑', '🔥'];

export const MemoryGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { stats, recordGameResult } = useGame();

  const [pairCount, setPairCount] = useState<number>(8); // 8 pairs = 16 cards (4x4)
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);
  const [isGameActive, setIsGameActive] = useState<boolean>(false);
  const [hasWon, setHasWon] = useState<boolean>(false);

  const highScore = stats.highScores['memory'] || 0;

  const initGame = useCallback(
    (pairs: number = pairCount) => {
      const selected = ALL_SYMBOLS.slice(0, pairs);
      const deck: Card[] = [...selected, ...selected]
        .sort(() => Math.random() - 0.5)
        .map((symbol, idx) => ({
          id: idx,
          symbol,
          isFlipped: false,
          isMatched: false,
        }));

      setCards(deck);
      setFlippedIndices([]);
      setMoves(0);
      setSeconds(0);
      setIsGameActive(true);
      setHasWon(false);
      sound.playPowerup();
    },
    [pairCount]
  );

  useEffect(() => {
    initGame(pairCount);
  }, [initGame, pairCount]);

  // Timer loop
  useEffect(() => {
    if (!isGameActive || hasWon) return;
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isGameActive, hasWon]);

  const handleCardClick = (index: number) => {
    if (!isGameActive || hasWon) return;
    if (cards[index].isFlipped || cards[index].isMatched) return;
    if (flippedIndices.length >= 2) return;

    sound.playClick();
    const nextFlipped = [...flippedIndices, index];
    setFlippedIndices(nextFlipped);

    setCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, isFlipped: true } : c))
    );

    if (nextFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = nextFlipped;

      if (cards[firstIdx].symbol === cards[secondIdx].symbol) {
        // Matched!
        setTimeout(() => {
          sound.playCoin();
          setCards((prev) => {
            const updated = prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isMatched: true } : c
            );

            // Check if all matched
            if (updated.every((c) => c.isMatched)) {
              setHasWon(true);
              sound.playPowerup();
              confetti({ particleCount: 80, spread: 70 });

              // Calculate final score: (pairs * 100) - (seconds * 2) - (moves * 3)
              const computedScore = Math.max(
                50,
                pairCount * 150 - seconds * 2 - (moves + 1) * 4
              );
              const coins = Math.max(15, Math.floor(computedScore / 10));
              recordGameResult('memory', computedScore, coins, { seconds });
            }
            return updated;
          });
          setFlippedIndices([]);
        }, 350);
      } else {
        // Not matched - flip back after brief reveal
        setTimeout(() => {
          sound.playPop();
          setCards((prev) =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedIndices([]);
        }, 800);
      }
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 text-white animate-fade-in select-none">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-800/80 transition-colors"
        >
          ← Quay lại Hub
        </button>
        <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          <Trophy size={14} />
          <span>Kỷ lục: {highScore} điểm</span>
        </div>
      </div>

      {/* Difficulty selector & game stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5 bg-slate-900/70 p-3.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setPairCount(6);
              initGame(6);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              pairCount === 6
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Dễ (6 Cặp)
          </button>
          <button
            onClick={() => {
              setPairCount(8);
              initGame(8);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              pairCount === 8
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Vừa (8 Cặp)
          </button>
          <button
            onClick={() => {
              setPairCount(10);
              initGame(10);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              pairCount === 10
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Khó (10 Cặp)
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1 text-cyan-300">
            <Clock size={14} />
            <span>{seconds}s</span>
          </div>
          <div className="flex items-center gap-1 text-slate-300">
            <Footprints size={14} />
            <span>{moves} lượt</span>
          </div>
          <button
            onClick={() => initGame(pairCount)}
            title="Làm mới bàn chơi"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div
        className={`grid gap-2.5 sm:gap-3.5 p-4 rounded-3xl bg-slate-950 border-2 border-purple-500/30 shadow-2xl relative ${
          pairCount === 6
            ? 'grid-cols-3 sm:grid-cols-4'
            : pairCount === 8
            ? 'grid-cols-4'
            : 'grid-cols-4 sm:grid-cols-5'
        }`}
      >
        {cards.map((card, idx) => {
          const isRevealed = card.isFlipped || card.isMatched;

          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(idx)}
              disabled={card.isMatched}
              className={`aspect-square rounded-2xl flex items-center justify-center text-3xl sm:text-4xl transition-all duration-300 transform perspective-1000 ${
                card.isMatched
                  ? 'bg-purple-950/40 border border-purple-500/30 text-purple-200 opacity-60 scale-95'
                  : isRevealed
                  ? 'bg-gradient-to-tr from-purple-600 to-pink-500 border border-purple-300 text-white shadow-lg shadow-purple-500/40 rotate-y-0 scale-100'
                  : 'bg-slate-800 hover:bg-slate-750 border border-slate-700/80 hover:border-purple-500/40 text-transparent active:scale-95'
              }`}
            >
              {isRevealed ? (
                <span>{card.symbol}</span>
              ) : (
                <Sparkles size={20} className="text-slate-600" />
              )}
            </button>
          );
        })}

        {/* Win overlay */}
        {hasWon && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-2xl font-black text-purple-400 mb-1">XUẤT SẮC!</h3>
            <p className="text-slate-300 text-sm mb-4">
              Thời gian: <span className="font-bold text-amber-300">{seconds} giây</span> với{' '}
              <span className="font-bold text-cyan-300">{moves} lượt lật</span>!
            </p>
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-xl text-amber-300 text-xs font-bold mb-6">
              <Coins size={16} />
              <span>+{Math.max(15, Math.floor((pairCount * 150 - seconds * 2) / 10))} Xu Arcade</span>
            </div>
            <button
              onClick={() => initGame(pairCount)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold flex items-center gap-2 shadow-lg shadow-purple-500/30 active:scale-95 transition-all"
            >
              <RotateCcw size={18} />
              <span>Chơi Lại Ván Mới</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
