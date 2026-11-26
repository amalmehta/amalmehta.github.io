// Home, BCI Projects card: a live demo in place. A small faint icon in the picture's corner (and a "Live demo"
// link) opens a replay of the real results, day by day across the 19 held-out days: R² for the decoder re-centred
// with no new labels, against the classic linear decoder re-centred and left as trained, and a recorded reach on
// the nearest day, the true path against where each decoder put the cursor (for this decoder, its aligned variant,
// the one the reach export recorded), with each one's average miss.
// Data: BCIProjects/projects/telepathy/results (cross_day.json; site_export/trajectories.json), monkey Indy
// (O'Doherty et al. 2017). R² is the mean over seeds; reach paths are downsampled to every other 20 ms bin.
(() => {
  const card = document.querySelector("#bci-projects");
  const fig = card && card.querySelector("figure.shot");
  if (!fig || !window.simIcon) return;
  const D = {"days":[20,21,22,26,28,29,32,39,40,41,42,82,83,88,96,130,131,134,138],"mine":[0.708,0.752,0.778,0.764,-0.045,0.731,0.728,0.704,0.777,0.773,0.692,0.607,0.702,0.717,0.636,0.758,-0.081,0.673,0.704],"recentred":[0.446,0.487,0.501,0.479,-0.223,0.433,0.382,0.366,0.493,0.414,0.364,0.308,0.439,0.464,0.351,0.399,-0.239,0.448,0.4],"fixed":[0.417,0.131,0.389,0.041,-0.553,-0.224,0.196,-0.101,0.362,-0.123,-0.266,-0.201,-0.361,0.414,0.298,0.02,-1.302,0.243,-1.858],"remapped":[28,131],"reaches":[{"day":20,"target":[22.5,67.5],"truth":[[-32.2,84.0],[-32.1,83.8],[-31.9,83.7],[-31.7,83.5],[-31.5,83.2],[-31.4,83.0],[-31.0,82.5],[-29.3,81.1],[-25.3,78.5],[-17.9,74.5],[-7.7,69.4],[2.8,64.1],[11.5,59.8],[17.2,57.1],[20.1,55.9],[20.8,55.8],[20.2,56.1],[20.2,56.1],[20.3,56.4],[19.7,58.4],[19.2,61.4],[19.7,64.2],[21.3,66.2],[23.5,67.5],[25.7,68.1],[26.9,67.9],[26.5,67.8],[25.7,67.9],[25.7,67.8],[25.6,67.5],[25.1,67.4],[24.5,67.2],[24.0,67.1],[23.7,67.1],[23.6,67.1],[23.6,67.1]],"wiener":[[-31.8,83.8],[-31.3,83.0],[-31.0,82.8],[-30.7,82.0],[-31.0,80.8],[-31.3,79.9],[-32.2,78.4],[-32.5,76.6],[-32.4,74.5],[-30.2,72.4],[-26.0,70.0],[-20.5,68.5],[-15.1,67.4],[-11.5,65.8],[-9.6,64.3],[-8.6,63.9],[-8.8,64.0],[-8.7,64.3],[-8.6,64.5],[-8.8,65.0],[-8.8,66.4],[-8.4,68.3],[-8.4,71.4],[-8.6,73.7],[-8.6,74.2],[-8.1,74.3],[-6.9,74.1],[-5.0,74.2],[-2.8,74.4],[-1.4,74.4],[0.0,74.6],[1.8,74.7],[3.3,74.2],[4.7,73.5],[5.7,73.0],[6.6,71.7]],"mine":[[-32.1,83.9],[-31.9,83.6],[-31.9,83.3],[-31.6,82.8],[-31.2,82.2],[-31.1,81.7],[-31.3,81.2],[-30.7,80.3],[-29.8,79.3],[-26.6,77.7],[-21.7,75.1],[-15.6,71.9],[-10.5,68.7],[-6.7,65.9],[-4.0,64.8],[-2.4,64.2],[-1.1,64.0],[-0.2,64.1],[1.0,63.8],[2.0,64.5],[2.6,66.7],[2.9,68.8],[3.0,70.2],[2.9,71.3],[3.1,71.6],[3.4,71.8],[3.6,71.7],[3.6,71.7],[3.4,71.8],[3.5,71.7],[3.8,71.6],[3.9,71.1],[4.0,70.7],[4.3,70.4],[4.6,70.2],[4.9,69.8]]},{"day":39,"target":[-37.5,37.5],"truth":[[26.6,94.4],[26.3,94.3],[25.9,94.2],[25.5,94.1],[25.1,94.0],[24.5,93.9],[23.6,93.2],[21.6,91.3],[18.4,87.4],[13.2,81.4],[5.9,74.7],[-2.8,67.9],[-12.1,60.5],[-20.6,53.3],[-27.3,47.4],[-31.7,43.4],[-33.9,41.6],[-34.5,41.4],[-33.7,41.6],[-33.4,41.7],[-33.6,41.8],[-33.5,41.8],[-33.5,41.8],[-33.7,41.8],[-33.9,41.9],[-34.1,41.9],[-34.3,42.0],[-34.3,41.9],[-34.3,41.9],[-34.3,41.9],[-34.3,41.9],[-34.3,41.8]],"wiener":[[26.9,94.1],[27.1,93.5],[26.9,93.4],[26.2,93.3],[25.4,93.6],[24.4,94.2],[23.4,94.2],[22.3,94.2],[20.9,93.5],[18.9,92.4],[16.0,91.9],[12.8,90.6],[10.9,88.9],[9.2,87.8],[8.4,86.7],[8.2,85.5],[7.9,84.5],[6.9,84.1],[5.6,84.7],[4.4,85.8],[2.7,86.8],[1.0,88.3],[-1.3,90.1],[-4.1,92.3],[-5.9,93.9],[-7.2,94.9],[-7.4,94.4],[-7.5,93.5],[-7.3,92.3],[-7.5,91.3],[-7.3,89.5],[-6.9,88.0]],"mine":[[26.6,94.4],[26.8,94.3],[26.9,94.2],[26.9,94.0],[26.7,93.5],[26.4,92.6],[25.4,91.1],[23.5,89.0],[20.8,86.5],[16.1,82.3],[10.0,77.5],[2.7,72.1],[-4.9,65.7],[-10.6,59.4],[-13.5,54.8],[-14.9,52.1],[-15.4,51.0],[-15.8,50.8],[-16.2,51.0],[-16.8,51.4],[-17.2,51.6],[-17.6,52.0],[-18.3,52.2],[-19.2,52.9],[-20.0,53.4],[-21.2,54.1],[-22.0,54.4],[-22.5,54.5],[-22.6,54.3],[-22.5,54.2],[-22.4,53.9],[-21.9,53.3]]},{"day":83,"target":[-22.5,37.5],"truth":[[-38.7,54.3],[-38.9,54.5],[-39.0,54.6],[-38.9,54.7],[-38.6,54.8],[-38.4,54.9],[-38.2,54.8],[-37.9,54.5],[-37.2,54.0],[-36.3,53.5],[-35.4,53.1],[-34.1,52.4],[-32.3,51.4],[-30.8,50.4],[-30.0,49.4],[-29.7,48.6],[-29.8,47.9],[-30.0,47.4],[-30.1,47.3],[-30.2,47.2],[-30.4,47.1],[-30.5,46.9],[-30.5,46.5],[-30.3,45.7],[-29.8,44.9],[-29.8,44.0],[-30.3,43.0],[-30.4,42.6],[-30.2,42.5],[-30.0,42.5],[-30.0,42.5],[-30.2,42.6],[-30.2,42.6],[-30.1,42.4],[-29.7,42.0],[-28.5,41.3],[-26.2,39.8],[-24.0,38.3],[-22.9,37.5],[-22.1,37.0],[-21.6,36.8],[-21.1,36.6],[-20.5,36.4],[-19.9,36.2],[-19.1,35.8],[-17.6,35.0],[-13.9,33.2],[-8.7,30.4],[-4.0,27.8],[-0.6,26.3]],"wiener":[[-40.3,55.5],[-43.8,58.3],[-47.0,61.5],[-47.3,63.6],[-46.9,63.7],[-47.8,62.6],[-49.1,61.4],[-49.3,60.8],[-48.6,62.2],[-48.5,63.7],[-48.9,65.6],[-49.1,67.1],[-49.7,69.3],[-49.3,72.3],[-49.2,75.7],[-49.2,80.6],[-49.2,84.6],[-49.7,86.3],[-50.6,88.3],[-51.2,89.6],[-51.1,90.1],[-49.8,90.4],[-47.8,89.0],[-46.2,87.3],[-44.9,86.0],[-43.6,85.2],[-42.8,85.2],[-44.4,86.1],[-47.4,87.2],[-50.5,89.1],[-52.5,89.6],[-53.6,89.0],[-53.2,89.2],[-52.0,89.8],[-49.7,90.9],[-48.3,91.4],[-48.1,93.1],[-48.6,94.9],[-51.3,97.3],[-53.2,100.2],[-53.7,103.8],[-53.8,107.3],[-53.1,110.8],[-54.5,114.3],[-56.6,117.3],[-58.0,120.0],[-59.4,121.7],[-60.4,123.2],[-61.9,125.0],[-63.0,127.7]],"mine":[[-38.4,54.6],[-39.4,55.4],[-40.0,56.5],[-40.6,56.5],[-41.1,56.2],[-41.0,56.0],[-41.3,55.9],[-41.8,56.0],[-42.0,56.3],[-42.4,57.3],[-43.1,57.5],[-43.2,57.7],[-43.6,58.3],[-43.7,59.3],[-43.5,60.3],[-42.7,62.0],[-42.1,63.1],[-42.0,64.2],[-42.4,65.2],[-43.2,65.7],[-43.9,65.9],[-44.8,65.9],[-45.4,66.2],[-46.5,66.3],[-48.1,66.2],[-49.6,66.4],[-50.8,66.4],[-51.9,66.2],[-52.5,66.4],[-52.8,66.4],[-52.4,66.8],[-52.7,67.5],[-52.9,67.9],[-53.1,68.0],[-53.2,68.2],[-53.3,68.4],[-53.8,69.2],[-53.9,70.1],[-53.9,71.7],[-53.2,73.8],[-52.8,75.9],[-52.5,77.0],[-51.2,78.5],[-50.2,80.0],[-50.4,79.9],[-51.2,79.0],[-51.6,78.8],[-52.0,78.7],[-52.4,79.0],[-52.6,79.2]]},{"day":138,"target":[-7.5,112.5],"truth":[[20.0,54.6],[20.0,54.6],[20.0,54.6],[20.0,54.6],[20.0,54.6],[20.0,54.6],[20.0,54.5],[20.0,54.4],[20.0,54.3],[20.0,54.5],[19.7,55.1],[18.7,56.8],[16.8,60.3],[13.8,66.0],[10.4,73.2],[7.3,80.3],[4.8,87.0],[2.9,92.8],[1.0,97.8],[-0.9,102.3],[-2.7,105.9],[-4.0,108.0],[-4.6,108.7],[-4.5,108.5],[-4.5,108.5],[-4.6,108.6],[-4.7,108.8],[-5.0,109.1],[-5.3,109.4],[-5.8,109.7],[-6.5,110.2],[-7.2,110.5],[-7.7,110.5],[-7.6,110.4],[-7.4,110.3],[-7.3,110.1],[-7.0,109.7]],"wiener":[[20.0,53.8],[20.4,52.8],[20.5,52.0],[21.3,51.3],[22.3,50.7],[22.9,49.5],[22.4,47.9],[20.4,47.1],[17.0,47.3],[13.1,48.9],[9.9,51.8],[7.2,55.8],[6.7,59.9],[8.3,65.0],[10.2,70.8],[11.6,76.2],[12.1,82.4],[12.7,88.5],[13.1,94.6],[14.5,99.4],[15.6,103.7],[17.5,106.1],[18.2,106.1],[18.8,105.3],[19.2,104.8],[19.5,104.2],[18.7,104.4],[17.9,105.1],[16.5,105.5],[15.5,106.2],[14.1,107.3],[13.6,107.3],[13.6,106.3],[14.1,104.6],[15.2,103.1],[17.4,101.6],[19.2,100.2]],"mine":[[19.9,54.6],[19.9,54.8],[19.6,54.9],[19.9,55.0],[19.7,55.0],[20.0,54.9],[20.0,54.8],[19.8,54.8],[18.0,56.0],[15.2,58.4],[11.8,62.2],[7.2,68.1],[2.5,75.4],[-0.8,83.8],[-2.7,94.2],[-4.3,104.1],[-5.7,113.1],[-6.7,121.4],[-7.1,128.5],[-8.2,133.9],[-9.1,138.4],[-9.8,141.5],[-10.7,143.3],[-11.7,144.1],[-12.1,144.8],[-13.0,145.5],[-13.7,146.5],[-13.9,147.1],[-14.1,147.5],[-14.4,147.8],[-14.9,147.8],[-15.4,147.9],[-15.5,147.5],[-15.6,146.9],[-15.8,146.5],[-15.9,146.2],[-15.6,145.9]]}]};
  const NS = "http://www.w3.org/2000/svg";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const el = (name, attrs, parent) => { const n = document.createElementNS(NS, name); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); if (parent) parent.appendChild(n); return n; };
  const fmt = v => (v < 0 ? "−" : "") + Math.abs(v).toFixed(2);

  const open = async () => {
    const box = document.createElement("div");
    box.className = "game-box bci-demo";
    // Side by side when there's room; on a phone the reach sits above the chart so the text stays readable
    const narrow = fig.clientWidth < 440;
    const L = narrow
      ? { W: 300, H: 556, read: [12, 40], reach: [12, 52, 276, 200], chart: [12, 270, 276, 200], leg: [14, 506, 0, 16] }
      : { W: 480, H: 292, read: [226, 22], reach: [14, 40, 186, 206], chart: [226, 40, 240, 206], leg: [16, 282, 1, 0] };
    const svg = el("svg", { viewBox: `0 0 ${L.W} ${L.H}`, role: "img", "aria-label": "Replay of decoder accuracy on each of 19 held-out days, with a recorded reach" }, null);
    box.appendChild(svg);

    // ---- header
    const dayT = el("text", { x: 14, y: 22, class: "bd-title" }, svg);
    const readT = el("text", { x: L.read[0], y: L.read[1], class: "bd-read" }, svg);
    const reads = ["R²", "mine", "lin", "fixed"].map((k, n) => { const t = el("tspan", { class: n ? `bd-r-${k}` : "", dx: n ? 10 : 0 }, readT); return t; });

    // ---- reach view (left)
    const [RX, RY, RW, RH] = L.reach;
    el("rect", { x: RX, y: RY, width: RW, height: RH, rx: 8, class: "bd-pane" }, svg);
    const reachT = el("text", { x: RX + 8, y: RY + 15, class: "bd-small" }, svg);
    // Each reach is fitted to the pane (same scale on both axes), so short reaches are still easy to see
    let ox = 0, oy = 0, sc = 1;
    const fit = r => {
      const ps = [...r.truth, ...r.wiener, ...r.mine, r.target];
      const x0 = Math.min(...ps.map(p => p[0])) - 8, x1 = Math.max(...ps.map(p => p[0])) + 8;
      const y0 = Math.min(...ps.map(p => p[1])) - 8, y1 = Math.max(...ps.map(p => p[1])) + 8;
      sc = Math.min((RW - 20) / (x1 - x0), (RH - 34) / (y1 - y0));
      ox = RX + RW / 2 - (x0 + x1) / 2 * sc; oy = RY + 24 + (RH - 34) / 2 + (y0 + y1) / 2 * sc;
    };
    const sx = x => ox + x * sc;
    const sy = y => oy - y * sc;
    const target = el("circle", { r: 7, class: "bd-target" }, svg);
    const pTruth = el("polyline", { class: "bd-truth" }, svg);
    const pLin = el("polyline", { class: "bd-lin" }, svg);
    const pMine = el("polyline", { class: "bd-mine" }, svg);
    const dLin = el("circle", { r: 3.2, class: "bd-dot-lin" }, svg);
    const dMine = el("circle", { r: 3.6, class: "bd-dot-mine" }, svg);
    const missT = el("text", { x: RX + 8, y: RY + RH - 8, class: "bd-axis" }, svg);
    const miss = (p, t) => Math.round(p.reduce((a, q, k) => a + Math.hypot(q[0] - t[k][0], q[1] - t[k][1]), 0) / t.length);

    // ---- R² by day (right)
    const [CX, CY, CW, CH] = L.chart, lo = -0.6, hi = 0.9;
    const cx = d => CX + 22 + (d - 20) / 118 * (CW - 30);
    const cy = v => CY + 8 + (hi - Math.max(lo, Math.min(hi, v))) / (hi - lo) * (CH - 16);
    el("rect", { x: CX, y: CY, width: CW, height: CH, rx: 8, class: "bd-pane" }, svg);
    for (const v of [0, 0.5]) {
      el("line", { x1: CX + 22, x2: CX + CW - 8, y1: cy(v), y2: cy(v), class: "bd-grid" }, svg);
      el("text", { x: CX + 18, y: cy(v) + 3, class: "bd-axis", "text-anchor": "end" }, svg).textContent = v.toFixed(1);
    }
    el("text", { x: CX + 8, y: CY + 15, class: "bd-small" }, svg).textContent = "R²";
    D.remapped.forEach((d, k) => {
      el("line", { x1: cx(d), x2: cx(d), y1: CY + 8, y2: CY + CH - 8, class: "bd-remap" }, svg);
      if (k === 0) el("text", { x: cx(d) + 4, y: CY + CH - 12, class: "bd-axis" }, svg).textContent = "electrodes re-mapped";
    });
    for (const d of [20, 40, 80, 100, 120, 138]) el("text", { x: cx(d), y: CY + CH + 12, class: "bd-axis", "text-anchor": "middle" }, svg).textContent = d === 20 ? "day 20" : d;
    const series = [["fixed", "bd-l-fixed"], ["recentred", "bd-l-lin"], ["mine", "bd-l-mine"]].map(([key, cls]) => ({ key, line: el("polyline", { class: cls }, svg), dot: el("circle", { r: 2.8, class: cls + " bd-end" }, svg) }));
    const cursor = el("line", { y1: CY + 8, y2: CY + CH - 8, class: "bd-now" }, svg);

    // ---- legend
    const leg = [["bd-l-mine", "re-centred, no new labels"], ["bd-l-lin", "linear decoder, re-centred"], ["bd-l-fixed", "linear decoder, as trained"]];
    let [lx, ly, across, down] = L.leg;
    for (const [cls, label] of leg) {
      el("line", { x1: lx, x2: lx + 14, y1: ly, y2: ly, class: cls }, svg);
      const t = el("text", { x: lx + 18, y: ly + 3, class: "bd-axis" }, svg); t.textContent = label;
      if (across) lx += 26 + label.length * 4.6; else ly += down;
    }

    // ---- controls
    const bar = document.createElement("div");
    bar.className = "bd-controls";
    const play = document.createElement("button");
    play.type = "button"; play.className = "bd-play";
    const range = document.createElement("input");
    range.type = "range"; range.min = 0; range.max = D.days.length - 1; range.value = 0;
    range.setAttribute("aria-label", "Held-out day");
    const note = document.createElement("span");
    note.className = "bd-note";
    note.textContent = "Recorded data, one monkey (O’Doherty et al. 2017). Calibrated on days 0–15, then no new labels.";
    bar.append(play, range, note);
    box.appendChild(bar);
    fig.appendChild(box);

    // ---- state
    let i = reduce ? D.days.length - 1 : 0, playing = !reduce, visible = true, raf = 0, last = 0, acc = 0, reachT0 = 0, reach = null;
    const reachFor = day => D.reaches.filter(r => r.day <= day).pop() || D.reaches[0];
    const pts = arr => arr.map(p => `${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join(" ");
    const setReach = r => {
      if (r === reach) return;
      reach = r; reachT0 = performance.now(); fit(r);
      reachT.textContent = `a reach on day ${r.day}`;
      target.setAttribute("cx", sx(r.target[0]).toFixed(1)); target.setAttribute("cy", sy(r.target[1]).toFixed(1));
      pTruth.setAttribute("points", pts(r.truth));
      missT.textContent = "average miss from the true path: ";
      el("tspan", { class: "bd-r-mine" }, missT).textContent = `${miss(r.mine, r.truth)} mm`;
      el("tspan", {}, missT).textContent = " · ";
      el("tspan", { class: "bd-r-lin" }, missT).textContent = `${miss(r.wiener, r.truth)} mm`;
    };
    const drawReach = now => {
      // (a frame's timestamp can come a moment before the reach started, so k is kept at 1 or more)
      const n = Math.min(reach.truth.length, reach.wiener.length, reach.mine.length);
      const k = reduce ? n : Math.max(1, Math.min(n, Math.floor((now - reachT0) / 70) + 1));
      pLin.setAttribute("points", pts(reach.wiener.slice(0, k)));
      pMine.setAttribute("points", pts(reach.mine.slice(0, k)));
      const a = reach.wiener[k - 1], b = reach.mine[k - 1];
      dLin.setAttribute("cx", sx(a[0]).toFixed(1)); dLin.setAttribute("cy", sy(a[1]).toFixed(1));
      dMine.setAttribute("cx", sx(b[0]).toFixed(1)); dMine.setAttribute("cy", sy(b[1]).toFixed(1));
      if (k >= n && now - reachT0 > n * 70 + 900) reachT0 = now;  // replay the reach
    };
    const drawDay = () => {
      const day = D.days[i];
      dayT.textContent = `Day ${day} after calibration`;
      reads[0].textContent = "R²"; reads[1].textContent = fmt(D.mine[i]); reads[2].textContent = fmt(D.recentred[i]); reads[3].textContent = fmt(D.fixed[i]);
      for (const s of series) {
        const v = D[s.key];
        s.line.setAttribute("points", D.days.slice(0, i + 1).map((d, k) => `${cx(d).toFixed(1)},${cy(v[k]).toFixed(1)}`).join(" "));
        s.dot.setAttribute("cx", cx(day).toFixed(1)); s.dot.setAttribute("cy", cy(v[i]).toFixed(1));
      }
      cursor.setAttribute("x1", cx(day).toFixed(1)); cursor.setAttribute("x2", cx(day).toFixed(1));
      range.value = i;
      setReach(reachFor(day));
    };
    const label = () => { play.textContent = playing ? "Pause" : i === D.days.length - 1 ? "Replay" : "Play"; play.setAttribute("aria-pressed", String(playing)); };
    const tick = now => {
      raf = 0;
      const dt = last ? Math.min(now - last, 100) : 0; last = now;
      if (playing) {
        acc += dt;
        const wait = i === D.days.length - 1 ? 2600 : 1100;
        if (acc > wait) { acc = 0; i = i === D.days.length - 1 ? 0 : i + 1; drawDay(); }
      }
      drawReach(now);
      if (visible && !reduce) raf = requestAnimationFrame(tick); else last = 0;
    };
    const run = () => { if (!raf && !reduce) raf = requestAnimationFrame(tick); };
    play.addEventListener("click", () => { if (!playing && i === D.days.length - 1) { i = 0; drawDay(); } playing = !playing; acc = 0; label(); run(); });
    range.addEventListener("input", () => { i = +range.value; acc = 0; playing = false; label(); drawDay(); drawReach(performance.now()); run(); });
    const io = "IntersectionObserver" in window ? new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) run(); }) : null;
    if (io) io.observe(box);
    drawDay(); drawReach(performance.now()); label(); run();
    return () => { cancelAnimationFrame(raf); raf = 0; if (io) io.disconnect(); box.remove(); };
  };

  const icon = window.simIcon(fig, "wave", "Watch the decoders across 19 days", open);
  // A "Live demo" link in the card's links, like the other featured cards; it opens the same thing
  const links = card.querySelector(".links");
  if (links) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "link-btn";
    b.textContent = "Live demo: 19 days, no new labels →";
    b.addEventListener("click", () => { if (!fig.classList.contains("sim-open")) icon.click(); else fig.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); });
    links.firstElementChild.after(" ", b);
  }
})();
