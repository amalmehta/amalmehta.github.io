// Interests, Hobbies: three tiles do a little of what they're about when you point at them (or tap them):
// Scuba diving lets a few bubbles rise, Skiing lets snow drift down, and Photography goes off like a shutter.
// Added only with JavaScript; reduced motion leaves the tiles still.
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const tiles = {};
  for (const tile of document.querySelectorAll(".tiles .tile")) {
    const name = tile.querySelector("h3")?.textContent.replace("→", "").trim().toLowerCase();
    if (name) tiles[name] = tile;
  }
  const rand = (a, b) => a + Math.random() * (b - a);
  const bit = (tile, cls, vars) => {
    const b = document.createElement("span");
    b.className = `fx ${cls}`;
    b.setAttribute("aria-hidden", "true");
    for (const [k, v] of Object.entries(vars)) b.style.setProperty(k, v);
    b.addEventListener("animationend", () => b.remove());
    tile.appendChild(b);
  };
  const effects = {
    "scuba diving": tile => {
      for (let k = 0; k < 9; k++) bit(tile, "bubble", { left: `${rand(8, 40).toFixed(1)}%`, "--s": `${rand(4, 10).toFixed(1)}px`, "--dx": `${rand(-14, 14).toFixed(0)}px`, "--t": `${rand(1.3, 2.3).toFixed(2)}s`, "--d": `${rand(0, 0.7).toFixed(2)}s` });
    },
    "skiing": tile => {
      for (let k = 0; k < 16; k++) bit(tile, "flake", { left: `${rand(2, 98).toFixed(1)}%`, "--s": `${rand(2.5, 5).toFixed(1)}px`, "--dx": `${rand(-24, 24).toFixed(0)}px`, "--t": `${rand(1.6, 2.8).toFixed(2)}s`, "--d": `${rand(0, 0.9).toFixed(2)}s` });
    },
    "photography": tile => bit(tile, "flash", {}),
  };
  for (const [name, run] of Object.entries(effects)) {
    const tile = tiles[name];
    if (!tile) continue;
    tile.classList.add("fx-tile");
    let last = 0;
    const go = () => { const now = performance.now(); if (now - last < 1400) return; last = now; run(tile); };
    tile.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") go(); });
    tile.addEventListener("click", go);
  }
})();
