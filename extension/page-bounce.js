(() => {
  const existing = document.getElementById("lokbiblebounce-page-companion");
  if (existing) { existing.remove(); return; }
  const host = document.createElement("div");
  host.id = "lokbiblebounce-page-companion";
  host.style.cssText = "position:fixed;left:24px;top:24px;width:132px;height:150px;z-index:2147483647;pointer-events:none;contain:layout style;";
  const shadow = host.attachShadow({ mode: "closed" });
  shadow.innerHTML = `<style>*{box-sizing:border-box}.book{pointer-events:auto;display:block;margin:0;width:82px;height:106px;border:0;border-radius:5px 10px 10px 5px;background:linear-gradient(110deg,#132e28,#285445 70%,#102b25);box-shadow:4px 5px 0 #e9dfc3,7px 8px 13px #0007;color:#efd89e;font:600 12px Georgia,serif;cursor:pointer;transform:rotate(-8deg);transition:transform .16s ease,box-shadow .16s ease}.book:hover,.book:focus-visible{transform:rotate(0) scale(1.06);box-shadow:4px 5px 0 #e9dfc3,8px 11px 16px #0008}.book span{display:block;margin:9px;border:1px solid #aa9161;padding:15px 3px;line-height:1.2}.panel{pointer-events:auto;display:none;position:absolute;left:4px;top:6px;width:280px;padding:18px;border:1px solid #b7a882;border-radius:9px;background:#f5f0e4;color:#22362d;box-shadow:0 12px 40px #0007;font:15px/1.5 Georgia,serif}.panel.open{display:block}.panel strong{display:block;padding-right:25px}.panel a{color:#214f3e}.close{position:absolute;right:10px;top:8px;border:0;background:none;color:#22362d;font-size:22px;cursor:pointer}.ref{margin:12px 0 7px;font-weight:bold}.hint{font:11px Arial,sans-serif;color:#526457}@media(prefers-reduced-motion:reduce){.book{transition:none}}</style><button class="book" type="button" aria-label="Open bouncing Bible"><span>✝<br>HOLY<br>BIBLE</span></button><section class="panel" aria-label="Bible verse"><button class="close" type="button" aria-label="Close Bible">×</button><strong>A moment in the Word</strong><p class="ref"></p><p class="verse"></p><a class="chapter" target="_blank" rel="noopener">Read full chapter ↗</a><p class="hint">King James Version · The desktop app includes full offline reading.</p></section>`;
  document.documentElement.appendChild(host);
  const book = shadow.querySelector(".book");
  const panel = shadow.querySelector(".panel");
  const verses = [
    { ref: "Psalm 46:10", chapter: "Psalm 46", text: "Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth." },
    { ref: "John 3:16", chapter: "John 3", text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." },
    { ref: "Matthew 11:28", chapter: "Matthew 11", text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest." },
    { ref: "Proverbs 3:5", chapter: "Proverbs 3", text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding." }
  ];
  let x = 24, y = 24, vx = 88, vy = 63, last = 0;
  let paused = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const step = (time) => {
    if (!host.isConnected) return;
    const delta = Math.min((time - (last || time)) / 1000, .05); last = time;
    if (!paused && !document.hidden) {
      x += vx * delta; y += vy * delta;
      const maxX = Math.max(0, innerWidth - 105), maxY = Math.max(0, innerHeight - 115);
      if (x <= 0 || x >= maxX) { x = Math.max(0, Math.min(maxX, x)); vx *= -1; }
      if (y <= 0 || y >= maxY) { y = Math.max(0, Math.min(maxY, y)); vy *= -1; }
      host.style.transform = `translate3d(${Math.round(x - 24)}px,${Math.round(y - 24)}px,0)`;
    }
    requestAnimationFrame(step);
  };
  book.addEventListener("mouseenter", () => { paused = true; });
  book.addEventListener("mouseleave", () => { if (!panel.classList.contains("open")) paused = matchMedia("(prefers-reduced-motion: reduce)").matches; });
  book.addEventListener("click", () => {
    const verse = verses[Math.floor(Math.random() * verses.length)];
    shadow.querySelector(".ref").textContent = verse.ref;
    shadow.querySelector(".verse").textContent = verse.text;
    shadow.querySelector(".chapter").href = `https://www.biblegateway.com/passage/?search=${encodeURIComponent(verse.chapter)}&version=KJV`;
    panel.classList.add("open"); paused = true;
  });
  shadow.querySelector(".close").addEventListener("click", () => { panel.classList.remove("open"); paused = matchMedia("(prefers-reduced-motion: reduce)").matches; });
  requestAnimationFrame(step);
})();
