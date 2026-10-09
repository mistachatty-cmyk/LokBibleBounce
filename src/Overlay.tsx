import { useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { BookMark } from "./components/BookMark";
import { dismissReminder, isReminderBounce, openFromOverlay, setBounceHovered, snoozeReminder } from "./lib/native";
import { loadState } from "./lib/storage";
import type { Translation } from "./types";

export default function Overlay() {
  const [translation, setTranslation] = useState<Translation>(() => loadState().translation);
  const [reminder, setReminder] = useState(false);
  const [impact, setImpact] = useState("");
  const impactTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    const timer = window.setInterval(() => setTranslation(loadState().translation), 2000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let alive = true;
    const unlisten: Array<() => void> = [];
    void isReminderBounce().then((value) => { if (alive) setReminder(value); });
    void listen<boolean>("bounce-mode", ({ payload }) => { if (alive) setReminder(payload); }).then((remove) => unlisten.push(remove));
    void listen<string>("bounce-impact", ({ payload }) => {
      if (!alive || loadState().reducedMotion) return;
      window.clearTimeout(impactTimer.current);
      setImpact(payload);
      impactTimer.current = window.setTimeout(() => setImpact(""), 390);
    }).then((remove) => unlisten.push(remove));
    return () => { alive = false; unlisten.forEach((remove) => remove()); window.clearTimeout(impactTimer.current); };
  }, []);

  return (
    <div className={`overlay-stage ${reminder ? "reminder" : ""}`}>
      <button type="button" className={`overlay-book-button ${impact ? `impact-${impact}` : ""}`} aria-label="Open the Bible" onPointerEnter={() => void setBounceHovered(true)} onPointerLeave={() => void setBounceHovered(false)} onClick={() => void openFromOverlay()}><BookMark translation={translation} size="small" /></button>
      {reminder ? <div className="overlay-actions"><button type="button" onClick={() => void snoozeReminder()}>Snooze</button><button type="button" onClick={() => void dismissReminder()}>Dismiss</button></div> : null}
    </div>
  );
}
