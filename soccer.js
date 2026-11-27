// The robot soccer drawings (Research & work, and the deep dive's figure with data-sim="soccer") carry a small,
// faint ball icon in the corner (simicon.js). Pressing it loads Three.js (assets/vendor) and soccer-world.js, and
// the drawing gives way to the live 3D world in the same spot; the icon, now a ×, brings the drawing back.
// Nothing loads until it's pressed. Without JS or WebGL there's just the drawing.
(() => {
  if (!window.simIcon) return;
  const gl = document.createElement("canvas");
  if (!(gl.getContext("webgl2") || gl.getContext("webgl"))) return;
  const script = src => new Promise((ok, fail) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = fail; document.head.appendChild(s); });
  for (const fig of document.querySelectorAll('#hybrid-robotics .shot, figure[data-sim="soccer"]')) {
    const btn = window.simIcon(fig, "ball", "Step into the robot soccer simulation", async f => {
      const THREE = await import("./assets/vendor/three.module.min.js");
      if (!window.SoccerWorld) await script("soccer-world.js");
      const world = window.SoccerWorld(THREE, f);
      return () => world.dispose();
    });
    // On the home page, a plain "Try it live" link beside the entry's other links opens the same world
    const links = fig.closest("#hybrid-robotics")?.querySelector(".links");
    if (btn && links && !links.querySelector(".try-sim")) {
      const a = document.createElement("a");
      a.className = "try-sim"; a.href = "#hybrid-robotics"; a.textContent = "Try it live →";
      a.addEventListener("click", e => { e.preventDefault(); if (btn.getAttribute("aria-expanded") !== "true") btn.click(); });
      links.append(" ", a);
    }
  }
})();
