// Interests: each upcoming event says how far off it is, like the next trip on Travel:
// "In 136 days", "Tomorrow", or "Tonight" on the day. Worked out from today's date in the visitor's browser.
// A count still days off flips down to its number like a departure board, the first time it scrolls into view.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const today = Date.parse(new Date().toLocaleDateString("en-CA"));
  for (const time of document.querySelectorAll(".events time[datetime]")) {
    const day = time.getAttribute("datetime");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
    const days = Math.round((Date.parse(day) - today) / 86400000);
    if (days < 0) continue;
    const tag = document.createElement("span");
    tag.className = "trip-countdown";
    const text = days === 0 ? "Tonight" : days === 1 ? "Tomorrow" : `In ${days} days`;
    time.before(tag);
    if (days < 2 || reduce || !("IntersectionObserver" in window)) { tag.textContent = text; continue; }
    // Far off: the number flips down like a departure board to the real count when it comes into view
    tag.setAttribute("aria-label", text);
    const num = document.createElement("span");
    num.className = "flip-num";
    num.setAttribute("aria-hidden", "true");
    const from = days + Math.min(90, Math.max(20, Math.round(days * 0.6)));
    num.textContent = from;
    tag.append("In ", num, " days");
    const io = new IntersectionObserver(es => {
      if (!es.some(e => e.isIntersecting)) return;
      io.disconnect();
      const start = performance.now(), dur = 1500;
      let shown = from;
      const tick = now => {
        const t = Math.min((now - start) / dur, 1), n = Math.round(from - (from - days) * (1 - (1 - t) ** 3));
        if (n !== shown) {
          shown = n; num.textContent = n;
          num.animate([{ transform: "rotateX(-70deg)", opacity: 0.35 }, { transform: "none", opacity: 1 }], { duration: 110, easing: "ease-out" });
        }
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 1 });
    io.observe(tag);
  }
})();
