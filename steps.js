// Case studies, How it works: the first time the numbered method steps come into view, they light up one after
// another, each joined to the next by a short line that draws itself across the gap, like the data passing
// through the pipeline. Steps at the end of a row get no line (the next one starts a new row).
// Added only with JavaScript; without it, or with reduced motion, the steps stay as drawn.
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
  for (const list of document.querySelectorAll(".case ol.flow")) {
    const steps = [...list.children];
    if (steps.length < 2) continue;
    const markRows = () => steps.forEach((s, k) => s.classList.toggle("row-end", k === steps.length - 1 || steps[k + 1].offsetTop > s.offsetTop + 4));
    markRows();
    addEventListener("resize", markRows);
    list.classList.add("steps-ready");
    const io = new IntersectionObserver(es => {
      if (!es.some(e => e.isIntersecting)) return;
      io.disconnect();
      steps.forEach((s, k) => {
        setTimeout(() => s.classList.add("step-on"), 150 + k * 380);
        setTimeout(() => s.classList.add("link-on"), 150 + k * 380 + 200);
      });
    }, { threshold: 0.6 });
    io.observe(list);
  }
})();
