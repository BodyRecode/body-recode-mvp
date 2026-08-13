-- Closing off a message that was answered somewhere else.
--
-- The inbox queue keys off whether the client wrote last, deliberately, so a
-- reply that does not actually address the question cannot silently close it.
-- That is the right rule and it stays. What it has no answer for is the case
-- where the conversation genuinely happened, just not in the app: a phone call,
-- a text, a chat at the gym.
--
-- handled_at closes the message without sending anything. It is set by hand and
-- never by an automation. A new message from the client has handled_at null, so
-- the conversation reopens on its own the moment they write again.

alter table client_messages add column if not exists handled_at timestamptz;

comment on column client_messages.handled_at is
  'Set when the coach dealt with this outside the app (phone, text, in person). Closes it in the inbox without sending a reply. A newer client message reopens the conversation.';

create index if not exists idx_client_messages_open
  on client_messages (client_id, created_at desc)
  where sender = 'client' and handled_at is null;
