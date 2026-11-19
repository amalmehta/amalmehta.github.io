// Ink: three hand-drawn touches on the profile, added only with JavaScript so the plain page stays as written.
//  1. Margin notes: a Featured card with data-ink-note="phrase|note" gets the phrase circled in ink and a
//     handwritten note in its corner, joined by an arrow; they ink themselves in when the card comes into view.
//  2. Result drawn live: a card with data-ink-live="a0,a1,b0,b1" gets a small chart whose two lines draw
//     themselves (visible tests passed a0→a1%, actually correct b0→b1%) while the numbers count.
//  3. Ink thread: one pen line runs down the page's left margin, looping past each section title, and draws
//     itself as you scroll. Wide screens only; with reduced motion everything is simply shown, already drawn.
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const svg = (name, attrs = {}, parent) => {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const onView = (node, fn, threshold = 0.45) => {
    if (reduce || !("IntersectionObserver" in window)) return fn();
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); fn(); } }, { threshold });
    io.observe(node);
  };
  // A smooth curve through points (Catmull-Rom as cubic Béziers).
  const smooth = (p) => {
    let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c;
      d += ` C${(b[0] + (c[0] - a[0]) / 6).toFixed(1)},${(b[1] + (c[1] - a[1]) / 6).toFixed(1)} ${(c[0] - (e[0] - b[0]) / 6).toFixed(1)},${(c[1] - (e[1] - b[1]) / 6).toFixed(1)} ${c[0].toFixed(1)},${c[1].toFixed(1)}`;
    }
    return d;
  };

  // 1. Margin notes
  for (const card of document.querySelectorAll("[data-ink-note]")) {
    const [phrase, note] = card.dataset.inkNote.split("|");
    const hook = card.querySelector("h3 + p");
    const text = card.querySelector(".project-text");
    if (!hook || !text) continue;
    const walker = document.createTreeWalker(hook, NodeFilter.SHOW_TEXT);
    let node, mark;
    while ((node = walker.nextNode())) {
      const i = node.data.indexOf(phrase);
      if (i < 0) continue;
      const r = document.createRange();
      r.setStart(node, i); r.setEnd(node, i + phrase.length);
      mark = document.createElement("span");
      mark.className = "ink-mark";
      r.surroundContents(mark);
      break;
    }
    if (!mark) continue;
    const ring = svg("svg", { class: "ink-ring", viewBox: "0 0 100 40", preserveAspectRatio: "none", "aria-hidden": "true" }, mark);
    svg("path", { d: "M62,5 C26,0 3,9 4,21 C5,35 64,40 92,27 C104,18 84,3 44,7", pathLength: "1" }, ring);
    const tag = document.createElement("span");
    tag.className = "ink-note";
    tag.setAttribute("aria-hidden", "true");
    tag.textContent = note;
    text.appendChild(tag);
    const arrow = svg("svg", { class: "ink-arrow", "aria-hidden": "true" }, text);
    const line = svg("path", { pathLength: "1" }, arrow);
    const head = svg("path", { class: "ink-head", pathLength: "1" }, arrow);
    const place = () => {
      const box = text.getBoundingClientRect(), m = mark.getBoundingClientRect();
      arrow.setAttribute("width", box.width); arrow.setAttribute("height", box.height);
      arrow.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
      // A mark on the right of its line gets the note in the corner above it; one on the left gets the note
      // in the space under the paragraph, so the arrow never has to cross a line of text.
      const right = m.left - box.left > box.width * 0.45;
      tag.classList.toggle("below", !right);
      hook.style.marginBottom = right ? "" : "2.4rem";  // room for the note under the paragraph
      if (!right) {
        const h = hook.getBoundingClientRect();
        tag.style.top = h.bottom - box.top + 4 + "px";
        tag.style.left = Math.max(0, m.left - box.left + m.width + 10) + "px";
        tag.style.right = "auto";
      } else { tag.style.top = tag.style.left = tag.style.right = ""; }
      const t = tag.getBoundingClientRect();
      let sx, sy, ex, ey, cx, cy;
      if (right) { sx = t.left - box.left - 6; sy = t.bottom - box.top - 2; ex = m.right - box.left + 4; ey = m.top - box.top + 2; cx = Math.max(ex, sx) + 26; cy = (sy + ey) / 2; }
      else { sx = t.left - box.left - 4; sy = t.top - box.top + 8; ex = m.left - box.left + m.width * 0.7; ey = m.bottom - box.top + 4; cx = sx - 6; cy = ey + 2; }
      line.setAttribute("d", `M${sx},${sy} Q${cx},${cy} ${ex},${ey}`);
      // A small two-stroke arrowhead along the curve's last direction
      const ang = Math.atan2(ey - cy, ex - cx);
      const h = 9, a1 = ang + Math.PI * 0.82, a2 = ang - Math.PI * 0.82;
      head.setAttribute("d", `M${ex + h * Math.cos(a1)},${ey + h * Math.sin(a1)} L${ex},${ey} L${ex + h * Math.cos(a2)},${ey + h * Math.sin(a2)}`);
    };
    place();
    addEventListener("resize", place);
    document.fonts?.ready.then(place);
    onView(card, () => card.classList.add("inked"));
  }

  // 2. Result drawn live
  for (const card of document.querySelectorAll("[data-ink-live]")) {
    const [a0, a1, b0, b1] = card.dataset.inkLive.split(",").map(Number);
    const hook = card.querySelector("h3 + p");
    if (!hook) continue;
    const fig = document.createElement("figure");
    fig.className = "ink-live";
    fig.setAttribute("aria-hidden", "true");  // the hook already says it in words
    const W = 300, H = 92, y = (v) => 8 + (H - 16) * (1 - v / 70);
    const chart = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "ink-live-chart" }, fig);
    svg("line", { x1: 8, y1: H - 4, x2: W - 8, y2: H - 4, class: "ink-axis" }, chart);
    const pass = svg("path", { d: `M10,${y(a0)} C110,${y(a0)} 170,${y(a1)} ${W - 12},${y(a1)}`, class: "ink-pass", pathLength: "1" }, chart);
    const truth = svg("path", { d: `M10,${y(b0)} C110,${y(b0)} 170,${y(b1)} ${W - 12},${y(b1)}`, class: "ink-true", pathLength: "1" }, chart);
    const cap = document.createElement("figcaption");
    cap.innerHTML = `<span class="ink-pass-key"><b>${a1}%</b> pass the visible tests</span><span class="ink-true-key"><b>${b1}%</b> are actually correct</span>`;
    fig.appendChild(cap);
    hook.after(fig);
    const [pb, tb] = cap.querySelectorAll("b");
    onView(fig, () => {
      fig.classList.add("drawn");
      if (reduce) return;
      const t0 = performance.now(), dur = 1600;
      const tick = (now) => {
        const k = Math.min(1, (now - t0) / dur), e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
        pb.textContent = Math.round(a0 + (a1 - a0) * e) + "%";
        tb.textContent = Math.round(b0 + (b1 - b0) * e) + "%";
        if (k < 1) requestAnimationFrame(tick);
      };
      pb.textContent = a0 + "%"; tb.textContent = b0 + "%";
      requestAnimationFrame(tick);
    }, 0.6);
    void pass; void truth;
  }

  // 3. Ink thread
  const main = document.querySelector("main");
  if (!main) return;
  const layer = svg("svg", { class: "ink-thread", "aria-hidden": "true" });
  const path = svg("path", { pathLength: "1" }, layer);
  document.body.appendChild(layer);
  let top = 0, height = 1;
  const build = () => {
    const titles = [...main.querySelectorAll(".section-title")].filter((t) => t.offsetParent && !t.closest("[hidden]"));
    const first = titles[0]?.getBoundingClientRect();
    if (!first || first.left < 90) { layer.style.display = "none"; return; }
    layer.style.display = "";
    const docTop = scrollY, x = first.left - 46;
    const pts = [];
    titles.forEach((t, i) => {
      const r = t.getBoundingClientRect(), yy = r.top + docTop + r.height / 2;
      if (i > 0) {  // a gentle wander between titles
        const prev = pts[pts.length - 1][1], gap = yy - 40 - prev;
        for (let k = 1; k < 4; k++) pts.push([x + (k % 2 ? 9 : -7), prev + gap * k / 4]);
      }
      pts.push([x, yy - 40], [x + 15, yy - 6], [x + 2, yy + 13], [x - 13, yy], [x + 1, yy - 12], [x + 5, yy + 30]);
    });
    top = pts[0][1] - 10;
    height = pts[pts.length - 1][1] - top + 10;
    layer.style.top = top + "px";
    layer.style.height = height + "px";
    layer.setAttribute("viewBox", `0 ${top} ${innerWidth} ${height}`);
    layer.setAttribute("width", innerWidth);
    layer.setAttribute("height", height);
    path.setAttribute("d", smooth(pts));
    draw();
  };
  const draw = () => {
    if (reduce) { path.style.strokeDashoffset = "0"; return; }
    const k = Math.min(1, Math.max(0, (scrollY + innerHeight * 0.7 - top) / height));
    path.style.strokeDashoffset = String(1 - k);
  };
  let pending = 0;
  addEventListener("scroll", () => { if (!pending) pending = requestAnimationFrame(() => { pending = 0; draw(); }); }, { passive: true });
  addEventListener("resize", () => { clearTimeout(build.t); build.t = setTimeout(build, 150); });
  addEventListener("load", build);
  document.fonts?.ready.then(build);
  build();
})();
