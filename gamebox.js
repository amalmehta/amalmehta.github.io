// Home, More projects: "Play it" on a card with data-embed opens the game right inside the card, which widens
// to the full row; pressing it again (now "Close game") folds it away. A modified click (new tab or window)
// still follows the link, and the card's Demo link always opens the full page.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  for (const badge of document.querySelectorAll(".mini .try-badge[data-embed]")) {
    const card = badge.closest(".mini");
    const label = badge.textContent;
    const name = card.querySelector("h3").firstChild.textContent.trim();
    let box = null;
    badge.setAttribute("role", "button");
    badge.setAttribute("aria-expanded", "false");
    const close = () => {
      box.remove(); box = null;
      card.classList.remove("playing");
      badge.textContent = label;
      badge.setAttribute("aria-expanded", "false");
    };
    badge.addEventListener("click", e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      if (box) { close(); return; }
      box = document.createElement("div");
      box.className = "game-box";
      const frame = document.createElement("iframe");
      frame.src = badge.dataset.embed;
      frame.title = `${name}, playable`;
      frame.setAttribute("allow", "fullscreen");
      box.appendChild(frame);
      card.appendChild(box);
      card.classList.add("playing");
      badge.textContent = "Close game";
      badge.setAttribute("aria-expanded", "true");
      requestAnimationFrame(() => card.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }));
    });
  }
})();
