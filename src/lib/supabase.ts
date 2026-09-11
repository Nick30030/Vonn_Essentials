import { createClient } from '@supabase/supabase-js';

const defaultSupabaseUrl = 'https://dboukhnrngfocekeqaua.supabase.co';
const defaultSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRib3VraG5ybmdmb2Nla2VxYXVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1NDEwNjIsImV4cCI6MjEwNDExNzA2Mn0.CFGZWO72h1t8WKR4-j1J4A7lAfQTIhGdWiHLdNUJKrA';

const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 
  defaultSupabaseUrl;

const supabaseAnonKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  defaultSupabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});