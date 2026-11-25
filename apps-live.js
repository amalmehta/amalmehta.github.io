// Home, Apps you can use: a small live glimpse in the corner of three app screenshots, playing only while the
// card is on screen.
//   LLM Understander: a tiny model training, its loss curve falling step by step, then starting again.
//   RamClean: a memory bar filling app by app, then one idle app is quit and the memory comes back.
//   Messaging Graph: a little web of people; one drifts away from you, its line thinning, then reconnects.
//   AI Advances: a dated forecast; each morning a new data point lands and the forecast's band narrows.
// (A glimpse whose card is archived simply doesn't appear.)
// Decoration only (hidden from screen readers). With reduced motion each shows a still frame.
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const el = (name, attrs, parent) => { const n = document.createElementNS(NS, name); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); if (parent) parent.appendChild(n); return n; };
  const W = 150, H = 86;
  const glimpse = (id) => {
    const shot = document.querySelector(`#${id} .app-shot`);
    if (!shot) return null;
    const wrap = document.createElement("span");
    wrap.className = "app-live";
    wrap.setAttribute("aria-hidden", "true");
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}` }, wrap);
    shot.classList.add("has-live");
    shot.appendChild(wrap);
    return svg;
  };
  const players = [];
  const play = (svg, frame) => { if (svg) players.push({ svg, frame, t: 0, on: false }); };

  // ------------------------------------------------ LLM Understander: a loss curve falling
  {
    const svg = glimpse("llm-understander");
    if (svg) {
      el("text", { x: 8, y: 14, class: "al-label" }, svg).textContent = "training";
      const stepT = el("text", { x: W - 8, y: 14, class: "al-num", "text-anchor": "end" }, svg);
      for (const y of [28, 48, 68]) el("line", { x1: 8, x2: W - 8, y1: y, y2: y, class: "al-grid" }, svg);
      const line = el("polyline", { class: "al-loss", points: "" }, svg);
      const lossT = el("text", { x: W - 8, y: H - 6, class: "al-num", "text-anchor": "end" }, svg);
      const N = 120;
      const curve = [];
      let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let k = 0; k < N; k++) curve.push(0.35 + 3.6 * Math.exp(-k / 22) + (rnd() - 0.5) * 0.25 * Math.exp(-k / 60));
      play(svg, t => {
        const n = Math.max(2, Math.min(N, Math.floor((t % 9) / 7 * N)));
        const pts = curve.slice(0, n).map((v, k) => `${(8 + k / (N - 1) * (W - 16)).toFixed(1)},${(22 + (1 - (Math.min(v, 4) - 0.3) / 3.7) * 50).toFixed(1)}`);
        line.setAttribute("points", pts.join(" "));
        stepT.textContent = `step ${(n * 25).toLocaleString()}`;
        lossT.textContent = `loss ${curve[n - 1].toFixed(2)}`;
      });
    }
  }

  // ------------------------------------------------ RamClean: memory filling, an idle app quit
  {
    const svg = glimpse("ramclean");
    if (svg) {
      el("text", { x: 8, y: 16, class: "al-label" }, svg).textContent = "memory";
      const used = el("text", { x: W - 8, y: 16, class: "al-num", "text-anchor": "end" }, svg);
      el("rect", { x: 8, y: 26, width: W - 16, height: 14, rx: 4, class: "al-track" }, svg);
      const apps = [["#7aa2ff", 0.22], ["#ffb86b", 0.18], ["#9be3a8", 0.16], ["#ff7ab6", 0.2], ["#c3a6ff", 0.12]];
      const bars = apps.map(([c]) => el("rect", { y: 26, height: 14, rx: 2, fill: c }, svg));
      const note = el("text", { x: 8, y: 62, class: "al-note" }, svg);
      const idle = 3;   // the app that's been idle for a day
      play(svg, t => {
        const c = t % 8;
        let x = 8, total = 0;
        apps.forEach(([, share], k) => {
          let f = Math.min(Math.max((c - k * 0.55) / 0.5, 0), 1) * share;
          if (k === idle && c > 4.6) f *= Math.max(0, 1 - (c - 4.6) / 0.6);
          const w = f * (W - 16);
          bars[k].setAttribute("x", x.toFixed(1)); bars[k].setAttribute("width", Math.max(w, 0).toFixed(1));
          bars[k].setAttribute("opacity", k === idle && c > 3.4 && c < 4.6 ? (0.55 + 0.45 * Math.abs(Math.sin(c * 6))).toFixed(2) : "1");
          x += w; total += f;
        });
        used.textContent = `${(total * 16).toFixed(1)} of 16 GB`;
        note.textContent = c > 3.4 && c < 4.6 ? "idle since yesterday · quit it?" : c >= 4.6 && c < 7.4 ? "freed 3.2 GB" : "";
      });
    }
  }

  // ------------------------------------------------ Messaging Graph: someone drifting away
  {
    const svg = glimpse("messaging-graph");
    if (svg) {
      const me = [W / 2, H / 2 + 4];
      const people = [[34, 22], [116, 20], [124, 62], [28, 66], [78, 14], [96, 76]];
      const lines = people.map(() => el("line", { class: "al-edge" }, svg));
      el("circle", { cx: me[0], cy: me[1], r: 6, class: "al-me" }, svg);
      const dots = people.map(() => el("circle", { r: 4, class: "al-node" }, svg));
      const note = el("text", { x: 8, y: H - 6, class: "al-note" }, svg);
      const drifter = 2;
      play(svg, t => {
        const c = t % 10, away = c < 5 ? Math.min(c / 4, 1) : Math.max(0, 1 - (c - 6.5) / 1.5);
        people.forEach(([x, y], k) => {
          const wob = Math.sin(t * 0.8 + k) * 1.5;
          let px = x + wob, py = y + Math.cos(t * 0.7 + k * 2) * 1.5;
          if (k === drifter) { px = lerp(x, 146, away); py = lerp(y, 80, away); }
          dots[k].setAttribute("cx", px.toFixed(1)); dots[k].setAttribute("cy", py.toFixed(1));
          lines[k].setAttribute("x1", me[0]); lines[k].setAttribute("y1", me[1]);
          lines[k].setAttribute("x2", px.toFixed(1)); lines[k].setAttribute("y2", py.toFixed(1));
          if (k === drifter) { lines[k].setAttribute("stroke-width", (1.6 - away * 1.3).toFixed(2)); lines[k].setAttribute("stroke-dasharray", away > 0.5 ? "2 3" : "none"); dots[k].classList.toggle("al-fading", away > 0.5); }
        });
        note.textContent = away > 0.6 ? "no messages in 4 months" : c > 6.5 && c < 8.5 ? "reconnected" : "";
      });
    }
  }
  // ------------------------------------------------ AI Advances: a forecast that updates each morning
  {
    const svg = glimpse("ai-advances");
    if (svg) {
      el("text", { x: 8, y: 14, class: "al-label" }, svg).textContent = "forecast";
      const day = el("text", { x: W - 8, y: 14, class: "al-num", "text-anchor": "end" }, svg);
      el("line", { x1: 8, x2: W - 8, y1: 72, y2: 72, class: "al-grid" }, svg);
      const band = el("path", { class: "al-band" }, svg);
      const mid = el("path", { class: "al-mid" }, svg);
      const seen = el("polyline", { class: "al-loss" }, svg);
      const dot = el("circle", { r: 2.6, class: "al-me" }, svg);
      const note = el("text", { x: 8, y: H - 4, class: "al-note" }, svg);
      const D = 8, X = k => 10 + k * 15, Y = v => 70 - v * 46;
      const obs = [0.1, 0.16, 0.2, 0.29, 0.33, 0.41, 0.47, 0.52, 0.6];
      play(svg, t => {
        const c = t % (D * 1.1), n = Math.min(D, Math.floor(c / 1.1) + 1), land = Math.min((c % 1.1) / 0.35, 1);
        const pts = obs.slice(0, n + 1).map((v, k) => [X(k), Y(k === n ? lerp(obs[n - 1], v, land) : v)]);
        seen.setAttribute("points", pts.map(p => p.map(q => q.toFixed(1)).join(",")).join(" "));
        const [lx, ly] = pts[pts.length - 1];
        dot.setAttribute("cx", lx.toFixed(1)); dot.setAttribute("cy", ly.toFixed(1));
        const w = 30 * (1 - n / (D + 3)), slope = (obs[n] - obs[0]) / n, end = X(D + 0.6), ey = Y(obs[n] + slope * (D + 0.6 - n));
        band.setAttribute("d", `M${lx.toFixed(1)},${ly.toFixed(1)} L${end.toFixed(1)},${(ey - w).toFixed(1)} L${end.toFixed(1)},${(ey + w).toFixed(1)}Z`);
        mid.setAttribute("d", `M${lx.toFixed(1)},${ly.toFixed(1)} L${end.toFixed(1)},${ey.toFixed(1)}`);
        day.textContent = `day ${n}`;
        note.textContent = land < 1 ? "6:00 · new data" : "";
      });
    }
  }
  function lerp(a, b, t) { return a + (b - a) * t; }

  if (!players.length) return;
  if (reduce || !("IntersectionObserver" in window)) { for (const p of players) p.frame(5.5); return; }
  const io = new IntersectionObserver(es => { for (const e of es) { const p = players.find(q => q.svg.closest(".app-shot") === e.target); if (p) p.on = e.isIntersecting; } run(); }, { threshold: 0.3 });
  for (const p of players) { io.observe(p.svg.closest(".app-shot")); p.frame(0.01); }
  let raf = 0, last = 0;
  const tick = now => {
    raf = 0;
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 0; last = now;
    let any = false;
    for (const p of players) if (p.on) { p.t += dt; p.frame(p.t); any = true; }
    if (any) raf = requestAnimationFrame(tick); else last = 0;
  };
  const run = () => { if (!raf) raf = requestAnimationFrame(tick); };
})();
