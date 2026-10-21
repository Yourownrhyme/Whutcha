-- ====================================================
-- SKYNET MODE: ANTI-BOT RATE LIMITING
-- ====================================================

-- 1. Create a table to track IP activity
CREATE TABLE IF NOT EXISTS public.ip_rate_limits (
    ip_address TEXT PRIMARY KEY,
    request_count INT DEFAULT 1,
    last_request_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create the rate limiting function
CREATE OR REPLACE FUNCTION check_skynet_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
    client_ip TEXT;
    current_count INT;
    last_time TIMESTAMP WITH TIME ZONE;
    -- Rules: Max 5 donations per minute per IP
    MAX_REQUESTS CONSTANT INT := 5;
    WINDOW_MINUTES CONSTANT INT := 1;
BEGIN
    -- Extract the actual client IP from Supabase PostgREST headers
    BEGIN
        client_ip := current_setting('request.headers', true)::json->>'x-forwarded-for';
        client_ip := split_part(client_ip, ',', 1); -- Get the true origin IP
    EXCEPTION WHEN OTHERS THEN
        client_ip := 'unknown';
    END;

    IF client_ip IS NULL OR client_ip = 'unknown' THEN
        RETURN NEW; -- Allow if we can't determine IP (e.g., internal trigger)
    END IF;

    -- Upsert and check rate limit
    SELECT request_count, last_request_at INTO current_count, last_time 
    FROM public.ip_rate_limits WHERE ip_address = client_ip;

    IF NOT FOUND THEN
        INSERT INTO public.ip_rate_limits (ip_address, request_count, last_request_at)
        VALUES (client_ip, 1, NOW());
    ELSE
        -- If the window has passed, reset the count
        IF NOW() - last_time > (WINDOW_MINUTES || ' minutes')::interval THEN
            UPDATE public.ip_rate_limits 
            SET request_count = 1, last_request_at = NOW() 
            WHERE ip_address = client_ip;
        ELSE
            -- Within the time window
            IF current_count >= MAX_REQUESTS THEN
                RAISE EXCEPTION 'SKYNET_BLOCKED: Rate limit exceeded. Try again in 1 minute.';
            END IF;
            
            UPDATE public.ip_rate_limits 
            SET request_count = request_count + 1, last_request_at = NOW() 
            WHERE ip_address = client_ip;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach trigger to donations table
DROP TRIGGER IF EXISTS tr_skynet_protection ON public.donations;
CREATE TRIGGER tr_skynet_protection
    BEFORE INSERT ON public.donations
    FOR EACH ROW
    EXECUTE FUNCTION check_skynet_rate_limit();
