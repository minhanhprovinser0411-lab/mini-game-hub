import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Trophy, Coins, Compass } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { sound } from '../services/audioService';

interface Pipe {
  x: number;
  topHeight: number;
  bottomHeight: number;
  passed: boolean;
  hasCoin: boolean;
  coinCollected: boolean;
}

export const FlappyBirdGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { stats, recordGameResult } = useGame();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const highScore = stats.highScores['flappy'] || 0;

  // Game physical parameters
  const birdRef = useRef({
    x: 60,
    y: 200,
    vy: 0,
    radius: 12,
    gravity: 0.38,
    jump: -6.5,
    rotation: 0,
  });

  const pipesRef = useRef<Pipe[]>([]);
  const frameCountRef = useRef(0);
  const animIdRef = useRef<number | null>(null);

  const initGame = useCallback(() => {
    birdRef.current = {
      x: 60,
      y: 200,
      vy: 0,
      radius: 12,
      gravity: 0.38,
      jump: -6.5,
      rotation: 0,
    };
    pipesRef.current = [];
    frameCountRef.current = 0;
    setScore(0);
    setGameOver(false);
  }, []);

  const handleFinish = useCallback(
    (finalScore: number) => {
      setIsPlaying(false);
      setGameOver(true);
      sound.playGameOver();
      const coins = Math.max(10, finalScore * 5);
      recordGameResult('flappy', finalScore, coins);
    },
    [recordGameResult]
  );

  const flap = useCallback(() => {
    if (!isPlaying && !gameOver) {
      initGame();
      setIsPlaying(true);
    }
    if (isPlaying) {
      birdRef.current.vy = birdRef.current.jump;
      sound.playBounce();
    }
  }, [isPlaying, gameOver, initGame]);

  const startGame = () => {
    initGame();
    setIsPlaying(true);
    sound.playPowerup();
  };

  // Keyboard space / arrow up listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ([' ', 'ArrowUp', 'w', 'W'].includes(e.key)) {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flap]);

  // Main game animation loop
  useEffect(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let currentScore = score;

    const loop = () => {
      frameCountRef.current += 1;
      const bird = birdRef.current;

      // Update Bird Physics
      bird.vy += bird.gravity;
      bird.y += bird.vy;
      bird.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (bird.vy / 10) * 1.2));

      // Ground & Ceiling collision
      if (bird.y + bird.radius >= canvas.height - 20) {
        bird.y = canvas.height - 20 - bird.radius;
        handleFinish(currentScore);
        return;
      }
      if (bird.y - bird.radius <= 0) {
        bird.y = bird.radius;
        bird.vy = 0;
      }

      // Spawn pipes every 100 frames (~1.6 seconds)
      const PIPE_SPEED = 2.2;
      const GAP = 110;
      const PIPE_WIDTH = 48;

      if (frameCountRef.current % 95 === 0) {
        const minH = 40;
        const maxH = canvas.height - GAP - minH - 20;
        const topH = Math.floor(Math.random() * (maxH - minH + 1)) + minH;
        const bottomH = canvas.height - GAP - topH - 20;

        pipesRef.current.push({
          x: canvas.width,
          topHeight: topH,
          bottomHeight: bottomH,
          passed: false,
          hasCoin: Math.random() > 0.4,
          coinCollected: false,
        });
      }

      // Update Pipes
      for (let i = pipesRef.current.length - 1; i >= 0; i--) {
        const pipe = pipesRef.current[i];
        pipe.x -= PIPE_SPEED;

        // Score pass
        if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
          pipe.passed = true;
          currentScore += 1;
          setScore(currentScore);
          sound.playPop();
        }

        // Check Pipe Collision
        const inPipeX = bird.x + bird.radius > pipe.x && bird.x - bird.radius < pipe.x + PIPE_WIDTH;
        if (inPipeX) {
          if (
            bird.y - bird.radius < pipe.topHeight ||
            bird.y + bird.radius > canvas.height - 20 - pipe.bottomHeight
          ) {
            handleFinish(currentScore);
            return;
          }
        }

        // Coin collection in gap
        if (pipe.hasCoin && !pipe.coinCollected) {
          const coinX = pipe.x + PIPE_WIDTH / 2;
          const coinY = pipe.topHeight + GAP / 2;
          const dist = Math.hypot(bird.x - coinX, bird.y - coinY);
          if (dist < bird.radius + 8) {
            pipe.coinCollected = true;
            currentScore += 2;
            setScore(currentScore);
            sound.playCoin();
          }
        }

        // Remove offscreen pipes
        if (pipe.x + PIPE_WIDTH < 0) {
          pipesRef.current.splice(i, 1);
        }
      }

      // --- RENDERING ---
      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(0.7, '#1e293b');
      skyGrad.addColorStop(1, '#0f766e');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Distant stars / neon city skyline
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      for (let s = 0; s < 15; s++) {
        const sx = ((s * 37 + frameCountRef.current * 0.2) % canvas.width);
        const sy = (s * 23) % 150;
        ctx.fillRect(sx, sy, 2, 2);
      }

      // Pipes
      pipesRef.current.forEach((pipe) => {
        // Top Pipe
        ctx.save();
        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#059669';
        ctx.shadowBlur = 8;
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
        ctx.fillStyle = '#34d399';
        ctx.fillRect(pipe.x - 2, pipe.topHeight - 14, PIPE_WIDTH + 4, 14);

        // Bottom Pipe
        const bottomY = canvas.height - 20 - pipe.bottomHeight;
        ctx.fillStyle = '#10b981';
        ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, pipe.bottomHeight);
        ctx.fillStyle = '#34d399';
        ctx.fillRect(pipe.x - 2, bottomY, PIPE_WIDTH + 4, 14);
        ctx.restore();

        // Bonus Coin
        if (pipe.hasCoin && !pipe.coinCollected) {
          const coinX = pipe.x + PIPE_WIDTH / 2;
          const coinY = pipe.topHeight + GAP / 2;
          ctx.save();
          ctx.fillStyle = '#fbbf24';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(coinX, coinY, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // Ground bar
      ctx.fillStyle = '#047857';
      ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(0, canvas.height - 20, canvas.width, 4);

      // Draw Bird
      ctx.save();
      ctx.translate(bird.x, bird.y);
      ctx.rotate(bird.rotation);

      // Bird body
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#d97706';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
      ctx.fill();

      // Wing
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(-3, 2, 6, 4, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      // Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(4, -3, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(5, -3, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Beak
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(9, -1);
      ctx.lineTo(15, 2);
      ctx.lineTo(9, 5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      animIdRef.current = requestAnimationFrame(loop);
    };

    animIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    };
  }, [isPlaying, score, handleFinish]);

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
            <span>Kỷ lục: {highScore} cột</span>
          </div>
          <div className="text-sm font-bold text-cyan-300">
            Điểm: {score}
          </div>
        </div>
      </div>

      {/* Main Flappy Area */}
      <div className="flex flex-col items-center justify-center">
        <div
          onClick={flap}
          className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/30 shadow-2xl bg-slate-950 cursor-pointer active:scale-[0.99] transition-transform"
        >
          <canvas
            ref={canvasRef}
            width={340}
            height={460}
            className="block touch-none"
          />

          {/* Overlay state */}
          {(!isPlaying || gameOver) && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
              {gameOver ? (
                <>
                  <div className="text-4xl mb-2">💥</div>
                  <h3 className="text-2xl font-black text-red-400 mb-1">RƠI RỤNG!</h3>
                  <p className="text-slate-300 text-sm mb-4">
                    Bạn đã vượt qua <span className="font-bold text-amber-300">{score} cột ống</span>!
                  </p>
                  <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-xl text-amber-300 text-xs font-bold mb-6">
                    <Coins size={16} />
                    <span>+{Math.max(10, score * 5)} Xu Arcade!</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-3">🪶</div>
                  <h3 className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent mb-2">
                    CÁNH CHIM PHIÊU LƯU
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mb-6">
                    Nhấp chuột, chạm màn hình hoặc bấm Phím Cách để đập cánh bay qua các đường ống!
                  </p>
                </>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startGame();
                }}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/30 active:scale-95 transition-all"
              >
                {gameOver ? <RotateCcw size={18} /> : <Play size={18} />}
                <span>{gameOver ? 'Bay Lại Ván Mới' : 'Bắt Đầu Bay'}</span>
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          Chạm vào màn hình hoặc bấm Phím Cách (Space) để bay
        </p>
      </div>
    </div>
  );
};
