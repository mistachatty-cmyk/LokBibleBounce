import { useEffect, useRef, useState } from "react";
import { chapterVerses, findBook, formatReference, randomReference, verseText } from "../lib/bible";
import type { BibleData, PassageRef, Translation } from "../types";

interface ReaderProps {
  bible: BibleData | null;
  translation: Translation;
  reference: PassageRef | null;
  onReference: (reference: PassageRef) => void;
  onTranslation: (translation: Translation) => void;
  onStartSession: () => void;
}

export function Reader({ bible, translation, reference, onReference, onTranslation, onStartSession }: ReaderProps) {
  const [chapterOpen, setChapterOpen] = useState(false);
  const [opening, setOpening] = useState(false);
  const highlight = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChapterOpen(false);
    setOpening(true);
    const timeout = window.setTimeout(() => setOpening(false), 850);
    return () => window.clearTimeout(timeout);
  }, [reference?.book, reference?.chapter, reference?.verse, translation]);

  useEffect(() => {
    if (chapterOpen) highlight.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [chapterOpen, reference]);

  if (!bible) {
    return <section className="reader-card loading-card" aria-live="polite">Opening the Bible…</section>;
  }

  const current = reference ?? randomReference(bible, () => 0.46);
  const book = findBook(bible, current.book);
  const text = verseText(bible, current);
  const verses = chapterVerses(bible, current);
  const context = verses.filter(([number, verse]) => number < current.verse && verse.trim()).slice(-2);
  const verseSize = (text?.length ?? 0) > 290 ? "very-long" : (text?.length ?? 0) > 160 ? "long" : "";

  function anotherVerse() {
    if (bible) onReference(randomReference(bible));
  }

  return (
    <section className="reader-shell" aria-label="Bible reader">
      <div className="reader-topline">
        <div>
          <p className="eyebrow">A moment in the Word</p>
          <h2>Read a little. Stay a while.</h2>
        </div>
        <label className="translation-control">
          <span>Translation</span>
          <select value={translation} onChange={(event) => onTranslation(event.target.value as Translation)}>
            <option value="web">World English Bible</option>
            <option value="kjv">King James Version</option>
          </select>
        </label>
      </div>

      <div className={`open-bible ${opening ? "opening" : ""}`} aria-label={`Open Bible at ${formatReference(bible, current)}`}>
        <div className="book-leaf book-leaf-left">
          <p className="book-page-overline">The Holy Bible</p>
          <div className="book-page-rule" />
          <h3>{book?.name}</h3>
          <p className="book-chapter-label">Chapter {current.chapter}</p>
          <div className="book-context">
            {context.length ? context.map(([number, verse]) => <p key={number}><sup>{number}</sup> {verse}</p>) : <p>Pause here. Let this passage meet you where you are.</p>}
          </div>
          <span className="book-page-number">{current.chapter}</span>
        </div>
        <div className="book-leaf book-leaf-right">
          <p className="book-page-overline">{translation === "kjv" ? "King James Version" : "World English Bible"}</p>
          <div className="book-page-rule" />
          <div className={`book-verse-focus ${verseSize}`}>
            <p className="reader-reference">{formatReference(bible, current)}</p>
            <blockquote>{text || "This verse is not included in this edition."}</blockquote>
          </div>
          <span className="book-page-number">{current.verse}</span>
        </div>
        {opening ? <div className="book-opening-cover" aria-hidden="true"><span>✝</span><strong>HOLY<br />BIBLE</strong></div> : null}
      </div>
      <div className="reader-toolbar">
        <div className="reader-edition">{bible.edition}</div>
        <div className="button-row">
          <button className="button button-primary" type="button" onClick={() => setChapterOpen((value) => !value)}>
            {chapterOpen ? "Close chapter" : `Read ${book?.name ?? "the"} ${current.chapter}`}
          </button>
          <button className="button button-secondary" type="button" onClick={anotherVerse}>Another verse</button>
          <button className="text-button" type="button" onClick={onStartSession}>Start a reading session</button>
        </div>
      </div>

      {chapterOpen ? (
        <article className="chapter-card" aria-label={`${book?.name} chapter ${current.chapter}`}>
          <div className="chapter-heading">
            <div>
              <p className="eyebrow">{translation === "kjv" ? "King James Version" : "World English Bible"}</p>
              <h3>{book?.name} {current.chapter}</h3>
            </div>
            <button className="text-button" type="button" onClick={() => setChapterOpen(false)}>Close</button>
          </div>
          <div className="chapter-verses">
            {verses.filter(([, verse]) => verse.trim()).map(([number, verse]) => (
              <div className={`chapter-verse ${number === current.verse ? "highlight" : ""}`} key={number} ref={number === current.verse ? highlight : undefined}>
                <sup>{number}</sup><span>{verse}</span>
              </div>
            ))}
          </div>
        </article>
      ) : null}
    </section>
  );
}
