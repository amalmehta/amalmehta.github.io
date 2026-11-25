// Profile: the "Now" chip turns over every few seconds between what's current (its data-also list, taken
// from Interests → Now): researching, reading, thinking about. Each phrase slides up and out as the next
// slides in; pointing at the chip holds it still. Screen readers hear the first phrase only, as written.
// With reduced motion, or without JavaScript, it just says the first one.
(() => {
  const chip = document.querySelector(".status-chip[data-also]");
  const what = chip && chip.querySelector(".now-what");
  if (!what || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const phrases = [what.textContent, ...chip.dataset.also.split("|").map(p => p.trim()).filter(Boolean)];
  if (phrases.length < 2) return;
  chip.setAttribute("aria-label", chip.textContent.trim());  // the chip keeps saying its first phrase to screen readers
  let k = 0, held = false;
  chip.addEventListener("pointerenter", () => { held = true; });
  chip.addEventListener("pointerleave", () => { held = false; });
  const turn = () => {
    if (held || document.hidden) return;
    what.classList.add("now-out");
    setTimeout(() => {
      k = (k + 1) % phrases.length;
      what.textContent = phrases[k];
      what.classList.remove("now-out");
      what.classList.add("now-in");
      requestAnimationFrame(() => requestAnimationFrame(() => what.classList.remove("now-in")));
    }, 280);
  };
  setTimeout(() => setInterval(turn, 3800), 2400);
})();
