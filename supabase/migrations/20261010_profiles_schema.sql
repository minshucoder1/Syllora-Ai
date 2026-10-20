-- ==============================================================================
-- SYLLORA AI — USER PROFILES SCHEMA MIGRATION
-- Multi-Tenant Profile Persistence with Sanitized Mobile Number Storage & RLS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT NOT NULL,
    phone_country_code TEXT DEFAULT '+91',
    phone_number TEXT,
    phone TEXT,
    college TEXT,
    course TEXT DEFAULT 'B.Tech',
    branch TEXT DEFAULT 'Computer Science',
    year TEXT DEFAULT '1st Year',
    semester TEXT DEFAULT '1st Semester',
    preferred_language TEXT DEFAULT 'English',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on phone for fast uniqueness & verification queries
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Read policy: Users can only read their own profile
CREATE POLICY "Users can only read their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- 2. Insert policy: Users can only insert their own profile
CREATE POLICY "Users can only insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 3. Update policy: Users can only update their own profile
CREATE POLICY "Users can only update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
