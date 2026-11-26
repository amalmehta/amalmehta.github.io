// Case studies, Related work: a thin line of years above the section, with a dot for each paper in its reference
// list (by first author, on its year; papers from the same year stack) and "this work" on the project's own year.
// The first time it comes into view the dots drop in, oldest first, and this work lands last. Built from the page's
// own reference list, so it follows any edit to it. Decoration only (the list below says the same in words);
// with reduced motion it simply shows.
(() => {
  const part = document.getElementById("related-work");
  const refs = part ? [...part.querySelectorAll("ol.refs > li")] : [];
  if (refs.length < 2) return;
  const NS = "http://www.w3.org/2000/svg";
  const el = (name, attrs, parent) => { const n = document.createElementNS(NS, name); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); if (parent) parent.appendChild(n); return n; };
  const papers = refs.map(li => {
    const text = li.textContent;
    const years = text.match(/\b(19|20)\d{2}\b/g);
    return { name: text.split(",")[0].trim(), year: years ? +years[years.length - 1] : null };
  }).filter(p => p.year && p.name);
  const own = +(document.querySelector(".page-head .card-when")?.textContent.match(/\b20\d{2}\b/) || [new Date().getFullYear()])[0];
  papers.sort((a, b) => a.year - b.year);
  const y0 = Math.min(...papers.map(p => p.year)) - 1, y1 = own + 1;
  const W = 640, H = 112, L = 20, R = W - 20, base = 86;
  const x = y => L + (y - y0) / (y1 - y0) * (R - L);
  const svg = el("svg", { class: "rw-line", viewBox: `0 0 ${W} ${H}`, "aria-hidden": "true" });
  el("path", { class: "rw-axis", d: `M${L},${base} H${R}` }, svg);
  for (let y = y0 + 1; y < y1; y++) {
    el("path", { class: "rw-tick", d: `M${x(y).toFixed(1)},${base - 3} V${base + 3}` }, svg);
    if ((y - y0) % 2 === 1 || y === own) el("text", { class: "rw-year", x: x(y).toFixed(1), y: base + 17, "text-anchor": "middle" }, svg).textContent = y;
  }
  const stack = {};
  const dots = [];
  papers.forEach(p => {
    const k = (stack[p.year] = (stack[p.year] || 0) + 1) - 1;
    const cx = x(p.year), cy = base - 10 - k * 13;
    const g = el("g", { class: "rw-dot" }, svg);
    el("circle", { cx: cx.toFixed(1), cy, r: 4.5 }, g);
    el("text", { class: "rw-name", x: (cx + 6).toFixed(1), y: cy - 6, transform: `rotate(-32 ${(cx + 6).toFixed(1)} ${cy - 6})` }, g).textContent = p.name;
    dots.push(g);
  });
  const me = el("g", { class: "rw-dot rw-me" }, svg);
  el("circle", { cx: x(own).toFixed(1), cy: base - 10, r: 6 }, me);
  el("text", { class: "rw-name", x: (x(own) + 8).toFixed(1), y: base - 17, transform: `rotate(-32 ${(x(own) + 8).toFixed(1)} ${base - 17})` }, me).textContent = "this work";
  dots.push(me);
  part.querySelector(".section-title").after(svg);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) { svg.classList.add("rw-shown"); return; }
  dots.forEach((g, k) => g.style.setProperty("--k", k));
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); svg.classList.add("rw-play"); } }, { threshold: 0.6 });
  io.observe(svg);
})();
