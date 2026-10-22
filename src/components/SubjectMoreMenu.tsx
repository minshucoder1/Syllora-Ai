import React, { useState, useRef, useEffect } from 'react';
import { Subject } from '../types';
import { useApp } from '../context/AppContext';
import {
  MoreVertical,
  Edit3,
  Archive,
  ArchiveRestore,
  Trash2,
  BookOpen,
  Download,
} from 'lucide-react';

interface SubjectMoreMenuProps {
  subject: Subject;
  align?: 'left' | 'right';
  buttonClassName?: string;
  onOpenDetail?: () => void;
}

export const SubjectMoreMenu: React.FC<SubjectMoreMenuProps> = ({
  subject,
  align = 'right',
  buttonClassName,
  onOpenDetail,
}) => {
  const { setSubjectToRemove, setSubjectToEdit, archiveSubject, setActiveSubject, setActiveTab } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    setSubjectToEdit(subject);
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    await archiveSubject(subject.id, !subject.archived);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    setSubjectToRemove(subject);
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    if (onOpenDetail) {
      onOpenDetail();
    } else {
      setActiveSubject(subject);
      setActiveTab('subject-detail');
    }
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        aria-label="More options"
        className={
          buttonClassName ||
          'p-1.5 rounded-xl text-[#777589] hover:text-[#28263A] hover:bg-[#EAE5FF]/50 border border-transparent hover:border-[#EEEAF4] transition-all focus:outline-none'
        }
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-1.5 w-52 rounded-2xl bg-white border border-[#EEEAF4] shadow-[0_10px_35px_rgba(40,38,58,0.12)] z-50 py-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 text-[#28263A]`}
        >
          <div className="px-3 py-1.5 border-b border-[#EEEAF4] mb-1">
            <p className="text-[10px] uppercase text-[#777589] font-bold tracking-wider">
              Subject Options
            </p>
            <p className="text-xs font-bold text-[#28263A] truncate">{subject.name}</p>
          </div>

          <button
            onClick={handleView}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#28263A] hover:bg-[#EAE5FF]/40 hover:text-[#7C6EE6] transition-colors text-left cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#7C6EE6]" />
            <span>Open Curriculum</span>
          </button>

          {(subject.uploadedFileName || subject.uploadedFilePath) && (
            <a
              href={`/api/subjects/${subject.id}/file`}
              target="_blank"
              rel="noopener noreferrer"
              download={subject.uploadedFileName || 'syllabus'}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#28263A] hover:bg-[#EAE5FF]/40 hover:text-[#7C6EE6] transition-colors text-left cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#7C6EE6]" />
              <span>Download Original File</span>
            </a>
          )}

          <button
            onClick={handleEdit}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#28263A] hover:bg-[#EAE5FF]/40 hover:text-[#7C6EE6] transition-colors text-left cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-500" />
            <span>Edit Subject</span>
          </button>

          <button
            onClick={handleArchive}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#28263A] hover:bg-[#EAE5FF]/40 hover:text-[#7C6EE6] transition-colors text-left cursor-pointer"
          >
            {subject.archived ? (
              <>
                <ArchiveRestore className="w-3.5 h-3.5 text-[#319B78]" />
                <span>Restore to Dashboard</span>
              </>
            ) : (
              <>
                <Archive className="w-3.5 h-3.5 text-[#7C6EE6]" />
                <span>Archive Subject</span>
              </>
            )}
          </button>

          <div className="my-1 border-t border-[#EEEAF4]" />

          <button
            onClick={handleRemove}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-[#FFDCE8] transition-colors text-left group cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600 group-hover:scale-110 transition-transform" />
            <span>Remove Subject</span>
          </button>
        </div>
      )}
    </div>
  );
};
