// Chaos, part 1: the gate. The home page opens on one of seven ink drawings (chaos-scenes.js), a different
// one each visit, in turn. This small file loads in <head> without defer so the paper veil is up before the
// first paint; it plays once per browser session and does nothing with reduced motion or a link to a
// section (#…). Only when it plays does it fetch the scenes. The CSS veil lifts itself after 4s, so the page
// can never be stuck behind it.
(() => {
  let seen = true;
  try { seen = sessionStorage.getItem("chaos-seen") === "1"; sessionStorage.setItem("chaos-seen", "1"); } catch (e) { /* stays seen */ }
  if (seen || location.hash || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let pick = Math.floor(Math.random() * 7);
  try {  // take them in turn, so a returning visitor sees the next one
    const n = parseInt(localStorage.getItem("chaos-next") || "0", 10) || 0;
    pick = n % 7;
    localStorage.setItem("chaos-next", String(n + 1));
  } catch (e) { /* random it is */ }
  const forced = new URLSearchParams(location.search).get("chaos");  // ?chaos=0…6 shows that one (for checking)
  if (forced !== null && /^[0-6]$/.test(forced)) pick = +forced;
  const root = document.documentElement;
  root.classList.add("chaos-intro");
  root.dataset.chaos = String(pick);
  const s = document.createElement("script");
  s.src = "chaos-scenes.js";
  s.async = true;
  s.onerror = () => root.classList.remove("chaos-intro");
  document.head.appendChild(s);
})();
