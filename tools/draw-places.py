"""Draws the Travel page's illustrations (the Trip timeline, Places I'd like to go, Places I've been) as 1200x800 SVGs in images/places/.

Each is an original drawing of one iconic spot, not a photograph. Run from the
repo root after changing a drawing:
  python3 tools/draw-places.py
"""
import math, os, random, sys

OUT = sys.argv[1] if len(sys.argv) > 1 else "images/places"
W, H = 1200, 800
INK = "#1c1b19"


def grad(gid, top, bottom, x2=0, y2=1):
    return (f'<linearGradient id="{gid}" x1="0" y1="0" x2="{x2}" y2="{y2}">'
            f'<stop offset="0" stop-color="{top}"/><stop offset="1" stop-color="{bottom}"/></linearGradient>')


def svg(name, body, sky, defs=""):
    top, bottom = sky
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
            f'<defs>{grad(name + "-sky", top, bottom)}{defs}</defs>'
            f'<rect width="{W}" height="{H}" fill="url(#{name}-sky)"/>{body}</svg>')


def pts(points):
    return " ".join(f"{x:.1f},{y:.1f}" for x, y in points)


def poly(points, fill, **kw):
    extra = "".join(f' {k.replace("_", "-")}="{v}"' for k, v in kw.items())
    return f'<polygon points="{pts(points)}" fill="{fill}"{extra}/>'


def ridge(x0, x1, base, rng, peaks, height, jag=0.0, step=20):
    """A mountain silhouette: smooth bumps plus optional jagged noise, closed at `base`."""
    out = [(x0, base)]
    phases = [rng.uniform(0, 6.28) for _ in peaks]
    x = x0
    while x <= x1:
        t = (x - x0) / (x1 - x0)
        y = 0.0
        for (c, w, a), ph in zip(peaks, phases):
            y = max(y, a * math.exp(-((t - c) / w) ** 2))
        y = height * y + jag * rng.uniform(-1, 1)
        out.append((x, base - y))
        x += step
    out.append((x1, base))
    return out


def clouds(rng, n, y0, y1, colour="#ffffff", opacity=0.55, x0=0, x1=W):
    out = []
    for _ in range(n):
        cx, cy, w = rng.uniform(x0, x1), rng.uniform(y0, y1), rng.uniform(120, 260)
        for k in range(5):
            out.append(f'<ellipse cx="{cx + (k - 2) * w * 0.22 + rng.uniform(-10, 10):.0f}" cy="{cy - rng.uniform(0, 18):.0f}" '
                       f'rx="{w * rng.uniform(0.2, 0.32):.0f}" ry="{w * rng.uniform(0.07, 0.12):.0f}" fill="{colour}" opacity="{opacity}"/>')
    return "".join(out)


_glows = [0]


