import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Timer,
  Play,
  Pause,
  Square,
  Sparkles,
  Flame,
  Award,
  BookOpen,
} from 'lucide-react';

export const FocusModeView: React.FC = () => {
  const { activeSubject, subjects, showToast, triggerConfetti, refreshUser } = useApp();
  const currentSubject = activeSubject || subjects[0];
  const allTopics = currentSubject?.units.flatMap((u) => u.topics) || [];

  const [selectedTopic, setSelectedTopic] = useState<string>(allTopics[0]?.name || 'Core Topic Study');
  const [totalSeconds, setTotalSeconds] = useState<number>(25 * 60);
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      clearInterval(interval);
      setIsActive(false);
      handleFinishSession();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleFinishSession = async () => {
    const elapsedMinutes = Math.max(1, Math.round((totalSeconds - timeLeft) / 60));

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: currentSubject?.id,
          topicName: selectedTopic,
          durationMinutes: elapsedMinutes,
        }),
      });

      if (res.ok) {
        showToast(`Study session recorded! +20 XP awarded 🎉`, 'success');
        triggerConfetti();
        await refreshUser();
        setSessionCompleted(true);
      }
    } catch {
      showToast('Error recording study session.', 'error');
    }
  };

  const handleSetDuration = (mins: number) => {
    setIsActive(false);
    setTotalSeconds(mins * 60);
    setTimeLeft(mins * 60);
    setSessionCompleted(false);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progressPercent = Math.round(((totalSeconds - timeLeft) / totalSeconds) * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex flex-col items-center justify-center space-y-10 min-h-[75vh]">
      {/* Subject & Topic Tag */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/40 text-red-400 text-xs font-mono font-bold">
          <Timer className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          <span>DEEP FOCUS SESSION</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">
          {currentSubject?.name || 'Focused Study'}
        </h2>
        <div className="text-xs text-zinc-400 font-mono">Focusing on: {selectedTopic}</div>
      </div>

      {/* Giant Minimalist Timer */}
      <div className="relative w-72 h-72 sm:w-84 sm:h-84 rounded-full bg-[#07070c] border-4 border-red-950 flex flex-col items-center justify-center shadow-[0_0_60px_rgba(220,38,38,0.2)]">
        {/* Subtle glowing ring overlay */}
        <div
          className="absolute inset-0 rounded-full border-4 border-red-500 opacity-60 pointer-events-none transition-all duration-1000"
          style={{ clipPath: `inset(0 0 ${100 - progressPercent}% 0)` }}
        />

        <div className="text-6xl sm:text-7xl font-black text-white font-mono tracking-tighter">
          {formattedTime}
        </div>
        <div className="text-xs font-mono text-zinc-500 pt-2">{progressPercent}% Elapsed</div>
      </div>

      {/* Timer Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsActive(!isActive)}
          className="btn-red-glow flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-black text-white uppercase tracking-wider"
        >
          {isActive ? (
            <>
              <Pause className="w-4 h-4 fill-white" /> <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" /> <span>Start Focus</span>
            </>
          )}
        </button>

        <button
          onClick={handleFinishSession}
          className="px-5 py-3.5 rounded-2xl text-xs font-bold bg-[#141422] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors flex items-center gap-2"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          <span>Finish Session</span>
        </button>
      </div>

      {/* Preset Duration Buttons */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#0a0a14] border border-red-950/40">
        {[
          { label: '25 Min (Pomodoro)', mins: 25 },
          { label: '50 Min (Deep Work)', mins: 50 },
          { label: '15 Min (Sprint)', mins: 15 },
        ].map((item) => (
          <button
            key={item.mins}
            onClick={() => handleSetDuration(item.mins)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-colors ${
              totalSeconds === item.mins * 60
                ? 'bg-red-950 text-red-300 border border-red-800'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
