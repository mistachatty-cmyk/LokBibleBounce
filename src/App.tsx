import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import type { User } from "@supabase/supabase-js";
import { accountClient, installDesktopAuthCallback, sendSignInLink, signOut, syncReadingSessions } from "./lib/account";
import { loadBible, randomReference, verseText } from "./lib/bible";
import { desktop, showBounce, syncReminders, syncRestPreferences } from "./lib/native";
import { beginSession, finishSession, formatDuration, pauseSession, progressSummary, resumeSession, tickSession } from "./lib/sessions";
import { loadState, saveState } from "./lib/storage";
import type { AppState, BibleData, PassageRef, Translation } from "./types";
import { BookMark } from "./components/BookMark";
import { BouncePreview } from "./components/BouncePreview";
import { Reader } from "./components/Reader";
import { Reminders } from "./components/Reminders";
import { SessionPanel } from "./components/SessionPanel";
import { ProgressPanel } from "./components/ProgressPanel";
import { SettingsPanel } from "./components/SettingsPanel";

type Tab = "home" | "read" | "sessions" | "reminders" | "progress" | "settings";

const navigation: { id: Tab; label: string; symbol: string }[] = [
  { id: "home", label: "Home", symbol: "⌂" },
  { id: "read", label: "Read", symbol: "✦" },
  { id: "sessions", label: "Sessions", symbol: "◷" },
  { id: "reminders", label: "Reminders", symbol: "◉" },
  { id: "progress", label: "Progress", symbol: "▤" },
  { id: "settings", label: "Settings", symbol: "⚙" },
];

function nextReminder(reminders: AppState["reminders"]): string | null {
  const now = new Date();
  const enabled = reminders.filter((reminder) => reminder.enabled);
  let nearest: Date | null = null;
  for (const reminder of enabled) {
    const [hour, minute] = reminder.time.split(":").map(Number);
    for (let offset = 0; offset < 8; offset += 1) {
      const candidate = new Date(now);
      candidate.setDate(candidate.getDate() + offset);
      candidate.setHours(hour, minute, 0, 0);
      if (candidate <= now || !reminder.days.includes(candidate.getDay())) continue;
      if (!nearest || candidate < nearest) nearest = candidate;
      break;
    }
  }
  return nearest ? nearest.toLocaleString(undefined, { weekday: "long", hour: "numeric", minute: "2-digit" }) : null;
}

