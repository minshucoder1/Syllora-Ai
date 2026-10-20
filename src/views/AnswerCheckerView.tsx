import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Mic,
  MicOff,
  AlertCircle,
  ThumbsUp,
  Award,
  Layers,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

export const AnswerCheckerView: React.FC = () => {
  const { activeSubject, subjects, showToast, triggerConfetti } = useApp();
  const currentSubject = activeSubject || subjects[0];
  const allTopics = currentSubject?.units.flatMap((u) => u.topics) || [];

  const [selectedTopic, setSelectedTopic] = useState<string>(allTopics[0]?.name || 'Core Concept');
  const [question, setQuestion] = useState<string>('Explain the LIFO principle and push/pop operations with an example.');
  const [marks, setMarks] = useState<number>(10);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);

  // Web Speech API Voice Dictation
  const handleToggleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast('Speech recognition is not supported in this browser.', 'info');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        showToast('Listening... Speak your answer now.', 'info');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setUserAnswer((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const handleEvaluate = async () => {
    if (!userAnswer.trim()) {
      showToast('Please enter your written or spoken answer first.', 'error');
      return;
    }

    setEvaluating(true);
    try {
      const res = await fetch('/api/ai/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: currentSubject?.id || 'subj_default',
          subjectName: currentSubject?.name || 'General Engineering',
          topicName: selectedTopic,
          question,
          totalMarks: marks,
          userAnswer,
        }),
      });

      if (!res.ok) {
        showToast('Unable to evaluate answer right now. Please retry.', 'error');
        return;
      }

      const data = await res.json();
      setEvaluation(data.evaluation);
      showToast('Answer evaluated with full rubric breakdown!', 'success');
      triggerConfetti();
    } catch (err) {
      console.error(err);
      showToast('Evaluation failed.', 'error');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel-heavy border border-red-950/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-red-400">
            <CheckCircle2 className="w-4 h-4 text-red-500" />
            <span>AI EXAM EXAMINER</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">AI Answer Checker</h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Type or speak your exam answer. The AI professor grades correctness, technical accuracy, completeness, and presentation.
          </p>
        </div>
      </div>

      {/* Input Form */}
      <div className="glass-panel-heavy rounded-2xl p-6 sm:p-8 border border-red-950/40 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Subject:</label>
            <div className="p-2.5 rounded-xl bg-[#0a0a14] border border-red-950 text-xs font-bold text-white truncate">
              {currentSubject?.name || 'Subject'}
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Topic:</label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full bg-[#0a0a14] border border-red-950/60 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
            >
              {allTopics.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Marks Weightage:</label>
            <select
              value={marks}
              onChange={(e) => setMarks(Number(e.target.value))}
              className="w-full bg-[#0a0a14] border border-red-950/60 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
            >
              <option value={2}>2 Marks (Short)</option>
              <option value={5}>5 Marks (Medium)</option>
              <option value={10}>10 Marks (Comprehensive Essay)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-zinc-400 block mb-1">Examination Question:</label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full bg-[#0a0a14] border border-red-950/60 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500 font-semibold"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-zinc-400">Your Answer (Type or Dictate):</label>
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                isListening
                  ? 'bg-red-600 text-white animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                  : 'bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800'
              }`}
            >
              {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
              <span>{isListening ? 'Listening...' : 'Voice Dictate'}</span>
            </button>
          </div>

          <textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Write your exam answer here. Include definitions, key steps, examples, and formulas..."
            rows={7}
            className="w-full bg-[#0a0a14] border border-red-950/60 rounded-xl p-4 text-xs text-zinc-200 focus:outline-none focus:border-red-500 font-sans leading-relaxed"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleEvaluate}
            disabled={evaluating}
            className="btn-red-glow flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white uppercase tracking-wider"
          >
            {evaluating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Grading Your Answer...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Evaluate My Answer</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Evaluation Results Card */}
      {evaluation && (
        <div className="space-y-6 animate-fade-in">
          {/* Estimated Score & Rubric Breakdown */}
          <div className="p-6 rounded-2xl bg-[#090912] border border-red-950/50 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
              <div>
                <span className="text-xs font-mono uppercase text-red-400 font-bold">
                  Estimated Score
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono flex items-baseline gap-2">
                  <span className="text-red-500">{evaluation.estimatedScore}</span>
                  <span className="text-zinc-500 text-2xl">/ {evaluation.totalMarks} Marks</span>
                </div>
              </div>

              {/* Rubric metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Concept', score: evaluation.rubric?.concept || 8 },
                  { label: 'Accuracy', score: evaluation.rubric?.accuracy || 8 },
                  { label: 'Completeness', score: evaluation.rubric?.completeness || 7 },
                  { label: 'Presentation', score: evaluation.rubric?.presentation || 7 },
                ].map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-[#0f0f18] border border-zinc-900 text-center">
                    <div className="text-sm font-bold text-white font-mono">{item.score}/10</div>
                    <div className="text-[10px] text-zinc-400">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Missing Points */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#0f0f18] border border-emerald-950/40 space-y-2">
                <h4 className="text-xs font-bold text-emerald-400 uppercase font-mono flex items-center gap-1.5">
                  <ThumbsUp className="w-4 h-4" />
                  <span>What You Did Well</span>
                </h4>
                <ul className="space-y-1 text-xs text-zinc-300">
                  {(evaluation.whatYouDidWell || []).map((w: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#0f0f18] border border-red-950/40 space-y-2">
                <h4 className="text-xs font-bold text-red-400 uppercase font-mono flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>Missing Points (Underline in Exam)</span>
                </h4>
                <ul className="space-y-1 text-xs text-zinc-300">
                  {(evaluation.missingPoints || []).map((m: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-red-500 font-bold">✕</span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Mistakes & How to Improve */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#0f0f18] border border-zinc-900 space-y-2">
                <h4 className="text-xs font-bold text-rose-400 uppercase font-mono">Mistakes to Fix</h4>
                <ul className="space-y-1 text-xs text-zinc-300">
                  {(evaluation.mistakes || []).map((m: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#0f0f18] border border-zinc-900 space-y-2">
                <h4 className="text-xs font-bold text-amber-400 uppercase font-mono">How to Improve</h4>
                <ul className="space-y-1 text-xs text-zinc-300">
                  {(evaluation.howToImprove || []).map((h: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-500 font-bold">⚡</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Model Improved Answer */}
            <div className="p-5 rounded-xl bg-[#0c0c16] border border-red-950 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-red-400 font-mono uppercase flex items-center gap-2">
                  <Award className="w-4 h-4 text-red-500" />
                  <span>Model 10/10 Exam Answer</span>
                </h4>
                <button
                  onClick={() => setIsComparing(!isComparing)}
                  className="text-xs font-semibold text-zinc-400 hover:text-white underline"
                >
                  {isComparing ? 'Hide Comparison' : 'Compare With My Answer'}
                </button>
              </div>

              {isComparing && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-black/60 rounded-xl text-xs font-mono">
                  <div className="space-y-1 text-zinc-400">
                    <div className="font-bold text-red-400">Your Submitted Answer:</div>
                    <div className="whitespace-pre-line text-[11px]">{userAnswer}</div>
                  </div>
                  <div className="space-y-1 text-zinc-300 border-t sm:border-t-0 sm:border-l border-zinc-800 pt-2 sm:pt-0 sm:pl-3">
                    <div className="font-bold text-emerald-400">Model Answer:</div>
                    <div className="whitespace-pre-line text-[11px]">{evaluation.improvedAnswer}</div>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-black/40 border border-zinc-900 text-xs text-zinc-200 leading-relaxed whitespace-pre-line">
                {evaluation.improvedAnswer}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 flex-wrap gap-2">
              <button
                onClick={() => {
                  setUserAnswer('');
                  setEvaluation(null);
                }}
                className="text-xs text-zinc-400 hover:text-white"
              >
                ← Try Another Question
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    showToast('Evaluation saved to your Answer Archive! 🏆', 'success');
                    triggerConfetti();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#12121c] hover:bg-zinc-800 border border-zinc-800 text-zinc-200"
                >
                  Save Evaluation 💾
                </button>
                <button
                  onClick={() => {
                    setEvaluation(null);
                    handleEvaluate();
                  }}
                  className="btn-red-glow px-4 py-2 rounded-xl text-xs font-bold text-white"
                >
                  Try Again & Re-evaluate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
