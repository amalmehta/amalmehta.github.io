// Chaos, part 2: the player and its seven scenes, fetched by chaos.js only when one is about to play.
// Each scene is drawn in the page's own ink on its own paper in about two seconds, then fades into the
// page; any click, key, scroll or touch skips it. Every scene computes its maths up front, then reveals it.
//   0 Lorenz attractor          two paths 0.00001 apart part ways
//   1 Double pendulum           two pendulums let go 0.001 radians apart
//   2 Logistic map              order splitting into chaos
//   3 Three bodies              Burrau's problem: masses 3, 4 and 5, starting at rest
//   4 De Jong attractor         one point, two equations, 160,000 steps
//   5 Reward landscape          an agent climbing by gradient ascent
//   6 Neural decoding           32 simulated neurons decoded into four reaches
(() => {
  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const still = params.has("chaos-still");  // draw the last frame and stay (for checking)
  const pick = +(root.dataset.chaos || 0);

  // RK4 for a state vector
  const rk4 = (f, p, dt) => {
    const k1 = f(p), a = p.map((v, i) => v + dt / 2 * k1[i]);
    const k2 = f(a), b = p.map((v, i) => v + dt / 2 * k2[i]);
    const k3 = f(b), c = p.map((v, i) => v + dt * k3[i]);
    const k4 = f(c);
    return p.map((v, i) => v + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  };
  const polyline = (g, pts, from, to, colour) => {
    if (to - from < 2) return;
    g.strokeStyle = colour;
    g.beginPath();
    g.moveTo(pts[from][0], pts[from][1]);
    for (let i = from + 1; i < to; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.stroke();
  };
  const dot = (g, x, y, r, colour) => { g.fillStyle = colour; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill(); };

  const SCENES = [
    // 0. Lorenz attractor: drawn as one ink line until the two paths part, then blue and rust.
    { caption: "Lorenz, 1963 · two paths that start 0.00001 apart", make(g, W, H, ink) {
      const f = ([x, y, z]) => [10 * (y - x), x * (28 - z) - y, x * y - 8 / 3 * z];
      let seed = [1, 1, 1];
      for (let i = 0; i < 800; i++) seed = rk4(f, seed, 0.006);
      const sc = Math.min(W / 52, H / 62), cx = W / 2, cy = H / 2 + 25 * sc - 8, N = 5400;
      const raw = [seed, [seed[0] + 0.00001, seed[1], seed[2]]].map((p) => {
        const out = [];
        for (let i = 0; i < N; i++) { p = rk4(f, p, 0.006); out.push(p); }
        return out;
      });
      let split = raw[0].findIndex((p, i) => Math.hypot(p[0] - raw[1][i][0], p[1] - raw[1][i][1], p[2] - raw[1][i][2]) > 0.3);
      if (split < 0) split = N;
      const pts = raw.map((r) => r.map(([x, y, z]) => [cx + (x + 0.18 * y) * sc, cy - z * sc]));
      return (k) => {
        g.clearRect(0, 0, W, H);
        const n = Math.floor(N * k);
        g.lineWidth = 1.1; g.globalAlpha = 0.7;
        polyline(g, pts[0], 0, Math.min(n, split + 1), ink.text);
        if (n > split) { polyline(g, pts[0], split, n, ink.accent); polyline(g, pts[1], split, n, ink.warm); }
      };
    } },

    // 1. Double pendulum: two of them, let go 0.001 radians apart, trace one shape, then two.
    { caption: "Two double pendulums, let go 0.001 radians apart", make(g, W, H, ink) {
      const G = 9.81;
      const f = ([a1, a2, w1, w2]) => {
        const d = a1 - a2, den = 3 - Math.cos(2 * d);
        return [w1, w2,
          (-3 * G * Math.sin(a1) - G * Math.sin(a1 - 2 * a2) - 2 * Math.sin(d) * (w2 * w2 + w1 * w1 * Math.cos(d))) / den,
          (2 * Math.sin(d) * (2 * w1 * w1 + 2 * G * Math.cos(a1) + w2 * w2 * Math.cos(d))) / den];
      };
      const L = Math.min(W, H) * 0.19, px = W / 2, py = H * 0.42, N = 2600;
      const runs = [[2.4, 2.6, 0, 0], [2.401, 2.6, 0, 0]].map((s) => {
        const out = [];
        for (let i = 0; i < N; i++) {
          s = rk4(f, s, 0.004);
          const x1 = px + L * Math.sin(s[0]), y1 = py + L * Math.cos(s[0]);
          out.push([x1 + L * Math.sin(s[1]), y1 + L * Math.cos(s[1]), x1, y1]);
        }
        return out;
      });
      let split = runs[0].findIndex((p, i) => Math.hypot(p[0] - runs[1][i][0], p[1] - runs[1][i][1]) > L * 0.08);
      if (split < 0) split = N;
      return (k) => {
        g.clearRect(0, 0, W, H);
        const n = Math.max(2, Math.floor(N * k));
        g.lineWidth = 1; g.globalAlpha = 0.55;
        polyline(g, runs[0], 0, Math.min(n, split + 1), ink.text);
        if (n > split) { polyline(g, runs[0], split, n, ink.accent); polyline(g, runs[1], split, n, ink.warm); }
        g.globalAlpha = 0.95; g.lineWidth = 2.2;
        runs.forEach((run, j) => {
          const [x2, y2, x1, y1] = run[n - 1], c = n > split ? (j ? ink.warm : ink.accent) : ink.text;
          g.strokeStyle = c;
          g.beginPath(); g.moveTo(px, py); g.lineTo(x1, y1); g.lineTo(x2, y2); g.stroke();
          dot(g, x1, y1, 4, c); dot(g, x2, y2, 6, c);
        });
        dot(g, px, py, 3.5, ink.text);
      };
    } },

    // 2. Logistic map: x -> r x (1 - x), swept left to right; period doubling in ink, chaos in rust.
    { caption: "The logistic map, x → rx(1 − x): order splitting into chaos", make(g, W, H, ink) {
      const x0 = W * 0.08, w = W * 0.84, y0 = H * 0.16, h = H * 0.62, cols = Math.min(1000, Math.floor(w)), per = 90;
      const ys = new Float32Array(cols * per);
      for (let c = 0; c < cols; c++) {
        const r = 2.6 + 1.4 * c / (cols - 1);
        let x = 0.5;
        for (let i = 0; i < 300; i++) x = r * x * (1 - x);
        for (let i = 0; i < per; i++) { x = r * x * (1 - x); ys[c * per + i] = y0 + (1 - x) * h; }
      }
      let done = 0;
      return (k) => {
        const upto = Math.floor(cols * k);
        g.globalAlpha = 0.4;
        for (let c = done; c < upto; c++) {
          const r = 2.6 + 1.4 * c / (cols - 1), xx = x0 + w * c / (cols - 1);
          g.fillStyle = r < 3.5699 ? ink.text : ink.warm;
          for (let i = 0; i < per; i++) g.fillRect(xx, ys[c * per + i], 1.2, 1.2);
        }
        done = upto;
      };
    } },

    // 3. Three bodies: Burrau's Pythagorean problem, masses 3, 4 and 5 let go at rest at a 3-4-5 triangle.
    { caption: "Three bodies under gravity: masses 3, 4 and 5, let go at rest", make(g, W, H, ink) {
      const m = [3, 4, 5], p = [[1, 3], [-2, -1], [1, -1]], v = [[0, 0], [0, 0], [0, 0]];
      const acc = () => {
        const a = [[0, 0], [0, 0], [0, 0]];
        let r2min = 1e9;
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (i !== j) {
          const dx = p[j][0] - p[i][0], dy = p[j][1] - p[i][1], r2 = dx * dx + dy * dy, inv = m[j] / (r2 * Math.sqrt(r2));
          r2min = Math.min(r2min, r2);
          a[i][0] += dx * inv; a[i][1] += dy * inv;
        }
        return [a, Math.sqrt(r2min)];
      };
      const sc = Math.min(W, H) * 0.135, cx = W / 2, cy = H / 2 - H * 0.03;
      const trails = [[], [], []];
      let [a, r] = acc(), t = 0, next = 0;
      while (t < 34) {  // leapfrog, with the step shrinking during close passes
        const dt = Math.min(2e-3, 0.004 * r ** 1.5);
        for (let i = 0; i < 3; i++) { v[i][0] += a[i][0] * dt / 2; v[i][1] += a[i][1] * dt / 2; p[i][0] += v[i][0] * dt; p[i][1] += v[i][1] * dt; }
        [a, r] = acc();
        for (let i = 0; i < 3; i++) { v[i][0] += a[i][0] * dt / 2; v[i][1] += a[i][1] * dt / 2; }
        t += dt;
        if (t >= next) { next += 0.01; for (let i = 0; i < 3; i++) trails[i].push([cx + p[i][0] * sc, cy - p[i][1] * sc]); }
      }
      const colours = [ink.accent, ink.warm, ink.text], T = trails[0].length;
      return (k) => {
        g.clearRect(0, 0, W, H);
        const n = Math.max(2, Math.floor(T * k));
        g.lineWidth = 1.3; g.globalAlpha = 0.75;
        trails.forEach((t, i) => polyline(g, t, 0, n, colours[i]));
        g.globalAlpha = 1;
        trails.forEach((t, i) => dot(g, t[n - 1][0], t[n - 1][1], 2.2 * Math.sqrt(m[i]), colours[i]));
      };
    } },

    // 4. De Jong attractor: one point hopping by x' = sin(a y) - cos(b x), y' = sin(c x) - cos(d y).
    { caption: "A de Jong attractor: one point, two equations, 160,000 steps", make(g, W, H, ink) {
      const A = 1.4, B = -2.3, C = 2.4, D = -2.1, N = 160000, sc = Math.min(W, H) * 0.2, cx = W / 2, cy = H / 2 - H * 0.03;
      const xy = new Float32Array(N * 2);
      let x = 0.1, y = 0.1;
      for (let i = 0; i < N; i++) {
        const nx = Math.sin(A * y) - Math.cos(B * x), ny = Math.sin(C * x) - Math.cos(D * y);
        x = nx; y = ny; xy[2 * i] = cx + x * sc; xy[2 * i + 1] = cy + y * sc;
      }
      let done = 0;
      return (k) => {
        const upto = Math.floor(N * k);
        g.globalAlpha = 0.09;
        for (let i = done; i < upto; i++) {
          g.fillStyle = i % 3 === 0 ? ink.warm : ink.accent;
          g.fillRect(xy[2 * i], xy[2 * i + 1], 1.1, 1.1);
        }
        done = upto;
      };
    } },

    // 5. Reward landscape: contour lines of a field with several peaks, then an agent climbing by noisy gradient ascent.
    { caption: "An agent climbing a reward landscape by gradient ascent", make(g, W, H, ink) {
      const peaks = [[0.72, 0.36, 1.0, 0.13], [0.3, 0.6, 0.72, 0.14], [0.5, 0.18, 0.45, 0.1], [0.18, 0.26, 0.38, 0.09], [0.84, 0.76, 0.55, 0.11]];
      const field = (x, y) => peaks.reduce((s, [px, py, a, w]) => s + a * Math.exp(-((x - px) ** 2 + (y - py) ** 2) / (2 * w * w)), 0);
      const bx = W * 0.08, bw = W * 0.84, by = H * 0.12, bh = H * 0.68;
      const nx = 110, ny = Math.round(nx * bh / bw), Z = [];
      for (let j = 0; j <= ny; j++) { Z.push([]); for (let i = 0; i <= nx; i++) Z[j].push(field(i / nx, j / ny)); }
      const levels = [];
      for (let l = 0.06; l < 1.0; l += 0.065) levels.push(l);
      // Marching squares: each level becomes a list of segments in screen space.
      const P = (i, j) => [bx + bw * i / nx, by + bh * j / ny];
      const lerp = (a, b, za, zb, l) => { const t = (l - za) / (zb - za); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; };
      const segs = levels.map((l) => {
        const out = [];
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
          const z = [Z[j][i], Z[j][i + 1], Z[j + 1][i + 1], Z[j + 1][i]], c = [P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)];
          const hits = [];
          for (let e = 0; e < 4; e++) {
            const a = e, b = (e + 1) % 4;
            if ((z[a] >= l) !== (z[b] >= l)) hits.push(lerp(c[a], c[b], z[a], z[b], l));
          }
          if (hits.length >= 2) out.push(hits[0], hits[1]);
          if (hits.length === 4) out.push(hits[2], hits[3]);
        }
        return out;
      });
      // The agent: gradient ascent with momentum and shrinking noise, from the low ground.
      let ax = 0.08, ay = 0.9, vx = 0, vy = 0, seed = 7;
      const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; };
      const path = [];
      for (let s = 0; s < 420; s++) {
        const e = 1e-3, gx = (field(ax + e, ay) - field(ax - e, ay)) / (2 * e), gy = (field(ax, ay + e) - field(ax, ay - e)) / (2 * e);
        const noise = 0.006 * (1 - s / 420);
        vx = 0.85 * vx + 0.0016 * gx + noise * rnd(); vy = 0.85 * vy + 0.0016 * gy + noise * rnd();
        ax = Math.min(0.99, Math.max(0.01, ax + vx)); ay = Math.min(0.99, Math.max(0.01, ay + vy));
        path.push([bx + bw * ax, by + bh * ay]);
      }
      return (k) => {
        g.clearRect(0, 0, W, H);
        const lk = Math.min(1, k / 0.5), shown = Math.floor(levels.length * lk + 0.999);
        g.lineWidth = 1;
        for (let l = 0; l < shown; l++) {
          g.globalAlpha = (0.25 + 0.5 * l / levels.length) * Math.min(1, levels.length * lk - l);
          g.strokeStyle = ink.text;
          g.beginPath();
          const s = segs[l];
          for (let q = 0; q < s.length; q += 2) { g.moveTo(s[q][0], s[q][1]); g.lineTo(s[q + 1][0], s[q + 1][1]); }
          g.stroke();
        }
        const ak = Math.max(0, (k - 0.3) / 0.7), n = Math.floor(path.length * ak);
        if (n > 1) {
          g.globalAlpha = 0.95; g.lineWidth = 2.2;
          polyline(g, path, 0, n, ink.warm);
          const [hx, hy] = path[n - 1];
          dot(g, hx, hy, 5, ink.warm);
          if (k >= 1) {  // a little summit flag
            g.strokeStyle = ink.text; g.lineWidth = 1.6;
            g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx, hy - 26); g.stroke();
            g.fillStyle = ink.warm; g.beginPath(); g.moveTo(hx, hy - 26); g.lineTo(hx + 16, hy - 21); g.lineTo(hx, hy - 16); g.fill();
          }
        }
      };
    } },

    // 6. Neural decoding: a spike raster from 32 simulated neurons, each tuned to a direction, decoded by a
    //    population vector into four centre-out reaches.
    { caption: "32 simulated neurons, decoded into four reaches", make(g, W, H, ink) {
      const N = 32, dt = 0.01, seg = 0.6, bins = Math.round(8 * seg / dt), base = 22, gain = 28;
      const pd = Array.from({ length: N }, (_, i) => 2 * Math.PI * i / N + 0.3 * Math.sin(i * 7.1));
      const dirs = [0.785, 2.356, 3.927, 5.498];
      const vmax = 1.875 / seg;
      let seed = 11;
      const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      const spikes = [], cursor = [];
      let x = 0, y = 0, fx = 0, fy = 0;
      for (let b = 0; b < bins; b++) {
        const t = b * dt, s = Math.floor(t / seg), tau = (t - s * seg) / seg, dir = dirs[Math.floor(s / 2)];
        const sp = (30 * tau * tau - 60 * tau ** 3 + 30 * tau ** 4) / seg * (s % 2 ? -1 : 1);  // minimum-jerk speed, out then back
        const vx = sp * Math.cos(dir), vy = sp * Math.sin(dir);
        let dx = 0, dy = 0;
        for (let i = 0; i < N; i++) {
          const rate = Math.max(0, base + gain * (vx * Math.cos(pd[i]) + vy * Math.sin(pd[i])) / vmax);
          const fired = rnd() < rate * dt;
          if (fired) spikes.push([b, i]);
          dx += ((fired ? 1 : 0) - base * dt) * Math.cos(pd[i]); dy += ((fired ? 1 : 0) - base * dt) * Math.sin(pd[i]);
        }
        const k = 2 * vmax / (gain * dt * N);  // population vector, scaled back to a velocity
        fx += 0.15 * (dx * k - fx); fy += 0.15 * (dy * k - fy);
        x += fx * dt; y += fy * dt;
        cursor.push([x, y]);
      }
      const wide = W > H;
      const rx = W * 0.07, rw = wide ? W * 0.5 : W * 0.86, ry = H * (wide ? 0.2 : 0.1), rh = H * (wide ? 0.56 : 0.36);
      const ccx = wide ? W * 0.78 : W / 2, ccy = wide ? H * 0.48 : H * 0.68, R = wide ? Math.min(W * 0.15, H * 0.26) : Math.min(W * 0.36, H * 0.18);
      const cpts = cursor.map(([a, b]) => [ccx + a * R, ccy - b * R]);
      return (k) => {
        g.clearRect(0, 0, W, H);
        const upto = Math.floor(bins * k);
        g.globalAlpha = 0.75; g.fillStyle = ink.text;
        const rowH = rh / N;
        for (const [b, i] of spikes) {
          if (b >= upto) break;
          g.fillRect(rx + rw * b / bins, ry + i * rowH, 1.4, rowH * 0.7);
        }
        g.globalAlpha = 0.35; g.strokeStyle = ink.text; g.lineWidth = 1.5;
        for (const d of dirs) { g.beginPath(); g.arc(ccx + R * Math.cos(d), ccy - R * Math.sin(d), 11, 0, 6.2832); g.stroke(); }
        g.beginPath(); g.arc(ccx, ccy, 6, 0, 6.2832); g.stroke();
        if (upto > 1) {
          g.globalAlpha = 0.9; g.lineWidth = 2;
          polyline(g, cpts, 0, upto, ink.accent);
          dot(g, cpts[upto - 1][0], cpts[upto - 1][1], 5, ink.warm);
        }
      };
    } },
  ];

  const play = () => {
    if (performance.now() > 3200 && !still) { root.classList.remove("chaos-intro"); return; }  // too late: the veil has lifted
    const css = getComputedStyle(root);
    const v = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
    const ink = { text: v("--text", "#29241f"), accent: v("--accent", "#2f5d8a"), warm: v("--warm", "#9c5636") };
    const scene = SCENES[pick] || SCENES[0];

    const veil = document.createElement("div");
    veil.className = "chaos-loader";
    veil.setAttribute("aria-hidden", "true");
    const canvas = document.createElement("canvas");
    const cap = document.createElement("p");
    cap.className = "chaos-caption";
    cap.textContent = scene.caption;
    veil.append(canvas, cap);
    document.body.appendChild(veil);
    root.classList.remove("chaos-intro");

    const dpr = Math.min(devicePixelRatio || 1, 2), W = root.clientWidth || innerWidth, H = root.clientHeight || innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const g = canvas.getContext("2d");
    g.scale(dpr, dpr);
    g.lineCap = g.lineJoin = "round";
    const t = performance.now(), draw = scene.make(g, W, H, ink);
    if (still) { draw(1); root.dataset.chaosMs = String(Math.round(performance.now() - t)); return; }

    const DRAW = 1900, HOLD = 300, FADE = 500, ease = (k) => 1 - (1 - k) ** 1.6;
    let t0 = 0, finished = false;
    const events = ["pointerdown", "keydown", "wheel", "touchstart"];
    const finish = () => {
      if (finished) return;
      finished = true;
      veil.classList.add("chaos-out");
      setTimeout(() => veil.remove(), FADE + 50);
      for (const e of events) removeEventListener(e, finish);
    };
    for (const e of events) addEventListener(e, finish, { passive: true });
    const frame = (now) => {
      if (finished) return;
      t0 ||= now;
      const k = Math.min(1, (now - t0) / DRAW);
      draw(ease(k));
      if (k < 1) requestAnimationFrame(frame);
      else setTimeout(finish, HOLD);
    };
    requestAnimationFrame(frame);
    setTimeout(finish, DRAW + HOLD + 1500);  // a backstop if frames stall (a background tab)
  };

  if (document.body) play();
  else document.addEventListener("DOMContentLoaded", play, { once: true });
})();
