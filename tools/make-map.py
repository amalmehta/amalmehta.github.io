#!/usr/bin/env python3
"""Builds the Travel page's map (photos.html): every place I'm going, would like to go, or have been,
as a pin on a world map, with the countries I've been to tinted.

Run from the repo root after changing PINS or BEEN_COUNTRIES: python3 tools/make-map.py
The tests fail if the page no longer matches, or if a trip or wishlist card has no pin.

The coastlines are Natural Earth's public-domain 1:110m countries, as packaged by world-atlas
(tools/data/, see its README), in the Equal Earth projection. Colours come from styles.css, so the
map follows the light and dark themes. A "going" or "want" pin links to its card (id="place-…").
"""
import html, json, math, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGE = ROOT / "photos.html"
DATA = ROOT / "tools/data/world-atlas-countries-110m.json"
START, END = "<!-- map:start (built by tools/make-map.py; don't edit by hand) -->", "<!-- map:end -->"
I = "    "

# kind, label, latitude, longitude, card id. Soonest trips and favourites first.
PINS = [
    ("expedition", "Climbing Cerro Torre, Argentina", -49.29, -73.10, "place-cerro-torre"),
    ("going", "Lassen Volcanic, California", 40.54, -121.56, "place-lassen"),  # Manzanita Lake
    ("going", "Chamonix, France", 45.92, 6.87, "place-chamonix"),
    ("want", "Lofoten, Norway", 67.93, 13.09, "place-lofoten"),
    ("want", "Patagonia, Chile", -50.94, -73.41, "place-patagonia"),
    ("want", "Bhutan", 27.49, 89.36, "place-bhutan"),
    ("want", "Samarkand, Uzbekistan", 39.65, 66.96, "place-samarkand"),
    ("want", "Faroe Islands", 62.11, -7.43, "place-faroe-islands"),
    ("want", "Garibaldi, British Columbia", 49.93, -123.03, "place-garibaldi"),
    ("want", "Glacier National Park, Montana", 48.68, -113.60, "place-glacier-national-park"),
    ("want", "Moorea, French Polynesia", -17.53, -149.83, "place-moorea"),
    ("want", "Mexico City, Mexico", 19.44, -99.14, "place-mexico-city"),
    ("want", "Azores (São Miguel), Portugal", 37.86, -25.78, "place-azores"),
    ("want", "Swimming with humpback whales, Tonga", -18.65, -173.98, "place-tonga"),  # Vava'u
    ("want", "Dublin, Ireland", 53.35, -6.26, "place-dublin"),
    ("want", "Edinburgh, Scotland", 55.95, -3.19, "place-edinburgh"),
    ("been", "London", 51.51, -0.13, None),
    ("been", "Rome", 41.90, 12.50, None),
    ("been", "Florence", 43.77, 11.26, "place-florence"),
    ("been", "New York City", 40.71, -74.01, None),
    ("been", "Washington, DC", 38.91, -77.04, "place-seattle-to-dc"),
    ("been", "Boston, Massachusetts", 42.36, -71.06, "place-boston"),
    ("been", "Yosemite", 37.75, -119.53, "place-yosemite"),
    ("been", "Channel Islands", 34.0, -119.8, None),
    ("been", "Lake Tahoe", 39.10, -120.03, None),
    ("been", "Japan", 36.2, 138.3, "place-japan"),
    ("been", "Skiing in Niseko, Japan", 42.86, 140.70, "place-niseko"),
    ("been", "Skiing in Whistler, British Columbia", 50.12, -122.95, "place-whistler"),
    ("been", "Thailand", 15.5, 101.0, None),
    ("been", "Singapore", 1.35, 103.82, None),
    ("been", "Pakistan", 28.3, 65.0, "place-hunza"),
    ("been", "Salkantay trek to Machu Picchu, Peru", -13.16, -72.55, "place-machu-picchu"),
    ("been", "Kilimanjaro, Tanzania", -3.08, 37.35, "place-kilimanjaro"),
    ("been", "Scuba diving in Sipadan, Malaysia", 4.11, 118.63, None),
    ("been", "Scuba diving in Palau", 7.50, 134.60, None),
    ("been", "Jaipur, India", 26.92, 75.79, None),
]
# Countries tinted as visited (names as in the data)
BEEN_COUNTRIES = {"United Kingdom", "Italy", "United States of America", "India", "Japan", "Thailand", "Pakistan", "Peru", "Tanzania", "Malaysia", "Canada"}
KINDS = {"expedition": "Expeditions", "going": "Going", "want": "Want to go", "been": "Been"}
# Long trips drawn as lines: class, title, legend key, and the (lat, lon) points it passes through.
# Two points make a gentle arc, more make a smooth curve through them; neither follows the exact roads.
# (The Salkantay trek is a pin: at about 60 km it would be a single pixel at this scale.)
ROUTES = [
    ("ride", "Seattle to Washington, DC, by bike", "Seattle to DC by bike", [(47.61, -122.33), (38.91, -77.04)]),
    ("road", "Road trip across Pakistan, Karachi to Hunza", "Road trip across Pakistan",
     [(24.86, 67.01), (31.55, 74.34), (33.68, 73.05), (36.32, 74.66)]),
]

