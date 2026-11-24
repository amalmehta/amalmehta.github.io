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

// Travel map: pointing at a pin (or focusing it) floats a small card above it with that place's drawing and
// name, so you can see where it goes before clicking. Mouse, pen and keyboard; touch just follows the link.
(() => {
  const map = document.querySelector(".travel-map");
  if (!map) return;
  const card = document.createElement("div");
  card.className = "pin-preview";
  card.setAttribute("aria-hidden", "true");
  card.innerHTML = '<img alt="" width="1200" height="800"><span></span>';
  map.style.position = "relative";
  map.appendChild(card);
  const img = card.querySelector("img"), label = card.querySelector("span");
  const show = a => {
    const place = document.getElementById((a.getAttribute("href") || "").slice(1));
    const src = place?.querySelector("img")?.getAttribute("src");
    if (!src) return;
    if (img.getAttribute("src") !== src) img.setAttribute("src", src);
    label.textContent = place.querySelector("figcaption strong")?.textContent || "";
    const dot = (a.querySelector(".pin-dot") || a).getBoundingClientRect(), box = map.getBoundingClientRect();
    const x = dot.left + dot.width / 2 - box.left, y = dot.top - box.top;
    card.style.left = `${Math.min(Math.max(x, 90), box.width - 90).toFixed(0)}px`;
    card.style.top = `${y.toFixed(0)}px`;
    card.classList.toggle("below", y < 150);  // near the top edge: show it under the pin instead
    card.classList.add("shown");
  };
  const hide = () => card.classList.remove("shown");
  for (const a of map.querySelectorAll('svg a[href^="#place-"]')) {
    a.addEventListener("pointerenter", e => { if (e.pointerType !== "touch") show(a); });
    a.addEventListener("pointerleave", hide);
    a.addEventListener("focus", () => show(a));
    a.addEventListener("blur", hide);
  }
})();
