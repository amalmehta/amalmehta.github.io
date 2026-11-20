// Travel, the colour strip above the Trip timeline: the first time it comes into view its swatches fill in one
// by one, in date order; pointing at (or focusing) a swatch lifts that trip's card in the timeline.
// Without JS the strip is simply shown; with reduced motion it doesn't fill in, but the cards still lift.
(() => {
  const strip = document.querySelector(".color-script");
  if (!strip) return;
  const swatches = [...strip.querySelectorAll("a")];
  const card = a => document.getElementById((a.getAttribute("href") || "").slice(1));
  for (const a of swatches) {
    const on = () => card(a)?.classList.add("lifted"), off = () => card(a)?.classList.remove("lifted");
    a.addEventListener("pointerenter", on); a.addEventListener("pointerleave", off);
    a.addEventListener("focus", on); a.addEventListener("blur", off);
  }
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (strip.getBoundingClientRect().top < innerHeight * 0.9) return;  // already on screen as the page opens
  strip.classList.add("filling");
  swatches.forEach((a, i) => { a.style.setProperty("--d", `${(i * 0.12).toFixed(2)}s`); });
  const io = new IntersectionObserver(es => {
    if (!es.some(e => e.isIntersecting)) return;
    io.disconnect();
    strip.classList.add("filled");
  }, { threshold: 0.6 });
  io.observe(strip);
})();
