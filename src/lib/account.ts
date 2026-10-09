import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { invoke } from "@tauri-apps/api/core";
import { getCurrent, onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { desktop } from "./native";
import type { ReadingSession } from "../types";

// This is LokBook's public, browser-side project configuration. It carries no
// administrative privileges; the per-user tables must still enforce RLS.
const URL = import.meta.env.VITE_SUPABASE_URL || "https://jfavkudihasswkhkouxq.supabase.co";
const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_ipcGPahvt2-j2YwBFBbvUQ_EJo2WJID";

const secureStorage = {
  getItem: (key: string): Promise<string | null> => invoke("secure_get", { key }),
  setItem: (key: string, value: string): Promise<void> => invoke("secure_set", { key, value }),
  removeItem: (key: string): Promise<void> => invoke("secure_remove", { key }),
};

export const accountClient: SupabaseClient = createClient(URL, PUBLISHABLE_KEY, {
  auth: {
    flowType: "pkce",
    detectSessionInUrl: !desktop,
    persistSession: true,
    autoRefreshToken: true,
    storage: desktop ? secureStorage : window.localStorage,
  },
});

export async function installDesktopAuthCallback(onResult: (message: string) => void): Promise<() => void> {
  if (!desktop) return () => {};
  async function handle(urls: string[]) {
    for (const value of urls) {
      try {
        const url = new URL(value);
        if (url.protocol !== "lokbounce:" || url.hostname !== "auth") continue;
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error_description") || url.searchParams.get("error");
        if (error) { onResult(error); continue; }
        if (!code) continue;
        const { error: exchangeError } = await accountClient.auth.exchangeCodeForSession(code);
        onResult(exchangeError ? exchangeError.message : "Signed in to your Lok account.");
      } catch {
        onResult("The sign-in link could not be opened.");
      }
    }
  }
  const remove = await onOpenUrl((urls) => void handle(urls));
  const current = await getCurrent();
  if (current) void handle(current);
  return remove;
}

export async function sendSignInLink(email: string): Promise<void> {
  const { error } = await accountClient.auth.signInWithOtp({
    email: email.trim(),
    options: {
      shouldCreateUser: true,
      emailRedirectTo: desktop ? "lokbounce://auth/callback" : window.location.origin,
    },
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { error } = await accountClient.auth.signOut();
  if (error) throw error;
}

export async function syncReadingSessions(user: User, local: ReadingSession[]): Promise<ReadingSession[]> {
  if (local.length) {
    const rows = local.map((session) => ({
      id: session.id,
      user_id: user.id,
      started_at: session.startedAt,
      finished_at: session.finishedAt,
      goal_seconds: session.goalSeconds,
      active_seconds: session.activeSeconds,
      translation: session.translation,
      completed: session.completed,
    }));
    const { error } = await accountClient.from("lok_bible_sessions").upsert(rows, { onConflict: "id" });
    if (error) throw error;
  }
  const { data, error } = await accountClient.from("lok_bible_sessions")
    .select("id,started_at,finished_at,goal_seconds,active_seconds,translation,completed")
    .eq("user_id", user.id)
    .order("finished_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    startedAt: row.started_at as string,
    finishedAt: row.finished_at as string,
    goalSeconds: row.goal_seconds as number,
    activeSeconds: row.active_seconds as number,
    translation: row.translation as ReadingSession["translation"],
    completed: row.completed as boolean,
  }));
}
