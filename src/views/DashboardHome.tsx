import React from 'react';
import { useApp } from '../context/AppContext';
import { SubjectMoreMenu } from '../components/SubjectMoreMenu';
import {
  BookOpen,
  CheckCircle2,
  HelpCircle,
  CheckSquare,
  Clock,
  Flame,
  TrendingUp,
  PlusCircle,
  AlertTriangle,
  ArrowRight,
  Target,
  Sparkles,
  Award,
  Zap,
  Calendar,
  Compass,
  RefreshCw,
  AlertCircle,
  MessageCircle,
  MessageSquare,
  FileText,
  Lightbulb,
} from 'lucide-react';

export const DashboardHome: React.FC = () => {
  const {
    user,
    subjects,
    setActiveSubject,
    setActiveTab,
    openSyllabusFlow,
    isLoadingSubjects,
    subjectsError,
    refreshSubjects,
  } = useApp();

  // Aggregate stats across subjects
  const totalTopics = subjects.reduce(
    (acc, s) => acc + s.units.reduce((uAcc, u) => uAcc + u.topics.length, 0),
    0
  );
  const completedTopics = subjects.reduce(
    (acc, s) => acc + s.units.reduce((uAcc, u) => uAcc + u.topics.filter((t) => t.completed).length, 0),
    0
  );
  const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // High Priority Topics
  const priorityTopics = subjects.flatMap((s) =>
    s.units.flatMap((u) =>
      u.topics
        .filter((t) => t.priority === 'very_important')
        .map((t) => ({ ...t, subjectName: s.name, unitName: u.name }))
    )
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. WELCOME CARD (Pastel Bloom Hero) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#FFFDF9] via-white to-[#EAE5FF]/40 border border-[#EEEAF4] shadow-[0_4px_24px_rgba(40,38,58,0.04)] relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2.5 z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAE5FF] text-[#7C6EE6] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#7C6EE6]" />
            <span>Pastel Bloom Student Edition</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#28263A] tracking-tight leading-snug">
            Hey, {user?.name || 'Student'}! <br className="hidden sm:inline" />
            <span className="text-[#7C6EE6]">Ready to learn something new? ✨</span>
          </h1>

          <p className="text-sm sm:text-base text-[#777589] leading-relaxed">
            Your personalized AI study companion is ready. Master your syllabus with simplified Hinglish explanations, clear derivations, and structured roadmaps.
          </p>

          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <button
              onClick={() => {
                if (subjects.length > 0) {
                  setActiveSubject(subjects[0]);
                  setActiveTab('ask-ai');
                } else {
                  openSyllabusFlow();
                }
              }}
              className="btn-pastel-primary px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2"
            >
              <span>Continue Learning</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('roadmap')}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#EAE5FF] hover:bg-[#ded7ff] text-[#7C6EE6] border border-[#EAE5FF] transition-all"
            >
              Build My Study Roadmap →
            </button>

            <button
              onClick={() => openSyllabusFlow()}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#CFF5E7]/70 hover:bg-[#CFF5E7] text-[#319B78] border border-[#CFF5E7] transition-all flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Syllabus</span>
            </button>
          </div>
        </div>

        {/* Soft Pastel Aesthetic Illustration */}
        <div className="hidden lg:flex items-center justify-center p-6 bg-gradient-to-tr from-[#EAE5FF]/80 via-[#FFF0B8]/40 to-[#FFE0D2]/60 rounded-3xl border border-[#EEEAF4] shadow-sm relative w-72 h-48 flex-shrink-0">
          <div className="text-center space-y-2">
            <div className="w-18 h-18 rounded-full bg-white shadow-md p-1 flex items-center justify-center mx-auto border border-[#EEEAF4] overflow-hidden">
              <img
                src="/syllora-logo.png"
                alt="SYLLORA AI Logo"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div className="text-xs font-bold text-[#182F53] flex items-center justify-center gap-1 leading-none">
              <span>SYLLORA</span>
              <span className="text-[#159E9A]">AI</span>
              <span className="text-[#D9A441] text-[10px]">✦</span>
            </div>
            <div className="text-[11px] text-[#777589]">Your AI Study Companion</div>
          </div>
          <span className="absolute top-3 right-3 text-lg">🌸</span>
          <span className="absolute bottom-3 left-3 text-lg">✨</span>
        </div>
      </div>

      {/* 2. QUICK ACTIONS (Pastel-Colored Coordinated Cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#28263A] uppercase tracking-wider font-mono flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#7C6EE6]" />
            <span>Quick Study Actions</span>
          </h2>
          <span className="text-xs text-[#777589]">Everything you need to prepare</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* Card 1: AI Study Chat Tutor */}
          <button
            onClick={() => setActiveTab('ask-ai')}
            className="p-4 rounded-2xl bg-[#EAE5FF]/70 hover:bg-[#EAE5FF] border border-[#D9D2F8] text-left transition-all duration-200 shadow-sm hover:-translate-y-1 hover:shadow-md flex flex-col justify-between group"
          >
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#7C6EE6] shadow-sm mb-2 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#28263A]">AI Study Chat</div>
              <div className="text-[10px] text-[#777589] line-clamp-1">Doubts & Hinglish</div>
            </div>
          </button>

          {/* Card 2: Create Study Roadmap */}
          <button
            onClick={() => setActiveTab('roadmap')}
            className="p-4 rounded-2xl bg-[#CFF5E7]/70 hover:bg-[#CFF5E7] border border-[#A9E8D2] text-left transition-all duration-200 shadow-sm hover:-translate-y-1 hover:shadow-md flex flex-col justify-between group"
          >
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#319B78] shadow-sm mb-2 group-hover:scale-110 transition-transform">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#28263A]">Study Roadmap</div>
              <div className="text-[10px] text-[#777589] line-clamp-1">Topic sequence</div>
            </div>
          </button>

          {/* Card 3: Generate Study Plan */}
          <button
            onClick={() => setActiveTab('planner')}
            className="p-4 rounded-2xl bg-[#FFE0D2]/70 hover:bg-[#FFE0D2] border border-[#FFCBB3] text-left transition-all duration-200 shadow-sm hover:-translate-y-1 hover:shadow-md flex flex-col justify-between group"
          >
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#E5A044] shadow-sm mb-2 group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#28263A]">Study Plan</div>
              <div className="text-[10px] text-[#777589] line-clamp-1">Daily timetable</div>
            </div>
          </button>

          {/* Card 4: Make Short Notes */}
          <button
            onClick={() => setActiveTab('notes')}
            className="p-4 rounded-2xl bg-[#FFF0B8]/70 hover:bg-[#FFF0B8] border border-[#FFE58A] text-left transition-all duration-200 shadow-sm hover:-translate-y-1 hover:shadow-md flex flex-col justify-between group"
          >
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-amber-600 shadow-sm mb-2 group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#28263A]">Short Notes</div>
              <div className="text-[10px] text-[#777589] line-clamp-1">1-page revision</div>
            </div>
          </button>

          {/* Card 5: Important Questions */}
          <button
            onClick={() => setActiveTab('important-questions')}
            className="p-4 rounded-2xl bg-[#FFDCE8]/70 hover:bg-[#FFDCE8] border border-[#FFB8D2] text-left transition-all duration-200 shadow-sm hover:-translate-y-1 hover:shadow-md flex flex-col justify-between group"
          >
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-rose-500 shadow-sm mb-2 group-hover:scale-110 transition-transform">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#28263A]">Exam Questions</div>
              <div className="text-[10px] text-[#777589] line-clamp-1">2M, 5M & 10M</div>
            </div>
          </button>

          {/* Card 6: Practice MCQs */}
          <button
            onClick={() => setActiveTab('mcqs')}
            className="p-4 rounded-2xl bg-[#EAE5FF]/70 hover:bg-[#EAE5FF] border border-[#D9D2F8] text-left transition-all duration-200 shadow-sm hover:-translate-y-1 hover:shadow-md flex flex-col justify-between group"
          >
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#7C6EE6] shadow-sm mb-2 group-hover:scale-110 transition-transform">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#28263A]">Practice MCQs</div>
              <div className="text-[10px] text-[#777589] line-clamp-1">Sprint test drills</div>
            </div>
          </button>

          {/* Card 7: Quick Revision */}
          <button
            onClick={() => setActiveTab('last-minute')}
            className="p-4 rounded-2xl bg-[#FFE0D2]/70 hover:bg-[#FFE0D2] border border-[#FFCBB3] text-left transition-all duration-200 shadow-sm hover:-translate-y-1 hover:shadow-md flex flex-col justify-between group"
          >
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#E5A044] shadow-sm mb-2 group-hover:scale-110 transition-transform">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#28263A]">Quick Revision</div>
              <div className="text-[10px] text-[#777589] line-clamp-1">Exam tomorrow 🚨</div>
            </div>
          </button>

          {/* Card 8: Add Syllabus */}
          <button
            onClick={() => openSyllabusFlow()}
            className="p-4 rounded-2xl bg-[#CFF5E7]/70 hover:bg-[#CFF5E7] border border-[#A9E8D2] text-left transition-all duration-200 shadow-sm hover:-translate-y-1 hover:shadow-md flex flex-col justify-between group"
          >
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#319B78] shadow-sm mb-2 group-hover:scale-110 transition-transform">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#28263A]">Add Syllabus</div>
              <div className="text-[10px] text-[#777589] line-clamp-1">Upload PDF/Text</div>
            </div>
          </button>
        </div>
      </div>

      {/* 3. PROGRESS DASHBOARD (Stat Cards & Completion) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[
          {
            label: 'Total Subjects',
            val: subjects.length,
            icon: BookOpen,
            color: 'text-[#7C6EE6]',
            bg: 'bg-[#EAE5FF]',
          },
          {
            label: 'Topics Completed',
            val: `${completedTopics} / ${totalTopics}`,
            icon: CheckCircle2,
            color: 'text-[#319B78]',
            bg: 'bg-[#CFF5E7]',
          },
          {
            label: 'Study Streak',
            val: `${user?.currentStreak || 7} Days`,
            icon: Flame,
            color: 'text-[#E5A044]',
            bg: 'bg-[#FFE0D2]',
          },
          {
            label: 'Daily Study Goal',
            val: '2.5 / 3.0 hrs',
            icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-[#FFF0B8]',
          },
          {
            label: 'Syllabus Complete',
            val: `${overallProgress}%`,
            icon: TrendingUp,
            color: 'text-[#7C6EE6]',
            bg: 'bg-[#EAE5FF]',
          },
          {
            label: 'Upcoming Target',
            val: '18 Days Left',
            icon: Target,
            color: 'text-rose-500',
            bg: 'bg-[#FFDCE8]',
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="p-4 rounded-2xl bg-white border border-[#EEEAF4] shadow-sm hover:shadow-md transition-all space-y-2 relative"
            >
              <div className={`w-8 h-8 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className="text-lg sm:text-xl font-bold text-[#28263A] tracking-tight">{stat.val}</div>
              <div className="text-[11px] text-[#777589] font-medium">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* 4. MAIN WORKSPACE: Continue Learning (Subjects) + Exam Target & Priority Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Continue Learning & Subjects */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-[#28263A] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#7C6EE6]" />
              <span>Continue Learning</span>
            </h2>
            <button
              onClick={() => setActiveTab('subjects')}
              className="text-xs font-semibold text-[#7C6EE6] hover:underline"
            >
              View All ({subjects.length})
            </button>
          </div>

          {subjectsError ? (
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <p className="text-xs text-rose-700">{subjectsError}</p>
              <button
                onClick={() => refreshSubjects()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-rose-600 border border-rose-300 inline-flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Loading Subjects</span>
              </button>
            </div>
          ) : isLoadingSubjects && subjects.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((n) => (
                <div key={n} className="p-5 rounded-2xl bg-white border border-[#EEEAF4] animate-pulse space-y-3">
                  <div className="w-16 h-4 bg-slate-100 rounded" />
                  <div className="w-3/4 h-5 bg-slate-100 rounded" />
                  <div className="w-full h-8 bg-slate-100/60 rounded" />
                </div>
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white border border-[#EEEAF4] text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-[#EAE5FF] flex items-center justify-center mx-auto text-[#7C6EE6]">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#28263A]">No subjects added yet</h3>
                <p className="text-xs text-[#777589]">Enter or upload your syllabus to start learning with AI.</p>
              </div>
              <button
                onClick={() => openSyllabusFlow()}
                className="btn-pastel-primary px-4 py-2 rounded-xl text-xs font-semibold text-white"
              >
                + Add First Syllabus
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subjects.map((subj) => {
                const sTopics = subj.units.flatMap((u) => u.topics);
                const sCompleted = sTopics.filter((t) => t.completed).length;
                const sPercent = sTopics.length > 0 ? Math.round((sCompleted / sTopics.length) * 100) : 0;

                return (
                  <div
                    key={subj.id}
                    className="p-5 rounded-3xl bg-white border border-[#EEEAF4] hover:border-[#D9D2F8] shadow-sm hover:shadow-md transition-all space-y-4 relative flex flex-col justify-between"
                  >
                    {(() => {
                      const subjectTitle =
                        (subj.name && subj.name.trim()) ||
                        (subj as any).title ||
                        (subj as any).subjectName ||
                        (subj.syllabusFileName ? subj.syllabusFileName.replace(/\.[^/.]+$/, '') : '') ||
                        subj.code ||
                        'Untitled Subject';
                      return (
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-[#7C6EE6] px-2.5 py-0.5 rounded-full bg-[#EAE5FF] font-mono">
                              {subj.code || 'CORE'}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[#777589]">
                                {subj.units.length} Units • {sTopics.length} Topics
                              </span>
                              <SubjectMoreMenu subject={subj} />
                            </div>
                          </div>
                          <h3 className="text-base font-bold text-[#28263A] leading-tight break-words">{subjectTitle}</h3>
                          <p className="text-xs text-[#777589] line-clamp-2">{subj.description || 'Complete curriculum syllabus'}</p>
                        </div>
                      );
                    })()}

                    <div className="space-y-3 pt-3 border-t border-[#EEEAF4]">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#777589]">Progress</span>
                          <span className="font-bold text-[#28263A]">{sPercent}%</span>
                        </div>
                        <div className="w-full h-2 bg-[#F3F0F8] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#7C6EE6] to-[#A99EFA] rounded-full transition-all duration-500"
                            style={{ width: `${sPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setActiveSubject(subj);
                            setActiveTab('ask-ai');
                          }}
                          className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-[#EAE5FF] hover:bg-[#ded7ff] text-[#7C6EE6] transition-all flex items-center justify-center gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>AI Tutor</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveSubject(subj);
                            setActiveTab('subject-detail');
                          }}
                          className="py-2 px-3 rounded-xl text-xs font-bold bg-white hover:bg-[#FFFDF9] border border-[#EEEAF4] text-[#28263A] hover:text-[#7C6EE6] transition-all flex items-center gap-1"
                        >
                          <span>Resume</span>
                          <ArrowRight className="w-3 h-3 text-[#7C6EE6]" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Exam Target Banner (Pastel Card) */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-[#FFFDF9] to-[#FFE0D2]/40 border border-[#EEEAF4] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#FFE0D2] flex items-center justify-center text-[#E5A044] shadow-sm">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#E5A044] font-bold">
                  Target Exam Countdown
                </span>
                <div className="text-base font-bold text-[#28263A]">
                  {subjects[0]?.name || 'Final Semester Exams'}
                </div>
                <div className="text-xs text-[#777589]">Target Date: 2026-11-20</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-black text-[#28263A]">18 DAYS</div>
                <div className="text-[10px] text-[#777589]">Preparation at {overallProgress}%</div>
              </div>
              <button
                onClick={() => setActiveTab('exam-prediction')}
                className="btn-pastel-primary px-3.5 py-2 rounded-xl text-xs font-semibold text-white shadow-sm"
              >
                View AI Prediction
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: High Priority Topics & Study Tips */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#E5A044]" />
              <h2 className="text-base font-bold text-[#28263A]">Study These First</h2>
            </div>
            <span className="text-[10px] text-[#319B78] font-bold bg-[#CFF5E7] px-2 py-0.5 rounded-full">
              AI Priority
            </span>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-[#EEEAF4] space-y-3 shadow-sm">
            <p className="text-xs text-[#777589] leading-relaxed">
              Topics weighted by recurring question patterns, mark distributions, and foundational prerequisites.
            </p>

            {priorityTopics.length === 0 ? (
              <div className="text-xs text-[#777589] py-4 text-center">
                Add a syllabus to unlock AI priority topic classifications.
              </div>
            ) : (
              <div className="space-y-2.5">
                {priorityTopics.slice(0, 5).map((pt, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      const parentSubj = subjects.find((s) => s.name === pt.subjectName);
                      if (parentSubj) {
                        setActiveSubject(parentSubj);
                        setActiveTab('ask-ai');
                      }
                    }}
                    className="p-3 rounded-2xl bg-[#FFFDF9] border border-[#EEEAF4] hover:border-[#7C6EE6]/40 cursor-pointer transition-all space-y-1.5 group hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#28263A] group-hover:text-[#7C6EE6] transition-colors truncate">
                        {pt.name}
                      </span>
                      <span className="text-[10px] font-bold text-[#E5A044] bg-[#FFE0D2] px-2 py-0.5 rounded-full flex-shrink-0">
                        🔥 High
                      </span>
                    </div>
                    <p className="text-[11px] text-[#777589] line-clamp-2">{pt.priorityReason}</p>
                    <div className="flex items-center justify-between text-[10px] text-[#777589] pt-1">
                      <span>{pt.unitName}</span>
                      <span className="text-[#7C6EE6] font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Ask AI Tutor →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setActiveTab('priority-topics')}
              className="w-full py-2 text-center text-xs font-bold text-[#7C6EE6] hover:underline transition-colors"
            >
              Explore Full Priority Matrix →
            </button>
          </div>

          {/* Friendly Pastel Study Tip Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-[#FFF0B8]/60 to-[#FFE0D2]/40 border border-[#FFF0B8] space-y-2 shadow-sm">
            <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span>Pastel Bloom Daily Study Tip</span>
            </div>
            <p className="text-xs text-[#28263A] leading-relaxed">
              Studying with spaced 25-minute sprints and asking the AI Tutor to derive formulas in <strong>Hinglish</strong> improves long-term concept retention by over 40%!
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="pt-6 pb-2 text-center text-xs text-[#777589] border-t border-[#EEEAF4]">
        © 2026 Syllora AI. All rights reserved. | Developed By Minshu Kumar
      </footer>
    </div>
  );
};
