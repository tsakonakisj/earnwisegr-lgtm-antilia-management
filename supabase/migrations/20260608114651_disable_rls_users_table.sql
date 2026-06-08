-- Disable RLS entirely on users table to eliminate any possible recursion path
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
NOTIFY pgrst, 'reload schema';
