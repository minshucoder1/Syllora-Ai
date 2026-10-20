import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  Printer,
  Download,
  RefreshCw,
  Clock,
  BookOpen,
  CheckCircle2,
  Sliders,
  FileText,
  BookmarkCheck,
  Check,
} from 'lucide-react';

export const QuestionPaperGeneratorView: React.FC = () => {
  const { activeSubject, subjects, showToast, triggerConfetti } = useApp();
  const currentSubject = activeSubject || subjects[0];
  const allUnits = currentSubject?.units || [];

  // Settings State
  const [selectedUnitNames, setSelectedUnitNames] = useState<string[]>(
    allUnits.map((u) => u.name)
  );
  const [marksMode, setMarksMode] = useState<'50' | '70' | '75' | '100' | 'custom'>('70');
  const [customMarks, setCustomMarks] = useState<number>(65);

  const [durationMode, setDurationMode] = useState<'60' | '120' | '180' | 'custom'>('180');
  const [customDuration, setCustomDuration] = useState<number>(150);

  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Mixed'>('Mixed');
  const [patternDetails, setPatternDetails] = useState<string>(
    'Section A: 10 x 2 = 20 Marks (Definitions & short answers)\nSection B: 5 x 5 = 25 Marks (Analytical & moderate problems)\nSection C: 2 x 10 = 20 Marks (Detailed semester derivations / long design questions)\nTotal = 65 Marks'
  );

  const [generating, setGenerating] = useState<boolean>(false);
  const [generatedPaper, setGeneratedPaper] = useState<any>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const effectiveTotalMarks = marksMode === 'custom' ? customMarks : Number(marksMode);
  const effectiveDuration = durationMode === 'custom' ? customDuration : Number(durationMode);

  // Toggle unit selection
  const handleToggleUnit = (unitName: string) => {
    setSelectedUnitNames((prev) =>
      prev.includes(unitName) ? prev.filter((u) => u !== unitName) : [...prev, unitName]
    );
  };

  const handleSelectAllUnits = () => {
    setSelectedUnitNames(allUnits.map((u) => u.name));
  };

  const handleGenerate = async () => {
    if (!currentSubject) {
      showToast('Please select or add a subject first.', 'error');
      return;
    }

    if (selectedUnitNames.length === 0) {
      showToast('Please select at least one unit for the question paper.', 'error');
      return;
    }

    setGenerating(true);
    setIsSaved(false);
    try {
      const res = await fetch('/api/ai/generate-question-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: currentSubject.id,
          subjectName: currentSubject.name,
          units: selectedUnitNames,
          totalMarks: effectiveTotalMarks,
          durationMinutes: effectiveDuration,
          difficulty,
          patternDetails,
        }),
      });

      if (!res.ok) {
        showToast('Unable to generate question paper. Please retry.', 'error');
        return;
      }

      const data = await res.json();
      setGeneratedPaper(data.paper);
      showToast('University-grade question paper generated successfully!', 'success');
      triggerConfetti();
    } catch (err) {
      console.error(err);
      showToast('Error generating question paper.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    setIsSaved(true);
    showToast('Question paper saved to your examination archives! 📁', 'success');
    triggerConfetti();
  };

  const handleDownloadTxt = () => {
    if (!generatedPaper) return;

    let text = `======================================================================
${generatedPaper.universityName || 'END SEMESTER UNIVERSITY EXAMINATION'}
======================================================================
Subject: ${generatedPaper.title}
Time Allowed: ${generatedPaper.durationMinutes / 60} Hours (${generatedPaper.durationMinutes} Minutes)
Maximum Marks: ${generatedPaper.totalMarks} Marks
Difficulty: ${difficulty}
Units Covered: ${selectedUnitNames.join(', ')}
======================================================================\n\n`;

    (generatedPaper.sections || []).forEach((sec: any) => {
      text += `----------------------------------------------------------------------\n`;
      text += `${sec.sectionName}  [Total: ${sec.totalMarks} Marks]\n`;
      text += `Instructions: ${sec.instructions || ''}\n`;
      text += `----------------------------------------------------------------------\n\n`;

      (sec.questions || []).forEach((q: any) => {
        text += `${q.questionNumber || 'Q.'} ${q.text}  [${q.marks} Marks]\n`;
        if (q.orOption) {
          text += `    [OR]\n    ${q.orOption}  [${q.marks} Marks]\n`;
        }
        text += `\n`;
      });
    });

    text += `\n*** END OF QUESTION PAPER ***\nGenerated via StudyAI\n`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSubject.name}_Exam_Paper_${effectiveTotalMarks}M.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded question paper as .txt!', 'success');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel-heavy border border-red-950/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-red-400">
            <Sparkles className="w-4 h-4 text-red-500" />
            <span>UNIVERSITY EXAM COMPOSER</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">AI Question Paper Generator</h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Compose authentic university examinations with customizable sections, internal choices, duration, and mark allotments.
          </p>
        </div>

        {generatedPaper && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSave}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                isSaved
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : 'bg-[#12121c] hover:bg-zinc-800 border-zinc-800 text-zinc-200'
              }`}
            >
              {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <BookmarkCheck className="w-3.5 h-3.5 text-zinc-400" />}
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
            <button
              onClick={handleDownloadTxt}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#12121c] hover:bg-zinc-800 border border-zinc-800 text-zinc-200 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#12121c] hover:bg-zinc-800 border border-zinc-800 text-zinc-200 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn-red-glow px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
              <span>Regenerate</span>
            </button>
          </div>
        )}
      </div>

      {/* Settings Grid */}
      <div className="glass-panel-heavy rounded-2xl p-6 border border-red-950/40 space-y-6">
        <div className="flex items-center gap-2 font-mono text-xs font-bold text-red-400 uppercase">
          <Sliders className="w-4 h-4" />
          <span>Examination Settings</span>
        </div>

        {/* Units Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300">
              Select Units to Include in Examination:
            </label>
            <button
              onClick={handleSelectAllUnits}
              className="text-xs text-red-400 hover:text-red-300 font-mono"
            >
              Select All Units
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {allUnits.map((u) => {
              const checked = selectedUnitNames.includes(u.name);
              return (
                <div
                  key={u.id}
                  onClick={() => handleToggleUnit(u.name)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center gap-2.5 ${
                    checked
                      ? 'bg-red-950/40 border-red-700/60 text-white'
                      : 'bg-[#090912] border-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {}}
                    className="accent-red-600 rounded"
                  />
                  <span className="truncate font-medium">{u.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Marks, Duration, Difficulty Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Marks Options (50, 70, 75, 100, Custom) */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 block">Total Marks:</label>
            <select
              value={marksMode}
              onChange={(e) => setMarksMode(e.target.value as any)}
              className="w-full bg-[#0a0a14] border border-red-950/60 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
            >
              <option value="50">50 Marks</option>
              <option value="70">70 Marks</option>
              <option value="75">75 Marks</option>
              <option value="100">100 Marks</option>
              <option value="custom">Custom Marks</option>
            </select>
            {marksMode === 'custom' && (
              <input
                type="number"
                min={20}
                max={200}
                value={customMarks}
                onChange={(e) => setCustomMarks(Number(e.target.value))}
                placeholder="Enter custom marks"
                className="w-full mt-1.5 bg-[#0a0a14] border border-red-950 rounded-xl p-2 text-xs text-white font-mono focus:outline-none focus:border-red-500"
              />
            )}
          </div>

          {/* Duration (1 Hour, 2 Hours, 3 Hours, Custom) */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 block">Duration:</label>
            <select
              value={durationMode}
              onChange={(e) => setDurationMode(e.target.value as any)}
              className="w-full bg-[#0a0a14] border border-red-950/60 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
            >
              <option value="60">1 Hour (60 Mins)</option>
              <option value="120">2 Hours (120 Mins)</option>
              <option value="180">3 Hours (180 Mins)</option>
              <option value="custom">Custom Duration</option>
            </select>
            {durationMode === 'custom' && (
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="number"
                  min={30}
                  max={300}
                  value={customDuration}
                  onChange={(e) => setCustomDuration(Number(e.target.value))}
                  placeholder="Minutes"
                  className="w-full bg-[#0a0a14] border border-red-950 rounded-xl p-2 text-xs text-white font-mono focus:outline-none focus:border-red-500"
                />
                <span className="text-[11px] text-zinc-400 font-mono">mins</span>
              </div>
            )}
          </div>

          {/* Difficulty (Easy, Medium, Hard, Mixed) */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 block">Difficulty Pattern:</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full bg-[#0a0a14] border border-red-950/60 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
            >
              <option value="Easy">Easy (Foundation / Basic)</option>
              <option value="Medium">Medium (Standard College)</option>
              <option value="Hard">Hard (Strict / Challenging)</option>
              <option value="Mixed">Mixed (Balanced University Distribution)</option>
            </select>
          </div>
        </div>

        {/* Section Pattern Specifications */}
        <div className="space-y-1.5">
          <label className="text-xs text-zinc-400 block">
            Custom Section Pattern & Allotment:
          </label>
          <textarea
            value={patternDetails}
            onChange={(e) => setPatternDetails(e.target.value)}
            rows={4}
            className="w-full bg-[#0a0a14] border border-red-950/60 rounded-xl p-3 text-xs text-zinc-200 font-mono focus:outline-none focus:border-red-500"
          />
          <span className="text-[11px] text-zinc-500">
            Specify Section A, Section B, Section C with question counts and internal choices.
          </span>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-red-glow flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white uppercase tracking-wider"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating Exam Paper...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Question Paper</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Paper Document Layout */}
      {generatedPaper && (
        <div className="p-8 sm:p-12 rounded-2xl bg-[#090912] border border-red-950/60 shadow-2xl space-y-8 animate-fade-in font-serif text-zinc-100">
          {/* Official University Header */}
          <div className="text-center space-y-2 border-b-2 border-zinc-800 pb-6">
            <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider font-sans text-white">
              END SEMESTER UNIVERSITY EXAMINATION
            </h2>
            <div className="text-sm font-semibold text-zinc-300 font-sans">
              Subject: <span className="text-white underline">{generatedPaper.title}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pt-2 font-sans">
              <span>Time Allowed: {generatedPaper.durationMinutes / 60} Hours</span>
              <span>Max Marks: {generatedPaper.totalMarks}</span>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-8">
            {(generatedPaper.sections || []).map((sec: any, sIdx: number) => (
              <div key={sIdx} className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <h3 className="text-base font-bold uppercase tracking-wider text-red-400 font-sans">
                    {sec.sectionName}
                  </h3>
                  <span className="text-xs font-mono text-zinc-400 font-sans">
                    [Total: {sec.totalMarks} Marks]
                  </span>
                </div>
                <p className="text-xs italic text-zinc-400 font-sans">{sec.instructions}</p>

                <div className="space-y-4 pl-2">
                  {(sec.questions || []).map((q: any, qIdx: number) => (
                    <div key={qIdx} className="space-y-2">
                      <div className="flex items-start justify-between gap-4 text-sm leading-relaxed">
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-red-400 font-sans">{q.questionNumber || `Q${qIdx + 1}.`}</span>
                          <span className="text-zinc-200">{q.text}</span>
                        </div>
                        <span className="font-mono text-xs text-zinc-400 font-sans font-bold flex-shrink-0">
                          [{q.marks} M]
                        </span>
                      </div>

                      {q.orOption && (
                        <div className="pl-6 pt-1 text-xs text-zinc-400 space-y-1">
                          <div className="font-bold font-sans text-red-500 uppercase tracking-widest text-[11px]">
                            OR
                          </div>
                          <div className="text-zinc-300">{q.orOption}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-8 border-t border-zinc-800 text-xs text-zinc-500 font-mono font-sans">
            *** END OF QUESTION PAPER ***
          </div>
        </div>
      )}
    </div>
  );
};
