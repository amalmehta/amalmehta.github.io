// Every page's top menu: the warm underline under the page you're on glides to whichever link you point at,
// and slides back when the pointer leaves the menu. Without JS the underline simply sits under the current page;
// with reduced motion it moves without gliding.
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
