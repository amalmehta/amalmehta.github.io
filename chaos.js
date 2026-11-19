// Chaos: the home page opens on the Lorenz attractor. Two ink paths start 0.00001 apart, trace the
// butterfly together, then split: sensitive dependence on initial conditions. It plays once per visit
// (per browser session), takes about two and a half seconds, and any click, key, scroll or touch skips it.
// Loaded in <head> without defer so the paper veil is up before the first paint; with reduced motion,
// a link to a section (#…), or no sessionStorage, it does nothing. The CSS veil also lifts itself after
// a few seconds, so the page can never be stuck behind it.
(() => {
  const root = document.documentElement;
  let seen = true;
  try { seen = sessionStorage.getItem("chaos-seen") === "1"; sessionStorage.setItem("chaos-seen", "1"); } catch (e) { /* stays seen */ }
  if (seen || location.hash || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  root.classList.add("chaos-intro");

  const start = () => {
    const css = getComputedStyle(root);
    const ink = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
    const colours = [ink("--accent", "#2f5d8a"), ink("--warm", "#9c5636")], together = ink("--text", "#29241f");

    const veil = document.createElement("div");
    veil.className = "chaos-loader";
    veil.setAttribute("aria-hidden", "true");
    const canvas = document.createElement("canvas");
    const cap = document.createElement("p");
    cap.className = "chaos-caption";
    cap.textContent = "Lorenz, 1963 · two paths that start 0.00001 apart";
    veil.append(canvas, cap);
    document.body.appendChild(veil);
    root.classList.remove("chaos-intro");  // the loader's own paper takes over from the CSS veil

    const dpr = Math.min(devicePixelRatio || 1, 2);
    const W = innerWidth, H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const g = canvas.getContext("2d");
    g.scale(dpr, dpr);
    g.lineCap = g.lineJoin = "round";

    // Integrate both paths ahead of time (RK4), then reveal them over the animation.
    const s = 10, r = 28, b = 8 / 3, dt = 0.006, steps = 5400;
    const f = ([x, y, z]) => [s * (y - x), x * (r - z) - y, x * y - b * z];
    const step = (p) => {
      const k1 = f(p), a = p.map((v, i) => v + dt / 2 * k1[i]);
      const k2 = f(a), c = p.map((v, i) => v + dt / 2 * k2[i]);
      const k3 = f(c), d = p.map((v, i) => v + dt * k3[i]);
      const k4 = f(d);
      return p.map((v, i) => v + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
    };
    let seed = [1, 1, 1];
    for (let i = 0; i < 800; i++) seed = step(seed);  // settle onto the attractor first
    const paths = [seed, [seed[0] + 0.00001, seed[1], seed[2]]].map((p) => {
      const out = [];
      for (let i = 0; i < steps; i++) { p = step(p); out.push(p); }
      return out;
    });
    // Where the two paths visibly part: drawn as one ink line until then, in two colours after.
    let split = paths[0].findIndex((p, i) => Math.hypot(p[0] - paths[1][i][0], p[1] - paths[1][i][1], p[2] - paths[1][i][2]) > 0.3);
    if (split < 0) split = steps;
    // Project x across and z up, with a slight tilt so the two wings read as depth.
    const scale = Math.min(W / 52, H / 62);
    const cx = W / 2, cy = H / 2 + 25 * scale - 8;
    const at = ([x, y, z]) => [cx + (x + 0.18 * y) * scale, cy - z * scale];

    const DRAW = 1900, HOLD = 250, FADE = 500;
    let done = 0, t0 = 0, finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      veil.classList.add("chaos-out");
      setTimeout(() => veil.remove(), FADE + 50);
      for (const e of ["pointerdown", "keydown", "wheel", "touchstart"]) removeEventListener(e, finish);
    };
    for (const e of ["pointerdown", "keydown", "wheel", "touchstart"]) addEventListener(e, finish, { passive: true });

    const frame = (now) => {
      if (finished) return;
      t0 ||= now;
      const k = Math.min(1, (now - t0) / DRAW);
      const upto = Math.floor(steps * (1 - (1 - k) ** 1.6));  // quick start, settling at the end
      const line = (path, from, to, colour) => {
        if (to <= from) return;
        g.strokeStyle = colour;
        g.beginPath();
        let [px, py] = at(path[Math.max(0, from - 1)]);
        g.moveTo(px, py);
        for (let i = from; i < to; i++) { [px, py] = at(path[i]); g.lineTo(px, py); }
        g.stroke();
      };
      g.globalAlpha = 0.7;
      g.lineWidth = 1.1;
      line(paths[0], done, Math.min(upto, split), together);
      paths.forEach((path, j) => line(path, Math.max(done, split), upto, colours[j]));
      done = upto;
      if (k < 1) requestAnimationFrame(frame);
      else setTimeout(finish, HOLD);
    };
    requestAnimationFrame(frame);
    setTimeout(finish, DRAW + HOLD + 1500);  // a backstop if frames stall (a background tab)
  };

  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start, { once: true });
})();
