// Interests: each upcoming event says how far off it is, like the next trip on Travel:
// "In 136 days", "Tomorrow", or "Tonight" on the day. Worked out from today's date in the visitor's browser.
(() => {
  const today = Date.parse(new Date().toLocaleDateString("en-CA"));
  for (const time of document.querySelectorAll(".events time[datetime]")) {
    const day = time.getAttribute("datetime");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
    const days = Math.round((Date.parse(day) - today) / 86400000);
    if (days < 0) continue;
    const tag = document.createElement("span");
    tag.className = "trip-countdown";
    tag.textContent = days === 0 ? "Tonight" : days === 1 ? "Tomorrow" : `In ${days} days`;
    time.before(tag);
  }
})();
