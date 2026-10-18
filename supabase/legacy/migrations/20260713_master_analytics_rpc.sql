-- ════════════════════════════════════════════════════════════════
-- PERF-01: server-side master analytics aggregation
-- ════════════════════════════════════════════════════════════════
-- getMasterAnalytics() previously pulled up to 2000 profiles + 1000 events +
-- 10000 guests + 10000 public_registrations into Node and reduced them in JS.
-- Those hard caps silently under-count past the limit, and it moves a lot of
-- rows over the wire on every admin page load.
--
-- This RPC does the whole aggregation in Postgres and returns a single jsonb
-- blob matching the PlatformAnalytics shape exactly. It is uncapped, so numbers
-- become correct at any scale (they match the old page below the old caps).
--
-- Counting semantics are preserved exactly from the JS version:
--   * per-event registrations = (all guests for the event)
--                             + (public_registrations for the event, excluding 'rejected')
--   * totalRegistrations       = all guests + all non-'rejected' public_registrations
--   * registration DATES (new-this-month / growth / 6-month trend) come from
--     ALL guests + ALL public_registrations (including 'rejected') — matching the
--     legacy allRegDates array, which pushed every row's date regardless of status.
--
-- Time buckets use date_trunc('month', now()); Supabase runs in UTC, matching
-- the Vercel Node runtime that computed the old boundaries.

