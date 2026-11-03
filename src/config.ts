// Configuración de Supabase (valores desde .env.local, con fallback para producción)
export const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  'https://nfnzjqufidjwxlnkpwzb.supabase.co';
export const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  'sb_publishable_i7nl3ukrUjFlV1omIB-3mA_VCDbuLtb';

export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);