'use client';
// Cliente Supabase para el navegador.
// Las env vars NEXT_PUBLIC_* son inyectadas en build time por Next.js.
import { createClient } from '@supabase/supabase-js';

// URL y anon key (públicas, protegidas por RLS en el backend)
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Si faltan env vars, tiramos error explícito para que se vea en consola
if (!url || !key) {
  throw new Error(
    `[Supabase] Faltan env vars NEXT_PUBLIC_SUPABASE_URL/ANON_KEY`
  );
}

// Singleton exportado — una sola instancia por sesión del browser
export const supabase = createClient(url, key);
