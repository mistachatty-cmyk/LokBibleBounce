import type { AppState, Translation } from "../types";

const STORAGE_KEY = "lokbounce-state-v1";

export const defaultState: AppState = {
  schemaVersion: 1,
  translation: "web",
  reminders: [],
  sessions: [],
  sessionOwnerId: null,
  activeSession: null,
  bounceEnabled: true,
  reducedMotion: false,
  lastReference: null,
};

function isTranslation(value: unknown): value is Translation {
  return value === "web" || value === "kjv";
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (parsed.schemaVersion !== 1) return defaultState;
    return {
      schemaVersion: 1,
      translation: isTranslation(parsed.translation) ? parsed.translation : "web",
      reminders: Array.isArray(parsed.reminders) ? parsed.reminders : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      sessionOwnerId: typeof parsed.sessionOwnerId === "string" ? parsed.sessionOwnerId : null,
      activeSession: parsed.activeSession
        ? { ...parsed.activeSession, running: false, lastTickAt: null }
        : null,
      bounceEnabled: parsed.bounceEnabled !== false,
      reducedMotion: parsed.reducedMotion === true,
      lastReference: parsed.lastReference ?? null,
    };
  } catch {
    return defaultState;
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
