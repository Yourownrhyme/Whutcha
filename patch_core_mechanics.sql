-- =========================================================================
-- 🛠️ WHUTCHA CORE MECHANICS HOTFIX: VIDEO-DONATIONS & CO-STREAMS
-- Run this in Supabase Dashboard -> SQL Editor for project kjoffilncbybquvjytxx
-- =========================================================================

-- 1. FIX OPERATOR DOES NOT EXIST: uuid = text
-- In public.banned_viewers, streamer_id is UUID.
-- In public.donations, streamer_id is TEXT.
-- Casting both to TEXT allows Postgres to evaluate equality cleanly without type mismatch crash.
CREATE OR REPLACE FUNCTION check_banned_viewer()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.viewer_device_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.banned_viewers 
        WHERE streamer_id::text = NEW.streamer_id::text 
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

-- 2. FIX CO-STREAM APPROVAL MUTATION BLOCK
-- The Stryker trigger prevented any changes to video_hash.
-- When a Co-Stream is approved, the streamer's dashboard updates video_hash from
-- 'costream_request' to the LiveKit OBS join token.
-- We must explicitly permit mutating video_hash when OLD.video_hash = 'costream_request'.
CREATE OR REPLACE FUNCTION prevent_core_data_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.amount IS DISTINCT FROM NEW.amount THEN
        RAISE EXCEPTION 'Stryker Doctrine: Cannot alter the donation amount after creation.';
    END IF;
    IF OLD.streamer_id IS DISTINCT FROM NEW.streamer_id THEN
        RAISE EXCEPTION 'Stryker Doctrine: Cannot reassign a donation to a different streamer.';
    END IF;
    IF OLD.video_hash IS DISTINCT FROM NEW.video_hash AND OLD.video_hash <> 'costream_request' THEN
        RAISE EXCEPTION 'Stryker Doctrine: Cannot alter the video payload hash.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_prevent_core_data_mutation ON public.donations;
CREATE TRIGGER tr_prevent_core_data_mutation
BEFORE UPDATE ON public.donations
FOR EACH ROW EXECUTE FUNCTION prevent_core_data_mutation();
