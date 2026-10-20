import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Package,
  CheckCircle2,
  Download,
  Sparkles,
  RefreshCw,
  BookOpen,
  Layers,
  FileText,
  AlertCircle,
  HelpCircle,
  Award,
  Calendar,
  Check,
  Eye,
  FileCheck,
  ChevronRight,
  Calculator,
  Brain,
  Lightbulb,
  FileSpreadsheet,
  Network,
  Mic,
  GraduationCap,
  AlertTriangle,
  X,
  ArrowRight,
} from 'lucide-react';
import {
  generateAndDownloadStudyPackPdf,
  StudyPackData,
} from '../utils/studyPackPdfGenerator';

export type CategoryStatus =
  | 'Not Started'
  | 'Generating'
  | 'Partially Generated'
  | 'Completed'
  | 'Failed'
  | 'Not Applicable';

interface CategoryConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  countKey: string;
  unitLabel: string;
  viewTab: string;
  requiredCount: number;
}

const CATEGORIES_CONFIG: CategoryConfig[] = [
  {
    id: 'overview',
    name: 'Subject Overview & Syllabus',
    description: 'Structured unit breakdown, learning objectives, prerequisites & weightage',
    icon: BookOpen,
    countKey: 'overview',
    unitLabel: 'Units',
    viewTab: 'subject-detail',
    requiredCount: 1,
  },
  {
    id: 'priority',
    name: 'Important Topics Index',
    description: 'Prioritized curriculum based on exam frequency and marks weightage',
    icon: Award,
    countKey: 'priority',
    unitLabel: 'Topics',
    viewTab: 'priority-topics',
    requiredCount: 5,
  },
  {
    id: 'notes',
    name: 'Unit-Wise Theory Notes',
    description: 'Structured concept notes with definitions, formulas, examples & revision summaries',
    icon: FileText,
    countKey: 'notes',
    unitLabel: 'Topic Notes',
    viewTab: 'notes',
    requiredCount: 4,
  },
  {
    id: 'questions',
    name: 'Important Questions (2M, 5M, 10M)',
    description: 'University exam questions with step-by-step marking schemes and model answers',
    icon: HelpCircle,
    countKey: 'questions',
    unitLabel: 'Questions',
    viewTab: 'important-questions',
    requiredCount: 6,
  },
  {
    id: 'numericals',
    name: 'Numerical Problems & Solutions',
    description: 'Worked numerical exercises with given data, governing formulas & step-by-step solutions',
    icon: Calculator,
    countKey: 'numericals',
    unitLabel: 'Numericals',
    viewTab: 'numericals',
    requiredCount: 4,
  },
  {
    id: 'mcqs',
    name: 'MCQs Question Bank',
    description: 'Subject-relevant multiple choice questions with 4 options and answer explanations',
    icon: CheckCircle2,
    countKey: 'mcqs',
    unitLabel: 'MCQs',
    viewTab: 'mcqs',
    requiredCount: 8,
  },
  {
    id: 'flashcards',
    name: 'Active Recall Flashcards',
    description: 'Prompt and takeaway review cards for definitions, distinctions and formulas',
    icon: Brain,
    countKey: 'flashcards',
    unitLabel: 'Cards',
    viewTab: 'flashcards',
    requiredCount: 6,
  },
  {
    id: 'cheatsheet',
    name: 'Cheat Sheet & Quick Revision',
    description: 'Ultra-compressed revision sheets with governing equations, differences & memory anchors',
    icon: FileSpreadsheet,
    countKey: 'cheatsheet',
    unitLabel: 'Sheets',
    viewTab: 'cheatsheets',
    requiredCount: 1,
  },
  {
    id: 'mindmap',
    name: 'Mind Maps & Hierarchies',
    description: 'Hierarchical visual concept trees mapping root concepts, branches and subtopics',
    icon: Network,
    countKey: 'mindmap',
    unitLabel: 'Mind Maps',
    viewTab: 'mindmaps',
    requiredCount: 1,
  },
  {
    id: 'viva',
    name: 'Viva & Oral Exam Guide',
    description: 'Model professor questions, follow-up probes, and common examiner traps',
    icon: Mic,
    countKey: 'viva',
    unitLabel: 'Viva Qs',
    viewTab: 'viva',
    requiredCount: 6,
  },
  {
    id: 'studyplan',
    name: 'Study Plan & AI Roadmap',
    description: 'Personalized 14-day study plan with daily targets and revision milestones',
    icon: Calendar,
    countKey: 'studyplan',
    unitLabel: 'Plans',
    viewTab: 'roadmap',
    requiredCount: 1,
  },
  {
    id: 'mocktest',
    name: 'Full Mock Exam Paper',
    description: 'Complete university examination paper with Section A, B, and C distributions',
    icon: GraduationCap,
    countKey: 'mocktest',
    unitLabel: 'Mock Papers',
    viewTab: 'paper-generator',
    requiredCount: 1,
  },
];

