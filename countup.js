// Case studies, Results: the first time the result cards come into view, their big numbers count up from zero
// to what's written (0.72, 138, 58%, 15.8 → 10.8 cm), keeping each number's decimals. Denominators (the 40 in
// 32/40, the 3 in 1 of 3) and powers of ten stay as written. Without JS, or with reduced motion, the numbers are simply shown.
(() => {
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const NUM = /(\/|of )?(\d+(?:\.\d+)?)/g, DURATION = 1300;
  for (const stats of document.querySelectorAll(".stats")) {
    const cells = [...stats.querySelectorAll(".stat strong")].filter(s => !s.textContent.includes("×") && /\d/.test(s.textContent));
    if (!cells.length) continue;
    const parts = cells.map(s => {
      const text = s.textContent, bits = [];
      let last = 0;
      for (const m of text.matchAll(NUM)) {
        const at = m.index + (m[1] ? m[1].length : 0);
        bits.push(text.slice(last, at));
        bits.push(m[1] ? m[2] : { to: parseFloat(m[2]), places: (m[2].split(".")[1] || "").length });
        last = at + m[2].length;
      }
      bits.push(text.slice(last));
      s.setAttribute("aria-label", text);  // screen readers get the final number, not the count
      return { s, bits };
    });
    const paint = t => {
      const e = 1 - Math.pow(1 - t, 3);
      for (const { s, bits } of parts) s.textContent = bits.map(b => typeof b === "string" ? b : (b.to * e).toFixed(b.places)).join("");
    };
    paint(0);
    const io = new IntersectionObserver(es => {
      if (!es.some(e => e.isIntersecting)) return;
      io.disconnect();
      const start = performance.now();
      const step = now => { const t = Math.min((now - start) / DURATION, 1); paint(t); if (t < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
      setTimeout(() => paint(1), DURATION + 400);  // land on the real numbers even if frames are paused (a background tab)
    }, { threshold: 0.5 });
    addEventListener("beforeprint", () => { io.disconnect(); paint(1); });
    io.observe(stats);
  }
})();
