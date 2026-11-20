// Every page's top menu: the warm underline under the page you're on glides to whichever link you point at,
// and slides back when the pointer leaves the menu. Without JS the underline simply sits under the current page;
// with reduced motion it moves without gliding. Below it: the back-to-top ring for long pages.
(() => {
  const links = document.querySelector(".nav-links");
  if (!links || !matchMedia("(hover: hover)").matches) return;
  const glide = document.createElement("span");
  glide.className = "nav-glide";
  glide.setAttribute("aria-hidden", "true");
  links.appendChild(glide);
  links.classList.add("has-glide");
  const current = () => links.querySelector("a[aria-current]");
  const to = a => {
    const r = a?.getBoundingClientRect();
    if (!r || !r.width) { glide.style.opacity = "0"; return; }
    const box = links.getBoundingClientRect();
    glide.style.opacity = "1";
    glide.style.transform = `translate(${(r.left - box.left).toFixed(1)}px, ${(r.bottom - box.top).toFixed(1)}px)`;
    glide.style.width = `${r.width.toFixed(1)}px`;
  };
  for (const a of links.querySelectorAll("a")) a.addEventListener("pointerenter", () => to(a));
  links.addEventListener("pointerleave", () => to(current()));
  addEventListener("resize", () => to(current()));
  document.fonts?.ready.then(() => to(current()));
  to(current());
  requestAnimationFrame(() => links.classList.add("glide-ready"));  // only glide after the first placement
})();

// Long pages: once you're well down, a small round button shows in the corner. A warm ring around it fills
// as you read, and a tap takes you back to the top (gliding, unless reduced motion is on).
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "to-top";
  btn.setAttribute("aria-label", "Back to top");
  btn.innerHTML = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle class="to-top-track" cx="20" cy="20" r="17"/>'
    + '<circle class="to-top-ring" cx="20" cy="20" r="17" pathLength="1"/><path d="M20 26V14M14.5 19.5 20 14l5.5 5.5"/></svg>';
  document.body.appendChild(btn);
  btn.addEventListener("click", () => {
    scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    document.querySelector(".skip")?.focus({ preventScroll: true });
  });
  let queued = false;
  const update = () => {
    queued = false;
    const end = document.documentElement.scrollHeight - innerHeight;
    const long = end > innerHeight * 1.5;
    btn.classList.toggle("shown", long && scrollY > innerHeight * 1.2);
    btn.style.setProperty("--read", end > 0 ? Math.min(scrollY / end, 1).toFixed(4) : "0");
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);
  update();
})();
