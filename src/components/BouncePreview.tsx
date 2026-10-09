import { useEffect, useRef } from "react";
import { BookMark } from "./BookMark";
import type { Translation } from "../types";

interface BouncePreviewProps {
  translation: Translation;
  reducedMotion: boolean;
  onOpen: () => void;
  onDismiss: () => void;
}

export function BouncePreview({ translation, reducedMotion, onOpen, onDismiss }: BouncePreviewProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLButtonElement>(null);
  const hovered = useRef(false);

  useEffect(() => {
    const stage = stageRef.current;
    const book = bookRef.current;
    if (!stage || !book) return;

    const margin = 40;
    let x = margin;
    let y = margin;
    let vx = 92; // CSS pixels per second, independent of refresh rate.
    let vy = 68;
    let maxX = margin;
    let maxY = margin;
    let lastFrame = 0;
    let frame = 0;

    function draw() {
      book!.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }

    function measure() {
      maxX = Math.max(margin, stage!.clientWidth - book!.offsetWidth - margin);
      maxY = Math.max(margin, stage!.clientHeight - book!.offsetHeight - margin);
      x = Math.min(x, maxX);
      y = Math.min(y, maxY);
      draw();
    }

    function step(timestamp: number) {
      // A suspended tab must resume at its last position, not leap across the screen.
      const seconds = lastFrame ? Math.min((timestamp - lastFrame) / 1000, 0.05) : 0;
      lastFrame = timestamp;
      // The user explicitly started this preview; the in-app reduced-motion switch still stops it.
      if (!hovered.current && !reducedMotion) {
        x += vx * seconds;
        y += vy * seconds;
        if (x <= margin) { x = margin + (margin - x); vx = Math.abs(vx); }
        if (x >= maxX) { x = maxX - (x - maxX); vx = -Math.abs(vx); }
        if (y <= margin) { y = margin + (margin - y); vy = Math.abs(vy); }
        if (y >= maxY) { y = maxY - (y - maxY); vy = -Math.abs(vy); }
        x = Math.max(margin, Math.min(maxX, x));
        y = Math.max(margin, Math.min(maxY, y));
        draw();
      }
      frame = window.requestAnimationFrame(step);
    }

    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(stage);
    frame = window.requestAnimationFrame(step);
    return () => { resize.disconnect(); window.cancelAnimationFrame(frame); };
  }, [reducedMotion]);

  return (
    <div className="browser-bounce-preview" ref={stageRef}>
      <button
        ref={bookRef}
        className="preview-book-button"
        type="button"
        aria-label="Open the bouncing Bible"
        onPointerEnter={() => { hovered.current = true; }}
        onPointerLeave={() => { hovered.current = false; }}
        onFocus={() => { hovered.current = true; }}
        onBlur={() => { hovered.current = false; }}
        onClick={onOpen}
      ><BookMark translation={translation} size="small" /></button>
      <button className="preview-dismiss" type="button" onClick={onDismiss}>Dismiss preview</button>
    </div>
  );
}
