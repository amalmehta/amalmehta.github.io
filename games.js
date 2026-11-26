// Home, Outside work: pointing at (or focusing) a game's name in "Games I made for fun" shows a tiny live glimpse
// above it, playing only while it's shown.
//   Fun Typing Test: a sentence types itself behind a blinking caret while the words-per-minute count climbs.
//   Goat or Sheep: a goat and a sheep flip back and forth, faster and faster, then it lands on one.
//   What Soccer Player Are Ya: a ball weaves between two cones while the guesses change.
// Decoration only (hidden from screen readers); the links work as before. With reduced motion each shows a still.
(() => {
  const links = [...document.querySelectorAll(".games-line a")];
  if (!links.length) return;
  const NS = "http://www.w3.org/2000/svg";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const el = (name, attrs, parent) => { const n = document.createElementNS(NS, name); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); if (parent) parent.appendChild(n); return n; };
  const W = 160, H = 72;

  const typing = svg => {
    const line = "the quick brown fox";
    const txt = el("text", { x: 12, y: 32, class: "gp-type" }, svg);
    const caret = el("rect", { y: 21, width: 1.6, height: 15, class: "gp-caret" }, svg);
    const wpm = el("text", { x: W - 12, y: 58, class: "gp-num", "text-anchor": "end" }, svg);
    el("text", { x: 12, y: 58, class: "gp-label" }, svg).textContent = "words per minute";
    return t => {
      const c = t % 4.4, n = Math.min(line.length, Math.floor(c * 9));
      txt.textContent = line.slice(0, n);
      caret.setAttribute("x", (13 + txt.getComputedTextLength()).toFixed(1));
      caret.setAttribute("opacity", n < line.length || Math.floor(t * 2.5) % 2 ? "1" : "0");
      wpm.textContent = Math.round(64 * Math.min(1, c / 2.8));
    };
  };

  const goat = svg => {
    const face = el("text", { x: W / 2, y: 42, class: "gp-face", "text-anchor": "middle" }, svg);
    const note = el("text", { x: W / 2, y: 62, class: "gp-label", "text-anchor": "middle" }, svg);
    const g = face;
    return t => {
      const c = t % 4.2;
      const flips = c < 2.6 ? Math.floor(Math.pow(c / 2.6, 0.55) * 9) : 9;   // flips come faster, then stop
      const goatNow = flips % 2 === 0;
      face.textContent = goatNow ? "🐐" : "🐑";
      const phase = c < 2.6 ? (Math.pow(c / 2.6, 0.55) * 9) % 1 : 1;
      g.setAttribute("transform", `translate(${W / 2} 0) scale(${Math.abs(Math.cos(phase * Math.PI)).toFixed(2)} 1) translate(${-W / 2} 0)`);
      note.textContent = c < 2.6 ? "goat or sheep?" : goatNow ? "you’re a goat" : "you’re a sheep";
    };
  };

  const soccer = svg => {
    el("path", { d: `M8,50 H${W - 8}`, class: "gp-pitch" }, svg);
    for (const x of [62, 108]) el("path", { d: `M${x - 6},50 L${x},38 L${x + 6},50 Z`, class: "gp-cone" }, svg);
    const ball = el("circle", { r: 5, class: "gp-ball" }, svg);
    const who = el("text", { x: W / 2, y: 22, class: "gp-label", "text-anchor": "middle" }, svg);
    const names = ["Messi?", "Modrić?", "Yamal?", "Pedri?"];
    return t => {
      const c = (t % 3) / 3, x = 18 + c * (W - 36);
      ball.setAttribute("cx", x.toFixed(1));
      ball.setAttribute("cy", (44 - Math.abs(Math.sin(c * Math.PI * 3)) * 9 + Math.sin(c * Math.PI * 6) * 2).toFixed(1));
      who.textContent = names[Math.floor(t / 3) % names.length];
    };
  };

  const kinds = { FunTypingTest: typing, "goat-or-sheep": goat, WhatSoccerPlayerAreYa: soccer };
  for (const a of links) {
    const key = Object.keys(kinds).find(k => a.href.includes(`/${k}/`));
    if (!key) continue;
    const peek = document.createElement("span");
    peek.className = "game-peek";
    peek.setAttribute("aria-hidden", "true");
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}` }, peek);
    const frame = kinds[key](svg);
    // Beside the link, not inside it, so the link's own text stays just the game's name
    const line = a.closest(".games-line");
    line.classList.add("has-peeks");
    line.appendChild(peek);
    const place = () => { peek.style.setProperty("--peek-x", `${a.offsetLeft + a.offsetWidth / 2}px`); peek.style.setProperty("--peek-y", `${a.offsetTop}px`); };
    let raf = 0, t0 = 0;
    const tick = now => { frame((now - t0) / 1000); raf = requestAnimationFrame(tick); };
    const show = () => {
      place();
      peek.classList.add("on");
      if (reduce) { frame(9.9); return; }
      if (!raf) { t0 = performance.now(); raf = requestAnimationFrame(tick); }
    };
    const hide = () => { peek.classList.remove("on"); cancelAnimationFrame(raf); raf = 0; };
    a.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") show(); });
    a.addEventListener("pointerleave", hide);
    a.addEventListener("focus", show);
    a.addEventListener("blur", hide);
    frame(0.01);
  }
})();

// Apps you can use, Coming to iPhone: pointing at an app's name shows the same kind of glimpse.
//   What To Cook Next: tonight's recipe, and the skill it trains filling a little.
//   Goal Garden: a sprout grows a leaf with each logged step, then blooms.
(() => {
  const items = [...document.querySelectorAll(".iphone-apps li")];
  if (!items.length) return;
  const NS = "http://www.w3.org/2000/svg";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const el = (name, attrs, parent) => { const n = document.createElementNS(NS, name); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); if (parent) parent.appendChild(n); return n; };
  const W = 160, H = 72;

  const cook = svg => {
    const meals = [["Pan-seared salmon", "searing", 0.35, 0.62], ["Vegetable stir-fry", "knife skills", 0.48, 0.71], ["Mushroom risotto", "patience", 0.22, 0.5]];
    el("text", { x: 12, y: 17, class: "gp-label" }, svg).textContent = "tonight";
    const dish = el("text", { x: 12, y: 34, class: "gp-dish" }, svg);
    const skill = el("text", { x: 12, y: 52, class: "gp-label" }, svg);
    el("rect", { x: 12, y: 57, width: W - 24, height: 5, rx: 2.5, class: "gp-track" }, svg);
    const bar = el("rect", { x: 12, y: 57, height: 5, rx: 2.5, class: "gp-bar" }, svg);
    return t => {
      const k = Math.floor(t / 3) % meals.length, c = (t % 3) / 3, [name, what, a, b] = meals[k];
      dish.textContent = name;
      skill.textContent = `trains: ${what}`;
      const f = a + (b - a) * Math.min(1, Math.max(0, (c - 0.25) / 0.5));
      bar.setAttribute("width", ((W - 24) * f).toFixed(1));
    };
  };

  const garden = svg => {
    el("path", { d: `M14,60 H${W - 14}`, class: "gp-pitch" }, svg);
    const stem = el("path", { class: "gp-stem" }, svg);
    const leaves = [[-1, 50], [1, 42], [-1, 34]].map(([s, y]) => el("ellipse", { cx: W / 2 + s * 8, cy: y, rx: 7, ry: 3.4, transform: `rotate(${s * -28} ${W / 2 + s * 8} ${y})`, class: "gp-leaf" }, svg));
    const bloom = el("g", { class: "gp-bloom" }, svg);
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; el("circle", { cx: (W / 2 + Math.cos(a) * 5).toFixed(1), cy: (20 + Math.sin(a) * 5).toFixed(1), r: 3.6 }, bloom); }
    el("circle", { cx: W / 2, cy: 20, r: 2.6, class: "gp-heart" }, bloom);
    const note = el("text", { x: 12, y: 16, class: "gp-label" }, svg);
    return t => {
      const c = t % 6, steps = Math.min(4, Math.floor(c / 1.1));
      const h = 6 + Math.min(1, c / 4.4) * 34;
      stem.setAttribute("d", `M${W / 2},60 C${W / 2 - 3},${60 - h * 0.5} ${W / 2 + 3},${60 - h * 0.8} ${W / 2},${60 - h}`);
      leaves.forEach((l, k) => l.setAttribute("opacity", steps > k ? "1" : "0"));
      bloom.setAttribute("opacity", steps >= 4 ? "1" : "0");
      note.textContent = steps >= 4 ? "goal reached" : `${steps} step${steps === 1 ? "" : "s"} logged`;
    };
  };

  for (const li of items) {
    const name = li.querySelector("a.iphone-name") || li.querySelector("strong");
    const kind = /cook/i.test(name?.textContent) ? cook : /garden/i.test(name?.textContent) ? garden : null;
    if (!kind) continue;
    const peek = document.createElement("span");
    peek.className = "game-peek";
    peek.setAttribute("aria-hidden", "true");
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}` }, peek);
    const frame = kind(svg);
    li.classList.add("has-peeks");
    li.appendChild(peek);
    let raf = 0, t0 = 0;
    const tick = now => { frame((now - t0) / 1000); raf = requestAnimationFrame(tick); };
    const show = () => {
      peek.style.setProperty("--peek-x", `${name.offsetLeft + name.offsetWidth / 2}px`);
      peek.style.setProperty("--peek-y", `${name.offsetTop}px`);
      peek.classList.add("on");
      if (reduce) { frame(5.5); return; }
      if (!raf) { t0 = performance.now(); raf = requestAnimationFrame(tick); }
    };
    const hide = () => { peek.classList.remove("on"); cancelAnimationFrame(raf); raf = 0; };
    name.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") show(); });
    name.addEventListener("pointerleave", hide);
    name.addEventListener("focus", show);
    name.addEventListener("blur", hide);
    frame(0.01);
  }
})();
