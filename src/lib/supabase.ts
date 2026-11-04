import { createClient } from '@supabase/supabase-js';
import { hasSupabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

// Almacenamiento adaptable: si el usuario eligió "recordar este dispositivo",
// la sesión se guarda en localStorage (persiste al cerrar el navegador);
// si no, se guarda en sessionStorage (se borra al cerrar).
const REMEMBER_KEY = 'crewzy.remember';

function isRemembered(): boolean {
  try {
    return localStorage.getItem(REMEMBER_KEY) === '1';
  } catch {
    return true;
  }
}

const adaptiveStorage = {
  getItem(key: string): string | null {
    try {
      return isRemembered() ? localStorage.getItem(key) : sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      if (isRemembered()) {
        localStorage.setItem(key, value);
        sessionStorage.removeItem(key);
      } else {
        sessionStorage.setItem(key, value);
        localStorage.removeItem(key);
      }
    } catch {
      /* ignore */
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

export const supabase = hasSupabase
  ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: { persistSession: true, autoRefreshToken: true, storage: adaptiveStorage },
    })
  : null;