import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { StudyRoadmap, RoadmapDailyPlan, RoadmapTaskItem, Subject, Unit, Topic } from '../types';
import {
  Map,
  Compass,
  Calendar,
  Clock,
  Flame,
  Star,
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Trash2,
  Share2,
  Printer,
  Download,
  AlertTriangle,
  BrainCircuit,
  TrendingUp,
  BookOpen,
  HelpCircle,
  CheckSquare,
  Layers,
  ChevronDown,
  ChevronUp,
  Plus,
  Zap,
  Award,
  ListTodo,
  FileText,
  Sliders,
  History,
} from 'lucide-react';

export const StudyRoadmapView: React.FC = () => {
  const {
    subjects,
    activeSubject,
    setActiveSubject,
    setActiveTab,
    setSelectedTopicId,
    showToast,
    triggerConfetti,
  } = useApp();

  // State
  const [roadmaps, setRoadmaps] = useState<StudyRoadmap[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<StudyRoadmap | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAdapting, setIsAdapting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAdaptModal, setShowAdaptModal] = useState(false);
  const [activeDayTab, setActiveDayTab] = useState<number>(1);
  const [viewFilter, setViewFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Form State for Roadmap Generation
  const [formSubjectId, setFormSubjectId] = useState<string>(activeSubject?.id || subjects[0]?.id || '');
  const [formCustomTopic, setFormCustomTopic] = useState<string>('');
  const [formTargetScope, setFormTargetScope] = useState<'complete_subject' | 'selected_units' | 'selected_topics' | 'specific_topic'>('complete_subject');
  const [formSelectedUnits, setFormSelectedUnits] = useState<string[]>([]);
  const [formSelectedTopics, setFormSelectedTopics] = useState<string[]>([]);
  const [formExamDate, setFormExamDate] = useState<string>('2026-11-20');
  const [formDailyStudyMinutes, setFormDailyStudyMinutes] = useState<number>(120);
  const [formCurrentLevel, setFormCurrentLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [formPreferredLanguage, setFormPreferredLanguage] = useState<'English' | 'Hindi' | 'Hinglish'>('English');

  // Form State for Manual Adaptation Simulation
  const [adaptTopicName, setAdaptTopicName] = useState<string>('');
  const [adaptScorePercent, setAdaptScorePercent] = useState<number>(45);
  const [adaptAssessmentType, setAdaptAssessmentType] = useState<string>('MCQ Quiz & Rubric Evaluation');
  const [adaptWeakPoints, setAdaptWeakPoints] = useState<string>('Foundational formulas, edge conditions');

  // Load existing roadmaps
  const fetchRoadmaps = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/roadmaps');
      if (res.ok) {
        const data = await res.json();
        setRoadmaps(data.roadmaps || []);
        if (data.roadmaps && data.roadmaps.length > 0) {
          // Select current active subject's roadmap if exists, else first
          const matched = activeSubject
            ? data.roadmaps.find((r: StudyRoadmap) => r.subjectId === activeSubject.id)
            : null;
          setSelectedRoadmap(matched || data.roadmaps[0]);
        } else {
          setSelectedRoadmap(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch roadmaps', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmaps();
  }, [activeSubject]);

  // Sync default form values when opening modal
  useEffect(() => {
    if (activeSubject) {
      setFormSubjectId(activeSubject.id);
      if (activeSubject.examDate) {
        setFormExamDate(activeSubject.examDate);
      }
    } else if (subjects.length > 0) {
      setFormSubjectId(subjects[0].id);
    }
  }, [activeSubject, subjects]);

  const currentSubjectObj = subjects.find((s) => s.id === formSubjectId);

  // Toggle unit selection
  const toggleUnitSelect = (unitName: string) => {
    setFormSelectedUnits((prev) =>
      prev.includes(unitName) ? prev.filter((u) => u !== unitName) : [...prev, unitName]
    );
  };

  // Toggle topic selection
  const toggleTopicSelect = (topicName: string) => {
    setFormSelectedTopics((prev) =>
      prev.includes(topicName) ? prev.filter((t) => t !== topicName) : [...prev, topicName]
    );
  };

  // Handle roadmap creation
  const handleGenerateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();

    let subjectName = '';
    let topicsToPass: string[] = [];

    if (formTargetScope === 'specific_topic') {
      if (!formCustomTopic.trim()) {
        showToast('Please enter the specific topic name to prepare for', 'error');
        return;
      }
      subjectName = formCustomTopic.trim();
      topicsToPass = [formCustomTopic.trim()];
    } else {
      if (!currentSubjectObj) {
        showToast('Please select a subject or switch to "Specific Topic" mode', 'error');
        return;
      }
      subjectName = currentSubjectObj.name;

      if (formTargetScope === 'selected_topics') {
        topicsToPass = formSelectedTopics;
        if (topicsToPass.length === 0) {
          showToast('Please select at least 1 topic from the list below', 'error');
          return;
        }
      } else if (formTargetScope === 'selected_units') {
        const unitsFiltered = currentSubjectObj.units.filter((u) => formSelectedUnits.includes(u.name));
        topicsToPass = unitsFiltered.flatMap((u) => u.topics.map((t) => t.name));
        if (topicsToPass.length === 0) {
          showToast('Please select at least 1 unit', 'error');
          return;
        }
      } else {
        topicsToPass = currentSubjectObj.units.flatMap((u) => u.topics.map((t) => t.name));
      }
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/roadmaps/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: formTargetScope === 'specific_topic' ? undefined : currentSubjectObj?.id,
          subjectName,
          targetScope: formTargetScope,
          selectedUnits: formSelectedUnits,
          selectedTopics: topicsToPass,
          examDate: formExamDate,
          dailyStudyMinutes: Number(formDailyStudyMinutes),
          currentLevel: formCurrentLevel,
          preferredLanguage: formPreferredLanguage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate roadmap');
      }

      showToast('AI Study Roadmap successfully created! 🚀', 'success');
      triggerConfetti();
      setRoadmaps((prev) => [data.roadmap, ...prev]);
      setSelectedRoadmap(data.roadmap);
      setShowCreateModal(false);
      setActiveDayTab(1);
    } catch (err: any) {
      showToast(err.message || 'Error creating roadmap', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle Task Completion
  const handleToggleTask = async (dayNumber: number, taskId: string, completed: boolean) => {
    if (!selectedRoadmap) return;

    // Optimistic UI update
    const updatedDays = selectedRoadmap.days.map((day) => {
      if (day.dayNumber === dayNumber) {
        const updatedTasks = day.tasks.map((task) =>
          task.id === taskId ? { ...task, completed } : task
        );
        const dayCompleted = updatedTasks.every((t) => t.completed);
        return { ...day, tasks: updatedTasks, completed: dayCompleted };
      }
      return day;
    });

    const totalTasks = updatedDays.reduce((acc, d) => acc + d.tasks.length, 0);
    const completedTasks = updatedDays.reduce(
      (acc, d) => acc + d.tasks.filter((t) => t.completed).length,
      0
    );
    const newProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    setSelectedRoadmap({
      ...selectedRoadmap,
      days: updatedDays,
      overallProgress: newProgress,
    });

    if (completed && newProgress === 100) {
      triggerConfetti();
    }

    try {
      const res = await fetch(`/api/roadmaps/${selectedRoadmap.id}/task`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayNumber, taskId, completed }),
      });
      if (res.ok) {
        const data = await res.json();
        setRoadmaps((prev) => prev.map((r) => (r.id === data.roadmap.id ? data.roadmap : r)));
      }
    } catch (err) {
      console.error('Failed to sync task status', err);
    }
  };

  // Handle Adaptation Simulation
  const handleAdaptRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoadmap) return;
    if (!adaptTopicName.trim()) {
      showToast('Please select or specify a topic to test and adapt', 'error');
      return;
    }

    setIsAdapting(true);
    try {
      const res = await fetch(`/api/roadmaps/${selectedRoadmap.id}/adapt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicName: adaptTopicName.trim(),
          scorePercent: Number(adaptScorePercent),
          assessmentType: adaptAssessmentType,
          weakPoints: adaptWeakPoints.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to adapt roadmap');
      }

      showToast(`Roadmap adapted: ${data.adaptationSummary}`, 'success');
      setSelectedRoadmap(data.roadmap);
      setRoadmaps((prev) => prev.map((r) => (r.id === data.roadmap.id ? data.roadmap : r)));
      setShowAdaptModal(false);
    } catch (err: any) {
      showToast(err.message || 'Error adapting roadmap', 'error');
    } finally {
      setIsAdapting(false);
    }
  };

  // Delete Roadmap
  const handleDeleteRoadmap = async (id: string) => {
    if (!confirm('Are you sure you want to remove this study roadmap?')) return;
    try {
      const res = await fetch(`/api/roadmaps/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Study roadmap removed', 'info');
        const filtered = roadmaps.filter((r) => r.id !== id);
        setRoadmaps(filtered);
        setSelectedRoadmap(filtered[0] || null);
      }
    } catch (err) {
      showToast('Failed to delete roadmap', 'error');
    }
  };

  // Handle Export / Print
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    if (!selectedRoadmap) return;
    let text = `========================================================\n`;
    text += `STUDYAI — AI STUDY ROADMAP: ${selectedRoadmap.subjectName}\n`;
    text += `Target Exam: ${selectedRoadmap.examDate} | Daily Budget: ${(selectedRoadmap.dailyStudyMinutes / 60).toFixed(1)} hrs/day\n`;
    text += `Level: ${selectedRoadmap.currentLevel} | Overall Progress: ${selectedRoadmap.overallProgress}%\n`;
    text += `========================================================\n\n`;

    text += `ANALYSIS SUMMARY:\n`;
    text += `• Evaluated Topics: ${selectedRoadmap.analysis.analyzedTopicCount}\n`;
    text += `• Weak Topics: ${selectedRoadmap.analysis.weakTopics.join(', ') || 'None'}\n`;
    text += `• Strong Topics: ${selectedRoadmap.analysis.strongTopics.join(', ') || 'None'}\n`;
    text += `• Real Performance Note: ${selectedRoadmap.analysis.performanceSummary}\n\n`;

    selectedRoadmap.days.forEach((d) => {
      text += `--------------------------------------------------------\n`;
      text += `DAY ${d.dayNumber} [${d.date}] — ⏱ ${d.studyDurationFormatted}\n`;
      text += `Focus: ${d.summary}\n`;
      text += `Topics: ${d.topics.map((t) => `${t.topicName} (${t.priority})`).join(', ')}\n\n`;
      text += `Tasks:\n`;
      d.tasks.forEach((t) => {
        text += `  [${t.completed ? 'X' : ' '}] ${t.title} (${t.durationMinutes}m) - ${t.description}\n`;
      });
      text += `\n`;
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedRoadmap.subjectName.replace(/\s+/g, '_')}_Study_Roadmap.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Roadmap downloaded as text summary', 'success');
  };

  // Direct action navigation
  const handleActionNavigate = (actionType: string, topicName: string) => {
    // If topic belongs to an enrolled subject, find topic ID
    let matchedSubject: Subject | undefined;
    let matchedTopic: Topic | undefined;

    for (const s of subjects) {
      for (const u of s.units) {
        for (const t of u.topics) {
          if (t.name.toLowerCase() === topicName.toLowerCase()) {
            matchedSubject = s;
            matchedTopic = t;
            break;
          }
        }
      }
    }

    if (matchedSubject) {
      setActiveSubject(matchedSubject);
      if (matchedTopic) {
        setSelectedTopicId(matchedTopic.id);
      }
    }

    switch (actionType) {
      case 'learn':
        setActiveTab('notes');
        break;
      case 'questions':
        setActiveTab('important-questions');
        break;
      case 'mcq':
        setActiveTab('mcqs');
        break;
      case 'flashcards':
        setActiveTab('flashcards');
        break;
      case 'answer-checker':
        setActiveTab('answer-checker');
        break;
      default:
        setActiveTab('notes');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EAE5FF] text-[#7C6EE6] flex items-center gap-1.5">
              <BrainCircuit className="w-3.5 h-3.5 text-[#7C6EE6]" />
              <span>Smart Study Roadmap</span>
            </span>
            <span className="text-xs text-[#777589]">
              • Prerequisite-Ordered Milestones
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#28263A] flex items-center gap-3">
            <span>AI Study Roadmap</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#EAE5FF] text-[#7C6EE6]">
              Autonomous Path
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-[#777589] leading-relaxed">
            Generates an ordered, day-by-day learning schedule budgeted to your daily study hours and target exam date. Grounded in actual quiz scores, weak topics, and rubric evaluations without hallucinated metrics.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3 flex-wrap z-10">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-pastel-primary px-5 py-2.5 rounded-2xl text-xs font-bold text-white flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Roadmap</span>
          </button>
        </div>
      </div>

      {/* Main Roadmap Area */}
      {isLoading ? (
        <div className="p-16 rounded-3xl bg-white border border-[#EEEAF4] text-center space-y-4 shadow-sm">
          <RefreshCw className="w-8 h-8 text-[#7C6EE6] animate-spin mx-auto" />
          <p className="text-sm font-medium text-[#28263A]">Loading your AI Study Roadmaps...</p>
        </div>
      ) : roadmaps.length === 0 ? (
        /* Empty State */
        <div className="p-12 sm:p-16 rounded-3xl bg-white border border-[#EEEAF4] text-center space-y-6 max-w-2xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#EAE5FF] flex items-center justify-center mx-auto text-[#7C6EE6] shadow-sm">
            <Map className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[#28263A]">No AI Study Roadmap Yet</h2>
            <p className="text-xs sm:text-sm text-[#777589] leading-relaxed">
              Build your customized study roadmap from any subject syllabus, specific topic, or selected chapters. AI will calculate the daily time distribution and order prerequisites logically.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-pastel-primary px-6 py-3 rounded-2xl text-sm font-bold text-white inline-flex items-center gap-2 shadow-sm"
            >
              <Compass className="w-4 h-4" />
              <span>Build My Study Roadmap →</span>
            </button>
          </div>
        </div>
      ) : (
        /* Active Roadmap Selected */
        selectedRoadmap && (
          <div className="space-y-6">
            {/* Roadmap Switcher & Overview Bar */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-semibold text-[#777589]">Roadmap:</span>
                <select
                  value={selectedRoadmap.id}
                  onChange={(e) => {
                    const r = roadmaps.find((item) => item.id === e.target.value);
                    if (r) {
                      setSelectedRoadmap(r);
                      setActiveDayTab(1);
                    }
                  }}
                  className="bg-[#FFFDF9] border border-[#EEEAF4] rounded-xl px-3 py-1.5 text-xs font-bold text-[#28263A] focus:outline-none focus:border-[#7C6EE6]"
                >
                  {roadmaps.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.subjectName} ({r.days.length} Days • {r.overallProgress}% Done)
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2 text-xs text-[#777589] pl-2">
                  <span className="px-2.5 py-1 rounded-xl bg-[#FFF9F2] border border-[#EEEAF4] text-[#28263A] font-medium">
                    Target: {selectedRoadmap.examDate}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-[#FFF9F2] border border-[#EEEAF4] text-[#28263A] font-medium">
                    ⏱ {(selectedRoadmap.dailyStudyMinutes / 60).toFixed(1)} hrs/day
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-[#EAE5FF] text-[#7C6EE6] font-semibold">
                    {selectedRoadmap.currentLevel}
                  </span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 self-end lg:self-auto">
                <button
                  onClick={() => setShowAdaptModal(true)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#FFE0D2] hover:bg-[#fed3c0] text-[#E5A044] border border-[#FFCBB3] transition-all flex items-center gap-1.5 shadow-sm"
                  title="Simulate test performance adaptation"
                >
                  <Sliders className="w-3.5 h-3.5 text-[#E5A044]" />
                  <span>Adapt to Performance</span>
                </button>

                <button
                  onClick={handleDownloadText}
                  className="p-2 rounded-xl text-[#777589] hover:text-[#28263A] bg-[#FFFDF9] hover:bg-[#EAE5FF]/50 border border-[#EEEAF4] transition-colors"
                  title="Download Text Plan"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={handlePrint}
                  className="p-2 rounded-xl text-[#777589] hover:text-[#28263A] bg-[#FFFDF9] hover:bg-[#EAE5FF]/50 border border-[#EEEAF4] transition-colors"
                  title="Print / PDF View"
                >
                  <Printer className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDeleteRoadmap(selectedRoadmap.id)}
                  className="p-2 rounded-xl text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                  title="Remove Roadmap"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* AI Analysis & Diagnostics Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#090910] border border-red-950/40 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-[#7C6EE6]" />
                  <h3 className="text-xs font-bold text-[#28263A] uppercase tracking-wider font-mono">
                    AI Diagnostic & Performance Analysis
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-[#777589]">
                  {selectedRoadmap.analysis.analyzedTopicCount} Topics Evaluated
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Metric 1: Progress */}
                <div className="p-4 rounded-2xl bg-[#EAE5FF]/50 border border-[#D9D2F8] space-y-1.5 shadow-sm">
                  <span className="text-[11px] text-[#7C6EE6] font-semibold">Roadmap Progress</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-extrabold text-[#28263A]">
                      {selectedRoadmap.overallProgress}%
                    </span>
                    <span className="text-xs text-[#777589]">
                      {selectedRoadmap.days.filter((d) => d.completed).length} / {selectedRoadmap.days.length} Days
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-[#D9D2F8]">
                    <div
                      className="h-full bg-[#7C6EE6] rounded-full transition-all"
                      style={{ width: `${selectedRoadmap.overallProgress}%` }}
                    />
                  </div>
                </div>

                {/* Metric 2: Weak Topics */}
                <div className="p-4 rounded-2xl bg-[#FFE0D2]/50 border border-[#FFCBB3] space-y-1.5 shadow-sm">
                  <span className="text-[11px] text-[#E5A044] font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#E5A044]" />
                    <span>Focus Weak Areas</span>
                  </span>
                  <div className="text-xs text-[#28263A] font-medium line-clamp-2">
                    {selectedRoadmap.analysis.weakTopics.length > 0
                      ? selectedRoadmap.analysis.weakTopics.join(', ')
                      : 'None flagged (<65%)'}
                  </div>
                  <span className="text-[10px] text-[#777589] block">
                    Prioritized early in schedule
                  </span>
                </div>

                {/* Metric 3: Strong Topics */}
                <div className="p-4 rounded-2xl bg-[#CFF5E7]/50 border border-[#A9E8D2] space-y-1.5 shadow-sm">
                  <span className="text-[11px] text-[#319B78] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#319B78]" />
                    <span>Mastered Topics</span>
                  </span>
                  <div className="text-xs text-[#28263A] font-medium line-clamp-2">
                    {selectedRoadmap.analysis.strongTopics.length > 0
                      ? selectedRoadmap.analysis.strongTopics.join(', ')
                      : 'Baseline initial progress'}
                  </div>
                  <span className="text-[10px] text-[#777589] block">
                    Accelerated review pace
                  </span>
                </div>

                {/* Metric 4: Exam Readiness */}
                <div className="p-4 rounded-2xl bg-[#FFF0B8]/50 border border-[#FFE58A] space-y-1.5 shadow-sm">
                  <span className="text-[11px] text-amber-700 font-semibold">Exam Readiness</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-extrabold text-[#28263A]">
                      {selectedRoadmap.analysis.examReadinessScore || 72}/100
                    </span>
                    <span className="text-[10px] text-[#777589]">Predicted</span>
                  </div>
                  <span className="text-[10px] text-[#777589] block">
                    {selectedRoadmap.days.length} Days Planned Schedule
                  </span>
                </div>
              </div>

              {/* Real Performance Summary Quote */}
              <div className="p-3.5 rounded-2xl bg-[#FFF9F2] border border-[#EEEAF4] text-xs text-[#28263A] leading-relaxed">
                <span className="text-[#7C6EE6] font-bold text-[11px] uppercase mr-2">
                  Academic Diagnostic Note:
                </span>
                {selectedRoadmap.analysis.performanceSummary}
                <div className="text-[10px] text-[#777589] mt-1 italic">
                  * Topic priorities (Very High / High / Medium / Low) reflect curriculum weightage and student prerequisite order. Does not guarantee examination questions.
                </div>
              </div>

              {/* Adaptation History Banner (if adapted before) */}
              {selectedRoadmap.adaptationHistory && selectedRoadmap.adaptationHistory.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#EEEAF4] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#E5A044]">
                    <History className="w-3.5 h-3.5" />
                    <span>Roadmap Adaptation Log ({selectedRoadmap.adaptationHistory.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {selectedRoadmap.adaptationHistory.slice(-2).map((h, i) => (
                      <div key={i} className="text-xs text-[#777589] flex items-start gap-2">
                        <span className="text-[#7C6EE6] text-[10px] mt-0.5">→</span>
                        <div>
                          <strong className="text-[#28263A]">{h.trigger}:</strong> {h.modificationSummary}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Day Selector Ribbon */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
              {selectedRoadmap.days.map((day) => {
                const isActive = activeDayTab === day.dayNumber;
                return (
                  <button
                    key={day.dayNumber}
                    onClick={() => setActiveDayTab(day.dayNumber)}
                    className={`flex-shrink-0 px-4 py-3 rounded-2xl border text-left transition-all ${
                      isActive
                        ? 'bg-[#EAE5FF] border-[#7C6EE6] text-[#7C6EE6] font-bold shadow-sm'
                        : day.completed
                        ? 'bg-[#CFF5E7]/50 border-[#A9E8D2] text-[#319B78]'
                        : 'bg-white border-[#EEEAF4] text-[#777589] hover:text-[#28263A] hover:border-[#D9D2F8]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold">DAY {day.dayNumber}</span>
                      {day.completed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#319B78]" />
                      ) : (
                        <span className="text-[10px] text-[#777589]">
                          ⏱ {day.studyDurationFormatted}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#777589] truncate max-w-[130px] mt-0.5">
                      {day.summary}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Day Detail Card */}
            {(() => {
              const activeDay = selectedRoadmap.days.find((d) => d.dayNumber === activeDayTab) || selectedRoadmap.days[0];
              if (!activeDay) return null;

              return (
                <div className="p-6 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm space-y-6">
                  {/* Day Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EEEAF4] pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#7C6EE6] bg-[#EAE5FF] px-2.5 py-0.5 rounded-full">
                          DAY {activeDay.dayNumber} OF {selectedRoadmap.days.length}
                        </span>
                        <span className="text-xs text-[#777589]">
                          Date: {activeDay.date} • ⏱ {activeDay.studyDurationFormatted} Planned
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-[#28263A]">{activeDay.summary}</h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#777589]">
                        {activeDay.tasks.filter((t) => t.completed).length} / {activeDay.tasks.length} Completed
                      </span>
                      {activeDay.completed && (
                        <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-[#CFF5E7] text-[#319B78] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Day Complete</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Topics Covered Today */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#28263A] font-mono flex items-center gap-2">
                      <Flame className="w-3.5 h-3.5 text-[#7C6EE6]" />
                      <span>Focus Topics & Priority Assignment</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {activeDay.topics.map((t, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#EEEAF4] hover:border-[#D9D2F8] transition-all space-y-2 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-[#28263A] leading-tight">
                              {t.topicName}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                                t.priority.includes('Very High')
                                  ? 'text-rose-700 bg-[#FFDCE8]'
                                  : t.priority.includes('High')
                                  ? 'text-[#E5A044] bg-[#FFE0D2]'
                                  : 'text-[#319B78] bg-[#CFF5E7]'
                              }`}
                            >
                              {t.priority}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-[#777589]">
                            <span>⏱ {t.durationMinutes} min</span>
                            <span className="text-[#777589]">Difficulty: {t.difficulty || 'Medium'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#28263A] font-mono flex items-center gap-2">
                        <ListTodo className="w-3.5 h-3.5 text-[#7C6EE6]" />
                        <span>Daily Action Tasks</span>
                      </h3>
                      <span className="text-[11px] text-[#777589]">
                        Check off items as you complete them
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {activeDay.tasks.map((task) => {
                        const isDone = task.completed;
                        return (
                          <div
                            key={task.id}
                            className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                              isDone
                                ? 'bg-[#CFF5E7]/25 border-[#A9E8D2] text-[#777589]'
                                : 'bg-white hover:bg-[#FFFDF9] border-[#EEEAF4] hover:border-[#D9D2F8] text-[#28263A] shadow-sm'
                            }`}
                          >
                            <div className="flex items-start gap-3.5 flex-1">
                              <button
                                onClick={() => handleToggleTask(activeDay.dayNumber, task.id, !isDone)}
                                className="mt-0.5 text-[#777589] hover:text-[#7C6EE6] transition-colors focus:outline-none"
                              >
                                {isDone ? (
                                  <CheckCircle2 className="w-5 h-5 text-[#319B78]" />
                                ) : (
                                  <Circle className="w-5 h-5 text-[#777589] hover:text-[#7C6EE6]" />
                                )}
                              </button>

                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`text-xs font-bold ${
                                      isDone ? 'line-through text-[#777589]' : 'text-[#28263A]'
                                    }`}
                                  >
                                    {task.title}
                                  </span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF9F2] border border-[#EEEAF4] text-[#777589]">
                                    ⏱ {task.durationMinutes} min
                                  </span>
                                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#EAE5FF] text-[#7C6EE6]">
                                    {task.type}
                                  </span>
                                </div>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                  {task.description}
                                </p>
                              </div>
                            </div>

                            {/* Direct Action Button */}
                            <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                              <button
                                onClick={() => handleActionNavigate(task.actionType, task.targetTopic)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#141424] hover:bg-red-600/20 border border-zinc-800 hover:border-red-600/50 text-zinc-300 hover:text-white transition-all flex items-center gap-1.5"
                              >
                                {task.actionType === 'learn' && <BookOpen className="w-3.5 h-3.5 text-blue-400" />}
                                {task.actionType === 'questions' && <HelpCircle className="w-3.5 h-3.5 text-amber-400" />}
                                {task.actionType === 'mcq' && <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />}
                                {task.actionType === 'flashcards' && <Layers className="w-3.5 h-3.5 text-purple-400" />}
                                {task.actionType === 'answer-checker' && <Award className="w-3.5 h-3.5 text-rose-400" />}
                                <span>Launch {task.actionType.toUpperCase()}</span>
                                <ArrowRight className="w-3 h-3 text-red-500" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )
      )}

      {/* CREATE ROADMAP MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0b0b14] border border-red-950/70 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-red-400 font-bold">
                  AI Study Architect
                </span>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-red-500" />
                  <span>Build My Study Roadmap</span>
                </h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateRoadmap} className="space-y-5">
              {/* Scope Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                  1. What do you want to prepare for?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'complete_subject', label: 'Complete Subject' },
                    { id: 'selected_units', label: 'Selected Units' },
                    { id: 'selected_topics', label: 'Selected Topics' },
                    { id: 'specific_topic', label: 'Specific Topic' },
                  ].map((scope) => (
                    <button
                      key={scope.id}
                      type="button"
                      onClick={() => setFormTargetScope(scope.id as any)}
                      className={`p-3 rounded-xl text-xs font-bold border transition-all text-center ${
                        formTargetScope === scope.id
                          ? 'bg-red-600/20 border-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                          : 'bg-[#12121e] border-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-800'
                      }`}
                    >
                      {scope.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Dropdown or Custom Topic */}
              {formTargetScope === 'specific_topic' ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300">
                    Topic Name (Concept, Algorithm, Problem, or Subject Topic)
                  </label>
                  <input
                    type="text"
                    value={formCustomTopic}
                    onChange={(e) => setFormCustomTopic(e.target.value)}
                    placeholder="e.g., Binary Search Trees, Matrix Inverse, Newton's Laws"
                    className="w-full bg-[#12121e] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-600"
                    required
                  />
                  <p className="text-[11px] text-zinc-400">
                    📚 Independent mode: Generates a complete learning and exam package without requiring an uploaded syllabus.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300">Choose Syllabus Subject</label>
                  <select
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(e.target.value)}
                    className="w-full bg-[#12121e] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code || 'Core'}) • {s.units.length} Units
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sub-Selection for Units or Topics */}
              {formTargetScope === 'selected_units' && currentSubjectObj && (
                <div className="space-y-2 p-3 rounded-xl bg-[#0e0e18] border border-zinc-900">
                  <span className="text-xs font-bold text-zinc-300 block">Select Units to Include:</span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {currentSubjectObj.units.map((u) => (
                      <label
                        key={u.id}
                        className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formSelectedUnits.includes(u.name)}
                          onChange={() => toggleUnitSelect(u.name)}
                          className="rounded border-zinc-700 text-red-600 focus:ring-0"
                        />
                        <span>{u.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {formTargetScope === 'selected_topics' && currentSubjectObj && (
                <div className="space-y-2 p-3 rounded-xl bg-[#0e0e18] border border-zinc-900">
                  <span className="text-xs font-bold text-zinc-300 block">Select Topics to Include:</span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {currentSubjectObj.units.flatMap((u) => u.topics).map((t) => (
                      <label
                        key={t.id}
                        className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formSelectedTopics.includes(t.name)}
                          onChange={() => toggleTopicSelect(t.name)}
                          className="rounded border-zinc-700 text-red-600 focus:ring-0"
                        />
                        <span>{t.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Exam Date & Daily Budget Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Exam Date */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300">Exam Date</label>
                  <input
                    type="date"
                    value={formExamDate}
                    onChange={(e) => setFormExamDate(e.target.value)}
                    className="w-full bg-[#12121e] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-600 font-mono"
                    required
                  />
                  {/* Preset Chips */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {[
                      { days: 7, label: 'In 7 Days' },
                      { days: 14, label: 'In 14 Days' },
                      { days: 30, label: 'In 1 Month' },
                    ].map((chip) => (
                      <button
                        key={chip.days}
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + chip.days);
                          setFormExamDate(d.toISOString().split('T')[0]);
                        }}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Available Study Time */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300">Available Study Time</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { min: 60, label: '1 hr/day' },
                      { min: 120, label: '2 hrs/day' },
                      { min: 180, label: '3 hrs/day' },
                    ].map((time) => (
                      <button
                        key={time.min}
                        type="button"
                        onClick={() => setFormDailyStudyMinutes(time.min)}
                        className={`p-2 rounded-xl text-xs font-bold border text-center transition-all ${
                          formDailyStudyMinutes === time.min
                            ? 'bg-red-600/20 border-red-600 text-white'
                            : 'bg-[#12121e] border-zinc-900 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {time.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Student Level & Preferred Language */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Level */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300">Current Level</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setFormCurrentLevel(lvl as any)}
                        className={`p-2 rounded-xl text-xs font-bold border text-center transition-all ${
                          formCurrentLevel === lvl
                            ? 'bg-red-600/20 border-red-600 text-white'
                            : 'bg-[#12121e] border-zinc-900 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300">Preferred Language</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['English', 'Hindi', 'Hinglish'].map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setFormPreferredLanguage(lang as any)}
                        className={`p-2 rounded-xl text-xs font-bold border text-center transition-all ${
                          formPreferredLanguage === lang
                            ? 'bg-red-600/20 border-red-600 text-white'
                            : 'bg-[#12121e] border-zinc-900 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="btn-red-glow px-6 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Architecting Schedule...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate AI Study Roadmap →</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADAPTATION SIMULATION MODAL */}
      {showAdaptModal && selectedRoadmap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-[#0b0b14] border border-amber-950/70 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                  Autonomous Rebalancer
                </span>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-500" />
                  <span>Adapt Roadmap to Performance</span>
                </h2>
              </div>
              <button
                onClick={() => setShowAdaptModal(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              When a student scores poorly on a topic (e.g. 40%), StudyAI autonomously inserts remediation drills (10 questions, numericals, mini-quizzes). When scoring high (&gt;80%), StudyAI accelerates the schedule.
            </p>

            <form onSubmit={handleAdaptRoadmap} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Target Topic Tested</label>
                <input
                  type="text"
                  value={adaptTopicName}
                  onChange={(e) => setAdaptTopicName(e.target.value)}
                  placeholder="e.g. Matrix Inverse, Binary Search, Deadlocks"
                  className="w-full bg-[#12121e] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-600"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label className="font-bold text-zinc-300">Test Score Achieved</label>
                  <span
                    className={`font-mono font-bold ${
                      adaptScorePercent < 65 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {adaptScorePercent}% ({adaptScorePercent < 65 ? 'Weakness Detected' : 'Mastery Demonstrated'})
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={adaptScorePercent}
                  onChange={(e) => setAdaptScorePercent(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Assessment Type</label>
                <select
                  value={adaptAssessmentType}
                  onChange={(e) => setAdaptAssessmentType(e.target.value)}
                  className="w-full bg-[#12121e] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-600"
                >
                  <option value="MCQ Quiz">MCQ Quiz</option>
                  <option value="AI Professor Rubric">Answer Checker Rubric</option>
                  <option value="Mock Test Exam">University Mock Test</option>
                  <option value="Voice Viva Oral Exam">Voice Viva Oral Exam</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Specific Gap Notes</label>
                <input
                  type="text"
                  value={adaptWeakPoints}
                  onChange={(e) => setAdaptWeakPoints(e.target.value)}
                  placeholder="e.g. Inversion formula, boundary overflow"
                  className="w-full bg-[#12121e] border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowAdaptModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdapting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-black flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                >
                  {isAdapting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Rebalancing Roadmap...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Execute Adaptation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
