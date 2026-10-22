import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  Target,
  FileClock,
  Layers,
  HelpCircle,
  Binary,
  Mic,
  Code,
  Flame,
  BrainCircuit,
  AlertTriangle,
  Timer,
  CheckSquare,
  Shield,
  Zap,
  MessageCircle,
  Compass,
  Calendar,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { openSyllabusFlow, setActiveTab, setIsAuthModalOpen, setAuthMode } = useApp();

  const pipelineSteps = [
    { label: 'Syllabus', icon: '📄', bg: 'bg-[#EAE5FF]', text: 'text-[#7C6EE6]' },
    { label: 'AI Analysis', icon: '⚡', bg: 'bg-[#FFE0D2]', text: 'text-[#E5A044]' },
    { label: 'Smart Notes', icon: '📚', bg: 'bg-[#FFF0B8]', text: 'text-amber-800' },
    { label: 'Questions', icon: '❓', bg: 'bg-[#FFDCE8]', text: 'text-rose-600' },
    { label: 'Practice', icon: '🎯', bg: 'bg-[#CFF5E7]', text: 'text-[#319B78]' },
    { label: 'Revision', icon: '🔁', bg: 'bg-[#EAE5FF]', text: 'text-[#7C6EE6]' },
    { label: 'Exam Ready 🎯', icon: '🏆', highlight: true, bg: 'bg-[#7C6EE6]', text: 'text-white' },
  ];

  const features = [
    {
      title: 'Live Friend Chat (Room Code)',
      desc: 'Create private study rooms, share unique codes, and solve doubts together in real-time.',
      icon: MessageCircle,
      bg: 'bg-[#EAE5FF]',
      border: 'border-[#D9D2F8]',
      accent: 'text-[#7C6EE6]',
    },
    {
      title: 'AI Study Chat Tutor',
      desc: '24/7 academic companion for doubts, Hinglish derivations, and step-by-step solutions.',
      icon: Sparkles,
      bg: 'bg-[#FFE0D2]',
      border: 'border-[#FFCBB3]',
      accent: 'text-[#E5A044]',
    },
    {
      title: 'Structured Study Roadmap',
      desc: 'Prerequisite-ordered topic paths with easy, medium, and difficult difficulty labels.',
      icon: Compass,
      bg: 'bg-[#CFF5E7]',
      border: 'border-[#A9E8D2]',
      accent: 'text-[#319B78]',
    },
    {
      title: 'Personalized Study Planner',
      desc: 'Daily and weekly timetable budgeted around your target exam date and available hours.',
      icon: Calendar,
      bg: 'bg-[#FFF0B8]',
      border: 'border-[#FFE58A]',
      accent: 'text-amber-700',
    },
    {
      title: 'Distraction-Free Short Notes',
      desc: '1-page condensed revision sheets, formulas with SI units, and difference tables.',
      icon: FileText,
      bg: 'bg-[#FFDCE8]',
      border: 'border-[#FFB8D2]',
      accent: 'text-rose-600',
    },
    {
      title: 'Important Exam Questions',
      desc: 'Categorized 2M, 5M, 10M model answers, high-yield derivations, and numerical questions.',
      icon: HelpCircle,
      bg: 'bg-[#EAE5FF]',
      border: 'border-[#D9D2F8]',
      accent: 'text-[#7C6EE6]',
    },
    {
      title: 'Interactive MCQ Sprint Drills',
      desc: 'Rapid diagnostic quizzes with instant scoring rubrics and detailed explanations.',
      icon: CheckSquare,
      bg: 'bg-[#CFF5E7]',
      border: 'border-[#A9E8D2]',
      accent: 'text-[#319B78]',
    },
    {
      title: 'Priority Topics (🔥 High Yield)',
      desc: 'Automatically isolates high-weightage topics based on university exam patterns.',
      icon: Flame,
      bg: 'bg-[#FFE0D2]',
      border: 'border-[#FFCBB3]',
      accent: 'text-[#E5A044]',
    },
    {
      title: 'Emergency Last-Minute Revision',
      desc: 'Targeted triage sprints for students facing semester examinations tomorrow.',
      icon: AlertTriangle,
      bg: 'bg-[#FFDCE8]',
      border: 'border-[#FFB8D2]',
      accent: 'text-rose-600',
    },
    {
      title: 'AI Answer Checker',
      desc: 'Professor-grade rubric evaluations highlighting missing exam keywords and model solutions.',
      icon: CheckCircle2,
      bg: 'bg-[#CFF5E7]',
      border: 'border-[#A9E8D2]',
      accent: 'text-[#319B78]',
    },
    {
      title: 'Autonomous Mind Maps',
      desc: 'Visual knowledge trees showing topic dependencies and hierarchical flow.',
      icon: Layers,
      bg: 'bg-[#FFF0B8]',
      border: 'border-[#FFE58A]',
      accent: 'text-amber-700',
    },
    {
      title: 'CSE Coding Lab Sandbox',
      desc: 'Multi-language code runner with algorithmic complexity breakdowns and line-by-line tips.',
      icon: Code,
      bg: 'bg-[#EAE5FF]',
      border: 'border-[#D9D2F8]',
      accent: 'text-[#7C6EE6]',
    },
  ];

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-24">
      {/* 1. HERO SECTION */}
      <div className="text-center space-y-6 max-w-4xl mx-auto">
        {/* Brand Logo Emblem */}
        <div className="flex justify-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white p-1.5 shadow-[0_10px_35px_rgba(24,47,83,0.14)] border-2 border-[#D9D2F8] hover:scale-105 transition-all duration-300">
            <img
              src="/syllora-logo.png"
              alt="SYLLORA AI — Your AI Study Companion"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EAE5FF] border border-[#D9D2F8] text-[#182F53] text-xs font-semibold tracking-wide shadow-sm">
          <span className="text-[#D9A441]">✦</span>
          <span>OFFICIAL SYLLORA AI • DEVELOPED BY MINSHU KUMAR</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#182F53] tracking-tight leading-[1.12]">
          Turn Your Syllabus Into <br />
          <span className="text-[#159E9A]">Complete Study Material ✨</span>
        </h1>

        <p className="text-base sm:text-lg text-[#777589] max-w-2xl mx-auto leading-relaxed">
          Upload your syllabus or enter any topic. Syllora AI crafts structured short notes,
          Hinglish doubt breakdowns, daily roadmaps, important questions, and realistic study timetables.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3 flex-wrap">
          <button
            onClick={() => openSyllabusFlow()}
            className="btn-pastel-primary flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl text-sm font-bold text-white shadow-md w-full sm:w-auto"
          >
            <span>Generate Study Material</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab('friend-chat')}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold bg-[#FFDCE8] hover:bg-[#fed0df] text-[#7C6EE6] border border-[#FFB8D2] shadow-sm transition-all w-full sm:w-auto"
          >
            <MessageCircle className="w-4 h-4 text-[#7C6EE6]" />
            <span>Chat with Friends 💬</span>
          </button>

          <button
            onClick={() => setActiveTab('ai-tools')}
            className="px-6 py-3.5 rounded-2xl text-sm font-semibold text-[#28263A] hover:text-[#7C6EE6] bg-white hover:bg-[#FFFDF9] border border-[#EEEAF4] shadow-sm transition-all w-full sm:w-auto"
          >
            Explore 20+ AI Tools
          </button>
        </div>

        {/* Pipeline Strip */}
        <div className="pt-6">
          <div className="p-4 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm overflow-x-auto scrollbar-none">
            <div className="flex items-center justify-center gap-2 min-w-max px-2">
              {pipelineSteps.map((step, idx) => (
                <React.Fragment key={idx}>
                  <div
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold ${step.bg} ${step.text} ${
                      step.highlight ? 'shadow-sm' : ''
                    }`}
                  >
                    <span>{step.icon}</span>
                    <span>{step.label}</span>
                  </div>
                  {idx < pipelineSteps.length - 1 && (
                    <span className="text-[#777589] font-mono text-xs">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. PASTEL FEATURES GRID */}
      <div className="space-y-8">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#28263A]">
            Everything a Student Needs in One Place
          </h2>
          <p className="text-xs sm:text-sm text-[#777589]">
            Designed with soothing pastel aesthetics to keep long study sessions calming and productive.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-3xl bg-white border border-[#EEEAF4] hover:border-[#D9D2F8] shadow-sm hover:shadow-md transition-all duration-200 space-y-3 group hover:-translate-y-1"
              >
                <div
                  className={`w-12 h-12 rounded-2xl ${feat.bg} flex items-center justify-center ${feat.accent} shadow-sm group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#28263A]">{feat.title}</h3>
                <p className="text-xs sm:text-sm text-[#777589] leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. MOTIVATIONAL STUDY CTA CARD */}
      <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#EAE5FF] via-[#FFF0B8]/40 to-[#FFE0D2] border border-[#EEEAF4] text-center space-y-5 shadow-sm max-w-3xl mx-auto">
        <div className="text-3xl">🌸 📚 ✨</div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#28263A]">
          Ready to Ace Your Semester Exams?
        </h2>
        <p className="text-sm text-[#777589] max-w-lg mx-auto">
          Join thousands of students turning complex college syllabi into top-scoring academic grades.
        </p>
        <button
          onClick={() => openSyllabusFlow()}
          className="btn-pastel-primary px-8 py-3.5 rounded-2xl text-sm font-bold text-white shadow-md inline-flex items-center gap-2"
        >
          <span>Get Started with Syllora AI</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
