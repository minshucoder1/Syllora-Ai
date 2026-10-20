import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Binary,
  Sparkles,
  RefreshCw,
  Printer,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export const NumericalsView: React.FC = () => {
  const { activeSubject, subjects, selectedTopicId, setSelectedTopicId, showToast, triggerConfetti } = useApp();
  const currentSubject = activeSubject || subjects[0];
  const allTopics = currentSubject?.units.flatMap((u) => u.topics) || [];
  const currentTopic = allTopics.find((t) => t.id === selectedTopicId) || allTopics[0];

  const [loading, setLoading] = useState(false);
  const [numericals, setNumericals] = useState<any[]>([]);

  const fetchNumericals = async () => {
    if (!currentSubject || !currentTopic) return;
    setLoading(true);

    try {
      const res = await fetch('/api/ai/generate-numericals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: currentSubject.name,
          topicName: currentTopic.name,
        }),
      });

      if (!res.ok) {
        showToast('Unable to load numerical problems.', 'error');
        return;
      }

      const data = await res.json();
      setNumericals(data.numericals || []);
    } catch {
      showToast('Error loading numericals.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTopic) {
      fetchNumericals();
    }
  }, [currentTopic?.id]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel-heavy border border-red-950/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-red-400">
            <Binary className="w-4 h-4 text-red-500" />
            <span>STEP-BY-STEP PROBLEM SOLVER</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Numericals & Design Problems</h1>
          <p className="text-xs text-zinc-400">
            Rigorous 10-point mathematical derivations with Given, Formula, Calculation, Final Answer & Verification.
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
            onClick={() => window.print()}
            className="p-2 rounded-xl bg-[#12121c] border border-zinc-800 text-zinc-300 hover:text-white"
            title="Print"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            onClick={fetchNumericals}
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
          <h3 className="text-base font-bold text-white">Formulating Numerical Calculations...</h3>
        </div>
      ) : numericals.length > 0 ? (
        <div className="space-y-6">
          {numericals.map((num, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[#090912] border border-red-950/50 space-y-5 animate-fade-in"
            >
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <span className="font-bold text-sm text-red-400 font-mono">Problem #{idx + 1}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-white bg-zinc-800 px-2.5 py-0.5 rounded">
                    {num.marks} Marks
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                    {num.priority || '🔥 High Yield'}
                  </span>
                </div>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-white leading-relaxed">
                {num.question}
              </h3>

              {/* Given & Required */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-[#0e0e18] border border-zinc-900 text-xs space-y-1">
                  <div className="text-red-400 font-mono font-bold text-[11px]">1. Given Values:</div>
                  <div className="text-zinc-200 whitespace-pre-line font-mono">{num.given}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0e0e18] border border-zinc-900 text-xs space-y-1">
                  <div className="text-red-400 font-mono font-bold text-[11px]">2. To Find / Required:</div>
                  <div className="text-zinc-200 whitespace-pre-line font-mono">{num.required}</div>
                </div>
              </div>

              {/* Formula */}
              <div className="p-3.5 rounded-xl bg-black/60 border border-zinc-900 text-xs space-y-1">
                <div className="text-rose-400 font-mono font-bold text-[11px]">3. Standard Formula Applied:</div>
                <div className="font-mono text-red-300 font-semibold">{num.formula}</div>
              </div>

              {/* Step by Step Calculation */}
              <div className="space-y-2">
                <div className="text-xs font-mono font-bold text-zinc-300 uppercase">
                  4. Step-by-Step Calculation:
                </div>
                <div className="space-y-2">
                  {(num.steps || []).map((step: string, sIdx: number) => (
                    <div
                      key={sIdx}
                      className="p-3 rounded-xl bg-[#0e0e18] border border-zinc-900 text-xs font-mono text-zinc-200"
                    >
                      {step}
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Boxed Answer & Verification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/60 to-[#14080b] border border-red-700/60 text-xs space-y-1">
                  <div className="text-red-300 font-mono font-bold uppercase text-[11px]">
                    5. Final Boxed Answer:
                  </div>
                  <div className="text-lg font-bold text-white font-mono">{num.finalAnswer}</div>
                </div>

                <div className="p-4 rounded-xl bg-[#0e0e18] border border-emerald-950/50 text-xs space-y-1">
                  <div className="text-emerald-400 font-mono font-bold uppercase text-[11px]">
                    6. Verification / Sanity Check:
                  </div>
                  <div className="text-zinc-300 text-[11px] leading-relaxed">{num.verification}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};
