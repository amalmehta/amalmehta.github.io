// Home, two quiet touches.
//   Open to: a small light beside each line switches on, one after another, as the list scrolls into view,
//     then glows softly.
//   Outside work: "Kilimanjaro" and "past 130 feet" carry a small gauge that appears while you hover (or tap)
//     them: a climb profile rising to the 5,895 m summit, and a depth gauge sinking past 40 m.
// Decoration only (hidden from screen readers). With reduced motion the lights are simply on and the gauges
// appear finished.
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const el = (name, attrs, parent) => { const n = document.createElementNS(NS, name); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); if (parent) parent.appendChild(n); return n; };

  // ------------------------------------------------ Open to: lights on, one by one
  const items = [...document.querySelectorAll("#open-to .inspo-item")];
  items.forEach((li, i) => {
    const light = document.createElement("span");
    light.className = "open-light";
    light.setAttribute("aria-hidden", "true");
    li.style.setProperty("--i", i);
    li.appendChild(light);
  });
  const list = document.querySelector("#open-to .inspo");
  if (list) {
    if (reduce || !("IntersectionObserver" in window)) list.classList.add("lights-on");
    else {
      const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); list.classList.add("lights-on"); } }, { threshold: 0.5 });
      io.observe(list);
    }
  }

  // ------------------------------------------------ Outside work: a climb and a dive
  const para = [...document.querySelectorAll("#outside p")].find(p => p.textContent.includes("Kilimanjaro"));
  if (!para) return;
  const wrapText = (phrase, kind) => {
    const walker = document.createTreeWalker(para, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const at = n.data.indexOf(phrase);
      if (at < 0) continue;
      const word = n.splitText(at); word.splitText(phrase.length);
      const span = document.createElement("span");
      span.className = `gauge-word gauge-${kind}`;
      word.replaceWith(span); span.appendChild(word);
      return span;
    }
    return null;
  };
  const gauge = (span, build) => {
    if (!span) return;
    const pop = document.createElement("span");
    pop.className = "gauge-pop";
    pop.setAttribute("aria-hidden", "true");
    const svg = el("svg", { viewBox: "0 0 80 48" }, pop);
    build(svg);
    span.appendChild(pop);
    const show = on => { span.classList.toggle("gauge-on", on); };
    span.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") show(true); });
    span.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") show(false); });
    span.addEventListener("click", () => show(!span.classList.contains("gauge-on")));
  };
  gauge(wrapText("Kilimanjaro", "climb"), svg => {
    el("path", { class: "gauge-ground", d: "M2,44 H78" }, svg);
    el("path", { class: "gauge-line", d: "M4,43 L16,39 L24,40 L34,31 L42,27 L48,28 L56,18 L62,12 L66,9 L70,5", pathLength: 1 }, svg);
    el("circle", { class: "gauge-dot", cx: 70, cy: 5, r: 2.2 }, svg);
    const t = el("text", { x: 4, y: 12, class: "gauge-text" }, svg); t.textContent = "5,895 m";
  });
  gauge(wrapText("past 130 feet", "dive"), svg => {
    el("path", { class: "gauge-ground", d: "M2,6 H78" }, svg);
    for (const [y, label] of [[16, "10 m"], [28, "25 m"], [40, "40 m"]]) {
      el("path", { class: "gauge-tick", d: `M46,${y} H52` }, svg);
      const t = el("text", { x: 55, y: y + 3, class: "gauge-text small" }, svg); t.textContent = label;
    }
    el("path", { class: "gauge-line", d: "M36,6 V43", pathLength: 1 }, svg);
    el("circle", { class: "gauge-dot sink", cx: 36, cy: 43, r: 2.2 }, svg);
    for (const [x, y, r] of [[30, 30, 1.2], [27, 20, 0.9], [31, 12, 0.7]]) el("circle", { class: "gauge-bubble", cx: x, cy: y, r }, svg);
  });
})();
