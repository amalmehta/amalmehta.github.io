// Things I'm thinking about: each "Where I'd bet right now" line gets a hand-drawn ink underline that
// draws itself in the first time the line scrolls into view, like marking the bet in pen.
// Added only with JavaScript; with reduced motion the underline is simply there, already drawn.
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const bets = document.querySelectorAll(".bet");
  bets.forEach((bet, i) => {
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "bet-ink");
    svg.setAttribute("viewBox", "0 0 200 8");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");
    // A slightly wavering pen stroke, a little different under each bet.
    const w = (k) => (4 + Math.sin(i * 2.3 + k) * 1.6).toFixed(1);
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", `M2,${w(0)} C50,${w(1)} 90,${w(2)} 130,${w(3)} S180,${w(4)} 198,${w(5)}`);
    path.setAttribute("pathLength", "1");
    svg.appendChild(path);
    bet.appendChild(svg);
    bet.classList.add("inked");
    if (reduce || !("IntersectionObserver" in window)) { bet.classList.add("drawn"); return; }
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { io.disconnect(); bet.classList.add("drawn"); }
    }, { threshold: 1, rootMargin: "0px 0px -15% 0px" });
    io.observe(bet);
  });
})();
