import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  AlertTriangle,
  Clock,
  Flame,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  BookOpen,
  Code,
  Zap,
} from 'lucide-react';

export const LastMinuteRevisionView: React.FC = () => {
  const { activeSubject, subjects, showToast, triggerConfetti } = useApp();
  const currentSubject = activeSubject || subjects[0];

  const [selectedDuration, setSelectedDuration] = useState<string>('2 Hours');
  const [generating, setGenerating] = useState<boolean>(false);
  const [revisionPack, setRevisionPack] = useState<any>(null);

  const timeOptions = ['30 Minutes', '1 Hour', '2 Hours', '3 Hours', '5 Hours'];

  const handleGeneratePack = async () => {
    if (!currentSubject) {
      showToast('Please select or add a subject first.', 'error');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/ai/last-minute-revision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: currentSubject.name,
          timeAvailable: selectedDuration,
          units: currentSubject.units,
        }),
      });

      if (!res.ok) {
        showToast('Unable to generate last minute revision.', 'error');
        return;
      }

      const data = await res.json();
      setRevisionPack(data.plan);
      showToast('Emergency Revision Sprint created!', 'success');
      triggerConfetti();
    } catch (err) {
      console.error(err);
      showToast('Failed to create revision plan.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Alert Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-red-950 via-[#180509] to-black border-2 border-red-600/70 shadow-[0_0_30px_rgba(239,68,68,0.25)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest">
              EMERGENCY MODE
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-2">
            EXAM TOMORROW <span className="text-red-500">🚨</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300">
            Subject:{' '}
            <span className="font-bold text-white underline">{currentSubject?.name || 'Your Subject'}</span>
            . High-yield emergency sprint revision focused only on guaranteed concepts.
          </p>
        </div>

        <div className="flex-shrink-0">
          <button
            onClick={handleGeneratePack}
            disabled={generating}
            className="btn-red-glow flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-extrabold text-white uppercase tracking-wider"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>{generating ? 'Compiling Sprint...' : 'Generate Emergency Plan'}</span>
          </button>
        </div>
      </div>

      {/* Time Picker */}
      <div className="glass-panel-heavy rounded-2xl p-6 border border-red-950/40 space-y-3">
        <h3 className="text-xs font-bold text-zinc-300 font-mono uppercase flex items-center gap-2">
          <Clock className="w-4 h-4 text-red-500" />
          <span>How much time do you have right now?</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {timeOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => setSelectedDuration(opt)}
              className={`py-3 px-4 rounded-xl text-xs font-bold font-mono transition-all border ${
                selectedDuration === opt
                  ? 'bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                  : 'bg-[#0a0a14] text-zinc-400 hover:text-white border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Revision Sprint Output */}
      {revisionPack && (
        <div className="space-y-6 animate-fade-in">
          {/* Timed Timeline Schedule */}
          <div className="glass-panel-heavy rounded-2xl p-6 border border-red-950/40 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 font-mono uppercase text-red-400">
              <Clock className="w-5 h-5 text-red-500" />
              <span>YOUR {selectedDuration.toUpperCase()} REVISION SCHEDULE</span>
            </h2>

            <div className="space-y-3">
              {(revisionPack.timeSchedule || []).map((slot: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#0a0a14] border border-red-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-red-400 bg-red-950 px-2 py-1 rounded border border-red-800">
                      {slot.timeSlot}
                    </span>
                    <span className="text-sm font-bold text-white">{slot.title}</span>
                  </div>
                  <span className="text-xs text-zinc-400">{slot.activity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Definitions & Must-Revise Topics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#090910] border border-red-950/40 space-y-3">
              <h3 className="text-xs font-bold text-red-400 font-mono uppercase flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-red-500" />
                <span>Top Must-Revise Topics</span>
              </h3>
              <div className="space-y-2">
                {(revisionPack.mustReviseTopics || []).map((mrt: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-[#0f0f18] border border-zinc-900 text-xs">
                    <div className="font-bold text-white">{mrt.topic}</div>
                    <div className="text-[11px] text-zinc-400 pt-0.5">{mrt.reason}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#090910] border border-red-950/40 space-y-3">
              <h3 className="text-xs font-bold text-red-400 font-mono uppercase flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-red-500" />
                <span>Instant Definitions</span>
              </h3>
              <div className="space-y-2">
                {(revisionPack.quickDefinitions || []).map((qd: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-[#0f0f18] border border-zinc-900 text-xs">
                    <span className="font-bold text-red-400">{qd.term}: </span>
                    <span className="text-zinc-200">{qd.definition}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key Formulas & Core Algorithms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#090910] border border-red-950/40 space-y-3">
              <h3 className="text-xs font-bold text-rose-400 font-mono uppercase">
                Must-Memorize Formulas
              </h3>
              <div className="space-y-2">
                {(revisionPack.keyFormulas || []).map((kf: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-black/50 border border-zinc-900 text-xs">
                    <div className="font-bold text-zinc-300">{kf.name}</div>
                    <div className="font-mono text-red-300 text-xs pt-1">{kf.formula}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#090910] border border-red-950/40 space-y-3">
              <h3 className="text-xs font-bold text-rose-400 font-mono uppercase flex items-center gap-1.5">
                <Code className="w-4 h-4" />
                <span>Core Algorithm Workflows</span>
              </h3>
              <div className="space-y-2">
                {(revisionPack.coreAlgorithms || []).map((ca: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-black/50 border border-zinc-900 text-xs">
                    <div className="font-bold text-white">{ca.name}</div>
                    <div className="text-zinc-300 text-[11px] pt-1">{ca.summary}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rapid Fire MCQs */}
          <div className="p-6 rounded-2xl bg-[#090910] border border-red-950/40 space-y-3">
            <h3 className="text-xs font-bold text-red-400 font-mono uppercase">
              ⚡ Rapid Fire Review MCQs
            </h3>
            <div className="space-y-2.5">
              {(revisionPack.rapidMCQs || []).map((mcq: any, i: number) => (
                <div key={i} className="p-3.5 rounded-xl bg-[#0f0f18] border border-zinc-900 text-xs space-y-1">
                  <div className="font-bold text-zinc-100">{mcq.question}</div>
                  <div className="text-emerald-400 font-mono font-semibold">
                    Answer: {mcq.answer}
                  </div>
                  <div className="text-[11px] text-zinc-400">{mcq.explanation}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
