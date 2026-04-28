-- Portal login codes — custom 6-digit OTP system independent of Supabase email
-- We send the code via Resend (full control over template + delivery) and
-- verify it server-side, then mint a Supabase session via admin.generateLink.
create table if not exists portal_login_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_portal_login_codes_email_unused
  on portal_login_codes(email, code)
  where used_at is null;

create index if not exists idx_portal_login_codes_created
  on portal_login_codes(created_at desc);
