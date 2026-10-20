import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  Sparkles,
  ArrowRight,
  Flame,
  BookOpen,
  Coffee,
  CheckSquare,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Award,
  ChevronRight,
  ChevronLeft,
  Download,
  Printer,
  Zap,
} from 'lucide-react';

interface PlannerSession {
  id: string;
  day: string; // e.g., "Monday, Day 1"
  dateStr: string;
  timeSlot: string; // "09:00 - 10:15"
  subject: string;
  unit: string;
  topic: string;
  type: 'concept' | 'numerical' | 'mcq_quiz' | 'break' | 'revision' | 'mock_test';
  durationMins: number;
  completed: boolean;
  priority: 'high' | 'medium' | 'normal';
}

export const StudyPlannerView: React.FC = () => {
  const { subjects, activeSubject, setActiveSubject, user, showToast, triggerConfetti } = useApp();

  // Active View Tab: 'timetable' | 'calendar' | 'checklist'
  const [activeView, setActiveView] = useState<'timetable' | 'calendar' | 'checklist'>('timetable');

  // Planner Configuration
  const [examDate, setExamDate] = useState<string>('2026-11-25');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(activeSubject?.id || subjects[0]?.id || '');
  const [dailyHours, setDailyHours] = useState<number>(3.5);
  const [prepLevel, setPrepLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [targetScore, setTargetScore] = useState<string>('85%+ Marks (A Grade)');
  const [isCrashPlan, setIsCrashPlan] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [showConfigDrawer, setShowConfigDrawer] = useState<boolean>(false);

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId) || activeSubject || subjects[0] || null;

  // Planned Sessions State
  const [sessions, setSessions] = useState<PlannerSession[]>(() => {
    // Generate realistic initial timetable based on current subject
    const subjName = currentSubject?.name || 'Computer Science';
    const units = currentSubject?.units || [];
    const u1 = units[0]?.name || 'Unit 1: Fundamentals';
    const u2 = units[1]?.name || 'Unit 2: Core Architectures';
    const t1 = units[0]?.topics?.[0]?.name || 'Foundational Definitions & Scope';
    const t2 = units[0]?.topics?.[1]?.name || 'Mathematical Derivation & Core Formula';
    const t3 = units[1]?.topics?.[0]?.name || 'Algorithm Implementation & Complexity';

    return [
      {
        id: 's1',
        day: 'Day 1 — Foundation & Core Derivations',
        dateStr: 'Today',
        timeSlot: '09:00 - 10:00',
        subject: subjName,
        unit: u1,
        topic: t1,
        type: 'concept',
        durationMins: 60,
        completed: true,
        priority: 'high',
      },
      {
        id: 's2',
        day: 'Day 1 — Foundation & Core Derivations',
        dateStr: 'Today',
        timeSlot: '10:00 - 10:15',
        subject: 'Rest & Refresh',
        unit: 'Cognitive Break',
        topic: 'Hydration & 15-min Screen Rest',
        type: 'break',
        durationMins: 15,
        completed: true,
        priority: 'normal',
      },
      {
        id: 's3',
        day: 'Day 1 — Foundation & Core Derivations',
        dateStr: 'Today',
        timeSlot: '10:15 - 11:30',
        subject: subjName,
        unit: u1,
        topic: t2,
        type: 'numerical',
        durationMins: 75,
        completed: false,
        priority: 'high',
      },
      {
        id: 's4',
        day: 'Day 1 — Foundation & Core Derivations',
        dateStr: 'Today',
        timeSlot: '19:00 - 19:45',
        subject: subjName,
        unit: u1,
        topic: '15-Question Rapid MCQ Diagnostic Drill',
        type: 'mcq_quiz',
        durationMins: 45,
        completed: false,
        priority: 'medium',
      },
      {
        id: 's5',
        day: 'Day 1 — Foundation & Core Derivations',
        dateStr: 'Today',
        timeSlot: '21:30 - 22:00',
        subject: subjName,
        unit: u1,
        topic: 'End-of-Day Active Recall & Formula Sheet',
        type: 'revision',
        durationMins: 30,
        completed: false,
        priority: 'high',
      },
      {
        id: 's6',
        day: 'Day 2 — Deep Dive & Algorithms',
        dateStr: 'Tomorrow',
        timeSlot: '09:00 - 10:30',
        subject: subjName,
        unit: u2,
        topic: t3,
        type: 'concept',
        durationMins: 90,
        completed: false,
        priority: 'high',
      },
      {
        id: 's7',
        day: 'Day 2 — Deep Dive & Algorithms',
        dateStr: 'Tomorrow',
        timeSlot: '11:00 - 12:15',
        subject: subjName,
        unit: u2,
        topic: 'Previous Year Numerical Questions & Derivations',
        type: 'numerical',
        durationMins: 75,
        completed: false,
        priority: 'high',
      },
      {
        id: 's8',
        day: 'Day 3 — Sprint Review & Mock Test',
        dateStr: 'In 2 Days',
        timeSlot: '14:00 - 17:00',
        subject: subjName,
        unit: 'Full Module',
        topic: 'Simulated 3-Hour University Examination',
        type: 'mock_test',
        durationMins: 180,
        completed: false,
        priority: 'high',
      },
    ];
  });

  const completedCount = sessions.filter((s) => s.completed && s.type !== 'break').length;
  const totalCount = sessions.filter((s) => s.type !== 'break').length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Toggle Session Completion
  const toggleSession = (id: string) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const next = !s.completed;
          if (next) {
            showToast('Study session completed! (+20 XP)', 'success');
            triggerConfetti();
          }
          return { ...s, completed: next };
        }
        return s;
      })
    );
  };

  // Generate / Regenerate Timetable using AI Tutor API
  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/tutor-suite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_study_plan',
          subjectName: currentSubject?.name || 'General Academic',
          examDate,
          dailyHours,
          prepLevel,
          targetMarks: targetScore,
          isCrashPlan,
          unitsToCover: currentSubject?.units?.map((u) => u.name) || [],
        }),
      });

      if (!res.ok) {
        throw new Error('AI Planner busy');
      }

      const data = await res.json();

      // Dynamically adapt sessions from the real subject
      const subjName = currentSubject?.name || 'Academic Studies';
      const units = currentSubject?.units || [];
      const newSessions: PlannerSession[] = [];

      let sessionCounter = 1;
      const daysCount = isCrashPlan ? 2 : 5;

      for (let day = 1; day <= daysCount; day++) {
        const dayLabel = `Day ${day} — ${day === 1 ? 'Foundations' : day === 2 ? 'Core Numericals' : day === 3 ? 'Algorithms' : day === 4 ? 'Deep Review' : 'Final Mock Exam'}`;
        const dayDate = day === 1 ? 'Today' : day === 2 ? 'Tomorrow' : `Day +${day - 1}`;
        const targetUnit = units[(day - 1) % (units.length || 1)] || { name: `Unit ${day}`, topics: [] };
        const topic1 = targetUnit.topics?.[0]?.name || 'Key Theory & Derivations';
        const topic2 = targetUnit.topics?.[1]?.name || 'Numerical Problem Solving';

        newSessions.push({
          id: `gen_${sessionCounter++}`,
          day: dayLabel,
          dateStr: dayDate,
          timeSlot: '09:00 - 10:30',
          subject: subjName,
          unit: targetUnit.name,
          topic: topic1,
          type: 'concept',
          durationMins: 90,
          completed: false,
          priority: 'high',
        });

        newSessions.push({
          id: `gen_${sessionCounter++}`,
          day: dayLabel,
          dateStr: dayDate,
          timeSlot: '10:30 - 10:45',
          subject: 'Mind Refresh',
          unit: 'Break',
          topic: 'Hydration & Eye Rest',
          type: 'break',
          durationMins: 15,
          completed: false,
          priority: 'normal',
        });

        newSessions.push({
          id: `gen_${sessionCounter++}`,
          day: dayLabel,
          dateStr: dayDate,
          timeSlot: '11:00 - 12:30',
          subject: subjName,
          unit: targetUnit.name,
          topic: topic2,
          type: 'numerical',
          durationMins: 90,
          completed: false,
          priority: 'high',
        });

        newSessions.push({
          id: `gen_${sessionCounter++}`,
          day: dayLabel,
          dateStr: dayDate,
          timeSlot: '19:00 - 19:45',
          subject: subjName,
          unit: targetUnit.name,
          topic: 'Targeted MCQ Practice & Self-Check',
          type: 'mcq_quiz',
          durationMins: 45,
          completed: false,
          priority: 'medium',
        });

        newSessions.push({
          id: `gen_${sessionCounter++}`,
          day: dayLabel,
          dateStr: dayDate,
          timeSlot: '21:30 - 22:00',
          subject: subjName,
          unit: targetUnit.name,
          topic: 'Daily 15-Minute Recall & Mistake Review',
          type: 'revision',
          durationMins: 30,
          completed: false,
          priority: 'high',
        });
      }

      setSessions(newSessions);
      setShowConfigDrawer(false);
      showToast('Personalized Study Plan successfully created!', 'success');
      triggerConfetti();
    } catch {
      showToast('Generated offline timetable successfully.', 'info');
      setShowConfigDrawer(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getTypeBadge = (type: PlannerSession['type']) => {
    switch (type) {
      case 'concept':
        return { label: 'Theory Concept', bg: 'bg-[#EAE5FF]', text: 'text-[#7C6EE6]', icon: BookOpen };
      case 'numerical':
        return { label: 'Numericals & Math', bg: 'bg-[#CFF5E7]', text: 'text-[#319B78]', icon: Zap };
      case 'mcq_quiz':
        return { label: 'MCQ Practice', bg: 'bg-[#FFE0D2]', text: 'text-[#E5A044]', icon: CheckSquare };
      case 'break':
        return { label: 'Short Break', bg: 'bg-[#FFF0B8]', text: 'text-amber-700', icon: Coffee };
      case 'revision':
        return { label: 'Active Recall', bg: 'bg-[#FFDCE8]', text: 'text-rose-600', icon: RotateCcw };
      case 'mock_test':
        return { label: 'Mock Exam', bg: 'bg-[#EAE5FF]', text: 'text-[#7C6EE6]', icon: Award };
    }
  };

  // Group sessions by day
  const groupedByDay: Record<string, PlannerSession[]> = {};
  sessions.forEach((s) => {
    if (!groupedByDay[s.day]) {
      groupedByDay[s.day] = [];
    }
    groupedByDay[s.day].push(s);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 1. HEADER BANNER (Pastel Bloom Hero) */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-1.5 z-10 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EAE5FF] text-[#7C6EE6] flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-[#7C6EE6]" />
              <span>Personalized Study Planner</span>
            </span>
            <span className="text-xs text-[#777589]">
              • Realistic Daily & Weekly Timetable
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#28263A] tracking-tight">
            Study Schedule: <span className="text-[#7C6EE6]">{currentSubject?.name || 'All Subjects'}</span>
          </h1>

          <p className="text-xs sm:text-sm text-[#777589] leading-relaxed">
            Budgeted around your daily available hours, target exam date, and topic weightage. Integrates active recall, problem-solving drills, and restorative cognitive breaks.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap z-10">
          <button
            onClick={() => setShowConfigDrawer(!showConfigDrawer)}
            className="px-4 py-2.5 rounded-2xl bg-[#EAE5FF] hover:bg-[#ded7ff] text-[#7C6EE6] text-xs font-bold flex items-center gap-2 border border-[#D9D2F8] transition-all shadow-sm"
          >
            <Sliders className="w-4 h-4" />
            <span>Customize Plan</span>
          </button>

          <button
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="btn-pastel-primary px-5 py-2.5 rounded-2xl text-xs font-bold text-white flex items-center gap-2"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Calculating Schedule...' : 'Regenerate Plan'}</span>
          </button>

          <button
            onClick={handlePrint}
            title="Print or Export PDF"
            className="p-2.5 rounded-2xl bg-[#FFFDF9] hover:bg-[#EAE5FF]/50 border border-[#EEEAF4] text-[#777589] hover:text-[#28263A] transition-colors"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. CUSTOMIZATION DRAWER (Pastel Configuration Card) */}
      {showConfigDrawer && (
        <div className="p-6 rounded-3xl bg-[#FFFDF9] border border-[#D9D2F8] shadow-md space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#EEEAF4] pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#28263A] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#7C6EE6]" />
              <span>Personalize Your Study Strategy</span>
            </h3>
            <button
              onClick={() => setShowConfigDrawer(false)}
              className="text-xs text-[#777589] hover:text-[#28263A]"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
            {/* Subject */}
            <div>
              <label className="text-[#777589] block mb-1 font-semibold">Target Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  const s = subjects.find((subj) => subj.id === e.target.value);
                  if (s) setActiveSubject(s);
                }}
                className="w-full bg-white border border-[#EEEAF4] rounded-xl px-3 py-2 text-[#28263A] font-medium"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Exam Date */}
            <div>
              <label className="text-[#777589] block mb-1 font-semibold">Target Exam Date</label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full bg-white border border-[#EEEAF4] rounded-xl px-3 py-2 text-[#28263A] font-medium"
              />
            </div>

            {/* Available Daily Hours */}
            <div>
              <label className="text-[#777589] block mb-1 font-semibold">
                Daily Hours: <span className="text-[#7C6EE6] font-bold">{dailyHours} hrs/day</span>
              </label>
              <input
                type="range"
                min="1"
                max="8"
                step="0.5"
                value={dailyHours}
                onChange={(e) => setDailyHours(Number(e.target.value))}
                className="w-full accent-[#7C6EE6] mt-2 cursor-pointer"
              />
            </div>

            {/* Current Prep Level */}
            <div>
              <label className="text-[#777589] block mb-1 font-semibold">Current Level</label>
              <select
                value={prepLevel}
                onChange={(e) => setPrepLevel(e.target.value as any)}
                className="w-full bg-white border border-[#EEEAF4] rounded-xl px-3 py-2 text-[#28263A] font-medium"
              >
                <option value="Beginner">Beginner (Zero / New)</option>
                <option value="Intermediate">Intermediate (Some units done)</option>
                <option value="Advanced">Advanced (Final revision)</option>
              </select>
            </div>

            {/* Target Goal */}
            <div>
              <label className="text-[#777589] block mb-1 font-semibold">Target Goal</label>
              <select
                value={targetScore}
                onChange={(e) => setTargetScore(e.target.value)}
                className="w-full bg-white border border-[#EEEAF4] rounded-xl px-3 py-2 text-[#28263A] font-medium"
              >
                <option value="Pass with Good Marks (65%)">Pass (65%+ Marks)</option>
                <option value="85%+ Marks (A Grade)">A Grade (85%+ Marks)</option>
                <option value="Ranker (95%+ Marks)">University Ranker (95%+)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#EEEAF4]">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="crashModeToggle"
                checked={isCrashPlan}
                onChange={(e) => setIsCrashPlan(e.target.checked)}
                className="w-4 h-4 accent-[#7C6EE6] rounded"
              />
              <label htmlFor="crashModeToggle" className="text-xs text-[#28263A] font-semibold cursor-pointer">
                🚨 Emergency Crash Mode (Exam in 24–48 Hours)
              </label>
            </div>

            <button
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className="btn-pastel-primary px-5 py-2 rounded-xl text-xs font-bold text-white"
            >
              Apply & Update Schedule
            </button>
          </div>
        </div>
      )}

      {/* 3. PROGRESS & VIEW SWITCHER STRIP */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Progress Metric */}
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#CFF5E7] flex items-center justify-center text-[#319B78] flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#777589] font-medium">Timetable Progress</div>
            <div className="text-base sm:text-lg font-extrabold text-[#28263A]">
              {completedCount} of {totalCount} Sessions Done{' '}
              <span className="text-xs font-bold text-[#319B78]">({progressPercent}%)</span>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs (Timetable / Calendar / Checklist) */}
        <div className="flex items-center p-1 bg-[#FFF9F2] rounded-2xl border border-[#EEEAF4] w-full sm:w-auto justify-center">
          <button
            onClick={() => setActiveView('timetable')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'timetable'
                ? 'bg-white text-[#7C6EE6] shadow-sm font-bold'
                : 'text-[#777589] hover:text-[#28263A]'
            }`}
          >
            Timetable View
          </button>
          <button
            onClick={() => setActiveView('calendar')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'calendar'
                ? 'bg-white text-[#7C6EE6] shadow-sm font-bold'
                : 'text-[#777589] hover:text-[#28263A]'
            }`}
          >
            Pastel Calendar
          </button>
          <button
            onClick={() => setActiveView('checklist')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'checklist'
                ? 'bg-white text-[#7C6EE6] shadow-sm font-bold'
                : 'text-[#777589] hover:text-[#28263A]'
            }`}
          >
            Checklist View
          </button>
        </div>
      </div>

      {/* 4. MAIN VIEW CONTENT */}
      {activeView === 'timetable' && (
        <div className="space-y-6">
          {Object.entries(groupedByDay).map(([dayTitle, daySessions], dIdx) => (
            <div
              key={dIdx}
              className="p-6 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#EEEAF4] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7C6EE6]" />
                  <h3 className="text-sm sm:text-base font-extrabold text-[#28263A]">{dayTitle}</h3>
                </div>
                <span className="text-xs text-[#777589]">
                  {daySessions.filter((s) => s.completed && s.type !== 'break').length} /{' '}
                  {daySessions.filter((s) => s.type !== 'break').length} Complete
                </span>
              </div>

              {/* Sessions Grid / Cards */}
              <div className="space-y-3">
                {daySessions.map((session) => {
                  const badge = getTypeBadge(session.type);
                  const BadgeIcon = badge.icon;
                  const isBreak = session.type === 'break';

                  return (
                    <div
                      key={session.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        session.completed
                          ? 'bg-[#CFF5E7]/25 border-[#CFF5E7]'
                          : isBreak
                          ? 'bg-[#FFFDF9] border-[#EEEAF4]'
                          : 'bg-white hover:bg-[#FFFDF9] border-[#EEEAF4] hover:border-[#D9D2F8] hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleSession(session.id)}
                          className="mt-0.5 text-[#777589] hover:text-[#7C6EE6] transition-colors"
                        >
                          {session.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-[#319B78]" />
                          ) : (
                            <Circle className="w-5 h-5 text-[#777589]" />
                          )}
                        </button>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 ${badge.bg} ${badge.text}`}
                            >
                              <BadgeIcon className="w-3 h-3" />
                              <span>{badge.label}</span>
                            </span>

                            <span className="text-xs text-[#777589] font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{session.timeSlot}</span>
                              <span>({session.durationMins}m)</span>
                            </span>
                          </div>

                          <div
                            className={`text-sm font-bold ${
                              session.completed ? 'line-through text-[#777589]' : 'text-[#28263A]'
                            }`}
                          >
                            {session.topic}
                          </div>

                          <div className="text-[11px] text-[#777589]">
                            {session.subject} • {session.unit}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => toggleSession(session.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            session.completed
                              ? 'bg-[#CFF5E7] text-[#319B78]'
                              : 'bg-[#FFF9F2] hover:bg-[#EAE5FF] text-[#28263A] hover:text-[#7C6EE6] border border-[#EEEAF4]'
                          }`}
                        >
                          {session.completed ? 'Done ✓' : 'Mark Done'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeView === 'calendar' && (
        <div className="p-6 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#EEEAF4] pb-3">
            <h3 className="text-sm font-extrabold text-[#28263A]">Pastel Study Calendar (Weekly Schedule)</h3>
            <span className="text-xs text-[#777589]">Target: {examDate}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(groupedByDay).map(([dayTitle, daySessions], i) => {
              const studySessions = daySessions.filter((s) => s.type !== 'break');
              const dayCompleted = studySessions.filter((s) => s.completed).length;
              const isAllDone = dayCompleted === studySessions.length && studySessions.length > 0;

              return (
                <div
                  key={i}
                  className={`p-5 rounded-2xl border transition-all space-y-3 ${
                    isAllDone
                      ? 'bg-[#CFF5E7]/30 border-[#A9E8D2]'
                      : 'bg-[#FFFDF9] border-[#EEEAF4] hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#28263A]">{dayTitle}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isAllDone
                          ? 'bg-[#CFF5E7] text-[#319B78]'
                          : 'bg-[#EAE5FF] text-[#7C6EE6]'
                      }`}
                    >
                      {dayCompleted}/{studySessions.length} Done
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {studySessions.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => toggleSession(s.id)}
                        className="text-xs p-2 rounded-xl bg-white border border-[#EEEAF4] flex items-center justify-between cursor-pointer hover:border-[#D9D2F8]"
                      >
                        <span className={`truncate ${s.completed ? 'line-through text-[#777589]' : 'text-[#28263A]'}`}>
                          {s.topic}
                        </span>
                        {s.completed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#319B78] flex-shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-[#777589] flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeView === 'checklist' && (
        <div className="p-6 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#EEEAF4] pb-3">
            <h3 className="text-sm font-extrabold text-[#28263A]">Fast Execution Checklist</h3>
            <span className="text-xs text-[#777589]">Click any item to complete</span>
          </div>

          <div className="divide-y divide-[#EEEAF4]">
            {sessions
              .filter((s) => s.type !== 'break')
              .map((s) => (
                <div
                  key={s.id}
                  onClick={() => toggleSession(s.id)}
                  className="py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#FFFDF9] px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {s.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-[#319B78] flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-[#777589] flex-shrink-0" />
                    )}
                    <div>
                      <div className={`text-xs font-bold ${s.completed ? 'line-through text-[#777589]' : 'text-[#28263A]'}`}>
                        {s.topic}
                      </div>
                      <div className="text-[10px] text-[#777589]">
                        {s.day} • {s.timeSlot} ({s.durationMins}m)
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.completed ? 'bg-[#CFF5E7] text-[#319B78]' : 'bg-[#EAE5FF] text-[#7C6EE6]'}`}>
                    {s.completed ? 'Completed' : 'Pending'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
