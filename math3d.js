// Interests, Math I love: one 3D scene with five tabs, in the dark blue-and-yellow style of 3Blue1Brown.
// Drag to turn it; left alone it turns slowly. Each tab is a surface with something moving on or under it:
//   Gradient descent: a narrow valley; plain steps zigzag across it, momentum glides down it.
//   Lagrange multipliers: a hill and a circle on the floor; the highest point of the hill above the circle
//     is where a level curve of the hill just touches the circle.
//   Central limit theorem: the spread of the average of n rolls of a lopsided die, for n = 1 to 12; the
//     lopsided shape at the front becomes a bell at the back.
//   Bayesian updating: the belief about a coin's bias after each of 40 flips, sharpening around 0.7.
//   Random walks: coin-flip walks on the floor, and the bell they spread into, wider like √t.
// Drawn on a plain canvas: a perspective projection and depth-sorted, lit quads, no library.
// With reduced motion nothing turns or moves on its own, and each scene shows its finished state.
// Without JS the section is a plain list of the five ideas.
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
  const C = { bg: "#121419", floor: "#1f232c", ink: "#ece6da", faint: "#8a8f9a", blue: "#58c4dd", yellow: "#ffd23f", green: "#83c167", red: "#fc6255" };
  const STOPS = [[0, [24, 52, 104]], [0.35, [40, 128, 170]], [0.62, [88, 196, 221]], [0.82, [131, 193, 103]], [1, [255, 210, 63]]];
  const LIGHT = (() => { const v = [-0.45, -0.55, 0.85], n = Math.hypot(...v); return v.map(c => c / n); })();
  const TAU = Math.PI * 2;
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

  // ---------------------------------------------------------------- the camera
  let yaw = -0.75, pitch = 0.55, W = 0, H = 0, scale = 1;
  const D = 4.2;  // camera distance, for a gentle perspective
  const P = (x, y, z) => {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const X = x * cy - y * sy, Y = x * sy + y * cy;
    const up = z * cp + Y * sp, depth = Y * cp - z * sp;
    const s = D / (D + depth);
    return [W / 2 + X * s * scale, H * 0.6 - (up - 0.3) * s * scale, depth];
  };
  const line = (pts, colour, width = 2, alpha = 1, dash) => {
    g.globalAlpha = alpha; g.strokeStyle = colour; g.lineWidth = width; g.lineJoin = g.lineCap = "round";
    if (dash) g.setLineDash(dash);
    g.beginPath(); pts.forEach(([x, y, z], i) => { const [sx, sy] = P(x, y, z); i ? g.lineTo(sx, sy) : g.moveTo(sx, sy); }); g.stroke();
    g.setLineDash([]); g.globalAlpha = 1;
  };
  const dot = (x, y, z, r, colour, glow = true) => {
    const [sx, sy] = P(x, y, z);
    if (glow) { const q = g.createRadialGradient(sx, sy, 0, sx, sy, r * 3); q.addColorStop(0, colour + "66"); q.addColorStop(1, colour + "00"); g.fillStyle = q; g.beginPath(); g.arc(sx, sy, r * 3, 0, TAU); g.fill(); }
    const q = g.createRadialGradient(sx - r * 0.35, sy - r * 0.35, r * 0.1, sx, sy, r);
    q.addColorStop(0, "#ffffff"); q.addColorStop(0.35, colour); q.addColorStop(1, colour);
    g.fillStyle = q; g.beginPath(); g.arc(sx, sy, r, 0, TAU); g.fill();
  };
  const text = (s, x, y, z, colour = C.faint, align = "center", size = 14) => {
    const [sx, sy] = P(x, y, z);
    g.fillStyle = colour; g.font = `italic ${size}px Newsreader, Georgia, serif`; g.textAlign = align; g.fillText(s, sx, sy);
  };

  // ---------------------------------------------------------------- surfaces
  // A surface is a grid of heights in [0, 1] over the floor square [-1, 1]²; z = height × LIFT
  const LIFT = 0.95;
  const mesh = (nu, nv, h) => {
    const z = [];
    for (let j = 0; j < nv; j++) { z.push([]); for (let i = 0; i < nu; i++) z[j].push(h(-1 + 2 * i / (nu - 1), -1 + 2 * j / (nv - 1), i, j)); }
    return { nu, nv, z };
  };
  const drawMesh = (m, glowRow, alpha = 1) => {
    const { nu, nv, z } = m, quads = [];
    const pt = (i, j) => [-1 + 2 * i / (nu - 1), -1 + 2 * j / (nv - 1), z[j][i] * LIFT];
    const pr = [];
    for (let j = 0; j < nv; j++) { pr.push([]); for (let i = 0; i < nu; i++) pr[j].push(P(...pt(i, j))); }
    for (let j = 0; j < nv - 1; j++) for (let i = 0; i < nu - 1; i++) {
      const a = pt(i, j), b = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1);
      const ux = c[0] - a[0], uy = c[1] - a[1], uz = c[2] - a[2], vx = d[0] - b[0], vy = d[1] - b[1], vz = d[2] - b[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const nn = Math.hypot(nx, ny, nz) || 1;
      nx /= nn; ny /= nn; nz /= nn; if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
      const lit = 0.42 + 0.58 * Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
      const h = (a[2] + b[2] + c[2] + d[2]) / 4 / LIFT, checker = (i + j) % 2 ? 1 : 0.955;
      const glow = glowRow != null && Math.abs(j + 0.5 - glowRow) < 1 ? 1.35 : 1;
      const col = colour(h).map(v => Math.min(255, v * lit * checker * glow) | 0);
      const ps = [pr[j][i], pr[j][i + 1], pr[j + 1][i + 1], pr[j + 1][i]];
      quads.push([ps, (ps[0][2] + ps[1][2] + ps[2][2] + ps[3][2]) / 4, `rgb(${col})`]);
    }
    quads.sort((p, q) => q[1] - p[1]);
    g.lineWidth = 0.8; g.globalAlpha = alpha;
    for (const [ps, , col] of quads) {
      g.fillStyle = g.strokeStyle = col; g.beginPath();
      g.moveTo(ps[0][0], ps[0][1]); for (let k = 1; k < 4; k++) g.lineTo(ps[k][0], ps[k][1]); g.closePath(); g.fill(); if (alpha === 1) g.stroke();
    }
    g.globalAlpha = 1;
  };
  const heightAt = (m, x, y) => {  // bilinear, for things that ride on a surface
    const fi = (x + 1) / 2 * (m.nu - 1), fj = (y + 1) / 2 * (m.nv - 1);
    const i = Math.min(Math.max(Math.floor(fi), 0), m.nu - 2), j = Math.min(Math.max(Math.floor(fj), 0), m.nv - 2), a = fi - i, b = fj - j;
    return ((1 - a) * (1 - b) * m.z[j][i] + a * (1 - b) * m.z[j][i + 1] + (1 - a) * b * m.z[j + 1][i] + a * b * m.z[j + 1][i + 1]) * LIFT;
  };
  const floor = () => {
    const sq = [[-1, -1, 0], [1, -1, 0], [1, 1, 0], [-1, 1, 0]].map(p => P(...p));
    g.fillStyle = C.floor; g.beginPath(); sq.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill();
    for (let k = -4; k <= 4; k++) {
      line([[k / 4, -1, 0], [k / 4, 1, 0]], "#2b303b", 1); line([[-1, k / 4, 0], [1, k / 4, 0]], "#2b303b", 1);
    }
  };
  const rowSlice = (m, row, colour) => {  // a bright curve along one row of the surface
    const pts = [];
    for (let i = 0; i < m.nu; i++) pts.push([-1 + 2 * i / (m.nu - 1), -1 + 2 * row / (m.nv - 1), m.z[row][i] * LIFT + 0.006]);
    line(pts, colour, 3.2);
  };

  // ---------------------------------------------------------------- the five scenes
  const scenes = {
    descent: (() => {
      const c = Math.cos(0.55), s = Math.sin(0.55), K = 2.2;
      const f = (x, y) => { const a = (x * c + y * s) * K, b = (-x * s + y * c) * K; return 0.15 * a * a + 1.6 * b * b; };
      const grad = (x, y) => { const a = (x * c + y * s) * K, b = (-x * s + y * c) * K, ga = 0.3 * a, gb = 3.2 * b; return [(c * ga - s * gb) * K, (s * ga + c * gb) * K]; };
      let top = 0; for (let i = 0; i <= 20; i++) for (let j = 0; j <= 20; j++) top = Math.max(top, f(-1 + i / 10, -1 + j / 10));
      const m = mesh(30, 30, (x, y) => Math.sqrt(f(x, y) / top));  // √ keeps the valley floor visible
      const zf = (x, y) => Math.sqrt(Math.max(f(x, y), 0) / top) * LIFT;
      const start = (() => { const a = -2.1 / K, b = 0.32 / K; return [a * c - b * s, a * s + b * c]; })();
      return {
        steps: 90, every: 75,
        init: () => ({ plain: [start], heavy: [start], v: [0, 0] }),
        step(st) {
          const [px, py] = st.plain.at(-1), gp = grad(px, py);
          st.plain.push([px - 0.11 * gp[0], py - 0.11 * gp[1]]);
          const [hx, hy] = st.heavy.at(-1), gh = grad(hx, hy);
          st.v = [0.78 * st.v[0] - 0.026 * gh[0], 0.78 * st.v[1] - 0.026 * gh[1]];
          st.heavy.push([hx + st.v[0], hy + st.v[1]]);
        },
        draw(st) {
          floor(); drawMesh(m);
          const trail = (pts, col) => line(pts.map(([x, y]) => [x, y, zf(x, y) + 0.012]), col, 2.6);
          trail(st.plain, C.blue); trail(st.heavy, C.yellow);
          const [px, py] = st.plain.at(-1), [hx, hy] = st.heavy.at(-1);
          dot(px, py, zf(px, py) + 0.04, 7, C.blue); dot(hx, hy, zf(hx, hy) + 0.04, 7, C.yellow);
          dot(0, 0, 0.012, 3, C.ink, false);
        },
        legend: [["gradient descent", C.blue], ["with momentum", C.yellow]],
      };
    })(),

    lagrange: (() => {
      const cx = 0.75, cy = 0.45, R = 0.62;
      const f = (x, y) => Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / 0.55);
      const m = mesh(32, 32, f);
      const ang = Math.atan2(cy, cx), best = [R * Math.cos(ang), R * Math.sin(ang)], fBest = f(...best);
      const ring = (r, ox, oy, z = 0) => { const pts = []; for (let k = 0; k <= 96; k++) { const t = k / 96 * TAU; pts.push([ox + r * Math.cos(t), oy + r * Math.sin(t), z]); } return pts; };
      const inSquare = pts => pts.filter(([x, y]) => Math.abs(x) <= 1 && Math.abs(y) <= 1);
      const touch = Math.hypot(cx, cy) - R;  // radius of the level curve of f that just touches the circle
      return {
        steps: 160, every: 30,
        init: () => ({ t: 0 }),
        step(st) { st.t++; },
        draw(st) {
          floor();
          for (const r of [0.25, 0.55, 0.85]) line(inSquare(ring(r, cx, cy)), "#3a4150", 1.2);
          line(inSquare(ring(touch, cx, cy)), C.yellow, 2, 0.9, [6, 6]);
          line(ring(R, 0, 0), C.blue, 2.6);
          drawMesh(m);
          // the circle lifted onto the hill: f along the constraint
          const lifted = ring(R, 0, 0).map(([x, y]) => [x, y, f(x, y) * LIFT + 0.01]);
          line(lifted, C.yellow, 3);
          // a point travels round the circle and settles at the top
          const settle = Math.min(1, st.t / 130), th = ang + TAU * (1 - settle) ** 2;  // once round, easing to the top
          const x = R * Math.cos(th), y = R * Math.sin(th);
          line([[x, y, 0], [x, y, f(x, y) * LIFT]], C.faint, 1.2, 0.8, [3, 4]);
          dot(x, y, 0.01, 4.5, C.blue, false);
          dot(x, y, f(x, y) * LIFT + 0.03, 6.5, st.t > 128 ? C.red : C.ink);
          if (st.t > 128) {
            const [bx, by] = best, u = [Math.cos(ang), Math.sin(ang)];
            g.globalAlpha = Math.min(1, (st.t - 128) / 20);
            line([[bx, by, 0.01], [bx + u[0] * 0.3, by + u[1] * 0.3, 0.01]], C.blue, 3);
            line([[bx, by, 0.01], [bx + u[0] * 0.24, by + u[1] * 0.24, 0.01]], C.yellow, 3);
            text("∇f = λ∇g", bx + 0.05, by - 0.2, fBest * LIFT + 0.25, C.ink, "center", 16);
            g.globalAlpha = 1;
          }
        },
        legend: [["constraint g = 1", C.blue], ["the hill f along it", C.yellow]],
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
      const m = mesh(NU, N, (u, v, i, j) => dens(j + 1, 1 + 5 * i / (NU - 1)) / top);
      return {
        steps: N, every: 520,
        init: () => ({ row: 0 }),
        step(st) { st.row = Math.min(st.row + 1, N - 1); },
        draw(st) {
          floor(); drawMesh(m, st.row); rowSlice(m, st.row, C.yellow);
          text("average roll", 0, -1.22, 0); text("1", -1, -1.12, 0); text("6", 1, -1.12, 0);
          text("n = 1", 1.12, -1, 0, C.faint, "left"); text("n = 12", 1.12, 1, 0, C.faint, "left");
        },
        status: st => `average of ${st.row + 1} roll${st.row ? "s" : ""}`,
        legend: [["one lopsided die, mostly 1s and 6s", C.green]],
      };
    })(),

    bayes: (() => {
      const N = 41, NU = 60, flips = [];
      for (let k = 0; k < N - 1; k++) flips.push(rand() < 0.7);
      const counts = [[0, 0]]; flips.forEach(h => { const [a, b] = counts.at(-1); counts.push(h ? [a + 1, b] : [a, b + 1]); });
      const beta = (p, [a, b]) => {  // Beta(a + 1, b + 1) density, through logs
        const lg = x => { const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]; let y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t); let s = 1.000000000190015; for (const q of c) s += q / ++y; return -t + Math.log(2.5066282746310005 * s / x); };
        return Math.exp(a * Math.log(p) + b * Math.log(1 - p) + lg(a + b + 2) - lg(a + 1) - lg(b + 1));
      };
      let top = 0; const raw = counts.map(c => { const r = []; for (let i = 0; i < NU; i++) { const d = beta((i + 0.5) / NU, c); r.push(d); top = Math.max(top, d); } return r; });
      const m = mesh(NU, N, (u, v, i, j) => raw[j][i] / top);
      return {
        steps: N, every: 260,
        init: () => ({ row: 0 }),
        step(st) { st.row = Math.min(st.row + 1, N - 1); },
        draw(st) {
          floor();
          line([[0.4, -1, 0.004], [0.4, 1, 0.004]], C.yellow, 1.6, 0.85, [6, 6]);  // the true bias, 0.7
          flips.forEach((h, k) => { if (k < st.row) dot(-1.08, -1 + 2 * (k + 1) / (N - 1), 0, 2.6, h ? C.yellow : C.faint, false); });
          drawMesh(m, st.row); rowSlice(m, st.row, C.yellow);
          text("bias of the coin", 0, -1.22, 0); text("0", -1, -1.12, 0); text("1", 1, -1.12, 0); text("0.7", 0.4, -1.12, 0, C.yellow);
        },
        status: st => { const [a, b] = counts[st.row]; return `${a} heads, ${b} tails`; },
        legend: [["heads", C.yellow], ["tails", C.faint]],
      };
    })(),

    walk: (() => {
      const NV = 40, NU = 56, T0 = 0.1, sig = t => 0.42 * Math.sqrt(t);
      const tAt = j => T0 + (1 - T0) * j / (NV - 1);
      const pdf = (x, t) => Math.exp(-x * x / (2 * sig(t) ** 2)) / sig(t);
      const top = pdf(0, T0);
      const m = mesh(NU, NV, (u, v, i, j) => pdf(u, tAt(j)) / top);
      // each walk starts with the same spread as the first row, then takes independent steps
      const walks = Array.from({ length: 26 }, () => { const p = [gauss() * sig(T0)]; for (let j = 1; j < NV; j++) p.push(p.at(-1) + gauss() * Math.sqrt(sig(tAt(j)) ** 2 - sig(tAt(j - 1)) ** 2)); return p; });
      return {
        steps: NV, every: 180,
        init: () => ({ row: 0 }),
        step(st) { st.row = Math.min(st.row + 1, NV - 1); },
        draw(st) {
          floor();
          for (const sign of [1, -1]) { const pts = []; for (let j = 0; j < NV; j++) pts.push([sign * 2 * sig(tAt(j)), -1 + 2 * j / (NV - 1), 0.003]); line(pts.filter(([x]) => Math.abs(x) <= 1), C.yellow, 1.8, 0.85); }
          for (const p of walks) {
            const pts = p.slice(0, st.row + 1).map((x, j) => [Math.max(-1, Math.min(1, x)), -1 + 2 * j / (NV - 1), 0.004]);
            line(pts, C.blue, 1.4, 0.55);
            const [x, y] = pts.at(-1); dot(x, y, 0.006, 2.4, C.blue, false);
          }
          drawMesh(m, st.row, 0.82); rowSlice(m, st.row, C.yellow);  // a little see-through, so the walks show beneath
          const y = -1 + 2 * st.row / (NV - 1);  // where each walk is now, riding on the bell
          for (const p of walks) { const x = Math.max(-1, Math.min(1, p[st.row])); dot(x, y, pdf(x, tAt(st.row)) / top * LIFT + 0.02, 3.2, C.blue, false); }
          text("position", 0, -1.22, 0); text("time", 1.14, 0, 0, C.faint, "left");
          text("±2√t", 2 * sig(1) + 0.05, 1.08, 0, C.yellow, "left");
        },
        legend: [["coin-flip walks", C.blue], ["the bell they spread into", C.yellow]],
        view: [2.55, 0.72],  // the narrow bell at the back, spreading toward you
      };
    })(),
  };

  // ---------------------------------------------------------------- tabs, dragging and the loop
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const caption = root.querySelector(".math3d-caption");
  const items = Object.fromEntries([...list.querySelectorAll("li[data-scene]")].map(li => [li.dataset.scene, li]));
  let name = tabs[0].dataset.scene, scene = scenes[name], state, stepsDone, acc = 0, hold = 0, last = 0, onScreen = false, lastTouch = -1e9;
  const restart = () => {
    state = scene.init(); stepsDone = 0; acc = 0; hold = 0;
    if (reduce) while (stepsDone < scene.steps) { scene.step(state); stepsDone++; }
  };
  const choose = (tab, focus) => {
    tabs.forEach(t => { const on = t === tab; t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1; });
    name = tab.dataset.scene; scene = scenes[name]; restart();
    [yaw, pitch] = scene.view || [-0.75, 0.55];
    const li = items[name];
    if (li) { caption.innerHTML = li.innerHTML; canvas.setAttribute("aria-label", li.dataset.alt || li.textContent); }
    if (focus) tab.focus();
    paint();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => choose(tab));
    tab.addEventListener("keydown", e => {
      const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (k) { e.preventDefault(); choose(tabs[(i + k + tabs.length) % tabs.length], true); }
    });
  });

  let drag = null;
  canvas.addEventListener("pointerdown", e => { drag = [e.clientX, e.clientY, yaw, pitch]; canvas.setPointerCapture(e.pointerId); lastTouch = performance.now(); canvas.classList.add("grabbing"); });
  canvas.addEventListener("pointermove", e => {
    if (!drag) return;
    yaw = drag[2] - (e.clientX - drag[0]) * 0.008;
    pitch = Math.min(1.25, Math.max(0.12, drag[3] + (e.clientY - drag[1]) * 0.005));
    lastTouch = performance.now();
    if (reduce || !onScreen) paint();
  });
  const end = () => { drag = null; canvas.classList.remove("grabbing"); };
  canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
  canvas.addEventListener("dblclick", () => restart());

  const size = () => {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height; scale = Math.min(W, H * 1.55) * 0.3;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  function paint() {
    if (!W) return;
    const bg = g.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, Math.max(W, H) * 0.7);
    bg.addColorStop(0, "#1a1e27"); bg.addColorStop(1, C.bg);
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    scene.draw(state);
    if (scene.status) { g.font = "italic 16px Newsreader, Georgia, serif"; g.textAlign = "right"; g.fillStyle = C.yellow; g.fillText(scene.status(state), W - 18, 30); }
    g.font = "italic 14px Newsreader, Georgia, serif"; g.textAlign = "left";
    if (W >= 480) scene.legend.forEach(([s, col], i) => { g.fillStyle = col; g.fillRect(16, H - 22 - (scene.legend.length - 1 - i) * 20, 14, 3); g.fillText(s, 36, H - 17 - (scene.legend.length - 1 - i) * 20); });
  }
  const frame = now => {
    if (!onScreen) return;
    const dt = Math.min(now - (last || now), 100); last = now;
    if (!reduce) {
      if (now - lastTouch > 2500 && !drag) yaw += dt * 0.00012;  // a slow turn when left alone
      if (stepsDone < scene.steps) { acc += dt; while (acc >= scene.every && stepsDone < scene.steps) { acc -= scene.every; scene.step(state); stepsDone++; } }
      else if ((hold += dt) > 3500) restart();
    }
    paint();
    requestAnimationFrame(frame);
  };

  size();
  new ResizeObserver(() => { size(); paint(); }).observe(canvas);
  choose(tabs[0]);
  new IntersectionObserver(([e]) => {
    const was = onScreen; onScreen = e.isIntersecting;
    if (onScreen && !was) { last = 0; requestAnimationFrame(frame); }
  }).observe(canvas);
})();
