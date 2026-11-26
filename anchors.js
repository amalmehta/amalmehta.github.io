// Profile and Things I'm thinking about: a small "#" beside each entry's heading. It shows on
// hover or focus; clicking it puts that entry's address in the address bar and on the clipboard.
// Deep dives: the same "#" beside each part's title (Results, What didn't work…); a part without an id gets
// one from its title, and a link that arrives with that address scrolls to it.
(() => {
  const slug = t => t.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  for (const h of document.querySelectorAll(".case .case-part > h2.section-title")) {
    const part = h.parentElement;
    if (!part.id) { const id = slug(h.textContent); if (id && !document.getElementById(id)) part.id = id; }
  }
  document.querySelectorAll(".project[id] > div > h3, .role[id] > div > h3, .mini[id] > h3, .thought[id] > h2, .case .case-part[id] > h2.section-title").forEach(h => {
    const id = h.closest("[id]").id;
    const link = document.createElement("a");
    link.className = "anchor";
    link.href = "#" + id;
    link.textContent = "#";
    link.setAttribute("aria-label", "Link to " + h.textContent.trim());
    link.setAttribute("aria-live", "polite");  // so "Copied" is read out
    link.addEventListener("click", e => {
      e.preventDefault();
      history.replaceState(null, "", "#" + id);
      const url = location.href;
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => {
        link.textContent = "Copied";
        setTimeout(() => { link.textContent = "#"; }, 1500);
      }, () => {});
    });
    h.append("\u00a0", link);  // a no-break space keeps the "#" on the heading's last line instead of wrapping alone
  });

  // A link to an entry inside a closed group (Built for fun) opens the group, then goes to the entry.
  // Printing opens every group, since paper can't be clicked.
  const reveal = () => {
    const target = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    const group = target && target.closest("details:not([open])");
    if (!group) return;
    group.open = true;
    target.scrollIntoView();
  };
  reveal();
  addEventListener("hashchange", reveal);
  // A deep-dive part's id is added above, after the browser has looked for it, so go there now
  const target = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (target && target.matches(".case-part")) target.scrollIntoView();
  addEventListener("beforeprint", () => document.querySelectorAll("details").forEach(d => { d.open = true; }));
})();
