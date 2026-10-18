-- Function to synchronize the minimum ticket price into the events table
CREATE OR REPLACE FUNCTION sync_event_ticket_price()
RETURNS TRIGGER AS $$
DECLARE
  v_event_id UUID;
  v_min_price NUMERIC;
BEGIN
  -- Determine which event ID to update based on operation type
  IF TG_OP = 'DELETE' THEN
    v_event_id := OLD.event_id;
  ELSE
    v_event_id := NEW.event_id;
  END IF;

  -- Calculate the minimum price among ticket types for this event
  SELECT MIN(price) INTO v_min_price
  FROM ticket_types
  WHERE event_id = v_event_id;

  -- Default to 0 if there are no ticket types
  IF v_min_price IS NULL THEN
    v_min_price := 0;
  END IF;

  -- Update the parent event's ticket_price column
  UPDATE events
  SET ticket_price = v_min_price
  WHERE id = v_event_id;

  RETURN NULL; -- AFTER triggers can safely return NULL
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on the ticket_types table
DROP TRIGGER IF EXISTS tr_sync_event_ticket_price ON ticket_types;
CREATE TRIGGER tr_sync_event_ticket_price
AFTER INSERT OR UPDATE OF price OR DELETE
ON ticket_types
FOR EACH ROW
EXECUTE FUNCTION sync_event_ticket_price();

-- Backfill existing events to ensure all current data is consistent
UPDATE events e
SET ticket_price = COALESCE((
  SELECT MIN(price)
  FROM ticket_types tt
  WHERE tt.event_id = e.id
), 0)
WHERE EXISTS (
  SELECT 1 FROM ticket_types tt WHERE tt.event_id = e.id
);
