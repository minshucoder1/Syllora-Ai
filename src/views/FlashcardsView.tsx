import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Layers,
  RotateCw,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const FlashcardsView: React.FC = () => {
  const { activeSubject, subjects, selectedTopicId, setSelectedTopicId, showToast, triggerConfetti } = useApp();
  const currentSubject = activeSubject || subjects[0];
  const allTopics = currentSubject?.units.flatMap((u) => u.topics) || [];
  const currentTopic = allTopics.find((t) => t.id === selectedTopicId) || allTopics[0];

  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [learnedSet, setLearnedSet] = useState<Set<number>>(new Set());

  const fetchFlashcards = async () => {
    if (!currentSubject || !currentTopic) return;
    setLoading(true);
    setIsFlipped(false);
    setCurrentIdx(0);
    setLearnedSet(new Set());

    try {
      const res = await fetch('/api/ai/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: currentSubject.id,
          topicId: currentTopic.id,
          subjectName: currentSubject.name,
          topicName: currentTopic.name,
          count: 8,
        }),
      });

      if (!res.ok) {
        showToast('Unable to load flashcards.', 'error');
        return;
      }

      const data = await res.json();
      setFlashcards(data.flashcards || []);
    } catch {
      showToast('Error loading flashcards.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTopic) {
      fetchFlashcards();
    }
  }, [currentTopic?.id]);

  const handleShuffle = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentIdx(0);
    setIsFlipped(false);
    showToast('Flashcards shuffled!', 'info');
  };

  const handleMarkLearned = () => {
    const next = new Set(learnedSet);
    next.add(currentIdx);
    setLearnedSet(next);
    showToast('Marked as learned! (+5 XP)', 'success');
    triggerConfetti();
    if (currentIdx < flashcards.length - 1) {
      setCurrentIdx((i) => i + 1);
      setIsFlipped(false);
    }
  };

  const currentCard = flashcards[currentIdx];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel-heavy border border-red-950/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-red-400">
            <Layers className="w-4 h-4 text-red-500" />
            <span>ACTIVE RECALL ENGINE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Digital Flashcards</h1>
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
            onClick={handleShuffle}
            disabled={flashcards.length === 0}
            className="p-2 rounded-xl bg-[#12121c] border border-zinc-800 text-zinc-300 hover:text-white"
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={fetchFlashcards}
            disabled={loading}
            className="btn-red-glow p-2 rounded-xl text-white"
            title="Regenerate"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel-heavy rounded-2xl p-12 text-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin text-red-500 mx-auto" />
          <h3 className="text-base font-bold text-white">Generating Active Recall Cards...</h3>
        </div>
      ) : flashcards.length > 0 && currentCard ? (
        <div className="space-y-6">
          {/* Tracker */}
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>
              Card {currentIdx + 1} of {flashcards.length}
            </span>
            <span className="text-emerald-400">
              {learnedSet.size} / {flashcards.length} Learned
            </span>
          </div>

          {/* 3D Flip Card */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="min-h-[280px] sm:min-h-[340px] p-8 sm:p-12 rounded-2xl bg-[#090912] border-2 border-red-950/60 hover:border-red-600/50 shadow-2xl cursor-pointer select-none flex flex-col justify-between transition-all duration-300 card-hover-glow relative"
          >
            <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
              <span>{isFlipped ? 'ANSWER / TAKEAWAY' : 'PROMPT / QUESTION'}</span>
              <span className="text-red-400 flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5" /> Click anywhere to flip
              </span>
            </div>

            <div className="py-6 text-center">
              {isFlipped ? (
                <div className="space-y-4 animate-fade-in">
                  <p className="text-base sm:text-xl font-medium text-zinc-100 leading-relaxed">
                    {currentCard.back}
                  </p>
                  {currentCard.keyTakeaway && (
                    <div className="inline-block px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs font-mono">
                      💡 {currentCard.keyTakeaway}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-lg sm:text-2xl font-bold text-white leading-relaxed">
                  {currentCard.front}
                </p>
              )}
            </div>

            <div className="text-center text-[11px] text-zinc-600 font-mono">
              Space bar or arrow keys to navigate
            </div>
          </div>

          {/* Navigation and Learned buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setCurrentIdx((i) => Math.max(0, i - 1));
                setIsFlipped(false);
              }}
              disabled={currentIdx === 0}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#12121c] border border-zinc-800 text-zinc-300 disabled:opacity-30 flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> <span>Previous</span>
            </button>

            <button
              onClick={handleMarkLearned}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                learnedSet.has(currentIdx)
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                  : 'bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{learnedSet.has(currentIdx) ? 'Learned ✓' : 'Mark as Learned'}</span>
            </button>

            <button
              onClick={() => {
                setCurrentIdx((i) => Math.min(flashcards.length - 1, i + 1));
                setIsFlipped(false);
              }}
              disabled={currentIdx === flashcards.length - 1}
              className="btn-red-glow px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-30 flex items-center gap-1.5"
            >
              <span>Next</span> <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
