import type { ActiveSession, AppState, ReadingSession, Translation } from "../types";

export const SESSION_PRESETS = [5, 10, 20, 30, 45, 60, 90, 120, 180] as const;

export function formatDuration(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  if (whole < 60) return `${whole} sec`;
  const minutes = Math.floor(whole / 60);
  const remaining = whole % 60;
  if (minutes < 60) return `${minutes} min${remaining ? ` ${remaining} sec` : ""}`;
  const hours = Math.floor(minutes / 60);
  const leftover = minutes % 60;
  return `${hours} hr${leftover ? ` ${leftover} min` : ""}`;
}

export function beginSession(minutes: number, translation: Translation, now = Date.now()): ActiveSession {
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 720) {
    throw new Error("Choose a reading goal between 1 and 720 minutes.");
  }
  return {
    id: crypto.randomUUID(),
    startedAt: new Date(now).toISOString(),
    goalSeconds: minutes * 60,
    activeSeconds: 0,
    translation,
    running: true,
    lastTickAt: now,
  };
}

export function tickSession(session: ActiveSession, now: number): ActiveSession {
  if (!session.running || session.lastTickAt === null) return session;
  const gap = now - session.lastTickAt;
  if (gap < 0 || gap > 5 * 60_000) {
    // A long sleep or clock change cannot be counted reliably. Short webview
    // throttling gaps still count while the user is reading in another app.
    return { ...session, running: false, lastTickAt: null };
  }
  return {
    ...session,
    activeSeconds: session.activeSeconds + Math.max(0, gap) / 1000,
    lastTickAt: now,
  };
}

export function pauseSession(session: ActiveSession, now = Date.now()): ActiveSession {
  const counted = tickSession(session, now);
  return { ...counted, running: false, lastTickAt: null };
}

export function resumeSession(session: ActiveSession, now = Date.now()): ActiveSession {
  return { ...session, running: true, lastTickAt: now };
}

export function finishSession(session: ActiveSession, now = Date.now()): ReadingSession {
  const counted = pauseSession(session, now);
  return {
    id: counted.id,
    startedAt: counted.startedAt,
    finishedAt: new Date(now).toISOString(),
    goalSeconds: counted.goalSeconds,
    activeSeconds: Math.floor(counted.activeSeconds),
    translation: counted.translation,
    completed: counted.activeSeconds >= counted.goalSeconds,
  };
}

export function progressSummary(sessions: AppState["sessions"]): {
  totalSeconds: number;
  completed: number;
  streak: number;
} {
  const totalSeconds = sessions.reduce((sum, session) => sum + session.activeSeconds, 0);
  const completed = sessions.filter((session) => session.completed).length;
  const days = new Set(
    sessions
      .filter((session) => session.activeSeconds >= 300)
      .map((session) => new Date(session.finishedAt).toLocaleDateString("en-CA")),
  );
  let date = new Date();
  if (!days.has(date.toLocaleDateString("en-CA"))) date.setDate(date.getDate() - 1);
  let streak = 0;
  while (days.has(date.toLocaleDateString("en-CA"))) {
    streak += 1;
    date.setDate(date.getDate() - 1);
  }
  return { totalSeconds, completed, streak };
}
