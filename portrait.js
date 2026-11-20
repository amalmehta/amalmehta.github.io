// Profile: the pencil-sketch portrait is revealed by a soft sweep, as if being drawn, the first time the profile
// opens in a visit, after the opening ink drawing (chaos.js) if that plays. The rings around it ease in after.
// Without JS, or with reduced motion, it's simply shown.
(() => {
  const img = document.querySelector(".hero .portrait");
  if (!img || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  try { if (sessionStorage.getItem("portrait-drawn") === "1") return; sessionStorage.setItem("portrait-drawn", "1"); } catch (e) { return; }
  img.classList.add("sketch-wait");
  const root = document.documentElement;
  const busy = () => root.classList.contains("chaos-intro") || document.querySelector(".chaos-loader");
  let started = false;
  const start = () => {
    if (started || busy()) return;
    started = true;
    mo.disconnect();
    img.classList.remove("sketch-wait");
    img.classList.add("sketching");
    img.addEventListener("animationend", () => img.classList.remove("sketching"), { once: true });
  };
  const mo = new MutationObserver(start);
  mo.observe(root, { attributes: true, attributeFilter: ["class"] });
  mo.observe(document.body, { childList: true });
  setTimeout(() => { if (!started) { mo.disconnect(); started = true; img.classList.remove("sketch-wait"); } }, 9000);  // never stay hidden
  start();
})();
