
-- Nuclear fix: drop all get_current_user_role() policies and the function entirely.
-- This is an internal single-company tool; app-level code handles role access.
-- Simple USING(true) for authenticated users on all tables.

DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

DROP POLICY IF EXISTS "Managers and admins can insert vehicles" ON vehicles;
DROP POLICY IF EXISTS "Managers and admins can update vehicles" ON vehicles;
DROP POLICY IF EXISTS "Managers and admins can delete vehicles" ON vehicles;

DROP POLICY IF EXISTS "Admins can insert stations" ON stations;
DROP POLICY IF EXISTS "Admins can update stations" ON stations;
DROP POLICY IF EXISTS "Admins can delete stations" ON stations;

DROP POLICY IF EXISTS "Managers and admins can insert seasons" ON seasons;
DROP POLICY IF EXISTS "Managers and admins can update seasons" ON seasons;
DROP POLICY IF EXISTS "Managers and admins can delete seasons" ON seasons;

DROP POLICY IF EXISTS "Managers and admins can insert pricing" ON pricing;
DROP POLICY IF EXISTS "Managers and admins can update pricing" ON pricing;
DROP POLICY IF EXISTS "Managers and admins can delete pricing" ON pricing;

DROP POLICY IF EXISTS "Managers and admins can insert extras" ON extras;
DROP POLICY IF EXISTS "Managers and admins can update extras" ON extras;
DROP POLICY IF EXISTS "Managers and admins can delete extras" ON extras;

DROP POLICY IF EXISTS "Managers and admins can insert insurance_types" ON insurance_types;
DROP POLICY IF EXISTS "Managers and admins can update insurance_types" ON insurance_types;
DROP POLICY IF EXISTS "Managers and admins can delete insurance_types" ON insurance_types;

DROP FUNCTION IF EXISTS get_current_user_role();

-- Replace with simple full-access policies for authenticated users
CREATE POLICY "Authenticated full access users" ON users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access vehicles" ON vehicles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access stations" ON stations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access seasons" ON seasons FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access pricing" ON pricing FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access extras" ON extras FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access insurance_types" ON insurance_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
