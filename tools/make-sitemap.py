#!/usr/bin/env python3
"""Builds sitemap.xml: every public page (noindex pages stay out) by its canonical
address, with the date it last changed, so search engines know what to recrawl.

Run from the repo root after editing a page, before committing: python3 tools/make-sitemap.py
A page with uncommitted changes gets today's date; any other, its last commit's.
The tests check the list of pages and that every date is real and not in the future.
It also sets "Evolving site · <month>" in every page's header (and the deep-dive template)
to the month of the newest change, so the header never falls behind.
"""
import datetime, pathlib, re, subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent


def changed(page):
    name = page.relative_to(ROOT).as_posix()
    git = lambda *args: subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True).stdout.strip()
    if git("status", "--porcelain", "--", name):
        return datetime.date.today().isoformat()
    return git("log", "-1", "--format=%cs", "--", name) or datetime.date.today().isoformat()


def build():
    urls = []
    for page in sorted(ROOT.glob("*.html")):
        html = page.read_text(encoding="utf-8")
        if '<meta name="robots" content="noindex">' in html:
            continue
        loc = re.search(r'<link rel="canonical" href="([^"]+)">', html).group(1)
        urls.append((loc, changed(page)))
    urls.sort(key=lambda u: (u[0].count("/"), not u[0].endswith("/"), u[0]))  # the profile first
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            "<!-- Every public page; pages marked noindex (Writings until its first piece, 404) stay out. "
            "Built by tools/make-sitemap.py; the tests check this list. -->\n"
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + "".join(f"  <url><loc>{loc}</loc><lastmod>{day}</lastmod></url>\n" for loc, day in urls)
            + "</urlset>\n")


HEADER = re.compile(r'(<a class="nav-status"[^>]*>Evolving site · <time datetime=")\d{4}-\d{2}(">)[A-Z][a-z]{2} \d{4}(</time>)')


def date_headers(sitemap):
    """Point every header's "Evolving site · <month>" at the newest change in the sitemap; True if any page moved."""
    newest = datetime.date.fromisoformat(max(re.findall(r"<lastmod>([\d-]+)</lastmod>", sitemap)))
    label = newest.strftime("%b %Y")
    moved = False
    for path in sorted(ROOT.glob("*.html")) + [ROOT / "tools" / "make-case-studies.py"]:
        text = path.read_text(encoding="utf-8")
        new = HEADER.sub(lambda m: f"{m.group(1)}{newest:%Y-%m}{m.group(2)}{label}{m.group(3)}", text)
        if new != text:
            path.write_text(new, encoding="utf-8")
            moved = True
    return moved


if __name__ == "__main__":
    sitemap = build()
    if date_headers(sitemap):
        sitemap = build()  # the pages whose header changed now count as changed today
    (ROOT / "sitemap.xml").write_text(sitemap, encoding="utf-8")
    print("wrote sitemap.xml")
