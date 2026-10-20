import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  Flame,
  Search,
  BookOpen,
  PlusCircle,
  Menu,
  X,
  Compass,
  Trophy,
  Zap,
  MessageCircle,
  MessageSquare,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    user,
    activeTab,
    setActiveTab,
    navigateTo,
    setIsGlobalSearchOpen,
    openSyllabusFlow,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 w-full bg-[#FFFDF9]/90 backdrop-blur-xl border-b border-[#EEEAF4] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab(user ? 'dashboard' : 'landing')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C6EE6] to-[#6A5AD6] flex items-center justify-center shadow-[0_4px_12px_rgba(124,110,230,0.25)] group-hover:scale-105 transition-all duration-300">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-[#28263A] flex items-center gap-1">
                  SYLLORA<span className="text-[#7C6EE6]">AI</span>
                </span>
                <span className="hidden sm:block text-[10px] text-[#777589] font-medium tracking-wide -mt-1">
                  Pastel Bloom • By Minshu Kumar
                </span>
              </div>
            </button>
          </div>

          {/* Global Search Bar (Center) */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <button
              onClick={() => setIsGlobalSearchOpen(true)}
              className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-white hover:bg-[#FFFDF9] border border-[#EEEAF4] hover:border-[#7C6EE6]/40 text-[#777589] hover:text-[#28263A] transition-all duration-200 shadow-sm group"
            >
              <span className="flex items-center gap-2.5 text-xs font-medium">
                <Search className="w-3.5 h-3.5 text-[#7C6EE6] group-hover:scale-110 transition-transform" />
                <span>Search notes, roadmaps, questions...</span>
              </span>
              <kbd className="text-[10px] bg-[#F7F5FA] text-[#777589] px-2 py-0.5 rounded border border-[#EEEAF4] font-mono">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Navigation / User Hub */}
          <div className="hidden md:flex items-center gap-2.5">
            {user ? (
              <>
                <button
                  onClick={() => openSyllabusFlow()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#CFF5E7]/70 hover:bg-[#CFF5E7] text-[#319B78] border border-[#CFF5E7] transition-all shadow-sm"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Syllabus</span>
                </button>

                <button
                  onClick={() => setActiveTab('ask-ai')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'ask-ai'
                      ? 'bg-[#7C6EE6] text-white shadow-[0_4px_12px_rgba(124,110,230,0.3)]'
                      : 'bg-[#EAE5FF] hover:bg-[#ded7ff] text-[#7C6EE6] border border-[#EAE5FF]'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>AI Study Tutor</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7C6EE6] animate-pulse ml-0.5" />
                </button>

                <button
                  onClick={() => setActiveTab('friend-chat')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'friend-chat'
                      ? 'bg-[#7C6EE6] text-white shadow-sm'
                      : 'bg-white hover:bg-[#F9F7FC] text-[#28263A] border border-[#EEEAF4]'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#7C6EE6]" />
                  <span>Friend Chat</span>
                </button>

                {/* Streak Pill */}
                <div
                  title="Daily Study Streak"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#FFE0D2]/60 border border-[#FFE0D2] text-[#28263A] text-xs font-medium"
                >
                  <Flame className="w-3.5 h-3.5 text-[#E5A044] animate-pulse" />
                  <span className="font-bold text-[#28263A]">{user.currentStreak}</span>
                  <span className="text-[10px] text-[#777589]">Days</span>
                </div>

                {/* XP Pill */}
                <div
                  title="Experience Points & Level"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#FFF0B8]/60 border border-[#FFF0B8] text-[#28263A] text-xs font-medium"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-bold text-[#28263A]">{user.xp} XP</span>
                  <span className="text-[10px] bg-white text-[#777589] px-1.5 py-0.2 rounded font-mono border border-[#EEEAF4]">
                    Lvl {user.level}
                  </span>
                </div>

                {/* Profile Trigger */}
                <button
                  onClick={() => setActiveTab('profile')}
                  className="flex items-center gap-2 pl-1 focus:outline-none group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7C6EE6] to-[#EAE5FF] p-[2px] shadow-sm group-hover:shadow-[0_2px_8px_rgba(124,110,230,0.3)] transition-all">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-bold text-xs text-[#7C6EE6]">
                      {user.name.charAt(0)}
                    </div>
                  </div>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    try {
                      sessionStorage.setItem('syllora_intended_destination', '/ask-ai');
                    } catch {}
                    setActiveTab('ask-ai');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#EAE5FF] hover:bg-[#ded7ff] border border-[#EAE5FF] text-[#7C6EE6] transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#7C6EE6]" />
                  <span>Try AI Tutor</span>
                </button>
                <button
                  onClick={() => navigateTo('/login')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#777589] hover:text-[#28263A] transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => navigateTo('/register')}
                  className="btn-pastel-primary px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white transition-all shadow-[0_4px_14px_rgba(124,110,230,0.3)]"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu trigger & Chat button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setActiveTab('ask-ai')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#EAE5FF] border border-[#EAE5FF] text-[#7C6EE6] shadow-sm transition-all"
              title="AI Study Tutor"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#7C6EE6]" />
              <span className="font-semibold">Tutor</span>
            </button>
            <button
              onClick={() => setIsGlobalSearchOpen(true)}
              className="p-2 rounded-xl text-[#777589] hover:text-[#28263A] hover:bg-[#EAE5FF]/40"
            >
              <Search className="w-4 h-4 text-[#7C6EE6]" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#777589] hover:text-[#28263A] hover:bg-[#EAE5FF]/40"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#EEEAF4] bg-[#FFFDF9]/95 px-4 pt-3 pb-5 space-y-2 shadow-lg">
          {user ? (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-[#EEEAF4]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#7C6EE6] flex items-center justify-center text-xs font-bold text-white shadow-sm">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#28263A]">{user.name}</div>
                    <div className="text-[10px] text-[#777589]">Level {user.level} • {user.xp} XP</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-[#28263A] bg-[#FFE0D2]/80 px-2 py-0.5 rounded-full font-medium">
                  <Flame className="w-3 h-3 text-[#E5A044]" /> {user.currentStreak} Days
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-[#28263A] hover:bg-[#EAE5FF]/40"
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  setActiveTab('ask-ai');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-[#7C6EE6] bg-[#EAE5FF]/50 flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-[#7C6EE6]" /> AI Study Chat Tutor
              </button>
              <button
                onClick={() => {
                  openSyllabusFlow();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-sm text-[#319B78] hover:bg-[#CFF5E7]/40 flex items-center gap-2 font-medium"
              >
                <PlusCircle className="w-4 h-4" /> Add Syllabus
              </button>
              <button
                onClick={() => {
                  setActiveTab('roadmap');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-sm text-[#28263A] hover:bg-[#EAE5FF]/40 flex items-center gap-2"
              >
                <Compass className="w-4 h-4 text-[#7C6EE6]" /> Study Roadmap
              </button>
              <button
                onClick={() => {
                  setActiveTab('friend-chat');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-sm text-[#28263A] hover:bg-[#EAE5FF]/40 flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-[#7C6EE6]" /> Chat with Friends
              </button>
              <button
                onClick={() => {
                  setActiveTab('profile');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-sm text-[#777589] hover:bg-[#EAE5FF]/40"
              >
                Profile & Achievements
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  try {
                    sessionStorage.setItem('syllora_intended_destination', '/ask-ai');
                  } catch {}
                  setActiveTab('ask-ai');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-[#7C6EE6] bg-[#EAE5FF] flex items-center gap-2 font-semibold"
              >
                <Sparkles className="w-4 h-4 text-[#7C6EE6]" /> Try AI Study Tutor
              </button>
              <button
                onClick={() => {
                  navigateTo('/login');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 text-sm text-[#28263A] bg-white border border-[#EEEAF4] rounded-xl font-medium"
              >
                Login
              </button>
              <button
                onClick={() => {
                  navigateTo('/register');
                  setMobileMenuOpen(false);
                }}
                className="btn-pastel-primary w-full py-2.5 text-sm text-white rounded-xl font-semibold shadow-sm"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
