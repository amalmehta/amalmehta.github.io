// Every page's top menu: the warm underline under the page you're on glides to whichever link you point at,
// and slides back when the pointer leaves the menu. Without JS the underline simply sits under the current page;
// with reduced motion it moves without gliding. Below it: the back-to-top ring for long pages, the glow on
// whatever a link lands you on, and the bike that rides along the footer's ridge.
(() => {
  const links = document.querySelector(".nav-links");
  if (!links || !matchMedia("(hover: hover)").matches) return;
  const glide = document.createElement("span");
  glide.className = "nav-glide";
  glide.setAttribute("aria-hidden", "true");
  links.appendChild(glide);
  links.classList.add("has-glide");
  const current = () => links.querySelector("a[aria-current]");
  const to = a => {
    const r = a?.getBoundingClientRect();
    if (!r || !r.width) { glide.style.opacity = "0"; return; }
    const box = links.getBoundingClientRect();
    glide.style.opacity = "1";
    glide.style.transform = `translate(${(r.left - box.left).toFixed(1)}px, ${(r.bottom - box.top).toFixed(1)}px)`;
    glide.style.width = `${r.width.toFixed(1)}px`;
  };
  for (const a of links.querySelectorAll("a")) a.addEventListener("pointerenter", () => to(a));
  links.addEventListener("pointerleave", () => to(current()));
  addEventListener("resize", () => to(current()));
  document.fonts?.ready.then(() => to(current()));
  to(current());
  requestAnimationFrame(() => links.classList.add("glide-ready"));  // only glide after the first placement
})();

// Long pages: once you're well down, a small round button shows in the corner. A warm ring around it fills
// as you read, and a tap takes you back to the top (gliding, unless reduced motion is on).
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "to-top";
  btn.setAttribute("aria-label", "Back to top");
  btn.innerHTML = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle class="to-top-track" cx="20" cy="20" r="17"/>'
    + '<circle class="to-top-ring" cx="20" cy="20" r="17" pathLength="1"/><path d="M20 26V14M14.5 19.5 20 14l5.5 5.5"/></svg>';
  document.body.appendChild(btn);
  btn.addEventListener("click", () => {
    scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    document.querySelector(".skip")?.focus({ preventScroll: true });
  });
  let queued = false;
  const update = () => {
    queued = false;
    const end = document.documentElement.scrollHeight - innerHeight;
    const long = end > innerHeight * 1.5;
    btn.classList.toggle("shown", long && scrollY > innerHeight * 1.2);
    btn.style.setProperty("--read", end > 0 ? Math.min(scrollY / end, 1).toFixed(4) : "0");
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);
  update();
})();

// Landing on a spot: when a link takes you to a section or card on a page (or a page opens at one), the section's
// title, or the card itself, glows warm for a moment so you can see where you are. Reduced motion skips the glow.
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const land = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id || id === "top") return;
    const el = document.getElementById(id);
    if (!el) return;
    const title = el.matches("section") ? el.querySelector(":scope > .section-title, :scope > header .section-title") : null;
    const target = title || el;
    target.classList.remove("arrived", "flash");
    void target.offsetWidth;  // restart the animation if it's the same spot again
    target.classList.add(title ? "arrived" : "flash");
  };
  addEventListener("hashchange", land);
  if (location.hash) setTimeout(land, 350);  // after the page has scrolled there
})();

