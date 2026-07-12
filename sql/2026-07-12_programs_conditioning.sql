-- Program conditioning / cardio prescription (2026-07-12)
--
-- Interim home for a client's conditioning/cardio Rx (running, energy-system
-- work) until the full Conditioning modality (which will generate it) is built.
-- Coach-authored free text, edited on the coach program page and shown to the
-- client in the portal alongside their resistance sessions. Surfaced because
-- the strength engine prescribes no cardio, so a scaled-back running plan had
-- nowhere visible to live (Cristobal, 2026-07-12). See project_modality_roadmap.

alter table programs
  add column if not exists conditioning text;
