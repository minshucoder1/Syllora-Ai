import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  CheckSquare,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  ArrowRight,
} from 'lucide-react';

export const MCQQuizView: React.FC = () => {
  const { activeSubject, subjects, selectedTopicId, setSelectedTopicId, showToast, triggerConfetti } = useApp();
  const currentSubject = activeSubject || subjects[0];
  const allTopics = currentSubject?.units.flatMap((u) => u.topics) || [];
  const currentTopic = allTopics.find((t) => t.id === selectedTopicId) || allTopics[0];

  const [loading, setLoading] = useState(false);
  const [mcqs, setMcqs] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const fetchMCQs = async () => {
    if (!currentSubject || !currentTopic) return;
    setLoading(true);
    setQuizSubmitted(false);
    setSelectedAnswers({});
    setCurrentIdx(0);

    try {
      const res = await fetch('/api/ai/generate-mcqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: currentSubject.id,
          topicId: currentTopic.id,
          subjectName: currentSubject.name,
          topicName: currentTopic.name,
          count: 10,
          difficulty: 'Mixed',
        }),
      });

      if (!res.ok) {
        showToast('Unable to load MCQs.', 'error');
        return;
      }

      const data = await res.json();
      setMcqs(data.mcqs || []);
    } catch {
      showToast('Error loading MCQs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTopic) {
      fetchMCQs();
    }
  }, [currentTopic?.id]);

  const handleSelectOption = (opt: 'A' | 'B' | 'C' | 'D') => {
    if (quizSubmitted) return;
    setSelectedAnswers({ ...selectedAnswers, [currentIdx]: opt });
  };

  const calculateScore = () => {
    let correct = 0;
    mcqs.forEach((m, idx) => {
      if (selectedAnswers[idx] === m.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  const handleSubmitQuiz = async () => {
    const score = calculateScore();
    const accuracy = Math.round((score / mcqs.length) * 100);
    setQuizSubmitted(true);

    try {
      await fetch('/api/quiz-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: currentTopic.id,
          score,
          total: mcqs.length,
          accuracy,
        }),
      });
      showToast(`Quiz completed! Score: ${score}/${mcqs.length} (${accuracy}%) 🎉`, 'success');
      triggerConfetti();
    } catch {
      // Ignore
    }
  };

  const currentQ = mcqs[currentIdx];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel-heavy border border-red-950/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-red-400">
            <CheckSquare className="w-4 h-4 text-red-500" />
            <span>EXAM DRILL ENGINE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Multiple Choice Quiz</h1>
          <p className="text-xs text-zinc-400">
            Topic: <span className="text-white font-bold">{currentTopic?.name || 'Syllabus Topic'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={currentTopic?.id}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            className="bg-[#0f0f18] border border-red-950/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 max-w-[200px] truncate"
          >
            {allTopics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <button
            onClick={fetchMCQs}
            disabled={loading}
            className="btn-red-glow p-2 rounded-xl text-white"
            title="Regenerate MCQs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel-heavy rounded-2xl p-12 text-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin text-red-500 mx-auto" />
          <h3 className="text-base font-bold text-white">Generating University Standard MCQs...</h3>
          <p className="text-xs text-zinc-400">Formulating questions with distractor explanations.</p>
        </div>
      ) : mcqs.length > 0 && currentQ ? (
        <div className="space-y-6">
          {/* Progress bar */}
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>
              Question {currentIdx + 1} of {mcqs.length}
            </span>
            <span>
              Answered: {Object.keys(selectedAnswers).length} / {mcqs.length}
            </span>
          </div>
          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-full transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / mcqs.length) * 100}%` }}
            />
          </div>

          {/* Question Card */}
          <div className="glass-panel-heavy rounded-2xl p-6 sm:p-8 border border-red-950/40 space-y-6">
            <h2 className="text-base sm:text-lg font-bold text-white leading-relaxed">
              {currentIdx + 1}. {currentQ.question}
            </h2>

            {/* Options A, B, C, D */}
            <div className="space-y-3">
              {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                const optKey = `option${opt}` as 'optionA' | 'optionB' | 'optionC' | 'optionD';
                const text = currentQ[optKey];
                const isSelected = selectedAnswers[currentIdx] === opt;
                const isCorrect = currentQ.correctAnswer === opt;

                let optionStyle = 'bg-[#0b0b14] border-zinc-900 text-zinc-200 hover:border-red-950';
                if (quizSubmitted) {
                  if (isCorrect) {
                    optionStyle = 'bg-emerald-950/50 border-emerald-600 text-emerald-200 font-bold';
                  } else if (isSelected) {
                    optionStyle = 'bg-red-950/50 border-red-600 text-red-200';
                  }
                } else if (isSelected) {
                  optionStyle = 'bg-red-950/60 border-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] font-bold';
                }

                return (
                  <button
                    key={opt}
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full p-4 rounded-xl text-xs sm:text-sm text-left border flex items-center gap-3 transition-all ${optionStyle}`}
                  >
                    <span className="w-6 h-6 rounded-lg bg-black/60 flex items-center justify-center font-mono font-bold text-xs flex-shrink-0">
                      {opt}
                    </span>
                    <span className="flex-1">{text}</span>
                    {quizSubmitted && isCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                    {quizSubmitted && isSelected && !isCorrect && (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation box */}
            {quizSubmitted && (
              <div className="p-4 rounded-xl bg-black/50 border border-zinc-800 space-y-1 text-xs">
                <span className="font-bold text-red-400 font-mono">Answer Explanation:</span>
                <p className="text-zinc-300 leading-relaxed">{currentQ.explanation}</p>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-900">
              <button
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#12121c] border border-zinc-800 text-zinc-300 disabled:opacity-30"
              >
                Previous
              </button>

              {currentIdx < mcqs.length - 1 ? (
                <button
                  onClick={() => setCurrentIdx((i) => Math.min(mcqs.length - 1, i + 1))}
                  className="btn-red-glow px-5 py-2 rounded-xl text-xs font-bold text-white"
                >
                  Next Question →
                </button>
              ) : (
                !quizSubmitted && (
                  <button
                    onClick={handleSubmitQuiz}
                    className="btn-red-glow px-6 py-2 rounded-xl text-xs font-bold text-white uppercase tracking-wider"
                  >
                    Submit Quiz
                  </button>
                )
              )}
            </div>
          </div>

          {/* Result Card */}
          {quizSubmitted && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-red-950/40 via-[#0e0a14] to-black border border-red-800/50 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase text-red-400 font-bold">
                  Quiz Completed
                </span>
                <div className="text-2xl font-extrabold text-white">
                  Score: {calculateScore()} / {mcqs.length} ({Math.round((calculateScore() / mcqs.length) * 100)}%)
                </div>
              </div>
              <button
                onClick={fetchMCQs}
                className="btn-red-glow px-5 py-2 rounded-xl text-xs font-bold text-white"
              >
                Try Another Set
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
