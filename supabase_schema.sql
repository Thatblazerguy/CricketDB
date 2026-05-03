-- Run this in your Supabase SQL Editor (SQL Editor -> New Query)

-- 1. Create the Users table
CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the UserFavorites table to store user-specific personalized data
CREATE TABLE public.user_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('player', 'team')),
    ref_id INTEGER,
    ref_name TEXT,
    UNIQUE(user_id, type, ref_id)
);

-- 3. Enable RLS (Row Level Security) - Optional but recommended for security
-- For now, we will allow all authenticated requests from our backend API
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow backend full access to users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow backend full access to user_favorites" ON public.user_favorites FOR ALL USING (true);
