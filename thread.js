// Things I'm thinking about: a thin line runs down the left of the questions and draws itself as you
// scroll, and each question's number lights up as the reading line reaches it. Added only with
// JavaScript; without it, or with reduced motion, the numbers are simply shown lit and there's no line.
(() => {
  const list = document.querySelector(".thoughts");
  if (!list || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const items = [...list.querySelectorAll(":scope > .thought")].filter(li => !li.hidden);
  if (items.length < 2) return;
  list.classList.add("threaded");
  let queued = false;
  const update = () => {
    queued = false;
    const line = innerHeight * 0.55, r = list.getBoundingClientRect();
    const first = items[0].getBoundingClientRect().top, last = items.at(-1).getBoundingClientRect().top;
    const done = Math.min(Math.max((line - first) / Math.max(last - first, 1), 0), 1);
    list.style.setProperty("--thread-top", `${first - r.top + 12}px`);
    list.style.setProperty("--thread-len", `${(last - first) * done}px`);
    list.style.setProperty("--thread-full", `${last - first}px`);
    for (const li of items) li.classList.toggle("reached", li.getBoundingClientRect().top < line);
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);
  update();
})();
