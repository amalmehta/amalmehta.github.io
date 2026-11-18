#!/usr/bin/env python3
"""Builds the Travel page's color script: Pixar plans a film's colour as a strip of small frames,
one per scene. Here each frame is one trip in the Trip timeline, in date order, painted with its
drawing's own colours (sky on top, then the colours it uses most), and links to its card.

Run from the repo root after adding, archiving or redrawing a trip: python3 tools/make-color-script.py
"""
import collections, html, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGE = ROOT / "photos.html"
START, END = "<!-- color-script:start (built by tools/make-color-script.py; don't edit by hand) -->", "<!-- color-script:end -->"
FW, FH, GAP, BANDS = 120, 64, 8, 5


def hexrgb(c):
    c = c.lstrip("#")
    if len(c) == 3:
        c = "".join(ch * 2 for ch in c)
    return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))


def far(a, b):
    return sum((x - y) ** 2 for x, y in zip(hexrgb(a), hexrgb(b))) > 45 ** 2


def palette(svg):
    """The drawing's sky gradient, then its most used fills that differ enough from each other."""
    stops = re.findall(r'<stop offset="[\d.]+" stop-color="(#[0-9a-fA-F]{3,6})"', svg)[:2]
    counts = collections.Counter(re.findall(r'fill="(#[0-9a-fA-F]{3,6})"', svg))
    picks = []
    for c, _ in counts.most_common():
        if all(far(c, p) for p in picks + stops):
            picks.append(c)
        if len(picks) == BANDS:
            break
    return stops, picks


def build(page):
    body = re.sub(r"<!--.*?-->", "", page[page.index('<section class="wishlist going">'):], flags=re.S)
    body = body[:body.index("</section>")]
    trips = re.findall(r'<figure class="photo" id="(place-[a-z0-9-]+)">\s*<img src="(images/places/[a-z0-9-]+\.svg)".*?<strong>([^<]+)</strong>', body, re.S)
    w = len(trips) * (FW + GAP) - GAP
    out = [f'<svg class="color-script" viewBox="0 0 {w} {FH}" width="{w}" height="{FH}" role="img" aria-labelledby="color-script-title">',
           '<title id="color-script-title">Color script: each trip’s colours, in date order</title>']
    for i, (pid, img, name) in enumerate(trips):
        stops, picks = palette((ROOT / img).read_text(encoding="utf-8"))
        x = i * (FW + GAP)
        gid = f"cs-{pid}"
        frame = [f'<defs><linearGradient id="{gid}" x1="0" y1="0" x2="0" y2="1">'
                 + "".join(f'<stop offset="{k}" stop-color="{c}"/>' for k, c in zip((0, 1), stops)) + '</linearGradient>'
                 f'<clipPath id="{gid}-clip"><rect x="{x}" y="0" width="{FW}" height="{FH}" rx="6"/></clipPath></defs>',
                 f'<g clip-path="url(#{gid}-clip)"><rect x="{x}" y="0" width="{FW}" height="{FH}" fill="url(#{gid})"/>']
        bw = FW / max(len(picks), 1)
        for k, c in enumerate(picks):
            frame.append(f'<rect x="{x + k * bw:.1f}" y="{FH * 0.58:.0f}" width="{bw + 0.5:.1f}" height="{FH * 0.42:.0f}" fill="{c}"/>')
        frame.append("</g>")
        out.append(f'<a href="#{pid}"><title>{html.escape(name)}</title>{"".join(frame)}</a>')
    out.append("</svg>")
    return "\n      " + "".join(out) + "\n      "


page = PAGE.read_text(encoding="utf-8")
a, b = page.index(START) + len(START), page.index(END)
PAGE.write_text(page[:a] + build(page) + page[b:], encoding="utf-8")
print("updated the color script in", PAGE.name)
