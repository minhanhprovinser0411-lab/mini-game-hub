import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  RotateCcw,
  Pause,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Trophy,
  Coins,
  Sparkles,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { sound } from '../services/audioService';

const GRID_SIZE = 20;
const CELL_SIZE = 20; // 400x400 canvas

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
interface Point {
  x: number;
  y: number;
}
interface FoodItem extends Point {
  type: 'normal' | 'gold' | 'freeze';
}

export const SnakeGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { stats, recordGameResult, activeTheme } = useGame();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [snake, setSnake] = useState<Point[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
  ]);
  const [direction, setDirection] = useState<Direction>('UP');
  const [nextDirection, setNextDirection] = useState<Direction>('UP');
  const [food, setFood] = useState<FoodItem>({ x: 10, y: 5, type: 'normal' });
  const [score, setScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speedMs, setSpeedMs] = useState<number>(120);

  const highScore = stats.highScores['snake'] || 0;

  // Generate random food not on snake body
  const spawnFood = useCallback((currentSnake: Point[]): FoodItem => {
    let newFood: FoodItem;
    let collision: boolean;
    do {
      const rx = Math.floor(Math.random() * GRID_SIZE);
      const ry = Math.floor(Math.random() * GRID_SIZE);
      const randType = Math.random();
      const type: 'normal' | 'gold' | 'freeze' =
        randType > 0.85 ? 'gold' : randType > 0.7 ? 'freeze' : 'normal';

      newFood = { x: rx, y: ry, type };
      collision = currentSnake.some((seg) => seg.x === rx && seg.y === ry);
    } while (collision);

    return newFood;
  }, []);

  const startGame = () => {
    const initSnake = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];
    setSnake(initSnake);
    setDirection('UP');
    setNextDirection('UP');
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    setIsPlaying(true);
    setSpeedMs(120);
    setFood(spawnFood(initSnake));
    sound.playPowerup();
  };

  const handleGameOver = useCallback(
    (finalScore: number) => {
      setGameOver(true);
      setIsPlaying(false);
      sound.playGameOver();
      const coinsEarned = Math.max(10, Math.floor(finalScore / 3));
      recordGameResult('snake', finalScore, coinsEarned);
    },
    [recordGameResult]
  );

  // Key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' && isPlaying) {
        setIsPaused((p) => !p);
        return;
      }

      if (['ArrowUp', 'w', 'W'].includes(e.key) && direction !== 'DOWN') {
        setNextDirection('UP');
      } else if (['ArrowDown', 's', 'S'].includes(e.key) && direction !== 'UP') {
        setNextDirection('DOWN');
      } else if (['ArrowLeft', 'a', 'A'].includes(e.key) && direction !== 'RIGHT') {
        setNextDirection('LEFT');
      } else if (['ArrowRight', 'd', 'D'].includes(e.key) && direction !== 'LEFT') {
        setNextDirection('RIGHT');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, isPlaying]);

  // Main game loop
  useEffect(() => {
    if (!isPlaying || isPaused || gameOver) return;

    const timer = setInterval(() => {
      setDirection(nextDirection);
      setSnake((prevSnake) => {
        const head = { ...prevSnake[0] };
        switch (nextDirection) {
          case 'UP':
            head.y -= 1;
            break;
          case 'DOWN':
            head.y += 1;
            break;
          case 'LEFT':
            head.x -= 1;
            break;
          case 'RIGHT':
            head.x += 1;
            break;
        }

        // Wall collision check
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          handleGameOver(score);
          return prevSnake;
        }

        // Self collision check
        if (prevSnake.some((seg) => seg.x === head.x && seg.y === head.y)) {
          handleGameOver(score);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Food collision
        if (head.x === food.x && head.y === food.y) {
          sound.playCoin();
          let pointIncrement = 10;
          if (food.type === 'gold') pointIncrement = 35;
          if (food.type === 'freeze') pointIncrement = 20;

          setScore((s) => s + pointIncrement);
          setFood(spawnFood(newSnake));

          // Speed up slightly as snake grows
          setSpeedMs((prev) => Math.max(65, prev - 1.5));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, speedMs);

    return () => clearInterval(timer);
  }, [isPlaying, isPaused, gameOver, nextDirection, food, speedMs, score, handleGameOver, spawnFood]);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = activeTheme === 'theme_matrix' ? '#05180a' : '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid lines
    ctx.strokeStyle = activeTheme === 'theme_matrix' ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(canvas.width, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw Food
    const fx = food.x * CELL_SIZE + CELL_SIZE / 2;
    const fy = food.y * CELL_SIZE + CELL_SIZE / 2;
    const radius = CELL_SIZE / 2 - 2;

    ctx.save();
    if (food.type === 'gold') {
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 12;
    } else if (food.type === 'freeze') {
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 12;
    } else {
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 10;
    }
    ctx.beginPath();
    ctx.arc(fx, fy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw Snake
    snake.forEach((seg, index) => {
      const sx = seg.x * CELL_SIZE + 1;
      const sy = seg.y * CELL_SIZE + 1;
      const size = CELL_SIZE - 2;

      ctx.save();
      if (index === 0) {
        // Head
        ctx.fillStyle = activeTheme === 'theme_matrix' ? '#22c55e' : '#06b6d4';
        ctx.shadowColor = activeTheme === 'theme_matrix' ? '#16a34a' : '#0891b2';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(sx, sy, size, size, 5);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#ffffff';
        const eyeOffset = 4;
        let e1 = { x: sx + eyeOffset, y: sy + eyeOffset };
        let e2 = { x: sx + size - eyeOffset, y: sy + eyeOffset };
        if (direction === 'DOWN') {
          e1 = { x: sx + eyeOffset, y: sy + size - eyeOffset };
          e2 = { x: sx + size - eyeOffset, y: sy + size - eyeOffset };
        } else if (direction === 'LEFT') {
          e1 = { x: sx + eyeOffset, y: sy + eyeOffset };
          e2 = { x: sx + eyeOffset, y: sy + size - eyeOffset };
        } else if (direction === 'RIGHT') {
          e1 = { x: sx + size - eyeOffset, y: sy + eyeOffset };
          e2 = { x: sx + size - eyeOffset, y: sy + size - eyeOffset };
        }
        ctx.beginPath();
        ctx.arc(e1.x, e1.y, 2, 0, Math.PI * 2);
        ctx.arc(e2.x, e2.y, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Body gradient
        const alpha = Math.max(0.35, 1 - (index / snake.length) * 0.65);
        ctx.fillStyle =
          activeTheme === 'theme_matrix'
            ? `rgba(74, 222, 128, ${alpha})`
            : `rgba(45, 212, 191, ${alpha})`;
        ctx.beginPath();
        ctx.roundRect(sx, sy, size, size, 3);
        ctx.fill();
      }
      ctx.restore();
    });
  }, [snake, food, direction, activeTheme]);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 text-white animate-fade-in">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-800/80 transition-colors"
        >
          ← Quay lại Hub
        </button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            <Trophy size={14} />
            <span>Kỷ lục: {highScore}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-bold text-cyan-300">
            <span>Điểm: {score}</span>
          </div>
        </div>
      </div>

      {/* Main Play Area */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-6">
        <div className="relative rounded-2xl overflow-hidden border-2 border-cyan-500/30 shadow-2xl shadow-cyan-950/50 bg-slate-950">
          <canvas
            ref={canvasRef}
            width={GRID_SIZE * CELL_SIZE}
            height={GRID_SIZE * CELL_SIZE}
            className="block"
          />

          {/* Overlay when game over or not playing */}
          {(!isPlaying || gameOver) && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
              {gameOver ? (
                <>
                  <div className="text-4xl mb-2">💥</div>
                  <h3 className="text-2xl font-black text-red-400 mb-1">TRÒ CHƠI KẾT THÚC</h3>
                  <p className="text-slate-300 text-sm mb-4">
                    Bạn đạt được <span className="font-bold text-amber-300">{score} điểm</span>!
                  </p>
                  <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-xl text-amber-300 text-xs font-bold mb-6">
                    <Coins size={16} />
                    <span>+{Math.max(10, Math.floor(score / 3))} Xu Arcade nhận được!</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-3">🐍</div>
                  <h3 className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-teal-300 bg-clip-text text-transparent mb-2">
                    RẮN SĂN MỒI NEON
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mb-6">
                    Dùng phím Mũi Tên hoặc W A S D để điều khiển rắn ăn mồi và né va chạm.
                  </p>
                </>
              )}

              <button
                onClick={startGame}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/30 active:scale-95 transition-all"
              >
                {gameOver ? <RotateCcw size={18} /> : <Play size={18} />}
                <span>{gameOver ? 'Chơi Lại Ván Mới' : 'Bắt Đầu Chơi'}</span>
              </button>
            </div>
          )}

          {/* Pause overlay */}
          {isPlaying && isPaused && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center">
              <h3 className="text-xl font-bold text-cyan-300 mb-4">ĐANG TẠM DỪNG</h3>
              <button
                onClick={() => setIsPaused(false)}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 text-white font-semibold flex items-center gap-2"
              >
                <Play size={16} /> Tiếp tục
              </button>
            </div>
          )}
        </div>

        {/* Mobile / Screen Controls & Legend */}
        <div className="flex flex-col items-center gap-4 w-full md:w-60">
          <div className="w-full bg-slate-900/80 border border-slate-800 p-4 rounded-2xl text-xs space-y-2.5">
            <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-400" />
              <span>Quy Tắc Điểm Thưởng</span>
            </h4>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
              <span>Táo Đỏ: +10 điểm</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
              <span>Ngôi Sao Vàng: +35 điểm</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-3 h-3 rounded-full bg-sky-400 shrink-0" />
              <span>Băng Tinh: +20 điểm</span>
            </div>
          </div>

          {/* Touch D-Pad for Mobile */}
          <div className="grid grid-cols-3 gap-2 w-48 pt-2">
            <div />
            <button
              onClick={() => direction !== 'DOWN' && setNextDirection('UP')}
              className="p-3.5 bg-slate-800 active:bg-cyan-600 rounded-xl flex items-center justify-center text-slate-200 border border-slate-700 active:scale-95"
            >
              <ArrowUp size={20} />
            </button>
            <div />
            <button
              onClick={() => direction !== 'RIGHT' && setNextDirection('LEFT')}
              className="p-3.5 bg-slate-800 active:bg-cyan-600 rounded-xl flex items-center justify-center text-slate-200 border border-slate-700 active:scale-95"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              onClick={() => isPlaying && setIsPaused((p) => !p)}
              className="p-3.5 bg-slate-800/80 active:bg-slate-700 rounded-xl flex items-center justify-center text-slate-400 text-xs font-bold border border-slate-700"
            >
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
            </button>
            <button
              onClick={() => direction !== 'LEFT' && setNextDirection('RIGHT')}
              className="p-3.5 bg-slate-800 active:bg-cyan-600 rounded-xl flex items-center justify-center text-slate-200 border border-slate-700 active:scale-95"
            >
              <ArrowRight size={20} />
            </button>
            <div />
            <button
              onClick={() => direction !== 'UP' && setNextDirection('DOWN')}
              className="p-3.5 bg-slate-800 active:bg-cyan-600 rounded-xl flex items-center justify-center text-slate-200 border border-slate-700 active:scale-95"
            >
              <ArrowDown size={20} />
            </button>
            <div />
          </div>
        </div>
      </div>
    </div>
  );
};
