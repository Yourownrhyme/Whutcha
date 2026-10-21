-- ==============================================
-- 🎬 NODE 5: REACTION RECORDER ENGINE SCHEMA
-- Adds reaction clip tracking to public.donations
-- ==============================================

-- 1. Add reaction columns to donations table
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS reaction_url TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS reaction_created_at TIMESTAMPTZ;

-- 2. Ensure Stryker Doctrine allows updating reaction_url
-- (The existing prevent_core_data_mutation trigger only locks amount, streamer_id, and video_hash,
--  so reaction_url and reaction_created_at are naturally permitted to be updated)

-- 3. Storage bucket policy: Ensure authenticated streamers can upload reactions
-- Note: 'videos' bucket already exists. Reactions can be stored in the 'videos' bucket
-- under 'reactions/reaction_<id>.webm' or as a standalone object.

-- 4. Atomic RPC to save reaction clip
CREATE OR REPLACE FUNCTION public.save_streamer_reaction(
    p_donation_id TEXT,
    p_reaction_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_count INT;
BEGIN
    UPDATE public.donations
    SET 
        reaction_url = p_reaction_url,
        reaction_created_at = NOW()
    WHERE id = p_donation_id;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    IF v_updated_count = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Donation not found');
    END IF;

    RETURN jsonb_build_object('success', true, 'donation_id', p_donation_id, 'reaction_url', p_reaction_url);
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_streamer_reaction(TEXT, TEXT) TO authenticated, anon;
