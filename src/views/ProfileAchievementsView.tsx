import React from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  Flame,
  Trophy,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
} from 'lucide-react';

export const ProfileAchievementsView: React.FC = () => {
  const { user } = useApp();

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const allBadges = [
    { key: 'FIRST_TOPIC', title: 'First Topic Completed', desc: 'Completed your first syllabus topic revision', icon: '🏆', unlocked: true },
    { key: '7_DAY_STREAK', title: '7-Day Streak', desc: 'Maintained a consistent 7-day daily momentum', icon: '🔥', unlocked: (user?.currentStreak || 0) >= 7 },
    { key: '100_QUESTIONS', title: '100 Questions Solved', desc: 'Practiced 100 questions and problems', icon: '🧠', unlocked: false },
    { key: '90_QUIZ', title: '90% Quiz Score', desc: 'Scored 90%+ in an MCQ examination drill', icon: '🎯', unlocked: true },
    { key: '10_TOPICS', title: '10 Topics Completed', desc: 'Mastered 10 individual curriculum units', icon: '📚', unlocked: true },
    { key: 'MOCK_MASTER', title: 'Mock Test Master', desc: 'Completed a full 3-hour university mock paper', icon: '🏆', unlocked: false },
    { key: 'FAST_LEARNER', title: 'Fast Learner', desc: 'Completed 3 units in one study sprint', icon: '⚡', unlocked: true },
    { key: 'SUBJECT_MASTER', title: 'Subject Master', desc: 'Achieved 100% syllabus preparation coverage', icon: '🎓', unlocked: false },
  ];

  const nextLevelXp = (user?.level || 1) * 100;
  const currentLevelProgress = Math.min(100, Math.round(((user?.xp || 0) % 100) / 1));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Profile Overview Card */}
      <div className="glass-panel-heavy rounded-2xl p-6 sm:p-8 border border-red-950/40 relative overflow-hidden space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-600 to-red-900 p-0.5 shadow-[0_0_20px_rgba(239,68,68,0.4)] flex-shrink-0">
              <div className="w-full h-full rounded-2xl bg-[#090910] flex items-center justify-center font-black text-2xl text-white">
                {user?.name?.charAt(0) || 'U'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">{user?.name || 'Student'}</h1>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                  Level {user?.level || 1} — Scholar
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                {user?.course || 'B.Tech'} • {user?.branch || 'Computer Science'} • {user?.college || 'University'}
              </p>
              <div className="text-[11px] text-zinc-500 font-mono">
                Exam Target: {user?.examDate || 'Nov 20, 2026'} ({user?.preferredLanguage || 'English'})
                {user?.phone && <span className="text-zinc-400"> • 📱 {user.phone}</span>}
              </div>
            </div>
          </div>

          <div className="text-right space-y-2">
            <div className="flex items-center gap-2 justify-end">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="text-2xl font-black text-white font-mono">{user?.xp || 280} XP</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                <span>Next Rank: Level {(user?.level || 1) + 1}</span>
                <span>{currentLevelProgress}%</span>
              </div>
              <div className="w-40 h-2 bg-zinc-900 rounded-full overflow-hidden ml-auto">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-full"
                  style={{ width: `${currentLevelProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute right-0 top-0 w-80 h-full bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Daily Study Streak Tracker */}
      <div className="glass-panel-heavy rounded-2xl p-6 border border-red-950/40 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-500 animate-pulse" />
            <h2 className="text-base font-bold text-white">Daily Learning Streak</h2>
          </div>
          <div className="text-xs font-mono text-zinc-400">
            Current: <span className="text-red-400 font-bold">{user?.currentStreak || 7} Days</span> • Longest: <span className="text-white font-bold">{user?.longestStreak || 14} Days</span>
          </div>
        </div>

        {/* 7-Day Visual Row */}
        <div className="grid grid-cols-7 gap-2 text-center pt-2">
          {daysOfWeek.map((day, idx) => (
            <div key={day} className="p-3.5 rounded-xl bg-[#090912] border border-red-950/40 space-y-2">
              <span className="text-xs font-mono font-bold text-zinc-400">{day}</span>
              <div className="w-8 h-8 rounded-lg bg-red-950/80 border border-red-700/60 flex items-center justify-center mx-auto shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                <Flame className="w-4 h-4 text-red-500" />
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-zinc-500">
          * Streaks increment when completing syllabus topics, taking quizzes, or finishing focus sessions.
        </p>
      </div>

      {/* Badges & Milestones */}
      <div className="glass-panel-heavy rounded-2xl p-6 border border-red-950/40 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-red-500" />
            <h2 className="text-base font-bold text-white">Achievements & Badges</h2>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {allBadges.filter((b) => b.unlocked).length} / {allBadges.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {allBadges.map((badge) => (
            <div
              key={badge.key}
              className={`p-4 rounded-xl border transition-all space-y-2 ${
                badge.unlocked
                  ? 'bg-[#0f0f18] border-red-900/50 shadow-[0_0_12px_rgba(220,38,38,0.15)]'
                  : 'bg-[#07070c] border-zinc-900 opacity-40'
              }`}
            >
              <div className="text-2xl">{badge.icon}</div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white">{badge.title}</div>
                <div className="text-[11px] text-zinc-400 leading-tight">{badge.desc}</div>
              </div>
              <div className="text-[10px] font-mono text-red-400 pt-1">
                {badge.unlocked ? 'Unlocked ✓' : 'Locked'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
