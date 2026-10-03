import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Heart, Trophy, Coins, Zap } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { sound } from '../services/audioService';

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  hits: number;
  maxHits: number;
  type: 'normal' | 'hard' | 'bomb' | 'gold';
  destroyed: boolean;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface PowerUp {
  x: number;
  y: number;
  type: 'expand' | 'multiball' | 'laser';
  vy: number;
}

export const BrickBreakerGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { stats, recordGameResult } = useGame();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(1);

  const highScore = stats.highScores['brick'] || 0;

  // Refs for continuous animation loop
  const paddleRef = useRef({ x: 160, width: 80, height: 12 });
  const ballsRef = useRef<Ball[]>([]);
  const bricksRef = useRef<Brick[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const initGame = useCallback(() => {
    paddleRef.current = { x: 160, width: 85, height: 12 };
    ballsRef.current = [{ x: 200, y: 360, vx: 3.5 * (Math.random() > 0.5 ? 1 : -1), vy: -4, radius: 6 }];
    powerUpsRef.current = [];

    // Build bricks: 5 rows x 8 cols
    const rows = 5;
    const cols = 8;
    const brickW = 44;
    const brickH = 16;
    const padding = 5;
    const offsetTop = 45;
    const offsetLeft = 5;

    const newBricks: Brick[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let type: 'normal' | 'hard' | 'bomb' | 'gold' = 'normal';
        let maxHits = 1;

        if (r === 0) {
          type = 'gold';
          maxHits = 1;
        } else if (r === 1 && (c === 2 || c === 5)) {
          type = 'bomb';
          maxHits = 1;
        } else if (r === 2) {
          type = 'hard';
          maxHits = 2;
        }

        newBricks.push({
          x: offsetLeft + c * (brickW + padding),
          y: offsetTop + r * (brickH + padding),
          width: brickW,
          height: brickH,
          hits: 0,
          maxHits,
          type,
          destroyed: false,
        });
      }
    }
    bricksRef.current = newBricks;
    setScore(0);
    setLives(3);
    setCombo(1);
    setGameOver(false);
    setHasWon(false);
  }, []);

  const handleFinish = useCallback(
    (won: boolean, finalScore: number) => {
      setIsPlaying(false);
      setGameOver(true);
      setHasWon(won);
      if (won) {
        sound.playPowerup();
      } else {
        sound.playGameOver();
      }
      const coins = Math.max(15, Math.floor(finalScore / 25));
      recordGameResult('brick', finalScore, coins);
    },
    [recordGameResult]
  );

  const startGame = () => {
    initGame();
    setIsPlaying(true);
    sound.playPowerup();
  };

  // Keyboard and mouse paddle controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) {
        paddleRef.current.x = Math.max(0, paddleRef.current.x - 24);
      } else if (['ArrowRight', 'd', 'D'].includes(e.key)) {
        paddleRef.current.x = Math.min(400 - paddleRef.current.width, paddleRef.current.x + 24);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mouse & Touch paddle movement on canvas
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const pointerX = (e.clientX - rect.left) * scaleX;
    const newX = pointerX - paddleRef.current.width / 2;
    paddleRef.current.x = Math.max(0, Math.min(canvas.width - paddleRef.current.width, newX));
  };

  // Game update & render loop
  useEffect(() => {
    if (!isPlaying) return;

    let currentScore = score;

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Update PowerUps
      powerUpsRef.current.forEach((p, idx) => {
        p.y += p.vy;
        // Collision with paddle
        if (
          p.y + 8 >= canvas.height - 25 &&
          p.y - 8 <= canvas.height - 15 &&
          p.x >= paddleRef.current.x &&
          p.x <= paddleRef.current.x + paddleRef.current.width
        ) {
          sound.playCoin();
          if (p.type === 'expand') {
            paddleRef.current.width = Math.min(130, paddleRef.current.width + 25);
          } else if (p.type === 'multiball') {
            const b = ballsRef.current[0];
            if (b) {
              ballsRef.current.push(
                { x: b.x, y: b.y, vx: -b.vx, vy: b.vy, radius: 6 },
                { x: b.x, y: b.y, vx: b.vx * 0.8, vy: -Math.abs(b.vy), radius: 6 }
              );
            }
          }
          powerUpsRef.current.splice(idx, 1);
        } else if (p.y > canvas.height) {
          powerUpsRef.current.splice(idx, 1);
        }
      });

      // Update Balls
      for (let i = ballsRef.current.length - 1; i >= 0; i--) {
        const ball = ballsRef.current[i];
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Wall collisions
        if (ball.x - ball.radius <= 0) {
          ball.x = ball.radius;
          ball.vx = Math.abs(ball.vx);
          sound.playPop();
        } else if (ball.x + ball.radius >= canvas.width) {
          ball.x = canvas.width - ball.radius;
          ball.vx = -Math.abs(ball.vx);
          sound.playPop();
        }

        if (ball.y - ball.radius <= 0) {
          ball.y = ball.radius;
          ball.vy = Math.abs(ball.vy);
          sound.playPop();
        }

        // Paddle collision
        const paddleY = canvas.height - 20;
        if (
          ball.y + ball.radius >= paddleY &&
          ball.y - ball.radius <= paddleY + paddleRef.current.height &&
          ball.x >= paddleRef.current.x &&
          ball.x <= paddleRef.current.x + paddleRef.current.width
        ) {
          sound.playBounce();
          ball.vy = -Math.abs(ball.vy);
          // Angle bounce based on hit spot
          const hitSpot = (ball.x - (paddleRef.current.x + paddleRef.current.width / 2)) / (paddleRef.current.width / 2);
          ball.vx = hitSpot * 5.5;
          setCombo(1);
        }

        // Brick collision
        for (const brick of bricksRef.current) {
          if (!brick.destroyed) {
            if (
              ball.x + ball.radius > brick.x &&
              ball.x - ball.radius < brick.x + brick.width &&
              ball.y + ball.radius > brick.y &&
              ball.y - ball.radius < brick.y + brick.height
            ) {
              sound.playPop();
              ball.vy = -ball.vy;
              brick.hits += 1;

              if (brick.hits >= brick.maxHits) {
                brick.destroyed = true;
                let points = 20 * combo;
                if (brick.type === 'gold') points = 60 * combo;
                if (brick.type === 'bomb') {
                  points = 100 * combo;
                  // Explode nearby bricks!
                  bricksRef.current.forEach((other) => {
                    const dist = Math.hypot(other.x - brick.x, other.y - brick.y);
                    if (dist < 65 && !other.destroyed) {
                      other.destroyed = true;
                      points += 20;
                    }
                  });
                }

                currentScore += points;
                setScore(currentScore);
                setCombo((c) => Math.min(5, c + 1));

                // Chance to drop powerup
                if (Math.random() < 0.28) {
                  powerUpsRef.current.push({
                    x: brick.x + brick.width / 2,
                    y: brick.y + brick.height / 2,
                    type: Math.random() > 0.5 ? 'expand' : 'multiball',
                    vy: 2.2,
                  });
                }
              }
              break;
            }
          }
        }

        // Bottom border (lost ball)
        if (ball.y - ball.radius > canvas.height) {
          ballsRef.current.splice(i, 1);
        }
      }

      // Check if all balls lost
      if (ballsRef.current.length === 0) {
        setLives((prevLives) => {
          const next = prevLives - 1;
          if (next <= 0) {
            handleFinish(false, currentScore);
          } else {
            // Respawn single ball
            ballsRef.current = [
              {
                x: paddleRef.current.x + paddleRef.current.width / 2,
                y: canvas.height - 35,
                vx: 3.5 * (Math.random() > 0.5 ? 1 : -1),
                vy: -4,
                radius: 6,
              },
            ];
          }
          return next;
        });
      }

      // Check if all bricks cleared
      const remainingBricks = bricksRef.current.filter((b) => !b.destroyed);
      if (remainingBricks.length === 0) {
        handleFinish(true, currentScore + 500); // 500 bonus points for clearing!
        return;
      }

      // DRAWING
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw bricks
      bricksRef.current.forEach((b) => {
        if (b.destroyed) return;
        ctx.save();
        if (b.type === 'gold') {
          ctx.fillStyle = '#f59e0b';
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 8;
        } else if (b.type === 'bomb') {
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#dc2626';
          ctx.shadowBlur = 10;
        } else if (b.type === 'hard') {
          ctx.fillStyle = b.hits === 0 ? '#8b5cf6' : '#a78bfa';
        } else {
          ctx.fillStyle = '#06b6d4';
        }

        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.width, b.height, 4);
        ctx.fill();
        ctx.restore();
      });

      // Draw PowerUps
      powerUpsRef.current.forEach((p) => {
        ctx.save();
        ctx.fillStyle = p.type === 'expand' ? '#10b981' : '#ec4899';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Paddle
      ctx.save();
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(paddleRef.current.x, canvas.height - 20, paddleRef.current.width, paddleRef.current.height, 6);
      ctx.fill();
      ctx.restore();

      // Draw Balls
      ballsRef.current.forEach((b) => {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, score, combo, handleFinish]);

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
          <div className="flex items-center gap-1 text-red-400">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                size={16}
                fill={i < lives ? '#f87171' : 'none'}
                className={i < lives ? 'text-red-400' : 'text-slate-600'}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-sm font-bold text-cyan-300">
            <span>Điểm: {score}</span>
          </div>
        </div>
      </div>

      {/* Main Game Screen */}
      <div className="flex flex-col items-center justify-center">
        <div className="relative rounded-2xl overflow-hidden border-2 border-cyan-500/30 shadow-2xl bg-slate-950">
          <canvas
            ref={canvasRef}
            width={400}
            height={440}
            onPointerMove={handlePointerMove}
            className="block touch-none cursor-ew-resize"
          />

          {/* Overlay state */}
          {(!isPlaying || gameOver) && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
              {gameOver ? (
                <>
                  <div className="text-4xl mb-2">{hasWon ? '🏆' : '💥'}</div>
                  <h3 className={`text-2xl font-black mb-1 ${hasWon ? 'text-amber-400' : 'text-red-400'}`}>
                    {hasWon ? 'CHIẾN THẮNG TUYỆT ĐỐI!' : 'HẾT MẠNG'}
                  </h3>
                  <p className="text-slate-300 text-sm mb-4">
                    Điểm số cuối cùng: <span className="font-bold text-amber-300">{score} điểm</span>
                  </p>
                  <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-xl text-amber-300 text-xs font-bold mb-6">
                    <Coins size={16} />
                    <span>+{Math.max(15, Math.floor(score / 25))} Xu Arcade!</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-3">🧱</div>
                  <h3 className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent mb-2">
                    PHÁ GẠCH ÁNH SÁNG
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mb-6">
                    Di chuột hoặc vuốt ngón tay để di chuyển thanh đỡ bóng. Nhặt ngọc để mở rộng thanh hoặc nhân đôi bóng!
                  </p>
                </>
              )}

              <button
                onClick={startGame}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-400 hover:to-pink-400 text-white font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/30 active:scale-95 transition-all"
              >
                {gameOver ? <RotateCcw size={18} /> : <Play size={18} />}
                <span>{gameOver ? 'Chơi Lại Ván Mới' : 'Bắt Đầu Bắn Bóng'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 flex items-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Gạch Bom Nổ
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Gạch Hoàng Kim
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Ngọc Phóng To
          </span>
        </div>
      </div>
    </div>
  );
};
