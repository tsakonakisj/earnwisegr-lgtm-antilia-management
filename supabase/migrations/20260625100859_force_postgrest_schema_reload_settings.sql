-- Force PostgREST schema cache reload for the new settings table
NOTIFY pgrst, 'reload schema';