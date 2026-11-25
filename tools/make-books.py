#!/usr/bin/env python3
"""Builds the Books section of interests.html from books.json.

Run from the repo root after editing books.json: python3 tools/make-books.py
The tests fail if the page no longer matches the file.

books.json has three lists, newest first. Only title and author are required:

  "reading": [{"title": "…", "author": "…", "started": "2026-10", "note": "Optional line so far."}]
  "read":    [{"title": "…", "author": "…", "finished": "2026-09", "stars": 4.5, "review": "A line or two."}]
  "want":    [{"title": "…", "author": "…", "why": "Optional line on why."}]

Dates are YYYY-MM. Stars are 0–5 in halves. Any book can take "cover": 0–7 to pick its
cover colour; otherwise one is picked from the title. A list with no books isn't shown,
and the whole section stays hidden until there's at least one book.
"""
import datetime, html, json, pathlib, re, zlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGE = ROOT / "interests.html"
START, END = "<!-- books:start (built by tools/make-books.py from books.json; don't edit by hand) -->", "<!-- books:end -->"
GROUPS = (
    ("reading", "Reading now", "started", "note"),
    ("read", "Read", "finished", "review"),
    ("want", "Want to read", None, "why"),
)
COVERS = 8
I = "    "


def month(value, field, title):
    try:
        return datetime.datetime.strptime(value, "%Y-%m")
    except (TypeError, ValueError):
        raise SystemExit(f"{title}: {field} should be YYYY-MM, got {value!r}")


def card(book, kind, date_field, text_field):
    if not isinstance(book, dict):
        raise SystemExit(f"each book should be an object with a title and an author, got {book!r}")
    title, author = book.get("title"), book.get("author")
    if not title or not author:
        raise SystemExit(f"every book needs a title and an author: {book}")
    for field in ("title", "author", date_field, text_field):
        if field in book and not isinstance(book[field], str):
            raise SystemExit(f"{title}: {field} should be text in quotes, got {book[field]!r}")
    unknown = set(book) - {"title", "author", "cover", date_field, text_field, "stars" if kind == "read" else None}
    if unknown:
        raise SystemExit(f"{title}: unexpected field(s) {sorted(unknown)} for a {kind!r} book")
    cover = book.get("cover", zlib.crc32(title.encode()) % COVERS)
    if isinstance(cover, bool) or cover not in range(COVERS):
        raise SystemExit(f"{title}: cover should be 0–{COVERS - 1}")
    e = html.escape
    lines = [f'<article class="book cover-{cover}">',
             '  <div class="book-art" aria-hidden="true">',
             f'    <div class="book-page"><span>{e(title)}</span><span>{e(author)}</span></div>',
             f'    <div class="book-cover"><span>{e(title)}</span></div>',
             '  </div>',
             '  <div class="book-body">']
    if date_field and book.get(date_field):
        when = month(book[date_field], date_field, title)
        label = "Reading since" if kind == "reading" else "Finished"
        lines.append(f'    <p class="book-status">{label} <time datetime="{when:%Y-%m}">{when:%b %Y}</time></p>')
    lines += [f'    <h4>{e(title)}</h4>',
              f'    <p class="book-by">{e(author)}</p>']
    if "stars" in book:
        n = book["stars"]
        if isinstance(n, bool) or not isinstance(n, (int, float)) or not 0 <= n <= 5 or not float(n * 2).is_integer():
            raise SystemExit(f"{title}: stars should be 0–5 in halves, got {n!r}")
        n = f"{n:g}"
        lines.append(f'    <p class="stars" data-stars="{n}" role="img" aria-label="{n} out of 5 stars">★★★★★</p>')
    if book.get(text_field):
        lines.append(f'    <p class="book-review">{e(book[text_field])}</p>')
    lines += ["  </div>", "</article>"]
    return lines


def build(data=None):
    if data is None:
        data = json.loads((ROOT / "books.json").read_text(encoding="utf-8"))
    unknown = set(data) - {key for key, *_ in GROUPS}
    if unknown:
        raise SystemExit(f"books.json: unknown list(s) {sorted(unknown)}; use reading, read and want")
    groups = [(key, heading, data.get(key) or [], date, text) for key, heading, date, text in GROUPS]
    has_books = any(books for _, _, books, _, _ in groups)
    out = [START, f'<section class="books" id="books"{"" if has_books else " hidden"}>',
           '  <h2 class="section-title">Books</h2>']
    for key, heading, books, date, text in groups:
        if not books:
            continue
        out += [f'  <h3 class="book-group">{heading}</h3>', '  <div class="book-grid">' if key != "reading" else '  <div class="book-grid reading-now">']
        for book in books:
            out += ["    " + line for line in card(book, key, date, text)]
        out.append("  </div>")
    out += ["</section>", END]
    return "\n".join(I + line for line in out)


def update(page_text, section):
    start = page_text.index(START)
    end = page_text.index(END) + len(END)
    line_start = page_text.rindex("\n", 0, start) + 1
    return page_text[:line_start] + section + page_text[end:]


if __name__ == "__main__":
    PAGE.write_text(update(PAGE.read_text(encoding="utf-8"), build()), encoding="utf-8")
    print("updated the Books section of interests.html")
