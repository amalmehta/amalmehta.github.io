// Case studies: click (or press Enter on) a figure and it grows smoothly from where it sits into a full-screen
// view. Scroll or pinch to zoom in, drag to look around, double-click to reset; Esc, the ×, or a click on the
// dark backdrop shrinks it back into place.
(() => {
  const imgs = [...document.querySelectorAll("main.case .case-figure img")];
  if (!imgs.length) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let layer = null;
  const open = img => {
    if (layer || img.closest(".sim-open")) return;
    const from = img.getBoundingClientRect();
    layer = document.createElement("div");
    layer.className = "zoom-layer";
    layer.setAttribute("role", "dialog");
    layer.setAttribute("aria-modal", "true");
    layer.setAttribute("aria-label", img.alt || "Figure");
    const big = document.createElement("img");
    big.className = "zoom-img"; big.src = img.currentSrc || img.src; big.alt = img.alt;
    const close = document.createElement("button");
    close.type = "button"; close.className = "zoom-close"; close.setAttribute("aria-label", "Close"); close.textContent = "×";
    const hint = document.createElement("p");
    hint.className = "zoom-hint"; hint.textContent = "Scroll or pinch to zoom · drag to look around · Esc to close";
    layer.append(big, close, hint);
    document.body.appendChild(layer);
    document.documentElement.classList.add("zoom-lock");
    const nat = (img.naturalWidth || from.width) / (img.naturalHeight || from.height);
    const fit = () => { const W = innerWidth * 0.92, H = innerHeight * 0.86; const w = Math.min(W, H * nat); return { w, h: w / nat, x: (innerWidth - w) / 2, y: (innerHeight - w / nat) / 2 }; };
    let base = fit(), s = 1, tx = 0, ty = 0;
    Object.assign(big.style, { width: `${base.w}px`, height: `${base.h}px`, left: `${base.x}px`, top: `${base.y}px` });
    const apply = () => { big.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`; };
    // FLIP: start where the figure sits on the page, then glide to the centre
    const fromT = `translate(${from.left - base.x + (from.width - base.w) / 2}px, ${from.top - base.y + (from.height - base.h) / 2}px) scale(${from.width / base.w})`;
    big.style.transform = fromT;
    requestAnimationFrame(() => requestAnimationFrame(() => { layer.classList.add("open"); apply(); }));
    const clampPan = () => { const mx = Math.max(0, (base.w * s - base.w) / 2 + 40), my = Math.max(0, (base.h * s - base.h) / 2 + 40); tx = Math.min(Math.max(tx, -mx), mx); ty = Math.min(Math.max(ty, -my), my); };
    const zoomAt = (k, cx, cy) => {
      const ns = Math.min(Math.max(s * k, 1), 6); k = ns / s;
      const ox = cx - (base.x + base.w / 2) - tx, oy = cy - (base.y + base.h / 2) - ty;
      tx -= ox * (k - 1); ty -= oy * (k - 1); s = ns; if (s === 1) { tx = 0; ty = 0; } clampPan(); apply();
    };
    layer.addEventListener("wheel", e => { e.preventDefault(); big.classList.add("live"); zoomAt(Math.exp(-e.deltaY * 0.0022), e.clientX, e.clientY); }, { passive: false });
    const pts = new Map(); let moved = false, pinch0 = 0;
    big.addEventListener("pointerdown", e => { big.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); moved = false; big.classList.add("live"); if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
    big.addEventListener("pointermove", e => {
      if (!pts.has(e.pointerId)) return;
      const [px, py] = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch0) zoomAt(d / pinch0, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); pinch0 = d; moved = true; return; }
      if (Math.abs(e.clientX - px) + Math.abs(e.clientY - py) > 1) moved = true;
      if (s > 1) { tx += e.clientX - px; ty += e.clientY - py; clampPan(); apply(); }
    });
    const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch0 = 0; };
    big.addEventListener("pointerup", up); big.addEventListener("pointercancel", up);
    big.addEventListener("dblclick", () => { big.classList.remove("live"); s = 1; tx = 0; ty = 0; apply(); });
    const shut = () => {
      if (!layer) return;
      const l = layer; layer = null;
      big.classList.remove("live");
      const now = img.getBoundingClientRect();
      big.style.transform = `translate(${now.left - base.x + (now.width - base.w) / 2}px, ${now.top - base.y + (now.height - base.h) / 2}px) scale(${now.width / base.w})`;
      l.classList.remove("open");
      document.documentElement.classList.remove("zoom-lock");
      removeEventListener("keydown", onKey); removeEventListener("resize", onResize);
      setTimeout(() => { l.remove(); img.focus({ preventScroll: true }); }, reduce ? 0 : 320);
    };
    const onKey = e => { if (e.key === "Escape") shut(); };
    const onResize = () => { base = fit(); Object.assign(big.style, { width: `${base.w}px`, height: `${base.h}px`, left: `${base.x}px`, top: `${base.y}px` }); clampPan(); apply(); };
    addEventListener("keydown", onKey); addEventListener("resize", onResize);
    close.addEventListener("click", shut);
    layer.addEventListener("click", e => { if (e.target === layer) shut(); });
    big.addEventListener("click", () => { if (!moved && s === 1) shut(); });
    close.focus({ preventScroll: true });
  };
  for (const img of imgs) {
    img.classList.add("zoomable");
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", `Open full screen: ${img.alt}`);
    img.addEventListener("click", () => open(img));
    img.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(img); } });
  }
})();
