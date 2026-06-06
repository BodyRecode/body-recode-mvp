-- Field Guide seed template
--
-- Use this ONCE per Field Guide as Kade writes the prose, renders the PDF,
-- and uploads it to the library-assets Supabase Storage bucket. Each
-- Field Guide gets ONE row in be_products + ONE row in digital_asset_metadata.
--
-- HOW TO USE:
--   1. Author the Field Guide prose (per the matching Scaffold doc).
--   2. Render to PDF (PIL or Word → PDF, Pure White / Signal Blue branded).
--   3. Upload PDF to Supabase Storage bucket `library-assets` at the path
--      shown in the source_path comment for each block below.
--   4. Open this file in Supabase SQL Editor, run the BLOCK matching the
--      Field Guide you just rendered (NOT all three at once — comment out
--      the others or run one at a time).
--   5. Verify with the SELECT at the bottom — should show one new row per
--      run with kind='field_guide', state_match correctly set, active=true.
--
-- The first Field Guide that lands here auto-activates the scorecard
-- Report + Guide bundle for THAT state (Stripe webhook reads
-- digital_asset_metadata at fulfilment time — see fulfilInstantPdf in
-- src/app/api/webhooks/stripe/route.ts).

-- ============================================================================
-- DEPLETED FIELD GUIDE
-- ============================================================================
-- Source PDF: library-assets/field-guides/depleted-v1.pdf
-- Cohort:     Scorecard score 5-8 (Depleted state)
-- Ascension:  /challenge?source=field_guide_depleted_buyer

WITH new_product AS (
  INSERT INTO be_products (
    coach_id,
    name,
    description,
    price,
    type,
    category,
    kind
  ) VALUES (
    -- coach_id: Kade's auth.users.id. Set in the env or via the lookup below.
    -- If you do not know it, run: SELECT id FROM auth.users WHERE email = 'kade@bodyrecode.au';
    (SELECT id FROM auth.users WHERE email = 'kade@bodyrecode.au' LIMIT 1),
    'The Depleted Field Guide',
    'Why a clean diet and hard training stopped working — and the first moves to bring the load down. A 25-page state-matched playbook for adults whose body state has gone Depleted.',
    19.00,
    'one_time',
    'body_recode',
    'field_guide'
  )
  RETURNING id
)
INSERT INTO digital_asset_metadata (
  product_id,
  slug,
  state_match,
  pattern_match,
  source_path,
  fulfilment_kind,
  ascension_cta_path,
  active
)
SELECT
  id,
  'depleted-field-guide',
  'depleted',
  NULL,
  'field-guides/depleted-v1.pdf',
  'instant_pdf',
  'depleted',  -- read by ascensionCtaFor() in src/lib/digital-asset-emails.ts
  TRUE
FROM new_product;

-- ============================================================================
-- TRANSITIONING FIELD GUIDE
-- ============================================================================
-- Source PDF: library-assets/field-guides/transitioning-v1.pdf
-- Cohort:     Scorecard score 9-11 (Transitioning state)
-- Ascension:  /blueprint?source=field_guide_transitioning_buyer

WITH new_product AS (
  INSERT INTO be_products (
    coach_id,
    name,
    description,
    price,
    type,
    category,
    kind
  ) VALUES (
    (SELECT id FROM auth.users WHERE email = 'kade@bodyrecode.au' LIMIT 1),
    'The Transitioning Field Guide',
    'Your pattern is identified — here is the corrective sequence before it slips back. A 25-page state-matched playbook for adults whose body state has reached Transitioning.',
    19.00,
    'one_time',
    'body_recode',
    'field_guide'
  )
  RETURNING id
)
INSERT INTO digital_asset_metadata (
  product_id,
  slug,
  state_match,
  pattern_match,
  source_path,
  fulfilment_kind,
  ascension_cta_path,
  active
)
SELECT
  id,
  'transitioning-field-guide',
  'transitioning',
  NULL,
  'field-guides/transitioning-v1.pdf',
  'instant_pdf',
  'transitioning',
  TRUE
FROM new_product;

-- ============================================================================
-- READY FIELD GUIDE
-- ============================================================================
-- Source PDF: library-assets/field-guides/ready-v1.pdf
-- Cohort:     Scorecard score 12-15 (Ready state)
-- Ascension:  /membership?source=field_guide_ready_buyer

WITH new_product AS (
  INSERT INTO be_products (
    coach_id,
    name,
    description,
    price,
    type,
    category,
    kind
  ) VALUES (
    (SELECT id FROM auth.users WHERE email = 'kade@bodyrecode.au' LIMIT 1),
    'The Ready Field Guide',
    'You respond now — here is how to compound it instead of losing it again. A 25-page state-matched playbook for adults whose body state has reached Ready.',
    19.00,
    'one_time',
    'body_recode',
    'field_guide'
  )
  RETURNING id
)
INSERT INTO digital_asset_metadata (
  product_id,
  slug,
  state_match,
  pattern_match,
  source_path,
  fulfilment_kind,
  ascension_cta_path,
  active
)
SELECT
  id,
  'ready-field-guide',
  'ready',
  NULL,
  'field-guides/ready-v1.pdf',
  'instant_pdf',
  'ready',
  TRUE
FROM new_product;

-- ============================================================================
-- VERIFY  (run AFTER any of the above blocks to confirm the row landed)
-- ============================================================================

SELECT
  p.name,
  p.price,
  p.kind,
  m.slug,
  m.state_match,
  m.source_path,
  m.active
FROM be_products p
JOIN digital_asset_metadata m ON m.product_id = p.id
WHERE p.kind = 'field_guide'
ORDER BY m.state_match;
