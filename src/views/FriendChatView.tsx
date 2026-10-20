import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import {
  MessageCircle,
  PlusCircle,
  LogIn,
  Copy,
  Check,
  Share2,
  Users,
  Send,
  Trash2,
  Lock,
  ArrowLeft,
  Crown,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Clock,
  Shield,
  Code,
  FileText,
  ChevronDown,
  Info,
  Circle,
  CheckCheck,
} from 'lucide-react';

interface ChatRoom {
  id: string;
  roomCode: string;
  name?: string;
  topic?: string;
  subjectId?: string;
  createdBy: string;
  status: 'active' | 'closed';
  maxMembers: number;
  createdAt: string;
  expiresAt?: string;
  lastActivityAt: string;
  role?: 'owner' | 'member';
  memberCount?: number;
  onlineCount?: number;
  lastMessage?: {
    content: string;
    senderName: string;
    createdAt: string;
  } | null;
  unreadCount?: number;
}

interface ChatRoomMember {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userCollege?: string;
  role: 'owner' | 'member';
  joinedAt: string;
  lastSeenAt: string;
  isOnline?: boolean;
}

interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: 'text' | 'system' | 'code' | 'file';
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;
  deletedForAll?: boolean;
}

export const FriendChatView: React.FC = () => {
  const { user, token, showToast, triggerConfetti, navigateTo } = useApp();

  // Navigation / View State
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [myRooms, setMyRooms] = useState<ChatRoom[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  // Creation State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomTopic, setNewRoomTopic] = useState('');
  const [newRoomMaxMembers, setNewRoomMaxMembers] = useState(10);
  const [isCreating, setIsCreating] = useState(false);
  const [createdRoomInfo, setCreatedRoomInfo] = useState<ChatRoom | null>(null);

  // Joining State
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<ChatRoomMember[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messageMode, setMessageMode] = useState<'text' | 'code'>('text');
  const [isMembersDrawerOpen, setIsMembersDrawerOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // WebSocket Ref
  const wsRef = useRef<WebSocket | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const shouldAutoScrollRef = useRef<boolean>(true);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  // Confirmation Modals
  const [confirmCloseModal, setConfirmCloseModal] = useState(false);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);
  const [confirmLeaveModal, setConfirmLeaveModal] = useState(false);

  // Auth Header helper
  const getAuthHeaders = useCallback(() => {
    const activeToken = token || localStorage.getItem('syllora_session_token') || localStorage.getItem('studyai_session_token');
    return {
      'Content-Type': 'application/json',
      ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
    };
  }, [token]);

  // Load user's rooms
  const fetchMyRooms = useCallback(async () => {
    try {
      setIsLoadingRooms(true);
      const res = await fetch('/api/chat/rooms/my', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setMyRooms(data.rooms || []);
      }
    } catch (err) {
      console.warn('Failed to fetch chat rooms', err);
    } finally {
      setIsLoadingRooms(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    if (user) {
      fetchMyRooms();
    }
  }, [user, fetchMyRooms]);

  // Check URL query param for room code (e.g. ?room=SYL-7K9P2X)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setJoinCodeInput(roomParam.trim().toUpperCase());
    }
  }, []);

  // Scroll to bottom helper
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  const handleScroll = () => {
    if (!chatScrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    shouldAutoScrollRef.current = isAtBottom;
    setShowScrollBottomBtn(!isAtBottom);
  };

  // Fetch Room Details & Messages
  const enterRoom = useCallback(
    async (room: ChatRoom) => {
      setActiveRoom(room);
      setJoinError(null);
      setMessages([]);
      setMembers([]);

      try {
        // Fetch room info & members
        const detailsRes = await fetch(`/api/chat/rooms/${room.id}`, {
          headers: getAuthHeaders(),
        });
        if (detailsRes.ok) {
          const detailsData = await detailsRes.json();
          setMembers(detailsData.members || []);
          setActiveRoom(detailsData.room || room);
        }

        // Fetch messages
        const msgsRes = await fetch(`/api/chat/rooms/${room.id}/messages?limit=60`, {
          headers: getAuthHeaders(),
        });
        if (msgsRes.ok) {
          const msgsData = await msgsRes.json();
          setMessages(msgsData.messages || []);
          setTimeout(() => scrollToBottom(false), 80);
        }
      } catch (err) {
        console.warn('Failed to load room details', err);
      }
    },
    [getAuthHeaders]
  );

  // Real-Time WebSocket Connection Lifecycle
  useEffect(() => {
    if (!activeRoom || !user) return;

    const activeToken = token || localStorage.getItem('syllora_session_token') || localStorage.getItem('studyai_session_token') || '';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/chat?token=${encodeURIComponent(activeToken)}&roomId=${encodeURIComponent(activeRoom.id)}`;

    let ws: WebSocket | null = null;
    let sse: EventSource | null = null;
    let isCleanedUp = false;

    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[Friend Chat] WebSocket connected to room', activeRoom.id);
        ws?.send(
          JSON.stringify({
            event: 'join_room',
            data: { roomId: activeRoom.id, token: activeToken },
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { event: evType, data } = payload;

          if (evType === 'new_message') {
            setMessages((prev) => {
              // Idempotent: avoid duplicate if already received
              if (prev.some((m) => m.id === data.id)) return prev;
              return [...prev, data];
            });
            if (shouldAutoScrollRef.current) {
              setTimeout(() => scrollToBottom(true), 60);
            }
          } else if (evType === 'presence_update') {
            if (Array.isArray(data.onlineUserIds)) {
              setOnlineUserIds(data.onlineUserIds);
              setMembers((prev) =>
                prev.map((m) => ({
                  ...m,
                  isOnline: data.onlineUserIds.includes(m.userId) || m.userId === user.id,
                }))
              );
            }
          } else if (evType === 'user_joined') {
            if (data.member) {
              setMembers((prev) => {
                if (prev.some((m) => m.userId === data.member.userId)) return prev;
                return [...prev, data.member];
              });
            }
            if (data.message) {
              setMessages((prev) => (prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]));
            }
          } else if (evType === 'user_left') {
            if (data.userId) {
              setMembers((prev) => prev.filter((m) => m.userId !== data.userId));
            }
            if (data.message) {
              setMessages((prev) => (prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]));
            }
            if (data.newOwnerId && activeRoom) {
              setActiveRoom((prev) => (prev ? { ...prev, createdBy: data.newOwnerId } : null));
            }
          } else if (evType === 'user_typing') {
            if (data.isTyping) {
              setTypingUsers((prev) => Array.from(new Set([...prev, data.userName || 'Someone'])));
            } else {
              setTypingUsers((prev) => prev.filter((u) => u !== data.userName));
            }
          } else if (evType === 'message_deleted') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === data.messageId
                  ? { ...m, content: 'This message was deleted', deletedForAll: true }
                  : m
              )
            );
          } else if (evType === 'room_closed') {
            setActiveRoom((prev) => (prev ? { ...prev, status: 'closed' } : null));
            showToast('The room was closed by the host.', 'info');
          } else if (evType === 'room_deleted') {
            showToast('The room was deleted by the host.', 'info');
            setActiveRoom(null);
            fetchMyRooms();
          }
        } catch (err) {
          console.warn('Failed to parse incoming WebSocket message', err);
        }
      };

      ws.onerror = () => {
        console.warn('[Friend Chat] WebSocket error, fallback to SSE active');
      };

      ws.onclose = () => {
        if (!isCleanedUp) {
          console.log('[Friend Chat] WebSocket disconnected');
        }
      };
    } catch (wsErr) {
      console.warn('[Friend Chat] WebSocket initialization error', wsErr);
    }

    // Secondary fallback: Server-Sent Events (SSE)
    try {
      const sseUrl = `/api/chat/rooms/${activeRoom.id}/stream?token=${encodeURIComponent(activeToken)}`;
      sse = new EventSource(sseUrl);
      sseRef.current = sse;

      sse.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { event: evType, data } = payload;
          if (evType === 'new_message') {
            setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
            if (shouldAutoScrollRef.current) {
              setTimeout(() => scrollToBottom(true), 60);
            }
          } else if (evType === 'message_deleted') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === data.messageId
                  ? { ...m, content: 'This message was deleted', deletedForAll: true }
                  : m
              )
            );
          } else if (evType === 'room_closed') {
            setActiveRoom((prev) => (prev ? { ...prev, status: 'closed' } : null));
          }
        } catch {
          // Heartbeat or parse skip
        }
      };
    } catch (sseErr) {
      console.warn('SSE fallback error', sseErr);
    }

    // Polling fallback to guarantee zero missed messages even across network switch
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/rooms/${activeRoom.id}/messages?limit=25`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.messages)) {
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const newMsgs = data.messages.filter((m: ChatMessage) => !existingIds.has(m.id));
              if (newMsgs.length > 0) {
                return [...prev, ...newMsgs];
              }
              return prev;
            });
          }
        }
      } catch {
        // Silently ignore background poll errors
      }
    }, 4500);

    return () => {
      isCleanedUp = true;
      clearInterval(pollInterval);
      if (ws) {
        ws.close();
      }
      if (sse) {
        sse.close();
      }
    };
  }, [activeRoom?.id, token, user, getAuthHeaders, showToast, fetchMyRooms]);

  // Handle typing debounce
  const handleTypingEvent = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !activeRoom) return;

    wsRef.current.send(
      JSON.stringify({
        event: 'typing',
        data: { roomId: activeRoom.id, isTyping: true },
      })
    );

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && activeRoom) {
        wsRef.current.send(
          JSON.stringify({
            event: 'typing',
            data: { roomId: activeRoom.id, isTyping: false },
          })
        );
      }
    }, 2000);
  };

  // Create Room Action
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to create a private chat room.', 'info');
      navigateTo('/login');
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newRoomName.trim() || undefined,
          topic: newRoomTopic.trim() || undefined,
          maxMembers: newRoomMaxMembers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create room');
      }

      setCreatedRoomInfo(data.room);
      await fetchMyRooms();
      triggerConfetti();
      showToast(`Room created! Code: ${data.room.roomCode}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Error creating room', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  // Join Room Action
  const handleJoinRoom = async (codeToJoin?: string) => {
    if (!user) {
      showToast('Please sign in to join a friend chat room.', 'info');
      navigateTo('/login');
      return;
    }

    const code = (codeToJoin || joinCodeInput).trim().toUpperCase();
    if (!code) {
      setJoinError('Please enter a room code.');
      return;
    }

    setIsJoining(true);
    setJoinError(null);

    try {
      const res = await fetch('/api/chat/rooms/join', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ roomCode: code }),
      });

      const data = await res.json();
      if (!res.ok) {
        setJoinError(data.error || 'Unable to join room. Please check the code.');
        return;
      }

      showToast(`Joined room: ${data.room.name || data.room.roomCode}!`, 'success');
      setJoinCodeInput('');
      await fetchMyRooms();
      await enterRoom(data.room);
      triggerConfetti();
    } catch (err: any) {
      setJoinError(err.message || 'Network error joining room.');
    } finally {
      setIsJoining(false);
    }
  };

  // Send Message Action
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeRoom || !user || isSending) return;

    const trimmed = messageInput.trim();
    if (!trimmed) return;

    if (activeRoom.status === 'closed') {
      showToast('This room is closed. Messages cannot be sent.', 'error');
      return;
    }

    setIsSending(true);

    // Optimistic message display
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      roomId: activeRoom.id,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      content: trimmed,
      messageType: messageMode,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setMessageInput('');
    setTimeout(() => scrollToBottom(true), 40);

    // Stop typing state
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          event: 'typing',
          data: { roomId: activeRoom.id, isTyping: false },
        })
      );
    }

    try {
      // 1. Try WebSocket fast send
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            event: 'send_message',
            data: {
              roomId: activeRoom.id,
              content: trimmed,
              messageType: messageMode,
            },
          })
        );
      } else {
        // 2. HTTP REST send fallback
        const res = await fetch(`/api/chat/rooms/${activeRoom.id}/messages`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            content: trimmed,
            messageType: messageMode,
          }),
        });
        const data = await res.json();
        if (res.ok && data.message) {
          // Replace optimistic message with server message
          setMessages((prev) => prev.map((m) => (m.id === tempId ? data.message : m)));
        } else {
          throw new Error(data.error || 'Failed to send');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to send message', 'error');
      // Rollback optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setMessageInput(trimmed);
    } finally {
      setIsSending(false);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!activeRoom || !user) return;
    try {
      // Try WebSocket first
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            event: 'delete_message',
            data: { roomId: activeRoom.id, messageId },
          })
        );
      }

      // REST delete
      const res = await fetch(`/api/chat/rooms/${activeRoom.id}/messages/${messageId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, content: 'This message was deleted', deletedForAll: true } : m
          )
        );
        showToast('Message deleted', 'info');
      }
    } catch {
      showToast('Could not delete message', 'error');
    }
  };

  // Close Room Action (Owner only)
  const handleCloseRoom = async () => {
    if (!activeRoom || !user) return;
    try {
      const res = await fetch(`/api/chat/rooms/${activeRoom.id}/close`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setActiveRoom((prev) => (prev ? { ...prev, status: 'closed' } : null));
        setConfirmCloseModal(false);
        showToast('Room closed. No further messages can be sent.', 'info');
        await fetchMyRooms();
      }
    } catch {
      showToast('Failed to close room', 'error');
    }
  };

  // Delete Room Action (Owner only)
  const handleDeleteRoom = async () => {
    if (!activeRoom || !user) return;
    try {
      const res = await fetch(`/api/chat/rooms/${activeRoom.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setConfirmDeleteModal(false);
        setActiveRoom(null);
        showToast('Room deleted permanently.', 'info');
        await fetchMyRooms();
      }
    } catch {
      showToast('Failed to delete room', 'error');
    }
  };

  // Leave Room Action (Member only)
  const handleLeaveRoom = async () => {
    if (!activeRoom || !user) return;
    try {
      const res = await fetch(`/api/chat/rooms/${activeRoom.id}/leave`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setConfirmLeaveModal(false);
        setActiveRoom(null);
        showToast('You left the room.', 'info');
        await fetchMyRooms();
      }
    } catch {
      showToast('Failed to leave room', 'error');
    }
  };

  // Copy helpers
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    showToast(`Room code copied: ${code}`, 'success');
    setTimeout(() => setCopiedCode(false), 2200);
  };

  const handleShareInvite = (room: ChatRoom) => {
    const inviteUrl = `${window.location.origin}/friend-chat?room=${room.roomCode}`;
    const text = `Hey! Join my study room "${room.name || 'Study Room'}" on Syllora AI. Room Code: ${room.roomCode}\n${inviteUrl}`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    showToast('Invitation and link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    showToast('Message copied to clipboard', 'info');
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // Format timestamp helper
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const isOwner = activeRoom?.createdBy === user?.id;

  // -------------------------------------------------------------
  // RENDER: Active Room Chat View
  // -------------------------------------------------------------
  if (activeRoom) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
        {/* Chat Main Container Card */}
        <div className="flex-1 flex overflow-hidden rounded-2xl bg-[#080810] border border-red-950/60 shadow-2xl relative">
          {/* Main Chat Column */}
          <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-[#090913] to-[#06060c]">
            {/* Room Header */}
            <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-red-950/50 bg-[#0a0a14]/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0 z-10">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => {
                    setActiveRoom(null);
                    fetchMyRooms();
                  }}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors"
                  title="Back to Rooms Lobby"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-extrabold text-white truncate">
                      {activeRoom.name || 'Study Room'}
                    </h2>
                    {activeRoom.status === 'active' ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-900 text-zinc-400 border border-zinc-800 shrink-0">
                        <Lock className="w-2.5 h-2.5" /> Closed
                      </span>
                    )}
                  </div>
                  {activeRoom.topic && (
                    <p className="text-[11px] text-zinc-400 truncate">{activeRoom.topic}</p>
                  )}
                </div>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Room Code Badge */}
                <button
                  onClick={() => handleCopyCode(activeRoom.roomCode)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-800/50 hover:border-red-600/70 transition-all shadow-[0_0_12px_rgba(220,38,38,0.2)] group"
                  title="Click to copy Room Code"
                >
                  <span className="text-[10px] text-red-400/80 uppercase">Code:</span>
                  <span>{activeRoom.roomCode}</span>
                  {copiedCode ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-red-400 group-hover:scale-110 transition-transform" />
                  )}
                </button>

                {/* Share Link */}
                <button
                  onClick={() => handleShareInvite(activeRoom)}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition-colors"
                  title="Share invitation link"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-red-400" />}
                  <span>Share</span>
                </button>

                {/* Members Drawer Toggle */}
                <button
                  onClick={() => setIsMembersDrawerOpen(!isMembersDrawerOpen)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                    isMembersDrawerOpen
                      ? 'bg-red-950/80 text-red-300 border-red-700'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                  }`}
                  title="View room members"
                >
                  <Users className="w-3.5 h-3.5 text-red-400" />
                  <span>{members.length}</span>
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div
              ref={chatScrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-3.5 relative"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-red-950/40 border border-red-800/40 flex items-center justify-center text-red-400 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
                    <MessageCircle className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-white">Room Ready • Start The Conversation!</h3>
                  <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
                    Share your room code <span className="font-mono text-red-400 font-bold">{activeRoom.roomCode}</span> with your study partner. Messages are securely saved and delivered in real-time.
                  </p>
                  <button
                    onClick={() => handleCopyCode(activeRoom.roomCode)}
                    className="btn-red-glow px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Room Code</span>
                  </button>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  const isSystem = msg.messageType === 'system';

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-2">
                        <div className="px-3.5 py-1 rounded-full bg-red-950/30 border border-red-900/30 text-[11px] text-zinc-400 flex items-center gap-1.5 font-mono shadow-sm">
                          <Sparkles className="w-3 h-3 text-red-400" />
                          <span>{msg.content}</span>
                          <span className="text-[10px] text-zinc-400 ml-1">{formatTime(msg.createdAt)}</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                    >
                      {/* Sender Meta */}
                      <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-zinc-400">
                        <span className="font-semibold text-zinc-300">
                          {isMe ? 'You' : msg.senderName}
                        </span>
                        <span>•</span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>

                      {/* Message Bubble */}
                      <div className="relative max-w-[85%] sm:max-w-lg">
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed break-words shadow-md transition-all ${
                            isMe
                              ? 'bg-gradient-to-br from-red-600 via-red-700 to-rose-700 text-white rounded-tr-sm border border-red-500/40'
                              : 'bg-[#10101c] text-zinc-100 rounded-tl-sm border border-red-950/50 hover:border-red-900/40'
                          } ${msg.deletedForAll ? 'italic text-zinc-400 bg-zinc-900/60 border-zinc-800' : ''}`}
                        >
                          {msg.messageType === 'code' ? (
                            <pre className="font-mono text-xs p-2.5 rounded-lg bg-black/60 text-emerald-300 overflow-x-auto border border-emerald-900/40 my-1">
                              <code>{msg.content}</code>
                            </pre>
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          )}
                        </div>

                        {/* Hover Actions Bar */}
                        {!msg.deletedForAll && (
                          <div
                            className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#080810] border border-zinc-800 p-1 rounded-lg shadow-lg z-10 ${
                              isMe ? '-left-16' : '-right-16'
                            }`}
                          >
                            <button
                              onClick={() => handleCopyMessage(msg.id, msg.content)}
                              className="p-1 hover:text-white text-zinc-400 hover:bg-zinc-800 rounded transition-colors"
                              title="Copy message text"
                            >
                              {copiedMsgId === msg.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            {(isMe || isOwner) && (
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="p-1 hover:text-red-400 text-zinc-400 hover:bg-red-950/40 rounded transition-colors"
                                title="Delete message"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Real-Time Typing Indicator */}
              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-zinc-400 italic py-1 animate-pulse">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Scroll to bottom button */}
            {showScrollBottomBtn && (
              <button
                onClick={() => scrollToBottom(true)}
                className="absolute bottom-20 right-8 px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-semibold shadow-xl hover:bg-red-500 flex items-center gap-1.5 transition-all animate-bounce z-20"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>New messages</span>
              </button>
            )}

            {/* Chat Input Bar */}
            <div className="p-3 sm:p-4 border-t border-red-950/50 bg-[#090914] shrink-0">
              {activeRoom.status === 'closed' ? (
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4 text-zinc-500" />
                  <span>This room has been closed by the host. Messages can no longer be sent.</span>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMessageMode(messageMode === 'text' ? 'code' : 'text')}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors ${
                          messageMode === 'code'
                            ? 'bg-red-950 text-red-300 border border-red-800/60'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                        title="Toggle code/numerical formula formatting"
                      >
                        <Code className="w-3 h-3 text-red-400" />
                        <span>Code/Formula</span>
                      </button>
                    </div>
                    <span className="hidden sm:inline text-zinc-400">
                      Press <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-300">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-300">Shift+Enter</kbd> for newline
                    </span>
                  </div>

                  <div className="flex items-end gap-2 bg-[#05050a] border border-red-950/70 focus-within:border-red-600/70 rounded-xl p-1.5 transition-all shadow-inner">
                    <textarea
                      value={messageInput}
                      onChange={(e) => {
                        setMessageInput(e.target.value);
                        handleTypingEvent();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      rows={1}
                      placeholder={
                        messageMode === 'code'
                          ? 'Paste code snippet or formula here...'
                          : 'Type a message to your study friend...'
                      }
                      className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none resize-none max-h-32 min-h-[36px]"
                    />

                    <button
                      type="submit"
                      disabled={!messageInput.trim() || isSending}
                      className={`btn-red-glow p-2 rounded-lg text-white font-semibold transition-all shrink-0 ${
                        !messageInput.trim() || isSending ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                      title="Send message"
                    >
                      {isSending ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Members & Room Info Slide-Out Panel */}
          {isMembersDrawerOpen && (
            <div className="w-72 sm:w-80 border-l border-red-950/50 bg-[#090914] flex flex-col justify-between shrink-0 animate-in slide-in-from-right duration-200 z-20">
              <div className="p-4 space-y-5 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-red-500" />
                    <h3 className="text-sm font-bold text-white">Room Members</h3>
                  </div>
                  <span className="text-xs font-mono text-zinc-400">
                    {members.length}/{activeRoom.maxMembers}
                  </span>
                </div>

                {/* Member List */}
                <div className="space-y-2">
                  {members.map((mem) => {
                    const isMemOwner = mem.role === 'owner' || mem.userId === activeRoom.createdBy;
                    const isOnline = onlineUserIds.includes(mem.userId) || mem.userId === user?.id;

                    return (
                      <div
                        key={mem.id}
                        className="p-2.5 rounded-xl bg-[#0e0e1a] border border-red-950/30 flex items-center justify-between gap-2.5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-800 to-rose-600 flex items-center justify-center text-xs font-bold text-white uppercase shadow-sm">
                              {mem.userName.charAt(0)}
                            </div>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0e0e1a] ${
                                isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
                              }`}
                              title={isOnline ? 'Online now' : 'Offline'}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-zinc-200 truncate">
                                {mem.userName}
                              </span>
                              {isMemOwner && (
                                <span title="Room Host" className="inline-flex">
                                  <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-400 block truncate">
                              {isOnline ? 'Active in room' : 'Away'}
                            </span>
                          </div>
                        </div>

                        {mem.userId === user?.id && (
                          <span className="text-[10px] font-mono text-red-400 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800/40">
                            You
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Room Invitation Card */}
                <div className="p-3.5 rounded-xl bg-[#05050c] border border-red-900/40 space-y-2.5">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                    Invite Friend
                  </span>
                  <div className="flex items-center justify-between bg-zinc-900/90 rounded-lg p-2 border border-zinc-800">
                    <span className="text-xs font-mono font-bold text-red-300 tracking-wider">
                      {activeRoom.roomCode}
                    </span>
                    <button
                      onClick={() => handleCopyCode(activeRoom.roomCode)}
                      className="p-1 text-zinc-400 hover:text-white"
                      title="Copy code"
                    >
                      {copiedCode ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => handleShareInvite(activeRoom)}
                    className="w-full py-1.5 rounded-lg text-xs font-semibold bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800/50 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Copy Full Invitation</span>
                  </button>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-4 border-t border-zinc-800/80 bg-[#06060c] space-y-2">
                {isOwner ? (
                  <>
                    {activeRoom.status === 'active' && (
                      <button
                        onClick={() => setConfirmCloseModal(true)}
                        className="w-full py-2 rounded-xl text-xs font-bold text-amber-300 bg-amber-950/40 hover:bg-amber-950/70 border border-amber-800/40 flex items-center justify-center gap-2 transition-all"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Close Room</span>
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmDeleteModal(true)}
                      className="w-full py-2 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-950/70 border border-red-800/40 flex items-center justify-center gap-2 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Room</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmLeaveModal(true)}
                    className="w-full py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center gap-2 transition-all"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Leave Room</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal: Close Room Confirmation */}
        {confirmCloseModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-[#0e0e1a] border border-amber-900/50 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
              <div className="w-10 h-10 rounded-xl bg-amber-950/50 border border-amber-800/40 flex items-center justify-center text-amber-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Close Chat Room?</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Closing this room prevents anyone from sending new messages or new members from joining. Existing message history is preserved.
                </p>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setConfirmCloseModal(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseRoom}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg"
                >
                  Confirm Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Delete Room Confirmation */}
        {confirmDeleteModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-[#0e0e1a] border border-red-900/60 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
              <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-800/50 flex items-center justify-center text-red-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Chat Room?</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Are you sure you want to permanently delete this room and all associated message history? This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setConfirmDeleteModal(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteRoom}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg"
                >
                  Delete Room
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Leave Room Confirmation */}
        {confirmLeaveModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-[#0e0e1a] border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
              <div>
                <h3 className="text-base font-bold text-white">Leave Room?</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  You can rejoin anytime using the room code if the room is still active.
                </p>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setConfirmLeaveModal(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLeaveRoom}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-zinc-700 hover:bg-zinc-600 text-white"
                >
                  Confirm Leave
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Chat Lobby (Create, Join, Recent Rooms)
  // -------------------------------------------------------------
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in">
      {/* Hero Header */}
      <div className="glass-panel-heavy rounded-2xl p-6 sm:p-8 border border-red-950/40 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-400 bg-red-950/60 px-2.5 py-0.5 rounded border border-red-800/40 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Real-Time Collaboration
            </span>
            <span className="text-xs text-zinc-400 font-mono">Instant Room Codes</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Chat with Friends
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Create a private study room, share the unique room code with your classmates, and discuss topics, formulas, and homework questions in real-time.
          </p>
        </div>

        {/* Ambient Glow */}
        <div className="absolute right-0 top-0 w-80 h-full bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Two Actions: Create Room vs Join Room */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Create a Room */}
        <div className="glass-panel rounded-2xl p-6 border border-red-950/50 hover:border-red-600/50 transition-all space-y-4 flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-red-950/50 group-hover:bg-red-900/60 border border-red-800/40 flex items-center justify-center text-red-400 shadow-[0_0_20px_rgba(220,38,38,0.2)] transition-all">
              <PlusCircle className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">Create a Private Room</h2>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Generate an unpredictable room code. You'll be the room host with full moderation controls.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#070710] border border-red-950/40 space-y-2 text-xs text-zinc-400 font-mono">
              <div className="flex items-center gap-2 text-zinc-300 font-sans">
                <Shield className="w-3.5 h-3.5 text-red-500" />
                <span>Private & Encrypted with Supabase RLS</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300 font-sans">
                <Sparkles className="w-3.5 h-3.5 text-red-500" />
                <span>Instant WebSocket Delivery & History Persistence</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (!user) {
                showToast('Please sign in first to create a chat room', 'info');
                navigateTo('/login');
                return;
              }
              setIsCreateModalOpen(true);
            }}
            className="btn-red-glow w-full py-3 rounded-xl text-xs font-bold text-white tracking-wide uppercase flex items-center justify-center gap-2 shadow-lg"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Room</span>
          </button>
        </div>

        {/* Card 2: Join a Room */}
        <div className="glass-panel rounded-2xl p-6 border border-red-950/50 hover:border-red-600/50 transition-all space-y-4 flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 group-hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-200 shadow-md transition-all">
              <LogIn className="w-6 h-6 text-red-400" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">Join with Room Code</h2>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Got a code from a classmate? Enter it below to immediately jump into the live study session.
              </p>
            </div>

            {/* Input Form */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-semibold text-zinc-300">Room Code</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => {
                    setJoinCodeInput(e.target.value.toUpperCase());
                    setJoinError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleJoinRoom();
                    }
                  }}
                  placeholder="e.g. SYL-7K9P2X"
                  className="flex-1 bg-[#070710] border border-red-950/80 focus:border-red-500 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-white placeholder:text-zinc-600 uppercase tracking-widest focus:outline-none transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const clipText = await navigator.clipboard.readText();
                      if (clipText) setJoinCodeInput(clipText.trim().toUpperCase());
                    } catch {
                      showToast('Could not read clipboard', 'error');
                    }
                  }}
                  className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors shrink-0"
                  title="Paste from clipboard"
                >
                  Paste
                </button>
              </div>

              {joinError && (
                <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800/50 flex items-center gap-2 text-xs text-red-300 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{joinError}</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => handleJoinRoom()}
            disabled={!joinCodeInput.trim() || isJoining}
            className={`w-full py-3 rounded-xl text-xs font-bold text-white tracking-wide uppercase flex items-center justify-center gap-2 transition-all ${
              !joinCodeInput.trim() || isJoining
                ? 'bg-zinc-900 text-zinc-500 cursor-not-allowed border border-zinc-800'
                : 'btn-red-glow shadow-lg'
            }`}
          >
            {isJoining ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>{isJoining ? 'Joining Room...' : 'Join Room'}</span>
          </button>
        </div>
      </div>

      {/* Recent & Active Rooms */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-500" />
            <h2 className="text-base font-bold text-white">Your Chat Rooms</h2>
          </div>
          <button
            onClick={fetchMyRooms}
            disabled={isLoadingRooms}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 text-xs flex items-center gap-1.5 transition-colors"
            title="Refresh room list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRooms ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {isLoadingRooms && myRooms.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="p-5 rounded-2xl bg-[#090912] border border-zinc-800/60 animate-pulse space-y-3">
                <div className="w-1/2 h-4 bg-zinc-800 rounded" />
                <div className="w-3/4 h-3 bg-zinc-900 rounded" />
              </div>
            ))}
          </div>
        ) : myRooms.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#070710] border border-red-950/40 text-center space-y-2">
            <MessageCircle className="w-8 h-8 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-bold text-zinc-300">No Chat Rooms Joined Yet</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Create your first room or enter a friend's room code to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myRooms.map((room) => {
              const isRoomOwner = room.role === 'owner' || room.createdBy === user?.id;
              const isActive = room.status === 'active';

              return (
                <div
                  key={room.id}
                  onClick={() => enterRoom(room)}
                  className="glass-panel p-4 sm:p-5 rounded-2xl border border-red-950/40 hover:border-red-600/50 hover:bg-[#0d0d1c] transition-all cursor-pointer flex flex-col justify-between space-y-3 group shadow-md"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-red-950/60 text-red-300 border border-red-800/40">
                        {room.roomCode}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isRoomOwner && (
                          <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Crown className="w-2.5 h-2.5" /> Host
                          </span>
                        )}
                        {isActive ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Active" />
                        ) : (
                          <span className="text-[10px] text-zinc-500 font-mono">Closed</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors truncate">
                        {room.name || 'Study Room'}
                      </h4>
                      {room.topic && (
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">{room.topic}</p>
                      )}
                    </div>

                    {room.lastMessage && (
                      <div className="p-2 rounded-lg bg-[#06060c] border border-zinc-900 text-[11px] text-zinc-400 truncate">
                        <span className="font-semibold text-zinc-300">{room.lastMessage.senderName}: </span>
                        <span>{room.lastMessage.content}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-xs text-zinc-400">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Users className="w-3 h-3 text-red-500" />
                      <span>{room.memberCount || 1} members</span>
                    </span>
                    <span className="text-xs font-bold text-red-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Enter Chat →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Create Room Form */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#0c0c16] border border-red-900/60 rounded-2xl p-6 sm:p-7 max-w-md w-full space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-950/60 border border-red-800/40 flex items-center justify-center text-red-400">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Create Study Room</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Room Name (Optional)</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. Data Structures Prep / Math Doubt Room"
                  className="w-full bg-[#070710] border border-zinc-800 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none"
                  maxLength={60}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Topic or Subject (Optional)</label>
                <input
                  type="text"
                  value={newRoomTopic}
                  onChange={(e) => setNewRoomTopic(e.target.value)}
                  placeholder="e.g. Unit 2 Differential Equations, Tree Traversals"
                  className="w-full bg-[#070710] border border-zinc-800 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none"
                  maxLength={100}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Max Member Capacity</label>
                <select
                  value={newRoomMaxMembers}
                  onChange={(e) => setNewRoomMaxMembers(Number(e.target.value))}
                  className="w-full bg-[#070710] border border-zinc-800 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                >
                  <option value={2}>2 Students (1-on-1 Private Study)</option>
                  <option value={5}>5 Students (Small Study Group)</option>
                  <option value={10}>10 Students (Standard Group)</option>
                  <option value={20}>20 Students (Class Study Session)</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 btn-red-glow py-2.5 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-1.5"
                >
                  {isCreating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{isCreating ? 'Generating...' : 'Create Room'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Room Created Successfully */}
      {createdRoomInfo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in zoom-in-95 duration-200">
          <div className="bg-[#0d0d1a] border border-red-600/50 rounded-2xl p-6 sm:p-8 max-w-md w-full space-y-5 text-center shadow-2xl relative">
            <div className="w-14 h-14 rounded-2xl bg-red-950/70 border border-red-700/60 flex items-center justify-center text-red-400 mx-auto shadow-[0_0_25px_rgba(220,38,38,0.3)]">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-white">Your Room is Live!</h3>
              <p className="text-xs text-zinc-400">
                Share this unique code with your friend. They can join immediately.
              </p>
            </div>

            {/* Glowing Big Code Box */}
            <div className="p-4 rounded-2xl bg-[#06060c] border border-red-800/60 space-y-2 shadow-inner">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">
                Room Code
              </span>
              <div className="text-3xl font-mono font-extrabold text-red-400 tracking-wider">
                {createdRoomInfo.roomCode}
              </div>
              <button
                onClick={() => handleCopyCode(createdRoomInfo.roomCode)}
                className="w-full py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 flex items-center justify-center gap-2 transition-all mt-1"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-red-400" />}
                <span>{copiedCode ? 'Code Copied!' : 'Copy Room Code'}</span>
              </button>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => handleShareInvite(createdRoomInfo)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Invite</span>
              </button>
              <button
                onClick={() => {
                  const room = createdRoomInfo;
                  setCreatedRoomInfo(null);
                  setIsCreateModalOpen(false);
                  enterRoom(room);
                }}
                className="flex-1 btn-red-glow py-2.5 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-1.5"
              >
                <span>Enter Room Now →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <footer className="text-center py-6 text-xs text-zinc-400 border-t border-zinc-900 mt-12">
        <p>© 2026 Syllora AI. All rights reserved. | Developed By Minshu Kumar</p>
      </footer>
    </div>
  );
};
