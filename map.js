// Travel: the first time the map scrolls into view, its pins drop in from west to east while the legend
// counts climb from 0, then the routes draw themselves. Without JS, or with reduced motion, the map is simply shown.
(() => {
  const map = document.querySelector(".travel-map");
  if (!map || !("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const pins = [...map.querySelectorAll(".pin")];
  const xs = pins.map(p => +p.querySelector(".pin-dot").getAttribute("cx"));
  const lo = Math.min(...xs), hi = Math.max(...xs), SWEEP = 1100;  // milliseconds from the first pin to the last
  pins.forEach((p, i) => { p.style.animationDelay = `${Math.round((xs[i] - lo) / (hi - lo || 1) * SWEEP)}ms`; });
  for (const r of map.querySelectorAll(".map-route-reveal")) r.style.animationDelay = `${SWEEP + 300}ms`;
  const counts = [...map.querySelectorAll(".key-count")].map(el => [el, +el.textContent]);
  for (const [el] of counts) el.textContent = "0";
  map.classList.add("pins-wait");
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    map.classList.replace("pins-wait", "pins-in");
    // the legend counts climb from 0 as the pins land
    const t0 = performance.now();
    const tick = now => {
      const f = Math.min(1, (now - t0) / SWEEP), ease = 1 - (1 - f) ** 3;
      for (const [el, n] of counts) el.textContent = Math.round(n * ease);
      if (f < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, { threshold: 0.3 });
  io.observe(map);
})();
