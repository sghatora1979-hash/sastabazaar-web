'use client';

// SastaBazaar real authentication (Phase 0B).
// Supabase Auth with email OTP — no paid SMS provider needed.
// Sessions persist via Supabase's own storage; profile/role comes from
// public.profiles (role changes are guarded DB-side: see migration 002).
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from './supabase';

export type Role = 'customer' | 'seller' | 'admin';
export type Profile = { id: string; role: Role; name: string | null; phone: string | null };

type AuthState = {
  ready: boolean;          // finished initial session check
  configured: boolean;     // Supabase env present
  user: User | null;
  profile: Profile | null;
  role: Role;
  sendOtp: (email: string) => Promise<{ ok: boolean; error?: string }>;
  verifyOtp: (email: string, token: string) => Promise<{ ok: boolean; error?: string }>;
  sendRecovery: (email: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const configured = getSupabase() !== null;

  const loadProfile = useCallback(async (uid: string) => {
    const sb = getSupabase();
    if (!sb) return;
    const { data } = await sb.from('profiles').select('id,role,name,phone').eq('id', uid).single();
    if (data) setProfile(data as Profile);
  }, []);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) { setReady(true); return; }
    let cancelled = false;
    sb.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      const u = data.session?.user ?? null;
      setUser(u);
      if (u) void loadProfile(u.id).finally(() => setReady(true));
      else setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) void loadProfile(u.id);
      else setProfile(null);
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, [loadProfile]);

  const sendOtp = useCallback(async (email: string) => {
    const sb = getSupabase();
    if (!sb) return { ok: false, error: 'Backend not configured yet.' };
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    const sb = getSupabase();
    if (!sb) return { ok: false, error: 'Backend not configured yet.' };
    const { error } = await sb.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: 'email',
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);

  const sendRecovery = useCallback(async (email: string) => {
    const sb = getSupabase();
    if (!sb) return { ok: false, error: 'Backend not configured yet.' };
    // Sends a recovery link; the site URL must be allow-listed in
    // Supabase Dashboard → Authentication → URL Configuration.
    const { error } = await sb.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/account` : undefined,
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    await getSupabase()?.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  const value = useMemo<AuthState>(() => ({
    ready, configured, user, profile,
    role: profile?.role ?? 'customer',
    sendOtp, verifyOtp, sendRecovery, signOut, refreshProfile,
  }), [ready, configured, user, profile, sendOtp, verifyOtp, sendRecovery, signOut, refreshProfile]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
