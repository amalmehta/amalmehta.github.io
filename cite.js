// Publications & reports: a small "Cite" beside each paper with a DOI. Pressing it copies the paper's BibTeX and
// shows it underneath, selectable, in case copying isn't allowed. Pressing again hides it.
// Research & work's "Published: …" and "Poster: …" lines link to their entries here, which flash on arrival.
(() => {
  for (const a of document.querySelectorAll("a.pub-link[href^='#']")) {
    a.addEventListener("click", () => {
      const el = document.querySelector(a.getAttribute("href"));
      if (el) { el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); }
    });
  }
})();
(() => {
  const BIB = {
    "spie-2023": `@inproceedings{shah2023melanoma,
  title     = {Deep learning segmentation of invasive melanoma},
  author    = {Shah, Aman and Mehta, Amal and Wang, Michael and Neumann, Neil and Zakhor, Avideh and McCalmont, Timothy},
  booktitle = {Medical Imaging 2023: Digital and Computational Pathology},
  series    = {Proc. SPIE},
  volume    = {12471},
  pages     = {124711P},
  year      = {2023},
  doi       = {10.1117/12.2654672}
}`,
    "wafersat-2016": `@inproceedings{brashears2016wafersat,
  title     = {Building the future of {WaferSat} spacecraft for relativistic spacecraft},
  author    = {Brashears, Travis and Lubin, Philip and Rupert, Nic and Stanton, Eric and Mehta, Amal and Knowles, Patrick and Hughes, Gary B.},
  booktitle = {Planetary Defense and Space Environment Applications},
  series    = {Proc. SPIE},
  volume    = {9981},
  pages     = {998104},
  year      = {2016},
  doi       = {10.1117/12.2238471}
}`,
  };
  for (const [id, bib] of Object.entries(BIB)) {
    const links = document.querySelector(`#writeups #${id} .links`);
    if (!links) continue;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cite-btn";
    btn.textContent = "Cite";
    btn.setAttribute("aria-expanded", "false");
    const box = document.createElement("pre");
    box.className = "cite-box";
    box.id = `cite-${id}`;
    box.hidden = true;
    box.textContent = bib;
    btn.setAttribute("aria-controls", box.id);
    links.append(" ", btn);
    links.after(box);
    let timer = 0;
    btn.addEventListener("click", async () => {
      const open = box.hidden;
      box.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      if (!open) { btn.textContent = "Cite"; return; }
      try {
        await navigator.clipboard.writeText(bib);
        btn.textContent = "Copied BibTeX ✓";
      } catch {
        btn.textContent = "BibTeX below";
      }
      clearTimeout(timer);
      timer = setTimeout(() => { if (!box.hidden) btn.textContent = "Hide BibTeX"; }, 1800);
    });
  }
})();
