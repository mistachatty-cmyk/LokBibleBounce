import { useState } from "react";
import type { Reminder } from "../types";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const weekdays = [1, 2, 3, 4, 5];

interface RemindersProps {
  reminders: Reminder[];
  onChange: (reminders: Reminder[]) => void;
  onPreview: () => void;
}

export function Reminders({ reminders, onChange, onPreview }: RemindersProps) {
  const [time, setTime] = useState("08:00");
  const [days, setDays] = useState<number[]>([...weekdays]);

  function addReminder() {
    if (!/^\d{2}:\d{2}$/.test(time) || days.length === 0) return;
    onChange([...reminders, { id: crypto.randomUUID(), time, days: [...days].sort(), enabled: true }]);
  }

  function toggleDay(day: number) {
    setDays((current) => current.includes(day) ? current.filter((value) => value !== day) : [...current, day]);
  }

  return (
    <section className="section-stack">
      <div className="section-heading">
        <div><p className="eyebrow">Gentle reminders</p><h2>Make room for a moment.</h2></div>
        <button className="button button-secondary" type="button" onClick={onPreview}>Preview the bounce</button>
      </div>
      <div className="panel reminder-builder">
        <div className="form-line">
          <label className="field-label">Time <input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label>
          <div className="field-label">Days
            <div className="day-picker" role="group" aria-label="Reminder days">
              {dayNames.map((name, day) => <button type="button" key={name} className={days.includes(day) ? "day-pill selected" : "day-pill"} aria-pressed={days.includes(day)} onClick={() => toggleDay(day)}>{name}</button>)}
            </div>
          </div>
        </div>
        <div className="button-row">
          <button className="button button-primary" type="button" disabled={days.length === 0} onClick={addReminder}>Add reminder</button>
          <button className="text-button" type="button" onClick={() => setDays([0, 1, 2, 3, 4, 5, 6])}>Every day</button>
          <button className="text-button" type="button" onClick={() => setDays([...weekdays])}>Weekdays</button>
        </div>
      </div>
      {reminders.length === 0 ? <div className="empty-state">No reminders yet. Add a time that fits your day.</div> : (
        <div className="reminder-list">
          {reminders.map((reminder) => (
            <div className="reminder-item" key={reminder.id}>
              <div className="reminder-time">{new Date(`2000-01-01T${reminder.time}:00`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div>
              <div className="reminder-description">{reminder.days.length === 7 ? "Every day" : reminder.days.map((day) => dayNames[day]).join(" · ")}</div>
              <label className="switch-label"><input type="checkbox" checked={reminder.enabled} onChange={(event) => onChange(reminders.map((item) => item.id === reminder.id ? { ...item, enabled: event.target.checked } : item))} /><span>{reminder.enabled ? "On" : "Off"}</span></label>
              <button className="icon-button" type="button" aria-label={`Delete ${reminder.time} reminder`} onClick={() => onChange(reminders.filter((item) => item.id !== reminder.id))}>×</button>
            </div>
          ))}
        </div>
      )}
      <p className="muted-note">Reminders follow this computer’s local time. Snooze or dismiss a bounce at any time. An alert becomes quiet after two minutes.</p>
    </section>
  );
}
