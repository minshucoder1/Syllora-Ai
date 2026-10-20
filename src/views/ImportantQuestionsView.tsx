import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  HelpCircle,
  Flame,
  Sparkles,
  RefreshCw,
  Printer,
  Download,
  Copy,
  Share2,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Filter,
  Check,
  ArrowRight,
  Binary,
  Layers,
  BookOpen,
  Code,
  FileText,
  AlertTriangle,
  Clock,
  Send,
  Timer,
  CheckCircle2,
  X,
  Star,
  Award,
} from 'lucide-react';
import { Question } from '../types';

export const ImportantQuestionsView: React.FC = () => {
  const {
    activeSubject,
    subjects,
    selectedTopicId,
    setSelectedTopicId,
    showToast,
    triggerConfetti,
    setActiveTab,
  } = useApp();

  const currentSubject = activeSubject || subjects[0];
  const allUnits = currentSubject?.units || [];
  const allTopics = allUnits.flatMap((u) =>
    u.topics.map((t) => ({ ...t, unitName: u.name, unitId: u.id }))
  );
  const currentTopic = allTopics.find((t) => t.id === selectedTopicId) || allTopics[0];

  // Category Tabs: all, 2_marks, 5_marks, 10_marks, numerical
  const [activeCategory, setActiveCategory] = useState<'all' | '2_marks' | '5_marks' | '10_marks' | 'numerical'>('all');

  // Question State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [batchCount, setBatchCount] = useState<number>(1);
  const [numericalApplicable, setNumericalApplicable] = useState<boolean>(true);
  const [numericalNotice, setNumericalNotice] = useState<string>('');

  // UI state
  const [expandedAnswers, setExpandedAnswers] = useState<Record<string, boolean>>({});
  const [practiceModes, setPracticeModes] = useState<Record<string, boolean>>({});
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, string>>({});
  const [practiceEvaluations, setPracticeEvaluations] = useState<Record<string, any>>({});
  const [evaluatingQuestionId, setEvaluatingQuestionId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filters
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [importanceFilter, setImportanceFilter] = useState<'All' | 'Repeated' | 'High Probability' | 'Standard'>('All');
  const [savedOnly, setSavedOnly] = useState<boolean>(false);
  const [batchFilter, setBatchFilter] = useState<number | 'all'>('all');

  // Interactive 10-Question Test Mode Modal
  const [isTestModeOpen, setIsTestModeOpen] = useState(false);
  const [testTimeRemaining, setTestTimeRemaining] = useState<number>(20 * 60); // 20 minutes default
  const [testUserAnswers, setTestUserAnswers] = useState<Record<number, string>>({});
  const [currentTestQuestionIdx, setCurrentTestQuestionIdx] = useState<number>(0);
  const [testSubmitted, setTestSubmitted] = useState<boolean>(false);

  // Fetch or generate initial batch of 10 questions for the selected topic & category
  const loadInitialQuestions = async (topic = currentTopic, category = activeCategory) => {
    if (!currentSubject || !topic) return;

    setLoading(true);
    setGenerationError(null);
    setExpandedAnswers({});
    setPracticeModes({});
    setPracticeAnswers({});
    setPracticeEvaluations({});
    setBatchCount(1);

    try {
      if (category === 'numerical') {
        const res = await fetch('/api/ai/generate-topic-numericals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subjectId: currentSubject.id,
            unitId: topic.unitId,
            topicId: topic.id,
            subjectName: currentSubject.name,
            unitName: topic.unitName,
            topicName: topic.name,
            batchNumber: 1,
            existingQuestions: [],
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Unable to generate questions right now.');
        }

        const data = await res.json();
        if (!data.isApplicable) {
          setNumericalApplicable(false);
          setNumericalNotice(data.message || 'This topic does not require numerical questions.');
          setQuestions([]);
        } else {
          setNumericalApplicable(true);
          setNumericalNotice('');
          setQuestions(data.numericals || []);
          triggerConfetti();
        }
      } else {
        const res = await fetch('/api/ai/generate-topic-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subjectId: currentSubject.id,
            unitId: topic.unitId,
            topicId: topic.id,
            subjectName: currentSubject.name,
            unitName: topic.unitName,
            topicName: topic.name,
            category,
            batchNumber: 1,
            existingQuestions: [],
            difficultyFilter: difficultyFilter !== 'All' ? difficultyFilter : 'Mixed',
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Unable to generate questions right now.');
        }

        const data = await res.json();
        setQuestions(data.questions || []);
        setNumericalApplicable(true);
        triggerConfetti();
      }
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || 'Unable to generate questions right now.');
    } finally {
      setLoading(false);
    }
  };

  // Generate Next 10 Questions
  const handleGenerateNext10 = async () => {
    if (!currentSubject || !currentTopic || loading) return;

    const nextBatchNumber = batchCount + 1;
    setLoading(true);
    setGenerationError(null);

    const existingQuestionTexts = questions.map((q) => q.question);

    try {
      if (activeCategory === 'numerical') {
        const res = await fetch('/api/ai/generate-topic-numericals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subjectId: currentSubject.id,
            unitId: currentTopic.unitId,
            topicId: currentTopic.id,
            subjectName: currentSubject.name,
            unitName: currentTopic.unitName,
            topicName: currentTopic.name,
            batchNumber: nextBatchNumber,
            existingQuestions: existingQuestionTexts,
          }),
        });

        if (!res.ok) throw new Error('Unable to generate next batch.');
        const data = await res.json();

        if (data.numericals?.length > 0) {
          setQuestions((prev) => [...prev, ...data.numericals]);
          setBatchCount(nextBatchNumber);
          showToast(`Generated 10 new numerical problems (Batch ${nextBatchNumber})!`, 'success');
          triggerConfetti();
        }
      } else {
        const res = await fetch('/api/ai/generate-topic-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subjectId: currentSubject.id,
            unitId: currentTopic.unitId,
            topicId: currentTopic.id,
            subjectName: currentSubject.name,
            unitName: currentTopic.unitName,
            topicName: currentTopic.name,
            category: activeCategory,
            batchNumber: nextBatchNumber,
            existingQuestions: existingQuestionTexts,
            difficultyFilter: difficultyFilter !== 'All' ? difficultyFilter : 'Mixed',
          }),
        });

        if (!res.ok) throw new Error('Unable to generate next batch.');
        const data = await res.json();

        if (data.questions?.length > 0) {
          setQuestions((prev) => [...prev, ...data.questions]);
          setBatchCount(nextBatchNumber);
          showToast(`Generated 10 new questions (Batch ${nextBatchNumber})!`, 'success');
          triggerConfetti();
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Unable to generate next 10 questions.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTopic) {
      loadInitialQuestions(currentTopic, activeCategory);
    }
  }, [currentTopic?.id, activeCategory]);

  const toggleAnswer = (id: string) => {
    setExpandedAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const togglePractice = (id: string) => {
    setPracticeModes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleSave = async (questionId: string) => {
    try {
      const res = await fetch(`/api/questions/${questionId}/toggle-save`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setQuestions((prev) =>
          prev.map((q) => (q.id === questionId ? { ...q, saved: data.saved } : q))
        );
        showToast(data.saved ? 'Added to your Revision List! 📌' : 'Removed from Revision List.', 'info');
      }
    } catch {
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, saved: !q.saved } : q))
      );
    }
  };

  // Add all currently displayed 10 questions to revision pack
  const handleAddAllToRevisionPack = async () => {
    const ids = filteredQuestions.map((q) => q.id);
    if (ids.length === 0) return;

    try {
      await fetch('/api/questions/batch-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIds: ids, save: true }),
      });
      setQuestions((prev) =>
        prev.map((q) => (ids.includes(q.id) ? { ...q, saved: true } : q))
      );
      showToast(`Added all ${ids.length} questions to your Revision Pack! 🎒`, 'success');
      triggerConfetti();
    } catch {
      showToast('Failed to add all questions to revision pack.', 'error');
    }
  };

  // Inline AI Check Answer for a specific question
  const handleCheckPracticeAnswer = async (q: Question) => {
    const answer = practiceAnswers[q.id];
    if (!answer || !answer.trim()) {
      showToast('Please type your answer in the box first.', 'error');
      return;
    }

    setEvaluatingQuestionId(q.id);
    try {
      const res = await fetch('/api/ai/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: currentSubject?.id,
          subjectName: currentSubject?.name,
          topicName: currentTopic?.name,
          question: q.question,
          totalMarks: q.marks,
          userAnswer: answer,
        }),
      });

      if (!res.ok) {
        throw new Error('Evaluation failed.');
      }

      const data = await res.json();
      setPracticeEvaluations((prev) => ({ ...prev, [q.id]: data.evaluation }));
      showToast(`Answer evaluated: ${data.evaluation?.estimatedScore}/${q.marks} Marks!`, 'success');
      triggerConfetti();
    } catch {
      showToast('Unable to evaluate answer right now. Please retry.', 'error');
    } finally {
      setEvaluatingQuestionId(null);
    }
  };

  const handleCopyQuestion = (q: Question) => {
    const text = `Q: ${q.question} (${q.marks} Marks)\nTopic: ${currentTopic?.name}\nImportance: ${q.importanceBadge || q.priority}\n\nModel Answer:\n${q.answer}\n\nMarking Scheme:\n${q.markingScheme || 'Award full marks for definition and accurate examples.'}`;
    navigator.clipboard.writeText(text);
    setCopiedId(q.id);
    showToast('Question, answer & marking scheme copied!', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Download single question + answer
  const handleDownloadSingle = (q: Question, idx: number) => {
    const content = `=====================================================
STUDYAI — TOPIC EXAM QUESTION & MODEL ANSWER
Subject: ${currentSubject?.name || ''}
Topic: ${currentTopic?.name || ''}
Question Number: Q${q.questionNumber || idx + 1}
Marks: ${q.marks} Marks | Importance: ${q.importanceBadge || q.priority}
Frequency: ${q.frequencyIndicator || 'Standard Exam Question'}
=====================================================

QUESTION:
${q.question}

${q.isNumerical ? `Given: ${q.given || 'N/A'}\nRequired: ${q.required || 'N/A'}\nFormula: ${q.formula || 'N/A'}\n` : ''}

MODEL EXAM ANSWER:
${q.answer}

${q.stepByStep && q.stepByStep.length > 0 ? `STEP-BY-STEP BREAKDOWN:\n${q.stepByStep.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n` : ''}
MARKING SCHEME:
${q.markingScheme || 'Award full marks for core definition, step clarity, and accurate diagram/example.'}

COMMON MISTAKES TO AVOID:
${q.commonMistakes || 'Avoid incomplete definitions and omitting essential formulas/units.'}
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Q${q.questionNumber || idx + 1}_${(currentTopic?.name || 'Topic').replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded question card!', 'success');
  };

  // Export batch of questions to Downloadable files
  const handleDownloadBatch = (format: 'txt' | 'doc') => {
    const header = `=====================================================
STUDYAI — TOPIC QUESTION BANK (10 QUESTIONS PER BATCH)
Subject: ${currentSubject?.name || ''}
Unit: ${currentTopic?.unitName || ''}
Topic: ${currentTopic?.name || ''}
Category: ${activeCategory.toUpperCase()}
Total Questions: ${filteredQuestions.length}
Generated Date: ${new Date().toLocaleDateString()}
=====================================================\n\n`;

    const content = filteredQuestions
      .map(
        (q, idx) => `-----------------------------------------------------
Question ${q.questionNumber || idx + 1} [${q.marks} Marks | ${q.importanceBadge || q.priority} | ${q.difficulty}]
Frequency: ${q.frequencyIndicator || 'Regular Exam Question'}

${q.question}

MODEL ANSWER / SOLUTION:
${q.answer}

${q.stepByStep && q.stepByStep.length > 0 ? `Step-By-Step Breakdown:\n${q.stepByStep.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}\n` : ''}
Marking Scheme: ${q.markingScheme || 'Award marks for definition, structure, and diagram.'}
Common Mistakes: ${q.commonMistakes || 'Avoid missing key technical definitions.'}
\n`
      )
      .join('\n');

    const fullText = header + content;
    const mime = format === 'doc' ? 'application/msword' : 'text/plain;charset=utf-8';
    const blob = new Blob([fullText], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSubject?.name || 'Subject'}_${currentTopic?.name || 'Topic'}_${activeCategory}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded 10 questions as .${format}!`, 'success');
  };

  // Launch "Test Me on These 10" Mode
  const startTestMode = () => {
    if (questions.length === 0) {
      showToast('No questions available to test.', 'error');
      return;
    }
    // Allocate timer based on category: 2-marks -> 20 mins, 5-marks -> 40 mins, 10-marks -> 60 mins
    const defaultMins =
      activeCategory === '2_marks' ? 20 : activeCategory === '5_marks' ? 40 : 50;
    setTestTimeRemaining(defaultMins * 60);
    setTestUserAnswers({});
    setCurrentTestQuestionIdx(0);
    setTestSubmitted(false);
    setIsTestModeOpen(true);
  };

  // Test mode timer countdown
  useEffect(() => {
    if (!isTestModeOpen || testSubmitted) return;
    const interval = setInterval(() => {
      setTestTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTestSubmitted(true);
          showToast('Time is up! Exam test submitted automatically.', 'info');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTestModeOpen, testSubmitted]);

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    if (savedOnly && !q.saved) return false;
    if (difficultyFilter !== 'All' && q.difficulty !== difficultyFilter) return false;
    if (importanceFilter !== 'All') {
      const badge = q.importanceBadge || q.priority;
      if (!badge.toLowerCase().includes(importanceFilter.toLowerCase())) return false;
    }
    if (batchFilter !== 'all' && q.batchNumber !== batchFilter) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header with Topic Navigation */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7C6EE6]">
            <HelpCircle className="w-4 h-4 text-[#7C6EE6]" />
            <span>EXAM QUESTION ENGINE • 10 PER BATCH</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#28263A]">
            Questions: <span className="text-[#7C6EE6]">{currentTopic?.name || 'Selected Topic'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#777589]">
            {currentTopic?.unitName || 'Module'} • {currentSubject?.name || 'Subject'} • High-yield practice and model answers.
          </p>
        </div>

        {/* Action icons & Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleDownloadBatch('txt')}
            className="p-2.5 rounded-2xl bg-[#FFFDF9] hover:bg-[#EAE5FF]/50 border border-[#EEEAF4] text-[#777589] hover:text-[#28263A] transition-colors"
            title="Download Batch as TXT"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDownloadBatch('doc')}
            className="p-2.5 rounded-2xl bg-[#FFFDF9] hover:bg-[#EAE5FF]/50 border border-[#EEEAF4] text-[#777589] hover:text-[#28263A] transition-colors"
            title="Download Batch as DOC / Word"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            onClick={() => window.print()}
            className="p-2.5 rounded-2xl bg-[#FFFDF9] hover:bg-[#EAE5FF]/50 border border-[#EEEAF4] text-[#777589] hover:text-[#28263A] transition-colors"
            title="Print / Save PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={() => loadInitialQuestions()}
            disabled={loading}
            className="btn-pastel-primary px-4 py-2.5 rounded-2xl text-white flex items-center gap-1.5 shadow-sm"
            title="Regenerate Batch 1"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-xs font-bold hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* SYLLABUS TOPIC TREE EXPLORER */}
      <div className="p-5 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#28263A] font-bold uppercase flex items-center gap-2 font-mono">
            <BookOpen className="w-4 h-4 text-[#7C6EE6]" />
            <span>Select Syllabus Topic (Independent Question Banks)</span>
          </span>
          <span className="text-[11px] text-[#777589]">
            {allUnits.length} Units • {allTopics.length} Topics
          </span>
        </div>

        {/* Tree by Unit */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {allUnits.map((unit) => (
            <div key={unit.id} className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#EEEAF4] space-y-2">
              <div className="text-[11px] font-bold text-[#7C6EE6] uppercase truncate border-b border-[#EEEAF4] pb-1.5 flex items-center justify-between">
                <span>{unit.name}</span>
                <span className="text-[#777589] text-[10px]">{unit.topics.length} topics</span>
              </div>
              <div className="space-y-1">
                {unit.topics.map((top) => {
                  const isSelected = (currentTopic?.id === top.id);
                  return (
                    <button
                      key={top.id}
                      onClick={() => setSelectedTopicId(top.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#EAE5FF] text-[#7C6EE6] font-bold shadow-sm'
                          : 'text-[#777589] hover:text-[#28263A] hover:bg-white'
                      }`}
                    >
                      <span className="truncate">├── {top.name}</span>
                      {isSelected && <span className="text-[10px] font-bold text-[#7C6EE6] uppercase">ACTIVE</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CATEGORY TABS (All / 2 Marks / 5 Marks / 10 Marks / Numericals) */}
      <div className="flex items-center gap-2 p-1.5 bg-white rounded-3xl border border-[#EEEAF4] shadow-sm overflow-x-auto scrollbar-none">
        {[
          { id: 'all', label: '⚡ All / Mixed (10 / batch)' },
          { id: '2_marks', label: '📌 2 Marks (10 / batch)' },
          { id: '5_marks', label: '📑 5 Marks (10 / batch)' },
          { id: '10_marks', label: '📚 10 Marks (10 / batch)' },
          { id: 'numerical', label: '🧮 Numericals (10 / batch)' },
        ].map((tab) => {
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#7C6EE6] text-white shadow-sm'
                  : 'bg-[#FFF9F2] text-[#777589] hover:text-[#28263A] border border-[#EEEAF4]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* BATCH ACTION BAR: Export, Add to Revision Pack, Test Me on These 10 */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-red-950/30 via-[#0a0a14] to-black border border-red-900/40">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-red-500" />
            <span>Batch {batchCount} Actions:</span>
          </span>
          <span className="text-[11px] text-zinc-400 font-mono">
            ({filteredQuestions.length} Questions Displayed)
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleAddAllToRevisionPack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#141424] hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white transition-colors"
          >
            <Bookmark className="w-3.5 h-3.5 text-red-400" />
            <span>Add All to Revision Pack</span>
          </button>

          <button
            onClick={() => handleDownloadBatch('txt')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#141424] hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-400" />
            <span>Export 10 Questions / PDF</span>
          </button>

          <button
            onClick={startTestMode}
            className="btn-red-glow flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-extrabold text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] uppercase tracking-wide"
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Test Me on These 10 ⏱️</span>
          </button>
        </div>
      </div>

      {/* Secondary Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[#08080e] border border-zinc-900 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-zinc-500 font-mono flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-red-500" /> Filters:
          </span>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value as any)}
            className="bg-[#0f0f18] border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-300 focus:outline-none"
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <select
            value={importanceFilter}
            onChange={(e) => setImportanceFilter(e.target.value as any)}
            className="bg-[#0f0f18] border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-300 focus:outline-none"
          >
            <option value="All">All Importance Badges</option>
            <option value="Repeated">🔥 Repeated</option>
            <option value="High Probability">⭐ High Probability</option>
            <option value="Standard">🟡 Standard</option>
          </select>

          {batchCount > 1 && (
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-[#0f0f18] border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-300 focus:outline-none font-mono"
            >
              <option value="all">All Batches (1 to {batchCount})</option>
              {Array.from({ length: batchCount }, (_, i) => i + 1).map((b) => (
                <option key={b} value={b}>
                  Batch {b} (Q{(b - 1) * 10 + 1}–Q{b * 10})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setSavedOnly(!savedOnly)}
            className={`px-3 py-1 rounded-lg font-mono transition-colors flex items-center gap-1 ${
              savedOnly ? 'bg-red-950 text-red-400 border border-red-800' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved Only</span>
          </button>
        </div>

        <div className="text-zinc-500 font-mono text-[11px]">
          Showing {filteredQuestions.length} of {questions.length} questions
        </div>
      </div>

      {/* Numerical Inapplicable Notice */}
      {!numericalApplicable && activeCategory === 'numerical' && (
        <div className="p-8 rounded-2xl bg-[#090910] border border-red-950/40 text-center space-y-3 animate-fade-in">
          <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-800/40 flex items-center justify-center mx-auto text-red-400">
            <Binary className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">This topic does not require numerical questions.</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            {numericalNotice || 'This topic is theoretical in nature. University examinations evaluate this concept through descriptive answers, derivations, and definitions rather than calculations.'}
          </p>
          <button
            onClick={() => setActiveCategory('all')}
            className="btn-red-glow px-5 py-2.5 rounded-xl text-xs font-bold text-white uppercase tracking-wider"
          >
            Switch to Conceptual & Exam Questions
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="glass-panel-heavy rounded-2xl p-12 text-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin text-red-500 mx-auto" />
          <h3 className="text-base font-bold text-white">
            Generating Exactly 10 Questions for "{currentTopic?.name}"...
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Formulating authentic university questions calibrated to {activeCategory.replace('_', ' ').toUpperCase()} with step-by-step model answers and marking schemes.
          </p>
        </div>
      )}

      {/* Error state */}
      {generationError && !loading && (
        <div className="p-6 rounded-2xl bg-red-950/30 border border-red-600/50 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">Unable to generate questions right now.</h3>
          <p className="text-xs text-zinc-400">{generationError}</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => loadInitialQuestions()}
              className="btn-red-glow px-4 py-2 rounded-xl text-xs font-bold text-white"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Question Cards List */}
      {!loading && filteredQuestions.length > 0 && (
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => {
            const isExp = expandedAnswers[q.id || String(idx)];
            const isPractice = practiceModes[q.id || String(idx)];
            const isCopied = copiedId === q.id;
            const evalResult = practiceEvaluations[q.id];

            // Importance badge styling
            const impBadge = q.importanceBadge || q.priority || '⭐ High Probability';
            const isRepeated = impBadge.includes('Repeated') || impBadge.includes('🔥');
            const isHighProb = impBadge.includes('High') || impBadge.includes('⭐');

            return (
              <div
                key={q.id || idx}
                className="p-6 rounded-3xl bg-white border border-[#EEEAF4] hover:border-[#D9D2F8] shadow-sm hover:shadow-md transition-all space-y-4"
              >
                {/* Question Metadata Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EEEAF4] pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EAE5FF] text-[#7C6EE6]">
                      Q{q.questionNumber || idx + 1}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FFF0B8] text-amber-800">
                      {q.marks} Marks
                    </span>

                    {/* Importance Badge: 🔥 Repeated / ⭐ High Probability / 🟡 Standard */}
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        isRepeated
                          ? 'bg-[#FFDCE8] text-rose-700'
                          : isHighProb
                          ? 'bg-[#FFE0D2] text-[#E5A044]'
                          : 'bg-[#CFF5E7] text-[#319B78]'
                      }`}
                    >
                      {impBadge}
                    </span>

                    {/* Frequency indicator */}
                    {q.frequencyIndicator && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF9F2] text-[#777589] border border-[#EEEAF4]">
                        📊 {q.frequencyIndicator}
                      </span>
                    )}

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        q.difficulty === 'Easy'
                          ? 'bg-[#CFF5E7] text-[#319B78]'
                          : q.difficulty === 'Medium'
                          ? 'bg-[#FFF0B8] text-amber-800'
                          : 'bg-[#FFDCE8] text-rose-700'
                      }`}
                    >
                      {q.difficulty}
                    </span>

                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF9F2] text-[#777589] border border-[#EEEAF4]">
                      {q.type}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#777589]">
                    Topic: <span className="text-[#28263A] font-semibold">{currentTopic?.name}</span>
                  </div>
                </div>

                {/* Question Text */}
                <h3 className="text-sm sm:text-base font-bold text-[#28263A] leading-relaxed">
                  {q.question}
                </h3>

                {/* Numerical details if available */}
                {q.isNumerical && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {q.given && (
                      <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#EEEAF4]">
                        <span className="font-bold text-[#7C6EE6]">Given: </span>
                        <span className="text-[#28263A] whitespace-pre-line">{q.given}</span>
                      </div>
                    )}
                    {q.required && (
                      <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#EEEAF4]">
                        <span className="font-bold text-[#7C6EE6]">Required: </span>
                        <span className="text-[#28263A] whitespace-pre-line">{q.required}</span>
                      </div>
                    )}
                    {q.formula && (
                      <div className="md:col-span-2 p-2.5 rounded-xl bg-black/60 border border-zinc-900 font-mono text-rose-300 text-[11px]">
                        Formula: {q.formula}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Bar per question */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAnswer(q.id || String(idx))}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#141420] hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 transition-colors"
                    >
                      {isExp ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5 text-[#7C6EE6]" />
                          <span>Hide Model Answer</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5 text-[#7C6EE6]" />
                          <span>View Model Answer ({q.marks}M)</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => togglePractice(q.id || String(idx))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        isPractice
                          ? 'bg-[#7C6EE6] text-white border-[#7C6EE6]'
                          : 'bg-[#CFF5E7]/70 text-[#319B78] border-[#A9E8D2] hover:bg-[#CFF5E7]'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isPractice ? 'Close Practice' : 'Practice & Check Answer'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Add to Revision List */}
                    <button
                      onClick={() => handleToggleSave(q.id)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs border transition-colors ${
                        q.saved
                          ? 'bg-[#FFE0D2] text-[#E5A044] border-[#FFCBB3] font-bold'
                          : 'bg-[#FFFDF9] border-[#EEEAF4] text-[#777589] hover:text-[#28263A]'
                      }`}
                      title={q.saved ? 'Remove from Revision List' : 'Add to Revision List'}
                    >
                      {q.saved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{q.saved ? 'Saved' : 'Revision List'}</span>
                    </button>

                    {/* Copy Question */}
                    <button
                      onClick={() => handleCopyQuestion(q)}
                      className="p-2 rounded-xl bg-[#FFFDF9] border border-[#EEEAF4] text-[#777589] hover:text-[#28263A] transition-colors"
                      title="Copy Question & Model Answer"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-[#319B78]" /> : <Copy className="w-4 h-4" />}
                    </button>

                    {/* Download single Question + Answer */}
                    <button
                      onClick={() => handleDownloadSingle(q, idx)}
                      className="p-2 rounded-xl bg-[#FFFDF9] border border-[#EEEAF4] text-[#777589] hover:text-[#28263A] transition-colors"
                      title="Download Question + Answer (.txt)"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* EXPANDABLE MODEL ANSWER CONTENT */}
                {isExp && (
                  <div className="p-5 rounded-2xl bg-[#FFFDF9] border border-[#EEEAF4] space-y-4 text-xs leading-relaxed animate-fade-in font-sans">
                    <div className="flex items-center justify-between border-b border-[#EEEAF4] pb-2">
                      <span className="font-bold text-[#7C6EE6] uppercase text-[11px] flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-[#7C6EE6]" />
                        <span>Exam-Calibrated Model Answer ({q.marks} Marks):</span>
                      </span>
                      <span className="text-[10px] text-[#777589]">
                        {q.marks === 2 ? 'Concise definition + key distinction' : q.marks === 5 ? 'Structured explanation & points' : 'Comprehensive semester paper essay format'}
                      </span>
                    </div>

                    {/* Answer text */}
                    <div className="text-[#28263A] whitespace-pre-line text-xs sm:text-sm leading-relaxed">
                      {q.answer}
                    </div>

                    {/* Step-by-step breakdown */}
                    {q.stepByStep && q.stepByStep.length > 0 && (
                      <div className="p-4 rounded-xl bg-white border border-[#EEEAF4] space-y-2">
                        <span className="text-[11px] font-bold text-[#28263A] uppercase block">
                          📝 Step-by-Step Breakdown:
                        </span>
                        <div className="space-y-1.5">
                          {q.stepByStep.map((step, sIdx) => (
                            <div key={sIdx} className="flex items-start gap-2 text-[11px] text-zinc-300">
                              <span className="text-red-400 font-mono font-bold">{sIdx + 1}.</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Marking Scheme */}
                    {q.markingScheme && (
                      <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 text-[11px] font-mono">
                        <span className="font-bold text-emerald-400">Marking Scheme: </span>
                        <span>{q.markingScheme}</span>
                      </div>
                    )}

                    {/* Common Mistakes to Avoid */}
                    {q.commonMistakes && (
                      <div className="p-3 rounded-xl bg-rose-950/25 border border-rose-900/40 text-rose-300 text-[11px]">
                        <span className="font-bold text-rose-400 font-mono">⚠️ Common Mistake to Avoid: </span>
                        <span>{q.commonMistakes}</span>
                      </div>
                    )}

                    {q.finalAnswer && (
                      <div className="p-3 rounded-lg bg-red-950/50 border border-red-700/60 font-mono text-white text-xs">
                        <span className="text-red-400 font-bold">Final Answer: </span>
                        {q.finalAnswer}
                      </div>
                    )}
                  </div>
                )}

                {/* INLINE PRACTICE & CHECK ANSWER BOX */}
                {isPractice && (
                  <div className="p-5 rounded-xl bg-[#090912] border border-red-900/40 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-red-500" />
                        <span>Practice Your Exam Answer ({q.marks} Marks):</span>
                      </label>
                      <span className="text-[10px] text-zinc-500 font-mono">Type below and click Check</span>
                    </div>

                    <textarea
                      value={practiceAnswers[q.id] || ''}
                      onChange={(e) =>
                        setPracticeAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      placeholder={`Draft your answer for Q: "${q.question.slice(0, 80)}..."`}
                      rows={4}
                      className="w-full bg-[#050508] border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 font-sans focus:outline-none focus:border-red-500"
                    />

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-zinc-500">
                        AI will evaluate correctness, technical accuracy, and presentation.
                      </span>

                      <button
                        onClick={() => handleCheckPracticeAnswer(q)}
                        disabled={evaluatingQuestionId === q.id}
                        className="btn-red-glow flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white uppercase tracking-wider"
                      >
                        {evaluatingQuestionId === q.id ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Grading...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>AI Check Answer</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Inline Evaluation Result */}
                    {evalResult && (
                      <div className="mt-3 p-4 rounded-xl bg-black/80 border border-red-900/50 space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                          <span className="font-mono text-xs font-bold text-red-400">
                            Estimated Score: {evalResult.estimatedScore} / {q.marks} Marks
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400">
                            Evaluated against university rubric
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {evalResult.whatYouDidWell && (
                            <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-900/40 text-emerald-300">
                              <span className="font-bold text-[11px] block mb-1">✓ What You Did Well:</span>
                              <ul className="space-y-1">
                                {(evalResult.whatYouDidWell || []).slice(0, 3).map((w: string, i: number) => (
                                  <li key={i}>• {w}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {evalResult.missingPoints && (
                            <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-900/40 text-rose-300">
                              <span className="font-bold text-[11px] block mb-1">✕ Missing Points:</span>
                              <ul className="space-y-1">
                                {(evalResult.missingPoints || []).slice(0, 3).map((m: string, i: number) => (
                                  <li key={i}>• {m}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {evalResult.howToImprove && (
                          <div className="text-[11px] text-amber-300 bg-amber-950/20 p-2.5 rounded-lg border border-amber-900/40">
                            <span className="font-bold">Exam Pro-Tip: </span>
                            <span>{Array.isArray(evalResult.howToImprove) ? evalResult.howToImprove[0] : evalResult.howToImprove}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* GENERATE NEXT 10 BUTTON */}
          <div className="p-8 rounded-2xl glass-panel-heavy border border-red-950/40 text-center space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                Completed Batch {batchCount} (Questions 1 to {questions.length})
              </h3>
              <p className="text-xs text-zinc-400">
                Ready for more practice on <span className="text-white font-semibold">{currentTopic?.name}</span>?
                StudyAI maintains question history to guarantee zero duplicates.
              </p>
            </div>

            <button
              onClick={handleGenerateNext10}
              disabled={loading}
              className="btn-red-glow flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-xs font-bold text-white uppercase tracking-wider mx-auto shadow-2xl"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Next 10 Questions (Batch {batchCount + 1})</span>
            </button>
          </div>
        </div>
      )}

      {/* INTERACTIVE 10-QUESTION TIMED TEST MODAL ("Test Me on These 10") */}
      {isTestModeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-3xl bg-[#090912] border border-red-900/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-red-400 uppercase font-bold flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                  <span>Interactive 10-Question Mock Test</span>
                </span>
                <h2 className="text-xl font-extrabold text-white">
                  Topic: {currentTopic?.name}
                </h2>
              </div>

              <div className="flex items-center gap-4">
                {/* Countdown Timer */}
                <div className="px-3.5 py-1.5 rounded-xl bg-red-950/70 border border-red-800 text-red-300 font-mono text-sm font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    {Math.floor(testTimeRemaining / 60)}:
                    {(testTimeRemaining % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                <button
                  onClick={() => setIsTestModeOpen(false)}
                  className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {!testSubmitted ? (
              <>
                {/* Question selector dots 1 to 10 */}
                <div className="flex items-center gap-2 flex-wrap">
                  {questions.slice(0, 10).map((_, qIdx) => {
                    const isAnswered = !!testUserAnswers[qIdx]?.trim();
                    const isCurrent = currentTestQuestionIdx === qIdx;
                    return (
                      <button
                        key={qIdx}
                        onClick={() => setCurrentTestQuestionIdx(qIdx)}
                        className={`w-8 h-8 rounded-xl font-mono text-xs font-bold transition-all ${
                          isCurrent
                            ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                            : isAnswered
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                        }`}
                      >
                        {qIdx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Current Active Question in Test */}
                {questions[currentTestQuestionIdx] && (
                  <div className="p-5 rounded-2xl bg-[#0f0f1c] border border-red-950 space-y-4">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-red-400">
                        Question {currentTestQuestionIdx + 1} of {Math.min(10, questions.length)}
                      </span>
                      <span className="text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                        {questions[currentTestQuestionIdx].marks} Marks
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white leading-relaxed">
                      {questions[currentTestQuestionIdx].question}
                    </h3>

                    <textarea
                      value={testUserAnswers[currentTestQuestionIdx] || ''}
                      onChange={(e) =>
                        setTestUserAnswers((prev) => ({
                          ...prev,
                          [currentTestQuestionIdx]: e.target.value,
                        }))
                      }
                      placeholder="Type your exam solution or answer here..."
                      rows={6}
                      className="w-full bg-[#050508] border border-zinc-800 rounded-xl p-4 text-xs text-zinc-200 focus:outline-none focus:border-red-500 font-sans leading-relaxed"
                    />
                  </div>
                )}

                {/* Navigation and Submit */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    disabled={currentTestQuestionIdx === 0}
                    onClick={() => setCurrentTestQuestionIdx((prev) => prev - 1)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-zinc-300 disabled:opacity-40"
                  >
                    ← Previous
                  </button>

                  <div className="flex items-center gap-3">
                    {currentTestQuestionIdx < Math.min(9, questions.length - 1) && (
                      <button
                        onClick={() => setCurrentTestQuestionIdx((prev) => prev + 1)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white"
                      >
                        Next Question →
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setTestSubmitted(true);
                        triggerConfetti();
                        showToast('10-Question Mock Test submitted! Reviewing answers.', 'success');
                      }}
                      className="btn-red-glow px-6 py-2.5 rounded-xl text-xs font-bold text-white uppercase tracking-wider shadow-lg"
                    >
                      Submit Test
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Test Review & Score Summary */
              <div className="space-y-6 animate-fade-in">
                <div className="p-6 rounded-2xl bg-gradient-to-r from-red-950/40 via-[#10080f] to-black border border-red-800/50 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h3 className="text-xl font-bold text-white">Mock Test Completed!</h3>
                  <p className="text-xs text-zinc-400">
                    You attempted {Object.keys(testUserAnswers).filter((k) => !!testUserAnswers[Number(k)]?.trim()).length} out of {Math.min(10, questions.length)} questions on "{currentTopic?.name}".
                  </p>
                </div>

                <div className="space-y-4">
                  {questions.slice(0, 10).map((q, idx) => {
                    const ans = testUserAnswers[idx] || '';
                    return (
                      <div key={idx} className="p-4 rounded-xl bg-[#0f0f1a] border border-zinc-900 space-y-3 text-xs">
                        <div className="flex items-center justify-between font-mono">
                          <span className="font-bold text-red-400">Q{idx + 1} ({q.marks} Marks)</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] ${ans ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                            {ans ? 'Attempted' : 'Skipped'}
                          </span>
                        </div>
                        <p className="font-semibold text-white">{q.question}</p>
                        {ans && (
                          <div className="p-2.5 rounded-lg bg-black/60 text-zinc-300 font-mono text-[11px]">
                            <span className="text-zinc-500 font-bold block">Your Answer:</span>
                            {ans}
                          </div>
                        )}
                        <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-900/30 text-zinc-200">
                          <span className="text-red-400 font-mono font-bold block mb-1">Model Solution:</span>
                          {q.answer}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-center pt-2">
                  <button
                    onClick={() => setIsTestModeOpen(false)}
                    className="btn-red-glow px-6 py-2.5 rounded-xl text-xs font-bold text-white"
                  >
                    Done & Return to Questions
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
