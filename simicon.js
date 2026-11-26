// A quiet way into a live simulation: a small, faint icon in the top corner of a drawing that brightens on
// hover. Pressing it calls open(fig), which returns a close function; while open, the icon becomes a small ×.
// Used by soccer.js and jet.js (3D worlds), bci-demo.js (a replay of the BCI results) and for deep-dive figures with data-embed (a project's own demo,
// shown in place in a frame). Without JS there's just the drawing.
window.simIcon = (fig, kind, label, open) => {
  const NS = "http://www.w3.org/2000/svg";
  const PATHS = {
    jet: "M12 2.5c.6 0 1 1.2 1.1 3.2l.1 3.1 7.3 4.6v1.7l-7.3-2.1-.2 4.5 2.4 1.8v1.3l-3.4-.9-3.4.9v-1.3l2.4-1.8-.2-4.5-7.3 2.1v-1.7l7.3-4.6.1-3.1C11 3.7 11.4 2.5 12 2.5z",
    ball: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 5.2 3.3 2.4-1.3 3.9h-4l-1.3-3.9zM12 3.6v4.6M15.3 10.6l4.3-1.4M14 14.5l2.7 3.7M10 14.5l-2.7 3.7M8.7 10.6 4.4 9.2",
    drone: "M7 7l10 10M17 7 7 17M5 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM19 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM5 21.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM19 21.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM10 10h4v4h-4z",
    wave: "M2 13h3.5l2-6 3.5 12 3-9 2 4.5H22",
    close: "M6 6l12 12M18 6 6 18",
  };
  const filled = kind === "jet";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `sim-icon sim-icon-${kind}`;
  btn.setAttribute("aria-label", label);
  btn.setAttribute("aria-expanded", "false");
  btn.title = label;
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(NS, "path");
  svg.appendChild(path);
  btn.appendChild(svg);
  const draw = k => {
    path.setAttribute("d", PATHS[k]);
    svg.classList.toggle("filled", k === "jet" && filled);
  };
  draw(kind);
  fig.classList.add("sim-host");
  fig.appendChild(btn);
  let close = null, busy = false;
  btn.addEventListener("click", async () => {
    if (busy) return;
    if (close) {
      close(); close = null;
      draw(kind); btn.setAttribute("aria-label", label); btn.title = label; btn.setAttribute("aria-expanded", "false");
      fig.classList.remove("sim-open");
      return;
    }
    busy = true; btn.classList.add("loading");
    try {
      close = await open(fig);
      fig.classList.add("sim-open");
      draw("close"); btn.setAttribute("aria-label", "Close the simulation"); btn.title = "Close"; btn.setAttribute("aria-expanded", "true");
      fig.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    } catch { close = null; }
    btn.classList.remove("loading"); busy = false;
  });
  return btn;
};

// Deep-dive figures with data-embed open that project's own live demo in place
(() => {
  for (const fig of document.querySelectorAll("figure[data-embed]")) {
    window.simIcon(fig, fig.dataset.icon || "drone", fig.dataset.label || "Open the live demo here", async f => {
      const box = document.createElement("div");
      box.className = "game-box embed-box";
      const frame = document.createElement("iframe");
      frame.src = f.dataset.embed;
      frame.title = f.dataset.label || "Live demo";
      frame.setAttribute("allow", "fullscreen");
      box.appendChild(frame);
      f.appendChild(box);
      return () => box.remove();
    });
  }
})();
