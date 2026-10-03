import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, Trophy, Coins, Undo2, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGame } from '../context/GameContext';
import { sound } from '../services/audioService';

type Board = number[][];

const BOARD_SIZE = 4;

const TILE_COLORS: Record<number, { bg: string; text: string; shadow?: string }> = {
  2: { bg: 'bg-slate-800 text-slate-100', text: 'text-slate-100' },
  4: { bg: 'bg-cyan-950/70 text-cyan-200 border-cyan-800', text: 'text-cyan-200' },
  8: { bg: 'bg-cyan-600 text-white font-bold', text: 'text-white' },
  16: { bg: 'bg-teal-500 text-white font-bold', text: 'text-white' },
  32: { bg: 'bg-emerald-500 text-white font-bold', text: 'text-white' },
  64: { bg: 'bg-amber-500 text-white font-bold', text: 'text-white' },
  128: { bg: 'bg-orange-500 text-white font-bold shadow-lg shadow-orange-500/30', text: 'text-white' },
  256: { bg: 'bg-rose-500 text-white font-bold shadow-lg shadow-rose-500/30', text: 'text-white' },
  512: { bg: 'bg-purple-600 text-white font-bold shadow-xl shadow-purple-600/40', text: 'text-white' },
  1024: { bg: 'bg-indigo-600 text-white font-black shadow-xl shadow-indigo-600/50', text: 'text-white' },
  2048: { bg: 'bg-gradient-to-tr from-yellow-400 to-amber-500 text-black font-black shadow-2xl shadow-yellow-500/60 ring-2 ring-yellow-300', text: 'text-black' },
};

