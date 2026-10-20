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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel-heavy border border-red-950/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-red-400">
            <Users className="w-4 h-4 text-red-500" />
            <span>COLLABORATIVE STUDY CIRCLES</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Study Groups & Partners</h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Private study cohorts with shared syllabi, group discussions, and opt-in peer benchmark leaderboards.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="btn-red-glow flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white uppercase"
        >
          <Plus className="w-4 h-4" />
          <span>Create Group</span>
        </button>
      </div>

      {/* Creation Modal */}
      {isCreating && (
        <div className="p-6 rounded-2xl bg-[#0d0d18] border border-red-800/60 space-y-4 animate-fade-in">
          <h3 className="text-sm font-bold text-white">Create Private Study Circle</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Group Name (e.g. CSE 4th Sem Core)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="bg-[#08080f] border border-red-950/60 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-red-500"
            />
            <input
              type="text"
              placeholder="Shared Subject (e.g. Data Structures)"
              value={newGroupSubject}
              onChange={(e) => setNewGroupSubject(e.target.value)}
              className="bg-[#08080f] border border-red-950/60 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-red-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateGroup}
              className="btn-red-glow px-4 py-2 rounded-xl text-xs font-bold text-white"
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
            <div className="p-5 rounded-2xl bg-[#090912] border border-red-950/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-red-400 uppercase">
                  {activeGroup.subjectName}
                </span>
                <span className="text-xs font-mono text-zinc-400">
                  Invite Code: <span className="text-white font-bold">{activeGroup.inviteCode}</span>
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">{activeGroup.name}</h2>
              <p className="text-xs text-zinc-400">
                Privacy protected: Members only share verified accuracy and streak statistics.
              </p>
            </div>

            {/* Peer Benchmark Leaderboard */}
            <div className="p-5 rounded-2xl bg-[#090912] border border-red-950/40 space-y-3">
              <h3 className="text-xs font-bold text-white font-mono uppercase text-red-400">
                Group Leaderboard
              </h3>
              <div className="space-y-2">
                {(activeGroup.members || []).map((m: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#0f0f18] border border-zinc-900 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-zinc-500">#{idx + 1}</span>
                      <span className="font-bold text-zinc-200">{m.userName}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-zinc-400">{m.topicsCount} Topics</span>
                      <span className="text-emerald-400 font-bold">{m.quizAccuracy}% Acc</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Group Discussion Feed (2 cols) */}
          <div className="lg:col-span-2 rounded-2xl bg-[#08080e] border border-red-950/40 p-5 flex flex-col justify-between min-h-[450px]">
            <div className="space-y-3 overflow-y-auto max-h-[360px] pr-2">
              <div className="text-xs font-mono text-zinc-500 uppercase pb-2 border-b border-zinc-900">
                Group Discussion & Shared Doubts
              </div>

              {(activeGroup.discussions || []).map((disc: any) => (
                <div key={disc.id} className="p-3 rounded-xl bg-[#0f0f18] border border-zinc-900 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-red-400">{disc.userName}</span>
                    <span className="text-zinc-500 font-mono">
                      {new Date(disc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed">{disc.message}</p>
                </div>
              ))}
            </div>

            {/* Input field */}
            <div className="pt-4 flex items-center gap-2 border-t border-zinc-900">
              <input
                type="text"
                placeholder="Share a doubt, note link, or study question..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-[#0b0b14] border border-red-950/60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
              />
              <button
                onClick={handleSendMessage}
                className="btn-red-glow p-2.5 rounded-xl text-white"
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
