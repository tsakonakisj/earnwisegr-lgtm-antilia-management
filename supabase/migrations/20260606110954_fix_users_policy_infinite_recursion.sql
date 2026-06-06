
-- Fix infinite recursion in users RLS policy
-- The "Admins can manage users" policy queries users table from within users policy = recursion

-- Create a security definer function that bypasses RLS to check user role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

-- Drop the recursive policy on users
DROP POLICY IF EXISTS "Admins can manage users" ON users;

-- Recreate using the function (no more recursion)
CREATE POLICY "Admins can manage users" ON users FOR ALL TO authenticated
  USING (get_current_user_role() = 'admin');

-- Fix vehicles policy (also queries users, causing the same recursion chain)
DROP POLICY IF EXISTS "Managers and admins can manage vehicles" ON vehicles;
CREATE POLICY "Managers and admins can manage vehicles" ON vehicles FOR ALL TO authenticated
  USING (get_current_user_role() IN ('manager', 'admin'));

-- Fix stations policy
DROP POLICY IF EXISTS "Admins can manage stations" ON stations;
CREATE POLICY "Admins can manage stations" ON stations FOR ALL TO authenticated
  USING (get_current_user_role() = 'admin');

-- Fix seasons policy
DROP POLICY IF EXISTS "Managers and admins can manage seasons" ON seasons;
CREATE POLICY "Managers and admins can manage seasons" ON seasons FOR ALL TO authenticated
  USING (get_current_user_role() IN ('manager', 'admin'));

-- Fix pricing policy
DROP POLICY IF EXISTS "Managers and admins can manage pricing" ON pricing;
CREATE POLICY "Managers and admins can manage pricing" ON pricing FOR ALL TO authenticated
  USING (get_current_user_role() IN ('manager', 'admin'));

-- Fix extras policy
DROP POLICY IF EXISTS "Managers and admins can manage extras" ON extras;
CREATE POLICY "Managers and admins can manage extras" ON extras FOR ALL TO authenticated
  USING (get_current_user_role() IN ('manager', 'admin'));

-- Fix insurance_types policy
DROP POLICY IF EXISTS "Managers and admins can manage insurance_types" ON insurance_types;
CREATE POLICY "Managers and admins can manage insurance_types" ON insurance_types FOR ALL TO authenticated
  USING (get_current_user_role() IN ('manager', 'admin'));
