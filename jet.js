// The PhysicsAI drawing carries a small, faint jet in its corner (simicon.js). Pressing it loads Three.js
// (assets/vendor) and jet-world.js, and the drawing gives way to a live fighter-jet flight simulation in the same
// spot; the icon, now a ×, brings the drawing back. Nothing loads until it's pressed. Without JS or WebGL there's
// just the drawing.
(() => {
  if (!window.simIcon) return;
  const gl = document.createElement("canvas");
  if (!(gl.getContext("webgl2") || gl.getContext("webgl"))) return;
  const script = src => new Promise((ok, fail) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = fail; document.head.appendChild(s); });
  for (const fig of document.querySelectorAll("#physicsai .shot")) {
    window.simIcon(fig, "jet", "Fly the fighter-jet simulation", async f => {
      const THREE = await import("./assets/vendor/three.module.min.js");
      if (!window.JetWorld) await script("jet-world.js");
      const world = window.JetWorld(THREE, f);
      return () => world.dispose();
    });
  }
})();
