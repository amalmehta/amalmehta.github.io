// Travel: each drawn place card starts as a pale grey sketch and develops into full colour, like a print in
// a tray, the first time it comes into view (cards rolling in on the Trip timeline develop as they arrive).
// Without JS, or with reduced motion, the drawings are simply shown in colour.
(() => {
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cards = [...document.querySelectorAll(".photos-page .photo")].filter((c) => c.querySelector("img"));
  const io = new IntersectionObserver((es) => {
    for (const e of es) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      e.target.classList.add("develop");
      e.target.classList.remove("developing");
    }
  }, { threshold: 0.4 });
  for (const c of cards) {
    const r = c.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0 && r.left < innerWidth && r.right > 0) continue;  // already on screen: leave it be
    c.classList.add("developing");
    io.observe(c);
  }
})();
