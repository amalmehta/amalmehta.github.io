// Profile, Skills: point at, focus or tap a skill and a small card under it lists the work on this page
// that used it, each a link that takes you there and lights the entry up for a moment. A skill is matched
// by its name (or each name in it, like "PPO, SAC, TD3") appearing in a role or project.
(() => {
  const section = document.getElementById("skills");
  if (!section) return;
  const work = [...document.querySelectorAll("article.role[id], article.project[id], li.mini[id]")].filter(el => !el.closest("[hidden]"));
  const titleOf = el => {
    const h = el.querySelector("h3");
    const t = (h?.firstChild?.textContent || h?.textContent || "").trim();
    return t.includes(" · ") ? t.split(" · ").pop() : t;
  };
  const seen = new Set();
  const entries = work.filter(el => { const k = titleOf(el); if (!k || seen.has(k)) return false; seen.add(k); return true; })
    .map(el => ({ el, title: titleOf(el), text: el.textContent }));
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  section.style.position = "relative";
  const pop = document.createElement("div");
  pop.className = "skill-pop";
  pop.hidden = true;
  section.append(pop);
  let hideTimer = 0, current = null;
  const hide = () => { pop.hidden = true; current?.classList.remove("open"); current = null; };
  const show = chip => {
    clearTimeout(hideTimer);
    if (current === chip && !pop.hidden) return;
    current?.classList.remove("open");
    current = chip; chip.classList.add("open");
    pop.replaceChildren(Object.assign(document.createElement("span"), { className: "skill-pop-label", textContent: "Used in" }));
    for (const { el, title } of chip._work) {
      const a = Object.assign(document.createElement("a"), { href: `#${el.id}`, textContent: title });
      a.addEventListener("click", () => { el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); hide(); });
      pop.append(a);
    }
    pop.hidden = false;
    const s = section.getBoundingClientRect(), c = chip.getBoundingClientRect();
    pop.style.top = `${c.bottom - s.top + 6}px`;
    pop.style.left = `${Math.max(0, Math.min(c.left - s.left, s.width - pop.offsetWidth))}px`;
  };
  const later = () => { clearTimeout(hideTimer); hideTimer = setTimeout(hide, 250); };
  for (const chip of section.querySelectorAll(".chip")) {
    const names = chip.textContent.split(/[,()/]/).map(s => s.trim()).filter(s => s.length > 1);
    chip._work = entries.filter(({ text }) => names.some(n => new RegExp(`(^|[^\\w-])${esc(n)}($|[^\\w-])`).test(text)));
    if (!chip._work.length) continue;
    chip.classList.add("has-work");
    chip.tabIndex = 0;
    chip.setAttribute("role", "button");
    chip.setAttribute("aria-label", `${chip.textContent}: used in ${chip._work.map(w => w.title).join(", ")}`);
    chip.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") show(chip); });
    chip.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") later(); });
    chip.addEventListener("click", () => (current === chip && !pop.hidden ? hide() : show(chip)));
    chip.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(chip); pop.querySelector("a")?.focus(); } if (e.key === "Escape") hide(); });
  }
  pop.addEventListener("pointerenter", () => clearTimeout(hideTimer));
  pop.addEventListener("pointerleave", later);
  pop.addEventListener("keydown", e => { if (e.key === "Escape") { const c = current; hide(); c?.focus(); } });
  document.addEventListener("click", e => { if (current && !current.contains(e.target) && !pop.contains(e.target)) hide(); });
})();
