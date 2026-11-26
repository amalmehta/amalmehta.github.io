// Profile, Research & work and Publications & reports: the thin rail between the years and each entry fills in
// warm ink as you scroll, and each entry's dot and years light up as the reading line reaches them. Wide screens,
// where the rail shows.
// Added only with JavaScript; without it, or with reduced motion, the rail stays as drawn.
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const roles = [];
  for (const section of [document.getElementById("research"), document.getElementById("writeups")]) {
    const mine = section ? [...section.querySelectorAll(".role")] : [];
    if (mine.length < 2) continue;
    section.classList.add("railed");
    roles.push(...mine);
  }
  if (!roles.length) return;
  let queued = false;
  const update = () => {
    queued = false;
    const line = innerHeight * 0.55;
    for (const role of roles) {
      const r = role.getBoundingClientRect();
      role.style.setProperty("--fill", Math.min(Math.max((line - r.top) / Math.max(r.height, 1), 0), 1).toFixed(4));
      role.classList.toggle("reached", r.top + 30 < line);
    }
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);
  update();
})();
