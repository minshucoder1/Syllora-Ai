import React from 'react';
import { useApp } from '../context/AppContext';
import {
  BookOpen,
  FileText,
  HelpCircle,
  CheckSquare,
  Binary,
  Layers,
  Calendar,
  Award,
  Mic,
  MessageSquare,
  FileClock,
  CheckCircle2,
  GitBranch,
  Target,
  Code,
  Timer,
  AlertTriangle,
  FileSpreadsheet,
  BrainCircuit,
  Package,
  Users,
  Trophy,
  Sparkles,
  ArrowRight,
  Flame,
  Compass,
  MessageCircle,
} from 'lucide-react';

export const AIToolsCatalogView: React.FC = () => {
  const { setActiveTab } = useApp();

  const toolCategories = [
    {
      title: '📚 Learn',
      description: 'Foundational concept mastery, structured notes, visual maps & cheat sheets',
      tools: [
        {
          id: 'notes',
          name: 'AI Structured Notes',
          desc: '13-part exhaustive notes with algorithms, examples, and exam highlights',
          icon: FileText,
          badge: 'Popular',
        },
        {
          id: 'priority-topics',
          name: 'AI Priority Topics',
          desc: 'Classifies topics into Very Important, Important, and Moderate with exam rationale',
          icon: Flame,
          badge: '🔥 Hot',
        },
        {
          id: 'mindmaps',
          name: 'Mind Map Generator',
          desc: 'Interactive visual node canvas with zoom, pan, and collapsible hierarchies',
          icon: GitBranch,
        },
        {
          id: 'cheatsheets',
          name: 'One-Page Cheat Sheet',
          desc: 'Highly compressed formula and definitions summary for pre-exam review',
          icon: FileSpreadsheet,
        },
      ],
    },
    {
      title: '📝 Practice',
      description: 'Active recall, university numericals, viva voice prep & code execution',
      tools: [
        {
          id: 'important-questions',
          name: 'Important Questions',
          desc: 'Curated 2-Mark, 5-Mark, and 10-Mark questions with model answers',
          icon: HelpCircle,
        },
        {
          id: 'mcqs',
          name: 'MCQ Quiz Engine',
          desc: 'Targeted quizzes with instant answer reasoning and distractor explanations',
          icon: CheckSquare,
        },
        {
          id: 'numericals',
          name: 'Numericals & Design',
          desc: '10-point rigorous format: Given, Formula, Step-by-Step, Final Answer, Verification',
          icon: Binary,
        },
        {
          id: 'flashcards',
          name: 'Active Recall Flashcards',
          desc: 'Digital 3D flipcards tracking learned vs difficult concepts',
          icon: Layers,
        },
        {
          id: 'answer-checker',
          name: 'AI Answer Checker',
          desc: 'Professor rubric evaluation grading correctness, completeness, and presentation',
          icon: CheckCircle2,
          badge: 'Rubric',
        },
        {
          id: 'viva',
          name: 'Voice Viva Prep',
          desc: 'Interactive spoken oral examination with AI speech-to-text and instant feedback',
          icon: Mic,
          badge: 'Voice',
        },
        {
          id: 'coding-lab',
          name: 'CSE Coding Lab',
          desc: 'Multi-language code sandbox with AI debugging and complexity breakdown',
          icon: Code,
        },
      ],
    },
    {
      title: '🎯 Exam & Strategy',
      description: 'Historical paper analytics, forecast predictions & custom mock exams',
      tools: [
        {
          id: 'previous-papers',
          name: 'Previous Papers Analyzer',
          desc: 'Upload past papers to identify unit weightage, repeated topics, and patterns',
          icon: FileClock,
        },
        {
          id: 'exam-prediction',
          name: 'AI Exam Prediction',
          desc: 'Forecasts high-probability topics and expected question styles with academic rationale',
          icon: Target,
          badge: 'Predict',
        },
        {
          id: 'paper-generator',
          name: 'Question Paper Generator',
          desc: 'Generates full university-style question papers with Sections A, B, and C',
          icon: Sparkles,
        },
        {
          id: 'last-minute',
          name: 'Last-Minute Revision (🚨)',
          desc: 'Emergency sprint schedule for students with an exam tomorrow',
          icon: AlertTriangle,
          badge: '🚨 Urgent',
        },
      ],
    },
    {
      title: '🧠 Smart Learning',
      description: 'Adaptive weakness diagnosis, time management & personal tutor',
      tools: [
        {
          id: 'roadmap',
          name: 'AI Study Roadmap',
          desc: 'Autonomous day-by-day learning schedule adapted to your exam date, available hours & quiz weaknesses',
          icon: Compass,
          badge: 'Autonomous',
        },
        {
          id: 'adaptive',
          name: 'Adaptive Learning Engine',
          desc: 'Diagnoses weak topics (<65%) and recommends targeted drills',
          icon: BrainCircuit,
          badge: 'Smart',
        },
        {
          id: 'planner',
          name: 'Smart Study Planner',
          desc: 'Custom study schedule tailored to your available hours and exam countdown',
          icon: Calendar,
        },
        {
          id: 'focus-mode',
          name: 'Focus Pomodoro Mode',
          desc: 'Distraction-free ambient study timer that records study hours and streak',
          icon: Timer,
        },
        {
          id: 'study-pack',
          name: 'Complete Study Pack',
          desc: 'Bundles notes, questions, flashcards, mind maps, and mock tests into one PDF',
          icon: Package,
        },
        {
          id: 'ask-ai',
          name: 'AI Study Chat Tutor',
          desc: 'All-in-One study companion: ask doubts, Hinglish explanations, derivations, roadmaps, study plans & exam questions',
          icon: MessageSquare,
          badge: 'All-in-One 🧠',
        },
      ],
    },
    {
      title: '🏆 Motivation & Social',
      description: 'Daily streak momentum, XP level progression & private study circles',
      tools: [
        {
          id: 'friend-chat',
          name: 'Chat with Friends',
          desc: 'Create private study rooms, share unique room codes, and chat in real-time',
          icon: MessageCircle,
          badge: 'Live 🔥',
        },
        {
          id: 'groups',
          name: 'Study Groups',
          desc: 'Private circles to share syllabus progress and group discussions',
          icon: Users,
        },
        {
          id: 'achievements',
          name: 'Achievements & Streaks',
          desc: 'Unlock badges for learning milestones and daily study streaks',
          icon: Trophy,
        },
      ],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/40 text-red-400 text-xs font-mono font-bold">
          <Sparkles className="w-3.5 h-3.5 text-red-500" />
          <span>ALL 22 ADVANCED STUDY TOOLS</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          StudyAI Tools <span className="text-red-500">Catalog</span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Curated intelligence tools organized by learning phase — from syllabus ingestion to exam mastery.
        </p>
      </div>

      {/* Category Sections */}
      <div className="space-y-10">
        {toolCategories.map((cat, cIdx) => (
          <div key={cIdx} className="space-y-4">
            <div className="border-b border-red-950/40 pb-2">
              <h2 className="text-lg font-bold text-white tracking-tight">{cat.title}</h2>
              <p className="text-xs text-zinc-400">{cat.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {cat.tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <div
                    key={tool.id}
                    onClick={() => setActiveTab(tool.id)}
                    className="p-5 rounded-2xl bg-[#090912] border border-red-950/40 hover:border-red-600/50 card-hover-glow cursor-pointer flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-xl bg-red-950/60 border border-red-800/40 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
                          <Icon className="w-4 h-4" />
                        </div>
                        {tool.badge && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                            {tool.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {tool.desc}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-bold text-red-500 pt-2 border-t border-zinc-900">
                      <span>Launch Tool</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
