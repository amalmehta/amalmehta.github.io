// Interests, Math I love: five small animations in the dark, blue-and-yellow style of 3Blue1Brown videos.
// Each canvas plays while it's on screen, pauses when scrolled away, loops, and restarts on a click.
// With reduced motion each one jumps straight to its finished picture. Without JS the cards show text only.
(() => {
  const C = { bg: "#15171c", grid: "#262a33", ink: "#ece6da", faint: "#8a8f9a", blue: "#58c4dd", yellow: "#ffd23f", green: "#83c167", red: "#fc6255" };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TAU = Math.PI * 2;

  const label = (g, text, x, y, color = C.faint, align = "left") => {
    g.fillStyle = color; g.font = "italic 13px Newsreader, Georgia, serif"; g.textAlign = align; g.fillText(text, x, y);
  };
  const arrow = (g, x0, y0, x1, y1, color) => {
    const a = Math.atan2(y1 - y0, x1 - x0);
    g.strokeStyle = g.fillStyle = color; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    g.beginPath(); g.moveTo(x1, y1);
    g.lineTo(x1 - 9 * Math.cos(a - 0.4), y1 - 9 * Math.sin(a - 0.4)); g.lineTo(x1 - 9 * Math.cos(a + 0.4), y1 - 9 * Math.sin(a + 0.4));
    g.closePath(); g.fill();
  };
  // A small seeded random, so each loop differs but nothing depends on Math.random's quality
  let seed = Date.now() % 2147483647;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const gauss = () => Math.sqrt(-2 * Math.log(rand() + 1e-12)) * Math.cos(TAU * rand());

  const scenes = {
    // Sums of five rolls of a lopsided die (mostly 1s and 6s) still pile into a bell
    clt: {
      every: 16, init: () => ({ bins: new Array(31).fill(0), n: 0 }),
      step(s) {
        const faces = [1, 1, 1, 6, 6, 6, 2, 3, 4, 5];
        for (let k = 0; k < 3; k++) { let sum = 0; for (let d = 0; d < 5; d++) sum += faces[Math.floor(rand() * faces.length)]; s.bins[sum]++; s.n++; }
        return s.n >= 2400;
      },
      draw(g, w, h, s) {
        const lo = 5, hi = 30, bw = (w - 40) / (hi - lo + 1), base = h - 30, max = Math.max(24, ...s.bins);
        // the die's own lopsided shape, small in the corner
        const die = [3, 1, 1, 1, 1, 3];
        die.forEach((v, i) => { g.fillStyle = C.green; g.fillRect(18 + i * 9, 40 - v * 7, 7, v * 7); });
        label(g, "one die", 18, 54);
        s.bins.forEach((v, i) => {
          if (i < lo) return;
          const bh = v / max * (base - 60);
          g.fillStyle = C.blue; g.globalAlpha = 0.85; g.fillRect(20 + (i - lo) * bw + 1, base - bh, bw - 2, bh); g.globalAlpha = 1;
        });
        if (s.n > 300) {  // the normal curve with the same mean and variance, fading in
          const faces = [1, 1, 1, 6, 6, 6, 2, 3, 4, 5], m1 = faces.reduce((a, b) => a + b) / 10;
          const v1 = faces.reduce((a, b) => a + (b - m1) ** 2, 0) / 10, mu = 5 * m1, sd = Math.sqrt(5 * v1);
          g.strokeStyle = C.yellow; g.lineWidth = 2.5; g.globalAlpha = Math.min(1, (s.n - 300) / 600);
          g.beginPath();
          for (let x = lo - 0.5; x <= hi + 0.5; x += 0.1) {
            const y = s.n * Math.exp(-((x - mu) ** 2) / (2 * sd * sd)) / (sd * Math.sqrt(TAU));
            const px = 20 + (x - lo + 0.5) * bw, py = base - y / max * (base - 60);
            x === lo - 0.5 ? g.moveTo(px, py) : g.lineTo(px, py);
          }
          g.stroke(); g.globalAlpha = 1;
        }
        g.strokeStyle = C.grid; g.beginPath(); g.moveTo(16, base + 0.5); g.lineTo(w - 16, base + 0.5); g.stroke();
        label(g, `sum of 5 rolls · ${s.n} samples`, w - 16, h - 10, C.faint, "right");
      },
    },

    // A coin with a hidden bias of 0.7: the belief about it starts flat and sharpens with each flip
    bayes: {
      every: 420, init: () => ({ heads: 0, tails: 0, flips: [] }),
      step(s) {
        const head = rand() < 0.7;
        head ? s.heads++ : s.tails++; s.flips.push(head);
        return s.flips.length >= 60;
      },
      draw(g, w, h, s) {
        const base = h - 46, top = 24, N = 240, ys = [];
        let total = 0;
        for (let i = 1; i < N; i++) { const p = i / N; const l = s.heads * Math.log(p) + s.tails * Math.log(1 - p); ys.push([p, l]); }
        const peak = Math.max(...ys.map(([, l]) => l));
        ys.forEach(r => { r[1] = Math.exp(r[1] - peak); total += r[1] / N; });
        const X = p => 20 + p * (w - 40), Y = d => base - Math.min(d / total, 9) / 9 * (base - top);
        g.fillStyle = C.blue; g.globalAlpha = 0.25; g.beginPath(); g.moveTo(X(0), base);
        ys.forEach(([p, d]) => g.lineTo(X(p), Y(d))); g.lineTo(X(1), base); g.fill(); g.globalAlpha = 1;
        g.strokeStyle = C.blue; g.lineWidth = 2.5; g.beginPath();
        ys.forEach(([p, d], i) => i ? g.lineTo(X(p), Y(d)) : g.moveTo(X(p), Y(d))); g.stroke();
        g.setLineDash([4, 5]); g.strokeStyle = C.yellow; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(X(0.7), top); g.lineTo(X(0.7), base); g.stroke(); g.setLineDash([]);
        label(g, "true bias", X(0.7) + 5, top + 10, C.yellow);
        g.strokeStyle = C.grid; g.beginPath(); g.moveTo(16, base + 0.5); g.lineTo(w - 16, base + 0.5); g.stroke();
        label(g, "0", X(0), base + 15, C.faint, "center"); label(g, "1", X(1), base + 15, C.faint, "center");
        s.flips.slice(-30).forEach((head, i) => {  // the latest flips, heads yellow and tails grey
          g.fillStyle = head ? C.yellow : C.faint; g.beginPath(); g.arc(24 + i * ((w - 48) / 29), h - 12, 3.2, 0, TAU); g.fill();
        });
        label(g, `${s.heads} heads, ${s.tails} tails`, 18, top + 10);
      },
    },

    // A long, narrow valley: plain gradient steps zigzag across it, momentum glides down it
    descent: {
      every: 70,
      init: () => ({ plain: [[-3.1, -1.0]], heavy: [[-3.1, -1.0]], v: [0, 0], t: 0 }),  // far up the valley, a little off its floor
      step(s) {
        const c = Math.cos(0.5), sn = Math.sin(0.5);
        const grad = ([x, y]) => { const u = c * x + sn * y, v = -sn * x + c * y, gu = 0.2 * u, gv = 4 * v; return [c * gu - sn * gv, sn * gu + c * gv]; };
        const [px, py] = s.plain.at(-1), gp = grad([px, py]);
        s.plain.push([px - 0.45 * gp[0], py - 0.45 * gp[1]]);
        const [hx, hy] = s.heavy.at(-1), gh = grad([hx, hy]);
        s.v = [0.7 * s.v[0] - 0.1 * gh[0], 0.7 * s.v[1] - 0.1 * gh[1]];
        s.heavy.push([hx + s.v[0], hy + s.v[1]]);
        return ++s.t >= 70;
      },
      draw(g, w, h, s) {
        const cx = w / 2, cy = h / 2 - 4, k = Math.min(w, h) / 7.5, P = ([x, y]) => [cx + x * k, cy - y * k];
        g.strokeStyle = C.grid; g.lineWidth = 1.2;
        for (let lv = 1; lv <= 9; lv++) {  // level sets of 0.1u² + 2v² are ellipses, tilted with the valley
          const r = Math.sqrt(lv * 0.18);
          g.beginPath(); g.ellipse(cx, cy, r / Math.sqrt(0.1) * k, r / Math.sqrt(2) * k, -0.5, 0, TAU); g.stroke();
        }
        const trail = (pts, color) => {
          g.strokeStyle = g.fillStyle = color; g.lineWidth = 2; g.beginPath();
          pts.forEach((p, i) => { const [x, y] = P(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
          const [x, y] = P(pts.at(-1)); g.beginPath(); g.arc(x, y, 5.5, 0, TAU); g.fill();
        };
        trail(s.plain, C.blue); trail(s.heavy, C.yellow);
        g.fillStyle = C.ink; g.beginPath(); g.arc(cx, cy, 2.5, 0, TAU); g.fill();
        label(g, "gradient descent", 16, h - 28, C.blue); label(g, "with momentum", 16, h - 11, C.yellow);
      },
    },

    // Closest point on a circle to P: grow circles around P until one just touches; there ∇f ∥ ∇g
    lagrange: {
      every: 30, init: () => ({ t: 0 }),
      step(s) { return ++s.t >= 150; },
      draw(g, w, h, s) {
        const k = Math.min(w, h) / 4.6, cx = w * 0.42, cy = h / 2 + 6, P = [1.9, 0.95], R = 1;
        const X = x => cx + x * k, Y = y => cy - y * k, d = Math.hypot(...P) - R;
        const grow = Math.min(1, s.t / 90), r = d * (1 - (1 - grow) ** 3);
        for (let i = 1; i <= 4; i++) {  // faint level sets of f, the distance to P
          g.strokeStyle = C.grid; g.lineWidth = 1; g.beginPath(); g.arc(X(P[0]), Y(P[1]), (d * i / 4 + 0.35 * i) * k, 0, TAU); g.stroke();
        }
        g.strokeStyle = C.blue; g.lineWidth = 2.5; g.beginPath(); g.arc(cx, cy, R * k, 0, TAU); g.stroke();
        label(g, "g(x, y) = 1", X(-0.95), Y(-1.12), C.blue);
        g.strokeStyle = C.yellow; g.lineWidth = 2; g.beginPath(); g.arc(X(P[0]), Y(P[1]), Math.max(r, 0.001) * k, 0, TAU); g.stroke();
        g.fillStyle = C.ink; g.beginPath(); g.arc(X(P[0]), Y(P[1]), 3, 0, TAU); g.fill();
        if (s.t > 92) {  // the touch point, with both gradients on one line
          const u = P.map(c => c / Math.hypot(...P)), T = [u[0] * R, u[1] * R];
          g.globalAlpha = Math.min(1, (s.t - 92) / 25);
          arrow(g, X(T[0]), Y(T[1]), X(T[0] + u[0] * 0.75), Y(T[1] + u[1] * 0.75), C.blue);
          arrow(g, X(T[0]), Y(T[1]), X(T[0] - u[0] * 0.6), Y(T[1] - u[1] * 0.6), C.yellow);
          g.fillStyle = C.red; g.beginPath(); g.arc(X(T[0]), Y(T[1]), 4.5, 0, TAU); g.fill();
          label(g, "∇f = λ∇g", w - 16, 24, C.ink, "right");
          g.globalAlpha = 1;
        }
      },
    },

    // Coin-flip walks fan out like √t, and where they end up piles into a bell
    walk: {
      every: 40, init: () => ({ paths: Array.from({ length: 70 }, () => [0]), t: 0 }),
      step(s) { for (const p of s.paths) p.push(p.at(-1) + (rand() < 0.5 ? -1 : 1)); return ++s.t >= 140; },
      draw(g, w, h, s) {
        const T = 140, left = 16, right = w - 70, mid = h / 2, k = (h / 2 - 16) / (2.6 * Math.sqrt(T));
        const X = t => left + t / T * (right - left);
        g.lineWidth = 1; g.strokeStyle = C.blue; g.globalAlpha = 0.28;
        for (const p of s.paths) { g.beginPath(); p.forEach((y, t) => t ? g.lineTo(X(t), mid - y * k) : g.moveTo(X(t), mid)); g.stroke(); }
        g.globalAlpha = 1; g.strokeStyle = C.yellow; g.lineWidth = 2;
        for (const sign of [1, -1]) {
          g.beginPath();
          for (let t = 0; t <= s.t; t++) { const y = mid - sign * 2 * Math.sqrt(t) * k; t ? g.lineTo(X(t), y) : g.moveTo(X(t), y); }
          g.stroke();
        }
        label(g, "±2√t", X(s.t) - 4, mid - 2 * Math.sqrt(s.t) * k - 8, C.yellow, "right");
        const bins = new Map();  // where the walks are now, sideways at the right edge
        for (const p of s.paths) { const b = Math.round(p.at(-1) / 4); bins.set(b, (bins.get(b) || 0) + 1); }
        g.fillStyle = C.blue;
        for (const [b, n] of bins) g.fillRect(right + 8, mid - b * 4 * k - 2 * k, n * 3.2, Math.max(4 * k - 1, 1));
      },
    },
  };

  for (const canvas of document.querySelectorAll("canvas[data-math]")) {
    const scene = scenes[canvas.dataset.math];
    if (!scene) continue;
    const g = canvas.getContext("2d");
    let state = scene.init(), done = false, last = 0, acc = 0, on = false, hold = 0;
    const size = () => {
      const r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const paint = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      g.fillStyle = C.bg; g.fillRect(0, 0, w, h); scene.draw(g, w, h, state);
    };
    const finish = () => { state = scene.init(); while (!scene.step(state)); done = true; paint(); };
    const frame = now => {
      if (!on) return;
      acc += Math.min(now - (last || now), 100); last = now;
      if (done) { hold += Math.min(acc, 100); acc = 0; if (hold > 2500) { state = scene.init(); done = false; hold = 0; } }
      while (!done && acc >= scene.every) { acc -= scene.every; done = scene.step(state); }
      paint();
      requestAnimationFrame(frame);
    };
    size();
    new ResizeObserver(() => { size(); paint(); }).observe(canvas);
    canvas.addEventListener("click", () => { if (reduce) return; state = scene.init(); done = false; hold = 0; });
    if (reduce) { finish(); continue; }
    paint();
    new IntersectionObserver(([e]) => {
      const was = on; on = e.isIntersecting;
      if (on && !was) { last = 0; requestAnimationFrame(frame); }
    }).observe(canvas);
  }
})();
