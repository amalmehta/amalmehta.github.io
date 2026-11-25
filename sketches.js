// Profile: two small working sketches that play when they scroll into view, and again on hover.
//   Publications, the melanoma paper: a slice of tissue, pink with purple nuclei, and the tumour's outline
//     tracing itself around the dense cells, then filling in, like the model drawing its mask.
//   More projects, Drone Autonomy: a floor plan with a wall in the way; the planned path draws itself from
//     start to goal around the wall's end, and a tiny quadrotor flies it.
// Decoration only (hidden from screen readers), added with JavaScript; with reduced motion each shows its
// finished state.
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const el = (name, attrs, parent) => {
    const n = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (parent) parent.appendChild(n);
    return n;
  };
  let seed = 11;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // Play a sketch when it's fully on screen, and again on hover; `go` restarts its animations
  const playOnView = (svg, go) => {
    const run = () => { svg.classList.remove("played"); void svg.getBoundingClientRect(); svg.classList.add("played"); go(); };
    if (reduce || !("IntersectionObserver" in window)) { svg.classList.add("played", "still"); return; }
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); run(); } }, { threshold: 1 });
    io.observe(svg);
    svg.addEventListener("pointerenter", e => { if (e.pointerType === "mouse" && svg.classList.contains("played")) run(); });
  };

  // ---------------------------------------------------------------- the tissue slice and its mask
  const paper = document.querySelector("#spie-2023 > div");
  if (paper) {
    const svg = el("svg", { class: "sketch seg-sketch", viewBox: "0 0 100 80", "aria-hidden": "true" });
    el("path", { class: "seg-tissue", d: "M10,40 C8,22 24,8 46,9 C66,8 90,16 92,36 C94,56 80,72 56,72 C34,74 12,62 10,40Z" }, svg);
    for (let k = 0; k < 5; k++) el("path", { class: "seg-streak", d: `M${16 + k * 14},${20 + rand() * 10} q${8 + rand() * 6},${14 + rand() * 10} ${2 + rand() * 6},${30 + rand() * 10}` }, svg);
    const tumour = "M44,30 C52,22 68,24 72,34 C76,42 72,54 62,56 C54,58 50,52 42,52 C34,51 34,38 44,30Z";
    const inside = (x, y) => Math.hypot((x - 57) / 16, (y - 41) / 13) < 1;
    for (let k = 0; k < 120; k++) {
      const x = 12 + rand() * 78, y = 12 + rand() * 58;
      if (Math.hypot((x - 51) / 41, (y - 40) / 31) > 1) continue;  // keep to the slice
      const dense = inside(x, y);
      if (!dense && rand() < 0.45) continue;
      el("circle", { class: dense ? "seg-nucleus dense" : "seg-nucleus", cx: x.toFixed(1), cy: y.toFixed(1), r: (dense ? 1.5 + rand() * 0.9 : 0.9 + rand() * 0.7).toFixed(2) }, svg);
    }
    el("path", { class: "seg-fill", d: tumour }, svg);
    el("path", { class: "seg-outline", d: tumour, pathLength: 1 }, svg);
    paper.prepend(svg);
    paper.classList.add("has-sketch");
    playOnView(svg, () => {});
  }

  // ---------------------------------------------------------------- the drone and its planned path
  const drone = document.querySelector("#drone-autonomy");
  if (drone) {
    const svg = el("svg", { class: "sketch drone-sketch", viewBox: "0 0 160 64", "aria-hidden": "true" });
    el("rect", { class: "plan-room", x: 3, y: 3, width: 154, height: 58, rx: 3 }, svg);
    el("path", { class: "plan-wall", d: "M80,3 V40" }, svg);
    el("path", { class: "plan-wall", d: "M118,61 V48" }, svg);
    const route = "M18,20 C30,34 52,50 72,50 L92,50 C108,50 112,36 124,30 L142,22";
    el("path", { class: "plan-route", d: route, pathLength: 1 }, svg);
    el("circle", { class: "plan-start", cx: 18, cy: 20, r: 3 }, svg);
    el("path", { class: "plan-goal", d: "M142,22 V8 L151,11.5 L142,15" }, svg);
    const quad = el("g", { class: "plan-drone" }, svg);
    el("path", { d: "M-5,-5 L5,5 M5,-5 L-5,5" }, quad);
    for (const [x, y] of [[-5, -5], [5, -5], [-5, 5], [5, 5]]) el("circle", { cx: x, cy: y, r: 3 }, quad);
    const fly = el("animateMotion", { path: route, dur: "2.6s", begin: "indefinite", fill: "freeze", rotate: "auto", calcMode: "spline", keyTimes: "0;1", keySplines: "0.45 0 0.35 1" }, quad);
    if (reduce) quad.setAttribute("transform", "translate(142 22)");
    else quad.setAttribute("transform", "translate(18 20)");
    drone.prepend(svg);
    playOnView(svg, () => { quad.removeAttribute("transform"); try { fly.beginElement(); } catch { /* not ready */ } });
  }
})();
