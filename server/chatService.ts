import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import { Request, Response } from 'express';
import {
  readDb,
  writeDb,
  User,
  ChatRoom,
  ChatRoomMember,
  ChatMessage,
  generateRoomCode,
} from './db.js';
import { getSupabaseClient } from './supabase.js';

interface ClientConnection {
  ws: WebSocket;
  userId: string;
  userName: string;
  userAvatar?: string;
  roomId?: string;
  isAlive: boolean;
}

// Active WebSocket connections: socket -> ClientConnection
const clients = new Map<WebSocket, ClientConnection>();

// Room subscribers: roomId -> Set<WebSocket>
const roomSubscribers = new Map<string, Set<WebSocket>>();

// SSE clients for HTTP Server-Sent Events fallback: roomId -> Set<Response>
const sseSubscribers = new Map<string, Set<Response>>();

// Rate limiting: userId -> array of timestamps
const messageRateLimits = new Map<string, number[]>();
const MAX_MESSAGES_PER_MINUTE = 40;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowStart = now - 60_000;
  const timestamps = (messageRateLimits.get(userId) || []).filter((t) => t > windowStart);
  if (timestamps.length >= MAX_MESSAGES_PER_MINUTE) {
    return false;
  }
  timestamps.push(now);
  messageRateLimits.set(userId, timestamps);
  return true;
}

// Sync helpers to Supabase if configured
async function syncRoomToSupabase(room: ChatRoom) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('chat_rooms').upsert({
      id: room.id,
      room_code: room.roomCode,
      name: room.name || null,
      topic: room.topic || null,
      subject_id: room.subjectId || null,
      created_by: room.createdBy,
      status: room.status,
      max_members: room.maxMembers,
      created_at: room.createdAt,
      expires_at: room.expiresAt || null,
      last_activity_at: room.lastActivityAt,
    });
  } catch (err) {
    console.warn('[Supabase Sync Room Notice]:', err);
  }
}

async function syncMemberToSupabase(member: ChatRoomMember) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('chat_room_members').upsert({
      id: member.id,
      room_id: member.roomId,
      user_id: member.userId,
      user_name: member.userName,
      user_avatar: member.userAvatar || null,
      user_college: member.userCollege || null,
      role: member.role,
      joined_at: member.joinedAt,
      last_seen_at: member.lastSeenAt,
    });
  } catch (err) {
    console.warn('[Supabase Sync Member Notice]:', err);
  }
}

async function syncMessageToSupabase(msg: ChatMessage) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('chat_messages').upsert({
      id: msg.id,
      room_id: msg.roomId,
      sender_id: msg.senderId,
      sender_name: msg.senderName,
      sender_avatar: msg.senderAvatar || null,
      content: msg.content,
      message_type: msg.messageType,
      created_at: msg.createdAt,
      edited_at: msg.editedAt || null,
      deleted_at: msg.deletedAt || null,
      deleted_for_all: msg.deletedForAll || false,
    });
  } catch (err) {
    console.warn('[Supabase Sync Message Notice]:', err);
  }
}

/**
 * Broadcast payload to all subscribers in a room (WebSockets + SSE fallback)
 */
export function broadcastToRoom(roomId: string, event: string, data: any, excludeWs?: WebSocket) {
  const payload = JSON.stringify({ event, data, timestamp: new Date().toISOString() });

  // 1. WebSocket broadcast
  const wsSubscribers = roomSubscribers.get(roomId);
  if (wsSubscribers) {
    wsSubscribers.forEach((ws) => {
      if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(payload);
        } catch (err) {
          console.warn('[WebSocket Send Error]:', err);
        }
      }
    });
  }

  // 2. SSE broadcast
  const sseClients = sseSubscribers.get(roomId);
  if (sseClients) {
    sseClients.forEach((res) => {
      try {
        res.write(`data: ${payload}\n\n`);
      } catch (err) {
        console.warn('[SSE Send Error]:', err);
      }
    });
  }
}

/**
 * Get online members in a room based on connected WebSocket clients
 */
export function getOnlineUserIdsInRoom(roomId: string): string[] {
  const onlineIds = new Set<string>();
  const wsSubscribers = roomSubscribers.get(roomId);
  if (wsSubscribers) {
    wsSubscribers.forEach((ws) => {
      const client = clients.get(ws);
      if (client && client.roomId === roomId) {
        onlineIds.add(client.userId);
      }
    });
  }
  return Array.from(onlineIds);
}

