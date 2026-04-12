'use client';
import { createClient } from '@supabase/supabase-js';

let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error('Supabase URL o key no configurados');
    }

    supabaseInstance = createClient(url, key);
  }

  return supabaseInstance;
}

// Para compatibilidad
export const supabase = {
  auth: {
    signInWithPassword: async (args: any) => getSupabaseClient().auth.signInWithPassword(args),
    signUp: async (args: any) => getSupabaseClient().auth.signUp(args),
    signOut: async () => getSupabaseClient().auth.signOut(),
    getSession: async () => getSupabaseClient().auth.getSession(),
  },
};
