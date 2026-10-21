-- ==============================================
-- 🧬 THE STRYKER DOCTRINE (ANTI-HALLUCINATION)
-- ==============================================

-- 1. FORCE 'pending' ON INSERT
-- No matter what the client sends, a new donation MUST start as pending.
-- This prevents hackers from bypassing the admin queue.
CREATE OR REPLACE FUNCTION force_pending_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Override any attempt to insert an 'approved' or 'rejected' donation
    NEW.status = 'pending';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_force_pending_on_insert ON public.donations;
CREATE TRIGGER tr_force_pending_on_insert
BEFORE INSERT ON public.donations
FOR EACH ROW EXECUTE FUNCTION force_pending_on_insert();

-- 2. PROTECT FINANCIAL INTEGRITY (AMOUNT TAMPERING)
-- Ensure amount cannot be negative or zero.
CREATE OR REPLACE FUNCTION enforce_positive_amount()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.amount <= 0 THEN
        RAISE EXCEPTION 'Donation amount must be greater than zero.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_enforce_positive_amount ON public.donations;
CREATE TRIGGER tr_enforce_positive_amount
BEFORE INSERT OR UPDATE ON public.donations
FOR EACH ROW EXECUTE FUNCTION enforce_positive_amount();

-- 3. IMMUTABILITY OF CORE DATA
-- Once a donation is created, the amount, streamer_id, and video_hash CANNOT be changed.
-- A streamer can only change the 'status', and maybe 'join_token' for costreams.
CREATE OR REPLACE FUNCTION prevent_core_data_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.amount IS DISTINCT FROM NEW.amount THEN
        RAISE EXCEPTION 'Stryker Doctrine: Cannot alter the donation amount after creation.';
    END IF;
    IF OLD.streamer_id IS DISTINCT FROM NEW.streamer_id THEN
        RAISE EXCEPTION 'Stryker Doctrine: Cannot reassign a donation to a different streamer.';
    END IF;
    IF OLD.video_hash IS DISTINCT FROM NEW.video_hash THEN
        RAISE EXCEPTION 'Stryker Doctrine: Cannot alter the video payload hash.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_prevent_core_data_mutation ON public.donations;
CREATE TRIGGER tr_prevent_core_data_mutation
BEFORE UPDATE ON public.donations
FOR EACH ROW EXECUTE FUNCTION prevent_core_data_mutation();

-- 4. PAYLOAD SANITIZATION (NOT NULL CONSTRAINTS)
-- Prevent empty or null video hashes which break the overlay
CREATE OR REPLACE FUNCTION sanitize_donation_payload()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.video_hash IS NULL OR trim(NEW.video_hash) = '' THEN
        RAISE EXCEPTION 'Stryker Doctrine: video_hash cannot be empty.';
    END IF;
    -- Sanitize username slightly to prevent raw HTML injection at DB level
    NEW.username = REGEXP_REPLACE(NEW.username, '<[^>]*>', '', 'g');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sanitize_donation_payload ON public.donations;
CREATE TRIGGER tr_sanitize_donation_payload
BEFORE INSERT ON public.donations
FOR EACH ROW EXECUTE FUNCTION sanitize_donation_payload();
