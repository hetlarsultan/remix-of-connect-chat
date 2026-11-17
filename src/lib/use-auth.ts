import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { detectAndSaveCountry } from "./geolocation";
import type { User } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  username: string;
  age: number | null;
  gender: "male" | "female" | null;
  bio: string;
  avatar_url: string | null;
  name_color: string;
  text_color: string;
  is_guest: boolean;
  is_online: boolean;
  last_seen: string;
  created_at: string;
  country: string | null;
  country_code: string | null;
};

type AuthState = { user: User | null; profile: Profile | null; loading: boolean };

/* ------------------------------------------------------------------ *
 * Single shared auth store: one session read + one profile fetch for
 * the whole app instead of one per mounted page/hook. Cached profile
 * is hydrated from localStorage so pages paint instantly (no spinner)
 * and refreshed in the background.
 * ------------------------------------------------------------------ */

const PROFILE_CACHE_KEY = "profile_cache_v1";

let state: AuthState = { user: null, profile: null, loading: true };
const listeners = new Set<(s: AuthState) => void>();
let initialized = false;

function readCachedProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

function writeCachedProfile(p: Profile | null) {
  if (typeof window === "undefined") return;
  try {
    if (p) localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(p));
    else localStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {
    /* ignore quota errors */
  }
}

function setState(patch: Partial<AuthState>) {
  const next = { ...state, ...patch };
  if (next.user === state.user && next.profile === state.profile && next.loading === state.loading) return;
  state = next;
  for (const l of listeners) l(state);
}

let housekeepingUserId: string | null = null;

function scheduleHousekeeping(user: User) {
  if (housekeepingUserId === user.id) return;
  housekeepingUserId = user.id;
  // The server verifies the email before granting the owner role.
  void supabase.rpc("claim_owner_role");
  const idle = (cb: () => void) =>
    "requestIdleCallback" in window
      ? (window as unknown as { requestIdleCallback: (c: () => void) => void }).requestIdleCallback(cb)
      : setTimeout(cb, 1200);
  idle(() => {
    void supabase
      .from("profiles")
      .update({ last_seen: new Date().toISOString(), is_online: true })
      .eq("id", user.id);
    void detectAndSaveCountry(user.id);
  });
}

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  supabase.auth.onAuthStateChange((event, session) => {
    const u = session?.user ?? null;
    if (event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
      setState({ user: u });
      return;
    }
    if (!u) {
      housekeepingUserId = null;
      writeCachedProfile(null);
      setState({ user: null, profile: null, loading: false });
      return;
    }
    scheduleHousekeeping(u);
    // Reuse cached profile for the same user instead of refetching.
    if (state.profile?.id === u.id) {
      setState({ user: u, loading: false });
      return;
    }
    setState({ user: u });
    void loadOrCreateProfile(u).then((p) => {
      writeCachedProfile(p);
      setState({ profile: p, loading: false });
    });
  });

  void supabase.auth.getSession().then(({ data: { session } }) => {
    const u = session?.user ?? null;
    if (!u) {
      writeCachedProfile(null);
      setState({ user: null, profile: null, loading: false });
      return;
    }
    const cached = readCachedProfile();
    // Instant paint from cache, then background refresh.
    setState({ user: u, profile: cached?.id === u.id ? cached : state.profile, loading: !(cached?.id === u.id) });
    scheduleHousekeeping(u);

    void loadOrCreateProfile(u).then((p) => {
      writeCachedProfile(p);
      setState({ profile: p, loading: false });
    });
  });
}

export function useAuth() {
  const [snap, setSnap] = useState<AuthState>(state);

  useEffect(() => {
    init();
    listeners.add(setSnap);
    setSnap(state);
    return () => {
      listeners.delete(setSnap);
    };
  }, []);

  return {
    user: snap.user,
    profile: snap.profile,
    loading: snap.loading,
    refreshProfile: async () => {
      if (!state.user) return;
      const p = await loadProfile(state.user.id);
      writeCachedProfile(p);
      setState({ profile: p });
    },
  };
}

export async function loadProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data as Profile | null;
}

async function loadOrCreateProfile(user: User): Promise<Profile | null> {
  const existing = await loadProfile(user.id);
  if (existing) return existing;

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const isGuest = user.is_anonymous ?? false;
  const gender = metadata.gender === "female" ? "female" : "male";
  const rawAge = Number(metadata.age);
  const age = Number.isInteger(rawAge) && rawAge >= 13 && rawAge <= 120 ? rawAge : null;
  const requestedName = typeof metadata.username === "string" ? metadata.username.trim().slice(0, 64) : "";
  const fallbackName = `${isGuest ? "زائر" : "عضو"}_${user.id.slice(0, 6)}`;
  const values = {
    id: user.id,
    age,
    gender,
    is_guest: isGuest,
    is_online: true,
    name_color: gender === "female" ? "#ec4899" : "#8b5cf6",
  };

  await supabase.from("profiles").upsert({
    ...values,
    username: requestedName || fallbackName,
  }, { onConflict: "id", ignoreDuplicates: true });

  // The auth form may have created the requested profile at the same time.
  const created = await loadProfile(user.id);
  if (created) return created;

  // Another account may have claimed the name while this email awaited confirmation.
  await supabase.from("profiles").upsert({
    ...values,
    username: fallbackName,
  }, { onConflict: "id", ignoreDuplicates: true });
  return loadProfile(user.id);
}
