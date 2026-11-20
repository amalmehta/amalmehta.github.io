// Values page: shows Beliefs as tabs, "What I believe currently", "My predictions" and "Let go".
// Without JavaScript the lists show one after the other, each under its own heading.
// Each tab has its own address (values.html#beliefs-predictions), so any of them can be linked to.
(() => {
  const section = document.querySelector(".beliefs");
  if (!section) return;
  // A tab whose list is still empty stays hidden; with one tab left there's nothing to switch, so no tab bar
  const tabs = [...section.querySelectorAll('[role="tab"]')].filter(t => !t.hidden);
  if (tabs.length < 2) { section.classList.add("single"); return; }  // one list: the section title is enough, so its own heading hides
  // A marker that slides under the chosen tab, and the newly shown list fades across
  const bar = section.querySelector('[role="tablist"]');
  const marker = document.createElement("span");
  marker.className = "tab-marker";
  marker.setAttribute("aria-hidden", "true");
  bar.prepend(marker);
  bar.classList.add("has-marker");
  let chosen = null;
  const place = () => { if (chosen) { marker.style.width = `${chosen.offsetWidth}px`; marker.style.transform = `translateX(${chosen.offsetLeft}px)`; } };
  new ResizeObserver(place).observe(bar);
  const show = tab => {
    const changed = chosen && chosen !== tab;
    chosen = tab;
    tabs.forEach(t => {
      const on = t === tab, panel = document.getElementById(t.getAttribute("aria-controls"));
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
      panel.hidden = !on;
      panel.classList.toggle("fade-in", on && changed);
    });
    place();
  };
  const pick = tab => { show(tab); history.replaceState(null, "", "#" + tab.getAttribute("aria-controls")); };
  const fromHash = () => tabs.find(t => "#" + t.getAttribute("aria-controls") === location.hash);
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => pick(tab));
    tab.addEventListener("keydown", e => {  // arrow keys move between tabs; Home and End jump to the ends
      const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      const next = e.key === "Home" ? tabs[0] : e.key === "End" ? tabs[tabs.length - 1]
        : step ? tabs[(i + step + tabs.length) % tabs.length] : null;
      if (!next) return;
      pick(next); next.focus(); e.preventDefault();
    });
  });
  section.querySelector('[role="tablist"]').hidden = false;
  section.classList.add("tabbed");
  const linked = fromHash();
  show(linked || tabs[0]);
  if (linked) section.scrollIntoView();
  window.addEventListener("hashchange", () => { const t = fromHash(); if (t) { show(t); section.scrollIntoView(); } });
})();
