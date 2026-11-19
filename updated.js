// Header: "Evolving site · Nov 2026" turns into how long ago the site last changed. GitHub Pages stamps
// every file with the time of the last deploy, so the page's own Last-Modified is when it last went live.
// Older than a month, or with no stamp, it keeps the month.
(() => {
  const time = document.querySelector(".nav-status time");
  const when = Date.parse(document.lastModified);
  if (!time || !when || !("RelativeTimeFormat" in Intl)) return;
  const show = () => {
    const s = (Date.now() - when) / 1000;
    if (s < 0 || s > 30 * 86400) return;
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "short" });
    const ago = s < 60 ? "just now"
      : s < 3600 ? rtf.format(-Math.round(s / 60), "minute")
      : s < 86400 ? rtf.format(-Math.round(s / 3600), "hour")
      : rtf.format(-Math.round(s / 86400), "day");
    time.textContent = `updated ${ago}`;
    time.dateTime = new Date(when).toISOString();
    time.title = new Date(when).toLocaleString();
  };
  show();
  setInterval(show, 60000);
})();
