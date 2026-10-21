-- =========================================================================
-- 🌐 WHUTCHA PHASE 2: PUBLIC CREATOR DIRECTORY & CLAIM ENGINE
-- Run this in Supabase Dashboard -> SQL Editor (Project: kjoffilncbybquvjytxx)
-- =========================================================================

-- 1. EXTEND PROFILES TABLE FOR DIRECTORY & CLAIMING
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_public_directory BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS delisted BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Gaming';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'Twitch';

-- 2. NINJA MODE: ISOLATED SECRET CLAIM TOKENS TABLE (0 PUBLIC SELECT ACCESS)
CREATE TABLE IF NOT EXISTS public.creator_claim_tokens (
    profile_id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL
);
ALTER TABLE public.creator_claim_tokens ENABLE ROW LEVEL SECURITY;
-- By enabling RLS without public SELECT policies, tokens are never exposed via PostgREST REST API!

-- 3. SECURE RPC: CLAIM CREATOR PROFILE (WITH STRYKER & MUTATION IMMUNITY)
CREATE OR REPLACE FUNCTION claim_creator_profile(p_streamer_id TEXT, p_claim_token TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    v_profile RECORD;
    v_user_id UUID := auth.uid();
    v_secret_token TEXT;
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

    -- STRYKER MUTATION DEFENSE: If a token exists, the user MUST supply the exact matching token
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

    RETURN json_build_object(
        'status', 'success', 
        'message', 'Channel claimed successfully!', 
        'channel_id', v_profile.id,
        'username', v_profile.username
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. SECURE RPC: 1-CLICK INSTANT DELIST (GDPR Right to be Forgotten with Troll Defense)
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

    -- TROLL MODE DEFENSE: If already claimed, only the authenticated channel owner can delist
    IF v_profile.claimed_by IS NOT NULL AND (auth.uid() IS NULL OR auth.uid() <> v_profile.claimed_by) THEN
        RETURN json_build_object('status', 'error', 'message', 'Unauthorized: Only the verified channel owner can delist this channel.');
    END IF;

    UPDATE public.profiles
    SET delisted = true,
        is_public_directory = false
    WHERE id = v_profile.id;

    RETURN json_build_object('status', 'success', 'message', 'Channel delisted successfully.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Explicit RPC execution grants
GRANT EXECUTE ON FUNCTION claim_creator_profile(TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION delist_creator_profile(TEXT) TO authenticated, anon;

-- 5. SEED 10 CURATED MID-TIER CREATOR NODES (70% IRL/Reactions, 30% Skill/1v1)
INSERT INTO public.profiles (
    id, username, category, bio, platform, min_video_price, min_costream_price, is_public_directory, avatar_url
) VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    'Valkyrie_IRL',
    'IRL & Travel',
    'Streaming street food & nightlife in Tokyo. Send a video message to roast my location!',
    'Twitch',
    10.00,
    25.00,
    true,
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80'
),
(
    'a0000000-0000-0000-0000-000000000002',
    'Kazuya_God',
    'Fighting Games',
    'Tekken 8 God of Destruction. Pay $15 to Co-Stream and challenge me 1v1 live on broadcast!',
    'Kick',
    5.00,
    15.00,
    true,
    'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=256&h=256&q=80'
),
(
    'a0000000-0000-0000-0000-000000000003',
    'Miku_VT',
    'VTuber & Anime',
    'Cyberpunk Catgirl VTuber. $20 for Video Roast, $50 for Live Co-Stream duet!',
    'Twitch',
    20.00,
    50.00,
    true,
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=256&h=256&q=80'
),
(
    'a0000000-0000-0000-0000-000000000004',
    'CyberBeats_Live',
    'Music & Production',
    'Cooking synthwave & trap beats on Ableton. Send your beat via video donation for live feedback.',
    'YouTube',
    15.00,
    30.00,
    true,
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=256&h=256&q=80'
),
(
    'a0000000-0000-0000-0000-000000000005',
    'Doctor_Hardware',
    'Tech & Setups',
    'Roasting messy battle-stations & debugging PC crashes live on camera. Send your video tour!',
    'Twitch',
    10.00,
    25.00,
    true,
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80'
),
(
    'a0000000-0000-0000-0000-000000000006',
    'Speedy_64',
    'Speedrunning',
    'SM64 & Zelda 16-star speedrunner. Video message challenges and bounties active!',
    'Twitch',
    10.00,
    20.00,
    true,
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80'
),
(
    'a0000000-0000-0000-0000-000000000007',
    'Neon_Chef',
    'Cooking & IRL',
    'Late-night kitchen streams. Rate my dish or send your fridge video for a live recipe.',
    'Kick',
    5.00,
    15.00,
    true,
    'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=256&h=256&q=80'
),
(
    'a0000000-0000-0000-0000-000000000008',
    'Retro_Arcade',
    'Retro Gaming',
    'Original CRT monitors & arcade cabinets. Call-in co-stream for retro gaming trivia!',
    'YouTube',
    5.00,
    10.00,
    true,
    'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=256&h=256&q=80'
),
(
    'a0000000-0000-0000-0000-000000000009',
    'Apex_Predator',
    'FPS Competitive',
    'Predator rank grind. 60-second Co-Stream squad interview between matches.',
    'Twitch',
    15.00,
    35.00,
    true,
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=256&h=256&q=80'
),
(
    'a0000000-0000-0000-0000-000000000010',
    'Roast_My_Resume',
    'Tech & Career',
    'Senior tech lead roasting software resumes & code portfolios live on camera.',
    'Twitch',
    25.00,
    60.00,
    true,
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&h=256&q=80'
)
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    category = EXCLUDED.category,
    bio = EXCLUDED.bio,
    platform = EXCLUDED.platform,
    min_video_price = EXCLUDED.min_video_price,
    min_costream_price = EXCLUDED.min_costream_price,
    is_public_directory = EXCLUDED.is_public_directory,
    avatar_url = EXCLUDED.avatar_url;

-- 6. POPULATE SECRET VERIFICATION TOKENS IN ISOLATED TABLE
INSERT INTO public.creator_claim_tokens (profile_id, token) VALUES
('a0000000-0000-0000-0000-000000000001', 'tok_valk_9918'),
('a0000000-0000-0000-0000-000000000002', 'tok_kaz_8821'),
('a0000000-0000-0000-0000-000000000003', 'tok_miku_7734'),
('a0000000-0000-0000-0000-000000000004', 'tok_beat_6641'),
('a0000000-0000-0000-0000-000000000005', 'tok_doc_5529'),
('a0000000-0000-0000-0000-000000000006', 'tok_sm64_4412'),
('a0000000-0000-0000-0000-000000000007', 'tok_chef_3391'),
('a0000000-0000-0000-0000-000000000008', 'tok_arc_2288'),
('a0000000-0000-0000-0000-000000000009', 'tok_apex_1190'),
('a0000000-0000-0000-0000-000000000010', 'tok_faang_0077')
ON CONFLICT (profile_id) DO UPDATE SET token = EXCLUDED.token;
