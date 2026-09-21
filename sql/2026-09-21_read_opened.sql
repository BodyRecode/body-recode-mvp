-- When she actually opened her read.
--
-- 21 September 2026. We stamp when the email was SENT and treat that as the
-- end of the story. Sent is not read. A coach asking "did she take it in" has
-- nothing to look at, and in a pilot the entire question is whether the read
-- lands, so this is the one signal worth more than any other.
--
-- FIRST OPEN ONLY, deliberately. A count of visits is surveillance of a client
-- reading something about her own body, and it answers a question nobody
-- needs. "She has seen it" is the whole value; "she has read it eleven times"
-- is us watching her.
--
-- Not an email open pixel either, for the same reason and because they are
-- unreliable: images are blocked, and Apple Mail opens everything on her
-- behalf whether she looked or not. This is the portal page rendering, which
-- means she was actually on it.

alter table cffs add column if not exists client_opened_at timestamptz;
alter table cfws add column if not exists client_opened_at timestamptz;
alter table progress_reads add column if not exists client_opened_at timestamptz;

comment on column cffs.client_opened_at is
  'When the client first opened this read in her portal. First open only, never a count. 21 Sep 2026.';
comment on column cfws.client_opened_at is
  'When the client first opened this weekly read in her portal. First open only. 21 Sep 2026.';
comment on column progress_reads.client_opened_at is
  'When the client first opened this progress read in her portal. First open only. 21 Sep 2026.';
