import { useEffect, useState } from "react";
import { BookMark } from "./components/BookMark";
import { dismissReminder, openFromOverlay, snoozeReminder } from "./lib/native";
import { loadState } from "./lib/storage";
import type { Translation } from "./types";

export default function Overlay() {
  const [translation, setTranslation] = useState<Translation>(() => loadState().translation);
  useEffect(() => {
    const timer = window.setInterval(() => setTranslation(loadState().translation), 2000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="overlay-stage">
      <button type="button" className="overlay-book-button" aria-label="Open the Bible" onClick={() => void openFromOverlay()}><BookMark translation={translation} size="small" /></button>
      <div className="overlay-actions"><button type="button" onClick={() => void snoozeReminder()}>Snooze</button><button type="button" onClick={() => void dismissReminder()}>Dismiss</button></div>
    </div>
  );
}
