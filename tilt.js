// A little life when the cursor is near: on What I try to live by, each Inspiration drawing tilts toward the
// cursor like a print held in the hand; on Interests, each book's cover tilts the same way, as if picked up;
// on the profile, each Featured project's picture leans gently toward it. All settle back when the cursor leaves. Mouse and pen only; reduced motion turns it off.
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
  for (const book of document.querySelectorAll(".book")) { const cover = book.querySelector(".book-cover"); if (cover) tilt(book, cover, 2.2); }
})();
