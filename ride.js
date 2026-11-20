// Writings: beside "A hard day", a thin Seattle-to-DC line stays in view while you read, and a small
// bike rides along it as you scroll through the piece. Added only with JavaScript; the plain page reads the same.
(() => {
  const piece = document.getElementById("a-hard-day");
  if (!piece) return;
  const bar = document.createElement("div");
  bar.className = "ride-bar";
  bar.setAttribute("aria-hidden", "true");
  bar.innerHTML = '<span class="ride-end">Seattle</span><span class="ride-track"><span class="ride-done"></span>'
    + '<svg class="ride-bike" viewBox="0 0 32 20"><circle cx="7" cy="14" r="5"/><circle cx="25" cy="14" r="5"/>'
    + '<path d="M7 14 13 5h9l3 9M13 5l5 9h-11M20 2h4M12 3h3"/></svg></span><span class="ride-end">DC</span>';
  piece.querySelector(".when.posted")?.after(bar);
  let queued = false;
  const update = () => {
    queued = false;
    const r = piece.getBoundingClientRect();
    let read = (innerHeight * 0.6 - r.top) / Math.max(r.height, 1);  // how far down the piece the reading line is
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) read = 1;  // the bottom of the page: arrived in DC
    bar.style.setProperty("--ride", Math.min(Math.max(read, 0), 1).toFixed(4));
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);
  update();
})();
