import type { BibleData, BibleBook, PassageRef, Translation, Verse } from "../types";

const cache = new Map<Translation, Promise<BibleData>>();
const references = new Map<Translation, PassageRef[]>();

export const translationNames: Record<Translation, string> = {
  web: "World English Bible",
  kjv: "King James Version",
};

export async function loadBible(translation: Translation): Promise<BibleData> {
  const existing = cache.get(translation);
  if (existing) return existing;
  const request = fetch(`/bibles/${translation}.json`)
    .then(async (response) => {
      if (!response.ok) throw new Error(`Could not load ${translationNames[translation]} (${response.status}).`);
      const bible = (await response.json()) as BibleData;
      if (bible.translation !== translation || bible.books.length !== 66) {
        throw new Error("The offline Bible data is incomplete.");
      }
      return bible;
    })
    .catch((error: unknown) => {
      cache.delete(translation);
      throw error;
    });
  cache.set(translation, request);
  return request;
}

export function findBook(bible: BibleData, code: string): BibleBook | undefined {
  return bible.books.find((book) => book.code === code);
}

export function chapterVerses(bible: BibleData, ref: PassageRef): Verse[] {
  return findBook(bible, ref.book)?.chapters[ref.chapter - 1] ?? [];
}

export function verseText(bible: BibleData, ref: PassageRef): string | undefined {
  return chapterVerses(bible, ref).find(([number]) => number === ref.verse)?.[1];
}

export function formatReference(bible: BibleData, ref: PassageRef): string {
  const book = findBook(bible, ref.book)?.name ?? ref.book;
  return `${book} ${ref.chapter}:${ref.verse}`;
}

export function randomReference(bible: BibleData, random = Math.random): PassageRef {
  let pool = references.get(bible.translation);
  if (!pool) {
    pool = [];
    for (const book of bible.books) {
      book.chapters.forEach((chapter, chapterIndex) => {
        for (const [verse, text] of chapter) {
          if (text.trim()) pool!.push({ book: book.code, chapter: chapterIndex + 1, verse });
        }
      });
    }
    references.set(bible.translation, pool);
  }
  if (pool.length === 0) throw new Error("No verses found in this translation.");
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}
