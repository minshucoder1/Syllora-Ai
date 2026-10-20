-- ==============================================================================
-- SYLLORA AI — ADVANCED AI FEATURES SCHEMA MIGRATION
-- Multi-Tenant Document Library, Problem Solver, PYQ Intelligence & Offline Sync
-- ==============================================================================

-- 1. LIBRARY DOCUMENTS
CREATE TABLE IF NOT EXISTS public.library_documents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL DEFAULT 0,
    storage_path TEXT,
    collection_name TEXT NOT NULL DEFAULT 'General',
    status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('uploading', 'processing', 'ready', 'failed')),
    error_message TEXT,
    page_count INT DEFAULT 1,
    extracted_text TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lib_docs_user_id ON public.library_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_lib_docs_collection ON public.library_documents(user_id, collection_name);

-- 2. LIBRARY DOCUMENT CHUNKS (For RAG Retrieval)
CREATE TABLE IF NOT EXISTS public.library_document_chunks (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES public.library_documents(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    chunk_index INT NOT NULL,
    page_number INT,
    section_heading TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lib_chunks_doc_id ON public.library_document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_lib_chunks_user_id ON public.library_document_chunks(user_id);

-- 3. LIBRARY CONVERSATIONS & MESSAGES
CREATE TABLE IF NOT EXISTS public.library_conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'Library Discussion',
    selected_document_ids JSONB DEFAULT '[]'::jsonb,
    collection_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lib_conv_user_id ON public.library_conversations(user_id);

CREATE TABLE IF NOT EXISTS public.library_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES public.library_conversations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lib_msgs_conv_id ON public.library_messages(conversation_id);

-- 4. HANDWRITTEN SOLVED PROBLEMS
CREATE TABLE IF NOT EXISTS public.solved_problems (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    subject_id TEXT,
    subject_name TEXT NOT NULL,
    problem_type TEXT NOT NULL,
    question TEXT NOT NULL,
    original_image_base64 TEXT,
    original_image_name TEXT,
    given TEXT,
    required TEXT,
    formula TEXT,
    steps JSONB DEFAULT '[]'::jsonb,
    explanation TEXT NOT NULL,
    final_answer TEXT NOT NULL,
    verification TEXT,
    diagram_or_truth_table TEXT,
    code_solution JSONB,
    saved_to_library BOOLEAN NOT NULL DEFAULT true,
    solved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_solved_problems_user ON public.solved_problems(user_id);

-- 5. PREVIOUS YEAR PAPERS & QUESTIONS
CREATE TABLE IF NOT EXISTS public.previous_year_papers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    subject_id TEXT,
    subject_name TEXT NOT NULL,
    university TEXT NOT NULL,
    course TEXT NOT NULL,
    branch TEXT NOT NULL,
    semester TEXT NOT NULL,
    year INT NOT NULL,
    exam_type TEXT NOT NULL DEFAULT 'End-Semester',
    max_marks INT NOT NULL DEFAULT 100,
    file_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('processing', 'ready', 'failed')),
    error_message TEXT,
    sections JSONB DEFAULT '[]'::jsonb,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pyp_user_id ON public.previous_year_papers(user_id);
CREATE INDEX IF NOT EXISTS idx_pyp_subject ON public.previous_year_papers(user_id, subject_name);

CREATE TABLE IF NOT EXISTS public.paper_analysis_reports (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    included_paper_ids JSONB DEFAULT '[]'::jsonb,
    total_questions_analyzed INT NOT NULL DEFAULT 0,
    year_range TEXT,
    unit_distribution JSONB DEFAULT '[]'::jsonb,
    topic_frequencies JSONB DEFAULT '[]'::jsonb,
    repeated_questions JSONB DEFAULT '[]'::jsonb,
    uncovered_syllabus_topics JSONB DEFAULT '[]'::jsonb,
    recommended_priorities JSONB DEFAULT '[]'::jsonb,
    ai_study_plan JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_paper_reports_user ON public.paper_analysis_reports(user_id, subject_id);

-- 6. OFFLINE SYNC RECORDS
CREATE TABLE IF NOT EXISTS public.offline_sync_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('quiz_attempt', 'flashcard_learned', 'note_read', 'problem_saved')),
    content_id TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'synced' CHECK (status IN ('pending', 'synced', 'failed')),
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offline_sync_user ON public.offline_sync_records(user_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.library_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solved_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.previous_year_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_analysis_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_sync_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own library documents" ON public.library_documents FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users access own document chunks" ON public.library_document_chunks FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users access own library conversations" ON public.library_conversations FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users access own library messages" ON public.library_messages FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users access own solved problems" ON public.solved_problems FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users access own previous year papers" ON public.previous_year_papers FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users access own paper reports" ON public.paper_analysis_reports FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users access own offline sync records" ON public.offline_sync_records FOR ALL USING (auth.uid()::text = user_id);
