// Writings: as you read a piece, a thin line beside it fills to show how far through you are, and the paragraph
// you're on stays full ink while the rest of the piece softens a little. Leaving the piece clears both.
// Only pieces with several paragraphs. With reduced motion the line still fills but nothing fades.
(() => {
  const pieces = [...document.querySelectorAll(".writing")].filter(a => a.querySelectorAll("p:not(.when)").length >= 3);
  if (!pieces.length) return;
  for (const a of pieces) {
    const fill = document.createElement("span");
    fill.className = "read-fill";
    fill.setAttribute("aria-hidden", "true");
    a.classList.add("has-read");
    a.prepend(fill);
  }
  let queued = false;
  const update = () => {
    queued = false;
    const mark = innerHeight * 0.42;
    for (const a of pieces) {
      const paras = [...a.querySelectorAll("p:not(.when)")];
      const top = paras[0].getBoundingClientRect().top, bottom = paras.at(-1).getBoundingClientRect().bottom;
      const inside = top < mark && bottom > mark * 0.5;
      const prog = Math.min(Math.max((mark - top) / (bottom - top), 0), 1);
      a.style.setProperty("--read", prog.toFixed(4));
      a.classList.toggle("reading", inside);
      let now = null;
      if (inside) for (const p of paras) { const r = p.getBoundingClientRect(); if (r.top <= mark && r.bottom >= mark - 24) { now = p; break; } }
      if (inside && !now) now = paras.find(p => p.getBoundingClientRect().top > mark) || paras.at(-1);
      for (const p of paras) p.classList.toggle("now", p === now);
    }
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);
  update();
})();
