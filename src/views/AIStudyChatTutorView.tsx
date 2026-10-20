import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import {
  MessageSquare,
  Sparkles,
  BookOpen,
  Calendar,
  FileText,
  HelpCircle,
  Binary,
  Compass,
  CheckCircle2,
  Clock,
  Send,
  RefreshCw,
  Copy,
  Check,
  Bookmark,
  Printer,
  ChevronDown,
  ChevronRight,
  Flame,
  AlertTriangle,
  Lightbulb,
  Code,
  Languages,
  Award,
  Zap,
  CheckSquare,
  ArrowRight,
  Sliders,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actionType?: string;
  metadata?: {
    subject?: string;
    unit?: string;
    topic?: string;
    level?: string;
    language?: string;
  };
}

export const AIStudyChatTutorView: React.FC = () => {
  const { user, subjects, activeSubject, setActiveSubject, setActiveTab, openSyllabusFlow, showToast } = useApp();

  // Selected Academic Context
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(activeSubject?.id || (subjects[0]?.id || ''));
  const currentSubject = subjects.find((s) => s.id === selectedSubjectId) || activeSubject || subjects[0] || null;

  const [selectedUnitIndex, setSelectedUnitIndex] = useState<number>(0);
  const currentUnit = currentSubject?.units?.[selectedUnitIndex] || null;

  const [selectedTopicName, setSelectedTopicName] = useState<string>('');

  // Tutor Settings
  const [explanationLevel, setExplanationLevel] = useState<'beginner' | 'easy' | 'exam_oriented' | 'advanced'>('exam_oriented');
  const [languageMode, setLanguageMode] = useState<'hinglish' | 'english'>('hinglish');
  const [roadmapMode, setRoadmapMode] = useState<'quick' | 'detailed'>('detailed');
  const [noteFormat, setNoteFormat] = useState<'quick_revision' | 'detailed' | 'last_minute'>('detailed');

  // Input & Messaging
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [activeSpecialTool, setActiveSpecialTool] = useState<'none' | 'roadmap' | 'plan' | 'notes' | 'questions'>('none');

  // Specific Tool Inputs
  const [planExamDate, setPlanExamDate] = useState<string>('2026-11-20');
  const [planDailyHours, setPlanDailyHours] = useState<number>(3);
  const [planTargetMarks, setPlanTargetMarks] = useState<string>('85%+ Marks (A Grade)');
  const [planIsCrash, setPlanIsCrash] = useState<boolean>(false);

  const [roadmapTimeAvailable, setRoadmapTimeAvailable] = useState<string>('1 Week');
  const [roadmapKnowledgeLevel, setRoadmapKnowledgeLevel] = useState<string>('Intermediate');

  // Topic Completion Local Progress Tracking
  const [topicProgressMap, setTopicProgressMap] = useState<Record<string, 'not_started' | 'in_progress' | 'completed'>>({});

  // Chat History
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      role: 'assistant',
      content: `👋 **Hey ${user?.name || 'Student'}! Welcome to your AI Study Chat Tutor.**

I am your Pastel Bloom AI Study Companion. Whether you need a formula derived step-by-step, want an intuitive explanation in **Hinglish**, or need a structured roadmap for your upcoming semester exam — I'm right here to guide you.

### 🌸 What would you like to explore today?
- **Ask a Doubt**: Clear conceptual doubts or tricky numericals.
- **Explain in Hinglish**: Natural conversational blend of Hindi & English.
- **Derive Step by Step**: Every single line with formulas, reasons, and units.
- **Create Study Roadmap**: Prerequisite-ordered study checklist.
- **Generate Study Plan**: Realistic daily and weekly timetable.
- **Make Short Notes**: 1-page condensed revision sheet with tables & mnemonics.
- **Important Exam Questions**: 2-mark, 5-mark, and 10-mark model answers.

*Select your subject and topic above, or pick a quick action below to begin!*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Sync active subject if changed from AppContext
  useEffect(() => {
    if (activeSubject && activeSubject.id !== selectedSubjectId) {
      setSelectedSubjectId(activeSubject.id);
    }
  }, [activeSubject]);

  // Update selected topic default when unit changes
  useEffect(() => {
    if (currentUnit && currentUnit.topics && currentUnit.topics.length > 0) {
      if (!selectedTopicName || !currentUnit.topics.some((t) => t.name === selectedTopicName)) {
        setSelectedTopicName(currentUnit.topics[0].name);
      }
    }
  }, [currentUnit]);

  // Execute Tutor Action
  const executeTutorAction = useCallback(
    async (
      action: 'doubt_solver' | 'create_roadmap' | 'generate_study_plan' | 'generate_short_notes' | 'important_questions' | 'smart_chat',
      customQuery?: string,
      styleOverride?: 'general' | 'step_by_step_derivation' | 'numerical' | 'programming' | 'conceptual'
    ) => {
      const queryText = (customQuery || inputQuery).trim();
      const subjectName = currentSubject?.name || 'General Engineering';
      const unitName = currentUnit?.name || '';
      const topicName = selectedTopicName || '';

      if (!queryText && action === 'smart_chat') {
        showToast('Please enter a doubt or select an action.', 'info');
        return;
      }

      const userMsgId = `usr_${Date.now()}`;
      let displayContent = queryText;
      if (!displayContent) {
        if (action === 'create_roadmap') displayContent = `Generate ${roadmapMode} Study Roadmap for ${unitName || topicName || subjectName}`;
        else if (action === 'generate_study_plan') displayContent = `Generate Study Plan for ${subjectName} (Exam: ${planExamDate}, ${planDailyHours}h/day)`;
        else if (action === 'generate_short_notes') displayContent = `Generate ${noteFormat.replace('_', ' ')} short notes for ${topicName || unitName || subjectName}`;
        else if (action === 'important_questions') displayContent = `Generate Important Exam Questions with Model Answers for ${topicName || unitName || subjectName}`;
        else if (styleOverride === 'step_by_step_derivation') displayContent = `Explain step-by-step derivation for ${topicName || unitName}`;
        else displayContent = `Explain ${topicName || unitName || subjectName} in ${languageMode}`;
      }

      const newHistoryItem: ChatMessage = {
        id: userMsgId,
        role: 'user',
        content: displayContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionType: action,
        metadata: {
          subject: subjectName,
          unit: unitName,
          topic: topicName,
          level: explanationLevel,
          language: languageMode,
        },
      };

      setMessages((prev) => [...prev, newHistoryItem]);
      setInputQuery('');
      setIsLoading(true);

      try {
        const payload = {
          action,
          query: queryText || displayContent,
          subjectName,
          unitName,
          topicName,
          level: explanationLevel,
          language: languageMode,
          style: styleOverride || 'general',
          roadmapMode,
          availableTime: roadmapTimeAvailable,
          knowledgeLevel: roadmapKnowledgeLevel,
          examDate: planExamDate,
          dailyHours: planDailyHours,
          targetMarks: planTargetMarks,
          isCrashPlan: planIsCrash,
          noteFormat,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        };

        const res = await fetch('/api/ai/tutor-suite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'AI Tutor is temporarily busy. Please try again.');
        }

        const assistantMsg: ChatMessage = {
          id: `ast_${Date.now()}`,
          role: 'assistant',
          content: data.markdown || data.reply || 'Here is your academic solution.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionType: action,
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: any) {
        showToast(err.message || 'Unable to connect to AI Tutor', 'error');
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            role: 'assistant',
            content: `⚠️ **Unable to complete request.**\n\n${err.message || 'The AI service encountered a temporary timeout. Please retry with a shorter query.'}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      inputQuery,
      currentSubject,
      currentUnit,
      selectedTopicName,
      explanationLevel,
      languageMode,
      roadmapMode,
      roadmapTimeAvailable,
      roadmapKnowledgeLevel,
      planExamDate,
      planDailyHours,
      planTargetMarks,
      planIsCrash,
      noteFormat,
      messages,
      showToast,
    ]
  );

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied to clipboard!', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
    showToast('Bookmark updated', 'info');
  };

  const handlePrint = (content: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Syllora AI - Study Notes</title>
            <style>
              body { font-family: system-ui, sans-serif; line-height: 1.6; color: #28263A; padding: 40px; background: #FFF9F2; }
              h1, h2, h3 { color: #7C6EE6; }
              pre { background: #EAE5FF; padding: 12px; border-radius: 8px; overflow-x: auto; }
              table { width: 100%; border-collapse: collapse; margin: 16px 0; background: #fff; }
              th, td { border: 1px solid #EEEAF4; padding: 10px; text-align: left; }
              th { background-color: #EAE5FF; color: #28263A; }
              footer { margin-top: 40px; border-top: 1px solid #EEEAF4; padding-top: 12px; font-size: 12px; color: #777589; }
            </style>
          </head>
          <body>
            <h1>Syllora AI — AI Study Chat Tutor</h1>
            <h3>Subject: ${currentSubject?.name || 'Academic Studies'}</h3>
            <div>${content.replace(/\n/g, '<br/>')}</div>
            <footer>© 2026 Syllora AI. All rights reserved. | Developed By Minshu Kumar</footer>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const cycleTopicStatus = (topicKey: string) => {
    setTopicProgressMap((prev) => {
      const current = prev[topicKey] || 'not_started';
      const next = current === 'not_started' ? 'in_progress' : current === 'in_progress' ? 'completed' : 'not_started';
      return { ...prev, [topicKey]: next };
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. HEADER BANNER (Pastel Bloom Card) */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm relative overflow-hidden">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#EAE5FF] flex items-center justify-center text-[#7C6EE6] shadow-sm flex-shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#28263A] flex items-center gap-2">
                AI Study Chat Tutor
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EAE5FF] text-[#7C6EE6]">
                  Pastel Bloom
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-[#777589]">
                Your friendly academic companion for doubts, Hinglish derivations, roadmaps, and short notes.
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls: Language & Explanation Level */}
        <div className="flex items-center gap-2 z-10 flex-wrap">
          {/* Language Switcher */}
          <div className="flex items-center gap-1 p-1 bg-[#FFF9F2] rounded-2xl border border-[#EEEAF4]">
            <Languages className="w-3.5 h-3.5 text-[#7C6EE6] ml-2" />
            <button
              onClick={() => setLanguageMode('hinglish')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                languageMode === 'hinglish'
                  ? 'bg-[#7C6EE6] text-white shadow-sm'
                  : 'text-[#777589] hover:text-[#28263A]'
              }`}
            >
              Hinglish 🇮🇳
            </button>
            <button
              onClick={() => setLanguageMode('english')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                languageMode === 'english'
                  ? 'bg-[#7C6EE6] text-white shadow-sm'
                  : 'text-[#777589] hover:text-[#28263A]'
              }`}
            >
              English
            </button>
          </div>

          {/* Explanation Level Selector */}
          <div className="flex items-center gap-1 p-1 bg-[#FFF9F2] rounded-2xl border border-[#EEEAF4]">
            <Sliders className="w-3.5 h-3.5 text-[#7C6EE6] ml-2" />
            {(['beginner', 'easy', 'exam_oriented', 'advanced'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setExplanationLevel(lvl)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold capitalize transition-all ${
                  explanationLevel === lvl
                    ? 'bg-[#EAE5FF] text-[#7C6EE6] font-bold shadow-sm'
                    : 'text-[#777589] hover:text-[#28263A]'
                }`}
              >
                {lvl.replace('_', '-')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. SYLLABUS & CONTEXT SELECTOR BAR (Clean White Panel) */}
      <div className="p-5 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
        {/* Subject Select */}
        <div>
          <label className="text-[11px] text-[#777589] font-semibold uppercase tracking-wider block mb-1">
            1. Select Subject
          </label>
          <div className="relative">
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setSelectedUnitIndex(0);
                const s = subjects.find((subj) => subj.id === e.target.value);
                if (s) setActiveSubject(s);
              }}
              className="w-full bg-[#FFFDF9] border border-[#EEEAF4] rounded-xl px-3 py-2 text-xs text-[#28263A] appearance-none focus:outline-none focus:border-[#7C6EE6] font-medium"
            >
              {subjects.length === 0 ? (
                <option value="">No subjects added yet</option>
              ) : (
                subjects.map((subj) => (
                  <option key={subj.id} value={subj.id}>
                    {subj.name} ({subj.code || 'CORE'})
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#777589] absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Unit Select */}
        <div>
          <label className="text-[11px] text-[#777589] font-semibold uppercase tracking-wider block mb-1">
            2. Unit / Chapter
          </label>
          <div className="relative">
            <select
              value={selectedUnitIndex}
              onChange={(e) => setSelectedUnitIndex(Number(e.target.value))}
              disabled={!currentSubject || !currentSubject.units?.length}
              className="w-full bg-[#FFFDF9] border border-[#EEEAF4] rounded-xl px-3 py-2 text-xs text-[#28263A] appearance-none focus:outline-none focus:border-[#7C6EE6] font-medium disabled:opacity-50"
            >
              {!currentSubject || !currentSubject.units?.length ? (
                <option value={0}>No units available</option>
              ) : (
                currentSubject.units.map((unit, idx) => (
                  <option key={idx} value={idx}>
                    {unit.name || `Unit ${idx + 1}`}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#777589] absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Topic Select */}
        <div>
          <label className="text-[11px] text-[#777589] font-semibold uppercase tracking-wider block mb-1">
            3. Specific Topic
          </label>
          <div className="relative">
            <select
              value={selectedTopicName}
              onChange={(e) => setSelectedTopicName(e.target.value)}
              disabled={!currentUnit || !currentUnit.topics?.length}
              className="w-full bg-[#FFFDF9] border border-[#EEEAF4] rounded-xl px-3 py-2 text-xs text-[#28263A] appearance-none focus:outline-none focus:border-[#7C6EE6] font-medium disabled:opacity-50"
            >
              {!currentUnit || !currentUnit.topics?.length ? (
                <option value="">Complete Unit Overview</option>
              ) : (
                currentUnit.topics.map((top, idx) => (
                  <option key={idx} value={top.name}>
                    {top.name} {top.priority === 'very_important' ? '🔥' : ''}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#777589] absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Upload Action */}
        <div>
          <label className="text-[11px] text-[#777589] font-semibold uppercase tracking-wider block mb-1">
            Syllabus Storage
          </label>
          <button
            onClick={() => openSyllabusFlow()}
            className="w-full py-2 px-3 rounded-xl bg-[#CFF5E7]/70 hover:bg-[#CFF5E7] border border-[#A9E8D2] text-[#319B78] text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Upload New Syllabus</span>
          </button>
        </div>
      </div>

      {/* 3. ONE-CLICK STUDY ACTIONS LAUNCHPAD (Pastel Colored Cards) */}
      <div className="p-5 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#7C6EE6]" />
            <h2 className="text-xs font-bold text-[#28263A] uppercase tracking-wider font-mono">
              One-Click Study Actions for: <span className="text-[#7C6EE6] font-sans normal-case">{selectedTopicName || currentUnit?.name || currentSubject?.name || 'Selected Concept'}</span>
            </h2>
          </div>
          <span className="text-[11px] text-[#777589]">Auto-fills context</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          <button
            onClick={() => executeTutorAction('doubt_solver', `Explain ${selectedTopicName || currentUnit?.name} in simple terms with everyday examples`)}
            disabled={isLoading}
            className="p-3 rounded-2xl bg-[#EAE5FF]/60 hover:bg-[#EAE5FF] border border-[#D9D2F8] text-left text-[#28263A] transition-all flex flex-col justify-between group hover:-translate-y-0.5 hover:shadow-sm"
          >
            <span className="font-bold text-[#28263A] group-hover:text-[#7C6EE6] transition-colors flex items-center gap-1.5">
              <span>❓</span> Ask a Doubt
            </span>
            <span className="text-[10px] text-[#777589] mt-1">Simple intuitive breakdown</span>
          </button>

          <button
            onClick={() => executeTutorAction('doubt_solver', `Explain ${selectedTopicName || currentUnit?.name} completely in Hinglish language with relatable Indian student examples`, 'general')}
            disabled={isLoading}
            className="p-3 rounded-2xl bg-[#FFE0D2]/60 hover:bg-[#FFE0D2] border border-[#FFCBB3] text-left text-[#28263A] transition-all flex flex-col justify-between group hover:-translate-y-0.5 hover:shadow-sm"
          >
            <span className="font-bold text-[#28263A] group-hover:text-[#E5A044] transition-colors flex items-center gap-1.5">
              <span>🇮🇳</span> In Hinglish
            </span>
            <span className="text-[10px] text-[#777589] mt-1">Hindi + English blend</span>
          </button>

          <button
            onClick={() => executeTutorAction('doubt_solver', `Provide exhaustive step-by-step mathematical derivation for ${selectedTopicName || currentUnit?.name}`, 'step_by_step_derivation')}
            disabled={isLoading}
            className="p-3 rounded-2xl bg-[#CFF5E7]/60 hover:bg-[#CFF5E7] border border-[#A9E8D2] text-left text-[#28263A] transition-all flex flex-col justify-between group hover:-translate-y-0.5 hover:shadow-sm"
          >
            <span className="font-bold text-[#28263A] group-hover:text-[#319B78] transition-colors flex items-center gap-1.5">
              <span>📐</span> Step-by-Step Derivation
            </span>
            <span className="text-[10px] text-[#777589] mt-1">Every equation & reason</span>
          </button>

          <button
            onClick={() => setActiveSpecialTool(activeSpecialTool === 'roadmap' ? 'none' : 'roadmap')}
            className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between group hover:-translate-y-0.5 hover:shadow-sm ${
              activeSpecialTool === 'roadmap'
                ? 'bg-[#EAE5FF] border-[#7C6EE6] text-[#7C6EE6] font-bold'
                : 'bg-[#FFFDF9] hover:bg-[#EAE5FF]/40 border-[#EEEAF4] text-[#28263A]'
            }`}
          >
            <span className="font-bold group-hover:text-[#7C6EE6] transition-colors flex items-center gap-1.5">
              <span>🗺️</span> Study Roadmap
            </span>
            <span className="text-[10px] text-[#777589] mt-1">Prerequisite sequence</span>
          </button>

          <button
            onClick={() => setActiveSpecialTool(activeSpecialTool === 'plan' ? 'none' : 'plan')}
            className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between group hover:-translate-y-0.5 hover:shadow-sm ${
              activeSpecialTool === 'plan'
                ? 'bg-[#FFE0D2] border-[#E5A044] text-[#E5A044] font-bold'
                : 'bg-[#FFFDF9] hover:bg-[#FFE0D2]/40 border-[#EEEAF4] text-[#28263A]'
            }`}
          >
            <span className="font-bold group-hover:text-[#E5A044] transition-colors flex items-center gap-1.5">
              <span>📅</span> Generate Study Plan
            </span>
            <span className="text-[10px] text-[#777589] mt-1">Daily & weekly timetable</span>
          </button>

          <button
            onClick={() => executeTutorAction('generate_short_notes')}
            disabled={isLoading}
            className="p-3 rounded-2xl bg-[#FFF0B8]/60 hover:bg-[#FFF0B8] border border-[#FFE58A] text-left text-[#28263A] transition-all flex flex-col justify-between group hover:-translate-y-0.5 hover:shadow-sm"
          >
            <span className="font-bold text-[#28263A] group-hover:text-amber-700 transition-colors flex items-center gap-1.5">
              <span>📝</span> Make Short Notes
            </span>
            <span className="text-[10px] text-[#777589] mt-1">1-page formula & matrix</span>
          </button>

          <button
            onClick={() => executeTutorAction('important_questions')}
            disabled={isLoading}
            className="p-3 rounded-2xl bg-[#FFDCE8]/60 hover:bg-[#FFDCE8] border border-[#FFB8D2] text-left text-[#28263A] transition-all flex flex-col justify-between group hover:-translate-y-0.5 hover:shadow-sm"
          >
            <span className="font-bold text-[#28263A] group-hover:text-rose-600 transition-colors flex items-center gap-1.5">
              <span>🎯</span> Exam Questions
            </span>
            <span className="text-[10px] text-[#777589] mt-1">2M, 5M, 10M with answers</span>
          </button>

          <button
            onClick={() => setActiveTab('mcqs')}
            className="p-3 rounded-2xl bg-[#EAE5FF]/60 hover:bg-[#EAE5FF] border border-[#D9D2F8] text-left text-[#28263A] transition-all flex flex-col justify-between group hover:-translate-y-0.5 hover:shadow-sm"
          >
            <span className="font-bold text-[#28263A] group-hover:text-[#7C6EE6] transition-colors flex items-center gap-1.5">
              <span>🔘</span> Practice MCQs
            </span>
            <span className="text-[10px] text-[#777589] mt-1">Sprint test quiz engine</span>
          </button>

          <button
            onClick={() => executeTutorAction('doubt_solver', `Solve numerical questions with step-by-step given, formula, calculation, and units for ${selectedTopicName || currentUnit?.name}`, 'numerical')}
            disabled={isLoading}
            className="p-3 rounded-2xl bg-[#CFF5E7]/60 hover:bg-[#CFF5E7] border border-[#A9E8D2] text-left text-[#28263A] transition-all flex flex-col justify-between group hover:-translate-y-0.5 hover:shadow-sm"
          >
            <span className="font-bold text-[#28263A] group-hover:text-[#319B78] transition-colors flex items-center gap-1.5">
              <span>🔢</span> Numerical Practice
            </span>
            <span className="text-[10px] text-[#777589] mt-1">Given, Formula, Result</span>
          </button>

          <button
            onClick={() => executeTutorAction('generate_short_notes', undefined)}
            disabled={isLoading}
            className="p-3 rounded-2xl bg-[#FFE0D2]/60 hover:bg-[#FFE0D2] border border-[#FFCBB3] text-left text-[#28263A] transition-all flex flex-col justify-between group hover:-translate-y-0.5 hover:shadow-sm"
          >
            <span className="font-bold text-[#28263A] group-hover:text-[#E5A044] transition-colors flex items-center gap-1.5">
              <span>⚡</span> Quick Revision
            </span>
            <span className="text-[10px] text-[#777589] mt-1">Fast 10-point recall</span>
          </button>

          <button
            onClick={() => executeTutorAction('doubt_solver', `Conduct a 5-question rapid self-assessment test with answers for ${selectedTopicName || currentUnit?.name}`, 'general')}
            disabled={isLoading}
            className="p-3 rounded-2xl bg-[#FFF0B8]/60 hover:bg-[#FFF0B8] border border-[#FFE58A] text-left text-[#28263A] transition-all flex flex-col justify-between group hover:-translate-y-0.5 hover:shadow-sm"
          >
            <span className="font-bold text-[#28263A] group-hover:text-amber-700 transition-colors flex items-center gap-1.5">
              <span>🧪</span> Mini Test
            </span>
            <span className="text-[10px] text-[#777589] mt-1">Instant scoring rubric</span>
          </button>

          <button
            onClick={() => executeTutorAction('doubt_solver', `Start from absolute basics and teach ${selectedTopicName || currentUnit?.name} step-by-step assuming I know nothing`, 'conceptual')}
            disabled={isLoading}
            className="p-3 rounded-2xl bg-[#FFDCE8]/60 hover:bg-[#FFDCE8] border border-[#FFB8D2] text-left text-[#28263A] transition-all flex flex-col justify-between group hover:-translate-y-0.5 hover:shadow-sm"
          >
            <span className="font-bold text-[#28263A] group-hover:text-rose-600 transition-colors flex items-center gap-1.5">
              <span>🌱</span> Zero-Level Basics
            </span>
            <span className="text-[10px] text-[#777589] mt-1">"Mujhe kuch nahi aata"</span>
          </button>
        </div>
      </div>

      {/* DRAWERS FOR ROADMAP & STUDY PLAN (Pastel Panels) */}
      {activeSpecialTool === 'roadmap' && (
        <div className="p-6 rounded-3xl bg-[#FFFDF9] border border-[#D9D2F8] space-y-4 shadow-md animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#EEEAF4] pb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#7C6EE6]" />
              <h3 className="text-sm font-bold text-[#28263A]">Create Structured Study Roadmap</h3>
            </div>
            <button
              onClick={() => setActiveSpecialTool('none')}
              className="text-xs text-[#777589] hover:text-[#28263A]"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-[#777589] block mb-1 font-semibold">Roadmap Granularity</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setRoadmapMode('quick')}
                  className={`flex-1 py-2 rounded-xl border text-xs font-semibold ${
                    roadmapMode === 'quick' ? 'bg-[#EAE5FF] border-[#7C6EE6] text-[#7C6EE6]' : 'border-[#EEEAF4] bg-white text-[#777589]'
                  }`}
                >
                  Quick Checklist
                </button>
                <button
                  onClick={() => setRoadmapMode('detailed')}
                  className={`flex-1 py-2 rounded-xl border text-xs font-semibold ${
                    roadmapMode === 'detailed' ? 'bg-[#EAE5FF] border-[#7C6EE6] text-[#7C6EE6]' : 'border-[#EEEAF4] bg-white text-[#777589]'
                  }`}
                >
                  Detailed Path
                </button>
              </div>
            </div>

            <div>
              <label className="text-[#777589] block mb-1 font-semibold">Current Knowledge Level</label>
              <select
                value={roadmapKnowledgeLevel}
                onChange={(e) => setRoadmapKnowledgeLevel(e.target.value)}
                className="w-full bg-white border border-[#EEEAF4] rounded-xl px-3 py-2 text-[#28263A]"
              >
                <option value="Complete Beginner (Starting from zero)">Complete Beginner (Zero)</option>
                <option value="Intermediate (Attended lectures)">Intermediate (Attended lectures)</option>
                <option value="Advanced (Exam revision)">Advanced (Exam revision)</option>
              </select>
            </div>

            <div>
              <label className="text-[#777589] block mb-1 font-semibold">Available Preparation Time</label>
              <select
                value={roadmapTimeAvailable}
                onChange={(e) => setRoadmapTimeAvailable(e.target.value)}
                className="w-full bg-white border border-[#EEEAF4] rounded-xl px-3 py-2 text-[#28263A]"
              >
                <option value="24 Hours (Emergency)">24 Hours (Emergency 🚨)</option>
                <option value="3 Days Sprint">3 Days Sprint</option>
                <option value="1 Week">1 Week</option>
                <option value="2 Weeks">2 Weeks</option>
                <option value="1 Month">1 Month</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => {
              executeTutorAction('create_roadmap');
              setActiveSpecialTool('none');
            }}
            disabled={isLoading}
            className="btn-pastel-primary w-full py-3 rounded-2xl text-xs font-bold text-white uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm"
          >
            <Compass className="w-4 h-4" />
            <span>Generate Autonomous Roadmap Now</span>
          </button>
        </div>
      )}

      {activeSpecialTool === 'plan' && (
        <div className="p-6 rounded-3xl bg-[#FFFDF9] border border-[#FFCBB3] space-y-4 shadow-md animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#EEEAF4] pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#E5A044]" />
              <h3 className="text-sm font-bold text-[#28263A]">Generate Personalized Study Plan</h3>
            </div>
            <button
              onClick={() => setActiveSpecialTool('none')}
              className="text-xs text-[#777589] hover:text-[#28263A]"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="text-[#777589] block mb-1 font-semibold">Target Exam Date</label>
              <input
                type="date"
                value={planExamDate}
                onChange={(e) => setPlanExamDate(e.target.value)}
                className="w-full bg-white border border-[#EEEAF4] rounded-xl px-3 py-2 text-[#28263A]"
              />
            </div>

            <div>
              <label className="text-[#777589] block mb-1 font-semibold">
                Daily Hours: <span className="text-[#7C6EE6] font-bold">{planDailyHours}h</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={planDailyHours}
                onChange={(e) => setPlanDailyHours(Number(e.target.value))}
                className="w-full accent-[#7C6EE6] cursor-pointer mt-2"
              />
            </div>

            <div>
              <label className="text-[#777589] block mb-1 font-semibold">Target Score Goal</label>
              <select
                value={planTargetMarks}
                onChange={(e) => setPlanTargetMarks(e.target.value)}
                className="w-full bg-white border border-[#EEEAF4] rounded-xl px-3 py-2 text-[#28263A]"
              >
                <option value="Pass with Good Marks (60-70%)">Pass with Good Marks (60-70%)</option>
                <option value="Top Grade / 85%+ Marks">Top Grade / 85%+ Marks (A+)</option>
                <option value="University Ranker (95%+ Marks)">University Ranker (95%+)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="crashPlanCheck"
                checked={planIsCrash}
                onChange={(e) => setPlanIsCrash(e.target.checked)}
                className="w-4 h-4 accent-[#7C6EE6] rounded"
              />
              <label htmlFor="crashPlanCheck" className="text-xs text-[#28263A] font-medium cursor-pointer">
                🚨 Crash Mode (Exam in 24-48 hrs)
              </label>
            </div>
          </div>

          <button
            onClick={() => {
              executeTutorAction('generate_study_plan');
              setActiveSpecialTool('none');
            }}
            disabled={isLoading}
            className="btn-pastel-primary w-full py-3 rounded-2xl text-xs font-bold text-white uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm"
          >
            <Calendar className="w-4 h-4" />
            <span>Generate Realistic Daily Timetable</span>
          </button>
        </div>
      )}

      {/* 4. MAIN TWO-COLUMN WORKSPACE: Chat Area (Left) + Syllabus Tracker (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Conversational Chat */}
        <div className="lg:col-span-8 flex flex-col h-[750px] rounded-3xl bg-white border border-[#EEEAF4] shadow-[0_4px_24px_rgba(40,38,58,0.04)] overflow-hidden relative">
          {/* Chat Window Header */}
          <div className="px-6 py-4 border-b border-[#EEEAF4] bg-[#FFFDF9] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#319B78] animate-pulse" />
              <div>
                <div className="text-xs font-bold text-[#28263A] flex items-center gap-2">
                  <span>AI Tutor Active</span>
                  <span className="text-[10px] text-[#777589] font-medium bg-[#EAE5FF] px-2 py-0.5 rounded-full text-[#7C6EE6]">
                    {currentSubject?.name || 'Curriculum'}
                  </span>
                </div>
                <div className="text-[10px] text-[#777589]">
                  {languageMode === 'hinglish' ? 'Hinglish Mode' : 'English Mode'} • Level: {explanationLevel.replace('_', '-')}
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                setMessages([
                  {
                    id: `clear_${Date.now()}`,
                    role: 'assistant',
                    content: 'Chat session refreshed. Select a topic or ask any academic doubt below.',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ])
              }
              title="Clear Chat"
              className="p-1.5 rounded-xl text-[#777589] hover:text-[#28263A] hover:bg-[#EAE5FF]/50 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#FFFDF9]/60 scrollbar-thin">
            {messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              const isBookmarked = bookmarkedIds.includes(msg.id);

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 text-sm ${isAssistant ? 'items-start' : 'items-start justify-end'}`}
                >
                  {isAssistant && (
                    <div className="w-8 h-8 rounded-xl bg-[#EAE5FF] flex items-center justify-center flex-shrink-0 text-[#7C6EE6] shadow-sm mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[90%] sm:max-w-[85%] rounded-3xl p-5 relative group space-y-2.5 ${
                      isAssistant
                        ? 'bg-white border border-[#EEEAF4] text-[#28263A] shadow-sm'
                        : 'bg-[#7C6EE6] text-white shadow-sm'
                    }`}
                  >
                    {/* Header info */}
                    <div className={`flex items-center justify-between text-[10px] pb-1.5 mb-1.5 border-b ${isAssistant ? 'text-[#777589] border-[#EEEAF4]' : 'text-white/80 border-white/20'}`}>
                      <span className="font-semibold">{isAssistant ? 'Syllora AI Tutor' : 'You (Student)'}</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    {/* Content Body */}
                    <div className="prose max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans space-y-2">
                      {msg.content}
                    </div>

                    {/* Assistant Message Actions */}
                    {isAssistant && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EEEAF4] text-[11px] text-[#777589]">
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="hover:text-[#28263A] flex items-center gap-1 transition-colors px-2 py-0.5 rounded-lg hover:bg-[#EAE5FF]/50"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-[#319B78]" />
                              <span className="text-[#319B78]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => toggleBookmark(msg.id)}
                          className="hover:text-[#28263A] flex items-center gap-1 transition-colors px-2 py-0.5 rounded-lg hover:bg-[#EAE5FF]/50"
                        >
                          <Bookmark className={`w-3 h-3 ${isBookmarked ? 'text-amber-500 fill-amber-500' : ''}`} />
                          <span>{isBookmarked ? 'Saved' : 'Bookmark'}</span>
                        </button>

                        <button
                          onClick={() => handlePrint(msg.content)}
                          className="hover:text-[#28263A] flex items-center gap-1 transition-colors px-2 py-0.5 rounded-lg hover:bg-[#EAE5FF]/50"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Print / PDF</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {!isAssistant && (
                    <div className="w-8 h-8 rounded-xl bg-[#EAE5FF] flex items-center justify-center flex-shrink-0 text-xs font-bold text-[#7C6EE6] mt-0.5">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#EAE5FF] flex items-center justify-center flex-shrink-0 text-[#7C6EE6] animate-pulse">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-3xl bg-white border border-[#EEEAF4] text-[#28263A] text-xs sm:text-sm flex items-center gap-3 shadow-sm">
                  <RefreshCw className="w-4 h-4 text-[#7C6EE6] animate-spin" />
                  <span>Syllora AI is analyzing syllabus, formatting derivations, and structuring concepts...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Smart Input Box */}
          <div className="p-4 border-t border-[#EEEAF4] bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeTutorAction('smart_chat');
              }}
              className="space-y-2.5"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder={`Ask any doubt, derivation, or formula from ${selectedTopicName || currentUnit?.name || currentSubject?.name || 'your syllabus'}...`}
                  disabled={isLoading}
                  className="flex-1 bg-[#FFFDF9] border border-[#EEEAF4] focus:border-[#7C6EE6] rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#28263A] placeholder-[#777589] focus:outline-none transition-all shadow-inner"
                />

                <button
                  type="submit"
                  disabled={isLoading || !inputQuery.trim()}
                  className="btn-pastel-primary px-5 py-3 rounded-2xl text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 disabled:opacity-50 transition-all flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Ask Tutor</span>
                </button>
              </div>

              {/* Natural intent shortcuts */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-0.5 text-[11px] text-[#777589]">
                <span className="font-semibold text-[#7C6EE6] flex-shrink-0">Try asking:</span>
                <button
                  type="button"
                  onClick={() => executeTutorAction('smart_chat', `Unit 2 ka roadmap batao for ${currentSubject?.name || 'my exam'}`)}
                  className="px-2.5 py-1 rounded-full bg-[#EAE5FF] hover:bg-[#ded7ff] text-[#7C6EE6] font-medium flex-shrink-0"
                >
                  "Unit 2 ka roadmap batao"
                </button>
                <button
                  type="button"
                  onClick={() => executeTutorAction('smart_chat', `Kal exam hai, kya padhu? Create a 1-day emergency sprint plan.`)}
                  className="px-2.5 py-1 rounded-full bg-[#FFE0D2] hover:bg-[#fed3c0] text-[#E5A044] font-medium flex-shrink-0"
                >
                  "Kal exam hai, kya padhu?"
                </button>
                <button
                  type="button"
                  onClick={() => executeTutorAction('smart_chat', `Is topic ke short notes do with formula and differences`)}
                  className="px-2.5 py-1 rounded-full bg-[#FFF0B8] hover:bg-[#fee99c] text-amber-800 font-medium flex-shrink-0"
                >
                  "Is topic ke short notes do"
                </button>
                <button
                  type="button"
                  onClick={() => executeTutorAction('smart_chat', `Is derivation ko Hinglish mein samjhao step-by-step`)}
                  className="px-2.5 py-1 rounded-full bg-[#CFF5E7] hover:bg-[#bbf0de] text-[#319B78] font-medium flex-shrink-0"
                >
                  "Is derivation ko Hinglish mein samjhao"
                </button>
                <button
                  type="button"
                  onClick={() => executeTutorAction('smart_chat', `Mujhe ye topic nahi aata, start from absolute basics.`)}
                  className="px-2.5 py-1 rounded-full bg-[#FFDCE8] hover:bg-[#fecadb] text-rose-700 font-medium flex-shrink-0"
                >
                  "Mujhe ye topic nahi aata"
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Syllabus Tracker */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#28263A] uppercase tracking-wider font-mono flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#7C6EE6]" />
                <span>Syllabus Tracker</span>
              </h3>
              <span className="text-[10px] text-[#7C6EE6] font-bold bg-[#EAE5FF] px-2.5 py-0.5 rounded-full">
                {currentSubject?.units?.length || 0} Units
              </span>
            </div>

            <p className="text-xs text-[#777589]">
              Click any topic to set active context, toggle progress state, or trigger direct AI explanations.
            </p>

            {/* Units & Topics List */}
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin">
              {!currentSubject || !currentSubject.units?.length ? (
                <div className="p-6 rounded-2xl bg-[#FFFDF9] border border-[#EEEAF4] text-center space-y-2">
                  <BookOpen className="w-6 h-6 text-[#777589] mx-auto" />
                  <p className="text-xs text-[#777589]">No syllabus loaded for this subject.</p>
                  <button
                    onClick={() => openSyllabusFlow()}
                    className="btn-pastel-primary px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
                  >
                    Add Syllabus Document
                  </button>
                </div>
              ) : (
                currentSubject.units.map((unit, uIdx) => {
                  const isUnitSelected = selectedUnitIndex === uIdx;
                  const unitTopics = unit.topics || [];
                  const completedInUnit = unitTopics.filter(
                    (t) => (topicProgressMap[`${unit.name}_${t.name}`] || (t.completed ? 'completed' : 'not_started')) === 'completed'
                  ).length;

                  return (
                    <div
                      key={uIdx}
                      className={`rounded-2xl border transition-all overflow-hidden ${
                        isUnitSelected ? 'border-[#7C6EE6]/40 bg-[#FFFDF9]' : 'border-[#EEEAF4] bg-white'
                      }`}
                    >
                      {/* Unit Header */}
                      <button
                        onClick={() => setSelectedUnitIndex(uIdx)}
                        className="w-full p-3.5 text-left flex items-center justify-between hover:bg-[#EAE5FF]/30 transition-colors"
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-[#28263A] flex items-center gap-2">
                            <span>{unit.name || `Unit ${uIdx + 1}`}</span>
                          </div>
                          <div className="text-[10px] text-[#777589]">
                            {completedInUnit} / {unitTopics.length} Topics Completed
                          </div>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 text-[#777589] transition-transform ${isUnitSelected ? 'rotate-90 text-[#7C6EE6]' : ''}`}
                        />
                      </button>

                      {/* Topics List when expanded */}
                      {isUnitSelected && (
                        <div className="p-2.5 border-t border-[#EEEAF4] space-y-1.5 bg-[#FFFDF9]">
                          {unitTopics.map((top, tIdx) => {
                            const topicKey = `${unit.name}_${top.name}`;
                            const status = topicProgressMap[topicKey] || (top.completed ? 'completed' : 'not_started');
                            const isTopicSelected = selectedTopicName === top.name;

                            return (
                              <div
                                key={tIdx}
                                className={`p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                  isTopicSelected
                                    ? 'bg-[#EAE5FF] text-[#7C6EE6] font-semibold shadow-sm'
                                    : 'hover:bg-white text-[#28263A]'
                                }`}
                                onClick={() => setSelectedTopicName(top.name)}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      cycleTopicStatus(topicKey);
                                    }}
                                    title="Click to toggle: Not Started -> In Progress -> Completed"
                                    className="flex-shrink-0"
                                  >
                                    {status === 'completed' ? (
                                      <CheckCircle2 className="w-4 h-4 text-[#319B78]" />
                                    ) : status === 'in_progress' ? (
                                      <span className="w-3.5 h-3.5 rounded-full border-2 border-[#E5A044] bg-[#FFE0D2] inline-block" />
                                    ) : (
                                      <span className="w-3.5 h-3.5 rounded-full border border-[#777589]/50 inline-block" />
                                    )}
                                  </button>
                                  <span className="truncate">{top.name}</span>
                                </div>

                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  {top.priority === 'very_important' && (
                                    <span className="text-[10px] text-[#E5A044] font-bold bg-[#FFE0D2] px-1.5 py-0.2 rounded-full">
                                      🔥 High
                                    </span>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedTopicName(top.name);
                                      executeTutorAction('doubt_solver', `Explain ${top.name} in simple terms with derivations and examples`);
                                    }}
                                    title="Explain with AI"
                                    className="p-1 rounded-lg bg-white hover:bg-[#7C6EE6] text-[#777589] hover:text-white border border-[#EEEAF4] transition-colors"
                                  >
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Friendly Pastel Study Tip Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-[#FFF0B8]/60 to-[#FFE0D2]/40 border border-[#FFF0B8] space-y-2 shadow-sm">
            <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span>Exam Answer Tip</span>
            </div>
            <p className="text-xs text-[#28263A] leading-relaxed">
              University examiners look for step-by-step reasoning, labeled equations, and final units. Always select <strong className="text-[#7C6EE6]">Exam-Oriented</strong> level for 5-mark and 10-mark model answers!
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="pt-6 pb-2 text-center text-xs text-[#777589] border-t border-[#EEEAF4]">
        © 2026 Syllora AI. All rights reserved. | Developed By Minshu Kumar
      </footer>
    </div>
  );
};