/**
 * Setup WebSocket Server attached to Express HttpServer
 */
export function setupChatWebSocketServer(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: '/ws/chat' });

  // Heartbeat interval to check alive connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const client = clients.get(ws);
      if (!client) {
        ws.terminate();
        return;
      }
      if (!client.isAlive) {
        cleanupClient(ws);
        return ws.terminate();
      }
      client.isAlive = false;
      try {
        ws.ping();
      } catch {
        cleanupClient(ws);
        ws.terminate();
      }
    });
  }, 25_000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  wss.on('connection', (ws: WebSocket, req) => {
    // Parse query params (e.g. ?token=...&roomId=...)
    const url = new URL(req.url || '', 'http://localhost');
    const token = url.searchParams.get('token');
    const roomId = url.searchParams.get('roomId');

    const db = readDb();
    let authenticatedUser: User | null = null;

    if (token) {
      const session = db.sessions.find((s) => s.token === token && s.expiresAt > Date.now());
      if (session) {
        authenticatedUser = db.users.find((u) => u.id === session.userId) || null;
      }
    }

    const clientConn: ClientConnection = {
      ws,
      userId: authenticatedUser?.id || '',
      userName: authenticatedUser?.name || 'Anonymous',
      userAvatar: authenticatedUser?.avatar,
      roomId: roomId || undefined,
      isAlive: true,
    };
    clients.set(ws, clientConn);

    ws.on('pong', () => {
      const client = clients.get(ws);
      if (client) client.isAlive = true;
    });

    if (roomId && authenticatedUser) {
      joinRoomSubscription(ws, roomId, authenticatedUser);
    }

    ws.on('message', (rawData) => {
      try {
        const parsed = JSON.parse(rawData.toString());
        handleSocketMessage(ws, parsed);
      } catch (err) {
        console.warn('[Chat WebSocket Parse Error]:', err);
      }
    });

    ws.on('close', () => {
      cleanupClient(ws);
    });

    ws.on('error', (err) => {
      console.warn('[Chat WebSocket Error]:', err);
      cleanupClient(ws);
    });
  });

  console.log('[Chat Service] Real-time WebSocket server initialized on /ws/chat');
  return wss;
}

function joinRoomSubscription(ws: WebSocket, roomId: string, user: User) {
  const client = clients.get(ws);
  if (!client) return;

  const db = readDb();
  const room = db.chatRooms.find((r) => r.id === roomId);
  if (!room) {
    ws.send(JSON.stringify({ event: 'error', data: { message: 'Chat room not found' } }));
    return;
  }

  // Check membership
  const member = db.chatRoomMembers.find((m) => m.roomId === roomId && m.userId === user.id);
  if (!member) {
    ws.send(JSON.stringify({ event: 'error', data: { message: 'You are not a member of this room' } }));
    return;
  }

  // Remove from previous room if switching
  if (client.roomId && client.roomId !== roomId) {
    leaveRoomSubscription(ws, client.roomId);
  }

  client.roomId = roomId;
  client.userId = user.id;
  client.userName = user.name;
  client.userAvatar = user.avatar;

  if (!roomSubscribers.has(roomId)) {
    roomSubscribers.set(roomId, new Set());
  }
  roomSubscribers.get(roomId)!.add(ws);

  // Update member last seen
  member.lastSeenAt = new Date().toISOString();
  member.isOnline = true;
  writeDb(db);

  // Notify other room members about presence
  const onlineUserIds = getOnlineUserIdsInRoom(roomId);
  broadcastToRoom(roomId, 'presence_update', {
    roomId,
    onlineUserIds,
    userJoined: {
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
    },
  });

  // Send confirmation back to connecting client
  ws.send(
    JSON.stringify({
      event: 'room_joined',
      data: {
        roomId,
        onlineUserIds,
      },
    })
  );
}

