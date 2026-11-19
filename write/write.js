// The Writings editor: a light, private Medium for amalmehta.com. It reads writings.html from GitHub, lets you
// write a post in place (it looks as it will on the site), and Publish commits writings.html and feed.xml to
// main in one commit, as you. GitHub Pages then puts it live in about a minute.
//
// Hardened for visitors: nothing works without a GitHub token that can write to the repo. The token stays
// in this browser (sessionStorage, or localStorage if you tick Remember) and is only ever sent to
// api.github.com; the page's CSP allows no other connection. It refuses to run inside a frame, is kept out
// of search, and every edit is rebuilt from a small whitelist (paragraphs, bold, italic, safe links) before
// it is written, so nothing typed or pasted can add scripts or styles to the site.
//
// On localhost, /write/?local edits the working copy instead: nothing is sent anywhere, and Publish leaves the
// result in window.__writeOut for checking.
(() => {
  "use strict";
  if (window.top !== window.self) { document.body.textContent = ""; return; }  // no clickjacking

  const REPO = "amalmehta/amalmehta.github.io", BRANCH = "main", API = "https://api.github.com";
  const FILE = "writings.html", FEED = "feed.xml", THINK = "thinking.html";
  const local = ["localhost", "127.0.0.1"].includes(location.hostname) && new URLSearchParams(location.search).has("local");
  const $ = (id) => document.getElementById(id);
  const status = (msg, kind = "", link) => {
    const s = $("status");
    s.className = "write-status" + (kind ? " " + kind : "");
    s.textContent = msg;
    if (link) { const a = document.createElement("a"); a.href = link.href; a.textContent = link.text; a.target = "_blank"; a.rel = "noopener"; s.append(" ", a); }
  };

  // ------------------------------------------------------------------ token and GitHub
  let token = "";
  const store = { get: () => { try { return sessionStorage.getItem("write-token") || localStorage.getItem("write-token") || ""; } catch (e) { return ""; } },
    set: (t, remember) => { try { (remember ? localStorage : sessionStorage).setItem("write-token", t); } catch (e) { /* kept in memory only */ } },
    clear: () => { try { sessionStorage.removeItem("write-token"); localStorage.removeItem("write-token"); } catch (e) { /* nothing stored */ } } };

  async function gh(path, opts = {}) {
    const headers = { Accept: opts.raw ? "application/vnd.github.raw+json" : "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28" };
    if (opts.body) headers["Content-Type"] = "application/json";
    const r = await fetch(API + path, { method: opts.method || "GET", headers, body: opts.body ? JSON.stringify(opts.body) : undefined, cache: "no-store", referrerPolicy: "no-referrer" });
    if (!r.ok) { const e = new Error(`GitHub said ${r.status}`); e.status = r.status; throw e; }
    return opts.raw ? r.text() : r.json();
  }
  const headSha = async () => (await gh(`/repos/${REPO}/git/ref/heads/${BRANCH}`)).object.sha;
  const rawAt = (path, sha) => local ? fetch("../" + path, { cache: "no-store" }).then((r) => r.text()) : gh(`/repos/${REPO}/contents/${path}?ref=${sha}`, { raw: true });

  // ------------------------------------------------------------------ reading writings.html
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthLabel = (ym) => { const [y, m] = ym.split("-").map(Number); return `${MONTHS[m - 1]} ${y}`; };
  const dayLabel = (ymd) => { const [y, m, d] = ymd.split("-").map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; };
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

  function articles(src) {
    const comments = [];
    for (let i = src.indexOf("<!--"); i >= 0; i = src.indexOf("<!--", i)) {
      const e = src.indexOf("-->", i + 4), end = e < 0 ? src.length : e + 3;
      comments.push([i, end]); i = end;
    }
    const inComment = (k) => comments.some(([a, b]) => k >= a && k < b);
    const out = [];
    for (const m of src.matchAll(/<article class="writing" id="([^"]+)">/g)) {
      if (inComment(m.index)) continue;
      const end = src.indexOf("</article>", m.index) + "</article>".length;
      out.push({ id: m[1], start: src.lastIndexOf("\n", m.index) + 1, end, html: src.slice(m.index, end) });
    }
    return out;
  }

  function parsePost(a) {
    const art = new DOMParser().parseFromString(a.html, "text/html").querySelector("article");
    const h2 = art.querySelector("h2"), link = h2 && h2.querySelector("a");
    const post = { id: a.id, title: h2 ? h2.textContent.trim() : "", titleHref: link ? link.getAttribute("href") : "", written: "", note: "", posted: "", blocks: [] };
    for (const el of art.children) {
      if (el === h2) continue;
      if (el.tagName === "P" && el.classList.contains("when")) {
        const t = el.querySelector("time"), dt = t ? t.getAttribute("datetime") : "";
        if (el.classList.contains("written") || /^\d{4}-\d{2}$/.test(dt)) {
          post.written = dt;
          let after = "", seen = false;
          for (const n of el.childNodes) { if (n === t) seen = true; else if (seen) after += n.textContent; }
          post.note = after.replace(/^,\s*/, "").replace(/\.\s*$/, "").trim();
        } else post.posted = dt;
        continue;
      }
      if (el.tagName === "P" && !el.className) post.blocks.push({ type: "p", html: el.innerHTML });
      else post.blocks.push({ type: "raw", html: el.outerHTML });
    }
    return post;
  }

  // ------------------------------------------------------------------ writing writings.html
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const escAttr = (s) => esc(s).replace(/"/g, "&quot;");
  const curl = (s) => s
    .replace(/(^|[\s([{“‘—–-])'/g, "$1‘").replace(/'/g, "’")
    .replace(/(^|[\s([{‘—–-])"/g, "$1“").replace(/"/g, "”");
  const safeHref = (h) => {
    h = (h || "").trim();
    if (/^(https?:\/\/|mailto:|#)/i.test(h)) return h;
    if (h && !/^[a-z][a-z0-9+.-]*:/i.test(h) && !h.startsWith("//")) return h;  // a path on this site
    return "";
  };

  function cleanInline(node) {
    let out = "";
    for (const n of node.childNodes) {
      if (n.nodeType === 3) { out += esc(curl(n.data.replace(/ /g, " "))); continue; }
      if (n.nodeType !== 1 || n.hasAttribute("data-raw")) continue;
      const inner = cleanInline(n), tag = n.tagName;
      if (tag === "B" || tag === "STRONG") out += inner.trim() ? `<strong>${inner}</strong>` : inner;
      else if (tag === "I" || tag === "EM") out += inner.trim() ? `<em>${inner}</em>` : inner;
      else if (tag === "A") { const h = safeHref(n.getAttribute("href")); out += h ? `<a href="${escAttr(h)}">${inner}</a>` : inner; }
      else if (tag === "BR") out += " ";
      else out += inner;  // anything else: keep its words, drop the element
    }
    return out.replace(/\s+/g, " ");
  }

  function serialize(post) {
    const title = esc(curl(post.title));
    const lines = [`      <article class="writing" id="${post.id}">`,
      `        <h2>${post.titleHref ? `<a href="${escAttr(post.titleHref)}">${title}</a>` : title}</h2>`];
    if (post.written) lines.push(`        <p class="when written">Written in <time datetime="${post.written}">${monthLabel(post.written)}</time>${post.note ? ", " + esc(curl(post.note)) : ""}.</p>`);
    lines.push(`        <p class="when posted">Posted <time datetime="${post.posted}">${dayLabel(post.posted)}</time></p>`);
    for (const b of post.blocks) lines.push("        " + (b.type === "p" ? `<p>${b.html}</p>` : b.html));
    lines.push("      </article>");
    return lines.join("\n");
  }

  function applyEdit(src, post, mode) {
    const found = articles(src).find((a) => a.id === post.id);
    if (mode === "archive") {
      const body = src.slice(found.start, found.end).replace(/<!--/g, "<!~~").replace(/-->/g, "~~>");
      return src.slice(0, found.start) + `      <!-- Saved for later, taken down ${today()}:\n${body}\n      -->` + src.slice(found.end);
    }
    if (found) return src.slice(0, found.start) + serialize(post) + src.slice(found.end);
    // A new post goes first: after the template comment that opens the list
    const open = src.indexOf('<div class="writings">');
    const firstComment = src.indexOf("<!--", open), commentEnd = src.indexOf("-->", open);
    const nextArticle = src.indexOf("<article", open);
    let at = src.indexOf("\n", open) + 1;
    if (firstComment >= 0 && commentEnd > 0 && (nextArticle < 0 || firstComment < nextArticle)) at = src.indexOf("\n", commentEnd) + 1;
    return src.slice(0, at) + serialize(post) + "\n" + src.slice(at);
  }

  function slug(title, taken) {
    let s = title.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/, "") || "post";
    let id = s, n = 2;
    while (taken.includes(id)) id = `${s}-${n++}`;
    return id;
  }

  // ------------------------------------------------------------------ the editor
  let loaded = null;       // { head, writings, thinking }
  let posts = [];          // parsed posts, in page order
  let current = null;      // the post being edited (null id = new)
  const raws = [];         // raw blocks (figures and the like), kept exactly as written
  let saved = "";          // the serialized form when opened, to know when something changed

  const body = $("body");
  try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch (e) { /* older browsers use div; both are handled */ }

  function fill(post) {
    current = post;
    $("title").textContent = post.title;
    $("written").value = post.written && /^\d{4}-\d{2}/.test(post.written) ? post.written.slice(0, 7) : "";
    $("written-note").value = post.note;
    $("posted").value = post.posted || today();
    body.textContent = "";
    raws.length = 0;
    for (const b of post.blocks) {
      if (b.type === "p") { const p = document.createElement("p"); p.innerHTML = b.html; body.append(p); continue; }
      const box = document.createElement("div");
      box.className = "write-block"; box.contentEditable = "false"; box.dataset.raw = String(raws.length);
      raws.push(b.html);
      box.innerHTML = b.html.replace(/(src|srcset)="(?!https?:|\/)/g, '$1="../');  // shown from /write/, kept as written
      body.append(box);
    }
    if (!post.blocks.length) body.append(document.createElement("p"));
    saved = serialize(collect());
    for (const li of $("posts").querySelectorAll("button")) li.setAttribute("aria-current", String(li.dataset.id === (post.id || "")));
    $("archive").hidden = !post.id;
    count();
    checkDraft();
  }

  function collect() {
    const blocks = [], BLOCK = /^(P|DIV|H[1-6]|BLOCKQUOTE|UL|OL|LI|PRE|FIGURE)$/;
    let loose = document.createElement("p");  // text and inline bits typed straight into the body, gathered into one paragraph
    const flush = () => { const html = cleanInline(loose).trim(); if (html) blocks.push({ type: "p", html }); loose = document.createElement("p"); };
    for (const n of [...body.childNodes]) {
      if (n.nodeType === 1 && n.dataset && n.dataset.raw !== undefined) { flush(); blocks.push({ type: "raw", html: raws[+n.dataset.raw] }); continue; }
      if (n.nodeType === 1 && BLOCK.test(n.tagName)) { flush(); loose.append(n.cloneNode(true)); flush(); continue; }
      if (n.nodeType === 1 && n.tagName === "BR") { flush(); continue; }
      loose.append(n.cloneNode(true));
    }
    flush();
    const w = $("written").value;
    return { id: current.id, title: $("title").textContent.replace(/\s+/g, " ").trim(), titleHref: current.titleHref || "",
      written: w ? (current.written && current.written.startsWith(w) ? current.written : w) : "", note: w ? $("written-note").value.trim().replace(/\.$/, "") : "",
      posted: $("posted").value || today(), blocks };
  }

  const dirty = () => current && serialize(collect()) !== saved;
  const draftKey = () => "write-draft:" + (current.id || "new");

  function count() {
    const words = (body.textContent.trim().match(/\S+/g) || []).length;
    $("count").textContent = `${words} words · ${Math.max(1, Math.round(words / 230))} min read`;
  }

  function saveDraft() {
    if (!current) return;
    try { if (dirty()) localStorage.setItem(draftKey(), JSON.stringify(collect())); else localStorage.removeItem(draftKey()); } catch (e) { /* no drafts then */ }
  }
  function checkDraft() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(draftKey()) || "null"); } catch (e) { /* none */ }
    $("draft-note").hidden = !(d && serialize({ ...d, id: current.id }) !== saved);
  }

  function listPosts() {
    const ul = $("posts");
    ul.textContent = "";
    for (const p of posts) {
      const li = document.createElement("li"), b = document.createElement("button");
      b.type = "button"; b.dataset.id = p.id;
      b.textContent = p.title || "Untitled";
      const small = document.createElement("small"); small.textContent = p.posted ? dayLabel(p.posted) : "";
      b.append(small);
      b.addEventListener("click", () => { if (dirty() && !confirm("Leave this post? Your changes stay saved as a draft.")) return; saveDraft(); fill(structuredClone(p)); });
      li.append(b); ul.append(li);
    }
  }

  async function load() {
    status("Loading…");
    const head = local ? "local" : await headSha();
    const [writings, thinking] = await Promise.all([rawAt(FILE, head), rawAt(THINK, head)]);
    loaded = { head, writings, thinking };
    posts = articles(writings).map(parsePost);
    listPosts();
    fill(structuredClone(posts[0] || { id: "", title: "", titleHref: "", written: "", note: "", posted: today(), blocks: [] }));
    status(local ? "Local test: editing your working copy; nothing is sent anywhere" : `Up to date with ${BRANCH} · ${head.slice(0, 7)}`);
  }

  async function publish(mode) {
    const post = collect();
    if (mode !== "archive") {
      if (!post.title) return status("Give it a title first.", "bad");
      if (!post.blocks.some((b) => b.type === "p")) return status("Write at least one paragraph first.", "bad");
    }
    const isNew = !post.id;
    if (isNew) post.id = slug(post.title, posts.map((p) => p.id));
    $("publish").disabled = $("archive").disabled = true;
    status(mode === "archive" ? "Taking it down…" : "Publishing…");
    try {
      let { head, writings, thinking } = loaded;
      if (!local) {
        const now = await headSha();
        if (now !== head) {  // someone (you, elsewhere) changed the site since this page loaded
          const fresh = await rawAt(FILE, now);
          if (fresh !== writings) { saveDraft(); return status("Writings changed on GitHub since this page loaded. Reload to get the latest; your text is kept as a draft.", "bad"); }
          head = now; thinking = await rawAt(THINK, now);
        }
      }
      const next = applyEdit(writings, post, mode);
      const feed = window.buildFeed(thinking, next);
      const name = curl(post.title), message = mode === "archive" ? `Writings: “${name}” saved for later` : isNew ? `Writings: “${name}”` : `Writings: edit “${name}”`;
      if (local) {
        window.__writeOut = { writings: next, feed, message };
        loaded.writings = next;
        status(`Local test: built “${name}” (see window.__writeOut); nothing was published`, "ok");
      } else {
        const base = await gh(`/repos/${REPO}/git/commits/${head}`);
        const tree = await gh(`/repos/${REPO}/git/trees`, { method: "POST", body: { base_tree: base.tree.sha, tree: [
          { path: FILE, mode: "100644", type: "blob", content: next }, { path: FEED, mode: "100644", type: "blob", content: feed }] } });
        const commit = await gh(`/repos/${REPO}/git/commits`, { method: "POST", body: { message, tree: tree.sha, parents: [head] } });
        await gh(`/repos/${REPO}/git/refs/heads/${BRANCH}`, { method: "PATCH", body: { sha: commit.sha, force: false } });
        loaded = { head: commit.sha, writings: next, thinking };
        status(mode === "archive" ? `Taken down · live in about a minute ·` : `Published · live in about a minute ·`, "ok", { href: commit.html_url, text: commit.sha.slice(0, 7) });
      }
      try { localStorage.removeItem("write-draft:" + (isNew ? "new" : post.id)); } catch (e) { /* fine */ }
      posts = articles(loaded.writings).map(parsePost);
      listPosts();
      const again = posts.find((p) => p.id === post.id);
      fill(structuredClone(again || posts[0] || { id: "", title: "", titleHref: "", written: "", note: "", posted: today(), blocks: [] }));
    } catch (e) {
      saveDraft();
      status(e.status === 409 || e.status === 422 ? "The site changed while publishing. Reload and try again; your text is kept as a draft." : `Couldn’t publish: ${e.message}. Your text is kept as a draft.`, "bad");
    } finally { $("publish").disabled = $("archive").disabled = false; }
  }

  // ------------------------------------------------------------------ wiring
  body.addEventListener("input", () => { count(); clearTimeout(body.t); body.t = setTimeout(saveDraft, 800); });
  for (const id of ["title", "written", "written-note", "posted"]) $(id).addEventListener("input", () => { clearTimeout(body.t); body.t = setTimeout(saveDraft, 800); });
  $("title").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); body.focus(); } });
  $("title").addEventListener("paste", (e) => { e.preventDefault(); document.execCommand("insertText", false, (e.clipboardData.getData("text/plain") || "").replace(/\s+/g, " ")); });
  body.addEventListener("paste", (e) => {  // paste as plain paragraphs: nothing from elsewhere's formatting comes along
    e.preventDefault();
    const paras = (e.clipboardData.getData("text/plain") || "").replace(/\r/g, "").split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean);
    paras.forEach((p, i) => { if (i) document.execCommand("insertParagraph"); document.execCommand("insertText", false, p); });
  });
  body.addEventListener("drop", (e) => e.preventDefault());  // no dragging in images or HTML

  // The floating format bar
  const tools = $("tools");
  document.addEventListener("selectionchange", () => {
    const s = getSelection();
    if (!s.rangeCount || s.isCollapsed || !body.contains(s.anchorNode)) { tools.hidden = true; return; }
    const r = s.getRangeAt(0).getBoundingClientRect(), page = document.querySelector(".write-page").getBoundingClientRect();
    tools.hidden = false;
    tools.style.left = Math.max(0, r.left - page.left + r.width / 2 - tools.offsetWidth / 2) + "px";
    tools.style.top = r.top - page.top - tools.offsetHeight - 8 + "px";
  });
  for (const b of tools.querySelectorAll("button")) {
    b.addEventListener("mousedown", (e) => e.preventDefault());  // keep the selection
    b.addEventListener("click", () => {
      const cmd = b.dataset.cmd;
      if (cmd === "link") {
        const url = safeHref(prompt("Link to (https://… or a page on this site):", "https://") || "");
        if (url && url !== "https://") document.execCommand("createLink", false, url);
      } else document.execCommand(cmd);
      saveDraft();
    });
  }

  $("new-post").addEventListener("click", () => {
    if (dirty() && !confirm("Start a new post? Your changes here stay saved as a draft.")) return;
    saveDraft();
    fill({ id: "", title: "", titleHref: "", written: "", note: "", posted: today(), blocks: [] });
    $("title").focus();
  });
  $("publish").addEventListener("click", () => publish("publish"));
  $("archive").addEventListener("click", () => { if (confirm("Take this post off the site? It’s kept in writings.html as a “Saved for later” comment, so it can come back.")) publish("archive"); });
  $("draft-restore").addEventListener("click", () => {
    try { const d = JSON.parse(localStorage.getItem(draftKey())); const keep = saved; fill({ ...d, id: current.id, titleHref: current.titleHref }); saved = keep; } catch (e) { /* nothing to restore */ }
    $("draft-note").hidden = true;
  });
  $("draft-discard").addEventListener("click", () => { try { localStorage.removeItem(draftKey()); } catch (e) { /* fine */ } $("draft-note").hidden = true; });
  addEventListener("beforeunload", (e) => { if (dirty()) { saveDraft(); e.preventDefault(); } });

  async function signIn(t, remember) {
    token = t;
    $("gate-error").textContent = "";
    try {
      if (!local) {
        const repo = await gh(`/repos/${REPO}`);
        if (!repo.permissions || !repo.permissions.push) throw Object.assign(new Error("that token can’t write to the site"), { status: 403 });
      }
      if (remember !== undefined) store.set(t, remember);
      $("gate").hidden = true; $("desk").hidden = false; $("actions").hidden = false;
      await load();
    } catch (e) {
      token = ""; store.clear();
      $("gate").hidden = false; $("desk").hidden = true; $("actions").hidden = true;
      $("gate-error").textContent = e.status === 401 ? "That token wasn’t accepted." : e.status === 404 || e.status === 403 ? "That token can’t write to the site’s repository." : `Couldn’t sign in: ${e.message}`;
      status("");
    }
  }
  $("sign-in").addEventListener("click", () => { const t = $("token").value.trim(); $("token").value = ""; if (t) signIn(t, $("remember").checked); });
  $("token").addEventListener("keydown", (e) => { if (e.key === "Enter") $("sign-in").click(); });
  $("sign-out").addEventListener("click", () => { store.clear(); token = ""; location.reload(); });

  if (local) signIn("local");
  else { const t = store.get(); if (t) signIn(t); }
})();
