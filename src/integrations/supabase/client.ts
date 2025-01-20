import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://acmmuhybijjkycfoxuzc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbW11aHliaWpqa3ljZm94dXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4NzU2MTUsImV4cCI6MjA1MDQ1MTYxNX0.xHQppR6Sd9DZYraFpKA353JZwqwD7xPSxPz6TzhE8rA";

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web'
      }
    }
  }
);