import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import App from "./App";

// Keep the Bible corpus, account client, and full dashboard unmounted while
// the desktop companion is only resting or bouncing.
export default function ReaderShell() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    const unlisten: Array<() => void> = [];
    void invoke<boolean>("is_reader_open").then((value) => { if (alive && value) setOpen(true); });
    void listen("open-reader", () => { if (alive) setOpen(true); }).then((remove) => unlisten.push(remove));
    void listen("close-reader", () => { if (alive) setOpen(false); }).then((remove) => unlisten.push(remove));
    return () => { alive = false; unlisten.forEach((remove) => remove()); };
  }, []);

  return open ? <App /> : null;
}
