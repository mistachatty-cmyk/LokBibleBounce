import { describe, expect, it } from "vitest";
import web from "../../public/bibles/web.json";
import kjv from "../../public/bibles/kjv.json";
import { chapterVerses, randomReference, verseText } from "./bible";
import type { BibleData } from "../types";

describe("offline Bible corpus", () => {
  for (const edition of [web, kjv] as BibleData[]) {
    it(`${edition.translation} contains the 66 books and a readable John 3:16`, () => {
      expect(edition.books).toHaveLength(66);
      expect(edition.verseCount).toBeGreaterThan(31_000);
      const ref = { book: "JOH", chapter: 3, verse: 16 };
      expect(verseText(edition, ref)).toContain("God so loved the world");
      expect(chapterVerses(edition, ref).length).toBeGreaterThan(30);
      const random = randomReference(edition, () => 0.5);
      expect(verseText(edition, random)?.trim()).toBeTruthy();
    });
  }
});