CREATE OR REPLACE FUNCTION public.get_master_analytics()
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
WITH bounds AS (
  SELECT
    date_trunc('month', now())                      AS start_month,
    date_trunc('month', now()) - interval '1 month'  AS start_last_month
),
-- per-event registration counts (guests + non-rejected public_registrations)
event_regs AS (
  SELECT
    e.id           AS event_id,
    e.title,
    e.status,
    COALESCE(e.capacity, 0) AS capacity,
    e.created_at,
    e.organizer_id,
    e.category_id,
    COALESCE(g.cnt, 0) + COALESCE(pr.cnt, 0) AS reg_count
  FROM events e
  LEFT JOIN (
    SELECT event_id, count(*) AS cnt FROM guests GROUP BY event_id
  ) g  ON g.event_id  = e.id
  LEFT JOIN (
    SELECT event_id, count(*) AS cnt FROM public_registrations
    WHERE status <> 'rejected' GROUP BY event_id
  ) pr ON pr.event_id = e.id
),
-- every registration date (guests + ALL public_registrations, incl. rejected)
reg_dates AS (
  SELECT created_at FROM guests
  UNION ALL
  SELECT created_at FROM public_registrations
),
kpis AS (
  SELECT
    (SELECT count(*) FROM profiles WHERE role = 'organizer') AS total_organizers,
    (SELECT count(*) FROM profiles WHERE role = 'organizer'
       AND created_at >= (SELECT start_month FROM bounds)) AS new_orgs_this,
    (SELECT count(*) FROM profiles WHERE role = 'organizer'
       AND created_at >= (SELECT start_last_month FROM bounds)
       AND created_at <  (SELECT start_month FROM bounds)) AS new_orgs_last,
    (SELECT count(*) FROM events) AS total_events,
    (SELECT count(*) FROM events
       WHERE created_at >= (SELECT start_month FROM bounds)) AS new_events_this,
    (SELECT count(*) FROM events WHERE status = 'published') AS live_events,
    ((SELECT count(*) FROM guests)
      + (SELECT count(*) FROM public_registrations WHERE status <> 'rejected')) AS total_regs,
    (SELECT count(*) FROM reg_dates
       WHERE created_at >= (SELECT start_month FROM bounds)) AS new_regs_this,
    (SELECT count(*) FROM reg_dates
       WHERE created_at >= (SELECT start_last_month FROM bounds)
       AND created_at <  (SELECT start_month FROM bounds)) AS new_regs_last,
    (SELECT round(avg(reg_count::numeric / capacity * 100))
       FROM event_regs WHERE capacity > 0) AS avg_fill_rate
),
org_agg AS (
  SELECT
    er.organizer_id,
    count(*)                                    AS events,
    count(*) FILTER (WHERE er.status = 'published') AS live,
    sum(er.reg_count)                           AS total_regs,
    sum(er.capacity)                            AS total_cap
  FROM event_regs er
  GROUP BY er.organizer_id
),
top_orgs AS (
  SELECT COALESCE(jsonb_agg(obj ORDER BY total_regs DESC), '[]'::jsonb) AS data
  FROM (
    SELECT jsonb_build_object(
      'id',                 oa.organizer_id,
      'name',               COALESCE(NULLIF(p.company_name, ''), NULLIF(p.full_name, ''), 'Unknown'),
      'username',           COALESCE(p.username, ''),
      'totalEvents',        oa.events,
      'totalRegistrations', oa.total_regs,
      'liveEvents',         oa.live,
      'avgFillRate',        CASE WHEN oa.total_cap > 0
                                 THEN round(oa.total_regs::numeric / oa.total_cap * 100) ELSE 0 END
    ) AS obj,
    oa.total_regs
    FROM org_agg oa
    LEFT JOIN profiles p ON p.id = oa.organizer_id
    ORDER BY oa.total_regs DESC
    LIMIT 12
  ) s
),
cat_agg AS (
  SELECT er.category_id,
    count(*)          AS events,
    sum(er.reg_count) AS regs,
    sum(er.capacity)  AS cap
  FROM event_regs er
  GROUP BY er.category_id
),
top_cats AS (
  SELECT COALESCE(jsonb_agg(obj ORDER BY regs DESC), '[]'::jsonb) AS data
  FROM (
    SELECT jsonb_build_object(
      'name',          COALESCE(c.name, 'Uncategorised'),
      'icon',          c.icon,
      'eventCount',    ca.events,
      'registrations', ca.regs,
      'avgFillRate',   CASE WHEN ca.cap > 0 THEN round(ca.regs::numeric / ca.cap * 100) ELSE 0 END
    ) AS obj,
    ca.regs
    FROM cat_agg ca
    LEFT JOIN event_categories c ON c.id = ca.category_id
  ) s
),
events_json AS (
  SELECT
    er.event_id, er.title, er.status, er.capacity, er.reg_count,
    COALESCE(NULLIF(p.company_name, ''), NULLIF(p.full_name, ''), 'Unknown') AS org,
    CASE WHEN er.capacity > 0 THEN round(er.reg_count::numeric / er.capacity * 100) ELSE 0 END AS fill_rate
  FROM event_regs er
  LEFT JOIN profiles p ON p.id = er.organizer_id
),
top_fill AS (
  SELECT COALESCE(jsonb_agg(obj ORDER BY fill_rate DESC), '[]'::jsonb) AS data
  FROM (
    SELECT jsonb_build_object(
      'id', event_id, 'title', title, 'org', org,
      'capacity', capacity, 'registered', reg_count, 'fillRate', fill_rate, 'status', status
    ) AS obj, fill_rate
    FROM events_json WHERE capacity > 0
    ORDER BY fill_rate DESC LIMIT 6
  ) s
),
top_regs AS (
  SELECT COALESCE(jsonb_agg(obj ORDER BY reg_count DESC), '[]'::jsonb) AS data
  FROM (
    SELECT jsonb_build_object(
      'id', event_id, 'title', title, 'org', org,
      'registered', reg_count, 'capacity', capacity, 'status', status
    ) AS obj, reg_count
    FROM events_json
    ORDER BY reg_count DESC LIMIT 6
  ) s
),
months AS (
  SELECT
    gs                        AS month_start,
    gs + interval '1 month'   AS month_end,
    to_char(gs, 'Mon YY')     AS label,
    row_number() OVER (ORDER BY gs) AS ord
  FROM generate_series(
    date_trunc('month', now()) - interval '5 months',
    date_trunc('month', now()),
    interval '1 month'
  ) gs
),
trend AS (
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'label', m.label,
      'count', (SELECT count(*) FROM reg_dates rd
                WHERE rd.created_at >= m.month_start AND rd.created_at < m.month_end)
    ) ORDER BY m.ord
  ), '[]'::jsonb) AS data
  FROM months m
),
status_dist AS (
  SELECT jsonb_build_object('draft', 0, 'published', 0, 'completed', 0, 'cancelled', 0)
    || COALESCE(
         (SELECT jsonb_object_agg(status, cnt)
          FROM (SELECT status, count(*) AS cnt FROM events GROUP BY status) x),
         '{}'::jsonb
       ) AS data
)
SELECT jsonb_build_object(
  'kpis', jsonb_build_object(
    'totalOrganizers',    k.total_organizers,
    'newOrgsThisMonth',   k.new_orgs_this,
    'orgGrowth',          CASE WHEN k.new_orgs_last = 0 THEN NULL
                               ELSE round((k.new_orgs_this - k.new_orgs_last)::numeric / k.new_orgs_last * 100) END,
    'totalEvents',        k.total_events,
    'newEventsThisMonth', k.new_events_this,
    'totalRegistrations', k.total_regs,
    'newRegsThisMonth',   k.new_regs_this,
    'regGrowth',          CASE WHEN k.new_regs_last = 0 THEN NULL
                               ELSE round((k.new_regs_this - k.new_regs_last)::numeric / k.new_regs_last * 100) END,
    'liveEvents',         k.live_events,
    'avgFillRate',        COALESCE(k.avg_fill_rate, 0)
  ),
  'topOrganizers',      (SELECT data FROM top_orgs),
  'categoryBreakdown',  (SELECT data FROM top_cats),
  'topEventsByFill',    (SELECT data FROM top_fill),
  'topEventsByRegs',    (SELECT data FROM top_regs),
  'registrationTrend',  (SELECT data FROM trend),
  'statusDistribution', (SELECT data FROM status_dist)
)
FROM kpis k;
$$;

-- Platform-wide analytics are admin-only. The server action calls this with the
-- service-role key; do not expose it to anon/authenticated via PostgREST.
REVOKE ALL     ON FUNCTION public.get_master_analytics() FROM PUBLIC;
REVOKE ALL     ON FUNCTION public.get_master_analytics() FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_master_analytics() TO service_role;

-- Verify after applying (as service role):
--   SELECT public.get_master_analytics();
