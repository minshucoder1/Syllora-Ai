import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SubjectMoreMenu } from '../components/SubjectMoreMenu';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  FileText,
  HelpCircle,
  CheckSquare,
  Binary,
  Layers,
  GitBranch,
  MessageSquare,
  Flame,
  Star,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowLeft,
  Trash2,
} from 'lucide-react';

export const SubjectDetailView: React.FC = () => {
  const {
    activeSubject,
    setActiveSubject,
    subjects,
    setActiveTab,
    setSelectedTopicId,
    toggleTopicCompleted,
    showToast,
    retrySubjectAnalysis,
  } = useApp();

  const [isRetrying, setIsRetrying] = useState(false);
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({
    unit_1: true,
    unit_2: true,
  });

  const subject = activeSubject || subjects[0];

  if (!subject) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">No Subject Selected</h2>
        <p className="text-sm text-zinc-400">Please choose or add a syllabus to begin studying.</p>
        <button
          onClick={() => setActiveTab('add-syllabus')}
          className="btn-red-glow px-4 py-2 rounded-xl text-xs font-bold text-white"
        >
          Add Syllabus
        </button>
      </div>
    );
  }

  const toggleUnitExpand = (unitId: string) => {
    setExpandedUnits((prev) => ({
      ...prev,
      [unitId]: !prev[unitId],
    }));
  };

  const totalTopics = subject.units.reduce((acc, u) => acc + u.topics.length, 0);
  const completedTopics = subject.units.reduce(
    (acc, u) => acc + u.topics.filter((t) => t.completed).length,
    0
  );
  const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-red-500" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveSubject(subject);
              setActiveTab('cheatsheets');
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#12121c] hover:bg-zinc-800 border border-red-950 text-zinc-200"
          >
            Generate Cheat Sheet
          </button>
          <button
            onClick={() => {
              setActiveSubject(subject);
              setActiveTab('paper-generator');
            }}
            className="btn-red-glow px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
          >
            Generate Question Paper
          </button>
          <SubjectMoreMenu subject={subject} />
        </div>
      </div>

      {/* Subject Header Card */}
      <div className="glass-panel-heavy rounded-2xl p-6 sm:p-8 border border-red-950/40 relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-red-400 bg-red-950/60 px-2.5 py-0.5 rounded border border-red-800/40">
                {subject.code || 'CORE'}
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                {subject.units.length} Units • {totalTopics} Topics
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{subject.name}</h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-3xl leading-relaxed">
              {subject.description}
            </p>
          </div>

          <div className="flex-shrink-0 text-right space-y-1.5">
            <div className="text-xs text-zinc-400">Preparation Progress</div>
            <div className="text-2xl font-extrabold text-white font-mono">{progressPercent}%</div>
            <div className="w-32 h-1.5 bg-zinc-900 rounded-full overflow-hidden ml-auto">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute right-0 top-0 w-72 h-full bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Analysis Interrupted / Needs Retry Notice */}
      {(subject.analysisStatus === 'failed' || subject.units.length === 0) && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/40 border border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 text-left">
            <h3 className="text-sm font-bold text-amber-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Syllabus Safely Saved • AI Analysis Can Be Retried</span>
            </h3>
            <p className="text-xs text-amber-300/80 leading-relaxed">
              Your syllabus text and uploaded files are permanently preserved in the database. You can generate or re-analyze the curriculum without uploading again.
            </p>
          </div>
          <button
            onClick={async () => {
              setIsRetrying(true);
              try {
                await retrySubjectAnalysis(subject.id);
              } finally {
                setIsRetrying(false);
              }
            }}
            disabled={isRetrying}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg transition-all shrink-0 flex items-center gap-2"
          >
            {isRetrying ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing Curriculum...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Retry AI Analysis</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Units & Curriculum Hierarchy */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-red-500" />
          <span>Curriculum Modules & Study Material</span>
        </h2>

        <div className="space-y-4">
          {subject.units.map((unit, uIdx) => {
            const isExpanded = expandedUnits[unit.id] ?? true;
            const uCompleted = unit.topics.filter((t) => t.completed).length;

            return (
              <div
                key={unit.id}
                className="rounded-2xl bg-[#090910] border border-red-950/40 overflow-hidden transition-all shadow-md"
              >
                {/* Unit Header Bar */}
                <div
                  onClick={() => toggleUnitExpand(unit.id)}
                  className="p-4 sm:p-5 bg-[#0e0e16] hover:bg-[#12121d] cursor-pointer flex items-center justify-between border-b border-red-950/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-red-950/80 text-red-400 font-mono text-xs flex items-center justify-center font-bold border border-red-800/40">
                      U{uIdx + 1}
                    </span>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white">{unit.name}</h3>
                      <div className="text-[11px] text-zinc-400">
                        {unit.topics.length} Topics • {uCompleted} Completed • {unit.weightage}% Exam Weightage
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline-block text-xs font-mono text-zinc-400">
                      {Math.round((uCompleted / Math.max(1, unit.topics.length)) * 100)}% Complete
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400" />
                    )}
                  </div>
                </div>

                {/* Topics List */}
                {isExpanded && (
                  <div className="p-3 sm:p-4 space-y-2">
                    {unit.topics.map((topic, tIdx) => (
                      <div
                        key={topic.id}
                        className={`p-3 sm:p-4 rounded-xl border transition-all ${
                          topic.completed
                            ? 'bg-[#0a0a14]/60 border-zinc-900 opacity-80'
                            : 'bg-[#0f0f18] border-red-950/50 hover:border-red-600/30'
                        } flex flex-col md:flex-row md:items-center justify-between gap-3`}
                      >
                        {/* Topic info & toggle */}
                        <div className="flex items-start gap-3 flex-1">
                          <button
                            onClick={() => toggleTopicCompleted(topic.id)}
                            className="mt-0.5 text-zinc-500 hover:text-red-500 transition-colors focus:outline-none"
                            title={topic.completed ? 'Mark as incomplete' : 'Mark as complete (+10 XP)'}
                          >
                            {topic.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            ) : (
                              <Circle className="w-5 h-5 text-zinc-600 hover:text-red-400" />
                            )}
                          </button>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-sm font-bold ${
                                  topic.completed ? 'line-through text-zinc-400' : 'text-zinc-100'
                                }`}
                              >
                                {topic.name}
                              </span>

                              {/* Priority Pill */}
                              {topic.priority === 'very_important' && (
                                <span className="text-[10px] font-bold font-mono px-2 py-0.2 rounded bg-red-950 text-red-400 border border-red-700/60 shadow-[0_0_8px_rgba(239,68,68,0.2)]">
                                  🔥 Very Important
                                </span>
                              )}
                              {topic.priority === 'important' && (
                                <span className="text-[10px] font-bold font-mono px-2 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                                  ⭐ Important
                                </span>
                              )}
                              {topic.priority === 'moderate' && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-yellow-950 text-yellow-300 border border-yellow-800">
                                  🟡 Moderate
                                </span>
                              )}
                              {topic.priority === 'low' && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                                  ⚪ Low Priority
                                </span>
                              )}
                            </div>

                            {topic.priorityReason && (
                              <p className="text-[11px] text-zinc-400 leading-tight">
                                {topic.priorityReason}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Fast Launch Tools */}
                        <div className="flex items-center gap-1.5 flex-wrap flex-shrink-0 pt-2 md:pt-0">
                          <button
                            onClick={() => {
                              setSelectedTopicId(topic.id);
                              setActiveTab('notes');
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-950/40 hover:bg-red-900/40 border border-red-800/40 text-red-300 hover:text-white transition-colors"
                            title="Open AI Notes & Explain Differently"
                          >
                            <FileText className="w-3.5 h-3.5 text-red-400" />
                            <span>Notes</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedTopicId(topic.id);
                              setActiveTab('important-questions');
                            }}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-[#141420] hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
                            title="Important Questions (2M/5M/10M)"
                          >
                            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                            <span className="hidden sm:inline">Questions</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedTopicId(topic.id);
                              setActiveTab('mcqs');
                            }}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-[#141420] hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
                            title="MCQs"
                          >
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="hidden sm:inline">Quiz</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedTopicId(topic.id);
                              setActiveTab('numericals');
                            }}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-[#141420] hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
                            title="Numericals & Step-by-Step Solutions"
                          >
                            <Binary className="w-3.5 h-3.5 text-purple-400" />
                            <span className="hidden sm:inline">Numericals</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedTopicId(topic.id);
                              setActiveTab('mindmaps');
                            }}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-[#141420] hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
                            title="Mind Map"
                          >
                            <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedTopicId(topic.id);
                              setActiveTab('ask-ai');
                            }}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-[#141420] hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
                            title="Ask AI Tutor"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
