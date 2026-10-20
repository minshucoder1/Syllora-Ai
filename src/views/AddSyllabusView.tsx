import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { apiFetch } from '../utils/api';
import {
  Upload,
  FileText,
  Sparkles,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Flame,
  Star,
  Clock,
  BookOpen,
  ArrowRight,
  Layers,
  Settings,
  ShieldAlert,
} from 'lucide-react';

export const AddSyllabusView: React.FC = () => {
  const { refreshSubjects, setActiveSubject, setActiveTab, showToast, triggerConfetti } = useApp();

  const [inputMode, setInputMode] = useState<'text' | 'file'>('file');
  const [syllabusText, setSyllabusText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    type: string;
    base64: string;
  } | null>(null);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTryingBackup, setIsTryingBackup] = useState(false);
  const [savedSubjectId, setSavedSubjectId] = useState<string | null>(null);
  const [analysisStage, setAnalysisStage] = useState<string>('');
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<{
    title: string;
    subtext: string;
    category?: string;
  } | null>(null);

  // Detected syllabus structure for user review
  const [detectedSyllabus, setDetectedSyllabus] = useState<{
    subjectName: string;
    subjectCode?: string;
    description: string;
    units: {
      name: string;
      weightage: number;
      topics: {
        name: string;
        description: string;
        priority: 'very_important' | 'important' | 'moderate' | 'low';
        priorityReason: string;
      }[];
    }[];
    _meta?: any;
  } | null>(null);

  // Generation Settings State
  const [selectedGenerators, setSelectedGenerators] = useState<string[]>([
    'Detailed Notes',
    'Important Questions',
    'MCQs',
    'Flashcards',
    'Mind Map',
    'Study Plan',
    'Exam Prediction',
  ]);

  const [examSettings, setExamSettings] = useState({
    examType: 'University Exam',
    difficulty: 'Medium',
    language: 'English',
    notesLength: 'Detailed',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      showToast('File size exceeds 25MB limit.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      setUploadedFile({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        base64,
      });
      setAnalysisError(null);
    };
    reader.readAsDataURL(file);
  };

  // Perform AI Analysis with Stage progression & Fallback UX
  const handleAnalyzeSyllabus = async () => {
    if (isAnalyzing) return; // Prevent duplicate requests

    if (inputMode === 'text' && !syllabusText.trim()) {
      showToast('Please paste or type your syllabus text.', 'error');
      return;
    }

    if (inputMode === 'file' && !uploadedFile) {
      showToast('Please select or drop a syllabus file first.', 'error');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setFallbackNotice(null);

    // Dynamic progression states
    setAnalysisStage('Reading syllabus and extracting content...');
    const stageTimer1 = setTimeout(() => {
      setAnalysisStage('Identifying subject and course structure...');
    }, 1800);
    const stageTimer2 = setTimeout(() => {
      setAnalysisStage('Extracting units, topics, and priority ratings...');
    }, 4000);
    const stageTimer3 = setTimeout(() => {
      setAnalysisStage('Analyzing university exam patterns and structuring JSON...');
    }, 8500);

    try {
      const payload: any = {};
      if (inputMode === 'text') {
        payload.syllabusText = syllabusText;
      } else if (uploadedFile) {
        payload.fileData = {
          base64: uploadedFile.base64,
          mimeType: uploadedFile.type,
          fileName: uploadedFile.name,
        };
      }

      const res = await apiFetch('/api/ai/analyze-syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);

      const data = await res.json();
      if (data.subjectId) {
        setSavedSubjectId(data.subjectId);
      }

      if (!res.ok) {
        if (res.status === 503 || data.category === 'UNAVAILABLE') {
          setAnalysisError({
            title: 'AI is temporarily busy.',
            subtext:
              data.subtext ||
              'The AI model is currently experiencing high demand. Your uploaded syllabus is safe. Click Try Again to retry with our automated backup model.',
            category: 'UNAVAILABLE',
          });
        } else if (res.status === 429) {
          setAnalysisError({
            title: 'Rate limit encountered.',
            subtext: 'The AI provider is throttling requests. Please wait a moment and try again.',
            category: 'RATE_LIMIT',
          });
        } else if (data.category === 'EXTRACTION_ERROR') {
          setAnalysisError({
            title: 'Document Unreadable',
            subtext: data.error || "We couldn't extract text from this document. Please upload a readable DOCX or PDF.",
            category: 'EXTRACTION_ERROR',
          });
        } else {
          setAnalysisError({
            title: 'Unable to analyze syllabus.',
            subtext: data.error || 'The syllabus analysis service encountered an error. Please try again.',
            category: 'ERROR',
          });
        }
        setIsAnalyzing(false);
        return;
      }

      // Success
      if (data.result) {
        if (data.result._meta?.switchedToFallback) {
          setFallbackNotice(`Processed via backup AI model (${data.result._meta.usedModel})`);
        }
        setDetectedSyllabus(data.result);
        await refreshSubjects();
        showToast('Syllabus analyzed successfully! Review your curriculum below.', 'success');
        triggerConfetti();
      }
    } catch (err: any) {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      setAnalysisError({
        title: 'Network or server connection issue.',
        subtext: 'Could not reach the StudyAI backend. Please check your connection and try again.',
        category: 'NETWORK',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Real Backup AI Execution (Requirements 5: "Fix the Try Again With Backup AI Button")
  const handleTryBackup = async () => {
    if (isAnalyzing || isTryingBackup) return;

    setIsTryingBackup(true);
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisStage('Connecting to backup AI model and analyzing preserved syllabus...');

    try {
      const payload: any = {
        preferBackup: true,
        subjectId: savedSubjectId || undefined,
      };

      if (inputMode === 'text' && syllabusText.trim()) {
        payload.syllabusText = syllabusText;
      } else if (uploadedFile) {
        payload.fileData = {
          base64: uploadedFile.base64,
          mimeType: uploadedFile.type,
          fileName: uploadedFile.name,
        };
      }

      const res = await apiFetch('/api/ai/analyze-syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.subjectId) {
        setSavedSubjectId(data.subjectId);
      }

      if (!res.ok) {
        setAnalysisError({
          title: data.category === 'UNAVAILABLE' ? 'Backup AI temporarily busy.' : 'Backup analysis error.',
          subtext: data.subtext || data.error || 'The backup model also encountered high demand. Your syllabus remains safely saved.',
          category: data.category || 'ERROR',
        });
        return;
      }

      if (data.result) {
        setFallbackNotice(`Successfully analyzed with backup model (${data.result._meta?.usedModel || 'Backup AI'})`);
        setDetectedSyllabus(data.result);
        await refreshSubjects();
        showToast('Syllabus analyzed successfully with Backup AI!', 'success');
        triggerConfetti();
      }
    } catch (err: any) {
      setAnalysisError({
        title: 'Network timeout / error',
        subtext: 'Could not connect to backup AI. Your uploaded syllabus is saved; please retry.',
        category: 'NETWORK',
      });
    } finally {
      setIsTryingBackup(false);
      setIsAnalyzing(false);
    }
  };

  // Modify detected syllabus in review mode
  const handleUpdateSubjectName = (name: string) => {
    if (!detectedSyllabus) return;
    setDetectedSyllabus({ ...detectedSyllabus, subjectName: name });
  };

  const handleAddUnit = () => {
    if (!detectedSyllabus) return;
    const newUnit = {
      name: `Unit ${detectedSyllabus.units.length + 1}: New Unit`,
      weightage: 20,
      topics: [
        {
          name: 'Core Topic 1',
          description: 'Key syllabus concept',
          priority: 'important' as const,
          priorityReason: 'Added during syllabus review',
        },
      ],
    };
    setDetectedSyllabus({
      ...detectedSyllabus,
      units: [...detectedSyllabus.units, newUnit],
    });
  };

  const handleDeleteUnit = (index: number) => {
    if (!detectedSyllabus) return;
    const updated = detectedSyllabus.units.filter((_, i) => i !== index);
    setDetectedSyllabus({ ...detectedSyllabus, units: updated });
  };

  const handleAddTopic = (unitIndex: number) => {
    if (!detectedSyllabus) return;
    const units = [...detectedSyllabus.units];
    units[unitIndex].topics.push({
      name: 'New Topic',
      description: 'Concept detail',
      priority: 'important',
      priorityReason: 'User added topic',
    });
    setDetectedSyllabus({ ...detectedSyllabus, units });
  };

  const handleDeleteTopic = (unitIndex: number, topicIndex: number) => {
    if (!detectedSyllabus) return;
    const units = [...detectedSyllabus.units];
    units[unitIndex].topics = units[unitIndex].topics.filter((_, i) => i !== topicIndex);
    setDetectedSyllabus({ ...detectedSyllabus, units });
  };

  const handleTogglePriority = (unitIndex: number, topicIndex: number) => {
    if (!detectedSyllabus) return;
    const units = [...detectedSyllabus.units];
    const priorities: Array<'very_important' | 'important' | 'moderate' | 'low'> = [
      'very_important',
      'important',
      'moderate',
      'low',
    ];
    const current = units[unitIndex].topics[topicIndex].priority;
    const nextIdx = (priorities.indexOf(current) + 1) % priorities.length;
    units[unitIndex].topics[topicIndex].priority = priorities[nextIdx];
    setDetectedSyllabus({ ...detectedSyllabus, units });
  };

  // Confirm and Save into DB
  const handleConfirmAndSave = async () => {
    if (!detectedSyllabus) return;

    try {
      const res = await apiFetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: detectedSyllabus.subjectName,
          code: detectedSyllabus.subjectCode || '',
          description: detectedSyllabus.description,
          units: detectedSyllabus.units,
          rawSyllabusText: inputMode === 'text' ? syllabusText : uploadedFile?.name,
        }),
      });

      if (!res.ok) {
        showToast('Unable to save subject to database.', 'error');
        return;
      }

      const data = await res.json();
      await refreshSubjects();
      setActiveSubject(data.subject);
      showToast(`Subject "${data.subject.name}" confirmed and added!`, 'success');
      triggerConfetti();
      setActiveTab('subject-detail');
    } catch (err) {
      console.error('Save subject error', err);
      showToast('Error saving confirmed syllabus.', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EAE5FF] border border-[#D9D2F8] text-[#7C6EE6] text-xs font-semibold tracking-wide shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#7C6EE6]" />
          <span>Curriculum Analyzer & Multi-Model Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#28263A]">
          What do you want to <span className="text-[#7C6EE6]">study?</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#777589] max-w-xl mx-auto">
          Enter your topic, paste a syllabus, or upload your course document. Syllora AI
          extracts the exact curriculum, marks weightage, and organizes topic checklists.
        </p>
      </div>

      {!detectedSyllabus ? (
        /* STEP 1: Upload / Enter Syllabus */
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm space-y-6 relative overflow-hidden">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center justify-center p-1 bg-[#FFF9F2] rounded-2xl border border-[#EEEAF4] max-w-md mx-auto">
            <button
              onClick={() => {
                setInputMode('file');
                setAnalysisError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold transition-all ${
                inputMode === 'file'
                  ? 'bg-white text-[#7C6EE6] shadow-sm font-bold'
                  : 'text-[#777589] hover:text-[#28263A]'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Syllabus File</span>
            </button>
            <button
              onClick={() => {
                setInputMode('text');
                setAnalysisError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold transition-all ${
                inputMode === 'text'
                  ? 'bg-white text-[#7C6EE6] shadow-sm font-bold'
                  : 'text-[#777589] hover:text-[#28263A]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Enter Text / Topic</span>
            </button>
          </div>

          {/* Option B: Upload File */}
          {inputMode === 'file' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,image/png,image/jpeg"
                onChange={handleFileChange}
                className="hidden"
              />

              {!uploadedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#D9D2F8] hover:border-[#7C6EE6] rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all bg-[#FFFDF9] hover:bg-[#EAE5FF]/20 group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-[#EAE5FF] group-hover:bg-[#ded7ff] flex items-center justify-center mx-auto mb-4 transition-all group-hover:scale-105 shadow-sm text-[#7C6EE6]">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-[#28263A] mb-1">
                    Drag & drop your syllabus document here
                  </h3>
                  <p className="text-xs text-[#777589] mb-4">
                    Supports <span className="text-[#7C6EE6] font-semibold">PDF, DOCX, TXT, PNG, JPG</span> (up to 25MB)
                  </p>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-[#FFF9F2] text-[#28263A] border border-[#EEEAF4] transition-colors shadow-sm"
                  >
                    Browse Local File
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#EEEAF4] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EAE5FF] flex items-center justify-center text-[#7C6EE6]">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{uploadedFile.name}</div>
                      <div className="text-xs text-zinc-400 font-mono">
                        {(uploadedFile.size / 1024).toFixed(1)} KB • {uploadedFile.name.split('.').pop()?.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setUploadedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    disabled={isAnalyzing}
                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Option A: Enter Syllabus Text */}
          {inputMode === 'text' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-zinc-300">
                Paste syllabus modules, chapters, or topic list:
              </label>
              <textarea
                value={syllabusText}
                onChange={(e) => setSyllabusText(e.target.value)}
                placeholder={`Example:
Basic Mathematics / Data Structures

Unit 1:
Matrices and Determinants
Rank of a matrix, Cayley Hamilton Theorem
Linear equations solution

Unit 2:
Differential Calculus
Successive differentiation, Leibnitz theorem
Partial derivatives and Euler theorem`}
                rows={9}
                className="w-full px-4 py-3 rounded-xl bg-[#0a0a12] border border-red-950/60 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-zinc-200 placeholder-zinc-600 text-xs font-mono transition-all resize-y"
              />
            </div>
          )}

          {/* Error Message Card with Clean Redesign & Retries */}
          {analysisError && (
            <div className="p-4 rounded-xl bg-red-950/30 border border-red-600/40 space-y-3 animate-fade-in">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-red-200">{analysisError.title}</h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">{analysisError.subtext}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleTryBackup}
                  disabled={isAnalyzing || isTryingBackup}
                  className="btn-red-glow flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTryingBackup ? 'animate-spin' : ''}`} />
                  <span>{isTryingBackup ? 'Trying backup model...' : 'Try Again With Backup AI'}</span>
                </button>
                <button
                  onClick={() => {
                    setInputMode(inputMode === 'file' ? 'text' : 'file');
                    setAnalysisError(null);
                  }}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 transition-colors"
                >
                  Choose Another Method
                </button>
              </div>
            </div>
          )}

          {/* Analysis Active Non-Blocking Progress */}
          {isAnalyzing && (
            <div className="p-5 rounded-xl bg-[#090912] border border-red-900/50 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-red-400 font-semibold">
                  <RefreshCw className="w-4 h-4 animate-spin text-red-500" />
                  <span>{analysisStage || 'Analyzing your syllabus...'}</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">Dual-Model Cascade Active</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-red-400 animate-[pulse_1.5s_infinite] w-3/4 rounded-full" />
              </div>
              <p className="text-[11px] text-zinc-400">
                StudyAI is reading your document and mapping out units, topics, and priority weightages.
                If primary AI is busy, we automatically switch to our fast backup model.
              </p>
            </div>
          )}

          {/* Action Trigger */}
          <div className="pt-2 flex items-center justify-end">
            <button
              onClick={handleAnalyzeSyllabus}
              disabled={isAnalyzing}
              className={`btn-red-glow flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white tracking-wide uppercase transition-all ${
                isAnalyzing ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing Syllabus with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Analyze Syllabus with AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* STEP 2: Syllabus Detected Review & Generation Settings */
        <div className="space-y-6 animate-fade-in">
          {fallbackNotice && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-950/40 border border-emerald-600/40 text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{fallbackNotice}</span>
            </div>
          )}

          {/* Subject Overview Card */}
          <div className="glass-panel-heavy rounded-2xl p-6 border border-red-950/40 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-red-500 uppercase tracking-wider font-mono">
                <BookOpen className="w-4 h-4" />
                <span>Syllabus Detected</span>
              </div>
              <button
                onClick={() => setDetectedSyllabus(null)}
                className="text-xs text-zinc-400 hover:text-white transition-colors"
              >
                ← Back to Upload
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-zinc-400">Subject Name:</label>
              <input
                type="text"
                value={detectedSyllabus.subjectName}
                onChange={(e) => handleUpdateSubjectName(e.target.value)}
                className="w-full text-xl font-bold text-white bg-[#0c0c14] border border-red-950 px-3 py-2 rounded-xl focus:border-red-500 focus:outline-none"
              />
              <p className="text-xs text-zinc-400">{detectedSyllabus.description}</p>
            </div>
          </div>

          {/* Units and Topics Interactive Review */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Units & Modules ({detectedSyllabus.units.length})</span>
                <span className="text-xs font-normal text-zinc-400">
                  (Click any priority pill to cycle priority: 🔥 Very Important, ⭐ Important, 🟡 Moderate, ⚪ Low)
                </span>
              </h3>
              <button
                onClick={handleAddUnit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200"
              >
                <Plus className="w-3.5 h-3.5 text-red-500" /> Add Unit
              </button>
            </div>

            <div className="space-y-4">
              {detectedSyllabus.units.map((unit, uIdx) => (
                <div
                  key={uIdx}
                  className="rounded-2xl p-5 bg-[#0a0a12] border border-red-950/40 space-y-4 hover:border-red-600/30 transition-all"
                >
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-red-950 text-red-400 font-mono text-xs flex items-center justify-center font-bold">
                        {uIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={unit.name}
                        onChange={(e) => {
                          const updated = [...detectedSyllabus.units];
                          updated[uIdx].name = e.target.value;
                          setDetectedSyllabus({ ...detectedSyllabus, units: updated });
                        }}
                        className="font-bold text-sm text-zinc-100 bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-red-500 focus:outline-none px-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400 font-mono">
                        Weightage: {unit.weightage}%
                      </span>
                      <button
                        onClick={() => handleDeleteUnit(uIdx)}
                        className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                        title="Delete Unit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Topics List */}
                  <div className="space-y-2">
                    {unit.topics.map((topic, tIdx) => (
                      <div
                        key={tIdx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#0f0f18] border border-zinc-900 hover:border-zinc-800 group"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-xs text-zinc-500 font-mono">
                            {uIdx + 1}.{tIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={topic.name}
                            onChange={(e) => {
                              const updated = [...detectedSyllabus.units];
                              updated[uIdx].topics[tIdx].name = e.target.value;
                              setDetectedSyllabus({ ...detectedSyllabus, units: updated });
                            }}
                            className="text-xs text-zinc-200 bg-transparent focus:outline-none flex-1 font-medium"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Priority Toggle Pill */}
                          <button
                            onClick={() => handleTogglePriority(uIdx, tIdx)}
                            title={`Rationale: ${topic.priorityReason}`}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                              topic.priority === 'very_important'
                                ? 'bg-red-950 text-red-400 border border-red-700'
                                : topic.priority === 'important'
                                ? 'bg-amber-950 text-amber-300 border border-amber-700'
                                : topic.priority === 'moderate'
                                ? 'bg-yellow-950 text-yellow-300 border border-yellow-800'
                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                            }`}
                          >
                            {topic.priority === 'very_important' && '🔥 Very Important'}
                            {topic.priority === 'important' && '⭐ Important'}
                            {topic.priority === 'moderate' && '🟡 Moderate'}
                            {topic.priority === 'low' && '⚪ Low Priority'}
                          </button>

                          <button
                            onClick={() => handleDeleteTopic(uIdx, tIdx)}
                            className="p-1 text-zinc-600 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleAddTopic(uIdx)}
                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 pt-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Topic to Unit {uIdx + 1}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Generation Settings Checklist */}
          <div className="glass-panel-heavy rounded-2xl p-6 border border-red-950/40 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-500" />
              <span>Select Study Material to Generate</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                'Detailed Notes',
                'Quick Revision Notes',
                'Important Questions (2M/5M/10M)',
                'MCQs Quiz',
                'Numerical Questions',
                'Flashcards',
                'Mind Map',
                'Study Plan',
                'Mock Test',
                'Viva Preparation',
                'Exam Prediction',
                'Last-Minute Revision Pack',
              ].map((item) => {
                const checked = selectedGenerators.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      if (checked) {
                        setSelectedGenerators(selectedGenerators.filter((g) => g !== item));
                      } else {
                        setSelectedGenerators([...selectedGenerators, item]);
                      }
                    }}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-medium text-left border transition-all ${
                      checked
                        ? 'bg-red-950/40 border-red-600/50 text-white shadow-[0_0_10px_rgba(220,38,38,0.15)]'
                        : 'bg-[#0b0b12] border-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        checked ? 'bg-red-600 border-red-500 text-white' : 'border-zinc-700'
                      }`}
                    >
                      {checked && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <span className="truncate">{item}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exam Configuration */}
          <div className="glass-panel-heavy rounded-2xl p-6 border border-red-950/40 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-red-500" />
              <span>Exam Preferences</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Target Exam Type:</label>
                <select
                  value={examSettings.examType}
                  onChange={(e) => setExamSettings({ ...examSettings, examType: e.target.value })}
                  className="w-full bg-[#0a0a12] border border-red-950/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  <option>University Exam</option>
                  <option>Semester Exam</option>
                  <option>Internal / Midterm Exam</option>
                  <option>Competitive Exam</option>
                  <option>General Learning</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Difficulty Level:</label>
                <select
                  value={examSettings.difficulty}
                  onChange={(e) => setExamSettings({ ...examSettings, difficulty: e.target.value })}
                  className="w-full bg-[#0a0a12] border border-red-950/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                  <option>Mixed (Exam Standard)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Preferred Language:</label>
                <select
                  value={examSettings.language}
                  onChange={(e) => setExamSettings({ ...examSettings, language: e.target.value })}
                  className="w-full bg-[#0a0a12] border border-red-950/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Hinglish (Hindi + English)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Notes Depth:</label>
                <select
                  value={examSettings.notesLength}
                  onChange={(e) => setExamSettings({ ...examSettings, notesLength: e.target.value })}
                  className="w-full bg-[#0a0a12] border border-red-950/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  <option>Detailed</option>
                  <option>Medium</option>
                  <option>Short Revision</option>
                </select>
              </div>
            </div>
          </div>

          {/* Confirm & Continue CTA */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setDetectedSyllabus(null)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAndSave}
              className="btn-red-glow flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white uppercase tracking-wider"
            >
              <span>Confirm Syllabus & Generate Study Material</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
