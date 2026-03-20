-- Add zoom transcript and summary fields to leads
-- Run this in your Supabase SQL Editor

alter table leads
  add column if not exists zoom_1_transcript text,
  add column if not exists zoom_1_summary text;