function leaveRoomSubscription(ws: WebSocket, roomId: string) {
  const client = clients.get(ws);
  const subscribers = roomSubscribers.get(roomId);
  if (subscribers) {
    subscribers.delete(ws);
    if (subscribers.size === 0) {
      roomSubscribers.delete(roomId);
    }
  }

  if (client && client.roomId === roomId) {
    client.roomId = undefined;
    const onlineUserIds = getOnlineUserIdsInRoom(roomId);
    broadcastToRoom(roomId, 'presence_update', {
      roomId,
      onlineUserIds,
      userLeft: {
        userId: client.userId,
        userName: client.userName,
      },
    });
  }
}

function cleanupClient(ws: WebSocket) {
  const client = clients.get(ws);
  if (client && client.roomId) {
    leaveRoomSubscription(ws, client.roomId);
  }
  clients.delete(ws);
}

function handleSocketMessage(ws: WebSocket, payload: any) {
  const client = clients.get(ws);
  if (!client) return;

  const db = readDb();
  const { event, data } = payload;

  switch (event) {
    case 'auth': {
      const { token } = data || {};
      if (!token) return;
      const session = db.sessions.find((s) => s.token === token && s.expiresAt > Date.now());
      if (session) {
        const user = db.users.find((u) => u.id === session.userId);
        if (user) {
          client.userId = user.id;
          client.userName = user.name;
          client.userAvatar = user.avatar;
          ws.send(JSON.stringify({ event: 'authenticated', data: { userId: user.id, name: user.name } }));
        }
      }
      break;
    }

    case 'join_room': {
      const { roomId, token } = data || {};
      let user: User | null = null;
      if (token) {
        const session = db.sessions.find((s) => s.token === token && s.expiresAt > Date.now());
        if (session) {
          user = db.users.find((u) => u.id === session.userId) || null;
        }
      }
      if (!user && client.userId) {
        user = db.users.find((u) => u.id === client.userId) || null;
      }
      if (user && roomId) {
        joinRoomSubscription(ws, roomId, user);
      } else {
        ws.send(JSON.stringify({ event: 'error', data: { message: 'Authentication required to join room' } }));
      }
      break;
    }

    case 'leave_room': {
      const { roomId } = data || {};
      if (roomId) {
        leaveRoomSubscription(ws, roomId);
      }
      break;
    }

    case 'send_message': {
      const { roomId, content, messageType = 'text' } = data || {};
      if (!client.userId) {
        ws.send(JSON.stringify({ event: 'error', data: { message: 'Authentication required' } }));
        return;
      }
      if (!roomId || !content || typeof content !== 'string') {
        ws.send(JSON.stringify({ event: 'error', data: { message: 'Message content is required' } }));
        return;
      }
      const trimmed = content.trim();
      if (trimmed.length === 0 || trimmed.length > 4000) {
        ws.send(JSON.stringify({ event: 'error', data: { message: 'Message must be between 1 and 4000 characters' } }));
        return;
      }

      if (!checkRateLimit(client.userId)) {
        ws.send(
          JSON.stringify({
            event: 'error',
            data: { message: 'You are sending messages too quickly. Please slow down.' },
          })
        );
        return;
      }

      const room = db.chatRooms.find((r) => r.id === roomId);
      if (!room || room.status !== 'active') {
        ws.send(JSON.stringify({ event: 'error', data: { message: 'This room is closed or no longer active' } }));
        return;
      }

      const isMember = db.chatRoomMembers.some((m) => m.roomId === roomId && m.userId === client.userId);
      if (!isMember) {
        ws.send(JSON.stringify({ event: 'error', data: { message: 'You are not a member of this chat room' } }));
        return;
      }

      const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const newMsg: ChatMessage = {
        id: msgId,
        roomId,
        senderId: client.userId,
        senderName: client.userName,
        senderAvatar: client.userAvatar,
        content: trimmed,
        messageType: ['text', 'code', 'file', 'system'].includes(messageType) ? messageType : 'text',
        createdAt: new Date().toISOString(),
      };

      db.chatMessages.push(newMsg);
      room.lastActivityAt = new Date().toISOString();
      writeDb(db);
      syncMessageToSupabase(newMsg).catch(() => {});

      broadcastToRoom(roomId, 'new_message', newMsg);
      break;
    }

    case 'typing': {
      const { roomId, isTyping } = data || {};
      if (roomId && client.userId) {
        broadcastToRoom(
          roomId,
          'user_typing',
          {
            roomId,
            userId: client.userId,
            userName: client.userName,
            isTyping: !!isTyping,
          },
          ws
        );
      }
      break;
    }

    case 'delete_message': {
      const { roomId, messageId } = data || {};
      if (!roomId || !messageId || !client.userId) return;

      const room = db.chatRooms.find((r) => r.id === roomId);
      const msg = db.chatMessages.find((m) => m.id === messageId && m.roomId === roomId);
      if (!msg) return;

      // Only sender or room owner can delete
      const isOwner = room?.createdBy === client.userId;
      const isSender = msg.senderId === client.userId;
      if (!isOwner && !isSender) {
        ws.send(JSON.stringify({ event: 'error', data: { message: 'Cannot delete message sent by another member' } }));
        return;
      }

      msg.deletedAt = new Date().toISOString();
      msg.deletedForAll = true;
      msg.content = 'This message was deleted';
      writeDb(db);
      syncMessageToSupabase(msg).catch(() => {});

      broadcastToRoom(roomId, 'message_deleted', { roomId, messageId });
      break;
    }

    case 'ping': {
      ws.send(JSON.stringify({ event: 'pong', timestamp: Date.now() }));
      break;
    }
  }
}

