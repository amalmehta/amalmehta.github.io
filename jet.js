// Research & work, PhysicsAI: a "Fly the jet" badge on the PhysicsAI drawing. Pressing it loads Three.js
// (assets/vendor) and jet-world.js, and the drawing gives way to a live fighter-jet flight simulation in the same
// spot; "Close jet" brings the drawing back. Nothing loads until it's pressed. Without JS or WebGL there's just
// the drawing.
(() => {
  const fig = document.querySelector("#physicsai .shot");
  if (!fig) return;
  const gl = document.createElement("canvas");
  if (!(gl.getContext("webgl2") || gl.getContext("webgl"))) return;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "try-badge sim-badge jet-badge";
  btn.textContent = "Fly the jet";
  btn.setAttribute("aria-expanded", "false");
  fig.classList.add("has-badge");
  fig.appendChild(btn);
  let world = null, busy = false;
  const script = src => new Promise((ok, fail) => {
    const s = document.createElement("script");
    s.src = src; s.onload = ok; s.onerror = fail;
    document.head.appendChild(s);
  });
  btn.addEventListener("click", async () => {
    if (busy) return;
    if (world) {
      world.dispose(); world = null;
      fig.classList.remove("sim-on");
      btn.textContent = "Fly the jet";
      btn.setAttribute("aria-expanded", "false");
      return;
    }
    busy = true;
    btn.textContent = "Loading…";
    try {
      const THREE = await import("./assets/vendor/three.module.min.js");
      if (!window.JetWorld) await script("jet-world.js");
      fig.classList.add("sim-on");
      world = window.JetWorld(THREE, fig);
      btn.textContent = "Close jet";
      btn.setAttribute("aria-expanded", "true");
      fig.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    } catch {
      fig.classList.remove("sim-on");
      btn.textContent = "Fly the jet";
    }
    busy = false;
  });
})();
