-- ════════════════════════════════════════════════════════════════
-- Organizers must complete ID verification before publishing an event
-- ════════════════════════════════════════════════════════════════
-- Publishing is a client-side `events.update({ status: 'published' })`, gated
-- only by RLS — so the UI check alone is bypassable. This enforces the rule at
-- the database level: an event can only transition INTO 'published' if its
-- organizer's profiles.is_id_verified is true (set by the Didit webhook).
--
-- Only the transition into 'published' is gated. Existing published events are
-- untouched (the trigger fires on the change, not on rows already published),
-- and every other status change (draft, completed, cancelled, archived) is
-- unaffected. SECURITY DEFINER so the profile lookup works regardless of caller.

CREATE OR REPLACE FUNCTION public.enforce_organizer_id_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'published'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = NEW.organizer_id AND p.is_id_verified IS TRUE
    ) THEN
      RAISE EXCEPTION 'ID_VERIFICATION_REQUIRED: complete identity verification before publishing an event.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_organizer_id_verification ON public.events;
CREATE TRIGGER trg_enforce_organizer_id_verification
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_organizer_id_verification();

-- Rollout note: existing UNVERIFIED organizers will be unable to publish (incl.
-- re-publishing a draft) until they verify. Their already-published events keep
-- running. To let a specific organizer through manually:
--   UPDATE profiles SET is_id_verified = true WHERE id = '<organizer-uuid>';