// ---------------- REST CONTROLLER FUNCTIONS ----------------

/**
 * Create a new chat room
 */
export async function createChatRoom(req: Request, res: Response, user: User) {
  try {
    const { name, topic, subjectId, maxMembers = 10 } = req.body;
    const db = readDb();

    // Check rate limit: max 10 rooms created in 10 minutes per user
    const userRooms = db.chatRooms.filter((r) => r.createdBy === user.id);
    const recentRooms = userRooms.filter((r) => Date.now() - new Date(r.createdAt).getTime() < 10 * 60_000);
    if (recentRooms.length >= 10) {
      return res.status(429).json({ error: 'You have created too many rooms recently. Please wait a few minutes.' });
    }

    const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const roomCode = generateRoomCode(db.chatRooms);

    const roomName = name && typeof name === 'string' && name.trim().length > 0
      ? name.trim().slice(0, 80)
      : `${user.name.split(' ')[0]}'s Study Room`;

    const newRoom: ChatRoom = {
      id: roomId,
      roomCode,
      name: roomName,
      topic: topic ? String(topic).slice(0, 150) : undefined,
      subjectId: subjectId || undefined,
      createdBy: user.id,
      status: 'active',
      maxMembers: Math.min(Math.max(Number(maxMembers) || 10, 2), 50),
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    };

    const ownerMember: ChatRoomMember = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      roomId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      userCollege: user.college,
      role: 'owner',
      joinedAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      isOnline: true,
    };

    // System welcome message
    const welcomeMsg: ChatMessage = {
      id: `msg_${Date.now()}_welcome`,
      roomId,
      senderId: 'system',
      senderName: 'Syllora AI',
      content: `🎉 Chat room created by ${user.name}! Share code ${roomCode} with your friends to study and collaborate in real-time.`,
      messageType: 'system',
      createdAt: new Date().toISOString(),
    };

    db.chatRooms.unshift(newRoom);
    db.chatRoomMembers.push(ownerMember);
    db.chatMessages.push(welcomeMsg);
    writeDb(db);

    // Sync to Supabase
    syncRoomToSupabase(newRoom).catch(() => {});
    syncMemberToSupabase(ownerMember).catch(() => {});
    syncMessageToSupabase(welcomeMsg).catch(() => {});

    return res.status(201).json({
      success: true,
      room: newRoom,
      member: ownerMember,
    });
  } catch (err: any) {
    console.error('Error creating chat room:', err);
    return res.status(500).json({ error: 'Failed to create chat room' });
  }
}

/**
 * Join an existing room via Room Code
 */
