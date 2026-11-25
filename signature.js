// Profile: under the name, a pen signs a flourish (a long stroke with one small loop) the first time you see it:
// after the opening ink drawing (chaos.js) if that plays, so the stroke isn't spent behind it. It replaces the
// static brush stroke styles.css draws without JavaScript; with reduced motion the flourish is simply there.
(() => {
  const h1 = document.querySelector(".hero h1");
  if (!h1) return;
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "signature");
  svg.setAttribute("viewBox", "0 0 340 30");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(NS, "path");
  path.setAttribute("d", "M3,17 C60,11 120,7 182,11 C212,13 232,19 226,24 C218,29 203,17 218,12 C246,4 296,7 337,10");
  path.setAttribute("pathLength", "1");
  svg.appendChild(path);
  h1.appendChild(svg);
  h1.classList.add("signed");
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { svg.classList.add("done"); return; }
  const root = document.documentElement;
  const busy = () => root.classList.contains("chaos-intro") || document.querySelector(".chaos-loader");
  let started = false;
  const start = () => {
    if (started || busy()) return;
    started = true; mo.disconnect();
    requestAnimationFrame(() => svg.classList.add("signing"));
  };
  const mo = new MutationObserver(start);
  mo.observe(root, { attributes: true, attributeFilter: ["class"] });
  mo.observe(document.body, { childList: true });
  setTimeout(() => { if (!started) { started = true; mo.disconnect(); svg.classList.add("done"); } }, 9000);  // never left unsigned
  start();
})();
