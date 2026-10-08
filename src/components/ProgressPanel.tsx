import { formatDuration, progressSummary } from "../lib/sessions";
import type { ReadingSession } from "../types";

interface ProgressPanelProps { sessions: ReadingSession[]; }

export function ProgressPanel({ sessions }: ProgressPanelProps) {
  const summary = progressSummary(sessions);
  return (
    <section className="section-stack">
      <div className="section-heading"><div><p className="eyebrow">Your reading</p><h2>Every moment adds up.</h2></div></div>
      <div className="stats-grid">
        <div className="stat-card"><span>Total time</span><strong className="duration-value">{formatDuration(summary.totalSeconds)}</strong></div>
        <div className="stat-card"><span>Completed goals</span><strong>{summary.completed}</strong></div>
        <div className="stat-card"><span>Reading streak</span><strong>{summary.streak}<small> days</small></strong></div>
      </div>
      <div className="panel">
        <div className="panel-heading"><h3>Session history</h3><span>{sessions.length} saved</span></div>
        {sessions.length === 0 ? <div className="empty-state compact">Your completed reading moments will appear here.</div> : (
          <div className="session-history">
            {[...sessions].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt)).map((session) => (
              <div className="history-row" key={session.id}>
                <div className="history-date">{new Date(session.finishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
                <div className="history-time">{formatDuration(session.activeSeconds)} read</div>
                <span className={session.completed ? "history-badge complete" : "history-badge"}>{session.completed ? "Goal met" : "Session saved"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="muted-note">These numbers describe time spent reading. They do not measure faith or spiritual worth.</p>
    </section>
  );
}