export async function joinChatRoom(req: Request, res: Response, user: User) {
  try {
    const { roomCode } = req.body;
    if (!roomCode || typeof roomCode !== 'string') {
      return res.status(400).json({ error: 'Please enter a valid room code.' });
    }

    // Normalize: trim whitespace, strip symbols, uppercase
    const rawCode = roomCode.trim().toUpperCase();
    const normalizedCode = rawCode.startsWith('SYL-') ? rawCode : `SYL-${rawCode.replace(/[^A-Z0-9]/g, '')}`;

    const db = readDb();
    const room = db.chatRooms.find(
      (r) => r.roomCode.toUpperCase() === normalizedCode || r.roomCode.toUpperCase() === rawCode
    );

    if (!room) {
      return res.status(404).json({
        error: 'Room not found. Please double-check the room code with your friend.',
        code: 'ROOM_NOT_FOUND',
      });
    }

    if (room.status !== 'active') {
      return res.status(410).json({
        error: 'This room has been closed or expired by the host.',
        code: 'ROOM_CLOSED',
      });
    }

    // Check if already a member
    let member = db.chatRoomMembers.find((m) => m.roomId === room.id && m.userId === user.id);
    const currentMembers = db.chatRoomMembers.filter((m) => m.roomId === room.id);

    if (!member) {
      // Check capacity
      if (currentMembers.length >= room.maxMembers) {
        return res.status(403).json({
          error: `This room has reached its maximum capacity of ${room.maxMembers} students.`,
          code: 'ROOM_FULL',
        });
      }

      // Add as new member
      member = {
        id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        roomId: room.id,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        userCollege: user.college,
        role: 'member',
        joinedAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        isOnline: true,
      };

      db.chatRoomMembers.push(member);

      // System notification
      const joinMsg: ChatMessage = {
        id: `msg_${Date.now()}_join`,
        roomId: room.id,
        senderId: 'system',
        senderName: 'Syllora AI',
        content: `👋 ${user.name} joined the room.`,
        messageType: 'system',
        createdAt: new Date().toISOString(),
      };
      db.chatMessages.push(joinMsg);

      room.lastActivityAt = new Date().toISOString();
      writeDb(db);

      syncMemberToSupabase(member).catch(() => {});
      syncMessageToSupabase(joinMsg).catch(() => {});

      // Broadcast join event
      broadcastToRoom(room.id, 'user_joined', {
        roomId: room.id,
        member,
        message: joinMsg,
      });
    } else {
      // Re-joining existing room: update lastSeenAt
      member.lastSeenAt = new Date().toISOString();
      member.isOnline = true;
      writeDb(db);
    }

    const members = db.chatRoomMembers.filter((m) => m.roomId === room.id);
    const onlineIds = getOnlineUserIdsInRoom(room.id);

    return res.json({
      success: true,
      room,
      member,
      members: members.map((m) => ({
        ...m,
        isOnline: onlineIds.includes(m.userId) || m.userId === user.id,
      })),
    });
  } catch (err: any) {
    console.error('Error joining chat room:', err);
    return res.status(500).json({ error: 'Failed to join chat room' });
  }
}

/**
 * Get user's active/recent rooms
 */
export async function getMyChatRooms(req: Request, res: Response, user: User) {
  try {
    const db = readDb();
    const myMemberships = db.chatRoomMembers.filter((m) => m.userId === user.id);
    const roomIds = myMemberships.map((m) => m.roomId);

    const roomsWithDetails = db.chatRooms
      .filter((r) => roomIds.includes(r.id))
      .map((r) => {
        const members = db.chatRoomMembers.filter((m) => m.roomId === r.id);
        const myMembership = myMemberships.find((m) => m.roomId === r.id);
        const messages = db.chatMessages.filter((msg) => msg.roomId === r.id);
        const lastMessage = messages[messages.length - 1];

        // Unread messages count: messages created after user's lastSeenAt
        const lastSeen = myMembership ? new Date(myMembership.lastSeenAt).getTime() : 0;
        const unreadCount = messages.filter(
          (msg) => msg.senderId !== user.id && new Date(msg.createdAt).getTime() > lastSeen
        ).length;

        const onlineIds = getOnlineUserIdsInRoom(r.id);

        return {
          ...r,
          role: myMembership?.role || 'member',
          memberCount: members.length,
          onlineCount: members.filter((m) => onlineIds.includes(m.userId)).length,
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                senderName: lastMessage.senderName,
                createdAt: lastMessage.createdAt,
              }
            : null,
          unreadCount,
        };
      })
      .sort((a, b) => new Date(b.lastActivityAt || b.createdAt).getTime() - new Date(a.lastActivityAt || a.createdAt).getTime());

    return res.json({
      success: true,
      rooms: roomsWithDetails,
    });
  } catch (err: any) {
    console.error('Error fetching chat rooms:', err);
    return res.status(500).json({ error: 'Failed to fetch your chat rooms' });
  }
}

