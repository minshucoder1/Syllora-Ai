import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SubjectMoreMenu } from '../components/SubjectMoreMenu';
import {
  BookOpen,
  PlusCircle,
  Search,
  Calendar,
  Layers,
  ArrowRight,
  Archive,
  ArchiveRestore,
  Sparkles,
  BookMarked,
  Flame,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Loader2,
  Clock,
} from 'lucide-react';

export const MySubjectsView: React.FC = () => {
  const {
    subjects,
    setActiveSubject,
    setActiveTab,
    openSyllabusFlow,
    setIsGlobalSearchOpen,
    isLoadingSubjects,
    subjectsError,
    refreshSubjects,
    retrySubjectAnalysis,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'active' | 'archived'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const activeSubjects = subjects.filter((s) => !s.archived);
  const archivedSubjects = subjects.filter((s) => s.archived);

  const displayedList = (activeFilter === 'active' ? activeSubjects : archivedSubjects).filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.code && s.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleRetryAnalysis = async (e: React.MouseEvent, subjectId: string) => {
    e.stopPropagation();
    setRetryingId(subjectId);
    try {
      await retrySubjectAnalysis(subjectId);
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EAE5FF] text-[#7C6EE6] flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#7C6EE6]" />
              <span>Curriculum Hub</span>
            </span>
            <span className="text-xs text-[#777589]">
              • {activeSubjects.length} Active • {archivedSubjects.length} Archived
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#28263A]">
            My Subjects & Syllabi
          </h1>
          <p className="text-xs sm:text-sm text-[#777589] leading-relaxed">
            Manage your enrolled university syllabi, module weightages, and exam study materials. Your syllabuses and progress are permanently saved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => refreshSubjects()}
            disabled={isLoadingSubjects}
            title="Reload subjects from database"
            className="p-2.5 rounded-2xl bg-[#FFFDF9] hover:bg-[#EAE5FF]/50 border border-[#EEEAF4] text-[#777589] hover:text-[#28263A] transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 text-[#7C6EE6] ${isLoadingSubjects ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline text-xs font-semibold">Refresh</span>
          </button>

          <button
            onClick={() => setIsGlobalSearchOpen(true)}
            className="px-4 py-2.5 rounded-2xl text-xs font-semibold bg-[#FFFDF9] hover:bg-[#EAE5FF]/50 border border-[#EEEAF4] text-[#28263A] transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#7C6EE6]" />
            <span>Search Topic</span>
          </button>

          <button
            onClick={() => openSyllabusFlow()}
            className="btn-pastel-primary px-4 py-2.5 rounded-2xl text-xs font-bold text-white flex items-center gap-2 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Syllabus</span>
          </button>
        </div>
      </div>

      {/* Database Error Banner with Retry */}
      {subjectsError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-4 text-xs text-rose-700">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{subjectsError}</span>
          </div>
          <button
            onClick={() => refreshSubjects()}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 border border-rose-300 text-rose-600 font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-white border border-[#EEEAF4] shadow-sm">
          <button
            onClick={() => setActiveFilter('active')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeFilter === 'active'
                ? 'bg-[#EAE5FF] text-[#7C6EE6] shadow-sm'
                : 'text-[#777589] hover:text-[#28263A]'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5" />
            <span>Active ({activeSubjects.length})</span>
          </button>

          <button
            onClick={() => setActiveFilter('archived')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeFilter === 'archived'
                ? 'bg-[#EAE5FF] text-[#7C6EE6] shadow-sm'
                : 'text-[#777589] hover:text-[#28263A]'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archived ({archivedSubjects.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#777589] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subjects or codes..."
            className="w-full pl-9 pr-3.5 py-2 rounded-2xl bg-white border border-[#EEEAF4] focus:border-[#7C6EE6] focus:outline-none text-xs text-[#28263A] placeholder-[#777589] shadow-sm transition-colors"
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoadingSubjects && subjects.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-5 rounded-2xl bg-[#0a0a14] border border-red-950/30 space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="w-16 h-5 bg-zinc-800/80 rounded" />
                <div className="w-6 h-6 bg-zinc-800/80 rounded" />
              </div>
              <div className="w-3/4 h-5 bg-zinc-800/80 rounded" />
              <div className="w-full h-10 bg-zinc-800/50 rounded" />
              <div className="w-full h-8 bg-zinc-800/70 rounded-xl" />
            </div>
          ))}
        </div>
      ) : displayedList.length === 0 ? (
        /* Empty State */
        <div className="p-12 rounded-2xl bg-[#090910] border border-red-950/40 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-red-950/50 border border-red-800/40 flex items-center justify-center mx-auto text-red-400">
            {activeFilter === 'active' ? (
              <BookOpen className="w-7 h-7" />
            ) : (
              <Archive className="w-7 h-7" />
            )}
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-white">
              {searchQuery
                ? `No subjects match "${searchQuery}"`
                : activeFilter === 'active'
                ? 'No active subjects yet'
                : 'No archived subjects'}
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
              {searchQuery
                ? 'Try a different search term or add a new syllabus.'
                : activeFilter === 'active'
                ? 'Add your course syllabus to generate personalized notes, questions, and predictions, or start learning any topic directly.'
                : 'Archived subjects will be stored here safely without cluttering your active study dashboard.'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => openSyllabusFlow()}
              className="btn-red-glow px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Syllabus</span>
            </button>
            <button
              onClick={() => setIsGlobalSearchOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#141422] hover:bg-zinc-800 border border-zinc-800 text-zinc-200 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-red-500" />
              <span>Learn Any Topic</span>
            </button>
          </div>
        </div>
      ) : (
        /* Populated Subjects Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedList.map((subj) => {
            const allTopics = subj.units.flatMap((u) => u.topics);
            const completedCount = allTopics.filter((t) => t.completed).length;
            const progress =
              allTopics.length > 0
                ? Math.round((completedCount / allTopics.length) * 100)
                : 0;

            const isFailed = subj.analysisStatus === 'failed';
            const isAnalyzing = subj.analysisStatus === 'analyzing' || retryingId === subj.id;
            const formattedDate = subj.createdAt
              ? new Date(subj.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Saved';

            return (
              <div
                key={subj.id}
                className="p-5 rounded-2xl bg-[#0a0a14] border border-red-950/40 card-hover-glow space-y-4 relative flex flex-col justify-between text-left"
              >
                {/* Header row with Code & More Menu */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-mono font-bold text-red-400 px-2 py-0.5 rounded bg-red-950/60 border border-red-800/40">
                        {subj.code || 'CORE'}
                      </span>
                      {subj.archived && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/40 text-blue-300">
                          Archived
                        </span>
                      )}
                      {isFailed && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/70 border border-amber-800/50 text-amber-300 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-400" />
                          <span>Needs Analysis</span>
                        </span>
                      )}
                    </div>

                    {/* [⋮] More Options Menu */}
                    <SubjectMoreMenu subject={subj} />
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-white leading-snug line-clamp-1">
                    {subj.name}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {subj.description || 'University syllabus component imported into Syllora AI.'}
                  </p>

                  {/* Upload Date & Metadata */}
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono pt-1">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    <span>Uploaded {formattedDate}</span>
                  </div>
                </div>

                {/* Metrics & Progress or Retry Prompt */}
                <div className="space-y-3 pt-3 border-t border-zinc-900/80">
                  {isFailed ? (
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-900/50 text-amber-300 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span className="leading-snug text-[11px]">
                          Syllabus is safely saved. Click below to retry AI analysis without re-uploading.
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleRetryAnalysis(e, subj.id)}
                        disabled={isAnalyzing}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold bg-amber-950/80 hover:bg-amber-900/80 text-amber-200 border border-amber-700/60 transition-all"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Analyzing Syllabus...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Retry AI Analysis</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                        <span>{subj.units.length} Units • {allTopics.length} Topics</span>
                        <span className="text-zinc-200 font-bold">{progress}%</span>
                      </div>

                      <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      {subj.examDate && (
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
                          <Calendar className="w-3 h-3 text-red-400" />
                          <span>Exam: {subj.examDate}</span>
                        </div>
                      )}

                      {/* Open Subject Button */}
                      <button
                        onClick={() => {
                          setActiveSubject(subj);
                          setActiveTab('subject-detail');
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold bg-[#141422] hover:bg-red-600/20 text-zinc-200 hover:text-white border border-red-950 hover:border-red-600/40 transition-all group"
                      >
                        <span>Continue Preparation</span>
                        <ArrowRight className="w-3.5 h-3.5 text-red-500 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
