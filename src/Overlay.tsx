import { useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { BookMark } from "./components/BookMark";
import { dismissReminder, isReminderBounce, openFromOverlay, setBounceHovered, setOverlayMenu, showBounce, snoozeReminder } from "./lib/native";
import { loadState } from "./lib/storage";
import type { Translation } from "./types";

export default function Overlay() {
  const [translation, setTranslation] = useState<Translation>(() => loadState().translation);
  const [reminder, setReminder] = useState(false);
  const [impact, setImpact] = useState("");
  const [menu, setMenu] = useState(false);
  const [moving, setMoving] = useState(false);
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
    void listen<string>("overlay-state", ({ payload }) => { if (alive) { setMenu(payload === "menu"); setMoving(payload === "bounce"); } }).then((remove) => unlisten.push(remove));
    void listen<string>("bounce-impact", ({ payload }) => {
      if (!alive || loadState().reducedMotion) return;
      window.clearTimeout(impactTimer.current);
      setImpact(payload);
      impactTimer.current = window.setTimeout(() => setImpact(""), 390);
    }).then((remove) => unlisten.push(remove));
    return () => { alive = false; unlisten.forEach((remove) => remove()); window.clearTimeout(impactTimer.current); };
  }, []);

  return (
    <div className={`overlay-stage ${reminder ? "reminder" : ""} ${menu ? "menu-open" : ""}`}>
      <button type="button" className={`overlay-book-button ${impact ? `impact-${impact}` : ""}`} aria-label="Bible options" onPointerEnter={() => void setBounceHovered(true)} onPointerLeave={() => void setBounceHovered(false)} onClick={() => void setOverlayMenu(true)}><BookMark translation={translation} size="small" /></button>
      {menu ? <div className="overlay-menu" aria-label="Bible options"><div className="overlay-menu-heading">A moment in the Word</div><button type="button" onClick={() => void openFromOverlay()}>Open Bible & read ↗</button><button type="button" onClick={() => void showBounce()}>Bounce now</button><button type="button" onClick={() => void setOverlayMenu(false)}>Rest in corner</button>{reminder ? <div className="overlay-menu-reminder"><button type="button" onClick={() => void snoozeReminder()}>Snooze</button><button type="button" onClick={() => void dismissReminder()}>Dismiss</button></div> : null}</div> : null}
      {reminder && !menu ? <div className="overlay-actions"><button type="button" onClick={() => void snoozeReminder()}>Snooze</button><button type="button" onClick={() => void dismissReminder()}>Dismiss</button></div> : null}
      {moving && !menu && !reminder ? <span className="overlay-moving-hint">Click for options</span> : null}
    </div>
  );
}
