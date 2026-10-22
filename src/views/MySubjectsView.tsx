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
              className="p-6 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="w-20 h-6 bg-[#EAE5FF]/60 rounded-full" />
                <div className="w-7 h-7 bg-[#EEEAF4] rounded-full" />
              </div>
              <div className="w-3/4 h-6 bg-[#EEEAF4] rounded-lg" />
              <div className="w-full h-10 bg-[#FFFDF9] border border-[#EEEAF4] rounded-xl" />
              <div className="w-full h-9 bg-[#EAE5FF]/40 rounded-xl" />
            </div>
          ))}
        </div>
      ) : displayedList.length === 0 ? (
        /* Empty State */
        <div className="p-12 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-[#EAE5FF] border border-[#D9D2F8] flex items-center justify-center mx-auto text-[#7C6EE6]">
            {activeFilter === 'active' ? (
              <BookOpen className="w-8 h-8" />
            ) : (
              <Archive className="w-8 h-8" />
            )}
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl font-bold text-[#28263A]">
              {searchQuery
                ? `No subjects match "${searchQuery}"`
                : activeFilter === 'active'
                ? 'No active subjects yet'
                : 'No archived subjects'}
            </h3>
            <p className="text-xs sm:text-sm text-[#777589] max-w-sm mx-auto leading-relaxed">
              {searchQuery
                ? 'Try a different search term or add a new syllabus.'
                : activeFilter === 'active'
                ? 'Add your course syllabus to generate personalized notes, questions, and predictions, or start learning any topic directly.'
                : 'Archived subjects will be stored here safely without cluttering your active study dashboard.'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-3 flex-wrap">
            <button
              onClick={() => openSyllabusFlow()}
              className="btn-pastel-primary px-5 py-2.5 rounded-2xl text-xs font-bold text-white flex items-center gap-2 shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Syllabus</span>
            </button>
            <button
              onClick={() => setIsGlobalSearchOpen(true)}
              className="px-4 py-2.5 rounded-2xl text-xs font-semibold bg-[#FFFDF9] hover:bg-[#EAE5FF]/40 border border-[#EEEAF4] text-[#28263A] transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#7C6EE6]" />
              <span>Learn Any Topic</span>
            </button>
          </div>
        </div>
      ) : (
        /* Populated Subjects Grid - Pastel Bloom Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              : 'Recently Added';

            // Safe fallback logic for subject name
            const subjectTitle =
              (subj.name && subj.name.trim()) ||
              (subj as any).title ||
              (subj as any).subjectName ||
              (subj.syllabusFileName ? subj.syllabusFileName.replace(/\.[^/.]+$/, '') : '') ||
              subj.code ||
              'Untitled Subject';

            return (
              <div
                key={subj.id}
                className="p-6 rounded-3xl bg-white border border-[#EEEAF4] hover:border-[#D9D2F8] shadow-[0_4px_20px_rgba(40,38,58,0.04)] hover:shadow-[0_8px_30px_rgba(40,38,58,0.08)] transition-all duration-200 relative flex flex-col justify-between text-left"
              >
                {/* 1. Subject Name & Header Menu */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5 sm:mb-3">
                    <h3 className="text-[20px] sm:text-[22px] font-bold text-[#28263A] leading-[1.3] break-words flex-1">
                      {subjectTitle}
                    </h3>
                    <div className="shrink-0 -mt-1 -mr-1">
                      <SubjectMoreMenu
                        subject={subj}
                        buttonClassName="p-2 rounded-xl text-[#777589] hover:text-[#28263A] hover:bg-[#EAE5FF]/50 border border-transparent hover:border-[#EEEAF4] transition-all focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* 2. Subject Code Badge */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EAE5FF] text-[#7C6EE6] border border-[#D9D2F8]/60 font-mono">
                      {subj.code || 'CST-004 / CSO-053'}
                    </span>
                    {subj.archived && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#FFE0D2] text-[#E5A044] border border-[#FFCBB3]">
                        Archived
                      </span>
                    )}
                    {isFailed && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-500" />
                        <span>Needs Analysis</span>
                      </span>
                    )}
                  </div>

                  {/* 3. Subject Description */}
                  <p className="text-xs sm:text-sm text-[#777589] line-clamp-2 leading-relaxed mb-3">
                    {subj.description || 'Comprehensive curriculum study material and syllabus breakdown.'}
                  </p>

                  {/* 4. Upload Date */}
                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#777589]">
                    <Clock className="w-3.5 h-3.5 text-[#7C6EE6]" />
                    <span>Uploaded {formattedDate}</span>
                  </div>
                </div>

                {/* 5. Divider & Following Sections */}
                <div className="space-y-3 pt-3.5 mt-3.5 border-t border-[#EEEAF4]">
                  {isFailed ? (
                    <div className="space-y-2">
                      <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">
                          Syllabus text is safely saved. Click below to retry AI analysis without re-uploading.
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleRetryAnalysis(e, subj.id)}
                        disabled={isAnalyzing}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-[#EAE5FF] hover:bg-[#ded7ff] text-[#7C6EE6] border border-[#D9D2F8] transition-all"
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
                      {/* 6. Units Count, Topics Count, and Completion Percentage */}
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-[#777589] font-medium">
                          {subj.units.length} Units • {allTopics.length} Topics
                        </span>
                        <span className="text-[#28263A] font-bold">{progress}%</span>
                      </div>

                      {/* 7. Progress Bar */}
                      <div className="w-full h-2 bg-[#F3F0F8] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#7C6EE6] to-[#A99EFA] rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      {/* 8. Exam Date */}
                      {subj.examDate && (
                        <div className="flex items-center gap-1.5 text-xs text-[#E5A044] font-medium pt-1">
                          <Calendar className="w-3.5 h-3.5 text-[#E5A044]" />
                          <span>Exam: {subj.examDate}</span>
                        </div>
                      )}

                      {/* 9. Continue Preparation Button */}
                      <button
                        onClick={() => {
                          setActiveSubject(subj);
                          setActiveTab('subject-detail');
                        }}
                        className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-bold bg-[#7C6EE6] hover:bg-[#6A5AD6] text-white shadow-sm transition-all group cursor-pointer"
                      >
                        <span>Continue Preparation</span>
                        <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
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
