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
  Calendar,
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
        <div className="w-16 h-16 rounded-3xl bg-[#EAE5FF] text-[#7C6EE6] flex items-center justify-center mx-auto shadow-sm">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#28263A]">No Subject Selected</h2>
        <p className="text-sm text-[#777589]">Please choose or add a syllabus to begin studying.</p>
        <button
          onClick={() => setActiveTab('add-syllabus')}
          className="btn-pastel-primary px-5 py-2.5 rounded-2xl text-xs font-bold text-white shadow-sm"
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

  const subjectTitle =
    (subject.name && subject.name.trim()) ||
    (subject as any).title ||
    (subject as any).subjectName ||
    (subject.syllabusFileName ? subject.syllabusFileName.replace(/\.[^/.]+$/, '') : '') ||
    subject.code ||
    'Untitled Subject';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={() => setActiveTab('subjects')}
          className="flex items-center gap-2 text-xs font-semibold text-[#777589] hover:text-[#7C6EE6] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#7C6EE6]" />
          <span>Back to My Subjects</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setActiveSubject(subject);
              setActiveTab('cheatsheets');
            }}
            className="px-3.5 py-2 rounded-2xl text-xs font-semibold bg-white hover:bg-[#FFFDF9] border border-[#EEEAF4] text-[#28263A] transition-all shadow-sm"
          >
            Cheat Sheet
          </button>
          <button
            onClick={() => {
              setActiveSubject(subject);
              setActiveTab('paper-generator');
            }}
            className="btn-pastel-primary px-3.5 py-2 rounded-2xl text-xs font-bold text-white shadow-sm"
          >
            Question Paper
          </button>
          <SubjectMoreMenu subject={subject} />
        </div>
      </div>

      {/* Subject Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#EEEAF4] shadow-[0_4px_24px_rgba(40,38,58,0.04)] relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-[#7C6EE6] bg-[#EAE5FF] px-2.5 py-0.5 rounded-full border border-[#D9D2F8]/60">
                {subject.code || 'CST-004 / CSO-053'}
              </span>
              <span className="text-xs text-[#777589] font-medium">
                {subject.units.length} Units • {totalTopics} Topics
              </span>
              {subject.examDate && (
                <span className="text-xs text-[#E5A044] font-medium flex items-center gap-1 bg-[#FFE0D2]/50 px-2.5 py-0.5 rounded-full">
                  <Calendar className="w-3 h-3 text-[#E5A044]" />
                  <span>Exam: {subject.examDate}</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#28263A] leading-tight">
              {subjectTitle}
            </h1>
            <p className="text-xs sm:text-sm text-[#777589] max-w-3xl leading-relaxed">
              {subject.description || 'Comprehensive curriculum study material and syllabus breakdown.'}
            </p>
          </div>

          <div className="shrink-0 text-left sm:text-right space-y-1.5 p-4 rounded-2xl bg-[#FFFDF9] border border-[#EEEAF4]">
            <div className="text-xs font-semibold text-[#777589]">Preparation Progress</div>
            <div className="text-3xl font-black text-[#28263A] font-mono">{progressPercent}%</div>
            <div className="w-36 h-2 bg-[#F3F0F8] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#7C6EE6] to-[#A99EFA] rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Interrupted / Needs Retry Notice */}
      {(subject.analysisStatus === 'failed' || subject.units.length === 0) && (
        <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 text-left">
            <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Syllabus Safely Saved • AI Analysis Can Be Retried</span>
            </h3>
            <p className="text-xs text-amber-800 leading-relaxed">
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
            className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-[#7C6EE6] hover:bg-[#6A5AD6] text-white shadow-sm transition-all shrink-0 flex items-center gap-2"
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
        <h2 className="text-lg font-bold text-[#28263A] flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#7C6EE6]" />
          <span>Curriculum Modules & Study Material</span>
        </h2>

        <div className="space-y-4">
          {subject.units.map((unit, uIdx) => {
            const isExpanded = expandedUnits[unit.id] ?? true;
            const uCompleted = unit.topics.filter((t) => t.completed).length;

            return (
              <div
                key={unit.id}
                className="rounded-3xl bg-white border border-[#EEEAF4] overflow-hidden transition-all shadow-[0_4px_20px_rgba(40,38,58,0.03)] hover:border-[#D9D2F8]"
              >
                {/* Unit Header Bar */}
                <div
                  onClick={() => toggleUnitExpand(unit.id)}
                  className="p-5 bg-[#FFFDF9] hover:bg-[#EAE5FF]/20 cursor-pointer flex items-center justify-between border-b border-[#EEEAF4] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-[#EAE5FF] text-[#7C6EE6] font-mono text-xs flex items-center justify-center font-bold">
                      U{uIdx + 1}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-[#28263A]">{unit.name}</h3>
                      <div className="text-xs text-[#777589] font-medium">
                        {unit.topics.length} Topics • {uCompleted} Completed • {unit.weightage}% Exam Weightage
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline-block text-xs font-mono font-semibold text-[#7C6EE6] bg-[#EAE5FF] px-2.5 py-0.5 rounded-full">
                      {Math.round((uCompleted / Math.max(1, unit.topics.length)) * 100)}% Complete
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#777589]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#777589]" />
                    )}
                  </div>
                </div>

                {/* Topics List */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 space-y-2.5">
                    {unit.topics.map((topic) => (
                      <div
                        key={topic.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          topic.completed
                            ? 'bg-[#FFFDF9]/60 border-[#EEEAF4] opacity-80'
                            : 'bg-[#FFFDF9] border-[#EEEAF4] hover:border-[#D9D2F8]'
                        } flex flex-col md:flex-row md:items-center justify-between gap-3`}
                      >
                        {/* Topic info & toggle */}
                        <div className="flex items-start gap-3 flex-1">
                          <button
                            onClick={() => toggleTopicCompleted(topic.id)}
                            className="mt-0.5 text-[#777589] hover:text-[#7C6EE6] transition-colors focus:outline-none"
                            title={topic.completed ? 'Mark as incomplete' : 'Mark as complete (+10 XP)'}
                          >
                            {topic.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-[#319B78]" />
                            ) : (
                              <Circle className="w-5 h-5 text-[#EEEAF4] hover:text-[#7C6EE6]" />
                            )}
                          </button>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-sm font-bold ${
                                  topic.completed ? 'line-through text-[#777589]' : 'text-[#28263A]'
                                }`}
                              >
                                {topic.name}
                              </span>

                              {/* Priority Pill */}
                              {topic.priority === 'very_important' && (
                                <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-[#FFE0D2] text-[#E5A044] border border-[#FFCBB3]">
                                  🔥 Very Important
                                </span>
                              )}
                              {topic.priority === 'important' && (
                                <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-[#FFF0B8] text-amber-800 border border-[#FFE58A]">
                                  ⭐ Important
                                </span>
                              )}
                              {topic.priority === 'moderate' && (
                                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#EAE5FF] text-[#7C6EE6] border border-[#D9D2F8]">
                                  🟡 Moderate
                                </span>
                              )}
                              {topic.priority === 'low' && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FFFDF9] text-[#777589] border border-[#EEEAF4]">
                                  ⚪ Low Priority
                                </span>
                              )}
                            </div>

                            {topic.priorityReason && (
                              <p className="text-xs text-[#777589] leading-tight">
                                {topic.priorityReason}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Fast Launch Tools - Coordinated Pastel Badges */}
                        <div className="flex items-center gap-1.5 flex-wrap shrink-0 pt-2 md:pt-0">
                          <button
                            onClick={() => {
                              setSelectedTopicId(topic.id);
                              setActiveTab('notes');
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#EAE5FF] hover:bg-[#ded7ff] text-[#7C6EE6] transition-colors"
                            title="Open AI Notes & Explain Differently"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Notes</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedTopicId(topic.id);
                              setActiveTab('important-questions');
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#FFF0B8]/70 hover:bg-[#FFF0B8] text-amber-800 transition-colors"
                            title="Important Questions (2M/5M/10M)"
                          >
                            <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                            <span className="hidden sm:inline">Questions</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedTopicId(topic.id);
                              setActiveTab('mcqs');
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#CFF5E7]/70 hover:bg-[#CFF5E7] text-[#319B78] transition-colors"
                            title="MCQs"
                          >
                            <CheckSquare className="w-3.5 h-3.5 text-[#319B78]" />
                            <span className="hidden sm:inline">Quiz</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedTopicId(topic.id);
                              setActiveTab('numericals');
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#FFE0D2]/70 hover:bg-[#FFE0D2] text-[#E5A044] transition-colors"
                            title="Numericals & Step-by-Step Solutions"
                          >
                            <Binary className="w-3.5 h-3.5 text-[#E5A044]" />
                            <span className="hidden sm:inline">Numericals</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedTopicId(topic.id);
                              setActiveTab('mindmaps');
                            }}
                            className="p-2 rounded-xl text-xs font-semibold bg-[#FFDCE8]/70 hover:bg-[#FFDCE8] text-rose-600 transition-colors"
                            title="Mind Map"
                          >
                            <GitBranch className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedTopicId(topic.id);
                              setActiveTab('ask-ai');
                            }}
                            className="btn-pastel-primary px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1"
                            title="Ask AI Tutor"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">AI Tutor</span>
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
