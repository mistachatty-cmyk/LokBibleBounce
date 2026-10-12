import type { Translation } from "../types";

interface BookMarkProps {
  translation: Translation;
  size?: "small" | "large";
  open?: boolean;
  className?: string;
}

export function BookMark({ translation, size = "large", open = false, className = "" }: BookMarkProps) {
  return (
    <div className={`book-mark ${translation} ${size} ${open ? "is-open" : ""} ${className}`} aria-hidden="true">
      <div className="book-pages" />
      <div className="book-cover">
        <div className="book-cover-frame">
          <span className="book-cover-cross">✝</span>
          <span className="book-cover-title">HOLY<br />BIBLE</span>
          <span className="book-cover-version">{translation === "kjv" ? "KING JAMES" : "WORLD ENGLISH"}</span>
        </div>
      </div>
      <div className="book-ribbon" />
    </div>
  );
}
