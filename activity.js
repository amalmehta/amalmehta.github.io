// What changed: the strip of the last eight weeks fills in left to right the first time it comes into view, each
// day's dot growing to its size (bigger for days with more changes). Pointing at a dot shows that day's count
// (its <title>), and clicking one goes to that day's changes. Without JavaScript, or with reduced motion, the strip is simply shown.
(() => {
  const strip = document.querySelector(".activity svg");
  if (!strip || matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
  [...strip.querySelectorAll("circle")].forEach((c, i) => c.style.setProperty("--i", i));
  strip.classList.add("a-wait");
  const io = new IntersectionObserver(es => {
    if (!es.some(e => e.isIntersecting)) return;
    io.disconnect();
    strip.classList.replace("a-wait", "a-play");
  }, { threshold: 0.5 });
  io.observe(strip);
})();
// A day's dot links to that day's changes; arriving there, the day lights up for a moment
document.querySelectorAll('.activity a[href^="#day-"]').forEach(a => a.addEventListener("click", () => {
  const day = document.getElementById(a.getAttribute("href").slice(1));
  if (day) { day.classList.remove("flash"); void day.offsetWidth; day.classList.add("flash"); }
}));