// The footer's top edge is the five-pass ridge from the Seattle-to-DC ride. The first time you reach the bottom
// of a page, the little bike signed on every drawing rides along it once, climbing and descending each pass.
(() => {
  const footer = document.querySelector(".footer");
  if (!footer || !("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const NS = "http://www.w3.org/2000/svg";
  const bike = document.createElementNS(NS, "svg");
  bike.setAttribute("class", "footer-bike");
  bike.setAttribute("viewBox", "0 0 72 44");
  bike.setAttribute("aria-hidden", "true");
  bike.innerHTML = '<g fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">'
    + '<circle cx="14" cy="30" r="12"/><circle cx="58" cy="30" r="12"/><path d="M14 30 L28 30 L22 13 M28 30 L46 13 L22 13 M46 13 L58 30 M28 30 L36 13"/>'
    + '<path d="M19 8 H27 M22 13 L21 8"/><path d="M46 13 L47 7 Q52 6 53 10 Q53 13 50 13"/><path d="M4 15 H20 M5 15 V25 H18 V15"/><path d="M51 19 H62 V27 H52 Z"/></g>';
  let ridge = null;
  const go = () => {
    footer.appendChild(bike);
    const w = footer.clientWidth - 32, H = 20, DURATION = 6500, start = performance.now();
    const at = x => {  // the ridge's height at x (0..1000), by straight lines between its points
      let i = ridge.findIndex(p => p[0] >= x);
      if (i <= 0) return ridge[Math.max(i, 0)][1];
      const [x0, y0] = ridge[i - 1], [x1, y1] = ridge[i];
      return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
    };
    const step = now => {
      const t = Math.min((now - start) / DURATION, 1);
      const x = 1000 * (0.5 - 0.5 * Math.cos(Math.PI * t));  // ease in and out
      const px = 16 + (x / 1000) * w, py = (at(x) / 24) * H;
      const slope = ((at(Math.min(x + 6, 1000)) - at(Math.max(x - 6, 0))) / 24 * H) / (12 / 1000 * w);
      bike.style.transform = `translate(${(px - 14).toFixed(1)}px, ${(py - 19).toFixed(1)}px) rotate(${(Math.atan(slope) * 180 / Math.PI).toFixed(1)}deg)`;
      bike.style.opacity = t < 0.04 ? (t / 0.04).toFixed(2) : t > 0.96 ? ((1 - t) / 0.04).toFixed(2) : "1";
      if (t < 1) requestAnimationFrame(step); else bike.remove();
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver(es => {
    if (!es.some(e => e.isIntersecting) || !ridge) return;
    io.disconnect();
    go();
  }, { threshold: 0.9 });
  fetch(new URL("images/ridge.svg", document.querySelector('link[rel="stylesheet"]')?.href || location.href))
    .then(r => r.text())
    .then(text => {
      const d = (text.match(/ d="([^"]+)"/) || [])[1] || "";
      const pts = [...d.matchAll(/[ML]\s*([\d.]+)[ ,]([\d.]+)/g)].map(m => [+m[1], +m[2]]);
      const end = pts.findIndex((p, i) => i > 0 && p[0] < pts[i - 1][0]);  // the top line only, not the way back
      ridge = end > 0 ? pts.slice(0, end) : pts;
      if (ridge.length > 1) io.observe(footer);
    })
    .catch(() => {});
})();

// Section titles: the brush stroke under each paints itself in as it scrolls into view. styles.css does this
// with scroll-driven animation where browsers support it; elsewhere (Safari, Firefox) this does the same.
(() => {
  if (CSS.supports("animation-timeline: view()") || matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver(es => {
    for (const e of es) if (e.isIntersecting) { e.target.classList.add("brushed"); io.unobserve(e.target); }
  }, { rootMargin: "0px 0px -15% 0px" });
  for (const t of document.querySelectorAll(".section-title")) {
    const r = t.getBoundingClientRect();
    if (r.top < innerHeight * 0.85 && r.bottom > 0) continue;  // already on screen: leave it painted
    t.classList.add("brush-wait");
    io.observe(t);
  }
})();

// Footer: end credits. When you reach the bottom, the page's section titles roll up through the credits like
// a film's end credits and the roll settles on "Written and directed by Amal Mehta", once per page view.
// The rolling lines are decoration (hidden from screen readers); the credit itself is the same element as ever.
(() => {
  const credits = document.querySelector(".footer .credits");
  if (!credits || matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
  const titles = [...new Set([...document.querySelectorAll("main .section-title, main .page-head h1")]
    .filter(t => t.offsetParent !== null).map(t => t.textContent.replace(/#\s*$/, "").trim()).filter(Boolean))].slice(0, 9);
  if (titles.length < 2) return;
  const win = document.createElement("div"), track = document.createElement("div");
  win.className = "roll-window"; track.className = "roll-track";
  credits.replaceWith(win); win.appendChild(track);
  const head = document.createElement("p");
  head.className = "roll-line roll-head"; head.textContent = "Featuring";
  head.setAttribute("aria-hidden", "true");
  track.appendChild(head);
  for (const t of titles) {
    const line = document.createElement("p");
    line.className = "roll-line"; line.textContent = t;
    line.setAttribute("aria-hidden", "true");
    track.appendChild(line);
  }
  track.appendChild(credits);
  const place = () => {
    const h = credits.offsetHeight, w = Math.max(h * 3, 84);  // a window three credits tall; the credit ends in its middle
    win.style.setProperty("--win", `${w}px`);
    win.style.setProperty("--travel", `${track.offsetHeight - h - (w - h) / 2}px`);
    win.style.setProperty("--roll", `${(1.2 + titles.length * 0.45).toFixed(2)}s`);
  };
  place();
  addEventListener("resize", place);
  const io = new IntersectionObserver(es => {
    if (!es.some(e => e.isIntersecting)) return;
    io.disconnect();
    place();
    win.classList.add("rolled");
    track.addEventListener("transitionend", () => win.classList.add("done"), { once: true });  // the roll fades away
  }, { threshold: 1 });
  io.observe(win);
})();

// Header: once you scroll past the top it settles, a little more solid with a soft shadow and the name a touch
// smaller, and relaxes back when you return to the top. Nothing moves on the page; only the bar changes.
(() => {
  const header = document.querySelector(".site-header");
  if (!header) return;
  let queued = false;
  const update = () => { queued = false; header.classList.toggle("settled", scrollY > 24); };
  addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  update();
})();

// Every page, the header: a tiny sun or moon rides the header's bottom line, sitting where it is in the sky for
// the visitor's own clock (sunrise at the left edge around 6 am, sunset at the right around 6 pm, then the moon
// crosses overnight), with a soft glow that warms at dawn and dusk and cools at night. It moves on its own a
// little each minute. Decoration only.
(() => {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const sky = document.createElement("span");
  sky.className = "sky";
  sky.setAttribute("aria-hidden", "true");
  sky.innerHTML = '<span class="sky-glow"></span><span class="sky-body"></span>';
  header.appendChild(sky);
  const place = () => {
    const d = new Date(), h = d.getHours() + d.getMinutes() / 60;
    const day = h >= 6 && h < 18;
    const t = day ? (h - 6) / 12 : ((h + 6) % 24) / 12;   // 0 → 1 across the sky
    const phase = h >= 5 && h < 7.5 ? "dawn" : h >= 7.5 && h < 17 ? "day" : h >= 17 && h < 19.5 ? "dusk" : "night";
    sky.style.setProperty("--sky-x", `${(3 + t * 94).toFixed(2)}%`);
    sky.style.setProperty("--sky-lift", (Math.sin(Math.PI * t)).toFixed(3));
    sky.dataset.phase = phase;
    sky.classList.toggle("moon", !day);
    // The tab icon follows the same sky: a sun by day, a low orange sun at dawn and dusk, the moon at night.
    // (Browsers that only show the PNG icon keep the plain monogram.)
    if (icon) {
      const want = `${root}favicon-${!day ? "night" : phase === "day" ? "day" : "dusk"}.svg`;
      if (icon.getAttribute("href") !== want) icon.setAttribute("href", want);
    }
  };
  const icon = document.querySelector('link[rel="icon"][type="image/svg+xml"]');
  const root = icon ? icon.getAttribute("href").replace(/favicon[^/]*\.svg$/, "") : "";
  place();
  setInterval(place, 60000);
})();

// Every page's footer: "Written and directed by · Amal Mehta" rises into place like a film's end credits, the
// first time the footer comes into view. Without JavaScript, or with reduced motion, it's simply there.
(() => {
  const credits = document.querySelector(".footer .credits");
  if (!credits || matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
  credits.classList.add("roll-wait");
  const io = new IntersectionObserver(es => {
    if (!es.some(e => e.isIntersecting)) return;
    io.disconnect();
    credits.classList.replace("roll-wait", "roll-play");
  }, { threshold: 1 });
  io.observe(credits);
})();
