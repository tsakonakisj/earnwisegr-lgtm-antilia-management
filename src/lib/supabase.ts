import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qlmmbudwpttjtsslrvqm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsbW1idWR3cHR0anRzc2xydnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxOTI3ODEsImV4cCI6MjA5Mzc2ODc4MX0.gAb_osLSuySNRvizE-lCQf6t527Hd3UWtPVl-kCU6xg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const isDemoMode = false;