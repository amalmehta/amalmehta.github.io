// Case studies, The story: the first time it comes into view, its line runs down and the story is told one
// line at a time, from "Once upon a time" to "And ever since" (on opening the page, since it sits near the top). Without JS, or with reduced motion, it's all shown.
(() => {
  const spine = document.querySelector(".spine");
  if (!spine || !("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (spine.getBoundingClientRect().bottom < 0) return;  // opened at a link further down: leave it be
  spine.classList.add("telling");
  [...spine.children].forEach((li, i) => { li.style.setProperty("--d", `${(0.25 + i * 0.45).toFixed(2)}s`); });
  if (spine.getBoundingClientRect().top < innerHeight * 0.9) {  // on screen as the page opens: tell it now
    spine.offsetHeight;  // commit the hidden state first, so the lines fade in rather than appearing
    setTimeout(() => spine.classList.add("told"), 60);
    return;
  }
  const io = new IntersectionObserver(es => {
    if (!es.some(e => e.isIntersecting)) return;
    io.disconnect();
    spine.classList.add("told");
  }, { threshold: 0.35 });
  io.observe(spine);
})();
