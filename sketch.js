// Profile, Skills: the first time the section comes into view, each group's hand-drawn icon traces its own
// lines in, one after another, then the pen's lighter second pass follows. Without JS, or with reduced
// motion, the icons are simply shown.
(() => {
  const skills = document.getElementById("skills");
  if (!skills || !("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const icons = [...skills.querySelectorAll(".skill-icon")];
  icons.forEach((icon, i) => {
    icon.classList.add("sketching");
    icon.querySelectorAll("path").forEach(p => {
      p.setAttribute("pathLength", "1");
      p.style.setProperty("--d", `${(i * 0.18 + (p.classList.contains("again") ? 0.55 : 0)).toFixed(2)}s`;
    });
  });
  const io = new IntersectionObserver(es => {
    if (!es.some(e => e.isIntersecting)) return;
    io.disconnect();
    icons.forEach(icon => icon.classList.add("sketched"));
  }, { threshold: 0.2 });
  io.observe(skills);
})();
