import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  FileText,
  Flame,
  HelpCircle,
  CheckSquare,
  Binary,
  Layers,
  Calendar,
  Award,
  Mic,
  MessageSquare,
  MessageCircle,
  FileClock,
  CheckCircle2,
  GitBranch,
  Target,
  Code,
  Timer,
  AlertTriangle,
  FileSpreadsheet,
  BrainCircuit,
  Package,
  Users,
  Trophy,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Compass,
  LogOut,
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  count?: number;
  badge?: string;
  badgeColor?: string;
  isAction?: boolean;
}

interface MenuGroup {
  group: string;
  items: MenuItem[];
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, openSyllabusFlow, subjects, logout } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  const menuGroups: MenuGroup[] = [
    {
      group: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'ask-ai', label: 'AI Study Chat Tutor', icon: MessageSquare, badge: 'All-in-One', badgeColor: 'bg-[#EAE5FF] text-[#7C6EE6]' },
        { id: 'subjects', label: 'My Subjects', icon: BookOpen, count: subjects.length },
        { id: 'add-syllabus', label: 'Add Syllabus', icon: PlusCircle, isAction: true },
      ],
    },
    {
      group: 'Learn & Structure',
      items: [
        { id: 'notes', label: 'AI Notes', icon: FileText },
        { id: 'priority-topics', label: 'Priority Topics', icon: Flame, badge: 'High Yield', badgeColor: 'bg-[#FFE0D2] text-[#E5A044]' },
        { id: 'mindmaps', label: 'Mind Maps', icon: GitBranch },
        { id: 'cheatsheets', label: 'Cheat Sheet', icon: FileSpreadsheet },
      ],
    },
    {
      group: 'Practice & Exam',
      items: [
        { id: 'important-questions', label: 'Important Questions', icon: HelpCircle },
        { id: 'mcqs', label: 'MCQ Quiz', icon: CheckSquare },
        { id: 'numericals', label: 'Numericals & Design', icon: Binary },
        { id: 'flashcards', label: 'Flashcards', icon: Layers },
        { id: 'answer-checker', label: 'Answer Checker', icon: CheckCircle2 },
        { id: 'previous-papers', label: 'Previous Papers', icon: FileClock },
        { id: 'exam-prediction', label: 'Exam Prediction', icon: Target },
        { id: 'last-minute', label: 'Last-Minute Revision', icon: AlertTriangle, badge: 'Sprint', badgeColor: 'bg-[#FFE0D2] text-[#E5A044]' },
      ],
    },
    {
      group: 'Smart Planning',
      items: [
        { id: 'roadmap', label: 'Study Roadmap', icon: Compass, badge: 'Smart', badgeColor: 'bg-[#CFF5E7] text-[#319B78]' },
        { id: 'planner', label: 'Study Planner', icon: Calendar },
        { id: 'adaptive', label: 'Adaptive Engine', icon: BrainCircuit },
        { id: 'focus-mode', label: 'Focus Mode', icon: Timer },
        { id: 'study-pack', label: 'Complete Study Pack', icon: Package },
      ],
    },
    {
      group: 'Community & Profile',
      items: [
        { id: 'friend-chat', label: 'Chat with Friends', icon: MessageCircle, badge: 'Live', badgeColor: 'bg-[#FFDCE8] text-[#7C6EE6]' },
        { id: 'groups', label: 'Study Groups', icon: Users },
        { id: 'achievements', label: 'Achievements', icon: Trophy },
        { id: 'profile', label: 'Profile & Stats', icon: User },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={`relative z-30 flex-shrink-0 transition-all duration-300 ease-in-out border-r border-[#EEEAF4] bg-[#FFFDF9]/95 backdrop-blur-xl ${
        collapsed ? 'w-18' : 'w-64'
      } flex flex-col justify-between hidden md:flex shadow-sm`}
      style={{ height: 'calc(100vh - 4rem)' }}
    >
      {/* Scrollable Nav Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
        {menuGroups.map((grp) => (
          <div key={grp.group} className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#777589]">
                {grp.group}
              </div>
            )}
            <div className="space-y-0.5">
              {grp.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'add-syllabus') {
                        openSyllabusFlow();
                      } else {
                        setActiveTab(item.id);
                      }
                    }}
                    title={collapsed ? item.label : undefined}
                    className={`w-full group relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-[#EAE5FF] text-[#7C6EE6] font-semibold shadow-sm'
                        : 'text-[#777589] hover:text-[#28263A] hover:bg-[#EAE5FF]/40'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                        isActive
                          ? 'text-[#7C6EE6]'
                          : 'text-[#777589] group-hover:text-[#7C6EE6]'
                      }`}
                    />

                    {!collapsed && (
                      <span className="flex-1 text-left truncate">{item.label}</span>
                    )}

                    {!collapsed && item.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${item.badgeColor || 'bg-[#EAE5FF] text-[#7C6EE6]'}`}>
                        {item.badge}
                      </span>
                    )}

                    {!collapsed && item.count !== undefined && item.count > 0 && (
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-white text-[#777589] border border-[#EEEAF4] font-medium">
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Collapse & Logout Footer */}
      <div className="p-3 border-t border-[#EEEAF4] bg-[#FFFDF9] space-y-2">
        <button
          onClick={logout}
          title={collapsed ? 'Log Out' : undefined}
          className="w-full group flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#777589] hover:text-rose-600 hover:bg-rose-50 transition-all duration-200"
        >
          <LogOut className="w-4 h-4 text-[#777589] group-hover:text-rose-600 shrink-0 transition-transform group-hover:-translate-x-0.5" />
          {!collapsed && <span>Log Out</span>}
        </button>

        <div className="flex items-center justify-between pt-1 border-t border-[#EEEAF4]/80">
          {!collapsed && (
            <div className="flex items-center gap-2 px-1">
              <span className="w-2 h-2 rounded-full bg-[#319B78] animate-pulse" />
              <span className="text-[11px] text-[#777589] font-medium">Pastel Bloom Engine</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-xl text-[#777589] hover:text-[#28263A] hover:bg-[#EAE5FF]/50 transition-colors mx-auto"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
};
