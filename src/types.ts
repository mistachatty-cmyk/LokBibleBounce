export type Translation = "web" | "kjv";
export type RestMode = "corner" | "dashboard" | "off";
export type RestCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type Verse = [number, string];

export interface BibleBook {
  code: string;
  name: string;
  chapters: Verse[][];
}

export interface BibleData {
  translation: Translation;
  edition: string;
  source: string;
  books: BibleBook[];
  verseCount: number;
}

export interface PassageRef {
  book: string;
  chapter: number;
  verse: number;
}

export interface Reminder {
  id: string;
  time: string;
  days: number[]; // 0=Sunday, 6=Saturday in the user's local time zone.
  enabled: boolean;
}

export interface ReadingSession {
  id: string;
  startedAt: string;
  finishedAt: string;
  goalSeconds: number;
  activeSeconds: number;
  translation: Translation;
  completed: boolean;
}

export interface ActiveSession {
  id: string;
  startedAt: string;
  goalSeconds: number;
  activeSeconds: number;
  translation: Translation;
  running: boolean;
  lastTickAt: number | null;
}

export interface AppState {
  schemaVersion: 1;
  translation: Translation;
  reminders: Reminder[];
  sessions: ReadingSession[];
  sessionOwnerId: string | null;
  activeSession: ActiveSession | null;
  bounceEnabled: boolean;
  restMode: RestMode;
  restCorner: RestCorner;
  reducedMotion: boolean;
  lastReference: PassageRef | null;
}
