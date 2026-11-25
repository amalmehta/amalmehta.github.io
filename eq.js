// Interests, Favorite artists: a few equalizer bars beside each artist's name, resting low; pointing at the
// tile (or tapping it) sets them dancing, as if their music came on. Added only with JavaScript;
// with reduced motion the bars stay still.
(() => {
  for (const h of document.querySelectorAll("#artists .tile h3")) {
    const eq = document.createElement("span");
    eq.className = "eq";
    eq.setAttribute("aria-hidden", "true");
    for (let k = 0; k < 4; k++) eq.appendChild(document.createElement("i"));
    h.appendChild(eq);
    const tile = h.closest(".tile");
    tile.addEventListener("click", () => tile.classList.toggle("playing"));
  }
})();