W = 1200
NORTH, SOUTH = 84.0, -62.0  # Antarctica and the far Arctic are left off
PAD = 28  # room around the map so it sits inside its frame and edge pins aren't clipped

# Equal Earth projection (Šavrič, Patterson and Jenny, 2018)
A1, A2, A3, A4 = 1.340264, -0.081106, 0.000893, 0.003796
M = math.sqrt(3) / 2


def equal_earth(lon, lat):
    lam, phi = math.radians(lon), math.radians(lat)
    t = math.asin(M * math.sin(phi))
    t2, t6 = t * t, t ** 6
    x = lam * math.cos(t) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)))
    y = t * (A1 + A2 * t2 + t6 * (A3 + A4 * t2))
    return x, y


SCALE = (W / 2) / equal_earth(180, 0)[0]
TOP = equal_earth(0, NORTH)[1]
H = round((TOP - equal_earth(0, SOUTH)[1]) * SCALE)


def project(lon, lat):
    x, y = equal_earth(lon, max(SOUTH, min(NORTH, lat)))
    return W / 2 + x * SCALE, (TOP - y) * SCALE


def decode(topo):
    """The data's arcs as lists of (lon, lat): delta-encoded and quantized in TopoJSON."""
    (sx, sy), (tx, ty) = topo["transform"]["scale"], topo["transform"]["translate"]
    arcs = []
    for arc in topo["arcs"]:
        x = y = 0
        pts = []
        for dx, dy in arc:
            x += dx; y += dy
            pts.append((x * sx + tx, y * sy + ty))
        arcs.append(pts)
    return arcs


def ring(arcs, indexes):
    out = []
    for i in indexes:
        pts = arcs[i] if i >= 0 else arcs[~i][::-1]
        out.extend(pts[1:] if out else pts)
    return out


def path(rings):
    """An SVG path for some rings, in whole pixels (a tenth of a pixel is invisible and was a third
    of the page's weight), dropping points that round onto the last one, split where a ring jumps
    across the map's edge."""
    d = []
    for r in rings:
        last = None
        for lon, lat in r:
            x, y = (round(v) for v in project(lon, lat))
            if last is None or abs(x - last[0]) > W / 2:
                d.append(f"M{x} {y}")
            elif (x, y) == last:
                continue
            else:
                d.append(f"L{x} {y}")
            last = (x, y)
        d.append("Z")
    return "".join(d).replace("ZM", "Z M")


def country_paths():
    topo = json.loads(DATA.read_text(encoding="utf-8"))
    arcs = decode(topo)
    out = []
    for g in topo["objects"]["countries"]["geometries"]:
        name = g.get("properties", {}).get("name", "")
        if name in ("Antarctica", "Fr. S. Antarctic Lands") or not g.get("arcs"):
            continue
        polys = g["arcs"] if g["type"] == "MultiPolygon" else [g["arcs"]]
        rings = [ring(arcs, r) for poly in polys for r in poly]
        out.append((name, path(rings)))
    missing = BEEN_COUNTRIES - {n for n, _ in out}
    if missing:
        raise SystemExit(f"make-map.py: no country named {sorted(missing)} in the data")
    return out


def graticule():
    d = []
    for lon in range(-180, 181, 30):
        pts = [project(lon, lat) for lat in range(int(SOUTH), int(NORTH) + 1, 2)]
        d.append("M" + "L".join(f"{x:.0f} {y:.0f}" for x, y in pts))
    for lat in range(-30, 61, 30):
        pts = [project(lon, lat) for lon in range(-180, 181, 3)]
        d.append("M" + "L".join(f"{x:.0f} {y:.0f}" for x, y in pts))
    return "".join(d)


def outline():
    left = [project(-180, lat) for lat in range(int(NORTH), int(SOUTH) - 1, -2)]
    right = [project(180, lat) for lat in range(int(SOUTH), int(NORTH) + 1, 2)]
    return "M" + "L".join(f"{x:.0f} {y:.0f}" for x, y in left + right) + "Z"


