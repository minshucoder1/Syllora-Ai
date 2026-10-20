import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileClock,
  Upload,
  Sparkles,
  Flame,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  HelpCircle,
  BookOpen,
} from 'lucide-react';

export const PreviousPapersView: React.FC = () => {
  const { activeSubject, subjects, setActiveTab, showToast, triggerConfetti } = useApp();
  const currentSubject = activeSubject || subjects[0];

  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    type: string;
    base64: string;
  } | null>(null);

  const [paperText, setPaperText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!currentSubject) {
      showToast('Please select or add a subject first.', 'error');
      return;
    }

    if (!uploadedFile && !paperText.trim()) {
      showToast('Please upload a paper or paste question paper text.', 'error');
      return;
    }

    setAnalyzing(true);
    try {
      const res = await fetch('/api/ai/analyze-previous-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: currentSubject.id,
          subjectName: currentSubject.name,
          paperText,
          fileData: uploadedFile
            ? {
                base64: uploadedFile.base64,
                mimeType: uploadedFile.type,
                fileName: uploadedFile.name,
              }
            : undefined,
          fileName: uploadedFile?.name || 'Previous_Year_Paper.pdf',
        }),
      });

      if (!res.ok) {
        showToast('Unable to analyze previous paper right now.', 'error');
        return;
      }

      const data = await res.json();
      setAnalysis(data.analysis);
      showToast('Question paper analyzed successfully!', 'success');
      triggerConfetti();
    } catch (err) {
      console.error(err);
      showToast('Analysis failed. Please retry.', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel-heavy border border-red-950/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-red-400">
            <FileClock className="w-4 h-4 text-red-500" />
            <span>EXAM INTELLIGENCE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Previous-Year Question Paper Analyzer
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Analyze historical question frequency, repeated units, and mark distributions for{' '}
            <span className="text-white font-semibold">{currentSubject?.name || 'Your Subject'}</span>.
          </p>
        </div>

        {analysis && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                showToast('Analysis saved to your subject dossier! 📁', 'success');
                triggerConfetti();
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#12121c] hover:bg-zinc-800 border border-zinc-800 text-zinc-200 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Save Analysis</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#12121c] hover:bg-zinc-800 border border-zinc-800 text-zinc-200 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-zinc-400" />
              <span>Download PDF / Print</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('important-questions');
                showToast('Navigating to Topic Question Engine with paper context!', 'info');
              }}
              className="btn-red-glow px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Questions From Analysis</span>
            </button>
          </div>
        )}
      </div>

      {/* Upload & Input Area */}
      {!analysis && (
        <div className="glass-panel-heavy rounded-2xl p-6 sm:p-8 border border-red-950/40 space-y-6">
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
              className="border-2 border-dashed border-red-900/40 hover:border-red-500/60 rounded-2xl p-8 text-center cursor-pointer transition-all bg-[#0a0a12]/50 hover:bg-[#0f0f1c]/70 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-950/40 group-hover:bg-red-900/50 border border-red-800/40 flex items-center justify-center mx-auto mb-3 transition-transform group-hover:scale-105">
                <Upload className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                Upload Question Paper (PDF, DOCX, JPG, PNG)
              </h3>
              <p className="text-xs text-zinc-400 mb-3">
                Upload university question papers from past semesters.
              </p>
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-zinc-200 border border-zinc-800"
              >
                Browse Paper File
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#0f0f18] border border-red-900/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-950/60 flex items-center justify-center text-red-400">
                  <FileClock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{uploadedFile.name}</div>
                  <div className="text-xs text-zinc-400 font-mono">
                    {(uploadedFile.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
              <button
                onClick={() => setUploadedFile(null)}
                className="text-xs text-zinc-400 hover:text-red-400"
              >
                Change File
              </button>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400">
              Or paste questions / paper transcription:
            </label>
            <textarea
              value={paperText}
              onChange={(e) => setPaperText(e.target.value)}
              placeholder="Section A: Q1. Explain asymptotic notations. Q2. What is stack overflow?..."
              rows={4}
              className="w-full bg-[#0a0a12] border border-red-950/60 rounded-xl p-3 text-xs text-zinc-200 font-mono focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="btn-red-glow flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white uppercase tracking-wider"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing Historical Trends...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Previous Papers</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6 animate-fade-in">
          {/* Unit-Wise Weightage Bar Cards */}
          <div className="glass-panel-heavy rounded-2xl p-6 border border-red-950/40 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-red-500" />
                <span>UNIT-WISE EXAM WEIGHTAGE</span>
              </h2>
              <span className="text-xs text-zinc-400 font-mono">Normalized from paper data</span>
            </div>

            <div className="space-y-3">
              {(analysis.unitWeightages || []).map((uw: any, i: number) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-200 flex items-center gap-2">
                      <span>{uw.unitName}</span>
                      {uw.isHot && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-red-950 text-red-400 border border-red-800">
                          🔥 HOT UNIT
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-zinc-300 font-bold">{uw.percentage}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        uw.isHot
                          ? 'bg-gradient-to-r from-red-600 via-rose-500 to-red-400 shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                          : 'bg-zinc-700'
                      }`}
                      style={{ width: `${uw.percentage * 2.5}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Frequently Asked Questions & Frequently Asked Topics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* FAQs */}
            <div className="p-6 rounded-2xl bg-[#090910] border border-red-950/40 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono uppercase text-red-400">
                <HelpCircle className="w-4 h-4 text-red-500" />
                <span>Frequently Asked Questions</span>
              </h3>
              <div className="space-y-2.5">
                {(analysis.frequentlyAskedQuestions || []).map((faq: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#0f0f18] border border-red-950/50 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-red-400 font-bold">{faq.marks} Marks</span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        Frequency: {faq.frequency}x in exams
                      </span>
                    </div>
                    <p className="text-xs text-zinc-200 font-medium">{faq.question}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Frequently Asked Topics */}
            <div className="p-6 rounded-2xl bg-[#090910] border border-red-950/40 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono uppercase text-red-400">
                <Flame className="w-4 h-4 text-red-500" />
                <span>Frequently Tested Topics</span>
              </h3>
              <div className="space-y-2.5">
                {(analysis.frequentlyAskedTopics || []).map((fat: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#0f0f18] border border-red-950/50 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{fat.topic}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-red-950 text-red-400 border border-red-800">
                        {fat.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">{fat.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section Question Patterns & Key Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#090910] border border-red-950/40 space-y-3">
              <h3 className="text-sm font-bold text-white font-mono uppercase text-zinc-300">
                Question Pattern Breakdown
              </h3>
              <div className="space-y-2">
                {(analysis.questionPatterns || []).map((qp: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#0f0f18] border border-zinc-900 flex justify-between items-center text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{qp.section}</div>
                      <div className="text-[11px] text-zinc-400">{qp.pattern}</div>
                    </div>
                    <span className="font-mono text-red-400 font-bold">{qp.marks} M</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#090910] border border-red-950/40 space-y-3">
              <h3 className="text-sm font-bold text-white font-mono uppercase text-zinc-300">
                Examiner's Pattern Recommendations
              </h3>
              <ul className="space-y-2 text-xs text-zinc-300">
                {(analysis.keyRecommendations || []).map((rec: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">👉</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Most Tested Units Overview */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-red-950/30 via-[#0d0912] to-black border border-red-800/40 space-y-3">
            <h3 className="text-sm font-bold text-white font-mono uppercase text-red-400 flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-500" />
              <span>Most Tested Units (High Exam Yield)</span>
            </h3>
            <p className="text-xs text-zinc-300">
              Exam data indicates that {((analysis.unitWeightages || []).filter((u: any) => u.isHot || u.percentage >= 20).map((u: any) => u.unitName).join(', ')) || 'Units 2 and 4'} account for the largest proportion of total marks. Master these units first before advancing to lower-weightage modules.
            </p>
          </div>

          <div className="flex justify-between items-center pt-4 flex-wrap gap-3">
            <button
              onClick={() => setAnalysis(null)}
              className="text-xs text-zinc-400 hover:text-white"
            >
              ← Analyze Another Paper
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setActiveTab('important-questions');
                  showToast('Generating questions based on analyzed frequency!', 'success');
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#141424] hover:bg-zinc-800 border border-zinc-800 text-zinc-200"
              >
                Generate Questions From Analysis 📝
              </button>
              <button
                onClick={() => setActiveTab('exam-prediction')}
                className="btn-red-glow px-6 py-2.5 rounded-xl text-xs font-bold text-white"
              >
                Generate Exam Prediction from Analysis →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
