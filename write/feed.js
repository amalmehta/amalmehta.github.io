// The RSS feed, built in the browser exactly as tools/make-feed.py builds it, so a post published from the
// editor updates feed.xml in the same commit and the tests (which compare the two) stay green.
// Keep the two in step: change one, change the other. Runs in the browser and in Node (for checking).
(function (root) {
  "use strict";
  const SITE = "https://amalmehta.com/";
  const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", mdash: "—", ndash: "–", hellip: "…" };

  function unescape(s) {
    if (typeof DOMParser !== "undefined") {
      return new DOMParser().parseFromString("<!doctype html><body>" + s.replace(/</g, "&lt;"), "text/html").body.textContent;
    }
    return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) =>
      e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : (NAMED[e] ?? m));
  }
  const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
  // Python's str.strip(): whitespace only, as Python defines it
  const strip = (s) => s.replace(/^[\s\u001c-\u001f\u0085]+|[\s\u001c-\u001f\u0085]+$/g, "");

  function text(fragment) {
    fragment = fragment.replace(/<button[^>]*\bhidden\b[^>]*>[\s\S]*?<\/button>/g, "");
    return strip(unescape(fragment.replace(/<[^>]+>/g, "")));
  }

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function rfc822(iso) {
    const [y, m, d] = iso.split("-").map(Number), day = new Date(Date.UTC(y, m - 1, d, 12));
    return `${DAYS[day.getUTCDay()]}, ${String(d).padStart(2, "0")} ${MONTHS[m - 1]} ${y} 12:00:00 +0000`;
  }

  function item(page, id, body) {
    const title = text(/<h2>([\s\S]*?)<\/h2>/.exec(body)[1]);
    const summary = text(/<p>([\s\S]*?)<\/p>/.exec(body)[1]);
    const days = [...body.matchAll(/<time datetime="(\d{4}-\d{2}-\d{2})">/g)].map((m) => m[1]);
    const link = `${SITE}${page}#${id}`;
    return `    <item>\n      <title>${escape(title)}</title>\n      <link>${link}</link>\n`
      + `      <guid>${link}</guid>\n      <pubDate>${rfc822(days[days.length - 1])}</pubDate>\n`
      + `      <description>${escape(summary)}</description>\n    </item>\n`;
  }

  function build(thinkingHtml, writingsHtml) {
    const thinking = thinkingHtml.replace(/<!--[\s\S]*?-->/g, "");
    const writings = writingsHtml.replace(/<!--[\s\S]*?-->/g, "");
    const items = [...thinking.matchAll(/<li class="thought" id="([^"]+)">([\s\S]*?)<\/li>/g)].map((m) => item("thinking.html", m[1], m[2]));
    // A piece's summary is its first paragraph after the dates
    for (const m of writings.matchAll(/<article class="writing" id="([^"]+)">([\s\S]*?)<\/article>/g)) {
      items.push(item("writings.html", m[1], m[2].replace(/<p class="when[^"]*">[\s\S]*?<\/p>/g, "") + m[2]));
    }
    return '<?xml version="1.0" encoding="utf-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n'
      + `    <atom:link href="${SITE}feed.xml" rel="self" type="application/rss+xml"/>\n`
      + "    <title>Thinking and writing · Amal Mehta</title>\n"
      + `    <link>${SITE}thinking.html</link>\n`
      + "    <description>Open questions and writing by Amal Mehta.</description>\n"
      + "    <language>en</language>\n" + items.join("") + "  </channel>\n</rss>\n";
  }

  if (typeof module !== "undefined" && module.exports) module.exports = { build };
  else root.buildFeed = build;
})(this);
