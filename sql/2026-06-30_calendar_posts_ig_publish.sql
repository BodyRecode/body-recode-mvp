-- Native Instagram Graph API publishing from the Content Calendar.
--
-- Adds tracking columns so each calendar_posts row can record its IG
-- publish state (queued / scheduled / posted / failed) without needing
-- a separate publish_events table.
--
-- See:
--   - Helper: src/lib/instagram-publish.ts
--   - API route: src/app/api/ig/publish/route.ts
--   - Dashboard button: src/app/dashboard/business/strategy/page.tsx (Content Calendar tab)
--   - Auto-memory: project_instagram_native_publishing
--   - SaaS build folder: 06_SAAS_PLATFORM_BUILD/2026-06-30_Instagram_Native_Publishing.md

ALTER TABLE public.calendar_posts
ADD COLUMN IF NOT EXISTS ig_container_id TEXT,
ADD COLUMN IF NOT EXISTS ig_post_id TEXT,
ADD COLUMN IF NOT EXISTS ig_post_url TEXT,
ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS publish_error TEXT,
ADD COLUMN IF NOT EXISTS publish_attempts INTEGER NOT NULL DEFAULT 0;

-- Index for fast "what's scheduled" / "what's posted" queries
CREATE INDEX IF NOT EXISTS idx_calendar_posts_posted_at ON public.calendar_posts (posted_at) WHERE posted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calendar_posts_scheduled_publish_at ON public.calendar_posts (scheduled_publish_at) WHERE scheduled_publish_at IS NOT NULL AND posted_at IS NULL;

-- Sanity check
SELECT
  COUNT(*) AS total_posts,
  COUNT(*) FILTER (WHERE posted_at IS NOT NULL) AS already_posted,
  COUNT(*) FILTER (WHERE scheduled_publish_at IS NOT NULL AND posted_at IS NULL) AS scheduled_pending
FROM public.calendar_posts;
