'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Profile, UserRole } from '@/types/database';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

/**
 * Autenticación.
 *
 * - Con Supabase configurado (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY): usa Supabase Auth
 *   (email + contraseña) y lee el rol desde la tabla `profiles`. Los permisos reales
 *   los aplica la RLS de la base.
 * - Sin Supabase: MODO DEMO con usuarios de prueba y contraseña compartida.
 *   Es sólo para evaluar el producto: no es seguro para operar un negocio real.
 */

interface AuthContextType {
  user: Profile | null;
  isAuthenticated: boolean;
  isReady: boolean;
  role: UserRole | null;
  mode: 'supabase' | 'demo';
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ ok: boolean; message: string }>;
}

const BUSINESS_ID = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';

export const DEMO_PASSWORD = 'demo1234';

export const DEMO_USERS: Profile[] = [
  { id: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', business_id: BUSINESS_ID, full_name: 'Enzo Garbarino', email: 'admin@polleria.com', role: 'admin', active: true },
  { id: 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', business_id: BUSINESS_ID, full_name: 'Martina Rossi', email: 'encargado@polleria.com', role: 'encargado', active: true },
  { id: 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', business_id: BUSINESS_ID, full_name: 'Lucas Gómez', email: 'cajero@polleria.com', role: 'cajero', active: true },
  { id: 'f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c', business_id: BUSINESS_ID, full_name: 'Carlos Maidana', email: 'cocina@polleria.com', role: 'cocinero', active: true },
  { id: 'a7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d', business_id: BUSINESS_ID, full_name: 'Nicolás Pérez', email: 'repartidor@polleria.com', role: 'repartidor', active: true },
];

const STORAGE_KEY = 'polleria_auth_user';
/** La sesión demo expira a las 12 h. */
const DEMO_SESSION_MS = 12 * 60 * 60 * 1000;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [isReady, setIsReady] = useState(false);
  const mode: 'supabase' | 'demo' = isSupabaseConfigured ? 'supabase' : 'demo';

  const loadSupabaseProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error || !data || !data.active) return null;
    return data as Profile;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (mode === 'supabase' && supabase) {
          const { data } = await supabase.auth.getSession();
          const uid = data.session?.user.id;
          const profile = uid ? await loadSupabaseProfile(uid) : null;
          if (!cancelled) setUser(profile);
        } else {
          const raw = localStorage.getItem(STORAGE_KEY);
          const saved = raw ? JSON.parse(raw) : null;
          if (saved?.profile && saved.expiresAt > Date.now()) setUser(saved.profile);
          else localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [mode, loadSupabaseProfile]);

  const login = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) return { ok: false, error: 'Completá correo y contraseña.' };

    if (mode === 'supabase' && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error || !data.user) return { ok: false, error: 'Correo o contraseña incorrectos.' };
      const profile = await loadSupabaseProfile(data.user.id);
      if (!profile) {
        await supabase.auth.signOut();
        return { ok: false, error: 'Tu usuario no tiene un perfil activo asignado. Contactá al administrador.' };
      }
      setUser(profile);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, expiresAt: Date.now() + DEMO_SESSION_MS }));
      return { ok: true };
    }

    const profile = DEMO_USERS.find(u => u.email === cleanEmail);
    if (!profile || password !== DEMO_PASSWORD) return { ok: false, error: 'Correo o contraseña incorrectos.' };
    setUser(profile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, expiresAt: Date.now() + DEMO_SESSION_MS }));
    return { ok: true };
  };

  const logout = async () => {
    if (mode === 'supabase' && supabase) await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const requestPasswordReset = async (email: string) => {
    const clean = email.trim().toLowerCase();
    if (!clean) return { ok: false, message: 'Ingresá tu correo para recuperar la contraseña.' };
    if (mode === 'supabase' && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(clean, { redirectTo: `${window.location.origin}/login` });
      if (error) return { ok: false, message: 'No pudimos enviar el correo. Probá de nuevo en unos minutos.' };
      return { ok: true, message: 'Si el correo está registrado, vas a recibir un enlace para restablecer la contraseña.' };
    }
    return { ok: false, message: 'En modo demo no se envían correos. La contraseña de prueba es la indicada debajo del formulario.' };
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: Boolean(user), isReady, role: user?.role || null, mode, login, logout, requestPasswordReset }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
