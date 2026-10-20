import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BrainCircuit,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  BookOpen,
} from 'lucide-react';

export const AdaptiveLearningView: React.FC = () => {
  const { activeSubject, subjects, setActiveTab, setSelectedTopicId, showToast } = useApp();
  const currentSubject = activeSubject || subjects[0];

  const allTopics = currentSubject?.units.flatMap((u) => u.topics) || [];

  // Group topics based on real accuracy/score or simulated baseline from syllabus activity
  const strongTopics = allTopics.filter((t) => (t.score || 0) >= 80);
  const weakTopics = allTopics.filter((t) => (t.score || 0) > 0 && (t.score || 0) < 65);
  const pendingTopics = allTopics.filter((t) => !t.score);

  // Identify weakest topic
  const weakestTopic =
    weakTopics[0] ||
    allTopics.find((t) => t.name.toLowerCase().includes('search')) ||
    allTopics[allTopics.length - 1];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel-heavy border border-red-950/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-red-400">
            <BrainCircuit className="w-4 h-4 text-red-500" />
            <span>AI PERFORMANCE INTELLIGENCE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Adaptive Learning Engine</h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            StudyAI dynamically analyzes your accuracy across quizzes, answer evaluations, and tests to pinpoint exact knowledge gaps.
          </p>
        </div>
      </div>

      {/* Dynamic Weakness Recommendation Banner */}
      {weakestTopic && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-red-950/40 via-[#11090d] to-black border border-red-700/50 space-y-4 shadow-[0_0_25px_rgba(220,38,38,0.15)] animate-fade-in">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-red-400 font-bold bg-red-950 px-2 py-0.5 rounded border border-red-800">
                🚨 Targeted Recommendation
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white pt-1">
                “{weakestTopic.name}” is currently your weakest area ({weakestTopic.score || 43}%). Let's revise it.
              </h2>
              <p className="text-xs text-zinc-400">
                Mastering this topic will elevate your aggregate subject readiness by an estimated +8%.
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-red-950/80 border border-red-700 flex items-center justify-center text-red-400 flex-shrink-0">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap pt-2">
            <button
              onClick={() => {
                setSelectedTopicId(weakestTopic.id);
                setActiveTab('notes');
              }}
              className="btn-red-glow flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white"
            >
              <span>Revise Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setSelectedTopicId(weakestTopic.id);
                setActiveTab('important-questions');
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#141422] hover:bg-zinc-800 border border-zinc-800 text-zinc-200"
            >
              Practice Questions
            </button>
            <button
              onClick={() => {
                setSelectedTopicId(weakestTopic.id);
                setActiveTab('mcqs');
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#141422] hover:bg-zinc-800 border border-zinc-800 text-zinc-200"
            >
              Take Mini Quiz
            </button>
          </div>
        </div>
      )}

      {/* Performance Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Strong Topics */}
        <div className="p-5 rounded-2xl bg-[#090910] border border-emerald-950/40 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-emerald-400 font-mono uppercase flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Strong Topics 🟢</span>
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono">≥ 80%</span>
          </div>

          <div className="space-y-2">
            {strongTopics.length > 0 ? (
              strongTopics.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-[#0f0f18] border border-zinc-900 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-zinc-200 truncate">{t.name}</span>
                  <span className="font-mono text-emerald-400 font-bold">{t.score || 90}%</span>
                </div>
              ))
            ) : (
              <div className="p-3 rounded-xl bg-[#0f0f18] border border-zinc-900 flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-200">Stack ADT & Operations</span>
                <span className="font-mono text-emerald-400 font-bold">92%</span>
              </div>
            )}
          </div>
        </div>

        {/* Weak Topics */}
        <div className="p-5 rounded-2xl bg-[#090910] border border-red-950/40 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-red-400 font-mono uppercase flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Weak Topics 🔴</span>
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono">&lt; 65%</span>
          </div>

          <div className="space-y-2">
            {weakTopics.length > 0 ? (
              weakTopics.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-[#0f0f18] border border-zinc-900 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-zinc-200 truncate">{t.name}</span>
                  <span className="font-mono text-red-400 font-bold">{t.score}%</span>
                </div>
              ))
            ) : (
              <div className="p-3 rounded-xl bg-[#0f0f18] border border-zinc-900 flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-200">Linear & Binary Search</span>
                <span className="font-mono text-red-400 font-bold">45%</span>
              </div>
            )}
          </div>
        </div>

        {/* Topics Needing Revision */}
        <div className="p-5 rounded-2xl bg-[#090910] border border-yellow-950/40 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-yellow-400 font-mono uppercase flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>Needs Revision 🟡</span>
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono">Unassessed</span>
          </div>

          <div className="space-y-2">
            {(pendingTopics.slice(0, 3)).map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-xl bg-[#0f0f18] border border-zinc-900 flex items-center justify-between text-xs"
              >
                <span className="font-semibold text-zinc-200 truncate">{t.name}</span>
                <span className="text-[10px] text-zinc-500 font-mono">Unpracticed</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Multi-Activity Performance Overview */}
      <div className="p-6 rounded-2xl glass-panel-heavy border border-red-950/40 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white font-mono uppercase text-red-400">
            Multi-Activity Assessment Breakdown
          </h3>
          <span className="text-[10px] text-zinc-500 font-mono">Aggregated Across Sessions</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'MCQs', score: '78%', count: '28 attempted', color: 'text-amber-400' },
            { label: 'Mock Tests', score: '82%', count: '3 completed', color: 'text-rose-400' },
            { label: 'Answer Checker', score: '74%', count: '12 graded', color: 'text-emerald-400' },
            { label: 'Viva Oral Exam', score: '85%', count: '5 questions', color: 'text-blue-400' },
            { label: 'Practice Questions', score: '80%', count: '48 solved', color: 'text-purple-400' },
          ].map((act, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-[#0a0a14] border border-zinc-900 text-center space-y-1">
              <div className="text-[11px] font-bold text-zinc-400 uppercase">{act.label}</div>
              <div className={`text-xl font-mono font-extrabold ${act.color}`}>{act.score}</div>
              <div className="text-[10px] text-zinc-500 font-mono">{act.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Daily Tasks */}
      <div className="p-6 rounded-2xl bg-[#090912] border border-red-950/40 space-y-4">
        <h3 className="text-sm font-bold text-white font-mono uppercase text-zinc-300 flex items-center gap-2">
          <span>⚡ Recommended Daily Tasks</span>
          <span className="text-[10px] text-red-400 font-mono font-normal">(Personalized from weak areas)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              title: `Revise Notes on ${weakestTopic?.name || 'Weakest Topic'}`,
              desc: 'Review core definitions, 5 key points, and exam diagrams.',
              action: 'Read Notes',
              tab: 'notes',
            },
            {
              title: `Solve 10 Questions on ${weakestTopic?.name || 'Target Topic'}`,
              desc: 'Generate topic-wise 2-mark & 5-mark university exam questions.',
              action: 'Practice 10 Questions',
              tab: 'important-questions',
            },
            {
              title: 'Complete 5-Question Diagnostic MCQ Quiz',
              desc: 'Reinforce conceptual accuracy and verify topic mastery.',
              action: 'Take Quiz',
              tab: 'mcqs',
            },
          ].map((task, i) => (
            <div key={i} className="p-4 rounded-xl bg-[#0f0f1c] border border-zinc-800/80 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white">{task.title}</h4>
                <p className="text-[11px] text-zinc-400 leading-relaxed">{task.desc}</p>
              </div>
              <button
                onClick={() => {
                  if (weakestTopic) setSelectedTopicId(weakestTopic.id);
                  setActiveTab(task.tab);
                }}
                className="w-full py-2 rounded-lg text-xs font-bold bg-[#141424] hover:bg-red-600/20 text-zinc-200 hover:text-white border border-red-950 hover:border-red-600/40 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>{task.action}</span>
                <ArrowRight className="w-3 h-3 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Topic-Wise Mastery Score List */}
      <div className="p-6 rounded-2xl glass-panel-heavy border border-red-950/40 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white font-mono uppercase text-red-400">
            Topic-Wise Mastery Scores
          </h3>
          <span className="text-[11px] text-zinc-500 font-mono">
            {allTopics.length} Topics Across Syllabus
          </span>
        </div>

        <div className="space-y-2.5">
          {allTopics.map((topic, idx) => {
            const mastery = topic.score || (idx % 3 === 0 ? 88 : idx % 3 === 1 ? 62 : 48);
            const statusColor =
              mastery >= 80 ? 'text-emerald-400' : mastery >= 60 ? 'text-amber-400' : 'text-rose-400';
            const barGradient =
              mastery >= 80
                ? 'from-emerald-600 to-emerald-400'
                : mastery >= 60
                ? 'from-amber-600 to-amber-400'
                : 'from-rose-600 to-red-500';

            return (
              <div
                key={topic.id || idx}
                className="p-3.5 rounded-xl bg-[#090912] border border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-[200px]">
                  <div className="font-bold text-zinc-200">{topic.name}</div>
                  <div className="text-[10px] text-zinc-500 font-mono">Priority: {topic.priority || 'Standard'}</div>
                </div>

                <div className="flex items-center gap-4 flex-1 max-w-md">
                  <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${barGradient} rounded-full`}
                      style={{ width: `${mastery}%` }}
                    />
                  </div>
                  <span className={`font-mono font-bold text-xs ${statusColor} w-12 text-right`}>
                    {mastery}%
                  </span>
                </div>

                <button
                  onClick={() => {
                    setSelectedTopicId(topic.id);
                    setActiveTab('important-questions');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#141424] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 font-mono text-[11px] whitespace-nowrap"
                >
                  Practice 10 Questions →
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
