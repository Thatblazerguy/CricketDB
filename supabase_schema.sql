-- Supabase SQL Schema for Cricket Database
-- This schema handles user authentication and favorites storage

-- 1. Create the Users table
-- Note: This is used if you are handling auth manually via the backend as per your current server.js logic.
-- If you prefer using Supabase Auth (best practice), you would link to auth.users instead.
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Hashed password
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the User Favorites table
-- This stores which players or teams a user has marked as favorite.
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('player', 'team')),
    ref_id INTEGER NOT NULL, -- ID of the player or team from the SQLite/Main database
    ref_name TEXT,           -- Name for quick display
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, type, ref_id)
);

-- 3. Enable Row Level Security (RLS)
-- This ensures data security in Supabase.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies
-- For server-to-server communication using the ANON KEY, we need to allow the backend to perform operations.
-- Note: In a production app, you'd typically use the SERVICE_ROLE_KEY on the backend to bypass RLS,
-- but since your .env uses the ANON_KEY, we'll enable full access for now.

CREATE POLICY "Allow full access to users" ON public.users 
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access to user_favorites" ON public.user_favorites 
    FOR ALL USING (true) WITH CHECK (true);

-- 5. Helper indices for performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_type_ref ON public.user_favorites(type, ref_id);
