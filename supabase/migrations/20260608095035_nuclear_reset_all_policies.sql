
-- Drop every policy on every table, then recreate clean.
-- This forces PostgreSQL to rebuild all cached plans.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
      r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Disable RLS on all tables to clear plan cache
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE stations DISABLE ROW LEVEL SECURITY;
ALTER TABLE seasons DISABLE ROW LEVEL SECURITY;
ALTER TABLE pricing DISABLE ROW LEVEL SECURITY;
ALTER TABLE extras DISABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE checkouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE checkins DISABLE ROW LEVEL SECURITY;
ALTER TABLE damages DISABLE ROW LEVEL SECURITY;
ALTER TABLE photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_extras DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE damages ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_extras ENABLE ROW LEVEL SECURITY;

-- Single simple policy per table: full access for all roles
CREATE POLICY "open_access" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access" ON vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access" ON reservations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access" ON stations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access" ON seasons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access" ON pricing FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access" ON extras FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access" ON insurance_types FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access" ON payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access" ON checkouts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access" ON checkins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access" ON damages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access" ON photos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access" ON reservation_extras FOR ALL USING (true) WITH CHECK (true);

-- Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
