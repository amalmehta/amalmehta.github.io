// What I try to live by: the values write themselves in, one after another, left to right like a pen,
// the first time the list scrolls into view. Without JS, or with reduced motion, they're simply there.
(() => {
  const list = document.querySelector(".values");
  if (!list || !("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  [...list.querySelectorAll(".value h3")].forEach((h, i) => h.style.setProperty("--i", i));
  list.classList.add("ink-ready");
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    list.classList.add("inked");
  }, { threshold: 0.25 });
  io.observe(list);
})();
