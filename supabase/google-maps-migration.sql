-- Google Maps route sharing support for an existing Drive Mapping database.
-- Run this file once in the Supabase SQL editor.

alter table public.routes
  add column if not exists google_maps_url text;