export const CompleteStudyPackView: React.FC = () => {
  const { activeSubject, subjects, user, navigateTo, showToast, triggerConfetti } = useApp();
  const currentSubject = activeSubject || subjects[0];

  const [selectedItems, setSelectedItems] = useState<string[]>(
    CATEGORIES_CONFIG.map((c) => c.id)
  );

  const [studyPackData, setStudyPackData] = useState<StudyPackData | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [categoryStatuses, setCategoryStatuses] = useState<Record<string, CategoryStatus>>({});
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [activeGeneratingCategory, setActiveGeneratingCategory] = useState<string | null>(null);

  // Batch generation states
  const [isBatchGenerating, setIsBatchGenerating] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; currentCategoryName: string }>({
    current: 0,
    total: 0,
    currentCategoryName: '',
  });

  // PDF Export States
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportStatusText, setExportStatusText] = useState<string>('');

  // Missing content confirmation modal before PDF export
  const [showMissingContentModal, setShowMissingContentModal] = useState<boolean>(false);
  const [missingCategoriesList, setMissingCategoriesList] = useState<CategoryConfig[]>([]);

  // Preview tab state
  const [activePreviewTab, setActivePreviewTab] = useState<string>('notes');

  // Fetch verified study pack data for active subject
  const loadStudyPackData = useCallback(async () => {
    if (!currentSubject) return;

    setIsLoadingData(true);

    try {
      const res = await fetch(`/api/subjects/${currentSubject.id}/study-pack`);
      if (!res.ok) {
        throw new Error('Failed to fetch study pack materials');
      }

      const data = await res.json();
      setStudyPackData(data);
      if (data.categoriesSummary) {
        setCategoryCounts(data.categoriesSummary);
      }
      if (data.categoryStatuses) {
        setCategoryStatuses(data.categoryStatuses);
      }
    } catch (err: any) {
      console.warn('[Study Pack Load Notice]:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [currentSubject]);

  useEffect(() => {
    loadStudyPackData();
  }, [loadStudyPackData]);

  const toggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Determine realistic status for any category
  const getCategoryStatus = (cat: CategoryConfig): CategoryStatus => {
    if (activeGeneratingCategory === cat.id) {
      return 'Generating';
    }

    const backendStatus = categoryStatuses[cat.id];
    if (backendStatus) {
      return backendStatus;
    }

    const count = categoryCounts[cat.countKey] || 0;
    if (count >= cat.requiredCount) return 'Completed';
    if (count > 0) return 'Partially Generated';
    return 'Not Started';
  };

  // Generate a single category on demand
  const handleGenerateSingleCategory = async (catId: string, force = true) => {
    if (!currentSubject) return;
    if (activeGeneratingCategory || isBatchGenerating) return;

    setActiveGeneratingCategory(catId);
    setCategoryStatuses((prev) => ({ ...prev, [catId]: 'Generating' }));

    const categoryObj = CATEGORIES_CONFIG.find((c) => c.id === catId);
    showToast(`Generating ${categoryObj?.name || catId}...`, 'info');

    try {
      const res = await fetch(`/api/subjects/${currentSubject.id}/generate-pack-category`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: catId,
          forceRegenerate: force,
          preferredLanguage: user?.preferredLanguage || 'English',
        }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || `Failed to generate ${catId}`);
      }

      const data = await res.json();
      const result = data.result;

      if (result) {
        setCategoryStatuses((prev) => ({ ...prev, [catId]: result.status }));
        if (typeof result.count === 'number') {
          setCategoryCounts((prev) => ({ ...prev, [catId]: result.count }));
        }
      }

      // Refresh complete data
      await loadStudyPackData();
      showToast(`${categoryObj?.name || catId} generated successfully!`, 'success');
      triggerConfetti();
    } catch (err: any) {
      console.error(`[Generate ${catId} Error]:`, err);
      setCategoryStatuses((prev) => ({ ...prev, [catId]: 'Failed' }));
      showToast(err.message || `Failed to generate ${catId}. Tap Retry to attempt again.`, 'error');
    } finally {
      setActiveGeneratingCategory(null);
    }
  };

  // Real AI Sequential Batch Generation across all selected categories
  const handleGenerateCompleteStudyPack = async (targetCategoryIds?: string[], force = false) => {
    if (!currentSubject) {
      showToast('Please select a subject first.', 'error');
      return;
    }

    const categoriesToRun = targetCategoryIds || selectedItems;
    if (categoriesToRun.length === 0) {
      showToast('Please select at least one study module to generate.', 'error');
      return;
    }

    if (isBatchGenerating || activeGeneratingCategory) return;

    setIsBatchGenerating(true);
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < categoriesToRun.length; i++) {
      const catId = categoriesToRun[i];
      const categoryObj = CATEGORIES_CONFIG.find((c) => c.id === catId);
      const catName = categoryObj?.name || catId;

      setBatchProgress({
        current: i + 1,
        total: categoriesToRun.length,
        currentCategoryName: catName,
      });

      setActiveGeneratingCategory(catId);
      setCategoryStatuses((prev) => ({ ...prev, [catId]: 'Generating' }));

      try {
        const res = await fetch(`/api/subjects/${currentSubject.id}/generate-pack-category`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: catId,
            forceRegenerate: force,
            preferredLanguage: user?.preferredLanguage || 'English',
          }),
        });

        if (!res.ok) {
          throw new Error(`Generation failed for ${catName}`);
        }

        const data = await res.json();
        const result = data.result;

        if (result) {
          setCategoryStatuses((prev) => ({ ...prev, [catId]: result.status }));
          if (typeof result.count === 'number') {
            setCategoryCounts((prev) => ({ ...prev, [catId]: result.count }));
          }
          if (result.status === 'Completed' || result.status === 'Not Applicable') {
            successCount++;
          }
        }
      } catch (err: any) {
        console.warn(`[Batch Generation Notice for ${catId}]:`, err);
        setCategoryStatuses((prev) => ({ ...prev, [catId]: 'Failed' }));
        failedCount++;
      } finally {
        // Refresh local data periodically
        await loadStudyPackData().catch(() => {});
      }
    }

    setIsBatchGenerating(false);
    setActiveGeneratingCategory(null);
    setBatchProgress({ current: 0, total: 0, currentCategoryName: '' });

    if (failedCount === 0) {
      showToast(`All ${successCount} study pack categories generated and saved successfully!`, 'success');
      triggerConfetti();
    } else {
      showToast(
        `Generated ${successCount} categories. ${failedCount} categories encountered transient issues and can be retried individually.`,
        'info'
      );
    }
  };

  // Perform full PDF generation and automated download
  const executePdfExport = async () => {
    if (!currentSubject) {
      showToast('Please select an active subject first.', 'error');
      return;
    }

    if (selectedItems.length === 0) {
      showToast('Please select at least one study module to export.', 'error');
      return;
    }

    if (isExportingPdf) return;

    setIsExportingPdf(true);
    setExportProgress(5);
    setExportStatusText('Preparing study pack content...');

    try {
      let activePack = studyPackData;
      try {
        const res = await fetch(`/api/subjects/${currentSubject.id}/study-pack`);
        if (res.ok) {
          const freshData = await res.json();
          activePack = freshData;
          setStudyPackData(freshData);
          if (freshData.categoriesSummary) {
            setCategoryCounts(freshData.categoriesSummary);
          }
        }
      } catch (e) {
        console.warn('Network sync notice during export:', e);
      }

      const exportPayload: StudyPackData = {
        subject: activePack?.subject || currentSubject,
        notes: activePack?.notes || [],
        questions: activePack?.questions || [],
        numericals: activePack?.numericals || [],
        mcqs: activePack?.mcqs || [],
        flashcards: activePack?.flashcards || [],
        mindmaps: activePack?.mindmaps || [],
        cheatsheets: activePack?.cheatsheets || [],
        mockTests: activePack?.mockTests || [],
        vivaQuestions: activePack?.vivaQuestions || [],
        roadmaps: activePack?.roadmaps || [],
        studyPlan: activePack?.studyPlan,
      };

      const result = await generateAndDownloadStudyPackPdf(exportPayload, {
        selectedCategories: selectedItems,
        userName: user?.name || 'Student',
        collegeName: user?.college || currentSubject.course || '',
        onProgress: (status, percent) => {
          setExportStatusText(status);
          setExportProgress(percent);
        },
      });

      if (!result.success) {
        setExportStatusText('Invoking backend PDF service...');
        setExportProgress(80);

        const backendUrl = `/api/subjects/${currentSubject.id}/export-pdf?categories=${encodeURIComponent(
          selectedItems.join(',')
        )}`;
        const response = await fetch(backendUrl);

        if (!response.ok) {
          throw new Error('Both client and server PDF export operations failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cleanName = (currentSubject.name || 'Subject').replace(/[^a-zA-Z0-9]/g, '_');
        a.download = `${cleanName}_Complete_Study_Pack.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      setExportProgress(100);
      setExportStatusText('Download initiated!');
      showToast(
        `Complete Study Pack PDF downloaded successfully! (${result.filename || 'Complete_Study_Pack.pdf'})`,
        'success'
      );
      triggerConfetti();
    } catch (err: any) {
      console.error('[Export Complete PDF Error]:', err);
      showToast('Unable to complete PDF download. Please check your network and retry.', 'error');
    } finally {
      setTimeout(() => {
        setIsExportingPdf(false);
        setExportProgress(0);
        setExportStatusText('');
      }, 1000);
    }
  };

  // Check for empty categories before export and prompt user
  const handleExportPdfClick = () => {
    const missing = CATEGORIES_CONFIG.filter((cat) => {
      if (!selectedItems.includes(cat.id)) return false;
      const count = categoryCounts[cat.countKey] || 0;
      const status = categoryStatuses[cat.id];
      if (status === 'Not Applicable') return false;
      return count === 0;
    });

    if (missing.length > 0) {
      setMissingCategoriesList(missing);
      setShowMissingContentModal(true);
    } else {
      executePdfExport();
    }
  };

  const cleanSubjectName = currentSubject?.name || 'Academic Subject';
  const dynamicFilename = `${cleanSubjectName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_')}_Complete_Study_Pack.pdf`;

  // Summary numbers
  const totalCompletedCount = useMemo(() => {
    return CATEGORIES_CONFIG.filter((cat) => {
      const status = getCategoryStatus(cat);
      return status === 'Completed' || status === 'Not Applicable';
    }).length;
  }, [categoryCounts, categoryStatuses, activeGeneratingCategory]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in text-white">
      {/* Header Banner */}
      <div className="glass-panel-heavy rounded-3xl p-6 sm:p-8 border border-red-950/50 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-red-950/80 border border-red-800/40 text-red-400 text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
              <Package className="w-3.5 h-3.5" />
              Complete Study Pack Engine
            </span>
            {currentSubject?.code && (
              <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-2.5 py-0.5 rounded-lg border border-zinc-800">
                {currentSubject.code}
              </span>
            )}
            {currentSubject?.course && (
              <span className="text-xs text-zinc-400 bg-zinc-900 px-2.5 py-0.5 rounded-lg border border-zinc-800">
                {currentSubject.course}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {cleanSubjectName}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Generate, persist and synthesize all 11 examination study materials: verified unit-wise notes,
            high-yield questions, numericals, MCQs question banks, active-recall flashcards, and cheat sheets into
            an offline printable PDF booklet.
          </p>
        </div>

        {/* Master CTA Actions */}
        <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-3 relative z-10 flex-shrink-0">
          <button
            onClick={() => handleGenerateCompleteStudyPack()}
            disabled={isBatchGenerating || !!activeGeneratingCategory}
            className="btn-red-glow flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-bold text-white uppercase tracking-wider transition-all shadow-lg shadow-red-950/50 disabled:opacity-50"
          >
            {isBatchGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>
                  Generating ({batchProgress.current}/{batchProgress.total})...
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white" />
                <span>Generate Complete Pack</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportPdfClick}
            disabled={isExportingPdf || isBatchGenerating}
            className="px-6 py-3.5 rounded-2xl text-xs font-bold bg-[#141420] hover:bg-zinc-800 border border-zinc-700/80 text-white flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
          >
            {isExportingPdf ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-red-400" />
                <span>Exporting ({exportProgress}%)...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-red-400" />
                <span>Export Complete PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Batch Generation Progress Card */}
      {isBatchGenerating && (
        <div className="p-6 rounded-2xl bg-[#0c0c16] border border-red-600/50 space-y-3 animate-fade-in shadow-2xl">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-red-400" />
              <span>
                Generating Module {batchProgress.current} of {batchProgress.total}:{' '}
                <strong className="text-red-400">{batchProgress.currentCategoryName}</strong>
              </span>
            </span>
            <span className="font-mono text-red-400 font-bold">
              {Math.round((batchProgress.current / (batchProgress.total || 1)) * 100)}%
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-zinc-900 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-red-400 transition-all duration-300"
              style={{
                width: `${Math.round((batchProgress.current / (batchProgress.total || 1)) * 100)}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span>Validating output and saving immediately to database...</span>
            <span>Batch pipeline active</span>
          </div>
        </div>
      )}

      {/* Live PDF Export Progress Card */}
      {isExportingPdf && (
        <div className="p-6 rounded-2xl bg-[#0c0c16] border border-red-600/40 space-y-3 animate-fade-in shadow-xl">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-400" />
              {exportStatusText || 'Compiling Study Pack PDF...'}
            </span>
            <span className="font-mono text-red-400 font-bold">{exportProgress}%</span>
          </div>

          <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-red-400 transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span>Generating dynamic printable file: <code className="text-zinc-200">{dynamicFilename}</code></span>
            <span>Formatting mathematical equations & tables</span>
          </div>
        </div>
      )}

      {/* Missing Content Confirmation Modal */}
      {showMissingContentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0e0e18] border border-red-950/80 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowMissingContentModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Missing Content Detected</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  The following selected categories currently have 0 generated items in your database:
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {missingCategoriesList.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs"
                >
                  <span className="font-semibold text-zinc-200">{cat.name}</span>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                    0 {cat.unitLabel} Saved
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-xs text-zinc-300">
              Generating missing modules first ensures your PDF contains complete theory notes, Q&As, MCQs, and worked solutions.
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-2.5 pt-2">
              <button
                onClick={() => {
                  setShowMissingContentModal(false);
                  const missingIds = missingCategoriesList.map((c) => c.id);
                  handleGenerateCompleteStudyPack(missingIds);
                }}
                className="btn-red-glow flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Missing First</span>
              </button>
              <button
                onClick={() => {
                  setShowMissingContentModal(false);
                  executePdfExport();
                }}
                className="py-3 px-4 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Export Available Material</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Inventory Section */}
      <div className="glass-panel-heavy rounded-3xl p-6 sm:p-8 border border-red-950/40 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Study Pack Category Inventory (11 Core Categories + Mock Exam)
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Real-time database status of every study module. Content is permanently stored and linked to your subject syllabus.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-xs font-mono text-zinc-400">
              <strong className="text-red-400">{totalCompletedCount}</strong> of {CATEGORIES_CONFIG.length} Ready
            </span>
            <span className="text-zinc-700">|</span>
            <button
              onClick={() => setSelectedItems(CATEGORIES_CONFIG.map((i) => i.id))}
              className="text-red-400 hover:text-white font-medium transition-colors"
            >
              Select All
            </button>
            <span className="text-zinc-700">|</span>
            <button
              onClick={() => setSelectedItems([])}
              className="text-zinc-400 hover:text-white font-medium transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES_CONFIG.map((cat, idx) => {
            const isSelected = selectedItems.includes(cat.id);
            const count = categoryCounts[cat.countKey] || 0;
            const status = getCategoryStatus(cat);
            const isGeneratingThis = activeGeneratingCategory === cat.id;
            const Icon = cat.icon;

            return (
              <div
                key={cat.id}
                className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-4 ${
                  isSelected
                    ? 'bg-[#0d0d18] border-red-900/40 shadow-[0_0_20px_rgba(220,38,38,0.08)]'
                    : 'bg-[#090912] border-zinc-900 text-zinc-400 hover:border-zinc-800'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleItem(cat.id)}
                      title={isSelected ? 'Deselect from PDF' : 'Select for PDF'}
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                        isSelected
                          ? 'bg-red-600 border-red-500 text-white shadow-sm'
                          : 'border-zinc-700 bg-zinc-900'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                        <h3 className="text-xs font-bold text-white leading-tight">
                          {cat.name}
                        </h3>
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status & Real Count Row */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-xs">
                  <div>
                    {status === 'Generating' ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-800/40 text-amber-400 text-[10px] font-mono font-semibold flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Generating...
                      </span>
                    ) : status === 'Completed' ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-[10px] font-mono font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed
                      </span>
                    ) : status === 'Partially Generated' ? (
                      <span className="px-2 py-0.5 rounded-md bg-yellow-950/60 border border-yellow-800/40 text-yellow-400 text-[10px] font-mono font-semibold">
                        Partially Generated
                      </span>
                    ) : status === 'Not Applicable' ? (
                      <span className="px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-800/40 text-purple-400 text-[10px] font-mono font-semibold">
                        Not Applicable
                      </span>
                    ) : status === 'Failed' ? (
                      <span className="px-2 py-0.5 rounded-md bg-red-950/80 border border-red-800/60 text-red-400 text-[10px] font-mono font-semibold">
                        Failed
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-500 text-[10px] font-mono">
                        Not Started
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] font-mono text-zinc-300">
                    {status === 'Not Applicable' ? (
                      <span className="text-zinc-500 text-[10px]">Qualitative Only</span>
                    ) : (
                      <span>
                        <strong className={count > 0 ? 'text-white font-bold' : 'text-zinc-500'}>
                          {count}
                        </strong>{' '}
                        <span className="text-zinc-400 text-[10px]">{cat.unitLabel}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-900/60 text-xs">
                  <button
                    onClick={() => navigateTo(cat.viewTab)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[11px] font-medium transition-colors"
                  >
                    <Eye className="w-3 h-3 text-red-400" />
                    <span>View / Open</span>
                  </button>

                  <button
                    onClick={() => handleGenerateSingleCategory(cat.id, count > 0)}
                    disabled={isGeneratingThis || isBatchGenerating}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 border border-red-900/40 text-red-300 text-[11px] font-semibold transition-colors disabled:opacity-50"
                  >
                    {isGeneratingThis ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : count > 0 ? (
                      <>
                        <RefreshCw className="w-3 h-3 text-red-400" />
                        <span>Regenerate</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-red-400" />
                        <span>Generate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Bar Bottom */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-zinc-900">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs font-mono text-zinc-300">
              <span className="text-red-400 font-bold">{selectedItems.length}</span> of {CATEGORIES_CONFIG.length} modules selected for export
            </div>
            <span className="text-xs text-zinc-500 hidden sm:inline">
              Download File: <strong className="text-zinc-300">{dynamicFilename}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleGenerateCompleteStudyPack(selectedItems, false)}
              disabled={isBatchGenerating || !!activeGeneratingCategory}
              className="px-5 py-3 rounded-xl text-xs font-semibold bg-[#12121c] hover:bg-zinc-800 border border-zinc-800 text-zinc-200 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isBatchGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-400" />
                  <span>Generating Batch...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-red-400" />
                  <span>Generate Missing Content</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportPdfClick}
              disabled={isExportingPdf || isBatchGenerating}
              className="btn-red-glow flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg"
            >
              {isExportingPdf ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Exporting ({exportProgress}%)...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Complete PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* In-Page Quick Content Reader / Inspector Tabs */}
      {studyPackData && (
        <div className="glass-panel-heavy rounded-3xl p-6 sm:p-8 border border-red-950/40 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-red-500" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Saved Content Inspector
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Inspect your generated questions, notes, and flashcards directly inside the study pack hub.
              </p>
            </div>

            {/* Sub-Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-zinc-950 border border-zinc-900 text-xs">
              {[
                { id: 'notes', label: 'Notes', count: studyPackData.notes?.length || 0 },
                { id: 'questions', label: 'Questions', count: studyPackData.questions?.length || 0 },
                { id: 'numericals', label: 'Numericals', count: studyPackData.numericals?.length || 0 },
                { id: 'mcqs', label: 'MCQs', count: studyPackData.mcqs?.length || 0 },
                { id: 'flashcards', label: 'Flashcards', count: studyPackData.flashcards?.length || 0 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActivePreviewTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl transition-all font-medium text-xs flex items-center gap-1.5 ${
                    activePreviewTab === tab.id
                      ? 'bg-red-600 text-white font-bold shadow-md'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-zinc-300 font-mono">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Tab Reader View */}
          <div className="space-y-4">
            {activePreviewTab === 'notes' && (
              <div className="space-y-3">
                {(!studyPackData.notes || studyPackData.notes.length === 0) ? (
                  <div className="text-center py-10 space-y-3">
                    <p className="text-xs text-zinc-500 font-mono">No topic notes generated yet.</p>
                    <button
                      onClick={() => handleGenerateSingleCategory('notes', false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-950/60 border border-red-800/60 text-red-300 hover:bg-red-900/60 transition-colors"
                    >
                      Generate Unit-Wise Notes Now
                    </button>
                  </div>
                ) : (
                  studyPackData.notes.slice(0, 4).map((note, idx) => (
                    <div
                      key={note.id || idx}
                      className="p-4 rounded-2xl bg-[#090912] border border-zinc-900 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{note.title}</span>
                        <button
                          onClick={() => navigateTo('notes')}
                          className="text-red-400 hover:text-red-300 text-[11px] font-medium flex items-center gap-1"
                        >
                          <span>Open Full Note</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-zinc-300 line-clamp-2 leading-relaxed">{note.definition || note.explanation}</p>
                      {note.formula && (
                        <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-850 font-mono text-[11px] text-red-300">
                          {note.formula}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activePreviewTab === 'questions' && (
              <div className="space-y-3">
                {(!studyPackData.questions || studyPackData.questions.length === 0) ? (
                  <div className="text-center py-10 space-y-3">
                    <p className="text-xs text-zinc-500 font-mono">No exam questions generated yet.</p>
                    <button
                      onClick={() => handleGenerateSingleCategory('questions', false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-950/60 border border-red-800/60 text-red-300 hover:bg-red-900/60 transition-colors"
                    >
                      Generate 2M, 5M & 10M Question Bank
                    </button>
                  </div>
                ) : (
                  studyPackData.questions.slice(0, 4).map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="p-4 rounded-2xl bg-[#090912] border border-zinc-900 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{q.question}</span>
                        <span className="px-2 py-0.5 rounded-full bg-zinc-900 text-red-400 font-mono text-[10px] font-semibold border border-zinc-800">
                          {q.marks || 5} Marks
                        </span>
                      </div>
                      <p className="text-zinc-400 line-clamp-2">{q.answer}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {activePreviewTab === 'numericals' && (
              <div className="space-y-3">
                {(!studyPackData.numericals || studyPackData.numericals.length === 0) ? (
                  <div className="text-center py-10 space-y-3">
                    <p className="text-xs text-zinc-500 font-mono">
                      No numerical problems generated yet (or subject is purely theoretical).
                    </p>
                    <button
                      onClick={() => handleGenerateSingleCategory('numericals', false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-950/60 border border-red-800/60 text-red-300 hover:bg-red-900/60 transition-colors"
                    >
                      Generate Worked Numericals
                    </button>
                  </div>
                ) : (
                  studyPackData.numericals.slice(0, 3).map((num, idx) => (
                    <div
                      key={num.id || idx}
                      className="p-4 rounded-2xl bg-[#090912] border border-zinc-900 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{num.question}</span>
                        <span className="px-2 py-0.5 rounded-full bg-zinc-900 text-emerald-400 font-mono text-[10px] font-semibold border border-zinc-800">
                          Step-by-Step Solution
                        </span>
                      </div>
                      {num.formula && (
                        <div className="p-2 rounded-xl bg-zinc-950 font-mono text-[11px] text-zinc-300">
                          Formula: {num.formula}
                        </div>
                      )}
                      <p className="text-zinc-400 line-clamp-2">{num.answer}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {activePreviewTab === 'mcqs' && (
              <div className="space-y-3">
                {(!studyPackData.mcqs || studyPackData.mcqs.length === 0) ? (
                  <div className="text-center py-10 space-y-3">
                    <p className="text-xs text-zinc-500 font-mono">No MCQs generated yet.</p>
                    <button
                      onClick={() => handleGenerateSingleCategory('mcqs', false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-950/60 border border-red-800/60 text-red-300 hover:bg-red-900/60 transition-colors"
                    >
                      Generate MCQs Question Bank
                    </button>
                  </div>
                ) : (
                  studyPackData.mcqs.slice(0, 4).map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="p-4 rounded-2xl bg-[#090912] border border-zinc-900 space-y-2 text-xs"
                    >
                      <span className="font-bold text-white text-xs">{m.question}</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                        <div className={`p-2 rounded-lg ${m.correctAnswer === 'A' ? 'bg-emerald-950/40 border border-emerald-800/50 text-emerald-300' : 'bg-zinc-950 text-zinc-400'}`}>
                          A: {m.optionA}
                        </div>
                        <div className={`p-2 rounded-lg ${m.correctAnswer === 'B' ? 'bg-emerald-950/40 border border-emerald-800/50 text-emerald-300' : 'bg-zinc-950 text-zinc-400'}`}>
                          B: {m.optionB}
                        </div>
                        <div className={`p-2 rounded-lg ${m.correctAnswer === 'C' ? 'bg-emerald-950/40 border border-emerald-800/50 text-emerald-300' : 'bg-zinc-950 text-zinc-400'}`}>
                          C: {m.optionC}
                        </div>
                        <div className={`p-2 rounded-lg ${m.correctAnswer === 'D' ? 'bg-emerald-950/40 border border-emerald-800/50 text-emerald-300' : 'bg-zinc-950 text-zinc-400'}`}>
                          D: {m.optionD}
                        </div>
                      </div>
                      {m.explanation && (
                        <p className="text-zinc-500 text-[10px] pt-1 italic">
                          Why: {m.explanation}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activePreviewTab === 'flashcards' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(!studyPackData.flashcards || studyPackData.flashcards.length === 0) ? (
                  <div className="col-span-2 text-center py-10 space-y-3">
                    <p className="text-xs text-zinc-500 font-mono">No active recall flashcards generated yet.</p>
                    <button
                      onClick={() => handleGenerateSingleCategory('flashcards', false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-950/60 border border-red-800/60 text-red-300 hover:bg-red-900/60 transition-colors"
                    >
                      Generate Flashcards Now
                    </button>
                  </div>
                ) : (
                  studyPackData.flashcards.slice(0, 4).map((fc, idx) => (
                    <div
                      key={fc.id || idx}
                      className="p-4 rounded-2xl bg-[#090912] border border-zinc-900 space-y-2 text-xs flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono text-red-400 uppercase font-semibold">Front (Prompt)</span>
                        <p className="font-bold text-white text-xs">{fc.front}</p>
                      </div>
                      <div className="pt-2 border-t border-zinc-900/60 space-y-1">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase font-semibold">Back (Takeaway)</span>
                        <p className="text-zinc-300 text-[11px] leading-relaxed">{fc.back}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
