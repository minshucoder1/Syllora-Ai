import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  RefreshCw,
  Award,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

export const VoiceStudyView: React.FC = () => {
  const { activeSubject, subjects, showToast, triggerConfetti } = useApp();
  const currentSubject = activeSubject || subjects[0];

  const [activeMode, setActiveMode] = useState<'study' | 'viva'>('study');

  // Voice Study State
  const [isListening, setIsListening] = useState(false);
  const [spokenPrompt, setSpokenPrompt] = useState('');
  const [aiSpeechResponse, setAiSpeechResponse] = useState('');
  const [isLoadingStudy, setIsLoadingStudy] = useState(false);

  // Voice Viva State
  const [vivaQuestionIdx, setVivaQuestionIdx] = useState(0);
  const [vivaScore, setVivaScore] = useState(8);
  const [vivaCorrectCount, setVivaCorrectCount] = useState(2);
  const [vivaNeedsImproveCount, setVivaNeedsImproveCount] = useState(0);
  const [currentVivaQuestion, setCurrentVivaQuestion] = useState(
    'What is an Abstract Data Type (ADT) and how does it differ from a concrete data structure?'
  );
  const [vivaAnswer, setVivaAnswer] = useState('');
  const [evaluatingViva, setEvaluatingViva] = useState(false);
  const [vivaResult, setVivaResult] = useState<any>(null);

  // Speech-to-Text helper
  const startListening = (onTranscript: (t: string) => void) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast('Speech recognition not supported in this browser.', 'info');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        showToast('Listening to your voice...', 'info');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onTranscript(transcript);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Text-to-Speech audio reader
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Voice Study Query submission
  const handleVoiceStudyAsk = async (queryText?: string) => {
    const textToSend = queryText || spokenPrompt;
    if (!textToSend.trim()) return;

    setIsLoadingStudy(true);
    try {
      const res = await fetch('/api/ai/study-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          subjectContext: currentSubject?.name || 'Computer Science',
        }),
      });

      if (!res.ok) {
        showToast('AI response unavailable right now.', 'error');
        return;
      }

      const data = await res.json();
      setAiSpeechResponse(data.reply);
      speakText(data.reply);
    } catch {
      showToast('Error getting voice study response.', 'error');
    } finally {
      setIsLoadingStudy(false);
    }
  };

  // Viva oral evaluate
  const handleEvaluateViva = async () => {
    if (!vivaAnswer.trim()) {
      showToast('Please record or type your viva response.', 'error');
      return;
    }

    setEvaluatingViva(true);
    try {
      const res = await fetch('/api/ai/evaluate-voice-viva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentVivaQuestion,
          spokenAnswer: vivaAnswer,
          expectedConcept: 'Abstraction, data encapsulation, separation of interface from implementation',
        }),
      });

      if (!res.ok) {
        showToast('Unable to grade viva response.', 'error');
        return;
      }

      const data = await res.json();
      setVivaResult(data.evaluation);

      if (data.evaluation.isCorrect) {
        setVivaCorrectCount((c) => c + 1);
        triggerConfetti();
      } else {
        setVivaNeedsImproveCount((c) => c + 1);
      }
      setVivaScore(data.evaluation.score);
    } catch {
      showToast('Viva evaluation error.', 'error');
    } finally {
      setEvaluatingViva(false);
    }
  };

  const handleNextVivaQuestion = () => {
    if (vivaResult?.nextFollowUpQuestion) {
      setCurrentVivaQuestion(vivaResult.nextFollowUpQuestion);
    } else {
      const questions = [
        'Explain how circular queue overcomes the memory limitation of a simple linear queue.',
        'What is the best case, worst case, and average case time complexity of Quick Sort?',
        'How does an AVL tree maintain balance after an insertion that causes an LL imbalance?',
      ];
      setCurrentVivaQuestion(questions[(vivaQuestionIdx + 1) % questions.length]);
    }
    setVivaQuestionIdx((i) => i + 1);
    setVivaAnswer('');
    setVivaResult(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Mode Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel-heavy border border-red-950/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-red-400">
            <Mic className="w-4 h-4 text-red-500" />
            <span>VOICE-ASSISTED LEARNING & ORAL EXAM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Voice Study & Voice Viva</h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Speak natural doubts or take an interactive viva examination with real-time oral feedback.
          </p>
        </div>

        {/* Toggle Mode */}
        <div className="flex items-center p-1 bg-[#0c0c14] rounded-xl border border-red-950">
          <button
            onClick={() => setActiveMode('study')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'study'
                ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Voice Study Mode
          </button>
          <button
            onClick={() => setActiveMode('viva')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'viva'
                ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Voice Viva Mode
          </button>
        </div>
      </div>

      {activeMode === 'study' ? (
        /* VOICE STUDY MODE */
        <div className="space-y-6">
          <div className="glass-panel-heavy rounded-2xl p-8 border border-red-950/40 text-center space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white">Speak your question or doubt</h2>
              <p className="text-xs text-zinc-400">
                Example: “Explain circular queue in Hinglish” or “Compare stack and queue for 5 marks”
              </p>
            </div>

            {/* Large Microphone Circle */}
            <div className="relative inline-block">
              <button
                onClick={() =>
                  startListening((transcript) => {
                    setSpokenPrompt(transcript);
                    handleVoiceStudyAsk(transcript);
                  })
                }
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-red-600 text-white scale-110 shadow-[0_0_40px_rgba(239,68,68,0.8)] animate-pulse'
                    : 'bg-[#180a0e] hover:bg-red-950 text-red-500 border-2 border-red-600/50 shadow-[0_0_20px_rgba(220,38,38,0.3)]'
                }`}
              >
                <Mic className="w-10 h-10" />
              </button>
            </div>

            {/* Spoken Text Input */}
            <div className="max-w-xl mx-auto flex items-center gap-2">
              <input
                type="text"
                value={spokenPrompt}
                onChange={(e) => setSpokenPrompt(e.target.value)}
                placeholder="Or type what you want to ask..."
                className="flex-1 bg-[#0a0a14] border border-red-950/60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
              />
              <button
                onClick={() => handleVoiceStudyAsk()}
                disabled={isLoadingStudy}
                className="btn-red-glow px-4 py-2.5 rounded-xl text-xs font-bold text-white uppercase"
              >
                Ask
              </button>
            </div>
          </div>

          {/* AI Voice & Text Output */}
          {aiSpeechResponse && (
            <div className="p-6 rounded-2xl bg-[#090912] border border-red-950/40 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono uppercase text-red-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-red-500" />
                  <span>AI Study Answer</span>
                </span>
                <button
                  onClick={() => speakText(aiSpeechResponse)}
                  className="p-2 rounded-lg bg-zinc-900 text-zinc-300 hover:text-white"
                  title="Read Aloud"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <div className="text-sm text-zinc-200 leading-relaxed whitespace-pre-line font-sans">
                {aiSpeechResponse}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* VOICE VIVA MODE */
        <div className="space-y-6">
          {/* Viva Scoreboard */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-[#090910] border border-red-950/40 text-center">
              <div className="text-2xl font-bold text-white font-mono">{vivaScore}/10</div>
              <div className="text-[11px] text-zinc-400">Latest Viva Score</div>
            </div>
            <div className="p-4 rounded-xl bg-[#090910] border border-emerald-950/40 text-center">
              <div className="text-2xl font-bold text-emerald-400 font-mono">{vivaCorrectCount}</div>
              <div className="text-[11px] text-zinc-400">Satisfactory Answers</div>
            </div>
            <div className="p-4 rounded-xl bg-[#090910] border border-amber-950/40 text-center">
              <div className="text-2xl font-bold text-amber-400 font-mono">{vivaNeedsImproveCount}</div>
              <div className="text-[11px] text-zinc-400">Needs Improvement</div>
            </div>
          </div>

          {/* Question Examiner Card */}
          <div className="glass-panel-heavy rounded-2xl p-6 sm:p-8 border border-red-950/40 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-red-400 uppercase">
                Examiner Question #{vivaQuestionIdx + 1}
              </span>
              <button
                onClick={() => speakText(currentVivaQuestion)}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
              >
                <Volume2 className="w-4 h-4" /> <span>Read Question</span>
              </button>
            </div>

            <h3 className="text-lg font-bold text-white leading-relaxed">
              “{currentVivaQuestion}”
            </h3>

            {/* Answer Input */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-zinc-400">Speak or Type your Viva Answer:</label>
                <button
                  type="button"
                  onClick={() =>
                    startListening((transcript) => {
                      setVivaAnswer((prev) => (prev ? `${prev} ${transcript}` : transcript));
                    })
                  }
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
                    isListening
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-zinc-900 text-zinc-300 hover:text-white'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>{isListening ? 'Recording...' : 'Record Voice'}</span>
                </button>
              </div>

              <textarea
                value={vivaAnswer}
                onChange={(e) => setVivaAnswer(e.target.value)}
                placeholder="Speak through your microphone or type your spoken response here..."
                rows={4}
                className="w-full bg-[#0a0a14] border border-red-950/60 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500"
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={handleEvaluateViva}
                  disabled={evaluatingViva}
                  className="btn-red-glow flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white uppercase"
                >
                  {evaluatingViva ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Grading Viva...</span>
                    </>
                  ) : (
                    <span>Submit Oral Answer</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Viva Evaluation Feedback */}
          {vivaResult && (
            <div className="p-6 rounded-2xl bg-[#090912] border border-red-950/40 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-bold text-white">
                    Viva Evaluation: {vivaResult.score}/10
                  </span>
                </div>
                <span
                  className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                    vivaResult.isCorrect ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                  }`}
                >
                  {vivaResult.isCorrect ? 'Satisfactory' : 'Needs Improvement'}
                </span>
              </div>

              <p className="text-xs text-zinc-300">{vivaResult.feedback}</p>

              {/* Missing concepts */}
              {vivaResult.missingConcepts?.length > 0 && (
                <div className="space-y-1 text-xs">
                  <div className="text-red-400 font-bold font-mono">Missing Concepts:</div>
                  <ul className="space-y-1 text-zinc-400">
                    {vivaResult.missingConcepts.map((mc: string, i: number) => (
                      <li key={i}>• {mc}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Model Viva Answer */}
              <div className="p-3.5 rounded-xl bg-black/50 border border-zinc-900 text-xs space-y-1">
                <div className="text-emerald-400 font-bold">Ideal Oral Viva Response:</div>
                <div className="text-zinc-300 leading-relaxed">{vivaResult.improvedVivaAnswer}</div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleNextVivaQuestion}
                  className="btn-red-glow flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
