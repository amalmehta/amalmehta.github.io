// Grateful for's lantern garden at dusk.
//   Dusk falls as you scroll toward it: the page's own background warms toward sunset (--dusk), so the page
//     and the garden's sky are one sky, and a moon rises over the garden (--rise).
//   A festoon string runs between the trees, and each lantern hangs from it; a row's string draws itself in
//     as its lanterns light, one by one, as they scroll into view.
//   Stars twinkle and fireflies drift and blink low in the garden.
// Without JS the lanterns are simply lit, with no moon, string or fireflies; with reduced motion everything is
// there but still.
(() => {
  const section = document.querySelector("#grateful-for");
  const list = section && section.querySelector(".inspo");
  if (!list) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const NS = "http://www.w3.org/2000/svg";
  const rand = (a, b) => a + Math.random() * (b - a);
  const items = [...list.children];

  // ------------------------------------------------ the live night: moon, stars and fireflies
  const sky = document.createElement("div");
  sky.className = "g-sky";
  sky.setAttribute("aria-hidden", "true");
  const moon = document.createElement("span");
  moon.className = "g-moon";
  sky.appendChild(moon);
  for (let k = 0; k < 22; k++) {
    const s = document.createElement("span");
    s.className = "g-star";
    s.style.setProperty("left", `${rand(2, 98).toFixed(1)}%`);
    s.style.setProperty("top", `calc(15rem + ${rand(0, 38).toFixed(1)}%)`);
    s.style.setProperty("--t", `${rand(2.4, 5.5).toFixed(2)}s`);
    s.style.setProperty("--d", `${rand(-5, 0).toFixed(2)}s`);
    s.style.setProperty("scale", rand(0.5, 1).toFixed(2));
    sky.appendChild(s);
  }
  for (let k = 0; k < 16; k++) {
    const f = document.createElement("span");
    f.className = "g-fly";
    f.style.setProperty("left", `${rand(3, 97).toFixed(1)}%`);
    f.style.setProperty("bottom", `${rand(2, 22).toFixed(1)}%`);
    f.style.setProperty("--dx", `${rand(-60, 60).toFixed(0)}px`);
    f.style.setProperty("--dy", `${rand(-50, 10).toFixed(0)}px`);
    f.style.setProperty("--t", `${rand(6, 13).toFixed(2)}s`);
    f.style.setProperty("--b", `${rand(2.2, 4.5).toFixed(2)}s`);
    f.style.setProperty("--d", `${rand(-12, 0).toFixed(2)}s`);
    sky.appendChild(f);
  }
  section.prepend(sky);

  // ------------------------------------------------ dusk and moonrise, from where the garden is on screen
  let queued = false;
  const update = () => {
    queued = false;
    const top = section.getBoundingClientRect().top, h = innerHeight;
    const clamp = v => Math.min(Math.max(v, 0), 1);
    root.style.setProperty("--dusk", clamp((h * 1.5 - top) / (h * 1.2)).toFixed(3));
    section.style.setProperty("--rise", reduce ? "1" : clamp((h * 0.9 - top) / (h * 1.1)).toFixed(3));
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);
  update();

  // ------------------------------------------------ the festoon: one string per row of two lanterns
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "festoon");
  svg.setAttribute("aria-hidden", "true");
  section.insertBefore(svg, sky.nextSibling);
  const rowOf = new Map();  // lantern → its row's string
  const string = () => {
    svg.replaceChildren(); rowOf.clear();
    if (innerWidth < 720) return;  // one column: each lantern just hangs on its cord
    const box = section.getBoundingClientRect(), W = box.width;
    const rem = parseFloat(getComputedStyle(root).fontSize) || 16;
    for (let r = 0; r < items.length; r += 2) {
      const row = items.slice(r, r + 2);
      const pts = row.map(it => { const b = it.getBoundingClientRect(); return [b.left - box.left + 0.8 * rem, b.top - box.top - 2.1 * rem]; });
      const first = pts[0], last = pts.at(-1);
      const all = [[0, first[1] - 28], ...pts, [W, last[1] - 28]];
      let d = `M${all[0][0].toFixed(1)} ${all[0][1].toFixed(1)}`;
      for (let k = 1; k < all.length; k++) {
        const [x0, y0] = all[k - 1], [x1, y1] = all[k], sag = Math.abs(x1 - x0) * 0.07;
        d += ` Q${((x0 + x1) / 2).toFixed(1)} ${(Math.max(y0, y1) + sag).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
      }
      const path = document.createElementNS(NS, "path");
      path.setAttribute("d", d);
      path.setAttribute("pathLength", "1");
      if (reduce || row.some(it => it.classList.contains("lit") || !it.classList.contains("unlit"))) path.classList.add("strung");
      svg.appendChild(path);
      row.forEach(it => rowOf.set(it, path));
    }
  };
  string();
  addEventListener("resize", string);
  if (document.fonts) document.fonts.ready.then(string);

  // ------------------------------------------------ each lantern lights in turn as it scrolls into view
  if (!("IntersectionObserver" in window) || reduce) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) {
      e.target.classList.add("lit"); io.unobserve(e.target);
      rowOf.get(e.target)?.classList.add("strung");
    }
  }, { rootMargin: "0px 0px -12% 0px" });
  for (const lantern of items) {
    lantern.classList.add("unlit");
    io.observe(lantern);
  }
  string();  // again, now the strings know which lanterns are still dark
})();