def glow(cx, cy, rx, ry, colour, opacity):
    """A soft light that fades to nothing at its edge (no visible rim)."""
    _glows[0] += 1
    gid = f"glow{_glows[0]}"
    return (f'<defs><radialGradient id="{gid}"><stop offset="0" stop-color="{colour}" stop-opacity="{opacity}"/>'
            f'<stop offset="1" stop-color="{colour}" stop-opacity="0"/></radialGradient></defs>'
            f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="url(#{gid})"/>')


# ---------------------------------------------------------------- Hokkaido: Mount Yotei over snowfields
def hokkaido():
    rng = random.Random(1)
    b = []
    # Mount Yotei: a near-perfect cone with a flat crater top.
    b.append(glow(600, 560, 760, 190, "#f6dccd", 0.7))
    b.append(clouds(rng, 4, 90, 200, opacity=0.6))
    cone = [(170, 560), (520, 250), (600, 238), (680, 250), (1030, 560)]
    b.append(poly(cone, "#7f97b2"))
    snow = [(330, 420), (520, 250), (600, 238), (680, 250), (870, 420)]
    edge = [(870, 420)]
    for i in range(1, 16):
        x = 870 - i * 36
        edge.append((x, 420 - 40 * math.sin(i * 1.7) ** 2 - rng.uniform(0, 30)))
    b.append(poly(snow + edge[1:], "#f7f9fb"))
    b.append(poly([(600, 238), (680, 250), (1030, 560), (640, 560)], "#24364d", opacity="0.16"))
    # Rolling snowfields.
    b.append(f'<path d="M0,600 C200,560 380,600 600,580 S1000,550 1200,590 L1200,800 L0,800 Z" fill="#eef2f6"/>')
    b.append(f'<path d="M0,680 C250,640 520,700 760,660 S1080,640 1200,670 L1200,800 L0,800 Z" fill="#fbfcfd"/>')
    b.append(f'<path d="M0,690 C250,650 520,710 760,670" fill="none" stroke="#dbe4ee" stroke-width="4"/>')
    # A line of conifers on the middle ridge, and a lone tree in front.
    for i in range(26):
        x = 40 + i * 44 + rng.uniform(-8, 8)
        y = 585 - 12 * math.sin(x / 180)
        h = rng.uniform(26, 44)
        b.append(poly([(x - h * 0.28, y), (x, y - h), (x + h * 0.28, y)], "#2f4a3c"))
    tx, ty = 840, 668
    b.append(f'<path d="M{tx},{ty} L{tx},{ty - 90}" stroke="#3b3a37" stroke-width="7" stroke-linecap="round"/>')
    for a, l in ((-0.9, 50), (-0.4, 60), (0.3, 55), (0.8, 45), (-0.1, 40)):
        bx, by = tx, ty - 55 - l * 0.2
        b.append(f'<path d="M{bx},{by} L{bx + l * math.sin(a):.0f},{by - l * math.cos(a):.0f}" stroke="#3b3a37" stroke-width="3" stroke-linecap="round"/>')
    b.append(f'<ellipse cx="{tx}" cy="{ty + 4}" rx="60" ry="7" fill="#c8d4e2" opacity="0.7"/>')
    # Falling snow.
    for _ in range(140):
        b.append(f'<circle cx="{rng.uniform(0, W):.0f}" cy="{rng.uniform(0, H):.0f}" r="{rng.uniform(1.5, 3.5):.1f}" fill="#fff" opacity="0.85"/>')
    return svg("hokkaido", "".join(b), ("#c9d8e8", "#eef2f6"))


# ---------------------------------------------------------------- Lofoten: red cabins under Reine's peaks
def lofoten():
    rng = random.Random(2)
    b = []
    b.append(glow(700, 470, 620, 220, "#f7c9a8", 0.55))
    b.append(clouds(rng, 3, 70, 170, colour="#fbe7da", opacity=0.7))
    far = ridge(0, W, 520, rng, [(0.15, 0.08, 0.7), (0.32, 0.06, 1.0), (0.52, 0.1, 0.85), (0.8, 0.07, 0.95), (0.95, 0.06, 0.6)], 330, jag=14, step=16)
    b.append(poly(far, "#6b7d92"))
    b.append(f'<rect x="0" y="400" width="{W}" height="120" fill="url(#lofoten-haze)"/>')
    for x, y in far[1:-1:3]:  # snow streaks in the gullies
        if y < 360 and rng.random() < 0.6:
            b.append(f'<path d="M{x:.0f},{y + 8:.0f} L{x + rng.uniform(-14, 14):.0f},{y + rng.uniform(50, 110):.0f}" stroke="#eef2f6" stroke-width="4" stroke-linecap="round" opacity="0.9"/>')
    near = ridge(0, 520, 540, rng, [(0.2, 0.25, 0.9), (0.7, 0.2, 0.6)], 150, jag=6)
    b.append(poly(near, "#4c5b6c"))
    # Water and the peaks' reflection.
    b.append(f'<rect x="0" y="520" width="{W}" height="{H - 520}" fill="#4f7e9c"/>')
    refl = [(x, 520 + (520 - y) * 0.55) for x, y in far]
    b.append(poly(refl, "#3f6a86", opacity="0.75"))
    for _ in range(40):
        y = rng.uniform(560, 790)
        x = rng.uniform(0, W)
        b.append(f'<path d="M{x:.0f},{y:.0f} l{rng.uniform(30, 90):.0f},0" stroke="#9cc0d6" stroke-width="2.5" opacity="0.6" stroke-linecap="round"/>')
    # Rocky shore and the rorbuer on stilts.
    b.append(f'<path d="M560,540 C700,520 900,528 1200,520 L1200,560 L560,560 Z" fill="#5d5a55"/>')
    for i, x in enumerate((600, 700, 790, 890, 980, 1080)):
        w, h = rng.uniform(70, 86), rng.uniform(46, 58)
        base = 540 - i * 1.5
        for sx in (x + 8, x + w - 8):
            b.append(f'<line x1="{sx:.0f}" y1="{base:.0f}" x2="{sx:.0f}" y2="{base + 34:.0f}" stroke="#2f2d2a" stroke-width="4"/>')
        b.append(f'<rect x="{x:.0f}" y="{base - h:.0f}" width="{w:.0f}" height="{h:.0f}" fill="#b23a2c"/>')
        b.append(poly([(x - 6, base - h), (x + w / 2, base - h - 30), (x + w + 6, base - h)], "#2f2d2a"))
        b.append(f'<rect x="{x + w / 2 - 9:.0f}" y="{base - h + 14:.0f}" width="18" height="16" fill="#f7f3ea"/>')
        b.append(f'<rect x="{x:.0f}" y="{base + 34:.0f}" width="{w:.0f}" height="{h * 0.5:.0f}" fill="#b23a2c" opacity="0.35"/>')
    return svg("lofoten", "".join(b), ("#f2d6c4", "#dfe8f0"),
               defs=grad("lofoten-haze", "#dfe8f0", "#dfe8f0").replace('stop-color="#dfe8f0"/>', 'stop-color="#dfe8f0" stop-opacity="0"/>', 1)
               .replace('<stop offset="1" stop-color="#dfe8f0"/>', '<stop offset="1" stop-color="#dfe8f0" stop-opacity="0.55"/>'))


# ---------------------------------------------------------------- Patagonia: the towers of Torres del Paine
def patagonia():
    rng = random.Random(3)
    b = []
    for cx, cy, rx in ((330, 120, 170), (880, 90, 210), (620, 60, 130)):
        for k in range(3):
            b.append(f'<ellipse cx="{cx}" cy="{cy + k * 9}" rx="{rx - k * 30}" ry="{12 - k * 2}" fill="#ffffff" opacity="{0.75 - k * 0.15:.2f}"/>')
    back = ridge(0, W, 480, rng, [(0.1, 0.12, 0.5), (0.85, 0.15, 0.55)], 200, jag=5)
    b.append(poly(back, "#8d98a6"))
    # Three granite towers, lit on one side.
    for cx, top, w in ((470, 150, 92), (600, 110, 104), (735, 165, 88)):
        left = [(cx - w * 0.75, 470), (cx - w * 0.5, top + 60), (cx - w * 0.3, top + 8), (cx, top), (cx + w * 0.18, top + 14)]
        right = [(cx + w * 0.18, top + 14), (cx + w * 0.42, top + 70), (cx + w * 0.7, 470)]
        b.append(poly(left + right, "#c9bfae"))
        b.append(poly([(cx, top), (cx + w * 0.18, top + 14), (cx + w * 0.42, top + 70), (cx + w * 0.7, 470), (cx + w * 0.05, 470)], "#9c9282"))
        b.append(f'<path d="M{cx - w * 0.6:.0f},{top + 150:.0f} L{cx + w * 0.55:.0f},{top + 150:.0f}" stroke="#7f776a" stroke-width="3" opacity="0.6"/>')
    # Dark moraine with snow patches below the towers.
    mor = ridge(60, 1140, 534, rng, [(0.5, 0.32, 1.0), (0.15, 0.2, 0.45), (0.85, 0.2, 0.5)], 130, jag=4)
    b.append(poly(mor, "#4f5258"))
    for _ in range(9):
        x, y = rng.uniform(340, 860), rng.uniform(430, 480)
        b.append(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{rng.uniform(16, 40):.0f}" ry="5" fill="#eef2f6"/>')
    # Turquoise lake and golden steppe in front.
    b.append(f'<rect x="0" y="530" width="{W}" height="120" fill="#3fa9b5"/>')
    for _ in range(26):
        x, y = rng.uniform(0, W), rng.uniform(545, 640)
        b.append(f'<path d="M{x:.0f},{y:.0f} l{rng.uniform(30, 80):.0f},0" stroke="#a9dde2" stroke-width="2.5" opacity="0.7" stroke-linecap="round"/>')
    b.append(f'<path d="M0,640 C220,610 480,660 760,630 S1080,610 1200,630 L1200,800 L0,800 Z" fill="#c6a457"/>')
    b.append(f'<path d="M0,700 C300,670 600,720 900,690 S1150,680 1200,690 L1200,800 L0,800 Z" fill="#a8873f"/>')
    for _ in range(90):
        x, y = rng.uniform(0, W), rng.uniform(650, 800)
        b.append(f'<path d="M{x:.0f},{y:.0f} l{rng.uniform(-4, 4):.0f},-{rng.uniform(10, 22):.0f}" stroke="#7d6328" stroke-width="2" stroke-linecap="round"/>')
    return svg("patagonia", "".join(b), ("#a9c8e3", "#e8eff5"))


# ---------------------------------------------------------------- Bhutan: Tiger's Nest on its cliff
def bhutan():
    rng = random.Random(4)
    b = []
    for base, col, amp in ((520, "#9db3a2", 210), (620, "#6f8f78", 170)):
        b.append(poly(ridge(0, W, base, rng, [(0.15, 0.2, 0.8), (0.5, 0.25, 0.6), (0.85, 0.2, 0.9)], amp, jag=3), col))
    # The cliff face.
    cliff = [(600, 800), (640, 420), (700, 230), (760, 120), (900, 90), (1200, 80), (1200, 800)]
    b.append(poly(cliff, "#8b7f72"))
    for i in range(14):
        x = 700 + i * 34
        b.append(f'<path d="M{x},{140 + rng.uniform(0, 40):.0f} L{x - 30 + rng.uniform(-10, 10):.0f},{700:.0f}" stroke="#6f655b" stroke-width="3" opacity="0.6"/>')
    # The monastery: white halls with red bands and gold roofs, stepped on a ledge.
    halls = ((700, 330, 120, 70), (790, 290, 110, 80), (860, 340, 140, 64), (750, 390, 110, 52))
    for x, y, w, h in halls:
        b.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#f6f2e8" stroke="#6f655b" stroke-width="1.5"/>')
        b.append(f'<rect x="{x}" y="{y}" width="{w}" height="10" fill="#9b2f23"/>')
        b.append(poly([(x - 12, y), (x + w / 2, y - 26), (x + w + 12, y)], "#c89a2e"))
        for k in range(3):
            b.append(f'<rect x="{x + 16 + k * (w - 40) / 2:.0f}" y="{y + 24}" width="12" height="18" fill="#3b3a37"/>')
    b.append(f'<path d="M690,430 C760,422 860,420 1010,410" stroke="#6f655b" stroke-width="5" fill="none"/>')
    b.append(f'<path d="M0,640 C200,620 420,660 640,640 L640,800 L0,800 Z" fill="#4f6f58"/>')
    # Pines in the foreground.
    for i in range(16):
        x = rng.uniform(0, 620)
        y = rng.uniform(690, 780)
        h = rng.uniform(70, 120)
        b.append(poly([(x - h * 0.22, y), (x, y - h), (x + h * 0.22, y)], "#2f4a3c"))
    # A string of prayer flags across the front.
    b.append(f'<path d="M0,560 Q420,650 820,600" stroke="#5f5c55" stroke-width="2" fill="none"/>')
    colours = ("#2f6db5", "#f7f3ea", "#c0392b", "#2f855a", "#e0b62e")
    for i in range(18):
        t = (i + 0.5) / 18
        x = 820 * t
        y = (1 - t) ** 2 * 560 + 2 * (1 - t) * t * 650 + t * t * 600
        b.append(f'<rect x="{x - 15:.0f}" y="{y:.0f}" width="30" height="38" fill="{colours[i % 5]}" stroke="#5f5c55" stroke-width="1" transform="rotate({rng.uniform(-6, 6):.0f} {x:.0f} {y:.0f})"/>')
    return svg("bhutan", "".join(b), ("#c7dcea", "#f1efe6"))


# ---------------------------------------------------------------- Samarkand: the Registan
def samarkand():
    rng = random.Random(5)
    b = []
    TILE, TURQ, BRICK, DARK = "#2a5f9e", "#2f9bb5", "#d4b483", "#b8955f"

    def minaret(x, top, w=30):
        out = [f'<rect x="{x - w / 2}" y="{top}" width="{w}" height="{620 - top}" fill="{BRICK}"/>']
        for y in range(top + 30, 600, 46):
            out.append(f'<rect x="{x - w / 2}" y="{y}" width="{w}" height="12" fill="{TILE}"/>')
        out.append(f'<rect x="{x - w / 2 - 6}" y="{top - 12}" width="{w + 12}" height="14" fill="{TURQ}"/>')
        return "".join(out)

    def madrasa(cx, w, top, dome=None):
        out = []
        if dome:  # ribbed dome behind the portal
            dx, dy, r = dome
            out.append(f'<rect x="{dx - r * 0.55}" y="{dy}" width="{r * 1.1}" height="40" fill="{BRICK}"/>')
            out.append(f'<path d="M{dx - r},{dy} A{r},{r * 1.05} 0 0 1 {dx + r},{dy} Z" fill="{TURQ}"/>')
            for k in range(-3, 4):
                out.append(f'<path d="M{dx + k * r / 4:.0f},{dy} Q{dx + k * r / 7:.0f},{dy - r * 0.7:.0f} {dx},{dy - r * 1.04:.0f}" stroke="#1f7088" stroke-width="2" fill="none"/>')
        out.append(f'<rect x="{cx - w / 2}" y="{top}" width="{w}" height="{620 - top}" fill="{BRICK}"/>')
        out.append(f'<rect x="{cx - w / 2}" y="{top}" width="{w}" height="18" fill="{TILE}"/>')
        out.append(f'<rect x="{cx - w / 2 + 10}" y="{top + 18}" width="{w - 20}" height="{620 - top - 18}" fill="none" stroke="{TILE}" stroke-width="8"/>')
        # Pointed arch in the portal.
        aw, at = w * 0.5, top + 70
        out.append(f'<path d="M{cx - aw / 2},620 L{cx - aw / 2},{at + 60} Q{cx - aw / 2},{at} {cx},{at - 20} Q{cx + aw / 2},{at} {cx + aw / 2},{at + 60} L{cx + aw / 2},620 Z" fill="{TILE}"/>')
        out.append(f'<path d="M{cx - aw / 2 + 16},620 L{cx - aw / 2 + 16},{at + 70} Q{cx - aw / 2 + 16},{at + 18} {cx},{at + 2} Q{cx + aw / 2 - 16},{at + 18} {cx + aw / 2 - 16},{at + 70} L{cx + aw / 2 - 16},620 Z" fill="{DARK}"/>')
        for k in range(4):  # tile pattern dots on the portal frame
            out.append(f'<circle cx="{cx - w / 2 + 22 + k * (w - 44) / 3:.0f}" cy="{top + 40}" r="6" fill="{TURQ}"/>')
        return "".join(out)

    # Side wings, then the three madrasas (Ulugh Beg, Tilya-Kori with its dome, Sher-Dor).
    b.append(f'<rect x="60" y="430" width="1080" height="190" fill="{DARK}"/>')
    for x in range(80, 1140, 40):
        b.append(f'<path d="M{x},620 L{x},480 Q{x + 15},460 {x + 30},480 L{x + 30},620" fill="#9c7c4c"/>')
    b.append(minaret(70, 250))
    b.append(madrasa(230, 260, 260))
    b.append(minaret(390, 250))
    b.append(madrasa(600, 240, 300, dome=(600, 300, 120)))
    b.append(minaret(810, 250))
    b.append(madrasa(970, 260, 260))
    b.append(minaret(1130, 250))
    # The paved square.
    b.append(f'<rect x="0" y="620" width="{W}" height="{H - 620}" fill="#d9cdb6"/>')
    for k in range(-12, 13):
        b.append(f'<path d="M{600 + k * 30},620 L{600 + k * 140},{H}" stroke="#c7b99e" stroke-width="2"/>')
    for y in (650, 690, 745):
        b.append(f'<path d="M0,{y} L{W},{y}" stroke="#c7b99e" stroke-width="2"/>')
    return svg("samarkand", "".join(b), ("#5b8fc7", "#e7eef6"))


# ---------------------------------------------------------------- Faroe Islands: Mulafossur falling into the sea
def faroe():
    rng = random.Random(6)
    b = []
    b.append(glow(930, 300, 420, 170, "#f7f4ec", 0.55))
    b.append(clouds(rng, 5, 40, 230, colour="#f2f4f5", opacity=0.55))
    # Mykines on the horizon.
    b.append(poly(ridge(760, 1200, 445, rng, [(0.35, 0.22, 1.0), (0.75, 0.12, 0.6)], 95, jag=2), "#a3afb6"))
    # Sea.
    b.append(f'<rect x="0" y="444" width="{W}" height="{H - 444}" fill="url(#faroe-sea)"/>')
    for _ in range(70):
        x, y = rng.uniform(0, W), rng.uniform(460, 790)
        b.append(f'<path d="M{x:.0f},{y:.0f} l{rng.uniform(25, 70) * (0.5 + (y - 440) / 360):.0f},0" stroke="#a9c3cf" '
                 f'stroke-width="{1.5 + (y - 440) / 200:.1f}" opacity="0.5" stroke-linecap="round"/>')
    # Steep green mountains behind the village, with gullies.
    mtn = "M0,410 L0,60 C60,40 120,30 190,52 C260,74 300,110 360,160 C420,212 470,262 540,318 C580,350 610,372 640,392 L640,410 Z"
    b.append(f'<path d="{mtn}" fill="url(#faroe-grass)"/>')
    for x0 in (60, 130, 200, 270, 340, 410):
        y0 = 60 + (x0 / 640) ** 1.4 * 320
        b.append(f'<path d="M{x0},{y0:.0f} C{x0 + 12},{y0 + 80:.0f} {x0 - 8},{y0 + 160:.0f} {x0 + 18},{min(y0 + 250, 390):.0f}" '
                 f'stroke="#3f6634" stroke-width="3" fill="none" opacity="0.55"/>')
    # The cliff: layered basalt with grass ledges, under the village.
    edge = [(612, 392), (640, 420), (662, 500), (676, 560), (690, 612)]
    cliff = [(0, 398), (300, 392)] + edge + [(0, 612)]
    b.append(f'<polygon points="{pts(cliff)}" fill="url(#faroe-rock)"/>')
    for y in range(414, 606, 22):
        ex = next(x for x, yy in reversed(edge) if yy <= y + 30) if y > 392 else 612
        wob = rng.uniform(-3, 3)
        b.append(f'<path d="M0,{y + wob:.0f} C200,{y - 4:.0f} 420,{y + 4:.0f} {ex - 6},{y:.0f}" stroke="#34332f" stroke-width="3" fill="none" opacity="0.7"/>')
        if rng.random() < 0.7:
            gx = rng.uniform(20, ex - 160)
            b.append(f'<path d="M{gx:.0f},{y - 3} l{rng.uniform(60, 160):.0f},{rng.uniform(-2, 2):.0f}" stroke="#5f8a4c" stroke-width="4" stroke-linecap="round"/>')
    b.append(poly([(612, 392), (640, 420), (662, 500), (676, 560), (690, 612), (650, 612), (640, 520), (620, 430)], "#2c2b28", opacity="0.45"))
    # Grass lip along the cliff top.
    b.append(f'<path d="M0,398 L300,392 L612,392 L604,384 L0,386 Z" fill="#5d8b4b"/>')
    # The stream and the waterfall.
    b.append(f'<path d="M330,300 C380,330 420,340 470,352 S560,372 604,390" stroke="#a8cfdd" stroke-width="6" fill="none" stroke-linecap="round"/>')
    b.append(f'<path d="M600,390 C606,430 612,520 620,612 L652,612 C640,520 628,440 616,392 Z" fill="#f6f9fa"/>')
    for k in range(4):
        b.append(f'<path d="M{604 + k * 3},{400 + k * 12} C{610 + k * 3},{470} {616 + k * 4},{540} {624 + k * 6},{606}" stroke="#cddde3" stroke-width="2" fill="none"/>')
    b.append(glow(636, 614, 60, 16, "#ffffff", 0.8))
    for _ in range(24):
        b.append(f'<circle cx="{rng.uniform(604, 676):.0f}" cy="{rng.uniform(596, 630):.0f}" r="{rng.uniform(5, 13):.0f}" fill="#fff" opacity="0.5"/>')
    b.append(f'<path d="M0,614 C120,606 300,620 460,612 S640,606 700,616" stroke="#dbe7ec" stroke-width="4" fill="none" opacity="0.8"/>')
    # Gasadalur: tarred houses with turf roofs, one red, and a small white church.
    for x, y, col in ((380, 350, "#2a2927"), (432, 356, "#9f3426"), (486, 362, "#2a2927"), (330, 344, "#2a2927")):
        b.append(f'<rect x="{x}" y="{y}" width="40" height="22" fill="{col}"/>')
        b.append(f'<rect x="{x + 15}" y="{y + 8}" width="8" height="8" fill="#f0e9d8"/>')
        b.append(poly([(x - 5, y), (x + 20, y - 15), (x + 45, y)], "#557f43"))
    cx, cy = 530, 368
    b.append(f'<rect x="{cx}" y="{cy}" width="36" height="20" fill="#f4f1ea"/>')
    b.append(poly([(cx - 4, cy), (cx + 18, cy - 14), (cx + 40, cy)], "#2a2927"))
    b.append(f'<rect x="{cx + 26}" y="{cy - 20}" width="8" height="12" fill="#f4f1ea"/>')
    b.append(poly([(cx + 24, cy - 20), (cx + 30, cy - 30), (cx + 36, cy - 20)], "#2a2927"))
    # Seabirds.
    for _ in range(7):
        x, y, w = rng.uniform(680, 1000), rng.uniform(200, 380), rng.uniform(8, 14)
        b.append(f'<path d="M{x - w:.0f},{y:.0f} q{w / 2:.0f},-{w / 2:.0f} {w:.0f},0 q{w / 2:.0f},-{w / 2:.0f} {w:.0f},0" stroke="#3b3a37" stroke-width="2" fill="none"/>')
    # Foreground: the grassy slope we're standing on, with a path and fence posts.
    b.append(f'<path d="M700,800 C780,720 940,650 1200,610 L1200,800 Z" fill="#5d8b4b"/>')
    b.append(f'<path d="M820,800 C900,740 1040,690 1200,668 L1200,800 Z" fill="#4c7a3d"/>')
    b.append(f'<path d="M1000,800 C1040,760 1110,720 1200,700" stroke="#a89a7c" stroke-width="10" fill="none" stroke-linecap="round"/>')
    for i in range(6):
        x = 780 + i * 80
        y = 800 - (x - 700) * 0.36 - 8
        b.append(f'<line x1="{x}" y1="{y:.0f}" x2="{x}" y2="{y - 34:.0f}" stroke="#4a3b2a" stroke-width="5" stroke-linecap="round"/>')
    for i in range(5):
        x1, x2 = 780 + i * 80, 860 + i * 80
        b.append(f'<line x1="{x1}" y1="{800 - (x1 - 700) * 0.36 - 30:.0f}" x2="{x2}" y2="{800 - (x2 - 700) * 0.36 - 30:.0f}" stroke="#6b5a45" stroke-width="2"/>')
    for _ in range(110):
        x = rng.uniform(720, 1200)
        ytop = 800 - (x - 700) * 0.38
        y = rng.uniform(max(ytop, 600), 800)
        b.append(f'<path d="M{x:.0f},{y:.0f} l{rng.uniform(-3, 3):.0f},-{rng.uniform(8, 16):.0f}" stroke="#3f6a32" stroke-width="2" stroke-linecap="round"/>')
    defs = (grad("faroe-sea", "#6f94a3", "#36596a") + grad("faroe-grass", "#7aa465", "#4d7a40")
            + grad("faroe-rock", "#55544f", "#3a3935"))
    return svg("faroe", "".join(b), ("#b4c0c8", "#e4e8ea"), defs=defs)


# ---------------------------------------------------------------- Chamonix: Mont Blanc and the Aiguille du Midi
def chamonix():
    rng = random.Random(7)
    b = []
    b.append(glow(820, 300, 620, 260, "#fbe7d6", 0.55))
    b.append(clouds(rng, 3, 70, 170, opacity=0.5))
    # Far ridge, then the Mont Blanc massif: a broad snow dome on the right.
    b.append(poly(ridge(0, W, 580, rng, [(0.15, 0.12, 0.6), (0.45, 0.1, 0.5), (0.8, 0.2, 0.7)], 150, jag=6), "#a9b8c9"))
    dome = [(380, 580), (560, 330), (700, 250), (790, 205), (860, 190), (930, 200), (1030, 250), (1130, 320), (1200, 360), (1200, 580)]
    b.append(poly(dome, "#f4f7fa"))
    b.append(poly([(860, 190), (930, 200), (1030, 250), (1130, 320), (1200, 360), (1200, 580), (900, 580)], "#24364d", opacity="0.10"))
    for x0, y0 in ((640, 300), (760, 250), (980, 260), (1090, 320)):  # rock bands showing through the snow
        b.append(f'<path d="M{x0},{y0} q{rng.uniform(10, 30):.0f},{rng.uniform(40, 70):.0f} {rng.uniform(-10, 20):.0f},{rng.uniform(110, 150):.0f}" '
                 f'fill="none" stroke="#7b8796" stroke-width="{rng.uniform(5, 9):.0f}" stroke-linecap="round" opacity="0.35"/>')
    # The Bossons glacier, tumbling from the dome toward the valley.
    b.append(f'<path d="M840,215 C820,300 760,400 730,560 L810,560 C830,400 860,300 870,215 Z" fill="#e3edf6"/>')
    b.append(f'<path d="M760,420 l20,-6 M772,380 l22,-6 M790,330 l20,-5" stroke="#b9cde0" stroke-width="4" stroke-linecap="round"/>')
    # The Aiguille du Midi: granite needles on the left, the summit station on the tallest.
    needles = [(100, 580), (170, 360), (200, 300), (215, 210), (232, 150), (250, 214), (272, 260), (300, 230), (330, 320), (380, 300), (430, 400), (500, 580)]
    b.append(poly(needles, "#5f6670"))
    b.append(poly([(232, 150), (250, 214), (272, 260), (300, 230), (330, 320), (380, 300), (430, 400), (500, 580), (300, 580)], "#24364d", opacity="0.22"))
    b.append(poly([(200, 300), (215, 210), (232, 150), (240, 190), (222, 240)], "#f4f7fa", opacity="0.85"))
    b.append(f'<rect x="222" y="128" width="22" height="24" rx="2" fill="#3b3a37"/><path d="M233,128 L233,104" stroke="#3b3a37" stroke-width="3"/>')
    # The cable car line down to the valley, with one cabin on it.
    b.append(f'<path d="M244,146 Q520,420 780,520" fill="none" stroke="#3b3a37" stroke-width="1.6" opacity="0.7"/>')
    b.append(f'<rect x="520" y="372" width="18" height="14" rx="3" fill="#c8402f"/><path d="M529,366 L529,372" stroke="#3b3a37" stroke-width="2"/>')
    b.append(f'<rect x="768" y="512" width="26" height="18" rx="2" fill="#3b3a37"/>')  # the valley station
    # Snowfields and dark pine forest on the lower slopes.
    b.append(f'<path d="M0,560 C240,500 520,540 760,520 S1060,500 1200,530 L1200,800 L0,800 Z" fill="#e9eff5"/>')
    for i in range(46):
        x = rng.uniform(0, W)
        y = 545 - 18 * math.sin(x / 210) + rng.uniform(-6, 26)
        h = rng.uniform(30, 58)
        b.append(poly([(x - h * 0.26, y), (x, y - h), (x + h * 0.26, y)], rng.choice(("#2f4a3c", "#294235", "#365443"))))
    # The valley floor, ski tracks and a few snow-roofed chalets.
    b.append(f'<path d="M0,650 C260,610 560,670 820,630 S1100,610 1200,640 L1200,800 L0,800 Z" fill="#fbfcfd"/>')
    for d in ("M90,800 C200,720 240,690 330,660", "M140,800 C250,720 300,690 380,662"):
        b.append(f'<path d="{d}" fill="none" stroke="#d3deea" stroke-width="3" stroke-linecap="round"/>')
    for cx, cy, w in ((560, 690, 70), (650, 678, 56), (930, 668, 64), (1030, 690, 74)):
        h = w * 0.55
        b.append(f'<rect x="{cx - w / 2:.0f}" y="{cy - h:.0f}" width="{w}" height="{h:.0f}" fill="#8a5a3b"/>')
        b.append(f'<rect x="{cx - w * 0.18:.0f}" y="{cy - h * 0.62:.0f}" width="{w * 0.14:.0f}" height="{h * 0.3:.0f}" fill="#f1c76b"/>')
        b.append(poly([(cx - w * 0.66, cy - h + 2), (cx, cy - h - w * 0.42), (cx + w * 0.66, cy - h + 2)], "#f7f9fb"))
        b.append(f'<path d="M{cx - w * 0.66:.0f},{cy - h + 2:.0f} L{cx + w * 0.66:.0f},{cy - h + 2:.0f}" stroke="#c8d4e2" stroke-width="3"/>')
    b.append(f'<ellipse cx="800" cy="702" rx="380" ry="10" fill="#c8d4e2" opacity="0.45"/>')
    return svg("chamonix", "".join(b), ("#9fc0de", "#e8f0f7"))


# ---------------------------------------------------------------- Garibaldi: the lake below the Black Tusk
def garibaldi():
    rng = random.Random(8)
    b = []
    b.append(clouds(rng, 4, 70, 190, opacity=0.7))
    # Snow peaks and glaciers across the lake (the Guard, Sphinx and Garibaldi massif)
    back = ridge(0, W, 470, rng, [(0.18, 0.1, 0.75), (0.42, 0.09, 1.0), (0.62, 0.1, 0.85), (0.86, 0.12, 0.7)], 260, jag=10, step=16)
    b.append(poly(back, "#7f8ea1"))
    # Snowcaps: white above a ragged snowline, cut to the peaks' own shape
    line = [(x, 330 + 26 * math.sin(x / 37) + rng.uniform(-14, 14)) for x in range(0, W + 1, 24)]
    b.append(f'<defs><clipPath id="garibaldi-peaks">{poly(back, "#000")}</clipPath></defs>'
             f'<g clip-path="url(#garibaldi-peaks)">{poly([(0, 0), (W, 0)] + line[::-1], "#f3f6f9")}'
             f'{poly([(600, 0), (W, 0)] + [p for p in line[::-1] if p[0] >= 600], "#d5dde6")}</g>')
    b.append(poly([(260, 470), (420, 400), (560, 430), (700, 380), (860, 420), (960, 470)], "#e8eef4", opacity="0.85"))  # the Sphinx Glacier tongue
    # The Black Tusk: a dark volcanic spire on its ridge, at the left
    tusk_ridge = ridge(0, 420, 500, rng, [(0.35, 0.3, 0.8)], 120, jag=4)
    b.append(poly(tusk_ridge, "#5b5048"))
    b.append(poly([(150, 400), (166, 300), (172, 252), (186, 236), (198, 248), (206, 236), (214, 254), (222, 306), (240, 400)], "#2f2a28"))
    b.append(poly([(198, 248), (206, 236), (214, 254), (222, 306), (240, 400), (210, 400)], "#4a423d"))
    # Garibaldi Lake: milky turquoise glacial water
    b.append(f'<rect x="0" y="470" width="{W}" height="200" fill="#36b2b5"/>')
    b.append(f'<rect x="0" y="470" width="{W}" height="30" fill="#5cc6c4" opacity="0.7"/>')
    refl = [(x, 470 + (470 - y) * 0.35) for x, y in back]
    b.append(poly(refl, "#2f9ea3", opacity="0.5"))
    for _ in range(34):
        x, y = rng.uniform(0, W), rng.uniform(500, 660)
        b.append(f'<path d="M{x:.0f},{y:.0f} l{rng.uniform(30, 80):.0f},0" stroke="#a8e3e0" stroke-width="2.5" opacity="0.6" stroke-linecap="round"/>')
    # The near shore: a meadow and subalpine firs
    b.append(f'<path d="M0,660 C220,630 520,680 780,650 S1080,630 1200,650 L1200,800 L0,800 Z" fill="#6f9a58"/>')
    b.append(f'<path d="M0,720 C300,690 640,740 940,705 S1150,700 1200,710 L1200,800 L0,800 Z" fill="#55804a"/>')
    for x, base, h in ((70, 700, 170), (150, 690, 120), (1040, 690, 190), (1130, 700, 150), (980, 700, 110)):
        for k in range(5):
            w = h * (0.36 - k * 0.06)
            y = base - k * h * 0.2
            b.append(poly([(x - w, y), (x, y - h * 0.32), (x + w, y)], "#2b4a37"))
    for _ in range(40):  # wildflowers in the meadow
        x, y = rng.uniform(0, W), rng.uniform(690, 790)
        b.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{rng.uniform(2.5, 4.5):.1f}" fill="{rng.choice(("#e8d35a", "#d65f7a", "#f4f1ea", "#8e6fc4"))}"/>')
    return svg("garibaldi", "".join(b), ("#9fc4e0", "#e9f1f7"))


# ---------------------------------------------------------------- Glacier: Wild Goose Island in St. Mary Lake
def glacier():
    rng = random.Random(9)
    b = []
    b.append(glow(820, 300, 520, 200, "#ffe2b8", 0.55))
    b.append(clouds(rng, 3, 80, 180, colour="#fff4e6", opacity=0.7))
    # Layered peaks around the lake: far, middle, near
    far = ridge(0, W, 470, rng, [(0.2, 0.08, 0.8), (0.4, 0.07, 1.0), (0.62, 0.09, 0.9), (0.85, 0.08, 0.75)], 290, jag=9, step=14)
    b.append(poly(far, "#8a92a8"))
    for x, y in far[1:-1:3]:
        if y < 300 and rng.random() < 0.7:  # lingering snow in the couloirs
            b.append(f'<path d="M{x:.0f},{y + 6:.0f} L{x + rng.uniform(-12, 12):.0f},{y + rng.uniform(40, 90):.0f}" stroke="#f3f5f8" stroke-width="5" stroke-linecap="round" opacity="0.9"/>')
    mid = ridge(0, W, 490, rng, [(0.1, 0.12, 0.8), (0.75, 0.14, 0.7), (0.95, 0.08, 0.9)], 170, jag=5)
    b.append(poly(mid, "#5f6a7c"))
    b.append(poly([(0, 490), (0, 330), (110, 300), (230, 360), (330, 430), (420, 490)], "#3f4a3c"))  # forested slope at the left
    for _ in range(70):
        x = rng.uniform(0, 400); y = rng.uniform(340 + x * 0.3, 490)
        h = rng.uniform(16, 30)
        b.append(poly([(x - h * 0.28, y), (x, y - h), (x + h * 0.28, y)], "#2a3a2c"))
    # St. Mary Lake, deep blue, mirroring the peaks
    b.append(f'<rect x="0" y="488" width="{W}" height="{H - 488}" fill="#3f6f95"/>')
    refl = [(x, 488 + (488 - y) * 0.5) for x, y in far]
    b.append(poly(refl, "#5a7f9e", opacity="0.55"))
    for _ in range(46):
        x, y = rng.uniform(0, W), rng.uniform(520, 790)
        b.append(f'<path d="M{x:.0f},{y:.0f} l{rng.uniform(30, 90):.0f},0" stroke="#a9c8de" stroke-width="2.5" opacity="0.55" stroke-linecap="round"/>')
    # Wild Goose Island: a small rocky island with a handful of conifers
    ix, iy = 640, 600
    b.append(f'<ellipse cx="{ix}" cy="{iy}" rx="70" ry="16" fill="#5b4a3a"/>')
    b.append(f'<ellipse cx="{ix}" cy="{iy + 8}" rx="84" ry="10" fill="#2f5470" opacity="0.6"/>')
    for dx, h in ((-44, 54), (-26, 78), (-8, 96), (10, 84), (28, 66), (44, 48)):
        x = ix + dx
        for k in range(4):
            w = h * (0.3 - k * 0.06)
            y = iy - 6 - k * h * 0.22
            b.append(poly([(x - w, y), (x, y - h * 0.34), (x + w, y)], "#23402e"))
        b.append(poly([(x - h * 0.2, iy + 10), (x, iy + 10 + h * 0.5), (x + h * 0.2, iy + 10)], "#23402e", opacity="0.35"))
    return svg("glacier", "".join(b), ("#f6d7b4", "#dfe9f2"))


# ---------------------------------------------------------------- Moorea: Opunohu Bay's peaks over the lagoon
def moorea():
    rng = random.Random(10)
    b = []
    b.append(clouds(rng, 4, 60, 170, opacity=0.75))
    # The jagged volcanic peaks, with Mouaroa's shark-tooth spire in the middle
    back = ridge(0, W, 470, rng, [(0.12, 0.1, 0.6), (0.3, 0.07, 0.8), (0.72, 0.08, 0.85), (0.9, 0.09, 0.65)], 240, jag=10, step=14)
    b.append(poly(back, "#3f7a52"))
    b.append(poly([(458, 506), (540, 300), (566, 180), (580, 150), (592, 172), (612, 240), (650, 340), (734, 506)], "#2f6544"))
    b.append(poly([(580, 150), (592, 172), (612, 240), (650, 340), (734, 506), (624, 506)], "#285a3c"))
    front = ridge(0, W, 500, rng, [(0.22, 0.16, 0.7), (0.78, 0.18, 0.75)], 120, jag=4)
    b.append(poly(front, "#4f9461"))
    for x, y in front[1:-1:2]:  # trees on the lower slopes
        if rng.random() < 0.7:
            b.append(f'<circle cx="{x:.0f}" cy="{y + rng.uniform(6, 30):.0f}" r="{rng.uniform(8, 16):.0f}" fill="#3d8152" opacity="0.8"/>')
    # The lagoon: turquoise in the shallows, deep blue past the reef
    b.append(f'<rect x="0" y="500" width="{W}" height="{H - 500}" fill="#3ec8c4"/>')
    b.append(f'<path d="M0,500 C300,530 700,515 1200,505 L1200,560 C800,575 400,560 0,575 Z" fill="#6fdad2" opacity="0.8"/>')
    b.append(f'<path d="M0,700 C320,680 760,700 1200,684 L1200,800 L0,800 Z" fill="#2a8fb0"/>')
    for _ in range(40):
        x, y = rng.uniform(0, W), rng.uniform(560, 690)
        b.append(f'<path d="M{x:.0f},{y:.0f} l{rng.uniform(30, 80):.0f},0" stroke="#b6eee8" stroke-width="2.5" opacity="0.6" stroke-linecap="round"/>')
    # Overwater bungalows on a curving jetty
    jetty = [(140 + i * 74, 612 - 6 * math.sin(i / 2.2)) for i in range(9)]
    b.append(f'<polyline points="{pts(jetty)}" fill="none" stroke="#8a6a45" stroke-width="7"/>')
    for x, y in jetty[1:]:
        for sx in (x - 22, x + 22):
            b.append(f'<line x1="{sx:.0f}" y1="{y - 4:.0f}" x2="{sx:.0f}" y2="{y + 30:.0f}" stroke="#6b4f33" stroke-width="4"/>')
        b.append(f'<rect x="{x - 28:.0f}" y="{y - 30:.0f}" width="56" height="28" fill="#c9a26b"/>')
        b.append(poly([(x - 36, y - 30), (x, y - 58), (x + 36, y - 30)], "#a5793f"))
        b.append(f'<rect x="{x - 8:.0f}" y="{y - 22:.0f}" width="16" height="14" fill="#5a4630"/>')
    # A leaning palm on the beach in front
    b.append(f'<path d="M1080,800 C1070,720 1040,660 990,610" fill="none" stroke="#7a5a3a" stroke-width="14" stroke-linecap="round"/>')
    for a, l in ((-2.6, 120), (-2.1, 140), (-1.5, 130), (-0.9, 120), (-0.3, 100), (2.9, 110)):
        x2, y2 = 990 + l * math.cos(a), 610 + l * math.sin(a) * 0.6
        b.append(f'<path d="M990,610 Q{(990 + x2) / 2:.0f},{min(610, y2) - 30:.0f} {x2:.0f},{y2 + 20:.0f}" fill="none" stroke="#2f7a44" stroke-width="12" stroke-linecap="round"/>')
    b.append(f'<path d="M900,800 C980,780 1100,770 1200,775 L1200,800 Z" fill="#efe0b9"/>')
    return svg("moorea", "".join(b), ("#7fc0e6", "#e6f4fa"))


# ---------------------------------------------------------------- Mexico City: Palacio de Bellas Artes in jacaranda season
def mexico_city():
    rng = random.Random(11)
    b = []
    b.append(glow(600, 420, 700, 260, "#ffe9c7", 0.6))
    b.append(clouds(rng, 3, 70, 160, opacity=0.6))
    # Popocatépetl, faint on the horizon, and the Torre Latinoamericana to the right
    b.append(poly([(-40, 470), (160, 330), (200, 318), (240, 330), (470, 470)], "#b9c3d6", opacity="0.7"))
    b.append(poly([(160, 330), (200, 318), (240, 330), (222, 352), (200, 342), (178, 352)], "#f4f6fa", opacity="0.8"))
    b.append(f'<rect x="958" y="200" width="70" height="300" fill="#8e9bb0"/><rect x="972" y="170" width="42" height="34" fill="#8e9bb0"/>'
             f'<rect x="988" y="120" width="10" height="52" fill="#8e9bb0"/>')
    for y in range(214, 500, 16):
        b.append(f'<line x1="962" y1="{y}" x2="1024" y2="{y}" stroke="#a9b5c8" stroke-width="3"/>')
    # The palace: white marble, a wide base with arched bays and columns
    b.append(f'<rect x="150" y="420" width="900" height="200" fill="#f1ece2"/>')
    b.append(f'<rect x="150" y="410" width="900" height="16" fill="#e2dacb"/>')
    b.append(f'<rect x="420" y="360" width="360" height="62" fill="#f6f2ea"/>')
    b.append(f'<rect x="410" y="352" width="380" height="12" fill="#e2dacb"/>')
    for x in range(180, 1030, 60):
        if 430 < x < 770:
            continue
        b.append(f'<rect x="{x}" y="450" width="14" height="150" fill="#ddd4c3"/>')
    for x in range(450, 760, 52):  # the central arches
        b.append(f'<path d="M{x},600 V500 a22,22 0 0 1 44,0 V600 Z" fill="#c7b9a2"/>')
        b.append(f'<path d="M{x + 6},600 V504 a16,16 0 0 1 32,0 V600 Z" fill="#7d6a52"/>')
    # The domes: orange and gold tiles in bands, the big one in the middle
    def dome(cx, base, rx, ry, top):
        b.append(f'<path d="M{cx - rx},{base} A{rx},{ry} 0 0 1 {cx + rx},{base} Z" fill="#e0912f"/>')
        for k in range(1, 4):  # bands of yellow tiles
            r = rx * (1 - k * 0.22)
            b.append(f'<path d="M{cx - r:.0f},{base} A{r:.0f},{ry * (1 - k * 0.18):.0f} 0 0 1 {cx + r:.0f},{base}" fill="none" stroke="#f5c542" stroke-width="5" opacity="0.9"/>')
        for k in range(-3, 4):  # ribs
            b.append(f'<path d="M{cx + k * rx / 3.6:.0f},{base} Q{cx + k * rx / 6:.0f},{base - ry * 0.8:.0f} {cx},{base - ry}" fill="none" stroke="#b5641d" stroke-width="3"/>')
        b.append(f'<rect x="{cx - 8}" y="{base - ry - top}" width="16" height="{top}" fill="#d9a441"/>')
        b.append(f'<circle cx="{cx}" cy="{base - ry - top}" r="9" fill="#d9a441"/>')
    b.append(f'<rect x="490" y="300" width="220" height="56" fill="#f1ece2"/>')  # the drum under the big dome
    for x in range(500, 710, 26):
        b.append(f'<rect x="{x}" y="308" width="10" height="40" fill="#ddd4c3"/>')
    dome(600, 302, 130, 120, 40)
    dome(250, 412, 62, 50, 22)
    dome(950, 412, 62, 50, 22)
    # The plaza, and jacarandas in bloom framing it
    b.append(f'<rect x="0" y="618" width="{W}" height="{H - 618}" fill="#d8cdbb"/>')
    for i in range(0, W, 80):
        b.append(f'<line x1="{i}" y1="618" x2="{i - 140}" y2="800" stroke="#c9bca6" stroke-width="2"/>')
    for cx, cy, sc in ((50, 560, 1.0), (1150, 570, 1.0), (380, 660, 0.45), (820, 660, 0.45)):
        b.append(f'<path d="M{cx},{cy + 200 * sc:.0f} C{cx - 6},{cy + 120 * sc:.0f} {cx + 8},{cy + 60 * sc:.0f} {cx},{cy:.0f}" fill="none" stroke="#5b4636" stroke-width="{14 * sc:.0f}" stroke-linecap="round"/>')
        for _ in range(int(26 * sc)):
            x, y = cx + rng.gauss(0, 70 * sc), cy - 30 * sc + rng.gauss(0, 42 * sc)
            col = rng.choice(("#8b6fc9", "#9d82d6", "#a98fe0", "#7a5fb8"))
            b.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{rng.uniform(26, 46) * sc:.0f}" fill="{col}" opacity="0.92"/>')
    for _ in range(120):  # fallen petals on the plaza
        x, y = rng.uniform(0, W), rng.uniform(630, 790)
        b.append(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{rng.uniform(3, 7):.0f}" ry="2.5" fill="#9d82d6" opacity="0.8"/>')
    return svg("mexico-city", "".join(b), ("#7fb1e0", "#f3e9d8"))


# ---------------------------------------------------------------- Azores: the twin lakes of Sete Cidades
def azores():
    rng = random.Random(27)
    b = []
    b.append(clouds(rng, 5, 60, 220, opacity=0.75))
    b.append(f'<rect x="0" y="300" width="{W}" height="40" fill="#5d8fb8" opacity="0.5"/>')  # the Atlantic on the horizon
    # The far crater rim, then the crater floor
    b.append(poly(ridge(0, W, 420, rng, [(0.1, 0.2, 0.8), (0.5, 0.35, 0.55), (0.9, 0.2, 0.9)], 120, jag=3), "#4f7d4a"))
    b.append(f'<path d="M0,420 C300,400 900,400 1200,420 L1200,640 L0,640 Z" fill="#6a9a52"/>')
    # The two lakes, blue and green, joined by a narrow bridge
    b.append(f'<path d="M150,500 C170,450 330,430 470,446 C540,454 560,480 548,510 C530,550 400,566 280,556 C190,548 140,530 150,500 Z" fill="#3f78a8"/>')
    b.append(f'<path d="M560,500 C580,456 760,440 900,452 C1000,462 1040,486 1020,520 C990,560 840,574 700,562 C610,554 548,534 560,500 Z" fill="#3f8a63"/>')
    for x0, x1, col in ((180, 520, "#7aa9cf"), (600, 990, "#78b58f")):
        for _ in range(8):
            x, y = rng.uniform(x0, x1 - 60), rng.uniform(470, 540)
            b.append(f'<path d="M{x:.0f},{y:.0f} l{rng.uniform(20, 60):.0f},0" stroke="{col}" stroke-width="2.5" opacity="0.6" stroke-linecap="round"/>')
    b.append(f'<path d="M540,502 L570,500" stroke="#d9d2c4" stroke-width="6"/>')
    # The village on the shore: white houses with red roofs, and the church spire
    for x in (380, 410, 440, 466, 500, 900, 930):
        y = 560 + rng.uniform(-4, 8)
        b.append(f'<rect x="{x}" y="{y - 14:.0f}" width="22" height="14" fill="#f4f1ea"/>{poly([(x - 2, y - 14), (x + 11, y - 22), (x + 24, y - 14)], "#b8513a")}')
    b.append(f'<rect x="520" y="540" width="12" height="26" fill="#f4f1ea"/>{poly([(518, 540), (526, 524), (534, 540)], "#3b3a37")}')
    # The near slope of the rim, and hydrangeas along the road
    b.append(f'<path d="M0,620 C300,590 800,610 1200,590 L1200,800 L0,800 Z" fill="#3e6d3d"/>')
    b.append(f'<path d="M0,690 C300,670 800,690 1200,680 L1200,800 L0,800 Z" fill="#335d34"/>')
    for _ in range(70):
        x, y = rng.uniform(-20, W + 20), rng.uniform(640, 800)
        r = rng.uniform(16, 30)
        b.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.0f}" fill="{rng.choice(("#6f8fd8", "#8a7fd0", "#a9b8ef", "#5a7cc9", "#b49ad9"))}" opacity="0.95"/>')
        b.append(f'<circle cx="{x - r * 0.3:.0f}" cy="{y - r * 0.3:.0f}" r="{r * 0.35:.0f}" fill="#ffffff" opacity="0.18"/>')
    return svg("azores", "".join(b), ("#8fb4d6", "#e6eef4"))


# ================================================================ Places I've been

def firs(b, rng, n, x0, x1, base, wave, h0, h1, colours):
    for _ in range(n):
        x = rng.uniform(x0, x1)
        y = base + wave(x) + rng.uniform(-6, 18)
        h = rng.uniform(h0, h1)
        b.append(poly([(x - h * 0.24, y), (x, y - h), (x + h * 0.24, y)], rng.choice(colours)))


# ---------------------------------------------------------------- Machu Picchu: the ruins below Huayna Picchu
def machu_picchu():
    rng = random.Random(21)
    b = []
    b.append(glow(300, 220, 520, 240, "#fde2bf", 0.6))
    b.append(clouds(rng, 3, 60, 160, opacity=0.55))
    # Ranges fading into the distance, cloud-forest green up close
    b.append(poly(ridge(0, W, 470, rng, [(0.1, 0.12, 0.7), (0.35, 0.1, 0.9), (0.62, 0.12, 0.8), (0.9, 0.1, 1.0)], 230, jag=8), "#9fb3b8"))
    b.append(poly(ridge(0, W, 520, rng, [(0.05, 0.1, 0.8), (0.3, 0.14, 0.6), (0.85, 0.15, 0.9)], 200, jag=6), "#6f8f84"))
    # Huayna Picchu: the steep sugarloaf behind the city, with its smaller neighbour
    b.append(poly([(560, 560), (640, 420), (700, 300), (735, 215), (760, 196), (790, 212), (830, 300), (880, 420), (960, 520), (1020, 560)], "#3f6b4c"))
    b.append(poly([(760, 196), (790, 212), (830, 300), (880, 420), (960, 520), (1020, 560), (800, 560)], "#24364d", opacity="0.2"))
    b.append(poly([(940, 560), (1010, 470), (1060, 440), (1110, 470), (1200, 540), (1200, 560)], "#4d7a58"))
    # Cloud lying in the valley below
    for cx, cy, rx in ((260, 560, 300), (1000, 575, 260), (620, 590, 220)):
        b.append(glow(cx, cy, rx, 46, "#ffffff", 0.85))
    # The saddle: green terraces stepping down, grey stone walls and roofless houses
    b.append(f'<path d="M0,590 C200,540 420,515 640,518 S1000,555 1200,585 L1200,800 L0,800 Z" fill="#7fa35e"/>')
    for k in range(7):
        y = 610 + k * 28
        b.append(f'<path d="M{-20 + k * 6},{y} C300,{y - 30} 700,{y - 24} {1220 - k * 4},{y + 6}" fill="none" stroke="#5c7f45" stroke-width="5" opacity="0.8"/>')
        b.append(f'<path d="M{-20 + k * 6},{y + 6} C300,{y - 24} 700,{y - 18} {1220 - k * 4},{y + 12}" fill="none" stroke="#9cbc76" stroke-width="3" opacity="0.6"/>')
    for x, y, w, h in ((300, 560, 70, 34), (380, 552, 56, 40), (450, 548, 80, 30), (545, 544, 60, 38), (620, 550, 90, 32),
                       (720, 556, 64, 36), (800, 562, 70, 30), (420, 600, 90, 26), (560, 596, 70, 30), (690, 604, 80, 26)):
        b.append(f'<rect x="{x}" y="{y - h}" width="{w}" height="{h}" fill="#b9b2a4"/>')
        b.append(f'<rect x="{x}" y="{y - h}" width="{w}" height="5" fill="#d8d2c4"/>')
        b.append(poly([(x + w * 0.2, y - h), (x + w * 0.5, y - h - w * 0.35), (x + w * 0.8, y - h)], "#b9b2a4"))  # a gable end
        b.append(f'<rect x="{x + w * 0.42:.0f}" y="{y - h * 0.7:.0f}" width="{w * 0.14:.0f}" height="{h * 0.5:.0f}" fill="#6e675b"/>')
    b.append(f'<path d="M300,575 C420,566 620,560 860,578" fill="none" stroke="#9a9384" stroke-width="3"/>')
    # A llama on the near terrace
    b.append('<g fill="#f3ece0"><ellipse cx="180" cy="712" rx="34" ry="16"/><rect x="200" y="672" width="11" height="40" rx="5"/>'
             '<ellipse cx="212" cy="670" rx="13" ry="8"/><path d="M204,664 l2,-10 l4,9 M214,663 l3,-10 l3,9"/>'
             '<rect x="156" y="722" width="6" height="26"/><rect x="170" y="724" width="6" height="26"/><rect x="190" y="722" width="6" height="26"/><rect x="202" y="720" width="6" height="26"/></g>')
    return svg("machu-picchu", "".join(b), ("#a8c6dc", "#f4e6d2"))


# ---------------------------------------------------------------- Seattle to DC: the open road across the plains
def seattle_to_dc():
    rng = random.Random(22)
    b = []
    b.append(glow(860, 470, 640, 260, "#ffd9a3", 0.75))
    b.append(clouds(rng, 4, 80, 230, colour="#fff3e4", opacity=0.6))
    # Rainier, faint behind us on the left; the plains ahead
    b.append(poly([(-40, 470), (120, 360), (190, 318), (230, 310), (270, 322), (360, 380), (480, 470)], "#b7bfd0", opacity="0.85"))
    b.append(poly([(150, 340), (190, 318), (230, 310), (270, 322), (300, 342), (262, 352), (230, 336), (200, 352)], "#f6f4f1"))
    b.append(poly(ridge(0, W, 480, rng, [(0.3, 0.3, 0.5), (0.75, 0.3, 0.4)], 40, jag=2), "#c9a56b"))
    # The Capitol dome, tiny where the road meets the sky
    b.append(f'<g fill="#e9e1d4"><rect x="836" y="452" width="48" height="12"/><rect x="848" y="440" width="24" height="12"/>'
             f'<path d="M846,440 a14,14 0 0 1 28,0 Z"/><rect x="858" y="418" width="4" height="10"/></g>')
    # Fields, golden near the horizon, greener close by, with a red barn
    b.append(f'<path d="M0,480 L{W},480 L{W},800 L0,800 Z" fill="#d6b56d"/>')
    for k, col in enumerate(("#c7a75f", "#b8a052", "#9fa04c", "#869a48")):
        y = 500 + k * 55
        b.append(f'<path d="M0,{y} C300,{y - 10} 900,{y + 14} {W},{y} L{W},800 L0,800 Z" fill="{col}"/>')
    for _ in range(60):
        y = rng.uniform(560, 790); x = rng.uniform(0, W)
        b.append(f'<path d="M{x:.0f},{y:.0f} l{rng.uniform(-4, 4):.0f},-{rng.uniform(8, 18):.0f}" stroke="#6f7a3a" stroke-width="2" opacity="0.5"/>')
    b.append(f'<rect x="150" y="500" width="54" height="36" fill="#a83b2c"/><path d="M144,502 L177,478 L210,502 Z" fill="#7b2a20"/>'
             f'<rect x="170" y="514" width="14" height="22" fill="#f2e6d3"/><rect x="214" y="488" width="14" height="48" rx="7" fill="#c9c2b6"/>')
    # The road, straight to the horizon, with its centre line
    b.append(poly([(840, 480), (880, 480), (1060, 800), (520, 800)], "#4b4a48"))
    for k in range(9):
        t0, t1 = (k / 9) ** 1.8, ((k + 0.5) / 9) ** 1.8
        y0, y1 = 480 + 320 * t0, 480 + 320 * t1
        x0, x1 = 860 - 70 * t0, 860 - 70 * t1
        b.append(f'<path d="M{x0:.1f},{y0:.1f} L{x1:.1f},{y1:.1f}" stroke="#f1c76b" stroke-width="{1 + 7 * t1:.1f}"/>')
    # A cyclist, heading east
    cx, cy = 900, 650
    b.append(f'<g fill="none" stroke="#1f2a36" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">'
             f'<circle cx="{cx - 46}" cy="{cy + 40}" r="30"/><circle cx="{cx + 46}" cy="{cy + 40}" r="30"/>'
             f'<path d="M{cx - 46},{cy + 40} L{cx - 8},{cy + 40} L{cx + 30},{cy + 2} L{cx - 20},{cy + 2} Z M{cx - 8},{cy + 40} L{cx - 26},{cy - 8} M{cx + 30},{cy + 2} L{cx + 46},{cy + 40} M{cx + 30},{cy + 2} L{cx + 34},{cy - 12} L{cx + 46},{cy - 12}"/></g>')
    b.append(f'<g stroke-linecap="round" stroke-linejoin="round" fill="none">'
             f'<path d="M{cx - 24},{cy - 14} L{cx + 20},{cy - 40} L{cx + 36},{cy - 14}" stroke="#c8402f" stroke-width="13"/>'
             f'<path d="M{cx - 24},{cy - 12} L{cx - 4},{cy + 18} L{cx - 8},{cy + 40}" stroke="#24364d" stroke-width="11"/></g>')
    b.append(f'<circle cx="{cx + 30}" cy="{cy - 58}" r="13" fill="#24364d"/><path d="M{cx + 16},{cy - 62} q14,-18 30,-2" fill="#f1c76b"/>')
    return svg("seattle-to-dc", "".join(b), ("#8fb6db", "#fbe2c2"))


# ---------------------------------------------------------------- Pakistan: the Karakoram Highway through Hunza
def hunza():
    rng = random.Random(23)
    b = []
    b.append(clouds(rng, 3, 60, 150, opacity=0.6))
    # Rakaposhi: a huge snow face filling the sky
    face = [(120, 520), (230, 420), (300, 380), (340, 330), (390, 300), (430, 250), (470, 236), (510, 170), (548, 150), (580, 110), (610, 96), (640, 118), (676, 112), (720, 160), (770, 190), (820, 250), (870, 262), (930, 320), (1000, 352), (1080, 420), (1200, 480), (1200, 560), (120, 560)]
    b.append(poly(face, "#f2f5f8"))
    b.append(poly([(610, 96), (640, 118), (676, 112), (720, 160), (770, 190), (820, 250), (870, 262), (930, 320), (1000, 352), (1080, 420), (1200, 480), (1200, 560), (700, 560)], "#7d93ad", opacity="0.28"))
    for d in ("M560,130 C540,220 500,300 470,420", "M640,120 C660,220 700,300 760,420", "M420,260 C430,330 400,400 380,470"):
        b.append(f'<path d="{d}" fill="none" stroke="#a4b4c6" stroke-width="5" stroke-linecap="round" opacity="0.6"/>')
    # Bare brown valley walls either side
    b.append(poly([(0, 260), (90, 300), (200, 380), (320, 460), (420, 540), (520, 620), (0, 640)], "#8d7258"))
    b.append(poly([(1200, 330), (1120, 380), (1000, 450), (880, 530), (760, 620), (1200, 640)], "#9b7f62"))
    b.append(poly([(0, 400), (160, 450), (300, 520), (420, 600), (0, 640)], "#735c47", opacity="0.6"))
    # The valley floor: orchards and terraced fields
    b.append(f'<path d="M0,600 C260,580 520,610 760,590 S1080,580 1200,600 L1200,800 L0,800 Z" fill="#8aa356"/>')
    for k in range(4):
        y = 640 + k * 38
        b.append(f'<path d="M0,{y} C300,{y - 16} 800,{y + 12} {W},{y - 4}" fill="none" stroke="#6f8a43" stroke-width="4" opacity="0.7"/>')
    # Tall poplars, turning gold, and apricot trees
    for x in (70, 100, 128, 250, 276, 960, 990, 1016, 1100, 1130):
        h = rng.uniform(140, 210); base = 640 + rng.uniform(-8, 10)
        b.append(f'<ellipse cx="{x}" cy="{base - h / 2:.0f}" rx="{h * 0.08:.0f}" ry="{h / 2:.0f}" fill="{rng.choice(("#e0a93a", "#d18f2b", "#e9bd52"))}"/>')
        b.append(f'<path d="M{x},{base:.0f} L{x},{base - h * 0.3:.0f}" stroke="#5a4632" stroke-width="3"/>')
    for _ in range(14):
        x, y = rng.uniform(320, 900), rng.uniform(610, 660)
        b.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{rng.uniform(14, 22):.0f}" fill="{rng.choice(("#6f9a45", "#e7a36a", "#7fa84d"))}"/>')
    # The highway, curving up the valley, and a painted truck on it
    b.append('<path d="M-40,780 C260,740 520,720 640,680 S860,630 1000,610" fill="none" stroke="#5a5652" stroke-width="44" stroke-linecap="round"/>')
    b.append('<path d="M-40,780 C260,740 520,720 640,680 S860,630 1000,610" fill="none" stroke="#e8e2d6" stroke-width="3" stroke-dasharray="26 22"/>')
    tx, ty = 470, 700
    b.append(f'<g transform="rotate(-7 {tx} {ty})">'
             f'<rect x="{tx - 80}" y="{ty - 76}" width="110" height="64" rx="6" fill="#e4572e"/>'
             f'<rect x="{tx - 80}" y="{ty - 76}" width="110" height="12" fill="#2a9d8f"/><rect x="{tx - 80}" y="{ty - 40}" width="110" height="8" fill="#f2c14e"/>'
             f'<circle cx="{tx - 50}" cy="{ty - 56}" r="7" fill="#f2c14e"/><circle cx="{tx - 26}" cy="{ty - 56}" r="7" fill="#3d5a80"/><circle cx="{tx - 2}" cy="{ty - 56}" r="7" fill="#f2c14e"/>'
             f'<path d="M{tx + 30},{ty - 12} L{tx + 30},{ty - 66} L{tx + 52},{ty - 66} Q{tx + 70},{ty - 66} {tx + 72},{ty - 40} L{tx + 72},{ty - 12} Z" fill="#2a9d8f"/>'
             f'<rect x="{tx + 40}" y="{ty - 60}" width="22" height="18" rx="2" fill="#cfe6f2"/>'
             f'<path d="M{tx - 84},{ty - 80} Q{tx - 25},{ty - 104} {tx + 34},{ty - 80}" fill="#f2c14e"/>'
             f'<circle cx="{tx - 52}" cy="{ty - 8}" r="13" fill="#1f1d1b"/><circle cx="{tx + 50}" cy="{ty - 8}" r="13" fill="#1f1d1b"/></g>')
    return svg("hunza", "".join(b), ("#5e9bd6", "#d7e8f5"))


# ---------------------------------------------------------------- Yosemite: Tunnel View
def yosemite():
    rng = random.Random(24)
    b = []
    b.append(glow(620, 300, 560, 220, "#fff1dc", 0.5))
    b.append(clouds(rng, 3, 70, 170, opacity=0.6))
    # Half Dome, far up the valley, in haze
    b.append('<path d="M556,470 L560,300 C562,276 590,262 622,268 C668,278 700,330 724,400 L748,470 Z" fill="#a8b4c4"/>')
    b.append('<path d="M556,470 L560,300 C562,286 568,280 576,276 L572,470 Z" fill="#24364d" opacity="0.12"/>')
    b.append(poly(ridge(380, 860, 480, rng, [(0.2, 0.2, 0.5), (0.8, 0.2, 0.6)], 90, jag=4), "#9aa9bb"))
    # El Capitan: the sheer grey wall on the left
    b.append(poly([(0, 640), (0, 190), (120, 168), (230, 172), (300, 190), (340, 260), (370, 400), (420, 560), (460, 640)], "#9a9a94"))
    b.append(poly([(300, 190), (340, 260), (370, 400), (420, 560), (460, 640), (330, 640), (300, 400)], "#24364d", opacity="0.18"))
    for x in (60, 120, 190, 250):
        b.append(f'<path d="M{x},{180 + rng.uniform(0, 10):.0f} C{x + 10},300 {x - 6},420 {x + 14},620" fill="none" stroke="#7d7d78" stroke-width="3" opacity="0.45"/>')
    # Cathedral Rocks on the right, with Bridalveil Fall
    b.append(poly([(1200, 640), (1200, 220), (1120, 230), (1040, 270), (960, 330), (900, 420), (860, 520), (820, 640)], "#8f8c85"))
    b.append(poly([(1040, 270), (1000, 300), (960, 330), (900, 420), (860, 520), (820, 640), (960, 640)], "#24364d", opacity="0.15"))
    b.append(f'<path d="M940,372 C936,440 944,520 940,600" fill="none" stroke="#f4f8fb" stroke-width="9" stroke-linecap="round" opacity="0.9"/>')
    b.append(glow(940, 600, 60, 26, "#ffffff", 0.8))
    # The valley: pines all the way to the walls
    b.append(f'<path d="M0,600 C300,570 900,570 1200,600 L1200,800 L0,800 Z" fill="#3d5a44"/>')
    firs(b, rng, 120, -20, W + 20, 610, lambda x: 0, 40, 90, ("#2f4a3c", "#294235", "#365443", "#3e5e47"))
    b.append(f'<path d="M0,700 C300,680 900,690 1200,700 L1200,800 L0,800 Z" fill="#263d30"/>')
    firs(b, rng, 50, -20, W + 20, 720, lambda x: 0, 70, 140, ("#1f3328", "#233a2d"))
    return svg("yosemite", "".join(b), ("#86b2dc", "#e8f1f8"))


# ---------------------------------------------------------------- Japan: Mount Fuji behind the Chureito Pagoda
def japan():
    rng = random.Random(25)
    b = []
    b.append(glow(500, 360, 600, 240, "#ffe6e6", 0.55))
    b.append(clouds(rng, 3, 70, 160, opacity=0.55))
    # Fuji: a wide cone with its snowcap
    cone = [(40, 580), (300, 400), (440, 240), (480, 206), (560, 206), (600, 240), (740, 400), (1000, 580)]
    b.append(poly(cone, "#6f84a8"))
    b.append(poly([(480, 206), (560, 206), (600, 240), (650, 300), (610, 292), (580, 316), (548, 288), (520, 320), (494, 290), (460, 312), (430, 296), (390, 300), (440, 240)], "#f6f8fb"))
    b.append(poly([(520, 206), (560, 206), (600, 240), (740, 400), (1000, 580), (700, 580)], "#24364d", opacity="0.15"))
    b.append(f'<ellipse cx="520" cy="470" rx="420" ry="24" fill="#ffffff" opacity="0.35"/>')
    # Forested hills, then the pagoda on its slope at the right
    b.append(poly(ridge(0, W, 620, rng, [(0.15, 0.2, 0.5), (0.85, 0.25, 1.0)], 200, jag=3), "#4f6b4c"))
    b.append(f'<path d="M0,600 C300,580 900,590 1200,575 L1200,800 L0,800 Z" fill="#5f7d55"/>')
    px, base = 900, 560
    for k in range(5):
        w = 130 - k * 16; y = base - k * 46
        b.append(f'<rect x="{px - w * 0.36:.0f}" y="{y - 40:.0f}" width="{w * 0.72:.0f}" height="44" fill="#c8402f"/>')
        b.append(f'<rect x="{px - w * 0.2:.0f}" y="{y - 32:.0f}" width="{w * 0.4:.0f}" height="20" fill="#f1e4cf" opacity="0.8"/>')
        b.append(f'<path d="M{px - w * 0.72:.0f},{y - 36:.0f} Q{px},{y - 56:.0f} {px + w * 0.72:.0f},{y - 36:.0f} L{px + w * 0.5:.0f},{y - 48:.0f} L{px - w * 0.5:.0f},{y - 48:.0f} Z" fill="#3b3a37"/>')
    b.append(f'<path d="M{px},{base - 5 * 46 - 40} L{px},{base - 5 * 46 - 84}" stroke="#3b3a37" stroke-width="5"/>')
    for k in range(3):
        b.append(f'<circle cx="{px}" cy="{base - 5 * 46 - 52 - k * 10}" r="4" fill="#3b3a37"/>')
    # Cherry blossom in the foreground
    for _ in range(80):
        x = rng.choice((rng.uniform(-40, 380), rng.uniform(980, 1240)))
        y = rng.uniform(560, 820)
        b.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{rng.uniform(26, 50):.0f}" fill="{rng.choice(("#f6c6d0", "#f2b3c2", "#fbdde3", "#eea7b8"))}" opacity="0.92"/>')
    b.append(f'<path d="M0,700 C60,680 120,690 200,650 M1200,720 C1140,700 1080,710 1020,670" fill="none" stroke="#5a3e33" stroke-width="10" stroke-linecap="round"/>')
    for _ in range(40):
        x, y = rng.uniform(0, W), rng.uniform(300, 760)
        b.append(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="4" ry="2.5" fill="#f6c6d0" transform="rotate({rng.uniform(0, 180):.0f} {x:.0f} {y:.0f})"/>')
    return svg("japan", "".join(b), ("#9cbbe0", "#f7e5e2"))


# ---------------------------------------------------------------- Florence: the Duomo over the rooftops
def florence():
    rng = random.Random(26)
    b = []
    b.append(glow(700, 420, 640, 260, "#ffd8a8", 0.7))
    b.append(clouds(rng, 3, 70, 170, colour="#fff3e6", opacity=0.55))
    # Tuscan hills, with cypresses
    b.append(poly(ridge(0, W, 500, rng, [(0.15, 0.25, 0.7), (0.6, 0.3, 0.9), (0.95, 0.2, 0.6)], 130, jag=2), "#8f9f78"))
    for x in (90, 110, 1040, 1064, 1150):
        y = 500 - 130 * 0.6 + rng.uniform(-10, 20)
        b.append(f'<ellipse cx="{x}" cy="{y:.0f}" rx="8" ry="34" fill="#3f5a3c"/>')
    # Giotto's campanile
    cx, top = 340, 230
    b.append(f'<rect x="{cx - 34}" y="{top}" width="68" height="360" fill="#efe6d6"/>')
    for k in range(5):
        y = top + 30 + k * 66
        b.append(f'<rect x="{cx - 34}" y="{y}" width="68" height="6" fill="#4f7a5c"/><rect x="{cx - 34}" y="{y + 10}" width="68" height="4" fill="#d88c8c"/>')
    for y in (top + 40, top + 108):
        b.append(f'<rect x="{cx - 16}" y="{y}" width="32" height="52" rx="16" fill="#5b5148"/>')
    b.append(f'<rect x="{cx - 40}" y="{top - 10}" width="80" height="12" fill="#e2d6c2"/>')
    # The cathedral and Brunelleschi's dome
    b.append(f'<rect x="420" y="420" width="560" height="170" fill="#efe6d6"/>')
    for x in range(430, 980, 46):
        b.append(f'<rect x="{x}" y="430" width="6" height="160" fill="#4f7a5c" opacity="0.8"/>')
    b.append(f'<rect x="420" y="452" width="560" height="6" fill="#d88c8c"/>')
    b.append(f'<rect x="590" y="330" width="240" height="96" fill="#e7dcc8"/>')
    for x in range(604, 830, 36):
        b.append(f'<circle cx="{x + 8}" cy="372" r="9" fill="#5b5148"/>')
    b.append(f'<path d="M580,334 C580,200 640,140 710,128 C780,140 840,200 840,334 Z" fill="#c96a3c"/>')
    for d in ("M710,128 L710,334", "M710,128 C660,170 630,250 628,334", "M710,128 C760,170 790,250 792,334"):
        b.append(f'<path d="{d}" fill="none" stroke="#f3ece0" stroke-width="7"/>')
    b.append(f'<rect x="576" y="326" width="268" height="10" fill="#f3ece0"/>')
    b.append(f'<rect x="694" y="96" width="32" height="34" fill="#f3ece0"/><path d="M690,96 Q710,76 730,96 Z" fill="#f3ece0"/>'
             f'<path d="M710,80 L710,58" stroke="#d1a645" stroke-width="5"/><circle cx="710" cy="56" r="7" fill="#d1a645"/>')
    # Terracotta rooftops crowding the foreground
    for row, y0 in enumerate((560, 620, 690)):
        x = -30 + row * 20
        while x < W + 40:
            w = rng.uniform(70, 140); h = rng.uniform(40, 80); y = y0 + rng.uniform(-10, 14)
            wall = rng.choice(("#ecd9b8", "#e6c79a", "#f0e2c8", "#dcb98a"))
            b.append(f'<rect x="{x:.0f}" y="{y:.0f}" width="{w:.0f}" height="{H - y:.0f}" fill="{wall}"/>')
            b.append(poly([(x - 6, y + 2), (x + w * 0.5, y - h * 0.4), (x + w + 6, y + 2)], rng.choice(("#b85a36", "#c4683f", "#a94f30"))))
            for k in range(int(w // 34)):
                b.append(f'<rect x="{x + 12 + k * 34:.0f}" y="{y + 18:.0f}" width="12" height="20" fill="#6b5446" opacity="0.8"/>')
            x += w + rng.uniform(-6, 4)
    return svg("florence", "".join(b), ("#86b0d8", "#f6e2c8"))


# ---------------------------------------------------------------- Kilimanjaro: Kibo above the clouds and the savanna
def kilimanjaro():
    rng = random.Random(28)
    b = []
    b.append(glow(620, 380, 700, 260, "#ffd6a0", 0.7))
    # Kibo: the broad, flat-topped cone, with Mawenzi's ragged peak to its left
    b.append(poly([(60, 470), (180, 380), (230, 330), (250, 300), (270, 316), (290, 296), (310, 330), (340, 360), (420, 420), (480, 470)], "#6b6f86"))
    kibo = [(160, 500), (380, 380), (520, 300), (600, 262), (640, 250), (820, 248), (880, 262), (960, 300), (1100, 380), (1260, 500)]
    b.append(poly(kibo, "#5d6480"))
    b.append(poly([(820, 248), (880, 262), (960, 300), (1100, 380), (1260, 500), (900, 500)], "#24364d", opacity="0.2"))
    # The summit snowcap: white along the crater rim, its lower edge broken into the remaining icefields
    edge = [(960, 300), (930, 318), (912, 300), (890, 336), (860, 300), (836, 322), (810, 290), (780, 312), (752, 286), (724, 300), (700, 280), (672, 298), (640, 284), (612, 310), (590, 292), (560, 318), (548, 306)]
    b.append(poly([(548, 306), (600, 262), (640, 250), (820, 248), (880, 262), (960, 300)] + edge, "#f4f7fa"))
    b.append(poly([(820, 248), (880, 262), (960, 300), (930, 318), (912, 300), (890, 336), (860, 300), (836, 322), (820, 280)], "#c9d4e2", opacity="0.6"))
    # A sea of cloud around the mountain's waist
    for _ in range(26):
        x, y = rng.uniform(-60, W + 60), rng.uniform(420, 500)
        b.append(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{rng.uniform(80, 160):.0f}" ry="{rng.uniform(20, 36):.0f}" fill="#fbf3ea" opacity="0.92"/>')
    # The savanna, golden, and flat-topped acacias
    b.append(f'<path d="M0,520 C300,505 900,515 1200,505 L1200,800 L0,800 Z" fill="#c9a45c"/>')
    b.append(f'<path d="M0,610 C300,590 900,620 1200,600 L1200,800 L0,800 Z" fill="#b48f4a"/>')
    for _ in range(90):
        x, y = rng.uniform(0, W), rng.uniform(530, 790)
        b.append(f'<path d="M{x:.0f},{y:.0f} l{rng.uniform(-4, 4):.0f},-{rng.uniform(8, 16):.0f}" stroke="#8a6b32" stroke-width="2" opacity="0.45"/>')
    for x, base, s in ((140, 640, 1.0), (1010, 620, 1.25), (640, 560, 0.5), (420, 580, 0.6)):
        b.append(f'<path d="M{x},{base} L{x + 4 * s:.0f},{base - 90 * s:.0f} M{x + 2 * s:.0f},{base - 60 * s:.0f} L{x - 30 * s:.0f},{base - 96 * s:.0f} M{x + 3 * s:.0f},{base - 70 * s:.0f} L{x + 40 * s:.0f},{base - 100 * s:.0f}" stroke="#3b2f25" stroke-width="{6 * s:.1f}" stroke-linecap="round"/>')
        b.append(f'<ellipse cx="{x + 4 * s:.0f}" cy="{base - 104 * s:.0f}" rx="{110 * s:.0f}" ry="{16 * s:.0f}" fill="#4a5a32"/>')
        b.append(f'<ellipse cx="{x + 4 * s:.0f}" cy="{base - 110 * s:.0f}" rx="{86 * s:.0f}" ry="{10 * s:.0f}" fill="#5d6e3c"/>')
    # Two elephants crossing below the mountain
    for ex, ey, s in ((560, 690, 1.0), (790, 700, 0.75)):
        b.append(f'<g fill="#6c6660"><ellipse cx="{ex}" cy="{ey}" rx="{56 * s:.0f}" ry="{34 * s:.0f}"/>'
                 f'<circle cx="{ex + 54 * s:.0f}" cy="{ey - 14 * s:.0f}" r="{22 * s:.0f}"/>'
                 f'<path d="M{ex + 70 * s:.0f},{ey - 6 * s:.0f} q{12 * s:.0f},{26 * s:.0f} {2 * s:.0f},{46 * s:.0f}" stroke="#6c6660" stroke-width="{9 * s:.0f}" fill="none" stroke-linecap="round"/>'
                 + "".join(f'<rect x="{ex + dx * s:.0f}" y="{ey + 20 * s:.0f}" width="{14 * s:.0f}" height="{30 * s:.0f}"/>' for dx in (-44, -24, 18, 34)) + '</g>'
                 f'<ellipse cx="{ex + 44 * s:.0f}" cy="{ey - 12 * s:.0f}" rx="{14 * s:.0f}" ry="{18 * s:.0f}" fill="#5a544f"/>')
    return svg("kilimanjaro", "".join(b), ("#7fa9d6", "#f6dcc0"))


# ---------------------------------------------------------------- Cerro Torre: the needle and its ice mushroom
def cerro_torre():
    rng = random.Random(31)
    b = []
    # Patagonian wind: stacked lenticular clouds over the range
    for cx, cy, rx in ((300, 120, 210), (900, 150, 240)):
        for k in range(4):
            b.append(f'<ellipse cx="{cx + k * 6}" cy="{cy + k * 11}" rx="{rx - k * 34}" ry="{14 - k * 2}" fill="#ffffff" opacity="{0.8 - k * 0.15:.2f}"/>')
    back = ridge(0, W, 600, rng, [(0.12, 0.14, 0.6), (0.9, 0.12, 0.55), (0.5, 0.3, 0.3)], 310, jag=6)
    b.append(poly(back, "#93a0b2"))
    # Standhardt and Torre Egger, smaller towers to the right of the needle
    for cx, top, w, lit in ((860, 250, 120, "#a99f92"), (735, 175, 110, "#b3a99a")):
        b.append(poly([(cx - w, 520), (cx - w * 0.35, top + 60), (cx - w * 0.12, top), (cx + w * 0.15, top + 20), (cx + w * 0.4, top + 90), (cx + w, 520)], lit))
        b.append(poly([(cx - w * 0.12, top), (cx + w * 0.15, top + 20), (cx + w * 0.4, top + 90), (cx + w, 520), (cx + w * 0.05, 520)], "#7e766c"))
        b.append(f'<ellipse cx="{cx:.0f}" cy="{top + 4}" rx="{w * 0.2:.0f}" ry="9" fill="#f4f7fa"/>')
    # Cerro Torre: a sheer granite needle, lit on its left face, shaded on its right
    lit = [(470, 520), (540, 330), (566, 210), (582, 128), (596, 104), (612, 112), (622, 150)]
    shade = [(622, 150), (640, 250), (668, 380), (720, 520)]
    b.append(poly(lit + shade, "#cbc1b0"))
    b.append(poly([(596, 104), (612, 112), (622, 150)] + shade + [(610, 520)], "#8f8577"))
    for y in range(170, 500, 46):  # cracks and ledges on the face
        b.append(f'<path d="M{560 - (y - 170) * 0.22:.0f},{y} l{rng.uniform(20, 44):.0f},{rng.uniform(4, 10):.0f}" stroke="#8a8072" stroke-width="2.5" opacity="0.6"/>')
    # The rime-ice mushroom on the summit, and ice smeared down the headwall
    b.append('<path d="M570,112 C566,86 588,70 606,74 C628,70 644,90 636,112 C626,120 584,122 570,112 Z" fill="#f6f9fc"/>')
    b.append('<path d="M612,112 C628,110 640,102 636,112 C626,120 614,120 612,112 Z" fill="#d3dce8"/>')
    for x, y, h in ((586, 128, 40), (600, 140, 54), (612, 150, 30)):
        b.append(f'<path d="M{x},{y} l-3,{h}" stroke="#eef3f8" stroke-width="5" stroke-linecap="round" opacity="0.85"/>')
    # One small climber on the face, alone
    b.append('<g transform="translate(556,262)"><circle cx="0" cy="-9" r="3.2" fill="#2a2522"/>'
             '<path d="M0,-6 l1,10" stroke="#c0392b" stroke-width="5" stroke-linecap="round"/>'
             '<path d="M0,-4 l-7,-7 M1,-3 l6,-8 M1,4 l-5,8 M1,4 l5,7" stroke="#2a2522" stroke-width="2" stroke-linecap="round"/></g>')
    # The glacier pouring down to Laguna Torre, with icebergs on the grey water
    b.append('<path d="M330,520 C430,505 560,512 700,505 C820,500 940,512 1040,520 L1100,600 L250,600 Z" fill="#e8eef4"/>')
    for _ in range(14):
        x = rng.uniform(320, 1020)
        b.append(f'<path d="M{x:.0f},{rng.uniform(515, 590):.0f} l{rng.uniform(-30, 30):.0f},{rng.uniform(8, 18):.0f}" stroke="#b9c8d8" stroke-width="2.5" opacity="0.8"/>')
    b.append(f'<rect x="0" y="590" width="{W}" height="90" fill="#7d99a6"/>')
    for _ in range(7):
        x, y, s = rng.uniform(150, 1050), rng.uniform(605, 660), rng.uniform(0.6, 1.3)
        b.append(poly([(x, y + 12 * s), (x + 10 * s, y), (x + 34 * s, y + 2 * s), (x + 44 * s, y + 12 * s)], "#eef4f8"))
    for _ in range(22):
        x, y = rng.uniform(0, W), rng.uniform(600, 675)
        b.append(f'<path d="M{x:.0f},{y:.0f} l{rng.uniform(30, 70):.0f},0" stroke="#a8bfca" stroke-width="2" opacity="0.6" stroke-linecap="round"/>')
    # Dark moraine in front, and wind-bent lenga trees
    b.append(f'<path d="M0,680 C260,650 520,700 800,670 S1100,660 1200,675 L1200,800 L0,800 Z" fill="#4c4a46"/>')
    b.append(f'<path d="M0,740 C300,715 650,760 1000,730 S1160,725 1200,735 L1200,800 L0,800 Z" fill="#3a3835"/>')
    for x, base, s in ((90, 720, 1.0), (1090, 715, 1.2), (220, 745, 0.7)):
        b.append(f'<path d="M{x},{base} q{8 * s:.0f},-{40 * s:.0f} {34 * s:.0f},-{70 * s:.0f}" stroke="#3b2d22" stroke-width="{6 * s:.1f}" fill="none" stroke-linecap="round"/>')
        b.append(f'<ellipse cx="{x + 46 * s:.0f}" cy="{base - 76 * s:.0f}" rx="{48 * s:.0f}" ry="{18 * s:.0f}" fill="#55613a"/>')
    return svg("cerro-torre", "".join(b), ("#6f8fb3", "#dfe7ef"))


# ---------------------------------------------------------------- Tonga: swimming with a humpback mother and calf
def humpback(x, y, s, tilt=0, flip=False):
    """A humpback in side view, facing left, nose at (x, y), scaled by s; a negative tilt dips the nose to dive."""
    body = ("M0,0 C30,-40 120,-60 220,-60 C340,-60 460,-40 560,0 C600,15 640,25 670,25 "
            "L710,-20 C722,0 716,20 690,35 C716,50 722,70 710,90 L670,45 "
            "C630,50 580,60 520,65 C400,80 260,90 150,75 C80,65 20,35 0,0 Z")
    belly = "M20,20 C90,62 230,82 380,72 C460,66 520,60 560,52 C470,74 300,96 150,85 C80,78 40,52 20,20 Z"
    grooves = '<path d="M40,34 C130,66 260,78 380,70 M70,46 C150,72 260,82 360,78" fill="none" stroke="#9fb6c4" stroke-width="3" stroke-linecap="round"/>'
    far_fin = '<path d="M190,60 C170,120 130,170 80,200 C120,190 190,140 230,70 Z" fill="#9fb3c2"/>'
    near_fin = ('<path d="M150,60 C120,130 70,180 20,210 C60,205 150,150 190,70 Z" fill="#e4edf2" stroke="#2a3d4f" stroke-width="2"/>'
                + "".join(f'<circle cx="{150 - k * 26:.0f}" cy="{80 + k * 24:.0f}" r="5" fill="#c3d2dc"/>' for k in range(5)))
    knobs = "".join(f'<circle cx="{18 + k * 22}" cy="{-20 - k * 5 + (k % 2) * 4}" r="5" fill="#3c5266"/>' for k in range(5))
    hump = '<path d="M440,-48 C460,-62 480,-58 495,-38 Z" fill="#2a3d4f"/>'
    eye = '<circle cx="125" cy="12" r="5" fill="#0d1620"/>'
    flip_t = " scale(-1,1)" if flip else ""
    return (f'<g transform="translate({x},{y}) rotate({tilt}) scale({s}){flip_t}">{far_fin}'
            f'<path d="{body}" fill="#2f4558"/><path d="{belly}" fill="#c9d6de"/>{grooves}{hump}{knobs}{eye}{near_fin}</g>')


def tonga():
    rng = random.Random(21)
    b = []
    # Water from the bright surface down to deep blue
    b.append(f'<rect y="120" width="{W}" height="{H - 120}" fill="url(#tonga-water)"/>')
    b.append(clouds(rng, 3, 30, 90, opacity=0.8))
    # The surface seen from just below, and light shafts reaching down
    for _ in range(9):
        x, w = rng.uniform(-100, W), rng.uniform(30, 90)
        b.append(poly([(x, 120), (x + w, 120), (x + w * 2.6 + 160, H), (x + 140, H)], "#ffffff", opacity="0.07"))
    b.append(f'<path d="M0,120 C150,108 300,132 450,120 S750,108 900,122 S1100,130 1200,118 L1200,134 C1050,146 900,130 750,140 S450,132 300,140 S100,130 0,138 Z" fill="#bfe7f6" opacity="0.8"/>')
    # A snorkeler at the surface, looking down
    b.append('<g transform="translate(830,150)">'
             '<path d="M-90,6 L-130,-6 L-128,14 Z M-90,14 L-126,24 L-118,36 Z" fill="#f2c94c"/>'
             '<rect x="-92" y="0" width="70" height="18" rx="9" fill="#1d2a36"/>'
             '<rect x="-30" y="-4" width="64" height="26" rx="13" fill="#23506e"/>'
             '<path d="M0,20 C-10,40 -20,50 -36,56 M10,20 C14,42 4,56 -6,64" stroke="#d9a07a" stroke-width="7" fill="none" stroke-linecap="round"/>'
             '<circle cx="46" cy="10" r="13" fill="#d9a07a"/>'
             '<rect x="44" y="6" width="18" height="12" rx="4" fill="#7fd0f0" stroke="#1d2a36" stroke-width="3"/>'
             '<path d="M40,0 L40,-26" stroke="#f2c94c" stroke-width="4" stroke-linecap="round"/></g>')
    # Mother diving, calf following just above her
    b.append(humpback(250, 650, 0.95, tilt=-24))
    b.append(humpback(400, 360, 0.42, tilt=-20))
    # Bubbles rising from the calf's blowhole and drifting motes
    for k in range(8):
        b.append(f'<circle cx="{455 + rng.uniform(-8, 8):.0f}" cy="{300 - k * 20:.0f}" r="{3 + k * 0.6:.1f}" fill="none" stroke="#d6f1fb" stroke-width="2" opacity="0.7"/>')
    for _ in range(70):
        b.append(f'<circle cx="{rng.uniform(0, W):.0f}" cy="{rng.uniform(150, H):.0f}" r="{rng.uniform(1, 2.6):.1f}" fill="#e6f6fb" opacity="{rng.uniform(0.15, 0.45):.2f}"/>')
    return svg("tonga", "".join(b), ("#7fc0e6", "#e6f4fa"), grad("tonga-water", "#3aa3d2", "#0a2c52"))


# ---------------------------------------------------------------- Lassen: Lassen Peak in alpenglow over Manzanita Lake
def lassen():
    rng = random.Random(41)
    b = []
    b.append(glow(600, 470, 700, 260, "#ffd2a8", 0.6))
    for _ in range(3):  # long thin sunset clouds
        y, x = rng.uniform(90, 200), rng.uniform(80, 900)
        b.append(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{rng.uniform(160, 260):.0f}" ry="{rng.uniform(6, 10):.0f}" fill="#f4a98f" opacity="0.55"/>')
    # Far ridges, then Lassen Peak: a broad, lumpy lava dome with snow in its gullies, lit pink.
    b.append(poly(ridge(0, W, 470, rng, [(0.1, 0.15, 0.4), (0.9, 0.18, 0.5)], 110, jag=4), "#a58fa0"))
    peak = [(260, 470), (380, 360), (470, 280), (540, 214), (590, 196), (640, 186), (690, 198), (740, 230), (820, 300), (900, 360), (1000, 420), (1080, 470)]
    b.append(poly(peak, "#e9a99c"))
    b.append(poly([(640, 186), (690, 198), (740, 230), (820, 300), (900, 360), (1000, 420), (1080, 470), (700, 470)], "#5a4660", opacity="0.28"))
    for x0, y0, dx, dy in ((560, 214, -30, 70), (612, 194, -12, 90), (668, 194, 18, 80), (718, 222, 34, 66), (500, 262, -34, 52)):
        b.append(f'<path d="M{x0},{y0} q{dx * 0.9:.0f},{dy * 0.35:.0f} {dx},{dy}" fill="none" stroke="#fdf1ec" stroke-width="{rng.uniform(3, 6):.0f}" stroke-linecap="round" opacity="0.6"/>')
    b.append(poly([(540, 214), (590, 196), (640, 186), (690, 198), (720, 214), (680, 222), (640, 212), (600, 222), (560, 226)], "#fbeee9", opacity="0.85"))  # snow on the summit
    # Chaos Crags on the left, darker.
    b.append(poly([(0, 470), (0, 380), (90, 350), (150, 318), (210, 340), (300, 400), (360, 470)], "#7d6676"))
    # Shore pines, then the still lake with the peak mirrored in it.
    b.append(f'<rect x="0" y="470" width="{W}" height="330" fill="#6f7f9e"/>')
    mirror = [(x, 940 - y) for x, y in peak]
    b.append(poly(mirror, "#d99a95", opacity="0.55"))
    b.append(poly([(x, 940 - y) for x, y in [(0, 470), (0, 380), (90, 350), (150, 318), (210, 340), (300, 400), (360, 470)]], "#5e5068", opacity="0.5"))
    firs(b, rng, 70, -20, W + 20, 478, lambda x: 0, 36, 92, ("#1f3328", "#233a2d", "#2a4234"))
    b.append(f'<rect x="0" y="474" width="{W}" height="8" fill="#26372e"/>')
    for i in range(14):  # ripples
        y = rng.uniform(520, 780)
        x = rng.uniform(0, W)
        b.append(f'<path d="M{x:.0f},{y:.0f} h{rng.uniform(60, 180):.0f}" stroke="#f3d6cf" stroke-width="2" opacity="0.35" stroke-linecap="round"/>')
    # The first stars coming out, high up.
    for _ in range(26):
        x, y, r = rng.uniform(0, W), rng.uniform(10, 120), rng.uniform(0.8, 2)
        b.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.1f}" fill="#ffffff" opacity="{rng.uniform(0.5, 0.9):.2f}"/>')
    # Near shore: a dark bank of pines on the right.
    b.append(f'<path d="M820,800 C900,720 1060,690 1200,700 L1200,800 Z" fill="#17261d"/>')
    firs(b, rng, 12, 900, W + 20, 712, lambda x: 0, 110, 190, ("#14231a", "#18291f"))
    return svg("lassen", "".join(b), ("#3f4f7a", "#f2b893"))


# ---------------------------------------------------------------- Whistler: Whistler and Blackcomb, with the Peak 2 Peak gondola between them
def whistler():
    rng = random.Random(53)
    b = []
    b.append(glow(600, 260, 640, 220, "#ffffff", 0.5))
    b.append(clouds(rng, 3, 60, 160, opacity=0.6))
    # The far Coast Mountains, then the two peaks: Whistler on the left, Blackcomb on the right.
    b.append(poly(ridge(0, W, 500, rng, [(0.5, 0.25, 0.6)], 160, jag=8), "#b4c3d4"))
    whis = [(-20, 600), (120, 360), (240, 250), (330, 200), (380, 214), (470, 300), (560, 420), (640, 600)]
    black = [(520, 600), (640, 420), (760, 260), (850, 170), (900, 180), (980, 240), (1100, 340), (1220, 470), (1220, 600)]
    for pk, shade in ((whis, [(330, 200), (380, 214), (470, 300), (560, 420), (640, 600), (420, 600)]),
                      (black, [(850, 170), (900, 180), (980, 240), (1100, 340), (1220, 470), (1220, 600), (900, 600)])):
        b.append(poly(pk, "#f3f6f9"))
        b.append(poly(shade, "#24364d", opacity="0.10"))
    b.append(poly([(840, 178), (850, 170), (900, 180), (870, 230), (846, 210)], "#6b737d"))  # Blackcomb's rocky summit
    b.append(poly([(320, 206), (330, 200), (380, 214), (360, 250), (334, 236)], "#6b737d"))  # Whistler's
    # Ski runs: groomed lines down through the trees.
    for x0, y0, x1, y1 in ((300, 260, 200, 560), (360, 270, 420, 560), (820, 240, 720, 560), (900, 230, 960, 560), (880, 260, 860, 560)):
        b.append(f'<path d="M{x0},{y0} Q{(x0 + x1) / 2 + rng.uniform(-30, 30):.0f},{(y0 + y1) / 2:.0f} {x1},{y1}" fill="none" stroke="#ffffff" stroke-width="16" stroke-linecap="round" opacity="0.9"/>')
    # Forest on the lower slopes, leaving the runs open.
    for i in range(140):
        x = rng.uniform(0, W)
        y = rng.uniform(430, 600)
        if any(abs(x - (x0 + (x1 - x0) * (y - y0) / (y1 - y0))) < 18 for x0, y0, x1, y1 in ((300, 260, 200, 560), (360, 270, 420, 560), (820, 240, 720, 560), (900, 230, 960, 560), (880, 260, 860, 560)) if y0 < y < y1):
            continue
        h = rng.uniform(26, 50)
        b.append(poly([(x - h * 0.25, y), (x, y - h), (x + h * 0.25, y)], rng.choice(("#2f4a3c", "#294235", "#365443"))))
    # The Peak 2 Peak gondola, spanning the valley, one red cabin on it.
    b.append('<path d="M410,290 Q610,360 790,280" fill="none" stroke="#3b3a37" stroke-width="1.8" opacity="0.75"/>')
    b.append('<rect x="586" y="330" width="22" height="16" rx="3" fill="#c8402f"/><path d="M597,322 L597,330" stroke="#3b3a37" stroke-width="2"/>')
    b.append('<rect x="400" y="278" width="20" height="14" fill="#3b3a37"/><rect x="782" y="268" width="20" height="14" fill="#3b3a37"/>')
    # The village at the bottom: snow and lit chalets.
    b.append('<path d="M0,620 C300,590 900,600 1200,620 L1200,800 L0,800 Z" fill="#fbfcfd"/>')
    for cx, cy, w in ((420, 676, 70), (510, 664, 58), (640, 680, 80), (760, 666, 60), (860, 682, 72)):
        h = w * 0.6
        b.append(f'<rect x="{cx - w / 2:.0f}" y="{cy - h:.0f}" width="{w}" height="{h:.0f}" fill="#7a5038"/>')
        b.append(f'<rect x="{cx - w * 0.2:.0f}" y="{cy - h * 0.6:.0f}" width="{w * 0.14:.0f}" height="{h * 0.28:.0f}" fill="#f1c76b"/>')
        b.append(f'<rect x="{cx + w * 0.08:.0f}" y="{cy - h * 0.6:.0f}" width="{w * 0.14:.0f}" height="{h * 0.28:.0f}" fill="#f1c76b"/>')
        b.append(poly([(cx - w * 0.66, cy - h + 2), (cx, cy - h - w * 0.4), (cx + w * 0.66, cy - h + 2)], "#f7f9fb"))
    firs(b, rng, 30, -20, 330, 740, lambda x: 0, 70, 130, ("#1f3328", "#233a2d"))
    firs(b, rng, 30, 930, W + 20, 740, lambda x: 0, 70, 130, ("#1f3328", "#233a2d"))
    return svg("whistler", "".join(b), ("#7fb0dc", "#e9f2fa"))


# ---------------------------------------------------------------- Dublin: the Ha'penny Bridge over the Liffey at dusk
def dublin():
    rng = random.Random(53)
    b = []
    b.append(glow(600, 400, 800, 260, "#ffd7a8", 0.7))
    b.append(clouds(rng, 4, 60, 190, colour="#f6d2c4", opacity=0.45))
    quay = 500
    # The north quays: Georgian terraces in brick and painted plaster, windows lit for the evening
    town = []
    town.append(poly(ridge(-20, W + 20, quay, rng, [(0.2, 0.2, 0.7), (0.65, 0.25, 0.9)], 300, step=30), "#7c8aa6", opacity="0.5"))
    x = -30
    colours = ("#8f4a3a", "#a65a42", "#c9a35f", "#e7dcc6", "#3f6f73", "#7f3f39", "#b98a56", "#51627f")
    while x < W + 10:
        w, h = rng.randint(92, 138), rng.randint(190, 285)
        top = quay - h
        town.append(f'<rect x="{x}" y="{top}" width="{w}" height="{h}" fill="{rng.choice(colours)}"/>')
        town.append(poly([(x - 3, top), (x + 10, top - 20), (x + w - 10, top - 20), (x + w + 3, top)], "#39414f"))
        town.append(f'<rect x="{x + w * 0.72:.0f}" y="{top - 36}" width="16" height="22" fill="#4c4640"/>')
        cols, rows = max(2, w // 38), max(3, (h - 50) // 54)
        for r in range(rows):
            for c in range(cols):
                wx = x + (w / cols) * (c + 0.5) - 8
                wy = top + 20 + r * 52
                lit = rng.random() < 0.55
                town.append(f'<rect x="{wx:.0f}" y="{wy}" width="16" height="30" fill="{"#ffd98e" if lit else "#2f3a4c"}"/>')
                town.append(f'<line x1="{wx + 8:.0f}" y1="{wy}" x2="{wx + 8:.0f}" y2="{wy + 30}" stroke="#f3ecdc" stroke-width="1.5" opacity="0.7"/>')
        town.append(f'<rect x="{x}" y="{quay - 46}" width="{w}" height="46" fill="#2e2a2c" opacity="0.72"/>')  # shopfronts
        town.append(f'<rect x="{x + 8}" y="{quay - 36}" width="{w - 16}" height="24" fill="#f5c67a" opacity="0.85"/>')
        x += w
    town.append(f'<rect x="0" y="{quay}" width="{W}" height="26" fill="#5f6062"/>')  # the granite quay wall
    b.extend(town)
    # The Liffey, holding the terraces' colour upside down
    b.append(f'<defs>{grad("dublin-river", "#6c6f88", "#26344f")}</defs>')
    b.append(f'<rect x="0" y="{quay + 26}" width="{W}" height="{H - quay - 26}" fill="url(#dublin-river)"/>')
    b.append(f'<g transform="translate(0,{2 * quay + 52}) scale(1,-1)" opacity="0.32">{"".join(town)}</g>')

    # The bridge: one low elliptical span of white cast iron, with three lamp arches
    left, right, spring, rise = 150, 1050, 545, 112
    def deck(x, lift=0):
        t = (x - 600) / ((right - left) / 2)
        return spring - rise * (1 - t * t) - lift
    def curve(lift, width, colour="#f4f0e7"):
        points = " ".join(f"{x},{deck(x, lift):.1f}" for x in range(left, right + 1, 15))
        return f'<polyline points="{points}" fill="none" stroke="{colour}" stroke-width="{width}" stroke-linecap="round"/>'
    bridge = []
    bridge.append(curve(-32, 7))  # the arch's lower rib
    for x in range(left + 20, right, 30):  # ironwork between the ribs
        bridge.append(f'<circle cx="{x}" cy="{deck(x, -16):.1f}" r="11" fill="none" stroke="#f4f0e7" stroke-width="3"/>')
    bridge.append(curve(0, 9))
    bridge.append(curve(44, 5))  # the handrail
    for x in range(left + 10, right, 18):
        bridge.append(f'<line x1="{x}" y1="{deck(x):.1f}" x2="{x}" y2="{deck(x, 44):.1f}" stroke="#f4f0e7" stroke-width="2.5"/>')
    for x in (375, 600, 825):  # the lamp arches
        y = deck(x, 44)
        bridge.append(f'<path d="M{x - 42},{y:.0f} Q{x},{y - 74:.0f} {x + 42},{y:.0f}" fill="none" stroke="#f4f0e7" stroke-width="5"/>')
        bridge.append(f'<line x1="{x}" y1="{y - 37:.0f}" x2="{x}" y2="{y - 66:.0f}" stroke="#f4f0e7" stroke-width="4"/>')
        bridge.append(f'<rect x="{x - 8}" y="{y - 84:.0f}" width="16" height="20" rx="3" fill="#ffe6a6" stroke="#f4f0e7" stroke-width="2"/>')
    water_glow = "".join(glow(x, deck(x, 118), 70, 70, "#ffe6a6", 0.75) for x in (375, 600, 825))
    b.append(f'<g transform="translate(0,{2 * spring}) scale(1,-1)" opacity="0.28">{"".join(bridge)}</g>')
    b.append(water_glow)
    b.extend(bridge)
    # The stone abutments, and two people crossing
    b.append(poly([(60, spring + 38), (left + 34, spring + 38), (left + 14, spring - 22), (60, spring - 22)], "#5f6062"))
    b.append(poly([(W - 60, spring + 38), (right - 34, spring + 38), (right - 14, spring - 22), (W - 60, spring - 22)], "#5f6062"))
    for x, tall in ((535, 42), (558, 38)):
        y = deck(x)
        b.append(f'<rect x="{x - 6}" y="{y - tall + 8:.0f}" width="12" height="{tall - 8}" rx="5" fill="#27303f"/><circle cx="{x}" cy="{y - tall + 2:.0f}" r="6" fill="#27303f"/>')
    # Ripples, and lamplight breaking up on the water
    for _ in range(110):
        x, y, w = rng.uniform(0, W), rng.uniform(quay + 40, H), rng.uniform(40, 170)
        b.append(f'<line x1="{x:.0f}" y1="{y:.0f}" x2="{x + w:.0f}" y2="{y:.0f}" stroke="#dfe6f2" stroke-width="2" opacity="{rng.uniform(0.08, 0.26):.2f}"/>')
    for lamp in (375, 600, 825):
        for k in range(18):
            y = 625 + k * 9
            w = rng.uniform(16, 58)
            b.append(f'<line x1="{lamp - w / 2:.0f}" y1="{y}" x2="{lamp + w / 2:.0f}" y2="{y}" stroke="#ffd98e" stroke-width="3" opacity="{0.62 - k * 0.028:.2f}"/>')
    return svg("dublin", "".join(b), ("#3d5a8a", "#f4c9a4"))


# ---------------------------------------------------------------- Boston: Back Bay over the Charles in autumn
def boston():
    rng = random.Random(1630)
    b = []
    b.append(glow(600, 440, 760, 220, "#fff0d8", 0.6))
    b.append(clouds(rng, 4, 70, 210, opacity=0.7))
    shore = 470
    city = []
    # Far towers, then the Prudential and the Hancock's blue glass slab
    for x, w, h, col in ((70, 78, 150, "#a9b7c9"), (170, 60, 205, "#9dacc0"), (262, 90, 130, "#b4c0cf"), (850, 70, 180, "#a4b2c5"),
                         (946, 88, 225, "#98a8bd"), (1060, 76, 140, "#b0bccc")):
        city.append(f'<rect x="{x}" y="{shore - h}" width="{w}" height="{h}" fill="{col}"/>')
    city.append(f'<rect x="478" y="{shore - 330}" width="118" height="330" fill="#7f8c9e"/>')  # the Prudential
    city.append(f'<rect x="498" y="{shore - 352}" width="78" height="24" fill="#6f7c8e"/>')
    city.append(f'<rect x="534" y="{shore - 412}" width="6" height="62" fill="#5f6b7c"/>')
    for y in range(shore - 322, shore - 40, 14):
        city.append(f'<line x1="484" y1="{y}" x2="590" y2="{y}" stroke="#9ba7b6" stroke-width="3"/>')
    city.append(poly([(640, shore), (640, shore - 410), (736, shore - 390), (736, shore)], "#5f93bd"))  # the Hancock
    city.append(poly([(640, shore), (640, shore - 410), (668, shore - 404), (668, shore)], "#8cb9d9"))
    for y in range(shore - 370, shore - 30, 26):
        city.append(f'<line x1="670" y1="{y}" x2="736" y2="{y}" stroke="#7aa8cc" stroke-width="2"/>')
    # Brownstones along the river, the State House's gold dome on Beacon Hill to the left
    city.append(f'<rect x="150" y="{shore - 98}" width="130" height="98" fill="#b6805d"/>')
    city.append(f'<rect x="196" y="{shore - 134}" width="38" height="38" fill="#e8e0d0"/>')
    city.append(f'<path d="M186,{shore - 134} A29,34 0 0 1 244,{shore - 134} Z" fill="#e0ac3a"/>')
    city.append(f'<rect x="213" y="{shore - 184}" width="4" height="20" fill="#c8982f"/>')
    x = 0
    while x < W:
        w, h = rng.randint(50, 84), rng.randint(58, 96)
        if not 150 < x + w / 2 < 280:
            city.append(f'<rect x="{x}" y="{shore - h}" width="{w}" height="{h}" fill="{rng.choice(("#a35f47", "#8e4f3d", "#b6805d", "#c49a7a"))}"/>')
            city.append(f'<rect x="{x}" y="{shore - h - 5}" width="{w}" height="6" fill="#4d4a4b"/>')
            for wy in range(shore - h + 10, shore - 16, 22):
                for wx in range(x + 8, x + w - 10, 16):
                    city.append(f'<rect x="{wx}" y="{wy}" width="8" height="13" fill="#f3e6c8" opacity="0.85"/>')
        x += w
    # A line of autumn trees on the far bank
    for x in range(-10, W + 20, 26):
        city.append(f'<circle cx="{x}" cy="{shore - rng.randint(6, 22)}" r="{rng.randint(18, 28)}" fill="{rng.choice(("#c9682b", "#d98a2e", "#b5472d", "#a9772f", "#6f7a3a"))}"/>')
    b.extend(city)
    # The Charles, holding the skyline
    b.append(f'<defs>{grad("boston-river", "#7ea6c4", "#2f5f86")}</defs>')
    b.append(f'<rect x="0" y="{shore}" width="{W}" height="{H - shore}" fill="url(#boston-river)"/>')
    b.append(f'<g transform="translate(0,{2 * shore}) scale(1,-1)" opacity="0.28">{"".join(city)}</g>')
    for _ in range(130):
        x, y, w = rng.uniform(0, W), rng.uniform(shore + 8, H), rng.uniform(30, 150)
        b.append(f'<line x1="{x:.0f}" y1="{y:.0f}" x2="{x + w:.0f}" y2="{y:.0f}" stroke="#eaf3f9" stroke-width="2" opacity="{rng.uniform(0.1, 0.3):.2f}"/>')
    # Sailboats out from the Esplanade
    for x, y, s, sail in ((300, 560, 1.0, "#fbf8f0"), (470, 525, 0.62, "#fbf8f0"), (860, 590, 1.2, "#f6e7d2"), (1040, 535, 0.7, "#fbf8f0")):
        b.append(poly([(x, y - 104 * s), (x, y - 8 * s), (x + 58 * s, y - 8 * s)], sail))
        b.append(poly([(x - 4 * s, y - 92 * s), (x - 4 * s, y - 8 * s), (x - 38 * s, y - 8 * s)], "#e9e3d5"))
        b.append(poly([(x - 44 * s, y - 2 * s), (x + 64 * s, y - 2 * s), (x + 48 * s, y + 13 * s), (x - 30 * s, y + 13 * s)], "#27415c"))
    # Maple boughs on the near bank frame it
    for cx, cy, r, n in ((-20, 90, 210, 60), (1230, 120, 230, 66), (40, 700, 170, 34), (1170, 720, 160, 32)):
        for _ in range(n):
            a, d = rng.uniform(0, 6.28), rng.uniform(0, r)
            b.append(f'<circle cx="{cx + d * math.cos(a):.0f}" cy="{cy + d * 0.7 * math.sin(a):.0f}" r="{rng.randint(20, 40)}" fill="{rng.choice(("#d9622b", "#e8932e", "#c2402a", "#f0b13c"))}" opacity="0.93"/>')
    return svg("boston", "".join(b), ("#6ba3d6", "#f1eadc"))


# ---------------------------------------------------------------- Edinburgh: the castle on its rock above the Old Town at dusk
def edinburgh():
    rng = random.Random(1124)
    b = []
    b.append(glow(820, 470, 700, 240, "#ffd3a1", 0.65))
    b.append(clouds(rng, 4, 60, 200, colour="#f3d6cf", opacity=0.5))
    # Arthur's Seat, low and far off to the right
    b.append(poly(ridge(560, W + 40, 520, rng, [(0.45, 0.28, 1.0), (0.8, 0.18, 0.6)], 170, step=20), "#7d6f8c", opacity="0.75"))
    # Castle Rock: a sheer volcanic crag, darker toward the gardens
    rock = [(-40, 640), (-40, 430), (60, 395), (150, 372), (250, 360), (360, 352), (470, 356), (560, 372), (640, 412), (700, 470), (760, 560), (800, 640)]
    b.append(poly(rock, "#4b4351"))
    for _ in range(26):  # cracks and ledges in the basalt
        x, y = rng.uniform(40, 700), rng.uniform(420, 620)
        b.append(f'<path d="M{x:.0f} {y:.0f} l{rng.uniform(-30, 30):.0f} {rng.uniform(18, 50):.0f}" stroke="#3a3440" stroke-width="3" opacity="0.7"/>')
    # The castle along the top: curtain walls, the Half Moon Battery, the palace and a few towers, windows lit
    stone, shade = "#a99f93", "#857b70"
    b.append('<rect x="70" y="300" width="560" height="74" fill="#a99f93"/>')
    for x in range(70, 630, 20):
        b.append(f'<rect x="{x}" y="290" width="12" height="12" fill="{stone}"/>')
    b.append(f'<path d="M500 374 V286 A70 26 0 0 1 640 286 V374 Z" fill="{shade}"/>')  # the Half Moon Battery
    b.append(f'<rect x="160" y="222" width="200" height="80" fill="{stone}"/><path d="M152 224 L260 180 L368 224 Z" fill="#5f5a5e"/>')
    b.append(f'<rect x="380" y="200" width="96" height="100" fill="{shade}"/><path d="M372 202 L428 162 L484 202 Z" fill="#5f5a5e"/>')
    for x, w, h in ((110, 40, 120), (300, 34, 150), (440, 30, 176)):
        b.append(f'<rect x="{x}" y="{300 - h}" width="{w}" height="{h}" fill="{stone}"/>')
        for k in range(0, w, 10):
            b.append(f'<rect x="{x + k}" y="{300 - h - 9}" width="6" height="10" fill="{stone}"/>')
    b.append('<rect x="456" y="96" width="3" height="40" fill="#3b3438"/><path d="M459 98 h30 l-6 9 6 9 h-30 Z" fill="#2f5d8a"/>')
    for x, y in ((180, 250), (220, 250), (260, 250), (300, 250), (400, 230), (430, 230), (190, 330), (260, 330), (330, 330), (400, 330), (540, 320), (590, 320), (310, 190), (450, 150)):
        b.append(f'<rect x="{x}" y="{y}" width="11" height="18" rx="5" fill="#ffd98e"/>')
    # The Old Town ridge running down to the right: tall tenements and a spire
    x = 760
    while x < W + 10:
        w, h = rng.randint(46, 74), rng.randint(130, 210)
        top = 560 - h
        b.append(f'<rect x="{x}" y="{top}" width="{w}" height="{h + 80}" fill="{rng.choice(("#5a4f55", "#665a5e", "#4f4750"))}"/>')
        b.append(poly([(x - 2, top), (x + w / 2, top - 22), (x + w + 2, top)], "#3f383d"))
        for wy in range(top + 16, 600, 30):
            for wx in range(x + 8, x + w - 10, 16):
                if rng.random() < 0.45:
                    b.append(f'<rect x="{wx}" y="{wy}" width="8" height="13" fill="#ffd98e"/>')
        x += w
    b.append('<rect x="930" y="300" width="34" height="140" fill="#5a4f55"/><path d="M924 302 L947 170 L970 302 Z" fill="#4a4248"/>')
    # Princes Street Gardens below: dark trees, a path, and the gardens' lamps
    b.append(f'<rect y="640" width="{W}" height="160" fill="#26302a"/>')
    for _ in range(46):
        cx, cy = rng.uniform(-20, W + 20), rng.uniform(612, 690)
        b.append(f'<circle cx="{cx:.0f}" cy="{cy:.0f}" r="{rng.uniform(26, 44):.0f}" fill="{rng.choice(("#2f3d33", "#35473a", "#3b4f3f"))}"/>')
    b.append(f'<path d="M0 770 C300 730 700 760 {W} 720" fill="none" stroke="#c9bfa8" stroke-width="10" opacity="0.6"/>')
    for x in range(80, W, 160):
        y = 770 - 50 * x / W
        b.append(glow(x, y - 30, 30, 30, "#ffe0a3", 0.8))
        b.append(f'<rect x="{x - 2}" y="{y - 30:.0f}" width="4" height="30" fill="#1e2420"/>')
    return svg("edinburgh", "".join(b), ("#46557f", "#f0b991"))


# ---------------------------------------------------------------- Taipei: Taipei 101 at dusk, from Elephant Mountain
def taipei():
    rng = random.Random(101)
    b = []
    b.append(glow(640, 560, 760, 260, "#ffc59a", 0.6))
    b.append(clouds(rng, 4, 70, 220, colour="#f2cfd2", opacity=0.45))
    # Yangmingshan, low and blue across the basin
    b.append(poly(ridge(-40, W + 40, 560, rng, [(0.2, 0.25, 0.8), (0.55, 0.3, 1.0), (0.9, 0.2, 0.7)], 150, step=20), "#7a7f9e", opacity="0.8"))
    # The city: rows of blocks, nearer rows darker, windows lit
    for base, hmin, hmax, cols, p in ((600, 30, 90, ("#6a6a86", "#73718c"), 0.25), (650, 40, 120, ("#4f4f69", "#57556f", "#4a4a62"), 0.35)):
        x = -20
        while x < W + 20:
            w, h = rng.randint(30, 64), rng.randint(hmin, hmax)
            b.append(f'<rect x="{x}" y="{base - h}" width="{w}" height="{h + 160}" fill="{rng.choice(cols)}"/>')
            for wy in range(base - h + 8, base + 120, 14):
                for wx in range(x + 5, x + w - 6, 10):
                    if rng.random() < p:
                        b.append(f'<rect x="{wx}" y="{wy}" width="5" height="7" fill="#ffd98e" opacity="0.85"/>')
            x += w + rng.randint(0, 6)
    # Taipei 101: a podium, eight flaring segments, the crown and its spire
    cx, glass, edge, lit = 700, "#4f7f88", "#7fb0b4", "#ffe2a6"
    b.append(glow(cx, 330, 170, 330, "#ffe8bf", 0.35))
    b.append(poly([(cx - 70, 660), (cx - 56, 540), (cx + 56, 540), (cx + 70, 660)], "#466f78"))
    for k in range(4):
        b.append(f'<rect x="{cx - 52 + k * 28}" y="552" width="18" height="96" fill="#3d6169"/>')
    top = 540
    for k in range(8):
        y0, y1 = top - k * 40, top - (k + 1) * 40
        b.append(poly([(cx - 40, y0), (cx - 49, y1), (cx + 49, y1), (cx + 40, y0)], glass, stroke=edge, stroke_width="2"))
        b.append(f'<path d="M{cx - 49} {y1} H{cx + 49}" stroke="{lit}" stroke-width="3"/>')
        for wy in range(y1 + 8, y0 - 2, 8):
            b.append(f'<path d="M{cx - 42} {wy} H{cx + 42}" stroke="#3e6a72" stroke-width="1.5"/>')
        b.append(f'<path d="M{cx} {y1 + 2} V{y0}" stroke="#3e6a72" stroke-width="2"/>')
    crown = top - 8 * 40
    b.append(poly([(cx - 34, crown), (cx - 26, crown - 34), (cx + 26, crown - 34), (cx + 34, crown)], glass, stroke=edge, stroke_width="2"))
    b.append(poly([(cx - 20, crown - 34), (cx - 14, crown - 62), (cx + 14, crown - 62), (cx + 20, crown - 34)], glass, stroke=edge, stroke_width="2"))
    b.append(f'<rect x="{cx - 4}" y="{crown - 150}" width="8" height="90" fill="#9fb9bd"/>')
    b.append(f'<circle cx="{cx}" cy="{crown - 152}" r="4" fill="#ff8a6b"/>')
    # Elephant Mountain in front: a dark wooded ridge, boulders on its crest
    hill = [(-40, H), (-40, 600), (120, 610), (260, 640), (380, 690), (470, 740), (540, H)]
    b.append(poly(hill, "#25332b"))
    for _ in range(26):
        x, y = rng.uniform(-20, 420), rng.uniform(600, 700)
        if y > 600 + (x + 40) * 0.2:
            b.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{rng.uniform(16, 30):.0f}" fill="{rng.choice(("#2b3c31", "#30443a", "#223028"))}"/>')
    b.append('<path d="M60 640 q40 -40 90 -18 q20 18 -10 32 q-50 12 -80 -14 Z" fill="#3a3f3c"/>')
    b.append(glow(1050, H, 520, 70, "#ffd8a8", 0.25))
    return svg("taipei", "".join(b), ("#3f4a7a", "#f2b28f"))


PLACES = (("cerro-torre", cerro_torre),("hokkaido", hokkaido), ("lofoten", lofoten), ("patagonia", patagonia),
          ("bhutan", bhutan), ("samarkand", samarkand), ("faroe-islands", faroe),
          ("chamonix", chamonix), ("garibaldi", garibaldi), ("glacier-national-park", glacier), ("moorea", moorea),
          ("mexico-city", mexico_city), ("azores", azores), ("tonga", tonga),
          ("machu-picchu", machu_picchu), ("seattle-to-dc", seattle_to_dc), ("hunza", hunza),
          ("yosemite", yosemite), ("japan", japan), ("florence", florence),
          ("kilimanjaro", kilimanjaro), ("lassen", lassen), ("whistler", whistler), ("dublin", dublin), ("boston", boston), ("edinburgh", edinburgh), ("taipei", taipei))
os.makedirs(OUT, exist_ok=True)
for name, fn in PLACES:
    with open(os.path.join(OUT, f"{name}.svg"), "w") as f:
        f.write(fn())
print("wrote", ", ".join(n + ".svg" for n, _ in PLACES), "to", OUT)
