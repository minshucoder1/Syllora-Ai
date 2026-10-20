-- Syllora AI: Chat With Friends (Room Code) Schema & Row Level Security
-- Migration: 20261012_chat_rooms_schema.sql

-- 1. Chat Rooms Table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(16) NOT NULL UNIQUE,
  name VARCHAR(120),
  topic VARCHAR(200),
  subject_id VARCHAR(64),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  max_members INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_code ON chat_rooms (room_code);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_by ON chat_rooms (created_by);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_status ON chat_rooms (status);

-- 2. Chat Room Members Table
CREATE TABLE IF NOT EXISTS chat_room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name VARCHAR(120) NOT NULL,
  user_avatar TEXT,
  user_college VARCHAR(150),
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_room_member UNIQUE (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_room_members_room ON chat_room_members (room_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_user ON chat_room_members (user_id);

-- 3. Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name VARCHAR(120) NOT NULL,
  sender_avatar TEXT,
  content TEXT NOT NULL,
  message_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'code', 'file')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  deleted_for_all BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON chat_messages (room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages (sender_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 5. Chat Rooms Policies
-- Members can view their rooms, or anyone authenticated can view an active room by code when joining
CREATE POLICY "Users can view rooms they are members of" ON chat_rooms
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM chat_room_members
        WHERE chat_room_members.room_id = chat_rooms.id
          AND chat_room_members.user_id = auth.uid()
      ) OR
      status = 'active'
    )
  );

CREATE POLICY "Authenticated users can create rooms" ON chat_rooms
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Room owners can update their rooms" ON chat_rooms
  FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Room owners can delete their rooms" ON chat_rooms
  FOR DELETE
  USING (auth.uid() = created_by);

-- 6. Chat Room Members Policies
CREATE POLICY "Room members can view other members in same room" ON chat_room_members
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM chat_room_members m2
        WHERE m2.room_id = chat_room_members.room_id
          AND m2.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Authenticated users can join active rooms" ON chat_room_members
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE chat_rooms.id = chat_room_members.room_id
        AND chat_rooms.status = 'active'
    )
  );

CREATE POLICY "Members can leave or update their presence" ON chat_room_members
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Members can leave or owner can remove member" ON chat_room_members
  FOR DELETE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE chat_rooms.id = chat_room_members.room_id
        AND chat_rooms.created_by = auth.uid()
    )
  );

-- 7. Chat Messages Policies
CREATE POLICY "Only room members can read room messages" ON chat_messages
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM chat_room_members
      WHERE chat_room_members.room_id = chat_messages.room_id
        AND chat_room_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Only room members can post messages in active rooms" ON chat_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chat_room_members
      WHERE chat_room_members.room_id = chat_messages.room_id
        AND chat_room_members.user_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE chat_rooms.id = chat_messages.room_id
        AND chat_rooms.status = 'active'
    )
  );

CREATE POLICY "Senders can edit or soft-delete their own messages" ON chat_messages
  FOR UPDATE
  USING (auth.uid() = sender_id);