/**
 * Get Room details and members
 */
export async function getChatRoomDetails(req: Request, res: Response, user: User) {
  try {
    const { roomId } = req.params;
    const db = readDb();

    const room = db.chatRooms.find((r) => r.id === roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const member = db.chatRoomMembers.find((m) => m.roomId === roomId && m.userId === user.id);
    if (!member) {
      return res.status(403).json({ error: 'You are not a member of this chat room' });
    }

    // Update lastSeenAt
    member.lastSeenAt = new Date().toISOString();
    writeDb(db);

    const members = db.chatRoomMembers.filter((m) => m.roomId === roomId);
    const onlineIds = getOnlineUserIdsInRoom(roomId);

    return res.json({
      success: true,
      room,
      myRole: member.role,
      members: members.map((m) => ({
        ...m,
        isOnline: onlineIds.includes(m.userId) || m.userId === user.id,
      })),
    });
  } catch (err: any) {
    console.error('Error fetching room details:', err);
    return res.status(500).json({ error: 'Failed to fetch room details' });
  }
}

/**
 * Get Room message history with pagination
 */
export async function getChatMessageHistory(req: Request, res: Response, user: User) {
  try {
    const { roomId } = req.params;
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 10), 100);
    const before = req.query.before as string | undefined;

    const db = readDb();
    const isMember = db.chatRoomMembers.some((m) => m.roomId === roomId && m.userId === user.id);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied: You must be a member of this room' });
    }

    let allMessages = db.chatMessages.filter((m) => m.roomId === roomId);

    if (before) {
      const beforeTime = new Date(before).getTime();
      allMessages = allMessages.filter((m) => new Date(m.createdAt).getTime() < beforeTime);
    }

    // Sort newest first to slice limit, then return chronologically
    allMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const sliced = allMessages.slice(0, limit);
    const chronological = sliced.reverse();

    // Mask deleted messages
    const formatted = chronological.map((msg) => {
      if (msg.deletedForAll) {
        return {
          ...msg,
          content: 'This message was deleted',
        };
      }
      return msg;
    });

    return res.json({
      success: true,
      messages: formatted,
      hasMore: allMessages.length > limit,
    });
  } catch (err: any) {
    console.error('Error fetching messages:', err);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
}

/**
 * Send message via HTTP REST (with real-time WebSocket & SSE broadcast)
 */
