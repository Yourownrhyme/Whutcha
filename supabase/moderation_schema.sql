-- ==============================================
-- 🚫 WHUTCHA ANTI-TROLL SYSTEM (BANNED VIEWERS)
-- ==============================================

-- 1. Add Device ID tracking to donations
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS viewer_device_id TEXT;

-- 2. Create the banned_viewers table
CREATE TABLE IF NOT EXISTS public.banned_viewers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    streamer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    viewer_device_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(streamer_id, viewer_device_id)
);

-- 3. Enable RLS
ALTER TABLE public.banned_viewers ENABLE ROW LEVEL SECURITY;

-- Streamers can read their own banned viewers
CREATE POLICY "Streamers can view their bans" ON public.banned_viewers
    FOR SELECT USING (auth.uid() = streamer_id);

-- Streamers can insert bans
CREATE POLICY "Streamers can insert bans" ON public.banned_viewers
    FOR INSERT WITH CHECK (auth.uid() = streamer_id);

-- 4. Enforce the Ban using a Postgres Trigger
-- This stops the donation BEFORE it even hits the queue
CREATE OR REPLACE FUNCTION check_banned_viewer()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.banned_viewers 
        WHERE streamer_id = NEW.streamer_id 
        AND viewer_device_id = NEW.viewer_device_id
    ) THEN
        RAISE EXCEPTION 'You have been blocked by this streamer.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_banned_viewer ON public.donations;
CREATE TRIGGER tr_check_banned_viewer
BEFORE INSERT ON public.donations
FOR EACH ROW EXECUTE FUNCTION check_banned_viewer();