export default function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [tab, setTab] = useState<Tab>(() => window.location.hash === "#reader" ? "read" : "home");
  const [bible, setBible] = useState<BibleData | null>(null);
  const [bibleError, setBibleError] = useState("");
  const [reference, setReference] = useState<PassageRef | null>(() => window.location.hash === "#reader" ? null : state.lastReference);
  const [browserPreview, setBrowserPreview] = useState(false);
  const [notice, setNotice] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [accountMessage, setAccountMessage] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const preferencesMounted = useRef(false);

  useEffect(() => { saveState(state); }, [state]);
  useEffect(() => { document.documentElement.classList.toggle("reduce-motion", state.reducedMotion); }, [state.reducedMotion]);
  useEffect(() => { void syncReminders(state.reminders).catch((error: unknown) => setNotice(String(error))); }, [state.reminders]);
  useEffect(() => {
    if (!preferencesMounted.current) { preferencesMounted.current = true; return; }
    void syncRestPreferences(state.restMode, state.restCorner).catch((error: unknown) => setNotice(String(error)));
  }, [state.restMode, state.restCorner]);

  useEffect(() => {
    let active = true;
    setBible(null);
    setBibleError("");
    void loadBible(state.translation).then((loaded) => {
      if (!active) return;
      setBible(loaded);
      if (!reference || verseText(loaded, reference) === undefined) {
        const selected = randomReference(loaded);
        setReference(selected);
        setState((current) => ({ ...current, lastReference: selected }));
      }
    }).catch((error: unknown) => { if (active) setBibleError(String(error)); });
    return () => { active = false; };
    // The translation change is the only reason to reload the offline corpus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.translation]);

  useEffect(() => {
    if (!state.activeSession?.running) return;
    const timer = window.setInterval(() => {
      setState((current) => current.activeSession
        ? { ...current, activeSession: tickSession(current.activeSession, Date.now()) }
        : current);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [state.activeSession?.running]);

  useEffect(() => {
    let alive = true;
    void accountClient.auth.getSession().then(({ data }) => {
      if (alive) { setUser(data.session?.user ?? null); setAccountLoading(false); }
    }).catch((error: unknown) => {
      if (alive) { setAccountMessage(String(error)); setAccountLoading(false); }
    });
    const { data: subscription } = accountClient.auth.onAuthStateChange((_event, session) => {
      if (alive) { setUser(session?.user ?? null); setAccountLoading(false); }
    });
    let removeCallback: (() => void) | undefined;
    void installDesktopAuthCallback(setAccountMessage).then((remove) => { removeCallback = remove; });
    return () => { alive = false; subscription.subscription.unsubscribe(); removeCallback?.(); };
  }, []);

  useEffect(() => {
    if (accountLoading) return;
    if (!user) {
      setState((current) => current.sessionOwnerId
        ? { ...current, sessions: [], activeSession: null, sessionOwnerId: null }
        : current);
      setSyncMessage("");
      return;
    }
    const local = state.sessionOwnerId && state.sessionOwnerId !== user.id ? [] : state.sessions;
    let active = true;
    setSyncMessage("Syncing reading history…");
    void syncReadingSessions(user, local).then((sessions) => {
      if (!active) return;
      setState((current) => ({ ...current, sessions, sessionOwnerId: user.id }));
      setSyncMessage("Reading history is synced.");
    }).catch((error: unknown) => {
      if (active) setSyncMessage(`Signed in. Sync needs setup: ${String(error)}`);
    });
    return () => { active = false; };
    // Only run the account merge when the signed-in identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, accountLoading]);

  const setPassage = useCallback((selected: PassageRef) => {
    setReference(selected);
    setState((current) => ({ ...current, lastReference: selected }));
  }, []);

  const openRandomVerse = useCallback(() => {
    if (bible) setPassage(randomReference(bible));
    setTab("read");
    setBrowserPreview(false);
  }, [bible, setPassage]);

  useEffect(() => {
    if (!desktop) return;
    let remove: (() => void) | undefined;
    void listen("open-reader", openRandomVerse).then((unlisten) => { remove = unlisten; });
    return () => { remove?.(); };
  }, [openRandomVerse]);

  const summary = useMemo(() => progressSummary(state.sessions), [state.sessions]);
  const upcoming = useMemo(() => nextReminder(state.reminders), [state.reminders]);

  function startSession(minutes: number) {
    try {
      setState((current) => ({ ...current, activeSession: beginSession(minutes, current.translation) }));
      setTab("sessions");
      setNotice("");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not start the session."); }
  }

  function saveSession() {
    const active = state.activeSession;
    if (!active) return;
    const saved = finishSession(active);
    const sessions = [...state.sessions, saved];
    setState((current) => ({ ...current, sessions, activeSession: null }));
    setNotice(saved.completed ? "Reading goal completed and saved." : "Reading time saved.");
    if (user) void syncReadingSessions(user, sessions).then((remote) => {
      setState((current) => ({ ...current, sessions: remote, sessionOwnerId: user.id }));
      setSyncMessage("Reading history is synced.");
    }).catch((error: unknown) => setSyncMessage(`Saved locally. Sync will retry later: ${String(error)}`));
  }

  function changeTranslation(translation: Translation) {
    setState((current) => ({ ...current, translation }));
  }

  async function previewBounce() {
    if (desktop) {
      try { await showBounce(); } catch (error) { setNotice(`Could not show the desktop bounce: ${String(error)}`); }
    } else setBrowserPreview(true);
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <button className="brand" type="button" onClick={() => setTab("home")} aria-label="LokBounce home"><span className="brand-mark">✝</span><span><strong>LokBounce</strong><small>A moment in the Word</small></span></button>
        <nav className="side-nav" aria-label="Main navigation">
          {navigation.map((item) => <button key={item.id} type="button" className={tab === item.id ? "nav-item selected" : "nav-item"} onClick={() => setTab(item.id)}><span className="nav-symbol">{item.symbol}</span>{item.label}{item.id === "sessions" && state.activeSession ? <i className="nav-dot" /> : null}</button>)}
        </nav>
        <div className="sidebar-bottom"><div className="sidebar-verse">“Be still, and know that I am God.”<small>Psalm 46:10 · KJV</small></div><div className="sidebar-foot">Made for moments that matter.</div></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div className="topbar-greeting">A quiet invitation to read</div><div className="topbar-right"><span className="offline-pill">● Offline Bible ready</span><button className="avatar-button" type="button" aria-label="Account settings" onClick={() => setTab("settings")}>{user?.email?.charAt(0).toUpperCase() ?? "L"}</button></div></header>
        {notice ? <div className="notice" role="status">{notice}<button type="button" aria-label="Dismiss message" onClick={() => setNotice("")}>×</button></div> : null}
        {bibleError ? <div className="notice error" role="alert">{bibleError} <button type="button" onClick={() => window.location.reload()}>Retry</button></div> : null}

        {tab === "home" ? (
          <div className="home-stack">
            <section className="hero">
              <div className="hero-copy"><p className="eyebrow light">THE WORD IS CLOSE</p><h1>Let a little light<br />find you today.</h1><p>A Bible that gently bounces into your day, inviting you to pause, open, and read.</p><div className="button-row"><button className="button button-cream" type="button" onClick={openRandomVerse}>Open a verse <span>↗</span></button><button className="button button-ghost" type="button" onClick={() => void previewBounce()}>See the bounce</button></div></div>
              <div className="hero-art"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-glow" /><BookMark translation={state.translation} /></div>
              <span className="hero-corner">LOK / BIBLE / BOUNCE</span>
            </section>
            <div className="home-grid">
              <button className="home-card" type="button" onClick={() => setTab("sessions")}><span className="card-icon gold">◷</span><span className="card-title">Settle in & read</span><span className="card-copy">Start a 5-minute pause or stay longer.</span><span className="card-arrow">↗</span></button>
              <button className="home-card" type="button" onClick={() => setTab("reminders")}><span className="card-icon sage">◉</span><span className="card-title">A gentle nudge</span><span className="card-copy">{upcoming ? `Next: ${upcoming}` : "Choose when the Bible comes to you."}</span><span className="card-arrow">↗</span></button>
              <button className="home-card" type="button" onClick={() => setTab("progress")}><span className="card-icon rose">✦</span><span className="card-title">Your moments</span><span className="card-copy">{summary.totalSeconds ? `${formatDuration(summary.totalSeconds)} of reading saved.` : "Every moment has a beginning."}</span><span className="card-arrow">↗</span></button>
            </div>
            <div className="home-footnote"><span>READ AT YOUR OWN PACE</span><p>No pressure. No perfect streak required. Just an open invitation to spend time in Scripture.</p></div>
          </div>
        ) : null}

        {tab === "read" ? <Reader bible={bible} translation={state.translation} reference={reference} onReference={setPassage} onTranslation={changeTranslation} onStartSession={() => setTab("sessions")} /> : null}
        {tab === "sessions" ? <SessionPanel session={state.activeSession} onStart={startSession} onPause={() => setState((current) => current.activeSession ? { ...current, activeSession: pauseSession(current.activeSession) } : current)} onResume={() => setState((current) => current.activeSession ? { ...current, activeSession: resumeSession(current.activeSession) } : current)} onFinish={saveSession} onRead={() => setTab("read")} /> : null}
        {tab === "reminders" ? <Reminders reminders={state.reminders} onChange={(reminders) => setState((current) => ({ ...current, reminders }))} onPreview={() => void previewBounce()} /> : null}
        {tab === "progress" ? <ProgressPanel sessions={state.sessions} /> : null}
        {tab === "settings" ? <SettingsPanel translation={state.translation} reducedMotion={state.reducedMotion} bounceEnabled={state.bounceEnabled} restMode={state.restMode} restCorner={state.restCorner} accountEmail={user?.email ?? null} accountLoading={accountLoading} accountMessage={accountMessage} syncMessage={syncMessage} onTranslation={changeTranslation} onReducedMotion={(reducedMotion) => setState((current) => ({ ...current, reducedMotion }))} onBounceEnabled={(bounceEnabled) => setState((current) => ({ ...current, bounceEnabled }))} onRestMode={(restMode) => setState((current) => ({ ...current, restMode }))} onRestCorner={(restCorner) => setState((current) => ({ ...current, restCorner }))} onSignIn={async (email) => { await sendSignInLink(email); setAccountMessage("Check your email for a sign-in link, then return to LokBounce."); }} onSignOut={async () => { await signOut(); setAccountMessage("Signed out. Your local reminders remain available."); }} /> : null}
      </main>

      {browserPreview ? <BouncePreview translation={state.translation} reducedMotion={state.reducedMotion} onOpen={openRandomVerse} onDismiss={() => setBrowserPreview(false)} /> : null}
    </div>
  );
}