def routes():
    """Each route as a line that draws itself in: two ends make a quadratic arc bowed a little north,
    more points a curve through their midpoints."""
    out = []
    for kind, title, _, points in ROUTES:
        xy = [project(lon, lat) for lat, lon in points]
        (x0, y0), (x1, y1) = xy[0], xy[-1]
        if len(xy) == 2:
            cx, cy = (x0 + x1) / 2, (y0 + y1) / 2 - abs(x1 - x0) * 0.12
            d = f"M{x0:.1f} {y0:.1f}Q{cx:.1f} {cy:.1f} {x1:.1f} {y1:.1f}"
        else:
            # Each inner point bends the curve, which passes through the midpoints between them
            d = f"M{x0:.1f} {y0:.1f}" + "".join(
                f"Q{x:.1f} {y:.1f} {(x + nx) / 2:.1f} {(y + ny) / 2:.1f}" for (x, y), (nx, ny) in zip(xy[1:-2], xy[2:-1])
            ) + f"Q{xy[-2][0]:.1f} {xy[-2][1]:.1f} {x1:.1f} {y1:.1f}"
        out += [f'    <g class="map-route map-{kind}"><title>{html.escape(title)}</title>',
                f'      <mask id="{kind}-reveal"><path class="map-route-reveal" pathLength="1" d="{d}"/></mask>',
                f'      <path class="map-route-line" mask="url(#{kind}-reveal)" d="{d}"/>',
                f'      <circle class="map-route-end" cx="{x0:.1f}" cy="{y0:.1f}" r="4"/><circle class="map-route-end" cx="{x1:.1f}" cy="{y1:.1f}" r="4"/>',
                '    </g>']
    return out


def build():
    counts = {k: sum(1 for p in PINS if p[0] == k) for k in KINDS}
    summary = (f"World map of my travels: {counts['expedition']} expedition I’m working toward, {counts['going']} place I’m going, {counts['want']} places I’d like to go "
               f"and {counts['been']} places I’ve been")
    lines = [START,
             '<figure class="travel-map">',
             f'  <svg viewBox="{-PAD} {-PAD} {W + 2 * PAD} {H + 2 * PAD}" role="img" aria-labelledby="map-title">',
             f'    <title id="map-title">{html.escape(summary)}</title>',
             f'    <path class="map-ocean" d="{outline()}"/>',
             f'    <path class="map-grid" d="{graticule()}"/>']
    for name, d in country_paths():
        cls = "map-land map-been" if name in BEEN_COUNTRIES else "map-land"
        lines.append(f'    <path class="{cls}" d="{d}"/>')
    lines += routes()
    # Been first, then want, then going, with expeditions on top
    for kind in ("been", "want", "going", "expedition"):
        for k, label, lat, lon, card in PINS:
            if k != kind:
                continue
            x, y = project(lon, lat)
            tip = html.escape(f"{label}: {'expedition' if k == 'expedition' else KINDS[k].lower()}")
            r = {"expedition": 11, "going": 11, "want": 9, "been": 7}[k]  # big enough to see and tap at phone width
            pin = (f'<g class="pin pin-{k}"><title>{tip}</title><circle class="pin-halo" cx="{x:.1f}" cy="{y:.1f}" r="{r * 2.2:.0f}"/>'
                   f'<circle class="pin-dot" cx="{x:.1f}" cy="{y:.1f}" r="{r}"/></g>')
            lines.append(f'    <a href="#{card}">{pin}</a>' if card else f"    {pin}")
    lines += ["  </svg>",
              '  <figcaption class="map-legend">' + " ".join(
                  f'<span class="key key-{k}">{KINDS[k]} <span class="key-count">{counts[k]}</span></span>' for k in KINDS)
              + "".join(f' <span class="key key-{kind}">{html.escape(key)}</span>' for kind, _, key, _ in ROUTES) + "</figcaption>",
              # Pin names show on hover, which phones don't have, so the places I've been are listed too
              # (the trip and wishlist places have their cards just below)
              '  <div class="map-been"><p class="key key-been">Been</p><ul class="map-been-list">'
              + "".join(f"<li>{html.escape(label)}</li>" for k, label, *_ in PINS if k == "been") + "</ul></div>",
              "</figure>", END]
    return "\n".join(I + line for line in lines)


def update(page_text, section):
    start = page_text.index(START)
    end = page_text.index(END) + len(END)
    line_start = page_text.rindex("\n", 0, start) + 1
    return page_text[:line_start] + section + page_text[end:]


if __name__ == "__main__":
    PAGE.write_text(update(PAGE.read_text(encoding="utf-8"), build()), encoding="utf-8")
    print("updated the map in photos.html")
