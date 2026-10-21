-- =========================================================================
-- 📱 WHUTCHA TELEGRAM BOT ALERTS INTEGRATION (NINJA MODE SECURE STORAGE)
-- Run this in Supabase Dashboard -> SQL Editor (Project: kjoffilncbybquvjytxx)
-- =========================================================================

-- 1. ADD TELEGRAM COLUMNS TO STREAMER INTEGRATIONS TABLE
ALTER TABLE public.streamer_integrations 
ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT,
ADD COLUMN IF NOT EXISTS telegram_bot_token TEXT,
ADD COLUMN IF NOT EXISTS telegram_enabled BOOLEAN DEFAULT true;

-- 2. SECURE RPC: SAVE TELEGRAM CONFIG (Owner Only)
CREATE OR REPLACE FUNCTION save_telegram_config(p_chat_id TEXT, p_bot_token TEXT, p_enabled BOOLEAN DEFAULT true)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_clean_chat_id TEXT;
    v_clean_token TEXT;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN json_build_object('status', 'error', 'message', 'Authentication required.');
    END IF;

    v_clean_chat_id := NULLIF(trim(p_chat_id), '');
    v_clean_token := NULLIF(trim(p_bot_token), '');

    -- Stryker & Skynet Format Validation
    IF v_clean_token IS NOT NULL AND v_clean_token !~* '^[0-9]+:[a-zA-Z0-9_-]+$' THEN
        RETURN json_build_object('status', 'error', 'message', 'Invalid Telegram Bot Token format. Expected format: 123456789:ABC-DEF...');
    END IF;

    -- Safe Upsert without ON CONFLICT keyword dependencies
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

    RETURN json_build_object(
        'status', 'success',
        'message', 'Telegram alerts configuration saved successfully!',
        'enabled', p_enabled,
        'has_telegram', (v_clean_chat_id IS NOT NULL AND v_clean_token IS NOT NULL)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. SECURE RPC: GET TELEGRAM CONFIG (Owner Only)
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
        'has_telegram', (v_rec.telegram_chat_id IS NOT NULL AND v_rec.telegram_chat_id <> '' AND v_rec.telegram_bot_token IS NOT NULL AND v_rec.telegram_bot_token <> ''),
        'enabled', COALESCE(v_rec.telegram_enabled, true),
        'chat_id', COALESCE(v_rec.telegram_chat_id, ''),
        'bot_token', COALESCE(v_rec.telegram_bot_token, '')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Explicit RPC execution grants
GRANT EXECUTE ON FUNCTION save_telegram_config(TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION get_telegram_config() TO authenticated;
