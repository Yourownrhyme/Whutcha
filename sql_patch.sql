-- 1. Force 'pending' status on all new donations (No Bypass)
CREATE OR REPLACE FUNCTION force_pending_status()
RETURNS TRIGGER AS $$
BEGIN
    NEW.status = 'pending';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_force_pending ON public.donations;
CREATE TRIGGER tr_force_pending
BEFORE INSERT ON public.donations
FOR EACH ROW
EXECUTE FUNCTION force_pending_status();

-- 2. Prevent Negative or Ridiculous Amounts (Economy Sanity)
ALTER TABLE public.donations ADD CONSTRAINT check_amount_range CHECK (amount >= 1 AND amount <= 10000);
