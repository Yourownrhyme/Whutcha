-- =========================================================================
-- 👁️‍🗨️ WHUTCHA PROTOCOL - MASTER UNIFIED PRODUCTION MIGRATION
-- Project: kjoffilncbybquvjytxx
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/kjoffilncbybquvjytxx/sql
-- =========================================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- 1. PROFILES & BROADCASTER DIRECTORY TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    platform TEXT DEFAULT 'Twitch',
    category TEXT DEFAULT 'Gaming',
    min_video_price NUMERIC DEFAULT 1.00,
    min_costream_price NUMERIC DEFAULT 5.00,
    external_pay_link TEXT,
    is_public_directory BOOLEAN DEFAULT false,
    claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    delisted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist if table was already created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'Twitch';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Gaming';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS min_video_price NUMERIC DEFAULT 1.00;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS min_costream_price NUMERIC DEFAULT 5.00;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS external_pay_link TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_public_directory BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS delisted BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (
    auth.uid()::text = id OR auth.uid() = claimed_by OR claimed_by IS NULL
);

-- =========================================================================
-- 2. SECRET CLAIM TOKENS TABLE (NINJA MODE: ZERO PUBLIC ACCESS)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.creator_claim_tokens (
    profile_id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL
);
ALTER TABLE public.creator_claim_tokens ENABLE ROW LEVEL SECURITY;
-- No public select policies: tokens are exclusively checked by SECURITY DEFINER RPCs

-- =========================================================================
-- 3. DONATIONS & CO-STREAMS LEDGER TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.donations (
    id TEXT PRIMARY KEY,
    streamer_id TEXT NOT NULL,
    viewer_device_id TEXT,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    username TEXT DEFAULT 'Anonymous',
    video_hash TEXT,
    "videoHash" TEXT,
    status TEXT DEFAULT 'pending',
    reaction_url TEXT,
    reaction_created_at TIMESTAMPTZ,
    is_escrow BOOLEAN DEFAULT false,
    bounty_message TEXT,
    payment_memo TEXT,
    join_token TEXT,
    is_purged BOOLEAN DEFAULT false,
    purged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS viewer_device_id TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS "videoHash" TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS reaction_url TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS reaction_created_at TIMESTAMPTZ;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS is_escrow BOOLEAN DEFAULT false;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS bounty_message TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS payment_memo TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS join_token TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS is_purged BOOLEAN DEFAULT false;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS purged_at TIMESTAMPTZ;

-- Indices for rapid real-time queue performance
CREATE INDEX IF NOT EXISTS idx_donations_streamer_status ON public.donations (streamer_id, status);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON public.donations (created_at DESC);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert donations" ON public.donations;
CREATE POLICY "Anyone can insert donations" 
ON public.donations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Donations are readable by anyone" ON public.donations;
CREATE POLICY "Donations are readable by anyone" 
ON public.donations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Streamers and users can update donations" ON public.donations;
CREATE POLICY "Streamers and users can update donations" 
ON public.donations FOR UPDATE USING (true);

-- =========================================================================
-- 4. BANNED VIEWERS TABLE (ANTI-TROLL BANISHMENT LEDGER)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.banned_viewers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    streamer_id TEXT NOT NULL,
    viewer_device_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(streamer_id, viewer_device_id)
);

ALTER TABLE public.banned_viewers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can check bans" ON public.banned_viewers;
CREATE POLICY "Public can check bans" 
ON public.banned_viewers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Broadcasters can insert bans" ON public.banned_viewers;
CREATE POLICY "Broadcasters can insert bans" 
ON public.banned_viewers FOR INSERT WITH CHECK (true);

-- Trigger: Block banned viewer before donation insertion
DROP TRIGGER IF EXISTS tr_check_banned_viewer ON public.donations;
DROP FUNCTION IF EXISTS check_banned_viewer() CASCADE;

CREATE OR REPLACE FUNCTION check_banned_viewer()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.banned_viewers 
        WHERE (streamer_id = NEW.streamer_id OR lower(streamer_id) = lower(NEW.streamer_id))
        AND viewer_device_id = NEW.viewer_device_id
    ) THEN
        RAISE EXCEPTION 'You have been blocked by this broadcaster.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_check_banned_viewer
BEFORE INSERT ON public.donations
FOR EACH ROW EXECUTE FUNCTION check_banned_viewer();

