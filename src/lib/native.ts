import { invoke, isTauri } from "@tauri-apps/api/core";
import type { Reminder } from "../types";

export const desktop = isTauri();

export async function showBounce(): Promise<void> {
  if (desktop) await invoke("show_bounce", { reminderId: null });
}

export async function hideBounce(): Promise<void> {
  if (desktop) await invoke("hide_bounce");
}

export async function syncReminders(reminders: Reminder[]): Promise<void> {
  if (desktop) await invoke("set_reminders", { reminders });
}

export async function syncBounceEnabled(enabled: boolean): Promise<void> {
  if (desktop) await invoke("set_bounce_enabled", { enabled });
}

export async function openFromOverlay(): Promise<void> {
  if (desktop) await invoke("open_from_overlay");
}

export async function snoozeReminder(): Promise<void> {
  if (desktop) await invoke("snooze_reminder");
}

export async function dismissReminder(): Promise<void> {
  if (desktop) await invoke("dismiss_reminder");
}
