import React, { useState, useEffect } from 'react';
import { Subject } from '../types';
import { useApp } from '../context/AppContext';
import {
  AlertTriangle,
  Trash2,
  Archive,
  X,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  FileText,
  HelpCircle,
  Binary,
  Layers,
  BookOpen,
  Sparkles,
  RefreshCw,
  Flame,
} from 'lucide-react';

interface RemoveSubjectModalProps {
  subject: Subject | null;
  isOpen: boolean;
  onClose: () => void;
}

interface DeletionSummary {
  counts: {
    units: number;
    topics: number;
    notes: number;
    questions: number;
    numericals: number;
    mcqs: number;
    flashcards: number;
    mindmaps: number;
    cheatsheets: number;
    studyPlans: number;
    previousPapers: number;
    examPredictions: number;
    generatedPapers: number;
    evaluations: number;
    studySessions: number;
  };
  preserved: {
    globalXp: number;
    currentStreak: number;
    longestStreak: number;
    achievementsCount: number;
  };
  subject: {
    hasUploadedFile: boolean;
    uploadedFileName?: string;
  };
}

export const RemoveSubjectModal: React.FC<RemoveSubjectModalProps> = ({
  subject,
  isOpen,
  onClose,
}) => {
  const { removeSubject, archiveSubject, setActiveTab, user } = useApp();

  const [confirmationInput, setConfirmationInput] = useState('');
  const [summary, setSummary] = useState<DeletionSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && subject) {
      setConfirmationInput('');
      setErrorMessage(null);
      setIsSuccess(false);
      setIsLoadingSummary(true);

      fetch(`/api/subjects/${subject.id}/deletion-summary`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setSummary(data);
          }
        })
        .catch((err) => {
          console.warn('Could not load deletion summary:', err);
        })
        .finally(() => {
          setIsLoadingSummary(false);
        });
    }
  }, [isOpen, subject]);

  if (!isOpen || !subject) return null;

  const isNameMatching = confirmationInput.trim() === subject.name.trim();

  const handlePermanentDelete = async () => {
    if (!isNameMatching || isDeleting) return;

    setIsDeleting(true);
    setErrorMessage(null);

    const result = await removeSubject(subject.id);

    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setActiveTab('subjects');
      }, 900);
    } else {
      setIsDeleting(false);
      setErrorMessage(
        result.error ||
          'Unable to remove this subject right now. The server or network interrupted the request.'
      );
    }
  };

  const handleArchiveInstead = async () => {
    if (isArchiving) return;
    setIsArchiving(true);
    setErrorMessage(null);

    const ok = await archiveSubject(subject.id, true);
    setIsArchiving(false);
    if (ok) {
      onClose();
      setActiveTab('subjects');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-white border border-[#EEEAF4] shadow-[0_15px_50px_rgba(40,38,58,0.12)] overflow-hidden text-[#28263A]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-[#EEEAF4] flex items-start justify-between gap-4 bg-[#FFFDF9]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#FFDCE8] border border-[#FFB8D2] flex items-center justify-center text-rose-600 shadow-sm">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#FFDCE8] text-rose-700 border border-[#FFB8D2]">
                  Destructive Action
                </span>
                {subject.code && (
                  <span className="text-[10px] font-mono text-[#777589]">
                    {subject.code}
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#28263A] mt-1">
                Remove {subject.name}?
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isDeleting || isArchiving}
            className="text-[#777589] hover:text-[#28263A] p-1.5 rounded-xl hover:bg-[#FFF9F2] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Main Description */}
          <div className="text-xs sm:text-sm text-[#777589] leading-relaxed space-y-2">
            <p>
              This will remove <strong className="text-[#28263A] font-bold">{subject.name}</strong> and its associated syllabus curriculum from your Syllora AI account.
            </p>
            <p className="text-rose-600 font-semibold flex items-center gap-1.5">
              <span>⚠️</span>
              <span>Permanent deletion cannot be undone. All generated study materials for this subject will be removed from the database.</span>
            </p>
          </div>

          {/* Breakdown of What Will Be Removed */}
          <div className="rounded-2xl bg-[#FFFDF9] border border-[#EEEAF4] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#28263A] uppercase tracking-wider flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Data To Be Permanently Deleted</span>
              </h3>
              {isLoadingSummary && (
                <span className="text-[10px] text-[#777589] flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin text-[#7C6EE6]" />
                  <span>Auditing...</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white border border-[#EEEAF4] flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-[#7C6EE6]" />
                <span className="text-[#777589]">
                  <strong className="text-[#28263A] font-bold">{summary?.counts.units ?? subject.units.length}</strong> Units
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-[#EEEAF4] flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[#7C6EE6]" />
                <span className="text-[#777589]">
                  <strong className="text-[#28263A] font-bold">{summary?.counts.topics ?? subject.units.reduce((a, u) => a + u.topics.length, 0)}</strong> Topics
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-[#EEEAF4] flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-[#777589]">
                  <strong className="text-[#28263A] font-bold">{summary?.counts.notes ?? '—'}</strong> AI Notes
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-[#EEEAF4] flex items-center gap-2">
                <HelpCircle className="w-3.5 h-3.5 text-[#7C6EE6]" />
                <span className="text-[#777589]">
                  <strong className="text-[#28263A] font-bold">{summary?.counts.questions ?? '—'}</strong> Questions
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-[#EEEAF4] flex items-center gap-2">
                <Binary className="w-3.5 h-3.5 text-[#E5A044]" />
                <span className="text-[#777589]">
                  <strong className="text-[#28263A] font-bold">{summary?.counts.numericals ?? '—'}</strong> Numericals
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-[#EEEAF4] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#7C6EE6]" />
                <span className="text-[#777589]">
                  <strong className="text-[#28263A] font-bold">{summary?.counts.flashcards ?? '—'}</strong> Flashcards
                </span>
              </div>
            </div>

            {summary?.subject.hasUploadedFile && (
              <p className="text-[11px] text-[#777589] pt-1 border-t border-[#EEEAF4]">
                📄 Associated syllabus file (<span className="text-[#28263A] font-medium">{summary.subject.uploadedFileName || 'document'}</span>) will also be deleted from server storage.
              </p>
            )}
          </div>

          {/* Account Preservation Safeguard */}
          <div className="rounded-2xl bg-[#CFF5E7] border border-[#A9E8D2] p-3.5 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-[#319B78] flex-shrink-0 mt-0.5" />
            <div className="text-xs text-[#28263A] leading-relaxed">
              <span className="font-bold text-[#319B78]">Global Account Stats Preserved:</span>{' '}
              Your total XP ({user?.xp || 280} XP), study streak ({user?.currentStreak || 7} days), and all unlocked achievements will <strong>not</strong> be reset.
            </div>
          </div>

          {/* Error Message if deletion failed */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-[#FFDCE8] border border-[#FFB8D2] text-xs text-rose-800 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
              <p className="text-[11px] text-[#777589]">
                Your subject has not been deleted. You can try again or close this dialog.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handlePermanentDelete}
                  className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] cursor-pointer"
                >
                  Try Again
                </button>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="px-3 py-1 rounded-xl bg-white border border-[#EEEAF4] text-[#777589] text-[11px] cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {isSuccess && (
            <div className="p-4 rounded-2xl bg-[#CFF5E7] border border-[#A9E8D2] text-[#319B78] flex items-center gap-3 animate-in zoom-in-95">
              <CheckCircle2 className="w-5 h-5 text-[#319B78]" />
              <div className="text-xs font-bold text-[#28263A]">
                Subject removed successfully. Redirecting to My Subjects...
              </div>
            </div>
          )}

          {/* Optional Safe Archive Choice */}
          {!subject.archived && !isSuccess && (
            <div className="p-3.5 rounded-2xl bg-[#EAE5FF] border border-[#D9D2F8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-[#7C6EE6] flex items-center gap-1.5">
                  <Archive className="w-3.5 h-3.5 text-[#7C6EE6]" />
                  <span>Safer Alternative: Archive Subject</span>
                </div>
                <p className="text-[11px] text-[#777589] mt-0.5">
                  Hides it from your active dashboard while preserving all study materials and progress. You can restore it anytime.
                </p>
              </div>

              <button
                type="button"
                onClick={handleArchiveInstead}
                disabled={isArchiving || isDeleting}
                className="flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#7C6EE6] hover:bg-[#6b5cd8] text-white transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isArchiving ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Archiving...</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-3.5 h-3.5" />
                    <span>Archive Subject</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Permanent Confirmation Input Safeguard */}
          {!isSuccess && (
            <div className="space-y-2 pt-2 border-t border-[#EEEAF4]">
              <label className="block text-xs text-[#777589] font-medium">
                To confirm permanent deletion, type{' '}
                <span className="font-bold text-[#28263A] bg-[#FFF9F2] px-1.5 py-0.5 rounded border border-[#EEEAF4] select-all">
                  {subject.name}
                </span>{' '}
                below:
              </label>

              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder={`Type "${subject.name}" to confirm`}
                disabled={isDeleting}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#EEEAF4] focus:border-rose-400 focus:ring-2 focus:ring-rose-200 focus:outline-none text-[#28263A] text-xs sm:text-sm font-mono placeholder:text-[#777589]/60 transition-colors"
              />
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-5 sm:p-6 bg-[#FFFDF9] border-t border-[#EEEAF4] flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting || isArchiving}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white hover:bg-[#FFF9F2] text-[#777589] hover:text-[#28263A] border border-[#EEEAF4] transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handlePermanentDelete}
            disabled={!isNameMatching || isDeleting || isSuccess}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              isNameMatching && !isDeleting && !isSuccess
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm cursor-pointer'
                : 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed opacity-60'
            }`}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Removing...</span>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#319B78]" />
                <span>Removed</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5 text-white" />
                <span>🗑 Remove Permanently</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
