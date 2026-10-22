import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  CheckSquare,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Award,
  ArrowRight,
  ChevronDown,
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
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7C6EE6]">
            <CheckSquare className="w-4 h-4 text-[#7C6EE6]" />
            <span>EXAM DRILL ENGINE • MCQ SPRINT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#28263A]">Practice MCQs</h1>
          <p className="text-xs sm:text-sm text-[#777589]">
            Topic: <span className="text-[#28263A] font-bold">{currentTopic?.name || 'Syllabus Topic'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={currentTopic?.id}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="bg-[#FFFDF9] border border-[#EEEAF4] rounded-2xl px-3.5 py-2 text-xs text-[#28263A] focus:outline-none focus:border-[#7C6EE6] max-w-[200px] truncate pr-8 font-medium shadow-sm appearance-none"
            >
              {allTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#777589] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={fetchMCQs}
            disabled={loading}
            className="btn-pastel-primary p-2.5 rounded-2xl text-white shadow-sm"
            title="Regenerate MCQs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm text-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin text-[#7C6EE6] mx-auto" />
          <h3 className="text-base font-bold text-[#28263A]">Generating University Standard MCQs...</h3>
          <p className="text-xs text-[#777589]">Formulating questions with distractor explanations and concept hints.</p>
        </div>
      ) : mcqs.length > 0 && currentQ ? (
        <div className="space-y-6">
          {/* Progress bar */}
          <div className="flex items-center justify-between text-xs font-semibold text-[#777589]">
            <span>
              Question {currentIdx + 1} of {mcqs.length}
            </span>
            <span>
              Answered: {Object.keys(selectedAnswers).length} / {mcqs.length}
            </span>
          </div>
          <div className="w-full h-2 bg-[#F3F0F8] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#7C6EE6] to-[#A99EFA] rounded-full transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / mcqs.length) * 100}%` }}
            />
          </div>

          {/* Question Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#EEEAF4] shadow-[0_4px_24px_rgba(40,38,58,0.04)] space-y-6">
            <h2 className="text-base sm:text-lg font-bold text-[#28263A] leading-relaxed">
              {currentIdx + 1}. {currentQ.question}
            </h2>

            {/* Options A, B, C, D */}
            <div className="space-y-3">
              {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                const optKey = `option${opt}` as 'optionA' | 'optionB' | 'optionC' | 'optionD';
                const text = currentQ[optKey];
                const isSelected = selectedAnswers[currentIdx] === opt;
                const isCorrect = currentQ.correctAnswer === opt;

                let optionStyle = 'bg-[#FFFDF9] border-[#EEEAF4] text-[#28263A] hover:border-[#D9D2F8] hover:bg-[#EAE5FF]/20';
                if (quizSubmitted) {
                  if (isCorrect) {
                    optionStyle = 'bg-[#CFF5E7] border-[#A9E8D2] text-[#319B78] font-bold';
                  } else if (isSelected) {
                    optionStyle = 'bg-rose-50 border-rose-300 text-rose-700 font-semibold';
                  }
                } else if (isSelected) {
                  optionStyle = 'bg-[#EAE5FF] border-[#7C6EE6] text-[#7C6EE6] font-bold shadow-sm';
                }

                return (
                  <button
                    key={opt}
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full p-4 rounded-2xl text-xs sm:text-sm text-left border flex items-center gap-3 transition-all cursor-pointer ${optionStyle}`}
                  >
                    <span className="w-7 h-7 rounded-xl bg-white border border-[#EEEAF4] shadow-sm flex items-center justify-center font-mono font-bold text-xs shrink-0 text-[#28263A]">
                      {opt}
                    </span>
                    <span className="flex-1">{text}</span>
                    {quizSubmitted && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-[#319B78]" />
                    )}
                    {quizSubmitted && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation box */}
            {quizSubmitted && (
              <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#EEEAF4] space-y-1 text-xs">
                <span className="font-bold text-[#7C6EE6] font-mono">Answer Explanation:</span>
                <p className="text-[#777589] leading-relaxed">{currentQ.explanation}</p>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-[#EEEAF4]">
              <button
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
                className="px-4 py-2 rounded-2xl text-xs font-semibold bg-[#FFFDF9] border border-[#EEEAF4] text-[#777589] hover:text-[#28263A] disabled:opacity-40 transition-colors"
              >
                Previous
              </button>

              {currentIdx < mcqs.length - 1 ? (
                <button
                  onClick={() => setCurrentIdx((i) => Math.min(mcqs.length - 1, i + 1))}
                  className="btn-pastel-primary px-5 py-2.5 rounded-2xl text-xs font-bold text-white shadow-sm"
                >
                  Next Question →
                </button>
              ) : (
                !quizSubmitted && (
                  <button
                    onClick={handleSubmitQuiz}
                    className="btn-pastel-primary px-6 py-2.5 rounded-2xl text-xs font-bold text-white uppercase tracking-wider shadow-sm"
                  >
                    Submit Quiz
                  </button>
                )
              )}
            </div>
          </div>

          {/* Result Card */}
          {quizSubmitted && (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-[#CFF5E7]/50 via-white to-[#EAE5FF]/40 border border-[#A9E8D2] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-fade-in">
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase text-[#319B78] font-bold">
                  Quiz Completed 🎉
                </span>
                <div className="text-2xl font-extrabold text-[#28263A]">
                  Score: {calculateScore()} / {mcqs.length} ({Math.round((calculateScore() / mcqs.length) * 100)}%)
                </div>
              </div>
              <button
                onClick={fetchMCQs}
                className="btn-pastel-primary px-5 py-2.5 rounded-2xl text-xs font-bold text-white shadow-sm"
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
