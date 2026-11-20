// Case studies: a thin warm line along the bottom of the header fills as you read the page, and each part's
// title lights up once the reading line reaches it, so you can see how far through you are.
// Added only with JavaScript; without it the page reads the same, every title in full ink.
(() => {
  const main = document.querySelector("main.case");
  const header = document.querySelector(".site-header");
  if (!main || !header) return;
  const titles = [...main.querySelectorAll(".case-part > .section-title")];
  const bar = document.createElement("div");
  bar.className = "read-bar";
  bar.setAttribute("aria-hidden", "true");
  header.appendChild(bar);
  main.classList.add("case-track");
  let queued = false;
  const update = () => {
    queued = false;
    const end = document.documentElement.scrollHeight - innerHeight;
    const read = end > 0 ? Math.min(Math.max(scrollY / end, 0), 1) : 1;
    bar.style.setProperty("--read", read.toFixed(4));
    const line = innerHeight * 0.55;  // the reading line, a little above the middle of the screen
    for (const t of titles) t.classList.toggle("reached", read >= 0.999 || t.getBoundingClientRect().top < line);
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);
  update();
})();
