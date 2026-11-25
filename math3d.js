// Interests, Math I love: one 3D scene with five tabs, in the deep blue-and-yellow style of 3Blue1Brown.
// Drag to turn it; left alone it turns slowly. Each scene frames itself to fit, glides between steps, and
// has level curves (or cross-section lines) on the surface with their shadow on the floor. Each can be played with:
//   Gradient descent: a narrow valley; plain steps zigzag across it, momentum glides down it. Click the valley
//     to drop both balls there.
//   Lagrange multipliers: a hill and a circle on the floor; the highest point of the hill above the circle is
//     where a level curve of the hill just touches it. Click the hill to change the circle's size.
//   Central limit theorem: the spread of the average of n rolls of a lopsided die, for n = 1 to 12; the
//     lopsided shape at the front becomes a bell at the back. A slider sets n.
//   Bayesian updating: the belief about a coin's bias after each flip, sharpening around 0.7; or flip it yourself.
//   Random walks: coin-flip walks on the floor, and the bell they spread into, wider like √t. New walks on request.
// Every scene can be paused and replayed. Drawn on a plain canvas: a perspective projection and depth-sorted,
// lit quads, no library. With reduced motion nothing turns or moves on its own, and each scene shows its
// finished state. Without JS the section is a plain list of the five ideas.
(() => {
  const root = document.querySelector(".math3d");
  const list = document.querySelector(".math-list");
  if (!root || !list) return;
  const canvas = root.querySelector("canvas");
  const g = canvas.getContext("2d");
  if (!g) return;
  root.hidden = false;
  list.hidden = true;

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const C = { bg: "#080a12", floor: "#151a2b", grid: "#252c41", ink: "#f3ede1", faint: "#8f96a8", blue: "#45c6ff", yellow: "#ffd23f", green: "#7ee07a", red: "#ff5a4e" };
  const STOPS = [[0, [24, 16, 96]], [0.26, [38, 62, 200]], [0.5, [14, 160, 220]], [0.74, [80, 214, 120]], [1, [255, 214, 46]]];
  const LIGHT = (() => { const v = [-0.45, -0.55, 0.85], n = Math.hypot(...v); return v.map(c => c / n); })();
  const TAU = Math.PI * 2;
  const lerp = (a, b, t) => a + (b - a) * t;
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const gauss = () => Math.sqrt(-2 * Math.log(rand() + 1e-12)) * Math.cos(TAU * rand());
  const colour = h => {
    h = Math.min(Math.max(h, 0), 1);
    for (let i = 1; i < STOPS.length; i++) {
      const [t1, c1] = STOPS[i], [t0, c0] = STOPS[i - 1];
      if (h <= t1) { const f = (h - t0) / (t1 - t0); return c0.map((c, k) => c + (c1[k] - c) * f); }
    }
    return STOPS.at(-1)[1];
  };
  const levels = n => Array.from({ length: n }, (_, k) => (k + 1) / (n + 1));

  // ---------------------------------------------------------------- the camera, framed to fit every scene
  let yaw = -0.75, pitch = 0.55, goal = null, W = 0, H = 0, scale = 1, ox = 0, oy = 0, zTop = 1;
  const D = 4.2, TOP = 46, PAD = 14;  // camera distance; room at the top for the legend and the count
  const view = (x, y, z) => {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const X = x * cy - y * sy, Y = x * sy + y * cy;
    const up = z * cp + Y * sp, depth = Y * cp - z * sp, s = D / (D + depth);
    return [X * s, -up * s, depth];
  };
  const P = (x, y, z) => { const [a, b, d] = view(x, y, z); return [ox + a * scale, oy + b * scale, d]; };
  // Fit the scene to the frame at the current turn; the zoom eases toward it, so turning breathes gently
  // instead of jumping, and nothing is ever cut off for long.
  let target = null;
  const fitTarget = () => {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const x of [-1.1, 1.1]) for (const y of [-1.1, 1.1]) for (const z of [0, zTop]) {
      const [a, b] = view(x, y, z); x0 = Math.min(x0, a); x1 = Math.max(x1, a); y0 = Math.min(y0, b); y1 = Math.max(y1, b);
    }
    const sc = Math.min((W - 2 * PAD) / (x1 - x0), (H - TOP - PAD) / (y1 - y0));
    return [sc, W / 2 - sc * (x0 + x1) / 2, TOP + (H - TOP - PAD) / 2 - sc * (y0 + y1) / 2];
  };
  const fit = (k = 1) => {
    if (!W) return;
    target = fitTarget();
    if (k >= 1) [scale, ox, oy] = target;
    else { scale = lerp(scale, target[0], k); ox = lerp(ox, target[1], k); oy = lerp(oy, target[2], k); }
  };
  const line = (pts, colour, width = 2, alpha = 1, dash) => {
    if (pts.length < 2) return;
    g.globalAlpha = alpha; g.strokeStyle = colour; g.lineWidth = width; g.lineJoin = g.lineCap = "round";
    if (dash) g.setLineDash(dash);
    g.beginPath(); pts.forEach(([x, y, z], i) => { const [sx, sy] = P(x, y, z); i ? g.lineTo(sx, sy) : g.moveTo(sx, sy); }); g.stroke();
    g.setLineDash([]); g.globalAlpha = 1;
  };
  const glowLine = (pts, colour, width) => { line(pts, colour, width * 3.2, 0.16); line(pts, colour, width); };
  const dot = (x, y, z, r, colour, glow = true) => {
    const [sx, sy] = P(x, y, z);
    if (glow) { const q = g.createRadialGradient(sx, sy, 0, sx, sy, r * 3.4); q.addColorStop(0, colour + "88"); q.addColorStop(1, colour + "00"); g.fillStyle = q; g.beginPath(); g.arc(sx, sy, r * 3.4, 0, TAU); g.fill(); }
    const q = g.createRadialGradient(sx - r * 0.35, sy - r * 0.35, r * 0.1, sx, sy, r);
    q.addColorStop(0, "#ffffff"); q.addColorStop(0.35, colour); q.addColorStop(1, colour);
    g.fillStyle = q; g.beginPath(); g.arc(sx, sy, r, 0, TAU); g.fill();
  };
  const text = (s, x, y, z, colour = C.faint, align = "center", size = 14) => {
    const [sx, sy] = P(x, y, z);
    g.fillStyle = colour; g.font = `italic ${size}px Newsreader, Georgia, serif`; g.textAlign = align; g.fillText(s, sx, sy);
  };

  // ---------------------------------------------------------------- surfaces
  // A surface is a grid of heights in [0, 1] over the floor square [-1, 1]²; z = height × LIFT.
  // Its level curves are found once per surface, cell by cell (marching squares), and drawn with their cell,
  // so the depth sort hides them behind the hill like the surface itself.
  const LIFT = 0.95;
  const gx = (n, i) => -1 + 2 * i / (n - 1);
  const mesh = (nu, nv, h, lv = []) => {
    const z = [];
    for (let j = 0; j < nv; j++) { z.push([]); for (let i = 0; i < nu; i++) z[j].push(h(gx(nu, i), gx(nv, j), i, j)); }
    const segs = [];
    for (let j = 0; j < nv - 1; j++) {
      segs.push([]);
      for (let i = 0; i < nu - 1; i++) {
        const xs = [gx(nu, i), gx(nu, i + 1), gx(nu, i + 1), gx(nu, i)], ys = [gx(nv, j), gx(nv, j), gx(nv, j + 1), gx(nv, j + 1)];
        const v = [z[j][i], z[j][i + 1], z[j + 1][i + 1], z[j + 1][i]], cell = [];
        for (const L of lv) {
          const p = [];
          for (let e = 0; e < 4; e++) {
            const a = v[e], b = v[(e + 1) % 4];
            if ((a < L) !== (b < L)) { const t = (L - a) / (b - a); p.push([lerp(xs[e], xs[(e + 1) % 4], t), lerp(ys[e], ys[(e + 1) % 4], t), L]); }
          }
          if (p.length >= 2) cell.push([L, p[0], p[1]]);
          if (p.length === 4) cell.push([L, p[2], p[3]]);
        }
        segs[j].push(cell);
      }
    }
    return { nu, nv, z, segs };
  };
  const drawMesh = (m, { glow = null, alpha = 1, upTo = Infinity, rows = 0, contours = true } = {}) => {
    const { nu, nv, z } = m, quads = [];
    const pt = (i, j) => [gx(nu, i), gx(nv, j), z[j][i] * LIFT];
    const pr = [];
    for (let j = 0; j < nv; j++) { pr.push([]); for (let i = 0; i < nu; i++) pr[j].push(P(...pt(i, j))); }
    const strips = Math.min(nv - 1, Math.ceil(upTo));
    for (let j = 0; j < strips; j++) for (let i = 0; i < nu - 1; i++) {
      const a = pt(i, j), b = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1);
      const ux = c[0] - a[0], uy = c[1] - a[1], uz = c[2] - a[2], vx = d[0] - b[0], vy = d[1] - b[1], vz = d[2] - b[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const nn = Math.hypot(nx, ny, nz) || 1;
      nx /= nn; ny /= nn; nz /= nn; if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
      const diff = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
      const lit = 0.3 + 0.85 * diff, spec = Math.pow(diff, 22) * 70;
      const h = (a[2] + b[2] + c[2] + d[2]) / 4 / LIFT;
      const shine = glow == null ? 1 : 1 + 0.55 * Math.max(0, 1 - Math.abs(j + 0.5 - glow));
      const col = colour(h).map(v => Math.min(255, v * lit * shine + spec) | 0);
      const ps = [pr[j][i], pr[j][i + 1], pr[j + 1][i + 1], pr[j + 1][i]];
      quads.push([ps, (ps[0][2] + ps[1][2] + ps[2][2] + ps[3][2]) / 4, `rgb(${col})`, i, j]);
    }
    quads.sort((p, q) => q[1] - p[1]);
    g.globalAlpha = alpha; g.lineJoin = "round";
    for (const [ps, , col, i, j] of quads) {
      g.fillStyle = g.strokeStyle = col; g.lineWidth = 1; g.beginPath();
      g.moveTo(ps[0][0], ps[0][1]); for (let k = 1; k < 4; k++) g.lineTo(ps[k][0], ps[k][1]); g.closePath(); g.fill(); if (alpha === 1) g.stroke();
      const segs = contours ? m.segs[j][i] : [];
      if (segs.length || (rows && j % rows === 0)) {
        g.strokeStyle = "rgba(255,255,255,0.4)"; g.lineWidth = 1.1; g.beginPath();
        for (const [, p, q] of segs) { const A = P(p[0], p[1], p[2] * LIFT + 0.003), B = P(q[0], q[1], q[2] * LIFT + 0.003); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); }
        if (rows && j % rows === 0) { g.moveTo(ps[0][0], ps[0][1]); g.lineTo(ps[1][0], ps[1][1]); }
        g.stroke();
      }
    }
    g.globalAlpha = 1;
  };
  const floorContours = (m, alpha = 0.6) => {  // the level curves' shadow on the floor, each in its height's colour
    const byLevel = new Map();
    for (const row of m.segs) for (const cell of row) for (const s of cell) { if (!byLevel.has(s[0])) byLevel.set(s[0], []); byLevel.get(s[0]).push(s); }
    g.globalAlpha = alpha; g.lineWidth = 1.3; g.lineCap = "round";
    for (const [L, segs] of byLevel) {
      g.strokeStyle = `rgb(${colour(L).map(v => v | 0)})`; g.beginPath();
      for (const [, p, q] of segs) { const A = P(p[0], p[1], 0.002), B = P(q[0], q[1], 0.002); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); }
      g.stroke();
    }
    g.globalAlpha = 1;
  };
  const floor = () => {
    const sq = [[-1, -1, 0], [1, -1, 0], [1, 1, 0], [-1, 1, 0]].map(p => P(...p));
    g.fillStyle = C.floor; g.beginPath(); sq.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill();
    for (let k = -4; k <= 4; k++) { line([[k / 4, -1, 0], [k / 4, 1, 0]], C.grid, 1); line([[-1, k / 4, 0], [1, k / 4, 0]], C.grid, 1); }
  };
  const rowSlice = (m, r, colour) => {  // a bright curve across the surface at row r, which may fall between rows
    r = Math.min(Math.max(r, 0), m.nv - 1);
    const j0 = Math.floor(r), j1 = Math.min(j0 + 1, m.nv - 1), t = r - j0, y = lerp(gx(m.nv, j0), gx(m.nv, j1), t), pts = [];
    for (let i = 0; i < m.nu; i++) pts.push([gx(m.nu, i), y, lerp(m.z[j0][i], m.z[j1][i], t) * LIFT + 0.006]);
    glowLine(pts, colour, 3.2);
  };

  // ---------------------------------------------------------------- the five scenes
  // draw(state, t): t runs 0 → 1 between one step and the next, so everything glides instead of ticking
  const scenes = {
    descent: (() => {
      const c = Math.cos(0.55), s = Math.sin(0.55), K = 2.2;
      const f = (x, y) => { const a = (x * c + y * s) * K, b = (-x * s + y * c) * K; return 0.15 * a * a + 1.6 * b * b; };
      const grad = (x, y) => { const a = (x * c + y * s) * K, b = (-x * s + y * c) * K, ga = 0.3 * a, gb = 3.2 * b; return [(c * ga - s * gb) * K, (s * ga + c * gb) * K]; };
      let top = 0; for (let i = 0; i <= 20; i++) for (let j = 0; j <= 20; j++) top = Math.max(top, f(-1 + i / 10, -1 + j / 10));
      const m = mesh(40, 40, (x, y) => Math.sqrt(f(x, y) / top), levels(11));  // √ keeps the valley floor visible
      const zf = (x, y) => Math.sqrt(Math.max(f(x, y), 0) / top) * LIFT;
      const home = (() => { const a = -2.1 / K, b = 0.32 / K; return [a * c - b * s, a * s + b * c]; })();
      let start = home;
      const clamp = ([x, y]) => [Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y))];
      return {
        steps: 90, every: 70, zTop: LIFT + 0.1,
        hint: "Drag to turn it. Click the valley to drop both balls there.",
        surface: zf,
        click(x, y) { start = [x, y]; return true; },
        reset() { start = home; },
        init: () => ({ plain: [start], heavy: [start], v: [0, 0] }),
        step(st) {
          const [px, py] = st.plain.at(-1), gp = grad(px, py);
          st.plain.push(clamp([px - 0.11 * gp[0], py - 0.11 * gp[1]]));
          const [hx, hy] = st.heavy.at(-1), gh = grad(hx, hy);
          st.v = [0.78 * st.v[0] - 0.026 * gh[0], 0.78 * st.v[1] - 0.026 * gh[1]];
          st.heavy.push(clamp([hx + st.v[0], hy + st.v[1]]));
        },
        draw(st, t) {
          floor(); floorContours(m, 0.4); drawMesh(m);
          const glide = p => p.length < 2 ? p : [...p.slice(0, -1), [lerp(p.at(-2)[0], p.at(-1)[0], t), lerp(p.at(-2)[1], p.at(-1)[1], t)]];
          const a = glide(st.plain), b = glide(st.heavy);
          const trail = (pts, col) => glowLine(pts.map(([x, y]) => [x, y, zf(x, y) + 0.012]), col, 2.6);
          trail(a, C.blue); trail(b, C.yellow);
          dot(0, 0, 0.012, 3, C.ink, false);
          const [px, py] = a.at(-1), [hx, hy] = b.at(-1);
          dot(px, py, zf(px, py) + 0.04, 7, C.blue); dot(hx, hy, zf(hx, hy) + 0.04, 7, C.yellow);
        },
        legend: [["gradient descent", C.blue], ["with momentum", C.yellow]],
      };
    })(),

    lagrange: (() => {
      const cx = 0.75, cy = 0.45, home = 0.62;
      let R = home;
      const f = (x, y) => Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / 0.55);
      const m = mesh(40, 40, f, levels(9));
      const ang = Math.atan2(cy, cx);
      const ring = (r, ox, oy, z = 0) => { const pts = []; for (let k = 0; k <= 120; k++) { const t = k / 120 * TAU; pts.push([ox + r * Math.cos(t), oy + r * Math.sin(t), z]); } return pts; };
      const inSquare = pts => pts.filter(([x, y]) => Math.abs(x) <= 1 && Math.abs(y) <= 1);
      return {
        steps: 160, every: 28, zTop: 1.3,
        hint: "Drag to turn it. Click the hill to make the circle bigger or smaller.",
        surface: (x, y) => f(x, y) * LIFT,
        click(x, y) { R = Math.min(0.95, Math.max(0.2, Math.hypot(x, y))); return true; },
        reset() { R = home; },
        init: () => ({ t: 0 }),
        step(st) { st.t++; },
        draw(st, tf) {
          const best = [R * Math.cos(ang), R * Math.sin(ang)], fBest = f(...best), touch = Math.abs(Math.hypot(cx, cy) - R);
          const tt = st.t + tf;
          floor(); floorContours(m, 0.5);
          line(inSquare(ring(touch, cx, cy)), C.yellow, 2, 0.9, [6, 6]);  // the level curve that just touches the circle
          glowLine(ring(R, 0, 0), C.blue, 2.6);
          drawMesh(m);
          glowLine(ring(R, 0, 0).map(([x, y]) => [x, y, f(x, y) * LIFT + 0.01]), C.yellow, 3);  // the hill along the circle
          // a point travels once round the circle and settles at the top
          const settle = Math.min(1, tt / 130), th = ang + TAU * (1 - settle) ** 2;
          const x = R * Math.cos(th), y = R * Math.sin(th);
          line([[x, y, 0], [x, y, f(x, y) * LIFT]], C.faint, 1.2, 0.8, [3, 4]);
          dot(x, y, 0.01, 4.5, C.blue, false);
          dot(x, y, f(x, y) * LIFT + 0.03, 7, tt > 128 ? C.red : C.ink);
          if (tt > 128) {
            const [bx, by] = best, u = [Math.cos(ang), Math.sin(ang)];
            g.globalAlpha = Math.min(1, (tt - 128) / 20);
            line([[bx, by, 0.01], [bx + u[0] * 0.3, by + u[1] * 0.3, 0.01]], C.blue, 3);
            line([[bx, by, 0.01], [bx + u[0] * 0.24, by + u[1] * 0.24, 0.01]], C.yellow, 3);
            text("∇f = λ∇g", bx + 0.05, by - 0.2, fBest * LIFT + 0.25, C.ink, "center", 16);
            g.globalAlpha = 1;
          }
        },
        legend: [["constraint g = r", C.blue], ["the hill f along it", C.yellow]],
      };
    })(),

    clt: (() => {
      const w = [3, 1, 1, 1, 1, 3].map(v => v / 10), N = 12, NU = 64;
      const dists = [[1]];  // dists[n][k]: chance the n rolls sum to n + k
      for (let n = 1; n <= N; n++) { const prev = dists[n - 1], next = new Array(prev.length + 5).fill(0); prev.forEach((p, k) => w.forEach((q, f) => next[k + f] += p * q)); dists.push(next); }
      const dens = (n, mean) => {  // the average of n rolls lands on steps of 1/n; each step drawn as a narrow bell
        const h = 0.16 + 0.3 / n;
        return dists[n].reduce((sum, p, k) => sum + p * Math.exp(-((1 + k / n - mean) ** 2) / (2 * h * h)), 0) / (h * Math.sqrt(TAU));
      };
      let top = 0; for (let n = 1; n <= N; n++) for (let i = 0; i < NU; i++) top = Math.max(top, dens(n, 1 + 5 * i / (NU - 1)));
      const m = mesh(NU, N, (u, v, i, j) => dens(j + 1, 1 + 5 * i / (NU - 1)) / top, levels(6));
      let slider = null;
      return {
        steps: N - 1, every: 480, zTop: LIFT + 0.08,
        hint: "Drag to turn it. Slide to choose how many rolls are averaged.",
        init: () => ({ row: 0 }),
        step(st) { st.row = Math.min(st.row + 1, N - 1); },
        row: (st, t) => st.manual ? st.row : Math.min(st.row + t, N - 1),
        draw(st, t) {
          const r = this.row(st, t);
          floor(); floorContours(m, 0.45); drawMesh(m, { glow: r, rows: 1, contours: false }); rowSlice(m, r, C.yellow);
          text("average roll", 0, -1.2, 0); text("1", -1, -1.1, 0); text("6", 1, -1.1, 0);
          text("n = 1", 1.1, -1, 0, C.faint, "left"); text("n = 12", 1.1, 1, 0, C.faint, "left");
          if (slider && !st.manual) slider.value = Math.round(r) + 1;
        },
        controls(ui) {
          slider = ui.slider("rolls averaged", 1, N, 1, v => ui.hold(st => { st.row = v - 1; }));
        },
        status(st, t) { const n = Math.round(this.row(st, t)) + 1; return `average of ${n} roll${n > 1 ? "s" : ""}`; },
        legend: [["one lopsided die, mostly 1s and 6s", C.green]],
      };
    })(),

    bayes: (() => {
      const N = 41, NU = 60, seeded = [];
      for (let k = 0; k < N - 1; k++) seeded.push(rand() < 0.7);
      const lg = x => { const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]; let y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t); let s = 1.000000000190015; for (const q of c) s += q / ++y; return -t + Math.log(2.5066282746310005 * s / x); };
      const beta = (p, [a, b]) => Math.exp(a * Math.log(p) + b * Math.log(1 - p) + lg(a + b + 2) - lg(a + 1) - lg(b + 1));  // Beta(a + 1, b + 1)
      let flips, shown, counts, m;
      const build = fl => {  // the last 40 flips are drawn, one row each; counts include any flips before them
        flips = fl; shown = flips.slice(-(N - 1));
        const before = flips.slice(0, flips.length - shown.length), h0 = before.filter(Boolean).length;
        counts = [[h0, before.length - h0]];
        shown.forEach(h => { const [a, b] = counts.at(-1); counts.push(h ? [a + 1, b] : [a, b + 1]); });
        const raw = counts.map(c => Array.from({ length: NU }, (_, i) => beta((i + 0.5) / NU, c)));
        const top = Math.max(6.5, ...raw.flat());
        m = mesh(NU, N, (u, v, i, j) => j < raw.length ? raw[j][i] / top : 0, levels(6));
      };
      build(seeded);
      return {
        steps: N - 1, every: 240, zTop: LIFT + 0.08,
        hint: "Drag to turn it. Flip the coin yourself to see the belief move.",
        reset() { build(seeded); },
        init: () => ({ row: 0 }),
        step(st) { st.row = Math.min(st.row + 1, shown.length); },
        row: (st, t) => st.manual ? st.row : Math.min(st.row + t, shown.length),
        draw(st, t) {
          const r = this.row(st, t);
          floor();
          line([[0.4, -1, 0.004], [0.4, 1, 0.004]], C.yellow, 1.6, 0.85, [6, 6]);  // the true bias, 0.7
          shown.forEach((h, k) => { if (k < r) dot(-1.08, gx(N, k + 1), 0, 2.6, h ? C.yellow : C.faint, false); });
          drawMesh(m, { glow: r, upTo: Math.max(r, 0.02), rows: 4, contours: false }); rowSlice(m, r, C.yellow);
          text("bias of the coin", 0, -1.2, 0); text("0", -1, -1.1, 0); text("1", 1, -1.1, 0); text("0.7", 0.4, -1.1, 0, C.yellow);
        },
        controls(ui) {
          const flip = h => ui.hold(st => {
            build([...(st.manual ? flips : flips.slice(0, flips.length - shown.length + Math.round(this.row(st, 0)))), h]);
            st.row = shown.length;
          });
          ui.button("Heads", () => flip(true)); ui.button("Tails", () => flip(false));
          ui.button("Clear", () => ui.hold(st => { build([]); st.row = 0; }));
        },
        status(st, t) { const [a, b] = counts[Math.round(this.row(st, t))]; return `${a} head${a === 1 ? "" : "s"}, ${b} tail${b === 1 ? "" : "s"}`; },
        legend: [["heads", C.yellow], ["tails", C.faint]],
      };
    })(),

    walk: (() => {
      const NV = 40, NU = 56, T0 = 0.1, sig = t => 0.42 * Math.sqrt(t);
      const tAt = j => T0 + (1 - T0) * j / (NV - 1);
      const pdf = (x, t) => Math.exp(-x * x / (2 * sig(t) ** 2)) / sig(t);
      const top = pdf(0, T0);
      const m = mesh(NU, NV, (u, v, i, j) => pdf(u, tAt(j)) / top, levels(6));
      // each walk starts with the same spread as the first row, then takes independent steps
      let walks;
      const newWalks = () => { walks = Array.from({ length: 26 }, () => { const p = [gauss() * sig(T0)]; for (let j = 1; j < NV; j++) p.push(p.at(-1) + gauss() * Math.sqrt(sig(tAt(j)) ** 2 - sig(tAt(j - 1)) ** 2)); return p; }); };
      newWalks();
      const cl = x => Math.max(-1, Math.min(1, x));
      return {
        steps: NV - 1, every: 170, zTop: LIFT + 0.08,
        hint: "Drag to turn it. Ask for new walks to see the same bell again.",
        init: () => ({ row: 0 }),
        step(st) { st.row = Math.min(st.row + 1, NV - 1); },
        draw(st, t) {
          const r = Math.min(st.row + t, NV - 1), j0 = Math.floor(r), j1 = Math.min(j0 + 1, NV - 1), f = r - j0, y = lerp(gx(NV, j0), gx(NV, j1), f);
          floor(); floorContours(m, 0.35);
          for (const sign of [1, -1]) { const pts = []; for (let j = 0; j < NV; j++) pts.push([sign * 2 * sig(tAt(j)), gx(NV, j), 0.003]); line(pts.filter(([x]) => Math.abs(x) <= 1), C.yellow, 1.8, 0.85); }
          const now = walks.map(p => cl(lerp(p[j0], p[j1], f)));
          walks.forEach((p, k) => {
            const pts = p.slice(0, j0 + 1).map((x, j) => [cl(x), gx(NV, j), 0.004]); pts.push([now[k], y, 0.004]);
            line(pts, C.blue, 1.4, 0.6);
            dot(now[k], y, 0.006, 2.4, C.blue, false);
          });
          drawMesh(m, { glow: r, alpha: 0.82, rows: 3, contours: false }); rowSlice(m, r, C.yellow);  // a little see-through, so the walks show beneath
          const tr = lerp(tAt(j0), tAt(j1), f);
          for (const x of now) dot(x, y, pdf(x, tr) / top * LIFT + 0.02, 3.2, C.blue, false);  // where each walk is now, riding on the bell
          text("position", 0, -1.2, 0); text("time", 1.12, 0, 0, C.faint, "left");
          text("±2√t", 2 * sig(1) + 0.05, 1.08, 0, C.yellow, "left");
        },
        controls(ui) { ui.button("New walks", () => { newWalks(); ui.replay(); }); },
        legend: [["coin-flip walks", C.blue], ["the bell they spread into", C.yellow]],
        view: [2.55, 0.72],  // the narrow bell at the back, spreading toward you
      };
    })(),
  };

  // ---------------------------------------------------------------- tabs, controls, dragging and the loop
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const caption = root.querySelector(".math3d-caption");
  const hint = root.querySelector(".math3d-hint");
  const bar = document.createElement("div");
  bar.className = "math3d-controls";
  canvas.after(bar);
  const items = Object.fromEntries([...list.querySelectorAll("li[data-scene]")].map(li => [li.dataset.scene, li]));
  let name = tabs[0].dataset.scene, scene = scenes[name], state, stepsDone, acc = 0, hold = 0, last = 0, onScreen = false, lastTouch = -1e9, paused = false, pauseBtn = null;
  const restart = () => {
    state = scene.init(); stepsDone = 0; acc = 0; hold = 0;
    if (reduce) while (stepsDone < scene.steps) { scene.step(state); stepsDone++; }
  };
  const setPaused = p => { paused = p; if (pauseBtn) { pauseBtn.textContent = p ? "Play" : "Pause"; pauseBtn.setAttribute("aria-pressed", p); } };
  const ui = {
    button(label, fn, cls) {
      const b = document.createElement("button"); b.type = "button"; b.textContent = label; if (cls) b.className = cls;
      b.addEventListener("click", () => { fn(); paint(); }); bar.appendChild(b); return b;
    },
    slider(label, min, max, value, fn) {
      const l = document.createElement("label"), s = document.createElement("input");
      s.type = "range"; s.min = min; s.max = max; s.step = 1; s.value = value;
      s.addEventListener("input", () => { fn(+s.value); paint(); });
      l.append(label, s); bar.appendChild(l); return s;
    },
    hold(change) { state.manual = true; stepsDone = scene.steps; change(state); },  // the reader takes over: stop playing on its own
    replay() { restart(); setPaused(false); },
  };
  const choose = (tab, focus) => {
    tabs.forEach(t => { const on = t === tab; t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1; });
    name = tab.dataset.scene; scene = scenes[name]; restart(); setPaused(false);
    zTop = scene.zTop || LIFT + 0.1;
    const v = scene.view || [-0.75, 0.55];
    if (reduce || !W || !onScreen) { [yaw, pitch] = v; goal = null; } else goal = v;
    fit();
    const li = items[name];
    if (li) { caption.innerHTML = li.innerHTML; canvas.setAttribute("aria-label", li.dataset.alt || li.textContent); }
    hint.textContent = scene.hint || "Drag to turn it.";
    bar.replaceChildren();
    scene.controls?.(ui);
    const spacer = document.createElement("span"); spacer.className = "spacer"; bar.appendChild(spacer);
    pauseBtn = reduce ? null : ui.button("Pause", () => setPaused(!paused), "quiet");
    if (pauseBtn) pauseBtn.setAttribute("aria-pressed", "false");
    ui.button("Replay", () => { scene.reset?.(); ui.replay(); }, "quiet");
    if (focus) tab.focus();
    paint();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => { choose(tab); history.replaceState(null, "", `#math-${tab.dataset.scene}`); });
    tab.addEventListener("keydown", e => {
      const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (k) { e.preventDefault(); choose(tabs[(i + k + tabs.length) % tabs.length], true); }
    });
  });

  // A click (not a drag) on the scene hands the nearest point of the surface to the scene, if it wants one
  const pick = (sx, sy) => {
    let best = null, bd = Infinity;
    for (let i = 0; i <= 48; i++) for (let j = 0; j <= 48; j++) {
      const x = -1 + i / 24, y = -1 + j / 24, [px, py, depth] = P(x, y, scene.surface ? scene.surface(x, y) : 0);
      const d = Math.hypot(px - sx, py - sy);
      if (d > 40) continue;
      const score = d + Math.max(0, depth) * 8;  // nearer the camera wins, so a click lands on the side you see
      if (score < bd) { bd = score; best = [x, y]; }
    }
    if (best && scene.click(...best)) { restart(); setPaused(false); paint(); }
  };
  let drag = null;
  canvas.addEventListener("pointerdown", e => { drag = [e.clientX, e.clientY, yaw, pitch]; goal = null; canvas.setPointerCapture(e.pointerId); lastTouch = performance.now(); canvas.classList.add("grabbing"); });
  canvas.addEventListener("pointermove", e => {
    if (!drag) return;
    yaw = drag[2] - (e.clientX - drag[0]) * 0.008;
    pitch = Math.min(1.25, Math.max(0.12, drag[3] + (e.clientY - drag[1]) * 0.005));
    fit();
    lastTouch = performance.now();
    if (reduce || !onScreen) paint();
  });
  const end = e => {
    if (drag && scene.click && Math.hypot(e.clientX - drag[0], e.clientY - drag[1]) < 6) {
      const r = canvas.getBoundingClientRect(); pick(e.clientX - r.left, e.clientY - r.top);
    }
    drag = null; canvas.classList.remove("grabbing");
  };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", () => { drag = null; canvas.classList.remove("grabbing"); });

  const size = () => {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    fit();
  };
  function paint() {
    if (!W) return;
    const t = stepsDone < scene.steps ? Math.min(acc / scene.every, 1) : 1;
    const bg = g.createRadialGradient(W / 2, H * 0.5, 0, W / 2, H * 0.5, Math.max(W, H) * 0.75);
    bg.addColorStop(0, "#151a2b"); bg.addColorStop(1, C.bg);
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    scene.draw(state, t);
    if (scene.status) { g.font = "italic 16px Newsreader, Georgia, serif"; g.textAlign = "right"; g.fillStyle = C.yellow; g.fillText(scene.status(state, t), W - 18, 30); }
    g.font = "italic 14px Newsreader, Georgia, serif"; g.textAlign = "left";
    if (W >= 480) scene.legend.forEach(([s, col], i) => { g.fillStyle = col; g.fillRect(16, 21 + i * 20, 14, 3); g.fillText(s, 36, 26 + i * 20); });
  }
  const frame = now => {
    if (!onScreen) return;
    const dt = Math.min(now - (last || now), 100); last = now;
    if (goal && !drag) {  // glide to the new scene's view
      const k = 1 - Math.exp(-dt / 160), dy = ((goal[0] - yaw + Math.PI) % TAU + TAU) % TAU - Math.PI;
      yaw += dy * k; pitch += (goal[1] - pitch) * k; fit();
      if (Math.abs(dy) < 0.002 && Math.abs(goal[1] - pitch) < 0.002) goal = null;
    }
    if (!drag) fit(1 - Math.exp(-dt / 700));
    if (!reduce && !paused) {
      if (!goal && now - lastTouch > 2500 && !drag) yaw += dt * 0.00012;  // a slow turn when left alone
      if (stepsDone < scene.steps) { acc += dt; while (acc >= scene.every && stepsDone < scene.steps) { acc -= scene.every; scene.step(state); stepsDone++; } }
      else if (!state.manual && (hold += dt) > 4000) restart();
    }
    paint();
    requestAnimationFrame(frame);
  };

  // A link to interests.html#math-bayes (and so on) opens that tab; the ids sit on the no-JS list items
  const fromHash = () => {
    const tab = tabs.find(t => location.hash === `#math-${t.dataset.scene}`);
    if (!tab) return false;
    choose(tab);
    requestAnimationFrame(() => root.scrollIntoView({ block: "start" }));
    return true;
  };
  size();
  new ResizeObserver(() => { size(); paint(); }).observe(canvas);
  if (!fromHash()) choose(tabs[0]);
  addEventListener("hashchange", fromHash);
  new IntersectionObserver(([e]) => {
    const was = onScreen; onScreen = e.isIntersecting;
    if (onScreen && !was) { last = 0; requestAnimationFrame(frame); }
  }).observe(canvas);
})();
