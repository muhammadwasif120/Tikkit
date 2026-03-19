-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: SEO-friendly slugs for events
-- Each event gets a unique slug: <title-slug>-<first-8-chars-of-id>
-- e.g. "tech-summit-karachi-2026-5d4c0941"
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add slug column
ALTER TABLE events ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Create unique index (allows NULLs, only enforces uniqueness on non-null)
CREATE UNIQUE INDEX IF NOT EXISTS events_slug_unique ON events (slug) WHERE slug IS NOT NULL;

-- 3. Backfill existing events
UPDATE events
SET slug = LOWER(
  TRIM(BOTH '-' FROM
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REPLACE(LOWER(COALESCE(title, 'event')), ' ', '-'),
        '[^a-z0-9-]', '', 'g'
      ),
      '-+', '-', 'g'
    )
  )
) || '-' || REPLACE(SUBSTRING(id::text, 1, 8), '-', '')
WHERE slug IS NULL;

-- 4. Auto-generate slug on INSERT (when slug not provided)
CREATE OR REPLACE FUNCTION generate_event_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  short_id  TEXT;
BEGIN
  short_id  := REPLACE(SUBSTRING(NEW.id::text, 1, 8), '-', '');
  base_slug := LOWER(
    TRIM(BOTH '-' FROM
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REPLACE(LOWER(COALESCE(NEW.title, 'event')), ' ', '-'),
          '[^a-z0-9-]', '', 'g'
        ),
        '-+', '-', 'g'
      )
    )
  );
  NEW.slug := COALESCE(NULLIF(base_slug, ''), 'event') || '-' || short_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS events_auto_slug ON events;
CREATE TRIGGER events_auto_slug
  BEFORE INSERT ON events
  FOR EACH ROW
  WHEN (NEW.slug IS NULL)
  EXECUTE FUNCTION generate_event_slug();