export async function sendChatMessage(req: Request, res: Response, user: User) {
  try {
    const { roomId } = req.params;
    const { content, messageType = 'text' } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const trimmed = content.trim();
    if (trimmed.length === 0 || trimmed.length > 4000) {
      return res.status(400).json({ error: 'Message must be between 1 and 4000 characters' });
    }

    if (!checkRateLimit(user.id)) {
      return res.status(429).json({ error: 'You are sending messages too quickly. Please wait a moment.' });
    }

    const db = readDb();
    const room = db.chatRooms.find((r) => r.id === roomId);
    if (!room) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    if (room.status !== 'active') {
      return res.status(410).json({ error: 'This room has been closed' });
    }

    const isMember = db.chatRoomMembers.some((m) => m.roomId === roomId && m.userId === user.id);
    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this chat room' });
    }

    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const newMsg: ChatMessage = {
      id: msgId,
      roomId,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      content: trimmed,
      messageType: ['text', 'code', 'file', 'system'].includes(messageType) ? messageType : 'text',
      createdAt: new Date().toISOString(),
    };

    db.chatMessages.push(newMsg);
    room.lastActivityAt = new Date().toISOString();
    writeDb(db);

    syncMessageToSupabase(newMsg).catch(() => {});
    broadcastToRoom(roomId, 'new_message', newMsg);

    return res.status(201).json({
      success: true,
      message: newMsg,
    });
  } catch (err: any) {
    console.error('Error sending message:', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
}

/**
 * Delete a chat message (soft delete)
 */
export async function deleteChatMessage(req: Request, res: Response, user: User) {
  try {
    const { roomId, messageId } = req.params;
    const db = readDb();

    const room = db.chatRooms.find((r) => r.id === roomId);
    const msg = db.chatMessages.find((m) => m.id === messageId && m.roomId === roomId);
    if (!msg) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const isOwner = room?.createdBy === user.id;
    const isSender = msg.senderId === user.id;
    if (!isOwner && !isSender) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    msg.deletedAt = new Date().toISOString();
    msg.deletedForAll = true;
    msg.content = 'This message was deleted';
    writeDb(db);

    syncMessageToSupabase(msg).catch(() => {});
    broadcastToRoom(roomId, 'message_deleted', { roomId, messageId });

    return res.json({ success: true, messageId });
  } catch (err: any) {
    console.error('Error deleting message:', err);
    return res.status(500).json({ error: 'Failed to delete message' });
  }
}

/**
 * Leave a chat room
 */
export async function leaveChatRoom(req: Request, res: Response, user: User) {
  try {
    const { roomId } = req.params;
    const db = readDb();

    const room = db.chatRooms.find((r) => r.id === roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const memberIndex = db.chatRoomMembers.findIndex((m) => m.roomId === roomId && m.userId === user.id);
    if (memberIndex === -1) {
      return res.status(400).json({ error: 'You are not a member of this room' });
    }

    const isOwner = room.createdBy === user.id;
    db.chatRoomMembers.splice(memberIndex, 1);

    // If owner leaves, either assign to next member or close room if empty
    const remainingMembers = db.chatRoomMembers.filter((m) => m.roomId === roomId);
    if (isOwner) {
      if (remainingMembers.length > 0) {
        remainingMembers[0].role = 'owner';
        room.createdBy = remainingMembers[0].userId;
      } else {
        room.status = 'closed';
      }
    }

    // System notification
    const leaveMsg: ChatMessage = {
      id: `msg_${Date.now()}_leave`,
      roomId,
      senderId: 'system',
      senderName: 'Syllora AI',
      content: `👋 ${user.name} left the room.`,
      messageType: 'system',
      createdAt: new Date().toISOString(),
    };
    db.chatMessages.push(leaveMsg);
    writeDb(db);

    broadcastToRoom(roomId, 'user_left', {
      roomId,
      userId: user.id,
      userName: user.name,
      message: leaveMsg,
      newOwnerId: isOwner && remainingMembers.length > 0 ? remainingMembers[0].userId : undefined,
    });

    return res.json({ success: true, message: 'You left the room' });
  } catch (err: any) {
    console.error('Error leaving chat room:', err);
    return res.status(500).json({ error: 'Failed to leave room' });
  }
}

/**
 * Close a room (owner only)
 */
export async function closeChatRoom(req: Request, res: Response, user: User) {
  try {
    const { roomId } = req.params;
    const db = readDb();

    const room = db.chatRooms.find((r) => r.id === roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.createdBy !== user.id) {
      return res.status(403).json({ error: 'Only the room owner can close this room' });
    }

    room.status = 'closed';
    room.lastActivityAt = new Date().toISOString();

    const closeMsg: ChatMessage = {
      id: `msg_${Date.now()}_closed`,
      roomId,
      senderId: 'system',
      senderName: 'Syllora AI',
      content: `🔒 Room closed by the host (${user.name}). No new messages can be sent.`,
      messageType: 'system',
      createdAt: new Date().toISOString(),
    };
    db.chatMessages.push(closeMsg);
    writeDb(db);

    syncRoomToSupabase(room).catch(() => {});
    syncMessageToSupabase(closeMsg).catch(() => {});
    broadcastToRoom(roomId, 'room_closed', { roomId, closedBy: user.name });

    return res.json({ success: true, room });
  } catch (err: any) {
    console.error('Error closing room:', err);
    return res.status(500).json({ error: 'Failed to close room' });
  }
}

/**
 * Delete a room entirely (owner only with confirmation)
 */
export async function deleteChatRoom(req: Request, res: Response, user: User) {
  try {
    const { roomId } = req.params;
    const db = readDb();

    const roomIndex = db.chatRooms.findIndex((r) => r.id === roomId);
    if (roomIndex === -1) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const room = db.chatRooms[roomIndex];
    if (room.createdBy !== user.id) {
      return res.status(403).json({ error: 'Only the room owner can delete this room' });
    }

    // Delete members and messages
    db.chatRooms.splice(roomIndex, 1);
    db.chatRoomMembers = db.chatRoomMembers.filter((m) => m.roomId !== roomId);
    db.chatMessages = db.chatMessages.filter((m) => m.roomId !== roomId);
    writeDb(db);

    broadcastToRoom(roomId, 'room_deleted', { roomId });

    // Clean up active connections
    const subs = roomSubscribers.get(roomId);
    if (subs) {
      subs.forEach((ws) => {
        const client = clients.get(ws);
        if (client) client.roomId = undefined;
      });
      roomSubscribers.delete(roomId);
    }

    return res.json({ success: true, message: 'Room deleted permanently' });
  } catch (err: any) {
    console.error('Error deleting room:', err);
    return res.status(500).json({ error: 'Failed to delete room' });
  }
}

/**
 * Server-Sent Events (SSE) Stream fallback for environments where WebSockets are blocked
 */
export function handleChatSSEStream(req: Request, res: Response, user: User) {
  const { roomId } = req.params;
  const db = readDb();

  const isMember = db.chatRoomMembers.some((m) => m.roomId === roomId && m.userId === user.id);
  if (!isMember) {
    return res.status(403).json({ error: 'Access denied: You must be a member of this room' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!sseSubscribers.has(roomId)) {
    sseSubscribers.set(roomId, new Set());
  }
  sseSubscribers.get(roomId)!.add(res);

  // Send initial handshake
  res.write(`data: ${JSON.stringify({ event: 'connected', roomId, timestamp: Date.now() })}\n\n`);

  // Heartbeat comment every 15 seconds to prevent timeout
  const heartbeat = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 15_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    const subs = sseSubscribers.get(roomId);
    if (subs) {
      subs.delete(res);
      if (subs.size === 0) sseSubscribers.delete(roomId);
    }
  });
}

/**
 * Register all Chat With Friends API routes
 */
export function registerChatRoutes(app: any, getSessionUser: (req: Request, db: any) => User | null) {
  const requireAuth = (req: Request, res: Response, next: () => void) => {
    const db = readDb();
    const user = getSessionUser(req, db);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required to access friend chat' });
    }
    (req as any).sessionUser = user;
    next();
  };

  app.post('/api/chat/rooms', requireAuth, (req: Request, res: Response) =>
    createChatRoom(req, res, (req as any).sessionUser)
  );

  app.post('/api/chat/rooms/join', requireAuth, (req: Request, res: Response) =>
    joinChatRoom(req, res, (req as any).sessionUser)
  );

  app.get('/api/chat/rooms/my', requireAuth, (req: Request, res: Response) =>
    getMyChatRooms(req, res, (req as any).sessionUser)
  );

  app.get('/api/chat/rooms/:roomId', requireAuth, (req: Request, res: Response) =>
    getChatRoomDetails(req, res, (req as any).sessionUser)
  );

  app.get('/api/chat/rooms/:roomId/messages', requireAuth, (req: Request, res: Response) =>
    getChatMessageHistory(req, res, (req as any).sessionUser)
  );

  app.post('/api/chat/rooms/:roomId/messages', requireAuth, (req: Request, res: Response) =>
    sendChatMessage(req, res, (req as any).sessionUser)
  );

  app.delete('/api/chat/rooms/:roomId/messages/:messageId', requireAuth, (req: Request, res: Response) =>
    deleteChatMessage(req, res, (req as any).sessionUser)
  );

  app.post('/api/chat/rooms/:roomId/leave', requireAuth, (req: Request, res: Response) =>
    leaveChatRoom(req, res, (req as any).sessionUser)
  );

  app.post('/api/chat/rooms/:roomId/close', requireAuth, (req: Request, res: Response) =>
    closeChatRoom(req, res, (req as any).sessionUser)
  );

  app.delete('/api/chat/rooms/:roomId', requireAuth, (req: Request, res: Response) =>
    deleteChatRoom(req, res, (req as any).sessionUser)
  );

  app.get('/api/chat/rooms/:roomId/stream', requireAuth, (req: Request, res: Response) =>
    handleChatSSEStream(req, res, (req as any).sessionUser)
  );

  console.log('[Chat Service] Mounted all /api/chat/* endpoints successfully');
}
