// Travel: the Trip timeline marks trips whose last day has passed as past, rests on the next trip for a moment when it comes into view, then rolls past on its own,
// looping, and rests there again each time round. It holds while a cursor or keyboard is on it, for a
// few seconds after anything else moves it (a drag, a swipe, a map pin's link), and when Pause is pressed.
// Without JS, or with reduced motion, it's a row you scroll by hand.
(() => {
  const reel = document.querySelector(".reel");
  if (!reel) return;
  const today = new Date().toLocaleDateString("en-CA");
  const lastDay = card => [...card.querySelectorAll("time[datetime]")].pop()?.getAttribute("datetime") ?? "";
  for (const card of reel.children) if (lastDay(card) && lastDay(card) < today) card.classList.add("past");
  if (reel.children.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (getComputedStyle(reel).display !== "flex") return;  // an older cached stylesheet: leave the plain grid alone
  const SPEED = 28, HOLD = 6000, REST = 2500, EDGE = 24;  // pixels a second; milliseconds; milliseconds; the edge fade's width
  const cards = [...reel.children];
  reel.classList.add("rolling");

  const addClones = () => {
    for (const card of cards) {
      const clone = card.cloneNode(true);
      clone.removeAttribute("id");
      clone.setAttribute("aria-hidden", "true");
      clone.classList.add("reel-clone");
      for (const img of clone.querySelectorAll("img")) { img.removeAttribute("fetchpriority"); img.loading = "lazy"; }
      for (const list of clone.querySelectorAll(".trip-timeline")) list.classList.remove("animated");
      reel.append(clone);
    }
  };
  const period = () => reel.children[cards.length].offsetLeft - cards[0].offsetLeft;  // one full set of cards
  // Enough copies that the row never runs out before it wraps, however wide the window. Capped, since a row
  // with no layout yet (a hidden frame) measures zero whatever is added; the observer tops it up once it has one.
  addClones();
  const topUp = () => {
    while (reel.children.length < cards.length * 6 && reel.clientWidth && reel.scrollWidth < period() + reel.clientWidth + 1) addClones();
  };
  topUp();
  new ResizeObserver(topUp).observe(reel);

  // The next trip: the first card whose last day hasn't passed. Stop just short of it, so the edge fade misses it.
  const next = cards.find(card => lastDay(card) >= today) || cards[0];
  const stop = () => (next.offsetLeft - EDGE + period()) % period();
  if (!location.hash && reel.clientWidth) reel.scrollLeft = stop();  // a map pin's link keeps its own card in view

  let pos = reel.scrollLeft, last = 0, heldUntil = 0, hovered = false, focused = false, paused = false, onScreen = false, seen = false;
  const tick = now => {
    const dt = Math.min(now - last, 100) / 1000;
    last = now;
    if (Math.abs(reel.scrollLeft - pos) > 2) { heldUntil = now + HOLD; pos = reel.scrollLeft; }  // moved by something else
    if (onScreen && !hovered && !focused && !paused && now >= heldUntil) {
      const before = pos, rest = stop();
      pos += SPEED * dt;
      if (before < rest && pos >= rest) { pos = rest; heldUntil = now + REST; }
      if (pos >= period()) pos -= period();
      reel.scrollLeft = pos;
    } else pos = reel.scrollLeft;
    requestAnimationFrame(tick);
  };

  reel.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") hovered = true; });
  reel.addEventListener("pointerleave", () => { hovered = false; });
  reel.addEventListener("pointerdown", () => { heldUntil = performance.now() + HOLD; });
  reel.addEventListener("focusin", () => { focused = reel.matches(":focus-visible") || !!reel.querySelector(":focus-visible"); });
  reel.addEventListener("focusout", () => { focused = false; });
  new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    if (onScreen && !seen) { seen = true; heldUntil = performance.now() + REST; }  // first look: rest on the next trip
  }, { threshold: 0.25 }).observe(reel);

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "reel-toggle";
  toggle.textContent = "Pause";
  toggle.addEventListener("click", () => {
    paused = !paused;
    toggle.textContent = paused ? "Play" : "Pause";
    heldUntil = 0;
  });
  reel.after(toggle);

  requestAnimationFrame(now => { last = now; tick(now); });
})();
