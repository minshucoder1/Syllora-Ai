-- ==============================================================================
-- SYLLORA AI — SUPABASE POSTGRESQL DATABASE MIGRATION
-- Multi-Tenant Syllabus Persistence & Study Material Schema with Row Level Security
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS public.subjects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    code TEXT,
    description TEXT,
    exam_date DATE,
    syllabus_text TEXT,
    syllabus_file_path TEXT,
    syllabus_file_name TEXT,
    syllabus_file_type TEXT,
    analysis_status TEXT NOT NULL DEFAULT 'completed' CHECK (analysis_status IN ('pending', 'analyzing', 'completed', 'failed')),
    course TEXT,
    semester TEXT,
    units_json JSONB DEFAULT '[]'::jsonb,
    archived BOOLEAN NOT NULL DEFAULT false,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for speedy user query isolation
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON public.subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_subjects_archived ON public.subjects(user_id, archived);

-- 3. UNITS TABLE
CREATE TABLE IF NOT EXISTS public.units (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    weightage NUMERIC(5, 2) DEFAULT 20.00,
    order_number INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_units_subject_id ON public.units(subject_id);

-- 4. TOPICS TABLE
CREATE TABLE IF NOT EXISTS public.topics (
    id TEXT PRIMARY KEY,
    unit_id TEXT NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'important' CHECK (priority IN ('very_important', 'important', 'moderate', 'low')),
    priority_reason TEXT,
    completed BOOLEAN NOT NULL DEFAULT false,
    score NUMERIC(5, 2) DEFAULT 0.00,
    attempts INT NOT NULL DEFAULT 0,
    order_number INT NOT NULL DEFAULT 1,
    last_accessed TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_topics_subject_id ON public.topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_unit_id ON public.topics(unit_id);

-- 5. NOTES TABLE
CREATE TABLE IF NOT EXISTS public.notes (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    definition TEXT,
    introduction TEXT,
    key_concepts JSONB DEFAULT '[]'::jsonb,
    explanation TEXT NOT NULL,
    real_life_example TEXT,
    formula TEXT,
    algorithm TEXT,
    complexity TEXT,
    applications JSONB DEFAULT '[]'::jsonb,
    advantages JSONB DEFAULT '[]'::jsonb,
    limitations JSONB DEFAULT '[]'::jsonb,
    exam_points JSONB DEFAULT '[]'::jsonb,
    quick_revision TEXT,
    diagram_svg_or_ascii TEXT,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_topic_id ON public.notes(topic_id);
CREATE INDEX IF NOT EXISTS idx_notes_subject_id ON public.notes(subject_id);

-- 6. QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.questions (
    id TEXT PRIMARY KEY,
    topic_id TEXT REFERENCES public.topics(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    marks INT DEFAULT 5,
    difficulty TEXT DEFAULT 'Medium',
    priority TEXT DEFAULT 'High',
    type TEXT DEFAULT 'Conceptual',
    category TEXT DEFAULT 'all',
    is_numerical BOOLEAN NOT NULL DEFAULT false,
    saved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON public.questions(subject_id);

-- 7. MCQS TABLE
CREATE TABLE IF NOT EXISTS public.mcqs (
    id TEXT PRIMARY KEY,
    topic_id TEXT REFERENCES public.topics(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    difficulty TEXT DEFAULT 'Medium',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mcqs_subject_id ON public.mcqs(subject_id);

-- 8. FLASHCARDS TABLE
CREATE TABLE IF NOT EXISTS public.flashcards (
    id TEXT PRIMARY KEY,
    topic_id TEXT REFERENCES public.topics(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    key_takeaway TEXT,
    learned BOOLEAN NOT NULL DEFAULT false,
    difficulty TEXT DEFAULT 'Medium',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flashcards_subject_id ON public.flashcards(subject_id);

-- 9. MINDMAPS TABLE
CREATE TABLE IF NOT EXISTS public.mindmaps (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    topic_or_unit_name TEXT NOT NULL,
    root_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mindmaps_subject_id ON public.mindmaps(subject_id);

-- 10. CHEATSHEETS TABLE
CREATE TABLE IF NOT EXISTS public.cheatsheets (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    formulas JSONB DEFAULT '[]'::jsonb,
    key_points JSONB DEFAULT '[]'::jsonb,
    diagrams JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cheatsheets_subject_id ON public.cheatsheets(subject_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Isolation: users can only select, insert, update, delete their own data
-- ==============================================================================

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mindmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cheatsheets ENABLE ROW LEVEL SECURITY;

-- Subjects RLS
CREATE POLICY "Users can only read their own subjects"
    ON public.subjects FOR SELECT
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can only insert their own subjects"
    ON public.subjects FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can only update their own subjects"
    ON public.subjects FOR UPDATE
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can only delete their own subjects"
    ON public.subjects FOR DELETE
    USING (auth.uid()::text = user_id);

-- Cascading RLS for Notes, Questions, etc.
CREATE POLICY "Users can only manage their own notes"
    ON public.notes FOR ALL
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can only manage their own questions"
    ON public.questions FOR ALL
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can only manage their own mcqs"
    ON public.mcqs FOR ALL
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can only manage their own flashcards"
    ON public.flashcards FOR ALL
    USING (auth.uid()::text = user_id);

-- ==============================================================================
-- SUPABASE STORAGE CONFIGURATION
-- Bucket: syllabus_files (Private)
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('syllabus_files', 'syllabus_files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can only access their own syllabus files"
    ON storage.objects FOR ALL
    USING (bucket_id = 'syllabus_files' AND (storage.foldername(name))[1] = auth.uid()::text);
