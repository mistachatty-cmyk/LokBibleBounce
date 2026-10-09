import { useEffect, useState } from "react";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";
import { desktop } from "../lib/native";
import type { BookSize, RestCorner, RestMode, Translation } from "../types";

interface SettingsPanelProps {
  translation: Translation;
  reducedMotion: boolean;
  bounceEnabled: boolean;
  restMode: RestMode;
  restCorner: RestCorner;
  bookSize: BookSize;
  accountEmail: string | null;
  accountLoading: boolean;
  accountMessage: string;
  syncMessage: string;
  onTranslation: (translation: Translation) => void;
  onReducedMotion: (enabled: boolean) => void;
  onBounceEnabled: (enabled: boolean) => void;
  onRestMode: (mode: RestMode) => void;
  onRestCorner: (corner: RestCorner) => void;
  onBookSize: (size: BookSize) => void;
  onSignIn: (email: string) => Promise<void>;
  onSignOut: () => Promise<void>;
}

export function SettingsPanel(props: SettingsPanelProps) {
  const [email, setEmail] = useState("");
  const [autostart, setAutostart] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (desktop) void isEnabled().then(setAutostart).catch(() => setAutostart(false));
  }, []);

  async function toggleAutostart(checked: boolean) {
    setError("");
    try {
      if (checked) await enable(); else await disable();
      setAutostart(checked);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not change startup setting.");
    }
  }

  async function submitSignIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try { await props.onSignIn(email); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not send a sign-in link."); }
    finally { setBusy(false); }
  }

  async function submitSignOut() {
    setBusy(true); setError("");
    try { await props.onSignOut(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not sign out."); }
    finally { setBusy(false); }
  }

  return (
    <section className="section-stack">
      <div className="section-heading"><div><p className="eyebrow">Make it yours</p><h2>Settings</h2></div></div>
      <div className="settings-grid">
        <div className="panel settings-panel">
          <h3>Reading & appearance</h3>
          <label className="settings-row"><span><strong>Bible translation</strong><small>Cover and text change together</small></span><select value={props.translation} onChange={(event) => props.onTranslation(event.target.value as Translation)}><option value="web">World English Bible</option><option value="kjv">King James Version</option></select></label>
          <label className="settings-row"><span><strong>Resting Bible</strong><small>Where the Bible waits between reminders</small></span><select value={props.restMode} onChange={(event) => props.onRestMode(event.target.value as RestMode)}><option value="corner">In a screen corner</option><option value="off">Hidden until triggered</option></select></label>
          <label className="settings-row"><span><strong>Resting corner</strong><small>The Bible stays still until you activate it</small></span><select value={props.restCorner} onChange={(event) => props.onRestCorner(event.target.value as RestCorner)}><option value="top-left">Top left</option><option value="top-right">Top right</option><option value="bottom-left">Bottom left</option><option value="bottom-right">Bottom right</option></select></label>
          <label className="settings-row"><span><strong>Bible size</strong><small>Adaptive follows your usable desktop; corners stay clear of the taskbar</small></span><select value={props.bookSize} onChange={(event) => props.onBookSize(event.target.value as BookSize)}><option value="adaptive">Adaptive (recommended)</option><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select></label>
          <label className="settings-row"><span><strong>Reduce motion</strong><small>Use still transitions where possible</small></span><input type="checkbox" checked={props.reducedMotion} onChange={(event) => props.onReducedMotion(event.target.checked)} /></label>
          {desktop ? <label className="settings-row"><span><strong>Launch with Windows</strong><small>Start the Bible bounce when you sign in</small></span><input type="checkbox" checked={autostart} onChange={(event) => void toggleAutostart(event.target.checked)} /></label> : null}
        </div>
        <div className="panel settings-panel">
          <h3>Lok account</h3>
          <p className="panel-intro">Reading works without an account. Sign in to sync your session history with your Lok identity.</p>
          {props.accountLoading ? <p>Checking your account…</p> : props.accountEmail ? (
            <div className="account-signed-in"><div className="account-avatar">L</div><div><strong>{props.accountEmail}</strong><small>Connected to Lok</small></div><button className="text-button" type="button" disabled={busy} onClick={() => void submitSignOut()}>Sign out</button></div>
          ) : (
            <form className="account-form" onSubmit={(event) => void submitSignIn(event)}>
              <label className="field-label">Email address <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
              <button className="button button-primary" type="submit" disabled={busy}>{busy ? "Sending…" : "Email me a sign-in link"}</button>
            </form>
          )}
          {props.accountMessage ? <p className="form-message" role="status">{props.accountMessage}</p> : null}
          {props.syncMessage ? <p className="form-message" role="status">{props.syncMessage}</p> : null}
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <p className="muted-note">Your reminders stay on this device. LokBounce never publishes your reading history.</p>
        </div>
      </div>
    </section>
  );
}