-- =========================================================================
-- 5. SKYNET BOT PROTECTION & RATE LIMITING
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.ip_rate_limits (
    ip_address TEXT PRIMARY KEY,
    request_count INT DEFAULT 1,
    last_request_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS tr_check_skynet_rate_limit ON public.donations;
DROP FUNCTION IF EXISTS check_skynet_rate_limit() CASCADE;

CREATE OR REPLACE FUNCTION check_skynet_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
    client_ip TEXT;
    current_count INT;
    last_time TIMESTAMPTZ;
    MAX_REQUESTS CONSTANT INT := 10;
    WINDOW_MINUTES CONSTANT INT := 1;
BEGIN
    BEGIN
        client_ip := current_setting('request.headers', true)::json->>'x-forwarded-for';
        client_ip := split_part(client_ip, ',', 1);
    EXCEPTION WHEN OTHERS THEN
        client_ip := 'unknown';
    END;

    IF client_ip IS NULL OR client_ip = 'unknown' THEN
        RETURN NEW;
    END IF;

    SELECT request_count, last_request_at INTO current_count, last_time 
    FROM public.ip_rate_limits WHERE ip_address = client_ip;

    IF NOT FOUND THEN
        INSERT INTO public.ip_rate_limits (ip_address, request_count, last_request_at)
        VALUES (client_ip, 1, NOW());
    ELSE
        IF NOW() - last_time > (WINDOW_MINUTES || ' minutes')::interval THEN
            UPDATE public.ip_rate_limits 
            SET request_count = 1, last_request_at = NOW() 
            WHERE ip_address = client_ip;
        ELSE
            IF current_count >= MAX_REQUESTS THEN
                RAISE EXCEPTION 'SKYNET_BLOCKED: Rate limit exceeded. Maximum 10 requests per minute.';
            ELSE
                UPDATE public.ip_rate_limits 
                SET request_count = request_count + 1 
                WHERE ip_address = client_ip;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_check_skynet_rate_limit
BEFORE INSERT ON public.donations
FOR EACH ROW EXECUTE FUNCTION check_skynet_rate_limit();

-- =========================================================================
-- 6. STRYKER DOCTRINE INTEGRITY TRIGGERS
-- =========================================================================
DROP TRIGGER IF EXISTS tr_force_pending_on_insert ON public.donations;
DROP FUNCTION IF EXISTS force_pending_on_insert() CASCADE;

CREATE OR REPLACE FUNCTION force_pending_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Escrow items remain escrow, all other new donations must start as pending
    IF NEW.is_escrow IS TRUE OR NEW.status = 'escrow' THEN
        NEW.status := 'escrow';
        NEW.is_escrow := true;
    ELSE
        NEW.status := 'pending';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_force_pending_on_insert
BEFORE INSERT ON public.donations
FOR EACH ROW EXECUTE FUNCTION force_pending_on_insert();

DROP TRIGGER IF EXISTS tr_enforce_positive_amount ON public.donations;
DROP FUNCTION IF EXISTS enforce_positive_amount() CASCADE;

CREATE OR REPLACE FUNCTION enforce_positive_amount()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.amount <= 0 THEN
        RAISE EXCEPTION 'Donation amount must be strictly greater than zero.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_enforce_positive_amount
BEFORE INSERT OR UPDATE ON public.donations
FOR EACH ROW EXECUTE FUNCTION enforce_positive_amount();

DROP TRIGGER IF EXISTS tr_prevent_core_data_mutation ON public.donations;
DROP FUNCTION IF EXISTS prevent_core_data_mutation() CASCADE;

CREATE OR REPLACE FUNCTION prevent_core_data_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.amount IS DISTINCT FROM NEW.amount THEN
        RAISE EXCEPTION 'Stryker Doctrine: Cannot alter the donation amount after creation.';
    END IF;
    IF OLD.streamer_id IS DISTINCT FROM NEW.streamer_id THEN
        RAISE EXCEPTION 'Stryker Doctrine: Cannot reassign a donation to a different broadcaster.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_prevent_core_data_mutation
BEFORE UPDATE ON public.donations
FOR EACH ROW EXECUTE FUNCTION prevent_core_data_mutation();

-- =========================================================================
-- 7. STREAMER INTEGRATIONS (DISCORD & TELEGRAM NINJA STORAGE)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.streamer_integrations (
    user_id UUID PRIMARY KEY,
    discord_webhook_url TEXT,
    discord_enabled BOOLEAN DEFAULT true,
    telegram_chat_id TEXT,
    telegram_bot_token TEXT,
    telegram_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.streamer_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Streamers view own integrations" ON public.streamer_integrations;
CREATE POLICY "Streamers view own integrations" 
ON public.streamer_integrations FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Streamers insert own integrations" ON public.streamer_integrations;
CREATE POLICY "Streamers insert own integrations" 
ON public.streamer_integrations FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Streamers update own integrations" ON public.streamer_integrations;
CREATE POLICY "Streamers update own integrations" 
ON public.streamer_integrations FOR UPDATE TO authenticated 
USING (auth.uid() = user_id);

-- Discord RPCs
DROP FUNCTION IF EXISTS public.save_discord_webhook(TEXT, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS public.save_discord_webhook(TEXT) CASCADE;

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
    IF v_clean_url IS NOT NULL AND v_clean_url !~* '^https://([a-z0-9]+\.)?discord\.com/api/webhooks/.+' THEN
        RETURN json_build_object('status', 'error', 'message', 'Invalid Discord webhook format.');
    END IF;

    UPDATE public.streamer_integrations
    SET discord_webhook_url = v_clean_url,
        discord_enabled = p_enabled,
        updated_at = NOW()
    WHERE user_id = v_user_id;

    IF NOT FOUND THEN
        INSERT INTO public.streamer_integrations (user_id, discord_webhook_url, discord_enabled, updated_at)
        VALUES (v_user_id, v_clean_url, p_enabled, NOW());
    END IF;

    RETURN json_build_object('status', 'success', 'message', 'Discord webhook saved successfully!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.get_discord_webhook() CASCADE;

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

-- Telegram RPCs
DROP FUNCTION IF EXISTS public.save_telegram_config(TEXT, TEXT, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS public.save_telegram_config(TEXT, TEXT) CASCADE;

CREATE OR REPLACE FUNCTION save_telegram_config(p_chat_id TEXT, p_bot_token TEXT, p_enabled BOOLEAN DEFAULT true)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_clean_chat_id TEXT := NULLIF(trim(p_chat_id), '');
    v_clean_token TEXT := NULLIF(trim(p_bot_token), '');
BEGIN
    IF v_user_id IS NULL THEN
        RETURN json_build_object('status', 'error', 'message', 'Authentication required.');
    END IF;

    IF v_clean_token IS NOT NULL AND v_clean_token !~* '^[0-9]+:[a-zA-Z0-9_-]+$' THEN
        RETURN json_build_object('status', 'error', 'message', 'Invalid Telegram bot token format.');
    END IF;

    UPDATE public.streamer_integrations
    SET telegram_chat_id = v_clean_chat_id,
        telegram_bot_token = v_clean_token,
        telegram_enabled = p_enabled,
        updated_at = NOW()
    WHERE user_id = v_user_id;

    IF NOT FOUND THEN
        INSERT INTO public.streamer_integrations (user_id, telegram_chat_id, telegram_bot_token, telegram_enabled, updated_at)
        VALUES (v_user_id, v_clean_chat_id, v_clean_token, p_enabled, NOW());
    END IF;

    RETURN json_build_object('status', 'success', 'message', 'Telegram configuration saved!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.get_telegram_config() CASCADE;

CREATE OR REPLACE FUNCTION get_telegram_config()
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
        RETURN json_build_object('has_telegram', false, 'enabled', false, 'chat_id', '', 'bot_token', '');
    END IF;

    RETURN json_build_object(
        'has_telegram', (v_rec.telegram_chat_id IS NOT NULL AND v_rec.telegram_bot_token IS NOT NULL),
        'enabled', COALESCE(v_rec.telegram_enabled, true),
        'chat_id', COALESCE(v_rec.telegram_chat_id, ''),
        'bot_token', COALESCE(v_rec.telegram_bot_token, '')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- 8. PUSH NOTIFICATIONS SUBSCRIPTIONS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own push subscription" ON public.push_subscriptions;
CREATE POLICY "Users can manage own push subscription" 
ON public.push_subscriptions FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Drop function with any return type or signature variant before recreating
DROP FUNCTION IF EXISTS public.save_push_subscription(JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.save_push_subscription(JSON) CASCADE;
DROP FUNCTION IF EXISTS public.save_push_subscription() CASCADE;
DROP FUNCTION IF EXISTS save_push_subscription(JSONB) CASCADE;
DROP FUNCTION IF EXISTS save_push_subscription(JSON) CASCADE;
DROP FUNCTION IF EXISTS save_push_subscription() CASCADE;

CREATE OR REPLACE FUNCTION save_push_subscription(p_subscription JSONB)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RETURN json_build_object('status', 'error', 'message', 'Authentication required.');
    END IF;

    INSERT INTO public.push_subscriptions (user_id, subscription, updated_at)
    VALUES (v_user_id, p_subscription, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        subscription = EXCLUDED.subscription,
        updated_at = NOW();

    RETURN json_build_object('status', 'success', 'message', 'Push subscription saved');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- 9. LEADERBOARD & DIRECTORY RPCS
-- =========================================================================
DROP FUNCTION IF EXISTS public.get_leaderboard(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_leaderboard() CASCADE;

CREATE OR REPLACE FUNCTION get_leaderboard(time_window TEXT DEFAULT 'today')
RETURNS TABLE (
    id TEXT,
    username TEXT,
    avatar_url TEXT,
    category TEXT,
    platform TEXT,
    total_donations BIGINT,
    total_volume NUMERIC,
    bounty_count BIGINT
) AS $$
DECLARE
    v_interval INTERVAL;
BEGIN
    IF time_window = 'week' THEN
        v_interval := INTERVAL '7 days';
    ELSIF time_window = 'month' THEN
        v_interval := INTERVAL '30 days';
    ELSIF time_window = 'all' THEN
        v_interval := INTERVAL '100 years';
    ELSE
        v_interval := INTERVAL '24 hours';
    END IF;

    RETURN QUERY
    SELECT 
        p.id,
        p.username,
        p.avatar_url,
        p.category,
        p.platform,
        COALESCE(COUNT(d.id), 0) AS total_donations,
        COALESCE(SUM(d.amount), 0.00) AS total_volume,
        COALESCE(COUNT(d.id) FILTER (WHERE d.is_escrow = true OR d.status = 'escrow'), 0) AS bounty_count
    FROM public.profiles p
    LEFT JOIN public.donations d ON (
        (d.streamer_id = p.id OR lower(d.streamer_id) = lower(p.username))
        AND d.created_at >= (NOW() - v_interval)
        AND d.status IN ('approved', 'completed', 'escrow')
    )
    WHERE p.delisted IS NOT TRUE
    GROUP BY p.id, p.username, p.avatar_url, p.category, p.platform
    ORDER BY total_volume DESC, total_donations DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.get_streamer_escrow_pool(TEXT) CASCADE;

CREATE OR REPLACE FUNCTION get_streamer_escrow_pool(p_streamer_id TEXT)
RETURNS JSON AS $$
DECLARE
    v_total NUMERIC := 0.00;
    v_count INT := 0;
    v_canonical_id TEXT;
    v_username TEXT;
BEGIN
    SELECT id, username INTO v_canonical_id, v_username 
    FROM public.profiles 
    WHERE id = p_streamer_id OR lower(username) = lower(p_streamer_id);

    IF v_canonical_id IS NULL THEN
        v_canonical_id := p_streamer_id;
    END IF;

    SELECT COALESCE(SUM(amount), 0.00), COUNT(*)
    INTO v_total, v_count
    FROM public.donations
    WHERE (streamer_id = v_canonical_id OR (v_username IS NOT NULL AND lower(streamer_id) = lower(v_username)))
      AND (status = 'escrow' OR is_escrow = true);

    RETURN json_build_object(
        'total_amount', v_total,
        'bounty_count', v_count,
        'streamer_id', v_canonical_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.claim_creator_profile(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.claim_creator_profile(TEXT) CASCADE;

CREATE OR REPLACE FUNCTION claim_creator_profile(p_streamer_id TEXT, p_claim_token TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    v_profile RECORD;
    v_user_id UUID := auth.uid();
    v_secret_token TEXT;
    v_unlocked_count INT := 0;
    v_unlocked_total NUMERIC := 0.00;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN json_build_object('status', 'error', 'message', 'Authentication required.');
    END IF;

    SELECT * INTO v_profile FROM public.profiles WHERE id = p_streamer_id;
    IF NOT FOUND THEN
        SELECT * INTO v_profile FROM public.profiles WHERE lower(username) = lower(p_streamer_id);
        IF NOT FOUND THEN
            RETURN json_build_object('status', 'error', 'message', 'Profile not found.');
        END IF;
    END IF;

    IF v_profile.delisted THEN
        RETURN json_build_object('status', 'error', 'message', 'This channel has been delisted.');
    END IF;

    IF v_profile.claimed_by IS NOT NULL THEN
        RETURN json_build_object('status', 'error', 'message', 'This channel has already been claimed.');
    END IF;

    SELECT token INTO v_secret_token FROM public.creator_claim_tokens WHERE profile_id = v_profile.id;

    IF v_secret_token IS NOT NULL THEN
        IF p_claim_token IS NULL OR trim(p_claim_token) = '' OR v_secret_token <> trim(p_claim_token) THEN
            RETURN json_build_object('status', 'error', 'message', 'Invalid verification code.');
        END IF;
    END IF;

    UPDATE public.profiles
    SET claimed_by = v_user_id,
        is_public_directory = false
    WHERE id = v_profile.id;

    DELETE FROM public.creator_claim_tokens WHERE profile_id = v_profile.id;

    WITH unlocked AS (
        UPDATE public.donations
        SET status = 'pending',
            is_escrow = false
        WHERE (streamer_id = v_profile.id OR lower(streamer_id) = lower(v_profile.username))
          AND (status = 'escrow' OR is_escrow = true)
        RETURNING amount
    )
    SELECT COUNT(*), COALESCE(SUM(amount), 0.00)
    INTO v_unlocked_count, v_unlocked_total
    FROM unlocked;

    RETURN json_build_object(
        'status', 'success', 
        'message', 'Channel claimed successfully!', 
        'channel_id', v_profile.id,
        'username', v_profile.username,
        'unlocked_bounties_count', v_unlocked_count,
        'unlocked_bounties_total', v_unlocked_total
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.delist_creator_profile(TEXT) CASCADE;

CREATE OR REPLACE FUNCTION delist_creator_profile(p_streamer_id TEXT)
RETURNS JSON AS $$
DECLARE
    v_profile RECORD;
BEGIN
    SELECT * INTO v_profile FROM public.profiles WHERE id = p_streamer_id;
    IF NOT FOUND THEN
        SELECT * INTO v_profile FROM public.profiles WHERE lower(username) = lower(p_streamer_id);
        IF NOT FOUND THEN
            RETURN json_build_object('status', 'error', 'message', 'Profile not found.');
        END IF;
    END IF;

    IF v_profile.claimed_by IS NOT NULL AND (auth.uid() IS NULL OR auth.uid() <> v_profile.claimed_by) THEN
        RETURN json_build_object('status', 'error', 'message', 'Unauthorized to delist this channel.');
    END IF;

    UPDATE public.profiles
    SET delisted = true,
        is_public_directory = false
    WHERE id = v_profile.id;

    RETURN json_build_object('status', 'success', 'message', 'Channel delisted successfully.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.save_streamer_reaction(TEXT, TEXT) CASCADE;

CREATE OR REPLACE FUNCTION save_streamer_reaction(p_donation_id TEXT, p_reaction_url TEXT)
RETURNS JSONB AS $$
DECLARE
    v_updated_count INT;
BEGIN
    UPDATE public.donations
    SET reaction_url = p_reaction_url,
        reaction_created_at = NOW()
    WHERE id = p_donation_id;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Donation not found');
    END IF;

    RETURN jsonb_build_object('success', true, 'donation_id', p_donation_id, 'reaction_url', p_reaction_url);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- 10. 12-HOUR TTL STORAGE CLEANUP RPC
-- =========================================================================
DROP FUNCTION IF EXISTS public.cleanup_expired_videos(INT) CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_videos() CASCADE;

CREATE OR REPLACE FUNCTION cleanup_expired_videos(p_hours INT DEFAULT 12)
RETURNS TABLE (
    purged_id TEXT,
    video_hash TEXT
) AS $$
DECLARE
    v_cutoff TIMESTAMPTZ := NOW() - (p_hours || ' hours')::interval;
BEGIN
    RETURN QUERY
    WITH expired_items AS (
        SELECT id, COALESCE(d.video_hash, d."videoHash") as hash_val
        FROM public.donations d
        WHERE d.created_at < v_cutoff
          AND d.is_purged IS NOT TRUE
          AND COALESCE(d.video_hash, d."videoHash") IS NOT NULL
          AND COALESCE(d.video_hash, d."videoHash") !~* '^(\./assets/|sim_|costream_request|loco-kwokka)'
    ),
    mark_purged AS (
        UPDATE public.donations d
        SET is_purged = true,
            purged_at = NOW(),
            video_hash = NULL,
            "videoHash" = NULL
        FROM expired_items e
        WHERE d.id = e.id
        RETURNING d.id, e.hash_val
    )
    SELECT id, hash_val FROM mark_purged;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Explicit RPC execution grants
GRANT EXECUTE ON FUNCTION get_leaderboard(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_streamer_escrow_pool(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION claim_creator_profile(TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION delist_creator_profile(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION save_discord_webhook(TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION get_discord_webhook() TO authenticated;
GRANT EXECUTE ON FUNCTION save_telegram_config(TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION get_telegram_config() TO authenticated;
GRANT EXECUTE ON FUNCTION save_push_subscription(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION save_streamer_reaction(TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION cleanup_expired_videos(INT) TO authenticated, service_role;
