
-- The FOR ALL policy on users includes SELECT, so get_current_user_role() calling SELECT on users
-- triggers it again -> infinite recursion. Split into INSERT/UPDATE/DELETE only.

DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Managers and admins can manage vehicles" ON vehicles;
DROP POLICY IF EXISTS "Admins can manage stations" ON stations;
DROP POLICY IF EXISTS "Managers and admins can manage seasons" ON seasons;
DROP POLICY IF EXISTS "Managers and admins can manage pricing" ON pricing;
DROP POLICY IF EXISTS "Managers and admins can manage extras" ON extras;
DROP POLICY IF EXISTS "Managers and admins can manage insurance_types" ON insurance_types;

-- Users: SELECT is already covered by "Users can read all data" (USING true, no recursion)
-- Only restrict writes to admins
CREATE POLICY "Admins can insert users" ON users FOR INSERT TO authenticated
  WITH CHECK (get_current_user_role() = 'admin');
CREATE POLICY "Admins can update users" ON users FOR UPDATE TO authenticated
  USING (get_current_user_role() = 'admin') WITH CHECK (get_current_user_role() = 'admin');
CREATE POLICY "Admins can delete users" ON users FOR DELETE TO authenticated
  USING (get_current_user_role() = 'admin');

-- Vehicles
CREATE POLICY "Managers and admins can insert vehicles" ON vehicles FOR INSERT TO authenticated
  WITH CHECK (get_current_user_role() IN ('manager', 'admin'));
CREATE POLICY "Managers and admins can update vehicles" ON vehicles FOR UPDATE TO authenticated
  USING (get_current_user_role() IN ('manager', 'admin')) WITH CHECK (get_current_user_role() IN ('manager', 'admin'));
CREATE POLICY "Managers and admins can delete vehicles" ON vehicles FOR DELETE TO authenticated
  USING (get_current_user_role() IN ('manager', 'admin'));

-- Stations
CREATE POLICY "Admins can insert stations" ON stations FOR INSERT TO authenticated
  WITH CHECK (get_current_user_role() = 'admin');
CREATE POLICY "Admins can update stations" ON stations FOR UPDATE TO authenticated
  USING (get_current_user_role() = 'admin') WITH CHECK (get_current_user_role() = 'admin');
CREATE POLICY "Admins can delete stations" ON stations FOR DELETE TO authenticated
  USING (get_current_user_role() = 'admin');

-- Seasons
CREATE POLICY "Managers and admins can insert seasons" ON seasons FOR INSERT TO authenticated
  WITH CHECK (get_current_user_role() IN ('manager', 'admin'));
CREATE POLICY "Managers and admins can update seasons" ON seasons FOR UPDATE TO authenticated
  USING (get_current_user_role() IN ('manager', 'admin')) WITH CHECK (get_current_user_role() IN ('manager', 'admin'));
CREATE POLICY "Managers and admins can delete seasons" ON seasons FOR DELETE TO authenticated
  USING (get_current_user_role() IN ('manager', 'admin'));

-- Pricing
CREATE POLICY "Managers and admins can insert pricing" ON pricing FOR INSERT TO authenticated
  WITH CHECK (get_current_user_role() IN ('manager', 'admin'));
CREATE POLICY "Managers and admins can update pricing" ON pricing FOR UPDATE TO authenticated
  USING (get_current_user_role() IN ('manager', 'admin')) WITH CHECK (get_current_user_role() IN ('manager', 'admin'));
CREATE POLICY "Managers and admins can delete pricing" ON pricing FOR DELETE TO authenticated
  USING (get_current_user_role() IN ('manager', 'admin'));

-- Extras
CREATE POLICY "Managers and admins can insert extras" ON extras FOR INSERT TO authenticated
  WITH CHECK (get_current_user_role() IN ('manager', 'admin'));
CREATE POLICY "Managers and admins can update extras" ON extras FOR UPDATE TO authenticated
  USING (get_current_user_role() IN ('manager', 'admin')) WITH CHECK (get_current_user_role() IN ('manager', 'admin'));
CREATE POLICY "Managers and admins can delete extras" ON extras FOR DELETE TO authenticated
  USING (get_current_user_role() IN ('manager', 'admin'));

-- Insurance types
CREATE POLICY "Managers and admins can insert insurance_types" ON insurance_types FOR INSERT TO authenticated
  WITH CHECK (get_current_user_role() IN ('manager', 'admin'));
CREATE POLICY "Managers and admins can update insurance_types" ON insurance_types FOR UPDATE TO authenticated
  USING (get_current_user_role() IN ('manager', 'admin')) WITH CHECK (get_current_user_role() IN ('manager', 'admin'));
CREATE POLICY "Managers and admins can delete insurance_types" ON insurance_types FOR DELETE TO authenticated
  USING (get_current_user_role() IN ('manager', 'admin'));
