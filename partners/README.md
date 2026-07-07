# Partner tenant configs

One JSON file per Founding Ten partner. Replaces the earlier manual "fill
8 placeholders in a copy of TENANT_SEED_TEMPLATE.sql" flow with a
declarative config + generator.

## Provisioning a new partner

1. Copy the template:
   ```
   cp partners/_template.json partners/<slug>.json
   ```
2. Fill in every field. Any `{{...}}` left in the file is a placeholder
   the provisioner will warn about; fill BEFORE `--apply`.
3. Pick a doctrine preset. Available ids in
   [`src/lib/doctrine-parameters-presets.ts`](../src/lib/doctrine-parameters-presets.ts):
   - `yoga-breath-forward`
   - `powerlifting-blunt`
   - `corporate-wellness`
   - `rehab-gentle`
4. Dry-run to preview the SQL:
   ```
   npx tsx --env-file=.env.local scripts/provision-tenant.ts <slug>
   ```
   Writes SQL to `~/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/sql/YYYY-MM-DD_<slug>_generated_seed.sql`.
5. Review the SQL. When satisfied:
   ```
   npx tsx --env-file=.env.local scripts/provision-tenant.ts <slug> --auth-user
   ```
   Creates the coach's `auth.users` row (idempotent) and regenerates SQL
   with the real UUID.
6. Apply the SQL:
   ```
   supabase db query --linked < ~/Dropbox/.../YYYY-MM-DD_<slug>_generated_seed.sql
   ```
   Or all-in-one:
   ```
   npx tsx --env-file=.env.local scripts/provision-tenant.ts <slug> --apply
   ```

## What the seed writes

- `tenant_config` row (brand + coach + products + licence + modality)
- `tenant_domains` row (`apexDomain` → `tenantId` for host routing)

## What still needs manual work after the seed

- DNS: `<apexDomain>` `CNAME` → `cname.vercel-dns.com`
- Vercel env `NEXT_PUBLIC_TENANT_DOMAIN_MAP`: add `<apexDomain>:<tenantId>`
- Stripe Connect onboarding: partner logs in at
  `/dashboard/settings/tenant` and clicks Onboard
- Twilio Subaccount + AU number in Kade's console; write SIDs back to
  `tenant_config.licence.twilioSubaccountSid` +
  `twilioMessagingServiceSid`
- Kade's Stripe: create Customer + Subscription for platform billing;
  invoice the setup fee

## Idempotency

Safe to re-run:
- `auth.users` lookup is by email; existing row reused
- `tenant_config` insert uses `ON CONFLICT (coach_id) DO NOTHING`
- `tenant_domains` insert uses `ON CONFLICT (domain) DO NOTHING`

If you need to update an existing tenant, edit the row directly through
`/dashboard/settings/tenant` (or via SQL for schema-level changes). The
provisioner is for first-time landing only.

## Files

- `_template.json` — blank starter config
- `melisa.json` — Founding Partner #1 (Harmony · Yoga & Meditation)
