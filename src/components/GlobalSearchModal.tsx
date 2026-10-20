import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  X,
  BookOpen,
  FileText,
  Flame,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const GlobalSearchModal: React.FC = () => {
  const {
    isGlobalSearchOpen,
    setIsGlobalSearchOpen,
    subjects,
    setActiveSubject,
    setSelectedTopicId,
    setActiveTab,
  } = useApp();

  const [query, setQuery] = useState('');

  // Handle escape and keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsGlobalSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isGlobalSearchOpen) return null;

  // Flatten searchable items
  const allResults: any[] = [];
  const q = query.toLowerCase().trim();

  subjects.forEach((subj) => {
    if (!q || subj.name.toLowerCase().includes(q)) {
      allResults.push({
        type: 'subject',
        title: subj.name,
        subtitle: `${subj.units.length} Units • ${subj.code || 'Curriculum'}`,
        subject: subj,
      });
    }

    subj.units.forEach((unit) => {
      unit.topics.forEach((topic) => {
        if (!q || topic.name.toLowerCase().includes(q) || topic.description?.toLowerCase().includes(q)) {
          allResults.push({
            type: 'topic',
            title: topic.name,
            subtitle: `${subj.name} • ${unit.name}`,
            subject: subj,
            topicId: topic.id,
            priority: topic.priority,
          });
        }
      });
    });
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-20 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl rounded-3xl bg-white border border-[#EEEAF4] shadow-[0_15px_50px_rgba(40,38,58,0.12)] overflow-hidden space-y-0 text-[#28263A]">
        {/* Search Input Bar */}
        <div className="p-4 bg-[#FFFDF9] border-b border-[#EEEAF4] flex items-center gap-3">
          <Search className="w-5 h-5 text-[#7C6EE6]" />
          <input
            type="text"
            autoFocus
            placeholder="Search subjects, units, algorithms, topics, or definitions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[#28263A] placeholder-[#777589] focus:outline-none"
          />
          <button
            onClick={() => setIsGlobalSearchOpen(false)}
            className="p-1 rounded-xl text-[#777589] hover:text-[#28263A] hover:bg-[#FFF9F2] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-1">
          {allResults.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#777589]">
              No results found for "{query}".
            </div>
          ) : (
            allResults.slice(0, 15).map((res, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setActiveSubject(res.subject);
                  if (res.topicId) {
                    setSelectedTopicId(res.topicId);
                    setActiveTab('notes');
                  } else {
                    setActiveTab('subject-detail');
                  }
                  setIsGlobalSearchOpen(false);
                }}
                className="p-3 rounded-2xl hover:bg-[#EAE5FF]/30 border border-transparent hover:border-[#D9D2F8] cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#EAE5FF] text-[#7C6EE6] flex items-center justify-center flex-shrink-0">
                    {res.type === 'subject' ? <BookOpen className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#28263A] group-hover:text-[#7C6EE6] transition-colors">
                      {res.title}
                    </div>
                    <div className="text-[11px] text-[#777589]">{res.subtitle}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {res.priority === 'very_important' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFE0D2] text-[#E5A044] border border-[#FFCBB3]">
                      🔥 High Yield
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 text-[#777589] group-hover:text-[#7C6EE6] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
