import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, RotateCcw, Trophy, Coins, Zap, Timer, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGame } from '../context/GameContext';
import { sound } from '../services/audioService';

interface Question {
  text: string;
  options: number[];
  correct: number;
}

export const SpeedMathGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { stats, recordGameResult } = useGame();

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [highestStreak, setHighestStreak] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(5.0); // 5 seconds per question
  const [question, setQuestion] = useState<Question | null>(null);

  const highScore = stats.highScores['math'] || 0;
  const timerRef = useRef<number | null>(null);

  // Generate random math question based on score level
  const generateQuestion = useCallback((currentScore: number): Question => {
    const ops = ['+', '-', '×'];
    if (currentScore > 100) ops.push('÷');

    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = 0;
    let b = 0;
    let correct = 0;

    if (op === '+') {
      const max = currentScore > 150 ? 99 : 50;
      a = Math.floor(Math.random() * max) + 2;
      b = Math.floor(Math.random() * max) + 2;
      correct = a + b;
    } else if (op === '-') {
      const max = currentScore > 150 ? 99 : 50;
      a = Math.floor(Math.random() * max) + 10;
      b = Math.floor(Math.random() * (a - 1)) + 1;
      correct = a - b;
    } else if (op === '×') {
      const max = currentScore > 150 ? 12 : 9;
      a = Math.floor(Math.random() * max) + 2;
      b = Math.floor(Math.random() * max) + 2;
      correct = a * b;
    } else {
      // Division
      b = Math.floor(Math.random() * 9) + 2;
      correct = Math.floor(Math.random() * 10) + 1;
      a = b * correct;
    }

    // Generate 3 unique wrong options
    const wrongOptions = new Set<number>();
    while (wrongOptions.size < 3) {
      const offset = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 5) + 1);
      const wrong = correct + offset;
      if (wrong !== correct && wrong >= 0) {
        wrongOptions.add(wrong);
      }
    }

    const options = [correct, ...Array.from(wrongOptions)].sort(() => Math.random() - 0.5);

    return {
      text: `${a} ${op} ${b} = ?`,
      options,
      correct,
    };
  }, []);

  const handleFinish = useCallback(
    (finalScore: number, finalStreak: number) => {
      setIsPlaying(false);
      setGameOver(true);
      if (timerRef.current) clearInterval(timerRef.current);
      sound.playGameOver();
      const coins = Math.max(10, Math.floor(finalScore / 10));
      recordGameResult('math', finalScore, coins, { streak: finalStreak });
    },
    [recordGameResult]
  );

  const nextQuestion = useCallback(
    (currentScore: number) => {
      setTimeLeft(5.0);
      setQuestion(generateQuestion(currentScore));
    },
    [generateQuestion]
  );

  const startGame = () => {
    setScore(0);
    setStreak(0);
    setHighestStreak(0);
    setGameOver(false);
    setIsPlaying(true);
    sound.playPowerup();
    nextQuestion(0);
  };

  // Timer loop
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          handleFinish(score, highestStreak);
          return 0;
        }
        return Number((prev - 0.1).toFixed(1));
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, gameOver, score, highestStreak, handleFinish]);

  const handleSelectOption = (ans: number) => {
    if (!isPlaying || gameOver || !question) return;

    if (ans === question.correct) {
      sound.playCoin();
      const newStreak = streak + 1;
      setStreak(newStreak);
      const newHighStreak = Math.max(highestStreak, newStreak);
      setHighestStreak(newHighStreak);

      const multiplier = newStreak >= 10 ? 4 : newStreak >= 5 ? 2.5 : newStreak >= 3 ? 1.5 : 1;
      const points = Math.round(10 * multiplier);
      const nextScore = score + points;
      setScore(nextScore);

      if (newStreak === 10) {
        sound.playPowerup();
        confetti({ particleCount: 50, spread: 60 });
      }

      nextQuestion(nextScore);
    } else {
      // Wrong answer -> game over!
      handleFinish(score, highestStreak);
    }
  };

  // Keyboard 1, 2, 3, 4
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!question) return;
      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key) - 1;
        if (question.options[idx] !== undefined) {
          handleSelectOption(question.options[idx]);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [question, isPlaying, gameOver]);

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
          <div className="text-sm font-bold text-cyan-300">Điểm: {score}</div>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-slate-950 border-2 border-amber-500/30 rounded-3xl p-6 shadow-2xl relative min-h-[380px] flex flex-col justify-between">
        {!isPlaying || gameOver ? (
          <div className="flex flex-col items-center justify-center my-auto text-center py-6">
            {gameOver ? (
              <>
                <div className="text-4xl mb-2">⚡</div>
                <h3 className="text-2xl font-black text-amber-400 mb-1">HẾT GIỜ HOẶC SAI!</h3>
                <p className="text-slate-300 text-sm mb-2">
                  Điểm số của bạn: <span className="font-bold text-amber-300">{score}</span>
                </p>
                <p className="text-xs text-slate-400 mb-4 flex items-center gap-1">
                  <Flame size={14} className="text-orange-500" />
                  <span>Chuỗi trả lời đúng cao nhất: {highestStreak} câu</span>
                </p>
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-xl text-amber-300 text-xs font-bold mb-6">
                  <Coins size={16} />
                  <span>+{Math.max(10, Math.floor(score / 10))} Xu Arcade</span>
                </div>
              </>
            ) : (
              <>
                <div className="text-5xl mb-3">⚡</div>
                <h3 className="text-2xl font-black bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent mb-2">
                  ĐẤU TRÍ TOÁN HỌC
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mb-6">
                  Trả lời nhanh phép tính trong 5 giây! Duy trì chuỗi đúng để kích hoạt chế độ Nhân Điểm FEVER.
                </p>
              </>
            )}

            <button
              onClick={startGame}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold flex items-center gap-2 shadow-lg shadow-amber-500/30 active:scale-95 transition-all"
            >
              {gameOver ? <RotateCcw size={18} /> : <Play size={18} />}
              <span>{gameOver ? 'Đấu Lại Ván Khác' : 'Bắt Đầu Tính Điểm'}</span>
            </button>
          </div>
        ) : (
          <>
            {/* Top Bar: Streak & Timer */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400">
                  <Flame size={16} className={streak >= 5 ? 'animate-bounce text-red-500' : ''} />
                  <span>
                    Chuỗi: {streak} {streak >= 10 ? '🔥 FEVER x4!' : streak >= 5 ? '⚡ x2.5!' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300">
                  <Timer size={15} />
                  <span>{timeLeft.toFixed(1)}s</span>
                </div>
              </div>

              {/* Countdown Progress Bar */}
              <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-100 ${
                    timeLeft <= 1.5 ? 'bg-red-500' : 'bg-gradient-to-r from-amber-400 to-yellow-400'
                  }`}
                  style={{ width: `${(timeLeft / 5.0) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Text */}
            <div className="py-8 text-center">
              <span className="text-4xl sm:text-5xl font-black tracking-wider text-slate-100 font-mono">
                {question?.text}
              </span>
            </div>

            {/* 4 Answer Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {question?.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(opt)}
                  className="py-4 px-4 rounded-2xl bg-slate-800/80 hover:bg-amber-500 hover:text-black border border-slate-700/80 hover:border-amber-400 font-black text-xl sm:text-2xl transition-all active:scale-95 text-slate-100 flex items-center justify-center relative"
                >
                  <span className="absolute top-2 left-3 text-[10px] text-slate-500 font-mono">
                    [{idx + 1}]
                  </span>
                  <span>{opt}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <p className="text-center text-xs text-slate-500 mt-4">
        Nhấn phím [1] [2] [3] [4] hoặc bấm trực tiếp vào đáp án
      </p>
    </div>
  );
};
