-- Upgrade team_invites from a 2-tier model (staff/organizer) to three real
-- roles: admin (full account access, same as today's "organizer" invites),
-- manager (day-to-day operations — events, guests, scanner, approvals — but
-- no financial/vendor data), and gate_staff (check-in scanning only, same as
-- today's "staff" invites). Existing links keep equivalent access:
-- organizer -> admin, staff -> gate_staff. Nobody's active link stops working.

UPDATE team_invites
SET role = CASE WHEN role = 'organizer' THEN 'admin' ELSE 'gate_staff' END;

ALTER TABLE team_invites DROP CONSTRAINT IF EXISTS team_invites_role_check;

ALTER TABLE team_invites
  ADD CONSTRAINT team_invites_role_check CHECK (role IN ('admin', 'manager', 'gate_staff'));
