-- =========================================================================
-- 💰 WHUTCHA PHASE 3: TROJAN ESCROW BOUNTY ENGINE ("DONATION WAITING FOR YOU")
-- Run this in Supabase Dashboard -> SQL Editor (Project: kjoffilncbybquvjytxx)
-- =========================================================================

-- 1. EXTEND DONATIONS TABLE FOR ESCROW BOUNTIES
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS is_escrow BOOLEAN DEFAULT false;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS bounty_message TEXT;

-- 2. SECURE RPC: GET STREAMER ESCROW POOL (TOTAL $ WAITING FOR STREAMER)
CREATE OR REPLACE FUNCTION get_streamer_escrow_pool(p_streamer_id TEXT)
RETURNS JSON AS $$
DECLARE
    v_total NUMERIC := 0.00;
    v_count INT := 0;
    v_canonical_id TEXT;
    v_username TEXT;
BEGIN
    -- Resolve canonical ID and username
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

-- 3. UPGRADE CLAIM RPC: AUTOMATICALLY UNLOCK ESCROW BOUNTIES UPON CHANNEL CLAIM
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
        RETURN json_build_object('status', 'error', 'message', 'Authentication required to claim a channel.');
    END IF;

    -- Lookup by canonical ID or case-insensitive username
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

    -- Fetch secret claim token if registered
    SELECT token INTO v_secret_token FROM public.creator_claim_tokens WHERE profile_id = v_profile.id;

    -- STRYKER MUTATION DEFENSE: If a token exists, caller must provide exact token
    IF v_secret_token IS NOT NULL THEN
        IF p_claim_token IS NULL OR trim(p_claim_token) = '' OR v_secret_token <> trim(p_claim_token) THEN
            RETURN json_build_object('status', 'error', 'message', 'Invalid or missing claim token. Please provide the secret verification code.');
        END IF;
    END IF;

    -- Bind channel to the authenticated creator
    UPDATE public.profiles
    SET claimed_by = v_user_id,
        is_public_directory = false
    WHERE id = v_profile.id;

    -- Consume the claim token
    DELETE FROM public.creator_claim_tokens WHERE profile_id = v_profile.id;

    -- ⚡ UNLOCK ESCROW BOUNTIES: Transfer all escrow donations into the active queue
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

-- Explicit RPC execution grants
GRANT EXECUTE ON FUNCTION get_streamer_escrow_pool(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION claim_creator_profile(TEXT, TEXT) TO authenticated, anon;

-- 4. SEED A LIVE DEMO ESCROW BOUNTY FOR KAZUYA_GOD ($25) WITH LOCO KWOKKA
INSERT INTO public.donations (
    id,
    streamer_id,
    username,
    amount,
    "videoHash",
    video_hash,
    status,
    is_escrow,
    bounty_message,
    created_at
) VALUES (
    'BOUNTY-KAZ-01',
    'a0000000-0000-0000-0000-000000000002',
    'LocoKwokka_Homie',
    25.00,
    'sample.mp4',
    'sample.mp4',
    'escrow',
    true,
    'Aye vato! Challenge me 1v1 in Tekken! The $25 bag is waiting for you in escrow, carnallll!',
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    amount = EXCLUDED.amount,
    status = EXCLUDED.status,
    is_escrow = EXCLUDED.is_escrow;
