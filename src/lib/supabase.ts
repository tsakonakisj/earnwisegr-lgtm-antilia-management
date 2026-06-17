import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qlmmbudwpttjtsslrvqm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsbW1idWR3cHR0anRzc2xydnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE5Mjc4MSwiZXhwIjoyMDkzNzY4NzgxfQ.ftDfpzBJm7SkSAlJqiur0zImlZxkaUrqcUInHdI7XXk';

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
export const isDemoMode = false;