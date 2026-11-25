// Profile: a tag that shows up on more than one project or role (Neural decoding, Sim-to-real, PPO...) is
// linked. Pointing at it, focusing it or tapping it lights every project and role that carries the same tag
// and dims the rest, so you can see a thread running through the work. Tags used only once stay plain.
(() => {
  const cards = [...document.querySelectorAll("main .project, main .role")];
  const key = chip => chip.textContent.trim().toLowerCase();
  const byTag = new Map();
  for (const card of cards) for (const chip of card.querySelectorAll(".tags .chip")) {
    if (!byTag.has(key(chip))) byTag.set(key(chip), new Set());
    byTag.get(key(chip)).add(card);
  }
  const main = document.querySelector("main");
  let held = null;
  const show = tag => {
    main.classList.add("tag-focus");
    for (const card of cards) card.classList.toggle("tag-match", byTag.get(tag).has(card));
    for (const chip of document.querySelectorAll(".chip.linked")) chip.classList.toggle("tag-hit", key(chip) === tag);
  };
  const clear = () => {
    if (held) return;
    main.classList.remove("tag-focus");
    for (const el of document.querySelectorAll(".tag-match, .tag-hit")) el.classList.remove("tag-match", "tag-hit");
  };
  for (const card of cards) for (const chip of card.querySelectorAll(".tags .chip")) {
    const tag = key(chip), n = byTag.get(tag).size;
    if (n < 2) continue;
    chip.classList.add("linked");
    chip.tabIndex = 0;
    chip.setAttribute("role", "button");
    chip.setAttribute("aria-label", `${chip.textContent.trim()}: show the ${n} entries that use it`);
    chip.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") show(tag); });
    chip.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") clear(); });
    chip.addEventListener("focus", () => show(tag));
    chip.addEventListener("blur", clear);
    chip.addEventListener("click", () => {  // a tap holds it until the next tap anywhere
      held = held === tag ? null : tag;
      if (held) show(tag); else clear();
    });
  }
  document.addEventListener("click", e => { if (held && !e.target.closest(".chip.linked")) { held = null; clear(); } });
})();
