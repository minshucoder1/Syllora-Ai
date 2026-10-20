import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Target,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Flame,
  CheckCircle2,
  FileText,
  Printer,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const ExamPredictionView: React.FC = () => {
  const { activeSubject, subjects, setActiveTab, showToast, triggerConfetti } = useApp();
  const currentSubject = activeSubject || subjects[0];

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);

  const handleGeneratePrediction = async () => {
    if (!currentSubject) {
      showToast('Please add a subject first.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/ai/predict-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: currentSubject.id,
          subjectName: currentSubject.name,
          syllabusUnits: currentSubject.units,
        }),
      });

      if (!res.ok) {
        showToast('Unable to generate prediction.', 'error');
        return;
      }

      const data = await res.json();
      setPrediction(data.prediction);
      showToast('AI Exam Prediction generated successfully!', 'success');
      triggerConfetti();
    } catch (err) {
      console.error(err);
      showToast('Error generating exam prediction.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel-heavy border border-red-950/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-red-400">
            <Target className="w-4 h-4 text-red-500" />
            <span>AI FORECAST ENGINE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">AI Exam Prediction</h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Synthesizing syllabus frequency, previous-year question density, and module weightage for{' '}
            <span className="text-white font-semibold">{currentSubject?.name || 'Your Subject'}</span>.
          </p>
        </div>

        <button
          onClick={handleGeneratePrediction}
          disabled={loading}
          className="btn-red-glow flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white uppercase tracking-wider"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{prediction ? 'Regenerate Forecast' : 'Run AI Prediction'}</span>
        </button>
      </div>

      {/* Mandatory Academic Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-red-950/25 border border-red-900/40 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-red-300 uppercase tracking-wide font-mono">
            Important Prediction Disclaimer
          </h4>
          <p className="text-xs text-zinc-300 leading-relaxed">
            AI predictions are based on available study data, syllabus structure, and historical trends and
            are <span className="font-semibold text-white underline">not guaranteed exam questions</span>.
            Students should study the complete syllabus with focus on high-probability concepts.
          </p>
        </div>
      </div>

      {loading && (
        <div className="glass-panel-heavy rounded-2xl p-12 text-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin text-red-500 mx-auto" />
          <h3 className="text-base font-bold text-white">Synthesizing Examination Forecast...</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Analyzing topic co-occurrences, marks weightage, and standard university question formats.
          </p>
        </div>
      )}

      {prediction && !loading && (
        <div className="space-y-6 animate-fade-in">
          {/* High Priority Predicted Topics */}
          <div className="glass-panel-heavy rounded-2xl p-6 border border-red-950/40 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" />
              <span>HIGH-PRIORITY PREDICTED TOPICS (STUDY FIRST)</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(prediction.highPriorityTopics || []).map((pt: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#0a0a14] border border-red-950/50 card-hover-glow space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{pt.topic}</span>
                    <span className="text-xs font-mono font-bold text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800">
                      {pt.probability}% Likelihood
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{pt.rationale}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Likely Question Types & Expected Marks */}
          <div className="glass-panel-heavy rounded-2xl p-6 border border-red-950/40 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-red-500" />
              <span>LIKELY QUESTION TYPES IN UPCOMING EXAM</span>
            </h2>

            <div className="space-y-3">
              {(prediction.likelyQuestionTypes || []).map((lq: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#0a0a14] border border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-mono text-red-400 font-semibold">{lq.topic}</div>
                    <p className="text-sm text-zinc-200 font-medium">{lq.question}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-mono font-bold text-white bg-zinc-800 px-2.5 py-1 rounded">
                      {lq.expectedMarks} Marks
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 bg-red-950/60 px-2 py-1 rounded border border-red-900">
                      Confidence: {lq.confidence}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Concepts & Revision Strategy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#090910] border border-red-950/40 space-y-3">
              <h3 className="text-sm font-bold text-white font-mono uppercase text-red-400">
                Critical Concepts to Master
              </h3>
              <ul className="space-y-2 text-xs text-zinc-300">
                {(prediction.criticalConcepts || []).map((cc: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{cc}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-[#090910] border border-red-950/40 space-y-3">
              <h3 className="text-sm font-bold text-white font-mono uppercase text-red-400">
                High-Scoring Revision Priorities
              </h3>
              <ul className="space-y-2 text-xs text-zinc-300">
                {(prediction.revisionStrategy || []).map((rs: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">⚡</span>
                    <span>{rs}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-red-950/30 via-[#0e0a12] to-black border border-red-800/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                Generate Predicted University Question Paper
              </h3>
              <p className="text-xs text-zinc-400">
                Create a full mock paper based directly on these forecasted question types and mark weights.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('paper-generator')}
              className="btn-red-glow flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white whitespace-nowrap uppercase tracking-wider"
            >
              <span>Generate Predicted Question Paper</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
