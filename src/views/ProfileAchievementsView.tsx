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

  const currentLevelProgress = Math.min(100, Math.round(((user?.xp || 0) % 100) / 1));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Profile Overview Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#EEEAF4] shadow-[0_4px_24px_rgba(40,38,58,0.04)] relative overflow-hidden space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#EAE5FF] border border-[#D9D2F8] shadow-sm flex items-center justify-center font-black text-2xl text-[#7C6EE6] shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#28263A]">{user?.name || 'Student'}</h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EAE5FF] text-[#7C6EE6] border border-[#D9D2F8]/60">
                  Level {user?.level || 1} • Scholar
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#777589]">
                {user?.course || 'B.Tech'} • {user?.branch || 'Computer Science'} • {user?.college || 'University'}
              </p>
              <div className="text-xs text-[#777589] pt-0.5">
                Target Exam: {user?.examDate || 'Nov 20, 2026'} ({user?.preferredLanguage || 'English'})
                {user?.phone && <span className="text-[#28263A] font-medium"> • 📱 {user.phone}</span>}
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-2 p-4 rounded-2xl bg-[#FFFDF9] border border-[#EEEAF4]">
            <div className="flex items-center gap-2 justify-start sm:justify-end">
              <Trophy className="w-5 h-5 text-[#E5A044]" />
              <span className="text-2xl font-black text-[#28263A] font-mono">{user?.xp || 280} XP</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-[#777589] font-medium">
                <span>Rank Progress</span>
                <span className="text-[#28263A] font-bold">{currentLevelProgress}%</span>
              </div>
              <div className="w-40 h-2 bg-[#F3F0F8] rounded-full overflow-hidden ml-auto">
                <div
                  className="h-full bg-gradient-to-r from-[#7C6EE6] to-[#A99EFA] rounded-full transition-all duration-300"
                  style={{ width: `${currentLevelProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Study Streak Tracker */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#FFE0D2] flex items-center justify-center text-[#E5A044]">
              <Flame className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#28263A]">Daily Learning Streak</h2>
          </div>
          <div className="text-xs font-semibold text-[#777589]">
            Current: <span className="text-[#E5A044] font-bold">{user?.currentStreak || 7} Days 🔥</span> • Longest: <span className="text-[#28263A] font-bold">{user?.longestStreak || 14} Days</span>
          </div>
        </div>

        {/* 7-Day Visual Row */}
        <div className="grid grid-cols-7 gap-2 text-center pt-2">
          {daysOfWeek.map((day) => (
            <div key={day} className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#EEEAF4] space-y-2">
              <span className="text-xs font-semibold text-[#777589]">{day}</span>
              <div className="w-8 h-8 rounded-xl bg-[#FFE0D2] border border-[#FFCBB3] flex items-center justify-center mx-auto shadow-sm">
                <Flame className="w-4 h-4 text-[#E5A044]" />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#777589]">
          * Streaks increment when completing syllabus topics, taking quizzes, or finishing focus study sessions.
        </p>
      </div>

      {/* Badges & Milestones */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#7C6EE6]" />
            <h2 className="text-base sm:text-lg font-bold text-[#28263A]">Achievements & Badges</h2>
          </div>
          <span className="text-xs font-semibold text-[#7C6EE6] bg-[#EAE5FF] px-2.5 py-0.5 rounded-full">
            {allBadges.filter((b) => b.unlocked).length} / {allBadges.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {allBadges.map((badge) => (
            <div
              key={badge.key}
              className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                badge.unlocked
                  ? 'bg-[#FFFDF9] border-[#D9D2F8] shadow-sm'
                  : 'bg-[#FFFDF9]/40 border-[#EEEAF4] opacity-50'
              }`}
            >
              <div className="text-2xl">{badge.icon}</div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-[#28263A]">{badge.title}</div>
                <div className="text-xs text-[#777589] leading-tight">{badge.desc}</div>
              </div>
              <div className="text-[11px] font-semibold pt-1">
                {badge.unlocked ? (
                  <span className="text-[#319B78]">Unlocked ✓</span>
                ) : (
                  <span className="text-[#777589]">Locked</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
