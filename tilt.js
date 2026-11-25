// A little life when the cursor is near: on What I try to live by, each Inspiration drawing tilts toward the
// cursor like a print held in the hand; on the profile, each Featured project's picture leans gently toward it;
// and the contour lines behind Outside work and the Endurance tile drift toward it like a map under glass.
// All settle back when the cursor leaves. Mouse and pen only; reduced motion turns it off.
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(hover: hover)").matches) return;
  const tilt = (area, target, strength) => {
    area.addEventListener("pointermove", e => {
      const box = area.getBoundingClientRect();
      const x = (e.clientX - box.left) / box.width - 0.5, y = (e.clientY - box.top) / box.height - 0.5;
      target.style.setProperty("--tilt-x", `${(-y * 7 * strength).toFixed(2)}deg`);
      target.style.setProperty("--tilt-y", `${(x * 9 * strength).toFixed(2)}deg`);
    });
    area.addEventListener("pointerleave", () => {
      for (const p of ["--tilt-x", "--tilt-y"]) target.style.setProperty(p, "0deg");
    });
  };
  for (const card of document.querySelectorAll(".inspo-card .photo")) tilt(card, card, 1);
  for (const shot of document.querySelectorAll(".project .shot")) tilt(shot, shot, 0.55);
  // The topographic lines behind Outside work (profile) and the Endurance tile (Interests) drift a little
  // toward the cursor, like a map under glass, and ease back when it goes
  const maps = [...document.querySelectorAll(".outside, .tile-grit")];
  if (maps.length) {
    let px = null, py = null, queued = false;
    const cur = new Map(maps.map(m => [m, [0, 0]]));
    const step = () => {
      queued = false;
      let moving = false;
      for (const m of maps) {
        const box = m.getBoundingClientRect(), c = cur.get(m);
        let tx = 0, ty = 0;
        if (px !== null && box.bottom > 0 && box.top < innerHeight) {
          tx = Math.max(-1, Math.min(1, (px - (box.left + box.width / 2)) / (box.width / 2 + 200))) * 26;
          ty = Math.max(-1, Math.min(1, (py - (box.top + box.height / 2)) / (box.height / 2 + 200))) * 18;
        }
        c[0] += (tx - c[0]) * 0.08; c[1] += (ty - c[1]) * 0.08;
        m.style.setProperty("--map-x", `${c[0].toFixed(2)}px`);
        m.style.setProperty("--map-y", `${c[1].toFixed(2)}px`);
        if (Math.abs(tx - c[0]) + Math.abs(ty - c[1]) > 0.05) moving = true;
      }
      if (moving) queue();
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(step); } };
    addEventListener("pointermove", e => { if (e.pointerType !== "touch") { px = e.clientX; py = e.clientY; queue(); } }, { passive: true });
    document.addEventListener("pointerleave", () => { px = py = null; queue(); });
    addEventListener("scroll", queue, { passive: true });
  }
  // Saved for later, before the book covers swung open on hover (styles.css, books.js):
  // for (const book of document.querySelectorAll(".book")) { const cover = book.querySelector(".book-cover"); if (cover) tilt(book, cover, 2.2); }
})();
