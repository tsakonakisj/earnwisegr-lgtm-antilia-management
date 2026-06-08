
-- A real schema change forces PostgREST to fully reload (unlike NOTIFY which can be ignored)
ALTER TABLE reservations ADD COLUMN _reload_trigger boolean DEFAULT false;
ALTER TABLE reservations DROP COLUMN _reload_trigger;
NOTIFY pgrst, 'reload schema';
