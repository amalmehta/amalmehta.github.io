// Case studies: at the end of each deep dive, the next one's card rises into view, its picture drifting slowly,
// so the pages lead into each other. It follows the page's own "next →" link.
(() => {
  const main = document.querySelector("main.case");
  if (!main) return;
  const ORDER = [
    ["project-rewarding.html", "Rewarding What You Can’t Verify", "A code agent trained on visible tests learns to delete untested code until real correctness falls to 2%.", "images/case/rewarding.webp"],
    ["project-bci.html", "BCI Projects", "Decoding movement from neural recordings for 138 days with no new labels.", "images/case/bci.webp"],
    ["project-replicate-sota.html", "Replicate SOTA", "Qwen3.5-0.8B rebuilt from scratch, matching the official model at every position.", "images/case/replicate-sota.webp"],
    ["project-drone.html", "Drone Autonomy", "A simulated quadrotor that maps unknown rooms, plans with A* and adapts to wind and worn motors.", "images/case/drone.webp"],
    ["project-robot-soccer.html", "Robot Soccer", "One RL policy walks a Unitree Go1 to a ball and kicks it at a target, trained only in simulation.", "images/robot-soccer.svg"],
    ["project-alphago.html", "AlphaGo Lite", "A 9×9 Go engine that taught itself by self-play on one laptop.", "images/case/alphago.webp"],
    ["project-post-training.html", "Post Training Lab", "A small transformer learns a maze by SFT, then GRPO and DPO lift held-out success.", "images/case/post-training.webp"],
  ];
  // follow the page's own "next →" link, so the card and the links below the story agree
  const nextLink = [...document.querySelectorAll(".case-nav a")].find(a => a.textContent.trim().endsWith("→"));
  const want = nextLink ? nextLink.getAttribute("href") : null;
  const here = location.pathname.split("/").pop() || "";
  const at = ORDER.findIndex(o => o[0] === here);
  const pick = want ? ORDER.find(o => o[0] === want) : at >= 0 ? ORDER[(at + 1) % ORDER.length] : null;
  if (!pick) return;
  const [href, title, line, img] = pick;
  const aside = document.createElement("aside");
  aside.className = "next-case";
  aside.setAttribute("aria-label", "Next project");
  aside.innerHTML = `<p class="next-kicker">Next project</p><a class="next-card" href="${href}"><span class="next-thumb"><img src="${img}" alt="" loading="lazy"></span><span class="next-text"><strong></strong><span class="next-line"></span></span><span class="next-arrow" aria-hidden="true">→</span></a>`;
  aside.querySelector("strong").textContent = title;
  aside.querySelector(".next-line").textContent = line;
  main.appendChild(aside);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) { aside.classList.add("risen"); return; }
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); aside.classList.add("risen"); } }, { threshold: 0.35 });
  io.observe(aside);
})();
