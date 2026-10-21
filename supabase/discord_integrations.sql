-- =========================================================================
-- 🎮 WHUTCHA DISCORD INTEGRATIONS ENGINE (NINJA MODE SECURE STORAGE)
-- Run this in Supabase Dashboard -> SQL Editor (Project: kjoffilncbybquvjytxx)
-- =========================================================================

-- 1. ISOLATED INTEGRATIONS TABLE (Zero Public Leaks)
CREATE TABLE IF NOT EXISTS public.streamer_integrations (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    discord_webhook_url TEXT,
    discord_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.streamer_integrations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Streamers can view own integrations" ON public.streamer_integrations;
DROP POLICY IF EXISTS "Streamers can update own integrations" ON public.streamer_integrations;
DROP POLICY IF EXISTS "Streamers can insert own integrations" ON public.streamer_integrations;

-- Strict Owner-Only Access
CREATE POLICY "Streamers can view own integrations" 
ON public.streamer_integrations FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Streamers can insert own integrations" 
ON public.streamer_integrations FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Streamers can update own integrations" 
ON public.streamer_integrations FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- 2. SECURE RPC: SAVE DISCORD WEBHOOK
CREATE OR REPLACE FUNCTION save_discord_webhook(p_url TEXT, p_enabled BOOLEAN DEFAULT true)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_clean_url TEXT;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN json_build_object('status', 'error', 'message', 'Authentication required.');
    END IF;

    v_clean_url := NULLIF(trim(p_url), '');

    -- Stryker & Skynet URL Validation
    IF v_clean_url IS NOT NULL AND v_clean_url !~* '^https://([a-z0-9]+\.)?discord\.com/api/webhooks/.+' THEN
        RETURN json_build_object('status', 'error', 'message', 'Invalid Discord webhook URL format. Must start with https://discord.com/api/webhooks/...');
    END IF;

    -- Safe Upsert without ON CONFLICT keyword dependencies
    UPDATE public.streamer_integrations
    SET discord_webhook_url = v_clean_url,
        discord_enabled = p_enabled,
        updated_at = NOW()
    WHERE user_id = v_user_id;

    IF NOT FOUND THEN
        INSERT INTO public.streamer_integrations (user_id, discord_webhook_url, discord_enabled, updated_at)
        VALUES (v_user_id, v_clean_url, p_enabled, NOW());
    END IF;

    RETURN json_build_object(
        'status', 'success',
        'message', 'Discord webhook saved successfully!',
        'enabled', p_enabled,
        'has_webhook', (v_clean_url IS NOT NULL)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. SECURE RPC: GET DISCORD WEBHOOK CONFIG (Owner only)
CREATE OR REPLACE FUNCTION get_discord_webhook()
RETURNS JSON AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_rec RECORD;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN json_build_object('status', 'error', 'message', 'Authentication required.');
    END IF;

    SELECT * INTO v_rec FROM public.streamer_integrations WHERE user_id = v_user_id;
    IF NOT FOUND THEN
        RETURN json_build_object('has_webhook', false, 'enabled', false, 'webhook_url', '');
    END IF;

    RETURN json_build_object(
        'has_webhook', (v_rec.discord_webhook_url IS NOT NULL AND v_rec.discord_webhook_url <> ''),
        'enabled', COALESCE(v_rec.discord_enabled, true),
        'webhook_url', COALESCE(v_rec.discord_webhook_url, '')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Explicit RPC execution grants
GRANT EXECUTE ON FUNCTION save_discord_webhook(TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION get_discord_webhook() TO authenticated;
