// Interests, People I'm watching: each drawing plays its moment once as it scrolls into view, and again on
// hover or tap. Yamal's ball weaves between the two defenders, its dotted path drawing in behind it;
// Bellingham drags the ball back under his sole as two swooshes trace the roulette's spin.
// The drawings are swapped for copies without the ball (images/watching/*-still.svg) and the ball is drawn
// live on top, in the drawing's own 1200 × 800 coordinates. Without JS, or with reduced motion, the original
// drawings show the finished moment.
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
  const NS = "http://www.w3.org/2000/svg";
  const el = (name, attrs, parent) => {
    const n = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (parent) parent.appendChild(n);
    return n;
  };
  const ease = { calcMode: "spline", keyTimes: "0;1", keySplines: "0.45 0 0.25 1" };
  // The ball, as drawn in the originals, at (cx, cy); its shadow sits on the grass below it
  const ball = (parent, cx, cy) => {
    const g = el("g", {}, parent);
    el("ellipse", { cx, cy: cy + 18, rx: 22.8, ry: 5.3, fill: "#000", opacity: 0.25 }, g);
    const spin = el("g", {}, g);
    el("circle", { cx, cy, r: 19, fill: "#fbfbf7" }, spin);
    el("path", { d: `M${cx - 5.7},${cy - 6.6} l6.6,-2.3 l4.8,5.3 l-3.4,6.6 l-6.8,-1.0Z`, fill: "#26262a" }, spin);
    el("circle", { cx, cy, r: 19, fill: "none", stroke: "#c9c9c2", "stroke-width": 2 }, spin);
    return [g, spin];
  };
  // A play builds its pieces and returns its cues: each animation with how long after the start it begins.
  // Every animation waits (begin="indefinite") until the play is started, and a restart replays them all.
  const cued = (name, attrs, parent) => el(name, { begin: "indefinite", fill: "freeze", ...attrs }, parent);
  const plays = {
    "yamal-almost-rabona": (svg, id) => {
      const path = "M395,712 C470,700 520,640 585,660 S640,700 668,690";
      const mask = el("mask", { id: `${id}-m` }, el("defs", {}, svg));
      const reveal = el("path", { d: path, fill: "none", stroke: "#fff", "stroke-width": 16, pathLength: 1, "stroke-dasharray": 1, "stroke-dashoffset": 1 }, mask);
      el("path", { d: path, fill: "none", stroke: "#ffffff", "stroke-width": 3, "stroke-dasharray": "2 12", "stroke-linecap": "round", opacity: 0.7, mask: `url(#${id}-m)` }, svg);
      const [g, spin] = ball(svg, 675, 670);  // the ball rests just above the path's end, at (668, 690)
      return [
        [cued("animate", { attributeName: "stroke-dashoffset", from: 1, to: 0, dur: "1.7s", ...ease }, reveal), 0],
        [cued("animateMotion", { path: "M-273,22 C-198,10 -148,-50 -83,-30 S-28,10 0,0", dur: "1.7s", ...ease }, g), 0],
        [cued("animateTransform", { attributeName: "transform", type: "rotate", from: "-720 675 670", to: "0 675 670", dur: "1.7s", ...ease }, spin), 0],
      ];
    },
    "bellingham-roulette": (svg) => {
      const sweep = (d, delay) => {
        const p = el("path", { d, fill: "none", stroke: "#ffffff", "stroke-width": 3, "stroke-linecap": "round", pathLength: 1, "stroke-dasharray": 1, "stroke-dashoffset": 1, opacity: 0 }, svg);
        return [
          [cued("animate", { attributeName: "stroke-dashoffset", from: 1, to: 0, dur: "0.8s", ...ease }, p), delay],
          [cued("animate", { attributeName: "opacity", values: "0.6;0.6;0", keyTimes: "0;0.55;1", dur: "1.6s" }, p), delay],
        ];
      };
      const cues = [...sweep("M505,455 A95,20 0 1,0 695,455", 0.05), ...sweep("M520,622 A80,16 0 1,0 680,622", 0.25)];
      const [g, spin] = ball(svg, 700, 686);  // dragged back under his sole to where it rests
      return [...cues,
        [cued("animateMotion", { path: "M-62,8 Q-30,26 0,0", dur: "1.1s", ...ease }, g), 0],
        [cued("animateTransform", { attributeName: "transform", type: "rotate", from: "-300 700 686", to: "0 700 686", dur: "1.1s", ...ease }, spin), 0],
      ];
    },
  };

  let n = 0;
  for (const img of document.querySelectorAll("img.tile-drawing")) {
    const key = Object.keys(plays).find(k => img.getAttribute("src").includes(k));
    if (!key) continue;
    const still = img.getAttribute("src").replace(".svg", "-still.svg");
    new Image().src = still;  // fetch it early, so the swap shows no gap
    const id = `play${n++}`;
    let start = null;
    const prepare = () => {
      const wrap = document.createElement("span");
      wrap.className = "moment";
      img.replaceWith(wrap);
      wrap.appendChild(img);
      img.src = still;
      const svg = el("svg", { class: "moment-layer", viewBox: "0 0 1200 800", "aria-hidden": "true" }, wrap);
      const cues = plays[key](svg, id);
      start = () => { for (const [anim, delay] of cues) { try { anim.beginElementAt(delay); } catch { /* not ready yet */ } } };
      wrap.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") start(); });
      wrap.addEventListener("click", () => start());
    };
    const io = new IntersectionObserver(es => {
      if (!es.some(e => e.isIntersecting)) return;
      io.disconnect();
      prepare();
      requestAnimationFrame(() => start());
    }, { threshold: 0.6 });
    io.observe(img);
  }
})();
