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

// Travel: pressing a place's drawing (Trip timeline, Places I'd like to go, Places I've been), or the small map button
// in its corner, swaps the drawing for a zoomed-in patch of the world map above, centred on that place's pin, which
// pulses. Pressing again, or the ×, brings the drawing back. The patch is a copy of the map, made on first press.
// Without JS there's just the drawing.
(() => {
  const map = document.querySelector(".travel-map svg");
  if (!map) return;
  const NS = "http://www.w3.org/2000/svg";
  const [vx, vy, vw, vh] = map.getAttribute("viewBox").trim().split(/[\s,]+/).map(Number);
  const ICON = { map: "M12 21s-6-5.6-6-10.5a6 6 0 0 1 12 0C18 15.4 12 21 12 21z M12 12.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z", close: "M6 6l12 12M18 6 6 18" };
  const SHRINK = 0.6;  // pins are sized for the whole world; zoomed in they'd swamp the patch

  const buildPatch = (fig, name) => {
    const s = map.cloneNode(true);
    s.querySelectorAll("title, defs, mask").forEach(n => n.remove());  // the gradient, shadow and masks stay in the map, which the copy still points at
    s.querySelectorAll("[id]").forEach(n => n.removeAttribute("id"));
    s.removeAttribute("aria-labelledby");
    s.setAttribute("aria-label", `Map: where ${name} is`);
    s.setAttribute("class", "place-patch");
    for (const a of s.querySelectorAll("a")) {
      const here = a.getAttribute("href") === `#${fig.id}`;
      a.querySelectorAll(".pin").forEach(p => p.classList.add(here ? "pin-here" : "pin-other"));
      a.replaceWith(...a.childNodes);  // no links or tab stops inside the patch
    }
    s.querySelectorAll(".pin").forEach(p => { p.removeAttribute("style"); if (!p.classList.contains("pin-here")) p.classList.add("pin-other"); });
    s.querySelectorAll(".pin circle").forEach(c => c.setAttribute("r", (+c.getAttribute("r") * SHRINK).toFixed(1)));
    const dotEls = [...s.querySelectorAll(".pin-here .pin-dot")];
    const dots = dotEls.map(d => [+d.getAttribute("cx"), +d.getAttribute("cy"), +d.getAttribute("r")]);
    dotEls.forEach((d, i) => {  // every pin here breathes, been pins included
      const g = d.parentNode, [cx, cy, r] = dots[i];
      if (g.querySelector(".pin-pulse")) return;
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("class", "pin-pulse"); c.setAttribute("cx", cx); c.setAttribute("cy", cy); c.setAttribute("r", r);
      g.insertBefore(c, d);
    });
    // a 3:2 window around this place's pins, kept inside the map
    const xs = dots.map(d => d[0]), ys = dots.map(d => d[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    let w = Math.max(230, x1 - x0 + 140), h = w * 2 / 3;
    if (h < y1 - y0 + 100) { h = y1 - y0 + 100; w = h * 1.5; }
    const x = Math.min(Math.max((x0 + x1) / 2 - w / 2, vx), vx + vw - w), y = Math.min(Math.max((y0 + y1) / 2 - h / 2, vy), vy + vh - h);
    s.setAttribute("viewBox", `${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
    s.setAttribute("preserveAspectRatio", "xMidYMid slice");
    // the place's name beside its first pin, on whichever side has room
    const [cx, cy, r] = dots[0], right = cx < x + w * 0.62, size = w * 0.045;
    const t = document.createElementNS(NS, "text");
    t.setAttribute("class", "place-patch-label");
    t.setAttribute("x", (cx + (right ? 1 : -1) * (r + size * 0.6)).toFixed(1));
    t.setAttribute("y", (cy + size * 0.35).toFixed(1));
    t.setAttribute("font-size", size.toFixed(1));
    t.setAttribute("stroke-width", (size * 0.28).toFixed(1));
    t.setAttribute("text-anchor", right ? "start" : "end");
    const cut = name.lastIndexOf(",");
    t.textContent = cut > 0 && name.length - cut > 4 ? name.slice(0, cut) : name;  // "Machu Picchu, Peru" → "Machu Picchu"; "Washington, DC" stays whole
    s.appendChild(t);
    return s;
  };

  for (const fig of document.querySelectorAll('figure.photo[id^="place-"]')) {
    const img = fig.querySelector(":scope > img");
    if (!img || !map.querySelector(`a[href="#${fig.id}"]`)) continue;
    const name = fig.querySelector("figcaption strong")?.textContent.trim() || "this place";
    const frame = document.createElement("div");
    frame.className = "place-frame";
    img.before(frame);
    frame.append(img);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "place-map-btn";
    btn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON.map}"/></svg>`;
    frame.append(btn);
    const path = btn.querySelector("path");
    let patch = null;
    const set = open => {
      if (open && !patch) frame.append(patch = buildPatch(fig, name));
      frame.classList.toggle("map-open", open);
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? `Back to the drawing of ${name}` : `Show ${name} on the map`);
      btn.title = open ? "Back to the drawing" : "Show on the map";
      path.setAttribute("d", open ? ICON.close : ICON.map);
    };
    set(false);
    frame.addEventListener("click", () => set(!frame.classList.contains("map-open")));
    btn.addEventListener("keydown", e => { if (e.key === "Escape") set(false); });
  }
})();

// Travel: each name in the Been list under the map is a button; pressing it brings the map into view and makes
// that place's pin pulse for a few seconds. Without JS the names are plain text.
(() => {
  const map = document.querySelector(".travel-map svg");
  const list = document.querySelector(".map-been-list");
  if (!map || !list) return;
  const NS = "http://www.w3.org/2000/svg";
  const pins = new Map([...map.querySelectorAll(".pin-been")].map(g => [g.querySelector("title")?.textContent.replace(/: been$/, ""), g]));
  let active = null, timer = 0;
  const clear = () => {
    clearTimeout(timer);
    if (!active) return;
    active.g.classList.remove("pin-lit");
    active.ring.remove();
    active.btn.setAttribute("aria-pressed", "false");
    active = null;
  };
  for (const li of list.querySelectorAll("li")) {
    const name = li.textContent.trim(), g = pins.get(name);
    if (!g) continue;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "been-name";
    btn.textContent = name;
    btn.setAttribute("aria-pressed", "false");
    btn.title = "Show on the map";
    li.replaceChildren(btn);
    btn.addEventListener("click", () => {
      const again = active?.btn === btn;
      clear();
      if (again) return;
      const dot = g.querySelector(".pin-dot");
      const ring = document.createElementNS(NS, "circle");
      ring.setAttribute("class", "pin-pulse");
      for (const a of ["cx", "cy", "r"]) ring.setAttribute(a, dot.getAttribute(a));
      g.insertBefore(ring, dot);
      g.classList.add("pin-lit");
      const top = g.closest("a") || g;
      top.parentNode.appendChild(top);  // on top of its neighbours
      btn.setAttribute("aria-pressed", "true");
      active = { g, ring, btn };
      const box = map.getBoundingClientRect();
      if (box.top < 0 || box.bottom > innerHeight) map.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
      timer = setTimeout(clear, 6000);
    });
  }
})();