export const Game2048: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { stats, recordGameResult } = useGame();

  const [board, setBoard] = useState<Board>(() => createEmptyBoard());
  const [prevBoard, setPrevBoard] = useState<Board | null>(null);
  const [prevScore, setPrevScore] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [hasReached2048, setHasReached2048] = useState<boolean>(false);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const highScore = stats.highScores['2048'] || 0;

  function createEmptyBoard(): Board {
    return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
  }

  const addRandomTile = useCallback((currentBoard: Board): Board => {
    const emptyCells: { r: number; c: number }[] = [];
    currentBoard.forEach((row, r) => {
      row.forEach((val, c) => {
        if (val === 0) emptyCells.push({ r, c });
      });
    });

    if (emptyCells.length === 0) return currentBoard;

    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newBoard = currentBoard.map((row) => [...row]);
    newBoard[randomCell.r][randomCell.c] = Math.random() < 0.9 ? 2 : 4;
    return newBoard;
  }, []);

  const initGame = useCallback(() => {
    let b = createEmptyBoard();
    b = addRandomTile(b);
    b = addRandomTile(b);
    setBoard(b);
    setPrevBoard(null);
    setScore(0);
    setGameOver(false);
    setHasReached2048(false);
  }, [addRandomTile]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const checkGameOver = (currentBoard: Board): boolean => {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (currentBoard[r][c] === 0) return false;
        if (c < BOARD_SIZE - 1 && currentBoard[r][c] === currentBoard[r][c + 1]) return false;
        if (r < BOARD_SIZE - 1 && currentBoard[r][c] === currentBoard[r + 1][c]) return false;
      }
    }
    return true;
  };

  // Find max tile on current board
  const getMaxTile = (currentBoard: Board): number => {
    let max = 0;
    currentBoard.forEach((row) =>
      row.forEach((val) => {
        if (val > max) max = val;
      })
    );
    return max;
  };

  // Movement Logic
  const move = useCallback(
    (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
      if (gameOver) return;

      let changed = false;
      let pointsEarned = 0;
      const newBoard = board.map((row) => [...row]);

      const slide = (row: number[]): number[] => {
        let arr = row.filter((v) => v !== 0);
        for (let i = 0; i < arr.length - 1; i++) {
          if (arr[i] === arr[i + 1]) {
            arr[i] *= 2;
            pointsEarned += arr[i];
            arr[i + 1] = 0;
            if (arr[i] === 2048 && !hasReached2048) {
              setHasReached2048(true);
              sound.playPowerup();
              confetti({ particleCount: 100, spread: 80 });
            }
          }
        }
        arr = arr.filter((v) => v !== 0);
        while (arr.length < BOARD_SIZE) {
          arr.push(0);
        }
        return arr;
      };

      if (direction === 'LEFT') {
        for (let r = 0; r < BOARD_SIZE; r++) {
          const original = [...newBoard[r]];
          newBoard[r] = slide(newBoard[r]);
          if (original.some((v, idx) => v !== newBoard[r][idx])) changed = true;
        }
      } else if (direction === 'RIGHT') {
        for (let r = 0; r < BOARD_SIZE; r++) {
          const original = [...newBoard[r]];
          const reversed = [...newBoard[r]].reverse();
          const slided = slide(reversed).reverse();
          newBoard[r] = slided;
          if (original.some((v, idx) => v !== newBoard[r][idx])) changed = true;
        }
      } else if (direction === 'UP') {
        for (let c = 0; c < BOARD_SIZE; c++) {
          const col = [newBoard[0][c], newBoard[1][c], newBoard[2][c], newBoard[3][c]];
          const slided = slide(col);
          for (let r = 0; r < BOARD_SIZE; r++) {
            if (newBoard[r][c] !== slided[r]) changed = true;
            newBoard[r][c] = slided[r];
          }
        }
      } else if (direction === 'DOWN') {
        for (let c = 0; c < BOARD_SIZE; c++) {
          const col = [newBoard[3][c], newBoard[2][c], newBoard[1][c], newBoard[0][c]];
          const slided = slide(col);
          for (let r = 0; r < BOARD_SIZE; r++) {
            if (newBoard[3 - r][c] !== slided[r]) changed = true;
            newBoard[3 - r][c] = slided[r];
          }
        }
      }

      if (changed) {
        sound.playPop();
        setPrevBoard(board);
        setPrevScore(score);

        const boardWithNew = addRandomTile(newBoard);
        const nextScore = score + pointsEarned;
        setBoard(boardWithNew);
        setScore(nextScore);

        if (checkGameOver(boardWithNew)) {
          setGameOver(true);
          sound.playGameOver();
          const maxTile = getMaxTile(boardWithNew);
          const coins = Math.max(15, Math.floor(nextScore / 40));
          recordGameResult('2048', nextScore, coins, { maxTile });
        }
      }
    },
    [board, gameOver, hasReached2048, score, addRandomTile, recordGameResult]
  );

  // Undo button
  const handleUndo = () => {
    if (prevBoard) {
      setBoard(prevBoard);
      setScore(prevScore);
      setPrevBoard(null);
      sound.playClick();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'w', 'W'].includes(e.key)) {
        e.preventDefault();
        move('UP');
      } else if (['ArrowDown', 's', 'S'].includes(e.key)) {
        e.preventDefault();
        move('DOWN');
      } else if (['ArrowLeft', 'a', 'A'].includes(e.key)) {
        e.preventDefault();
        move('LEFT');
      } else if (['ArrowRight', 'd', 'D'].includes(e.key)) {
        e.preventDefault();
        move('RIGHT');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  // Touch Swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    const threshold = 35;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) move('RIGHT');
        else move('LEFT');
      }
    } else {
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) move('DOWN');
        else move('UP');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 text-white animate-fade-in select-none">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-800/80 transition-colors"
        >
          ← Quay lại Hub
        </button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            <Trophy size={14} />
            <span>Kỷ lục: {highScore}</span>
          </div>
          <div className="text-sm font-bold text-cyan-300">
            Điểm: {score}
          </div>
        </div>
      </div>

      {/* Control bar: Undo & Restart */}
      <div className="flex items-center justify-between mb-4 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={!prevBoard}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-all"
          >
            <Undo2 size={14} />
            <span>Đi lại</span>
          </button>
          <button
            onClick={initGame}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
          >
            <RotateCcw size={14} />
            <span>Chơi mới</span>
          </button>
        </div>

        <div className="text-xs text-slate-400">
          Ô cao nhất: <span className="font-bold text-amber-400">{getMaxTile(board)}</span>
        </div>
      </div>

      {/* Board 4x4 */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative bg-slate-950 p-3.5 rounded-3xl border-2 border-cyan-500/30 shadow-2xl aspect-square flex flex-col justify-between"
      >
        <div className="grid grid-cols-4 grid-rows-4 gap-2.5 h-full w-full">
          {board.map((row, r) =>
            row.map((val, c) => {
              const tileStyle = TILE_COLORS[val] || {
                bg: 'bg-purple-900 text-white font-black',
                text: 'text-white',
              };

              return (
                <div
                  key={`${r}-${c}`}
                  className={`rounded-2xl flex items-center justify-center font-extrabold transition-all duration-150 border border-white/5 ${
                    val === 0
                      ? 'bg-slate-900/70'
                      : `${tileStyle.bg} scale-100 animate-in zoom-in-75`
                  } ${
                    val >= 1024
                      ? 'text-lg sm:text-xl'
                      : val >= 128
                      ? 'text-xl sm:text-2xl'
                      : 'text-2xl sm:text-3xl'
                  }`}
                >
                  {val > 0 && val}
                </div>
              );
            })
          )}
        </div>

        {/* Game Over Dialog */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <div className="text-4xl mb-2">🏁</div>
            <h3 className="text-2xl font-black text-amber-400 mb-1">HẾT NƯỚC ĐI</h3>
            <p className="text-slate-300 text-sm mb-4">
              Điểm số: <span className="font-bold text-amber-300">{score}</span> | Ô lớn nhất:{' '}
              <span className="font-bold text-cyan-400">{getMaxTile(board)}</span>
            </p>
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-xl text-amber-300 text-xs font-bold mb-6">
              <Coins size={16} />
              <span>+{Math.max(15, Math.floor(score / 40))} Xu Arcade</span>
            </div>
            <button
              onClick={initGame}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold flex items-center gap-2 shadow-lg shadow-amber-500/30 active:scale-95 transition-all"
            >
              <RotateCcw size={18} />
              <span>Thử Lại Ván Khác</span>
            </button>
          </div>
        )}
      </div>

      {/* Swipe tip */}
      <p className="text-center text-xs text-slate-500 mt-4">
        Vuốt trên màn hình hoặc dùng 4 phím Mũi Tên / WASD để gộp số
      </p>
    </div>
  );
};
