import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Sparkles,
  RefreshCw,
  BookOpen,
  Code,
  Flame,
} from 'lucide-react';

export const CheatSheetView: React.FC = () => {
  const { activeSubject, subjects, showToast, triggerConfetti } = useApp();
  const currentSubject = activeSubject || subjects[0];

  const [selectedUnit, setSelectedUnit] = useState<string>(
    currentSubject?.units[0]?.name || 'Unit 1'
  );
  const [generating, setGenerating] = useState<boolean>(false);
  const [cheatSheet, setCheatSheet] = useState<any>(null);

  const handleGenerate = async () => {
    if (!currentSubject) {
      showToast('Please select or add a subject first.', 'error');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-cheatsheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: currentSubject.id,
          subjectName: currentSubject.name,
          unitName: selectedUnit,
        }),
      });

      if (!res.ok) {
        showToast('Unable to generate cheat sheet. Please retry.', 'error');
        return;
      }

      const data = await res.json();
      setCheatSheet(data.cheatsheet);
      showToast('One-Page Cheat Sheet compiled!', 'success');
      triggerConfetti();
    } catch (err) {
      console.error(err);
      showToast('Failed to compile cheat sheet.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel-heavy border border-red-950/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-red-400">
            <FileSpreadsheet className="w-4 h-4 text-red-500" />
            <span>ONE-PAGE REVISION ARTIFACT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">One-Page Cheat Sheet</h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Compressed pre-exam cheatsheet designed for rapid retention before entering the exam hall.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {cheatSheet && (
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#12121c] hover:bg-zinc-800 border border-zinc-800 text-zinc-200 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sheet</span>
            </button>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-red-glow flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white uppercase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
            <span>{cheatSheet ? 'Regenerate' : 'Generate Cheat Sheet'}</span>
          </button>
        </div>
      </div>

      {/* Unit Selector */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-[#090910] border border-red-950/40">
        <label className="text-xs font-semibold text-zinc-400">Select Unit:</label>
        <select
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
          className="bg-[#0f0f18] border border-red-950/60 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
        >
          {currentSubject?.units.map((u) => (
            <option key={u.id} value={u.name}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      {/* One-Page Compressed Sheet Layout */}
      {cheatSheet && (
        <div className="p-8 rounded-2xl bg-[#08080e] border border-red-950/50 shadow-2xl space-y-6 font-sans animate-fade-in print:bg-white print:text-black">
          <div className="border-b border-red-900/40 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                {cheatSheet.title || `${selectedUnit} — Cheat Sheet`}
              </h2>
              <span className="text-xs text-red-400 font-mono font-semibold">
                StudyAI Compressed High-Yield Revision Matrix
              </span>
            </div>
            <span className="text-xs font-mono text-zinc-500">{new Date().toLocaleDateString()}</span>
          </div>

          {/* Definitions Grid */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider">
              Core Definitions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {(cheatSheet.definitions || []).map((d: any, idx: number) => (
                <div key={idx} className="p-2.5 rounded-lg bg-[#0e0e16] border border-zinc-900">
                  <span className="font-bold text-white text-[11px]">{d.term}: </span>
                  <span className="text-zinc-300 text-[11px]">{d.definition}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Differences Table */}
          {cheatSheet.keyDifferences?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider">
                Key Distinctions Table
              </h3>
              <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#12121e] text-zinc-400 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Feature</th>
                      <th className="p-2.5">Item A</th>
                      <th className="p-2.5">Item B</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {cheatSheet.keyDifferences.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-zinc-900/50">
                        <td className="p-2.5 font-bold text-white">{row.aspect}</td>
                        <td className="p-2.5 text-zinc-300">{row.itemA}</td>
                        <td className="p-2.5 text-zinc-300">{row.itemB}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Formulas and Complexities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cheatSheet.formulas?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">
                  Equations & Formulas
                </h3>
                <div className="space-y-1.5 text-xs">
                  {cheatSheet.formulas.map((f: any, i: number) => (
                    <div key={i} className="p-2 rounded bg-black/60 border border-zinc-900 font-mono">
                      <div className="text-zinc-400 text-[10px]">{f.name}</div>
                      <div className="text-red-300 font-bold">{f.formula}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cheatSheet.algorithms?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">
                  Algorithms & Complexities
                </h3>
                <div className="space-y-1.5 text-xs">
                  {cheatSheet.algorithms.map((a: any, i: number) => (
                    <div key={i} className="p-2 rounded bg-[#0f0f1a] border border-zinc-900">
                      <div className="font-bold text-white text-[11px]">{a.name}</div>
                      <div className="text-zinc-400 text-[10px]">{a.summary}</div>
                      <div className="text-red-400 font-mono text-[10px] font-bold">
                        {a.complexity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
