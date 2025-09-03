import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_EXTERNAL_SUPABASE_URL || "https://bfxrifelomxmfasymnla.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_EXTERNAL_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmeHJpZmVsb214bWZhc3ltbmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NjMwNTgsImV4cCI6MjA3MDMzOTA1OH0.yTJcFwx_71qPNuP_nLYvlAEESqt81fTj08CXIP2IzTY";

export interface ExternalDatabase {
  public: {
    Tables: {
      n8n_chat_histories: {
        Row: {
          id: number;
          session_id: string;
          message: any;
          created_at?: string;
        };
        Insert: {
          id?: number;
          session_id: string;
          message: any;
          created_at?: string;
        };
        Update: {
          id?: number;
          session_id?: string;
          message?: any;
          created_at?: string;
        };
      };
    };
  };
}

export const externalSupabase = createClient<ExternalDatabase>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
