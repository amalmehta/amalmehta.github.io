// Interests, Papers that shaped me: a thin line of years above the list, 2016 to 2024, with a dot for each
// paper on its year (papers from the same year stack). The dots drop onto the line, one after another, the
// first time it scrolls into view; pointing at a paper lights its dot, and pointing at a dot lights its paper.
// Added only with JavaScript, from the years already in the list; without it the list reads the same.
(() => {
  const list = document.querySelector("#papers .inspo");
  if (!list) return;
  const items = [...list.querySelectorAll(":scope > li")];
  const papers = items.map(li => ({ li, year: +((li.textContent.match(/\b(19|20)\d\d\b/) || [])[0]), title: li.querySelector("strong")?.textContent.trim() || "" }))
    .filter(p => p.year);
  if (papers.length < 2) return;
  const first = Math.min(...papers.map(p => p.year)), last = Math.max(...papers.map(p => p.year)), span = Math.max(last - first, 1);
  const line = document.createElement("div");
  line.className = "paper-line";
  line.setAttribute("aria-hidden", "true");
  for (let y = first; y <= last; y++) {
    const tick = document.createElement("span");
    tick.className = "paper-year";
    tick.textContent = y;
    tick.style.setProperty("--x", ((y - first) / span).toFixed(4));
    line.appendChild(tick);
  }
  const stacks = {};
  [...papers].sort((a, b) => a.year - b.year).forEach((p, k) => {
    const dot = document.createElement("span");
    dot.className = "paper-dot";
    dot.title = `${p.title}, ${p.year}`;
    dot.style.setProperty("--x", ((p.year - first) / span).toFixed(4));
    dot.style.setProperty("--stack", stacks[p.year] = (stacks[p.year] ?? -1) + 1);
    dot.style.setProperty("--d", `${(k * 0.09).toFixed(2)}s`);
    line.appendChild(dot);
    const on = () => { dot.classList.add("lit"); p.li.classList.add("paper-lit"); };
    const off = () => { dot.classList.remove("lit"); p.li.classList.remove("paper-lit"); };
    for (const t of [p.li, dot]) { t.addEventListener("pointerenter", on); t.addEventListener("pointerleave", off); }
    p.li.addEventListener("focusin", on); p.li.addEventListener("focusout", off);
  });
  list.before(line);
  const drop = () => line.classList.add("dropped");
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) { line.classList.add("still"); return; }
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); drop(); } }, { threshold: 1 });
  io.observe(line);
})();
