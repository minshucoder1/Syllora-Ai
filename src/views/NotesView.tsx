import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileText,
  Copy,
  Printer,
  Download,
  Sparkles,
  RefreshCw,
  Flame,
  Check,
  Code,
  Lightbulb,
  Cpu,
  Layers,
  ArrowRight,
  Bookmark,
  Search,
  BookOpen,
  Zap,
  HelpCircle,
  Table,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const NotesView: React.FC = () => {
  const { activeSubject, subjects, selectedTopicId, setSelectedTopicId, showToast, triggerConfetti } = useApp();

  const currentSubject = activeSubject || subjects[0];
  const allTopics = currentSubject?.units.flatMap((u) => u.topics) || [];
  const currentTopic = allTopics.find((t) => t.id === selectedTopicId) || allTopics[0];

  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<any>(null);

  // Note Format: 'quick_revision' | 'detailed' | 'last_minute'
  const [noteFormat, setNoteFormat] = useState<'quick_revision' | 'detailed' | 'last_minute'>('detailed');

  // Explain mode / style
  const [activeExplainMode, setActiveExplainMode] = useState<
    'normal' | 'simple' | 'eli5' | 'real_life' | 'exam' | 'hinglish' | 'derivation'
  >('normal');
  const [isReExplaining, setIsReExplaining] = useState(false);
  const [alternateExplanation, setAlternateExplanation] = useState<string | null>(null);

  // Search & Bookmarks
  const [searchQuery, setSearchQuery] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load Notes
  const loadNotes = async (topic: any, force = false, format = noteFormat) => {
    if (!topic || !currentSubject) return;
    setLoading(true);
    setAlternateExplanation(null);
    setActiveExplainMode('normal');

    const unit = currentSubject.units.find((u) => u.topics.some((t) => t.id === topic.id));

    try {
      const res = await fetch('/api/ai/tutor-suite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_short_notes',
          subjectName: currentSubject.name,
          unitName: unit?.name || 'Unit 1',
          topicName: topic.name,
          noteFormat: format,
          language: activeExplainMode === 'hinglish' ? 'hinglish' : 'english',
        }),
      });

      if (!res.ok) {
        throw new Error('Notes generator busy');
      }

      const data = await res.json();
      setNote({
        title: topic.name,
        unitName: unit?.name || 'Curriculum',
        content: data.markdown || data.result?.notes,
        format,
      });
    } catch {
      // Fallback structured note
      setNote({
        title: topic.name,
        unitName: unit?.name || 'Core Unit',
        format,
        content: `### 📌 Core Definition\n${topic.name} is a fundamental academic concept in ${currentSubject.name}.\n\n### 🔑 Key Principles\n- Essential theory covering system behavior and mathematical formulation.\n- Foundational rules applicable to real-world engineering and computational problems.\n\n### 📐 Key Formula\n$$\\text{Relation} = f(\\alpha, \\beta, \\gamma)$$\n\n### 🧠 Memory Trick\nRemember the acronym **F.A.S.T** for the sequential steps.\n\n### ⚠️ Common Mistakes\nAvoid confusing units or missing boundary condition assumptions in exams.`,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTopic) {
      loadNotes(currentTopic, false, noteFormat);
    }
  }, [currentTopic?.id, noteFormat]);

  // Handle Explain Differently
  const handleExplainDifferently = async (
    mode: 'normal' | 'simple' | 'eli5' | 'real_life' | 'exam' | 'hinglish' | 'derivation'
  ) => {
    if (!note || mode === activeExplainMode) return;
    if (mode === 'normal') {
      setActiveExplainMode('normal');
      setAlternateExplanation(null);
      return;
    }

    setIsReExplaining(true);
    setActiveExplainMode(mode);

    try {
      const res = await fetch('/api/ai/tutor-suite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'doubt_solver',
          subjectName: currentSubject?.name,
          topicName: currentTopic?.name,
          query: `Explain ${currentTopic?.name} in style: ${mode}`,
          level: mode === 'eli5' ? 'beginner' : mode === 'exam' ? 'exam_oriented' : 'easy',
          language: mode === 'hinglish' ? 'hinglish' : 'english',
          style: mode === 'derivation' ? 'step_by_step_derivation' : 'general',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAlternateExplanation(data.markdown || data.reply || '');
        showToast(`Regenerated in ${mode.toUpperCase()} mode!`, 'success');
        triggerConfetti();
      }
    } catch {
      showToast('Could not regenerate style.', 'error');
    } finally {
      setIsReExplaining(false);
    }
  };

  const handleCopy = () => {
    if (!note) return;
    const text = `# ${note.title} (${currentSubject?.name})\n\n${alternateExplanation || note.content}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Copied notes to clipboard!', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredTopics = allTopics.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 1. TOP BANNER (Pastel Bloom Hero) */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 z-10 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EAE5FF] text-[#7C6EE6] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#7C6EE6]" />
              <span>Distraction-Free Short Notes</span>
            </span>
            <span className="text-xs text-[#777589]">
              • High-Yield Exam Formulas & Summaries
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#28263A] tracking-tight">
            Notes: <span className="text-[#7C6EE6]">{currentTopic?.name || 'Select Topic'}</span>
          </h1>

          <p className="text-xs sm:text-sm text-[#777589]">
            {currentSubject?.name} • Concise definitions, formulas with SI units, difference matrices, and mnemonics.
          </p>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-2 z-10 flex-wrap">
          <button
            onClick={() => {
              setIsBookmarked(!isBookmarked);
              showToast(isBookmarked ? 'Removed from bookmarks' : 'Bookmarked notes!', 'info');
            }}
            className={`p-2.5 rounded-2xl border transition-all ${
              isBookmarked
                ? 'bg-[#FFE0D2] text-[#E5A044] border-[#FFCBB3]'
                : 'bg-[#FFFDF9] text-[#777589] hover:text-[#28263A] border-[#EEEAF4]'
            }`}
            title="Bookmark Notes"
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#E5A044]' : ''}`} />
          </button>

          <button
            onClick={handleCopy}
            className="p-2.5 rounded-2xl bg-[#FFFDF9] hover:bg-[#EAE5FF]/50 border border-[#EEEAF4] text-[#777589] hover:text-[#28263A] transition-colors"
            title="Copy Notes"
          >
            {copied ? <Check className="w-4 h-4 text-[#319B78]" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handlePrint}
            className="p-2.5 rounded-2xl bg-[#FFFDF9] hover:bg-[#EAE5FF]/50 border border-[#EEEAF4] text-[#777589] hover:text-[#28263A] transition-colors"
            title="Print or Export PDF"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            onClick={() => loadNotes(currentTopic, true, noteFormat)}
            disabled={loading}
            className="btn-pastel-primary px-4 py-2.5 rounded-2xl text-xs font-bold text-white flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Regenerate</span>
          </button>
        </div>
      </div>

      {/* 2. NOTE FORMAT SELECTOR (Quick Revision / Detailed / Last-Minute) */}
      <div className="p-4 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'quick_revision', label: '⚡ Quick Revision', desc: '1-page condensed matrix', bg: 'bg-[#FFE0D2]', text: 'text-[#E5A044]' },
            { id: 'detailed', label: '📖 Detailed Notes', desc: 'Understanding & proofs', bg: 'bg-[#EAE5FF]', text: 'text-[#7C6EE6]' },
            { id: 'last_minute', label: '🚨 Last-Minute Sprint', desc: 'Formulas & keywords only', bg: 'bg-[#FFDCE8]', text: 'text-rose-600' },
          ].map((fmt) => {
            const isActive = noteFormat === fmt.id;
            return (
              <button
                key={fmt.id}
                onClick={() => setNoteFormat(fmt.id as any)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#7C6EE6] text-white shadow-sm'
                    : 'bg-[#FFF9F2] text-[#777589] hover:text-[#28263A] border border-[#EEEAF4]'
                }`}
              >
                <span>{fmt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Topic Quick Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#777589] absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search syllabus topics..."
            className="w-full bg-[#FFFDF9] border border-[#EEEAF4] rounded-2xl pl-9 pr-3 py-2 text-xs text-[#28263A] focus:outline-none focus:border-[#7C6EE6]"
          />
        </div>
      </div>

      {/* 3. MAIN WORKSPACE: Topics Column (Left) + Notes Display (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Topics Sidebar */}
        <div className="lg:col-span-4 p-5 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm space-y-3 h-fit max-h-[700px] overflow-y-auto scrollbar-thin">
          <div className="flex items-center justify-between border-b border-[#EEEAF4] pb-2">
            <span className="text-xs font-bold text-[#28263A] uppercase tracking-wider font-mono flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#7C6EE6]" />
              <span>Syllabus Topics</span>
            </span>
            <span className="text-[10px] text-[#777589]">{filteredTopics.length} available</span>
          </div>

          <div className="space-y-1">
            {filteredTopics.map((top) => {
              const isSelected = currentTopic?.id === top.id;
              return (
                <button
                  key={top.id}
                  onClick={() => setSelectedTopicId(top.id)}
                  className={`w-full text-left p-3 rounded-2xl text-xs transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#EAE5FF] text-[#7C6EE6] font-bold shadow-sm'
                      : 'text-[#777589] hover:text-[#28263A] hover:bg-[#FFFDF9]'
                  }`}
                >
                  <span className="truncate pr-2">{top.name}</span>
                  {top.priority === 'very_important' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFE0D2] text-[#E5A044] font-bold">
                      🔥 High Yield
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Note Content & Explanations */}
        <div className="lg:col-span-8 space-y-6">
          {/* EXPLAIN DIFFERENTLY CONTROL STRIP */}
          <div className="p-4 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7C6EE6] font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#7C6EE6]" />
                <span>Explain Differently</span>
              </span>
              <span className="text-[11px] text-[#777589]">
                Change understanding lens without losing key facts
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
              {[
                { id: 'normal', label: 'Standard Master' },
                { id: 'simple', label: 'Simple Terms' },
                { id: 'eli5', label: "Explain Like I'm 5" },
                { id: 'real_life', label: 'Real-Life Story' },
                { id: 'derivation', label: 'Step-by-Step Derivation' },
                { id: 'hinglish', label: 'Hinglish Mode 🇮🇳' },
              ].map((m) => {
                const isActive = activeExplainMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleExplainDifferently(m.id as any)}
                    disabled={isReExplaining}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-[#7C6EE6] text-white shadow-sm'
                        : 'bg-[#FFF9F2] text-[#777589] hover:text-[#28263A] border border-[#EEEAF4]'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* MAIN NOTES DISPLAY */}
          {loading ? (
            <div className="p-16 rounded-3xl bg-white border border-[#EEEAF4] text-center space-y-4 shadow-sm">
              <RefreshCw className="w-8 h-8 text-[#7C6EE6] animate-spin mx-auto" />
              <h3 className="text-base font-bold text-[#28263A]">Structuring Pastel Bloom Notes...</h3>
              <p className="text-xs text-[#777589] max-w-md mx-auto">
                Extracting core definitions, step-by-step algorithms, formula legends, and high-scoring exam points.
              </p>
            </div>
          ) : note ? (
            <div className="space-y-6">
              {/* Highlight Callouts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Lavender Callout: Definition */}
                <div className="p-5 rounded-3xl bg-[#EAE5FF]/60 border border-[#D9D2F8] space-y-1.5 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#7C6EE6]">
                    <BookOpen className="w-4 h-4" />
                    <span>Core Definition</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#28263A] font-medium leading-relaxed">
                    {note.title} is an essential academic principle evaluated for theoretical clarity, derivation accuracy, and application.
                  </p>
                </div>

                {/* Mint Callout: High Exam Yield */}
                <div className="p-5 rounded-3xl bg-[#CFF5E7]/60 border border-[#A9E8D2] space-y-1.5 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#319B78]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Exam Tip & Scoring</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#28263A] font-medium leading-relaxed">
                    Always draw clear diagrams, state SI units, and highlight boundary conditions to earn full marks.
                  </p>
                </div>
              </div>

              {/* Note Markdown Content Body */}
              <div className="p-7 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#EEEAF4] pb-3">
                  <span className="text-xs font-bold text-[#28263A] uppercase tracking-wider font-mono">
                    Study Material ({activeExplainMode.toUpperCase()})
                  </span>
                  {isReExplaining && (
                    <span className="text-xs text-[#7C6EE6] flex items-center gap-1 animate-pulse font-medium">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Re-generating style...</span>
                    </span>
                  )}
                </div>

                <div className="prose max-w-none text-xs sm:text-sm text-[#28263A] leading-relaxed whitespace-pre-wrap font-sans space-y-3">
                  {alternateExplanation || note.content}
                </div>
              </div>

              {/* Bottom Quick Callout: Memory Tricks & Pitfalls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-3xl bg-[#FFF0B8]/60 border border-[#FFE58A] space-y-2 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                    <Lightbulb className="w-4 h-4" />
                    <span>Memory Trick / Mnemonic</span>
                  </div>
                  <p className="text-xs text-[#28263A]">
                    Use the 3-step anchor method: Definition → Equation with Units → One Real-world Example.
                  </p>
                </div>

                <div className="p-5 rounded-3xl bg-[#FFE0D2]/60 border border-[#FFCBB3] space-y-2 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#E5A044]">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Common Exam Mistakes</span>
                  </div>
                  <p className="text-xs text-[#28263A]">
                    Avoid missing intermediate algebra lines or omitting units in numerical answers.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-white border border-[#EEEAF4] text-center space-y-3 shadow-sm">
              <FileText className="w-8 h-8 text-[#777589] mx-auto" />
              <h3 className="text-base font-bold text-[#28263A]">Select a topic to generate notes</h3>
              <p className="text-xs text-[#777589]">Choose from the topic list on the left to review high-yield material.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
