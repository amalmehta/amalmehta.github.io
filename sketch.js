// The hand-drawn icons trace their own lines in, one after another, the first time their group comes into view:
// Skills and Open to on the profile, and the topics on Things I'm thinking about. In Skills the pen's lighter
// second pass follows. Without JS, or with reduced motion, the icons are simply shown.
(() => {
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const groups = [document.getElementById("skills"), document.getElementById("open-to"), ...document.querySelectorAll(".topics")];
  for (const group of groups) {
    if (!group || group.closest("[hidden]")) continue;
    const icons = [...group.querySelectorAll(".skill-icon")];
    if (!icons.length) continue;
    icons.forEach((icon, i) => {
      icon.classList.add("sketching");
      icon.querySelectorAll("path, circle, ellipse, line, polyline, rect").forEach(p => {
        p.setAttribute("pathLength", "1");
        p.style.setProperty("--d", `${(i * 0.15 + (p.classList.contains("again") ? 0.55 : 0)).toFixed(2)}s`);
      });
    });
    const io = new IntersectionObserver(es => {
      if (!es.some(e => e.isIntersecting)) return;
      io.disconnect();
      icons.forEach(icon => icon.classList.add("sketched"));
    }, { threshold: 0.2 });
    io.observe(group);
  }
})();
