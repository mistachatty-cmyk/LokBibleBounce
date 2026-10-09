import { useState } from "react";
import { SESSION_PRESETS } from "../lib/sessions";
import type { ActiveSession } from "../types";

interface SessionPanelProps {
  session: ActiveSession | null;
  onStart: (minutes: number) => void;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
  onRead: () => void;
}

function clock(seconds: number): string {
  const whole = Math.floor(seconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const rest = whole % 60;
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}` : `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function SessionPanel({ session, onStart, onPause, onResume, onFinish, onRead }: SessionPanelProps) {
  const [custom, setCustom] = useState(25);
  const [error, setError] = useState("");
  const reached = session ? session.activeSeconds >= session.goalSeconds : false;

  function start(minutes: number) {
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 720) {
      setError("Choose 1 to 720 minutes.");
      return;
    }
    setError("");
    onStart(minutes);
  }

  return (
    <section className="section-stack">
      <div className="section-heading"><div><p className="eyebrow">Reading sessions</p><h2>Set aside time for the Word.</h2></div></div>
      {session ? (
        <div className="session-active panel">
          <p className="eyebrow">{session.running ? "Reading time in progress" : "Paused"}</p>
          <div className="session-clock" aria-live="off">{clock(session.activeSeconds)}</div>
          <p className="session-goal">Goal: {clock(session.goalSeconds)} {reached ? "· Goal reached — keep reading if you like" : ""}</p>
          <div className="progress-track" role="progressbar" aria-label="Reading goal progress" aria-valuemin={0} aria-valuemax={session.goalSeconds} aria-valuenow={Math.min(session.goalSeconds, Math.floor(session.activeSeconds))}>
            <div style={{ width: `${Math.min(100, session.activeSeconds / session.goalSeconds * 100)}%` }} />
          </div>
          <div className="button-row">
            <button className="button button-primary" type="button" onClick={session.running ? onPause : onResume}>{session.running ? "Pause timer" : "Resume timer"}</button>
            <button className="button button-secondary" type="button" onClick={onRead}>Open Bible</button>
            <button className="text-button" type="button" onClick={onFinish}>Finish & save</button>
          </div>
          <p className="muted-note">Only active time is saved. If the computer sleeps or the timer loses track of a long gap, it pauses for accuracy.</p>
        </div>
      ) : (
        <div className="panel">
          <p className="panel-intro">Pick a reading goal. You can pause whenever you stop reading, including when you read a physical Bible.</p>
          <div className="preset-grid">
            {SESSION_PRESETS.map((minutes) => <button className="preset-button" type="button" key={minutes} onClick={() => start(minutes)}>{minutes < 60 ? `${minutes} min` : `${minutes / 60} ${minutes === 60 ? "hour" : "hours"}`}</button>)}
          </div>
          <div className="custom-line">
            <label className="field-label">Custom minutes <input type="number" min={1} max={720} step={1} value={custom} onChange={(event) => setCustom(Number(event.target.value))} /></label>
            <button className="button button-primary" type="button" onClick={() => start(custom)}>Start session</button>
          </div>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
        </div>
      )}
    </section>
  );
}
