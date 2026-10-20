import React, { useState, useEffect } from 'react';
import { Subject } from '../types';
import { useApp } from '../context/AppContext';
import { Edit3, X, Loader2, Calendar } from 'lucide-react';

interface EditSubjectModalProps {
  subject: Subject | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditSubjectModal: React.FC<EditSubjectModalProps> = ({
  subject,
  isOpen,
  onClose,
}) => {
  const { editSubject } = useApp();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [examDate, setExamDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && subject) {
      setName(subject.name || '');
      setCode(subject.code || '');
      setDescription(subject.description || '');
      setExamDate(subject.examDate || '');
      setError(null);
    }
  }, [isOpen, subject]);

  if (!isOpen || !subject) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Subject name cannot be empty.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const ok = await editSubject(subject.id, {
      name: name.trim(),
      code: code.trim() || undefined,
      description: description.trim() || undefined,
      examDate: examDate || undefined,
    });

    setIsSaving(false);
    if (ok) {
      onClose();
    } else {
      setError('Failed to update subject details. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-[#EEEAF4] shadow-[0_15px_50px_rgba(40,38,58,0.12)] overflow-hidden text-[#28263A]">
        {/* Header */}
        <div className="p-5 border-b border-[#EEEAF4] flex items-center justify-between bg-[#FFFDF9]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#EAE5FF] border border-[#D9D2F8] flex items-center justify-center text-[#7C6EE6]">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#28263A]">Edit Subject Details</h2>
              <p className="text-[11px] text-[#777589]">Modify course title and preparation schedule</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-[#777589] hover:text-[#28263A] p-1.5 rounded-xl hover:bg-[#FFF9F2] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-2xl bg-[#FFDCE8] border border-[#FFB8D2] text-rose-800 text-xs">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[#28263A] font-semibold">Subject Title *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Basic Mathematics"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#EEEAF4] focus:border-[#7C6EE6] focus:ring-2 focus:ring-[#7C6EE6]/20 focus:outline-none text-[#28263A] text-xs transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[#28263A] font-semibold">Course Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. MATH101"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#EEEAF4] focus:border-[#7C6EE6] focus:ring-2 focus:ring-[#7C6EE6]/20 focus:outline-none text-[#28263A] text-xs font-mono uppercase transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[#28263A] font-semibold flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#7C6EE6]" />
                  <span>Exam Target Date</span>
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#EEEAF4] focus:border-[#7C6EE6] focus:ring-2 focus:ring-[#7C6EE6]/20 focus:outline-none text-[#28263A] text-xs font-mono transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[#28263A] font-semibold">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Scope of this syllabus or semester module..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#EEEAF4] focus:border-[#7C6EE6] focus:ring-2 focus:ring-[#7C6EE6]/20 focus:outline-none text-[#28263A] text-xs leading-relaxed transition-colors resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-[#FFFDF9] border-t border-[#EEEAF4] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-[#FFF9F2] text-[#777589] hover:text-[#28263A] border border-[#EEEAF4] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#7C6EE6] hover:bg-[#6b5cd8] shadow-[0_4px_16px_rgba(124,110,230,0.3)] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
