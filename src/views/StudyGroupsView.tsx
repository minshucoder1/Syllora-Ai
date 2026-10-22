import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  Plus,
  Send,
  Flame,
  Award,
  Shield,
  Sparkles,
  UserPlus,
} from 'lucide-react';

export const StudyGroupsView: React.FC = () => {
  const { user, showToast, triggerConfetti } = useApp();

  const [groups, setGroups] = useState<any[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string>('');
  const [newMessage, setNewMessage] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [newGroupSubject, setNewGroupSubject] = useState<string>('');

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
        if (data.groups?.length > 0 && !activeGroupId) {
          setActiveGroupId(data.groups[0].id);
        }
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeGroupId) return;

    try {
      const res = await fetch(`/api/groups/${activeGroupId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage }),
      });

      if (res.ok) {
        setNewMessage('');
        fetchGroups();
      }
    } catch {
      showToast('Error sending message.', 'error');
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName,
          subjectName: newGroupSubject || 'Computer Science',
        }),
      });

      if (res.ok) {
        setIsCreating(false);
        setNewGroupName('');
        setNewGroupSubject('');
        showToast('Private study group created!', 'success');
        triggerConfetti();
        fetchGroups();
      }
    } catch {
      showToast('Error creating group.', 'error');
    }
  };

  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7C6EE6]">
            <Users className="w-4 h-4 text-[#7C6EE6]" />
            <span>COLLABORATIVE STUDY CIRCLES</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#28263A]">Study Groups & Partners</h1>
          <p className="text-xs sm:text-sm text-[#777589]">
            Private study cohorts with shared syllabi, group discussions, and opt-in peer benchmark leaderboards.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="btn-pastel-primary flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create Group</span>
        </button>
      </div>

      {/* Creation Modal */}
      {isCreating && (
        <div className="p-6 rounded-3xl bg-white border border-[#EEEAF4] shadow-md space-y-4 animate-fade-in">
          <h3 className="text-sm font-bold text-[#28263A]">Create Private Study Circle</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Group Name (e.g. CSE 4th Sem Core)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="bg-[#FFFDF9] border border-[#EEEAF4] rounded-2xl px-4 py-2.5 text-xs text-[#28263A] focus:outline-none focus:border-[#7C6EE6]"
            />
            <input
              type="text"
              placeholder="Shared Subject (e.g. Data Structures)"
              value={newGroupSubject}
              onChange={(e) => setNewGroupSubject(e.target.value)}
              className="bg-[#FFFDF9] border border-[#EEEAF4] rounded-2xl px-4 py-2.5 text-xs text-[#28263A] focus:outline-none focus:border-[#7C6EE6]"
            />
          </div>
          <div className="flex justify-end gap-2.5">
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#777589] hover:text-[#28263A]"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateGroup}
              className="btn-pastel-primary px-5 py-2 rounded-2xl text-xs font-bold text-white shadow-sm"
            >
              Create Circle
            </button>
          </div>
        </div>
      )}

      {/* Groups Grid & Discussion */}
      {activeGroup ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Group Info & Leaderboard */}
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#7C6EE6] px-2.5 py-0.5 rounded-full bg-[#EAE5FF]">
                  {activeGroup.subjectName}
                </span>
                <span className="text-xs text-[#777589]">
                  Code: <span className="text-[#28263A] font-bold font-mono">{activeGroup.inviteCode}</span>
                </span>
              </div>
              <h2 className="text-base font-bold text-[#28263A]">{activeGroup.name}</h2>
              <p className="text-xs text-[#777589]">
                Privacy protected: Members only share verified accuracy and streak statistics.
              </p>
            </div>

            {/* Peer Benchmark Leaderboard */}
            <div className="p-5 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-[#28263A] font-mono uppercase">
                Group Leaderboard
              </h3>
              <div className="space-y-2">
                {(activeGroup.members || []).map((m: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-[#FFFDF9] border border-[#EEEAF4] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#777589]">#{idx + 1}</span>
                      <span className="font-bold text-[#28263A]">{m.userName}</span>
                    </div>
                    <div className="flex items-center gap-3 font-medium">
                      <span className="text-[#777589]">{m.topicsCount} Topics</span>
                      <span className="text-[#319B78] font-bold">{m.quizAccuracy}% Acc</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Group Discussion Feed (2 cols) */}
          <div className="lg:col-span-2 rounded-3xl bg-white border border-[#EEEAF4] shadow-sm p-6 flex flex-col justify-between min-h-[450px]">
            <div className="space-y-3 overflow-y-auto max-h-[360px] pr-2">
              <div className="text-xs font-semibold text-[#777589] uppercase pb-2 border-b border-[#EEEAF4]">
                Group Discussion & Shared Doubts
              </div>

              {(activeGroup.discussions || []).map((disc: any) => (
                <div key={disc.id} className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#EEEAF4] space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#7C6EE6]">{disc.userName}</span>
                    <span className="text-[#777589] text-[11px]">
                      {new Date(disc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#28263A] leading-relaxed">{disc.message}</p>
                </div>
              ))}
            </div>

            {/* Input field */}
            <div className="pt-4 flex items-center gap-2 border-t border-[#EEEAF4]">
              <input
                type="text"
                placeholder="Share a doubt, note link, or study question..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-[#FFFDF9] border border-[#EEEAF4] rounded-2xl px-4 py-2.5 text-xs text-[#28263A] focus:outline-none focus:border-[#7C6EE6]"
              />
              <button
                onClick={handleSendMessage}
                className="btn-pastel-primary p-2.5 rounded-2xl text-white shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
