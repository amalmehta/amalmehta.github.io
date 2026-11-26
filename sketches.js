// Profile: two small working sketches that play when they scroll into view, and again on hover.
//   Publications, the melanoma paper: a slice of tissue, pink with purple nuclei, and the tumour's outline
//     tracing itself around the dense cells, then filling in, like the model drawing its mask.
//   Earlier research: a star flares into a supernova beside the cosmology line, and particle tracks spray out
//     beside the particle-physics line.
//   Publications & reports: a tiny sketch beside each title. The thesis: a ball chipped into a goal. The two
//     melanoma papers: dense cells and the tumour's outline tracing itself round them. Few-shot imitation: a
//     ghost arm shows a reach once and a solid arm copies it. Defensive retraining: two sumo agents, one
//     shoving the other out of the ring. WaferSat: a laser beam reaches a tiny wafer with a sail, and it speeds off.
//     Pose graphs: a drifting trajectory, a loop-closure edge, and the corrected loop drawing itself in.
//     Contract extraction: a term in a contract lights up and a check mark ticks beside it.
//   More projects, Drone Autonomy: a floor plan with a wall in the way; the planned path draws itself from
//     start to goal around the wall's end, and a tiny quadrotor flies it.
//   More projects, Neuro Falcon: a decoder's accuracy sinks day after day (R² 0.33 on its own week down to 0.16),
//     then snaps back up (0.31) once the new day's inputs are re-normalised, the README's GRU numbers.
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
  const drone = document.querySelector("li.mini#drone-autonomy");  // only as a More projects line; the Featured card has its own picture
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

  // ---------------------------------------------------------------- Neuro Falcon: drift, then re-normalising
  const falcon = document.querySelector("li.mini#neuro-falcon");
  if (falcon) {
    const svg = el("svg", { class: "sketch nf-sketch", viewBox: "0 0 160 64", "aria-hidden": "true" });
    const y = v => (56 - v * 130).toFixed(1);
    el("path", { class: "nf-axis", d: "M6,56 H154" }, svg);
    el("path", { class: "nf-ref", d: `M6,${y(0.33)} H154` }, svg);
    const days = [[14, 0.33], [40, 0.27], [66, 0.22], [92, 0.18], [118, 0.16]];
    el("path", { class: "nf-sink", d: "M" + days.map(([x, v]) => `${x},${y(v)}`).join(" L"), pathLength: 1 }, svg);
    days.forEach(([x, v], k) => el("circle", { class: "nf-day", cx: x, cy: y(v), r: 2.2 }, svg).style.setProperty("--k", k));
    el("path", { class: "nf-snap", d: `M118,${y(0.16)} C128,${y(0.16)} 132,${y(0.31)} 142,${y(0.31)}`, pathLength: 1 }, svg);
    el("circle", { class: "nf-end", cx: 142, cy: y(0.31), r: 3 }, svg);
    falcon.prepend(svg);
    playOnView(svg, () => {});
  }

  // ---------------------------------------------------------------- earlier research: a supernova and particle tracks
  for (const li of document.querySelectorAll(".earlier-list li")) {
    const text = li.textContent;
    const kind = /supernova/i.test(text) ? "nova" : /particle/i.test(text) ? "tracks" : null;
    if (!kind) continue;
    const svg = el("svg", { class: `spark spark-${kind}`, viewBox: "0 0 24 24", "aria-hidden": "true" });
    if (kind === "nova") {
      el("circle", { class: "nova-glow", cx: 12, cy: 12, r: 9 }, svg);
      el("path", { class: "nova-rays", d: "M12,2 V7 M12,17 V22 M2,12 H7 M17,12 H22 M5,5 L8.5,8.5 M15.5,15.5 L19,19 M19,5 L15.5,8.5 M8.5,15.5 L5,19", pathLength: 1 }, svg);
      el("circle", { class: "nova-core", cx: 12, cy: 12, r: 2.2 }, svg);
    } else {
      for (const d of ["M4,20 C8,14 12,11 21,9", "M4,20 C9,16 13,15 20,17", "M4,20 C6,13 8,8 11,3", "M4,20 C10,18 15,20 22,22", "M4,20 C7,15 13,9 16,4"])
        el("path", { class: "track", d, pathLength: 1 }, svg);
      el("circle", { class: "vertex", cx: 4, cy: 20, r: 1.6 }, svg);
    }
    li.lastElementChild.appendChild(svg);
    playOnView(svg, () => {});
  }

  // ---------------------------------------------------------------- publications & reports
  const pubs = { "robot-soccer-thesis": "kick", "spie-2023": "cells", "uscap-2022": "cells", "few-shot-imitation": "arm", "defensive-retraining": "sumo", "wafersat-2016": "sail", "pose-graph-2023": "graph", "informs-2021": "contract" };
  for (const [id, kind] of Object.entries(pubs)) {
    const h = document.querySelector(`#writeups #${id} h3`);
    if (!h) continue;
    const svg = el("svg", { class: `spark spark-${kind}`, viewBox: "0 0 24 24", "aria-hidden": "true" });
    if (kind === "kick") {
      el("path", { class: "kick-goal", d: "M16,21 V9 H22 V21" }, svg);
      el("path", { class: "kick-arc", d: "M3,20 Q10,4 19,13", pathLength: 1 }, svg);
      el("circle", { class: "kick-ball", cx: 3, cy: 20, r: 1.9 }, svg);
    } else if (kind === "cells") {
      for (const [x, y, r] of [[5, 6, 1.1], [19, 5, 1], [4, 18, 1], [20, 19, 1.1], [12, 3, 0.9], [11, 21, 0.9]]) el("circle", { class: "cell", cx: x, cy: y, r }, svg);
      for (const [x, y] of [[10, 10], [13, 9], [14, 13], [10, 14], [12, 12], [8, 12], [15, 11]]) el("circle", { class: "cell dense", cx: x, cy: y, r: 1.3 }, svg);
      el("path", { class: "cell-outline", d: "M7,11 C7,7 15,6 17,10 C18,14 15,17 11,16 C8,16 7,14 7,11Z", pathLength: 1 }, svg);
    } else if (kind === "arm") {
      el("path", { class: "arm-base", d: "M3,21 H9" }, svg);
      for (const cls of ["arm-ghost", "arm-copy"]) {
        const g = el("g", { class: cls }, svg);
        el("path", { d: "M6,20 L6,12 L14,9" }, g);
        el("circle", { cx: 14, cy: 9, r: 1.3 }, g);
      }
      el("circle", { class: "arm-target", cx: 18, cy: 16, r: 1.6 }, svg);
    } else if (kind === "contract") {
      el("rect", { class: "ct-doc", x: 3, y: 3, width: 12, height: 18, rx: 1.5 }, svg);
      for (const y of [7, 10.5, 14, 17.5]) el("path", { class: "ct-line", d: `M5.5,${y} H12.5` }, svg);
      el("rect", { class: "ct-mark", x: 5, y: 9.3, width: 8, height: 2.4, rx: 0.6 }, svg);
      el("path", { class: "ct-check", d: "M16.5,11.5 L18.6,13.8 L22,9", pathLength: 1 }, svg);
    } else if (kind === "graph") {
      el("path", { class: "pg-drift", d: "M5,18 L5,7 L13,3.5 L21,7.5 L22,18.5 L14,22.5" }, svg);
      el("path", { class: "pg-close", d: "M14,22.5 L5,18" }, svg);
      el("path", { class: "pg-fixed", d: "M5,18 L5,7 L12,4 L19,7 L19,17 L12,20 Z", pathLength: 1 }, svg);
      for (const [x, y] of [[5, 18], [5, 7], [12, 4], [19, 7], [19, 17], [12, 20]]) el("circle", { class: "pg-node", cx: x, cy: y, r: 1.3 }, svg);
    } else if (kind === "sail") {
      for (const [x, y] of [[17, 5], [21, 9], [19, 18], [22, 15]]) el("circle", { class: "sail-star", cx: x, cy: y, r: 0.6 }, svg);
      for (const d of ["M1,9 H8", "M1,12 H8.8", "M1,15 H8"]) el("path", { class: "sail-beam", d, pathLength: 1 }, svg);
      const craft = el("g", { class: "sail-craft" }, svg);
      el("path", { class: "sail-sheet", d: "M8,6 Q10.6,12 8,18" }, craft);
      el("rect", { class: "sail-wafer", x: 9.6, y: 11, width: 2.2, height: 2, rx: 0.3 }, craft);
    } else {
      el("circle", { class: "sumo-ring", cx: 12, cy: 13, r: 9 }, svg);
      el("circle", { class: "sumo-a", cx: 8, cy: 13, r: 2.6 }, svg);
      el("circle", { class: "sumo-b", cx: 14, cy: 13, r: 2.6 }, svg);
    }
    h.appendChild(svg);
    playOnView(svg, () => {});
  }
})();
