// Profile, Research & work: the thin rail between the years and each role fills in warm ink as you scroll,
// and each role's dot and years light up as the reading line reaches them. Wide screens, where the rail shows.
// Added only with JavaScript; without it, or with reduced motion, the rail stays as drawn.
(() => {
  const section = document.getElementById("research");
  if (!section || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const roles = [...section.querySelectorAll(".role")];
  if (roles.length < 2) return;
  section.classList.add("railed");
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
