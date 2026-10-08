import { describe, expect, it } from "vitest";
import { beginSession, finishSession, pauseSession, resumeSession, tickSession } from "./sessions";

describe("reading time", () => {
  it("counts active intervals and excludes pauses", () => {
    const start = Date.parse("2026-10-08T10:00:00Z");
    let session = beginSession(5, "web", start);
    session = pauseSession(session, start + 60_000);
    expect(session.activeSeconds).toBe(60);
    session = resumeSession(session, start + 360_000);
    const saved = finishSession(session, start + 600_000);
    expect(saved.activeSeconds).toBe(300);
    expect(saved.completed).toBe(true);
  });

  it("pauses after a clock jump instead of crediting unseen time", () => {
    const session = beginSession(20, "kjv", 1_000_000);
    const afterSleep = tickSession(session, 1_600_000);
    expect(afterSleep.running).toBe(false);
    expect(afterSleep.activeSeconds).toBe(0);
  });
});
