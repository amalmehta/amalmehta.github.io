// Things I'm thinking about: under each question, how long it's been open ("open 47 days"), counted from the
// date it was added. The count runs up from zero as the question scrolls into view, with a faint pulse on its
// dot. Without JS the questions read as before; with reduced motion the count just shows.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DAY = 86400000, today = new Date();
  const lines = [];
  for (const li of document.querySelectorAll("li.thought:not([hidden])")) {
    const time = li.querySelector("time[datetime]"), h = li.querySelector("h2");
    if (!time || !h) continue;
    const iso = time.getAttribute("datetime"), parts = iso.split("-").map(Number);
    const added = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
    const days = Math.max(0, Math.floor((today - added) / DAY));
    const p = document.createElement("p");
    p.className = "open-for";
    p.innerHTML = '<span class="open-dot" aria-hidden="true"></span><span class="open-text"></span>';
    const text = p.querySelector(".open-text");
    const say = n => { text.textContent = days === 0 ? "opened today" : `open ${n} day${n === 1 ? "" : "s"}`; };
    say(days);
    h.after(p);
    lines.push({ p, days, say });
  }
  if (!lines.length || reduce || !("IntersectionObserver" in window)) return;
  const run = ({ p, days, say }) => {
    p.classList.add("ticking");
    const t0 = performance.now(), dur = 700 + Math.min(days, 120) * 6;
    const step = now => { const k = Math.min((now - t0) / dur, 1), e = 1 - (1 - k) ** 3; say(Math.round(days * e)); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) { io.unobserve(e.target); const l = lines.find(x => x.p === e.target); if (l) run(l); } }, { threshold: 1 });
  for (const l of lines) io.observe(l.p);   // the real count shows until its count-up runs
})();
