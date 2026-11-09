"""Draws the What I try to live by page's Inspiration cards as 1200x800 SVGs in images/inspiration/.

Each is an original flat drawing in the style of the Travel page's places, not a
photograph. Run from the repo root after changing a drawing:
  python3 tools/draw-inspiration.py
"""
import math, os, random, sys

OUT = sys.argv[1] if len(sys.argv) > 1 else "images/inspiration"
W, H = 1200, 800
SKIN, SKIN_SHADE = "#d6a07a", "#c08a66"
HAIR = "#3a2a20"
SKY_BLUE, WHITE = "#78acdc", "#f4f6f8"
GOLD, GOLD_DARK, GOLD_LIGHT = "#d9a93a", "#a9781e", "#f2cf6b"
MALACHITE = "#2e7d5b"


def pts(points):
    return " ".join(f"{x:.1f},{y:.1f}" for x, y in points)


def messi():
    """Lionel Messi lifting the World Cup over his head in the bisht he wore for it, Lusail, 18 December 2022."""
    rng = random.Random(10)
    defs = (
        '<linearGradient id="night" x1="0" y1="0" x2="0" y2="1">'
        '<stop offset="0" stop-color="#0d1a36"/><stop offset="1" stop-color="#243f6b"/></linearGradient>'
        '<radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">'
        '<stop offset="0" stop-color="#fff6d8" stop-opacity="0.55"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient>'
        '<radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">'
        '<stop offset="0" stop-color="#f2cf6b" stop-opacity="0.35"/><stop offset="1" stop-color="#f2cf6b" stop-opacity="0"/></radialGradient>'
    )
    body = [f'<rect width="{W}" height="{H}" fill="url(#night)"/>']
    # Floodlights in the top corners, and their glow
    for cx in (120, 1080):
        body.append(f'<circle cx="{cx}" cy="70" r="230" fill="url(#glow)"/>')
        for i in range(4):
            body.append(f'<rect x="{cx - 46 + i * 24}" y="58" width="18" height="12" rx="2" fill="#fff8e6"/>')
    # The crowd: rows of dim heads, with phone lights here and there
    for row, (y, shade) in enumerate(((560, "#1b2c4d"), (610, "#172745"), (660, "#13213c"), (712, "#101c33"))):
        x = -10 + row * 9
        while x < W + 20:
            r = rng.uniform(13, 17)
            body.append(f'<circle cx="{x:.1f}" cy="{y + rng.uniform(-4, 4):.1f}" r="{r:.1f}" fill="{shade}"/>')
            if rng.random() < 0.08:
                body.append(f'<circle cx="{x:.1f}" cy="{y - 22:.1f}" r="2.6" fill="#fff4c2"/>')
            x += rng.uniform(26, 34)
    body.append(f'<rect y="735" width="{W}" height="65" fill="#0e1830"/>')
    # Confetti, mostly gold, as it fell in Lusail
    for _ in range(170):
        x, y = rng.uniform(0, W), rng.uniform(0, 560)
        if 380 < x < 820 and y > 120:  # keep the figure clear
            continue
        col = rng.choice((GOLD_LIGHT, GOLD, GOLD, GOLD_LIGHT, WHITE, SKY_BLUE))
        w, h, a = rng.uniform(6, 12), rng.uniform(3, 6), rng.uniform(0, 180)
        body.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" fill="{col}" '
                    f'transform="rotate({a:.0f} {x:.1f} {y:.1f})" opacity="0.9"/>')
    body.append('<circle cx="600" cy="140" r="190" fill="url(#halo)"/>')

    # Shirt: Argentina's sky-blue and white stripes, clipped to the torso
    torso = [(430, 800), (434, 570), (446, 526), (478, 500), (540, 480), (660, 480), (722, 500), (754, 526), (766, 570), (770, 800)]
    defs += f'<clipPath id="shirt"><polygon points="{pts(torso)}"/></clipPath>'
    stripes = "".join(f'<rect x="{x}" y="460" width="46" height="340" fill="{SKY_BLUE}"/>' for x in range(416, 790, 92))
    body.append(f'<g clip-path="url(#shirt)"><rect x="420" y="460" width="360" height="340" fill="{WHITE}"/>{stripes}'
                f'<rect x="420" y="460" width="360" height="340" fill="#0d1a36" opacity="0.06"/></g>')
    # Collar and neck
    body.append(f'<rect x="572" y="412" width="56" height="74" rx="18" fill="{SKIN_SHADE}"/>')
    body.append(f'<polygon points="{pts([(548, 480), (600, 518), (652, 480), (636, 474), (600, 500), (564, 474)])}" fill="#1f2a3d"/>')

    # Arms raised to the trophy
    for side in (-1, 1):
        sx, ex, hx = 600 + side * 122, 600 + side * 172, 600 + side * 52
        body.append(f'<polyline points="{pts([(sx, 520), (ex, 360), (hx, 236)])}" fill="none" stroke="{SKIN}" '
                    'stroke-width="44" stroke-linecap="round" stroke-linejoin="round"/>')
        body.append(f'<circle cx="{hx}" cy="232" r="26" fill="{SKIN}"/>')
    # The bisht he was given before the lift: a sheer black cloak with gold trim, open down the
    # front over the shirt, its wide sleeves falling from his raised arms to just below the elbow
    for side in (-1, 1):
        x = lambda d: 600 + side * d
        cloak = [(x(56), 484), (x(146), 378), (x(202), 390), (x(238), 610), (x(224), 800), (x(58), 800)]
        body.append(f'<polygon points="{pts(cloak)}" fill="#111214" opacity="0.94"/>')
        body.append(f'<polyline points="{pts([(x(204), 396), (x(232), 600)])}" fill="none" stroke="#2a2b30" stroke-width="3"/>')
        body.append(f'<polyline points="{pts([(x(56), 484), (x(58), 800)])}" fill="none" stroke="{GOLD}" stroke-width="8"/>')
        body.append(f'<polyline points="{pts([(x(146), 378), (x(202), 390)])}" fill="none" stroke="{GOLD}" stroke-width="7" stroke-linecap="round"/>')
        body.append(f'<polyline points="{pts([(x(56), 484), (x(70), 470), (x(96), 462)])}" fill="none" stroke="{GOLD}" stroke-width="7" stroke-linecap="round"/>')

    # Head: hair, face and beard, without features, like the figures elsewhere on the site
    body.append(f'<ellipse cx="600" cy="352" rx="62" ry="74" fill="{SKIN}"/>')
    body.append(f'<path d="M538 336 Q536 268 600 266 Q666 266 664 336 Q652 300 600 300 Q552 300 538 336 Z" fill="{HAIR}"/>')
    body.append(f'<path d="M540 352 Q548 428 600 432 Q652 428 660 352 Q650 392 600 396 Q550 392 540 352 Z" fill="{HAIR}"/>')
    body.append(f'<ellipse cx="538" cy="356" rx="10" ry="16" fill="{SKIN_SHADE}"/><ellipse cx="662" cy="356" rx="10" ry="16" fill="{SKIN_SHADE}"/>')

    # The trophy: a base with two malachite bands, then two figures spiralling up from a narrow
    # waist and widening to their raised arms, which cradle the globe
    body.append(f'<polygon points="{pts([(562, 214), (638, 214), (644, 254), (556, 254)])}" fill="{GOLD}"/>')
    for y in (221, 237):
        body.append(f'<polygon points="{pts([(562 - (y - 214) * 0.15, y), (638 + (y - 214) * 0.15, y), (639 + (y - 206) * 0.15, y + 9), (561 - (y - 206) * 0.15, y + 9)])}" fill="{MALACHITE}"/>')
    body.append(f'<path d="M572 214 C576 198 588 192 586 182 C580 162 554 134 552 112 Q572 98 600 103 Q628 98 648 112 '
                f'C646 134 620 162 614 182 C612 192 624 198 628 214 Z" fill="{GOLD}"/>')
    body.append(f'<path d="M590 212 C600 192 620 172 604 152 S570 124 564 112" fill="none" stroke="{GOLD_DARK}" stroke-width="5" stroke-linecap="round"/>')
    body.append(f'<path d="M612 212 C602 196 584 178 598 158 S630 126 638 112" fill="none" stroke="{GOLD_LIGHT}" stroke-width="4" stroke-linecap="round" opacity="0.8"/>')
    body.append(f'<circle cx="600" cy="68" r="40" fill="{GOLD}"/>')
    body.append(f'<path d="M574 52 Q588 46 592 60 Q586 72 574 66 Z M606 42 Q624 40 628 56 Q616 60 608 54 Z M600 78 Q618 74 624 92 Q608 100 600 90 Z" fill="{GOLD_DARK}"/>')
    body.append(f'<path d="M574 46 Q588 34 606 32" fill="none" stroke="{GOLD_LIGHT}" stroke-width="5" stroke-linecap="round"/>')

    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
            f'<defs>{defs}</defs>{"".join(body)}</svg>\n')


def alphago():
    """AlphaGo against Lee Sedol, Seoul, March 2016: a 19x19 board mid-game, one black stone glowing
    for the move that surprised everyone, and a small policy-and-value network beside the board."""
    rng = random.Random(37)
    defs = (
        '<linearGradient id="room" x1="0" y1="0" x2="0" y2="1">'
        '<stop offset="0" stop-color="#1d2326"/><stop offset="1" stop-color="#2c3236"/></linearGradient>'
        '<linearGradient id="wood" x1="0" y1="0" x2="1" y2="1">'
        '<stop offset="0" stop-color="#e2bd72"/><stop offset="1" stop-color="#c99a4e"/></linearGradient>'
        '<radialGradient id="spot" cx="0.5" cy="0.5" r="0.5">'
        '<stop offset="0" stop-color="#ffe9a8" stop-opacity="0.9"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient>'
        '<radialGradient id="lamp" cx="0.5" cy="0.5" r="0.5">'
        '<stop offset="0" stop-color="#fff3d6" stop-opacity="0.16"/><stop offset="1" stop-color="#fff3d6" stop-opacity="0"/></radialGradient>'
    )
    body = [f'<rect width="{W}" height="{H}" fill="url(#room)"/>', '<circle cx="600" cy="400" r="520" fill="url(#lamp)"/>']
    # The board, seen from above: wood with a faint grain, and a shadow under it
    x0, y0, size = 290, 90, 620
    body.append(f'<rect x="{x0 + 14}" y="{y0 + 18}" width="{size}" height="{size}" rx="8" fill="#0f1315" opacity="0.55"/>')
    body.append(f'<rect x="{x0}" y="{y0}" width="{size}" height="{size}" rx="8" fill="url(#wood)"/>')
    for i in range(14):
        y = y0 + 20 + i * 44 + rng.uniform(-8, 8)
        body.append(f'<path d="M{x0 + 6} {y:.1f} Q{x0 + size / 2} {y + rng.uniform(-10, 10):.1f} {x0 + size - 6} {y + rng.uniform(-6, 6):.1f}" '
                    'fill="none" stroke="#b78a43" stroke-width="2" opacity="0.35"/>')
    m = 34
    step = (size - 2 * m) / 18
    gx = lambda c: x0 + m + c * step
    gy = lambda r: y0 + m + r * step
    lines = "".join(f'<line x1="{gx(0):.1f}" y1="{gy(i):.1f}" x2="{gx(18):.1f}" y2="{gy(i):.1f}"/>'
                    f'<line x1="{gx(i):.1f}" y1="{gy(0):.1f}" x2="{gx(i):.1f}" y2="{gy(18):.1f}"/>' for i in range(19))
    body.append(f'<g stroke="#3b2c18" stroke-width="1.6">{lines}</g>')
    for c in (3, 9, 15):
        for r in (3, 9, 15):
            body.append(f'<circle cx="{gx(c):.1f}" cy="{gy(r):.1f}" r="4.5" fill="#3b2c18"/>')
    # A game in progress: corners and sides taken first, as in a real opening
    taken = set()
    def stone(c, r, black):
        taken.add((c, r))
        x, y, rad = gx(c), gy(r), step * 0.47
        body.append(f'<circle cx="{x + 2:.1f}" cy="{y + 3:.1f}" r="{rad:.1f}" fill="#000" opacity="0.25"/>')
        if black:
            body.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rad:.1f}" fill="#1b1c1e"/>'
                        f'<circle cx="{x - rad * 0.32:.1f}" cy="{y - rad * 0.34:.1f}" r="{rad * 0.28:.1f}" fill="#4a4d52" opacity="0.7"/>')
        else:
            body.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rad:.1f}" fill="#f3f1ea"/>'
                        f'<circle cx="{x + rad * 0.18:.1f}" cy="{y + rad * 0.22:.1f}" r="{rad * 0.8:.1f}" fill="#d9d5ca" opacity="0.45"/>')
    groups = [((3, 3), 7), ((15, 3), 6), ((3, 15), 6), ((15, 15), 7), ((9, 3), 3), ((3, 9), 3), ((15, 10), 4), ((10, 15), 3)]
    black = True
    for (cc, cr), n in groups:
        for _ in range(n):
            for _try in range(20):
                c, r = cc + rng.randint(-2, 2), cr + rng.randint(-2, 2)
                if 0 <= c <= 18 and 0 <= r <= 18 and (c, r) not in taken:
                    stone(c, r, black)
                    black = not black
                    break
    # The move that surprised everyone: a black stone on the fifth line, ringed in light
    mc, mr = 13, 8
    taken.discard((mc, mr))
    body.append(f'<circle cx="{gx(mc):.1f}" cy="{gy(mr):.1f}" r="{step * 1.6:.1f}" fill="url(#spot)"/>')
    stone(mc, mr, True)
    body.append(f'<circle cx="{gx(mc):.1f}" cy="{gy(mr):.1f}" r="{step * 0.62:.1f}" fill="none" stroke="#f5c84c" stroke-width="3"/>')

    # Beside the board: the policy and value network, layers of nodes feeding one output
    layers = [5, 7, 7, 4, 1]
    nx = [80, 135, 190, 230, 262]
    nodes = [[(nx[i], 400 + (j - (n - 1) / 2) * 46) for j in range(n)] for i, n in enumerate(layers)]
    edges = []
    for a, b in zip(nodes, nodes[1:]):
        for p in a:
            for q in b:
                edges.append(f'<line x1="{p[0]}" y1="{p[1]:.1f}" x2="{q[0]}" y2="{q[1]:.1f}"/>')
    body.append(f'<g stroke="#78acdc" stroke-width="1.2" opacity="0.35">{"".join(edges)}</g>')
    for i, layer in enumerate(nodes):
        for p in layer:
            fill = "#f5c84c" if i == len(nodes) - 1 else "#78acdc"
            body.append(f'<circle cx="{p[0]}" cy="{p[1]:.1f}" r="{9 if i < len(nodes) - 1 else 12}" fill="{fill}"/>')
    body.append(f'<line x1="274" y1="400" x2="{x0 - 4}" y2="400" stroke="#f5c84c" stroke-width="2.5" stroke-dasharray="5 5" opacity="0.7"/>')
    # The other side: the bowls of stones, lids off
    for cy, fill, rim in ((290, "#1b1c1e", "#6b4a26"), (520, "#f3f1ea", "#6b4a26")):
        body.append(f'<ellipse cx="1060" cy="{cy}" rx="86" ry="78" fill="{rim}"/><ellipse cx="1060" cy="{cy}" rx="70" ry="62" fill="#4c3319"/>')
        for _ in range(14):
            x, y = 1060 + rng.uniform(-48, 48), cy + rng.uniform(-40, 40)
            body.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="13" fill="{fill}"/>')

    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
            f'<defs>{defs}</defs>{"".join(body)}</svg>\n')


def wrap(defs, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
            f'<defs>{defs}</defs>{"".join(body)}</svg>\n')


def feynman():
    """Richard Feynman from behind at a chalkboard, chalk raised beside his diagram of two
    electrons exchanging a photon."""
    rng = random.Random(1965)
    CHALK = "#eef0e6"
    defs = ('<linearGradient id="board" x1="0" y1="0" x2="1" y2="1">'
            '<stop offset="0" stop-color="#2f4b3f"/><stop offset="1" stop-color="#253d33"/></linearGradient>')
    body = [f'<rect width="{W}" height="{H}" fill="#6b5a48"/>',
            f'<rect x="40" y="40" width="1120" height="640" rx="6" fill="#8a6a45"/>',
            f'<rect x="60" y="60" width="1080" height="600" fill="url(#board)"/>']
    # Old chalk smudges
    for _ in range(26):
        x, y = rng.uniform(90, 1110), rng.uniform(90, 630)
        body.append(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{rng.uniform(40, 120):.0f}" ry="{rng.uniform(8, 22):.0f}" fill="{CHALK}" opacity="0.04"/>')
    ch = f'fill="none" stroke="{CHALK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"'
    # The diagram: two electrons come in, swap a photon (the wavy line), and fly apart
    v1, v2 = (300, 260), (300, 480)
    body.append(f'<polyline points="{pts([(140, 140), v1, (460, 140)])}" {ch}/>')
    body.append(f'<polyline points="{pts([(140, 600), v2, (460, 600)])}" {ch}/>')
    for (ax, ay), (bx, by) in (((140, 140), v1), (v1, (460, 140)), ((140, 600), v2), (v2, (460, 600))):
        mx, my = (ax + bx) / 2, (ay + by) / 2
        dx, dy = (bx - ax), (by - ay)
        n = (dx * dx + dy * dy) ** 0.5
        ux, uy = dx / n, dy / n
        body.append(f'<polyline points="{pts([(mx - ux * 16 - uy * 12, my - uy * 16 + ux * 12), (mx, my), (mx - ux * 16 + uy * 12, my - uy * 16 - ux * 12)])}" {ch}/>')
    wave = "M300 260 " + " ".join(f"Q{300 + (18 if i % 2 == 0 else -18)} {260 + i * 22 + 11} 300 {260 + (i + 1) * 22}" for i in range(10))
    body.append(f'<path d="{wave}" {ch}/>')
    for x, y in (v1, v2):
        body.append(f'<circle cx="{x}" cy="{y}" r="7" fill="{CHALK}"/>')
    tx = f'fill="{CHALK}" font-family="Georgia, serif" font-style="italic" font-size="34"'
    body.append(f'<text x="112" y="132" {tx}>e⁻</text><text x="472" y="132" {tx}>e⁻</text>'
                f'<text x="112" y="636" {tx}>e⁻</text><text x="472" y="636" {tx}>e⁻</text><text x="334" y="384" {tx}>γ</text>')
    # A few lines of working, just chalk marks, not real equations
    for i, w in enumerate((300, 240, 330, 190)):
        y = 170 + i * 56
        body.append(f'<path d="M560 {y} q{w / 4} -10 {w / 2} 0 t{w / 2} 0" fill="none" stroke="{CHALK}" stroke-width="4" stroke-linecap="round" opacity="0.6"/>')
    body.append(f'<rect x="60" y="660" width="1080" height="16" fill="#7a5c3a"/>')
    body.append(f'<rect x="250" y="662" width="40" height="9" rx="3" fill="{CHALK}"/><rect x="310" y="664" width="26" height="7" rx="3" fill="#e9c46a"/>')

    # Feynman, from behind: white shirt, wavy grey hair, right arm raised with the chalk
    shirt, shade, skin, hair = "#f1efe8", "#d9d6cc", "#d8a682", "#8c8a86"
    body.append(f'<polyline points="{pts([(930, 520), (870, 380), (790, 300)])}" fill="none" stroke="{shirt}" stroke-width="54" stroke-linecap="round" stroke-linejoin="round"/>')
    body.append(f'<circle cx="784" cy="292" r="24" fill="{skin}"/>')
    body.append(f'<line x1="770" y1="280" x2="752" y2="262" stroke="{CHALK}" stroke-width="9" stroke-linecap="round"/>')
    body.append(f'<path d="M780 304 q-6 6 -14 6" fill="none" stroke="{CHALK}" stroke-width="5" stroke-linecap="round"/>')
    body.append(f'<polygon points="{pts([(800, 800), (812, 560), (842, 500), (900, 476), (1010, 476), (1068, 500), (1094, 560), (1106, 800)])}" fill="{shirt}"/>')
    body.append(f'<polygon points="{pts([(955, 476), (1010, 476), (1068, 500), (1094, 560), (1106, 800), (1000, 800)])}" fill="{shade}" opacity="0.6"/>')
    body.append(f'<line x1="953" y1="500" x2="953" y2="800" stroke="{shade}" stroke-width="3"/>')
    body.append(f'<polyline points="{pts([(1062, 520), (1086, 650), (1074, 790)])}" fill="none" stroke="{shirt}" stroke-width="52" stroke-linecap="round"/>')
    body.append(f'<rect x="928" y="430" width="52" height="60" rx="16" fill="{skin}"/>')
    body.append(f'<ellipse cx="954" cy="384" rx="66" ry="76" fill="{skin}"/>')
    body.append(f'<path d="M886 392 Q878 300 954 300 Q1032 300 1022 392 Q1010 440 954 444 Q900 440 886 392 Z" fill="{hair}"/>')
    for i in range(7):
        x = 900 + i * 18
        body.append(f'<path d="M{x} {318 + (i % 2) * 6} q10 -16 20 0" fill="none" stroke="#a7a5a0" stroke-width="5" stroke-linecap="round"/>')
    body.append(f'<ellipse cx="886" cy="392" rx="10" ry="18" fill="{skin}"/><ellipse cx="1022" cy="392" rx="10" ry="18" fill="{skin}"/>')
    return wrap(defs, body)


def kipchoge():
    """Eliud Kipchoge breaking the tape in Vienna, October 2019, the first marathon under two hours:
    arms flung wide under the finish gantry, the clock at 1:59:40, Kenyan flags in the crowd and his
    pacers in black celebrating behind him."""
    rng = random.Random(15940)
    vx, vy = 600, 360  # where the Hauptallee meets the horizon
    defs = ('<linearGradient id="ksky" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#bcd3e2"/><stop offset="1" stop-color="#e9eee8"/></linearGradient>'
            '<linearGradient id="kroad" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#9a9c98"/><stop offset="1" stop-color="#5c5f5c"/></linearGradient>')
    body = [f'<rect width="{W}" height="{H}" fill="url(#ksky)"/>',
            f'<rect y="{vy}" width="{W}" height="{H - vy}" fill="#86a266"/>',
            f'<polygon points="{pts([(vx - 30, vy), (vx + 30, vy), (1040, H), (160, H)])}" fill="url(#kroad)"/>']
    # Autumn chestnut trees down the avenue
    for side in (-1, 1):
        for i in range(9):
            t = (i / 8) ** 1.5
            x, y, r = vx + side * (70 + t * 520), vy + 10 + t * 160, 26 + t * 90
            col = rng.choice(("#c98a3a", "#b8742e", "#d9a347", "#a3a14c"))
            body.append(f'<rect x="{x - r * 0.07:.0f}" y="{y - r * 0.5:.0f}" width="{r * 0.14:.0f}" height="{r * 0.7:.0f}" fill="#5b4632"/>')
            body.append(f'<circle cx="{x:.0f}" cy="{y - r * 0.95:.0f}" r="{r:.0f}" fill="{col}"/>'
                        f'<circle cx="{x - side * r * 0.45:.0f}" cy="{y - r * 1.25:.0f}" r="{r * 0.7:.0f}" fill="{col}" opacity="0.85"/>')
    # The crowd behind the barriers on both sides, some waving Kenyan flags
    def flag(x, y, s):
        body.append(f'<line x1="{x:.0f}" y1="{y:.0f}" x2="{x:.0f}" y2="{y + 46 * s:.0f}" stroke="#3a3a3a" stroke-width="{2.5 * s:.1f}"/>')
        for k, col in enumerate(("#111111", "#ffffff", "#bb1f2a", "#ffffff", "#1d7a3a")):
            hgt = (9, 2, 8, 2, 9)[k] * s
            off = sum((9, 2, 8, 2, 9)[:k]) * s
            body.append(f'<rect x="{x:.0f}" y="{y + off:.1f}" width="{44 * s:.1f}" height="{hgt:.1f}" fill="{col}"/>')
    for side in (-1, 1):
        for row, y in enumerate((468, 500, 532)):
            x = vx + side * 250
            while 0 < x < W:
                body.append(f'<rect x="{x - 13:.0f}" y="{y:.0f}" width="26" height="40" rx="8" fill="{rng.choice(("#c0392b", "#2c3e50", "#e1b12c", "#6c7a89", "#1d7a3a", "#f0f0f0"))}"/>'
                            f'<circle cx="{x:.0f}" cy="{y - 6:.0f}" r="11" fill="{rng.choice(("#5a3a28", "#8a5a3c", "#d6a07a"))}"/>')
                if row == 0 and rng.random() < 0.3:
                    flag(x + 6, y - 64, 1.0)
                x += side * rng.uniform(30, 40)
        body.append(f'<rect x="{0 if side < 0 else vx + 230}" y="560" width="{vx - 230}" height="26" fill="#f2f2f2"/>'
                    f'<rect x="{0 if side < 0 else vx + 230}" y="572" width="{vx - 230}" height="6" fill="#2f6db5"/>')

    def runner_front(x, y, s, vest, shorts, shoes, skin="#4a2e1f", arms="wide"):
        """A runner coming toward the viewer at scale s, feet at y."""
        lg = f'stroke="{skin}" stroke-width="{16 * s:.1f}" stroke-linecap="round" stroke-linejoin="round" fill="none"'
        body.append(f'<polyline points="{pts([(x - 12 * s, y - 120 * s), (x - 20 * s, y - 64 * s), (x - 16 * s, y - 8 * s)])}" {lg}/>')
        body.append(f'<polyline points="{pts([(x + 12 * s, y - 120 * s), (x + 26 * s, y - 84 * s), (x + 18 * s, y - 44 * s)])}" {lg}/>')
        body.append(f'<ellipse cx="{x - 16 * s:.1f}" cy="{y - 4 * s:.1f}" rx="{13 * s:.1f}" ry="{7 * s:.1f}" fill="{shoes}"/>'
                    f'<ellipse cx="{x + 19 * s:.1f}" cy="{y - 40 * s:.1f}" rx="{12 * s:.1f}" ry="{7 * s:.1f}" fill="{shoes}"/>')
        body.append(f'<rect x="{x - 30 * s:.1f}" y="{y - 150 * s:.1f}" width="{60 * s:.1f}" height="{38 * s:.1f}" rx="{8 * s:.1f}" fill="{shorts}"/>')
        body.append(f'<polygon points="{pts([(x - 32 * s, y - 148 * s), (x - 36 * s, y - 236 * s), (x - 18 * s, y - 246 * s), (x + 18 * s, y - 246 * s), (x + 36 * s, y - 236 * s), (x + 32 * s, y - 148 * s)])}" fill="{vest}"/>')
        am = f'stroke="{skin}" stroke-width="{13 * s:.1f}" stroke-linecap="round" stroke-linejoin="round" fill="none"'
        if arms == "wide":  # flung out wide and up, the way he crossed the line
            for d in (-1, 1):
                body.append(f'<polyline points="{pts([(x + d * 34 * s, y - 236 * s), (x + d * 92 * s, y - 266 * s), (x + d * 140 * s, y - 318 * s)])}" {am}/>')
                body.append(f'<circle cx="{x + d * 144 * s:.1f}" cy="{y - 324 * s:.1f}" r="{9 * s:.1f}" fill="{skin}"/>')
        else:  # fists raised
            for d in (-1, 1):
                body.append(f'<polyline points="{pts([(x + d * 34 * s, y - 236 * s), (x + d * 56 * s, y - 280 * s), (x + d * 52 * s, y - 330 * s)])}" {am}/>')
        body.append(f'<rect x="{x - 9 * s:.1f}" y="{y - 266 * s:.1f}" width="{18 * s:.1f}" height="{24 * s:.1f}" fill="{skin}"/>')
        body.append(f'<ellipse cx="{x:.1f}" cy="{y - 290 * s:.1f}" rx="{22 * s:.1f}" ry="{27 * s:.1f}" fill="{skin}"/>')
        body.append(f'<path d="M{x - 22 * s:.1f} {y - 294 * s:.1f} Q{x:.1f} {y - 330 * s:.1f} {x + 22 * s:.1f} {y - 294 * s:.1f} Q{x:.1f} {y - 308 * s:.1f} {x - 22 * s:.1f} {y - 294 * s:.1f} Z" fill="#1c1410"/>')

    # His pacers behind him, in black, celebrating
    for x, s in ((470, 0.62), (548, 0.56), (652, 0.56), (730, 0.62)):
        runner_front(x, 540, s, "#16181b", "#16181b", "#e8e8e8", arms="fists")
    # The finish gantry: two posts and a beam with the clock
    for x in (150, 1050):
        body.append(f'<rect x="{x - 22}" y="70" width="44" height="730" fill="#20365e"/>')
    body.append('<rect x="128" y="60" width="944" height="120" rx="6" fill="#20365e"/>')
    body.append('<rect x="420" y="78" width="360" height="84" rx="8" fill="#0b0d10"/>')
    body.append('<text x="600" y="146" text-anchor="middle" font-family="Menlo, Consolas, monospace" font-weight="700" '
                'font-size="66" letter-spacing="4" fill="#ffb02e">1:59:40</text>')
    body.append('<rect x="190" y="96" width="190" height="48" rx="6" fill="#ffffff" opacity="0.92"/>'
                '<rect x="820" y="96" width="190" height="48" rx="6" fill="#ffffff" opacity="0.92"/>')
    body.append('<text x="285" y="129" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="26" fill="#20365e">VIENNA</text>'
                '<text x="915" y="129" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="26" fill="#20365e">FINISH</text>')
    # Kipchoge, white vest and pink shoes, arms wide as he breaks the tape
    runner_front(600, 790, 1.55, "#f6f6f3", "#2a2f3a", "#ff4fa0")
    # The tape, broken at his waist, its two ends flying back
    body.append('<path d="M172 560 Q380 590 548 600 L552 612 Q370 606 172 576 Z" fill="#e8443a"/>'
                '<path d="M1028 560 Q820 590 652 598 L648 610 Q830 606 1028 576 Z" fill="#e8443a"/>')
    return wrap(defs, body)


def honnold():
    """Alex Honnold free soloing El Capitan, June 2017: a tiny figure in a red shirt high on the
    granite, with the Yosemite valley far below."""
    rng = random.Random(2017)
    defs = ('<linearGradient id="ysky" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#7fb3de"/><stop offset="1" stop-color="#cfe3f1"/></linearGradient>'
            '<linearGradient id="granite" x1="0" y1="0" x2="1" y2="0">'
            '<stop offset="0" stop-color="#d9d2c3"/><stop offset="0.6" stop-color="#c7bfae"/><stop offset="1" stop-color="#a99f8c"/></linearGradient>')
    body = [f'<rect width="{W}" height="{H}" fill="url(#ysky)"/>']
    # Far valley wall and the forest on the valley floor
    body.append(f'<polygon points="{pts([(0, 560), (120, 470), (260, 520), (360, 490), (420, 800), (0, 800)])}" fill="#a6b3bd"/>')
    for i in range(40):
        x = rng.uniform(0, 420)
        y = rng.uniform(660, 790)
        h = rng.uniform(30, 60)
        body.append(f'<polygon points="{pts([(x, y - h), (x - h * 0.3, y), (x + h * 0.3, y)])}" fill="{rng.choice(("#2f5a3a", "#3b6a45", "#284d33"))}"/>')
    # El Capitan: a huge granite face, its prow on the left, lit from the left
    face = [(330, 800), (360, 520), (420, 250), (520, 90), (640, 40), (900, 30), (1200, 60), (1200, 800)]
    body.append(f'<polygon points="{pts(face)}" fill="url(#granite)"/>')
    body.append(f'<polygon points="{pts([(520, 90), (640, 40), (900, 30), (1200, 60), (1200, 110), (880, 80), (650, 92)])}" fill="#2f5a3a" opacity="0.8"/>')
    # Cracks and streaks in the granite
    for _ in range(26):
        x, y = rng.uniform(430, 1180), rng.uniform(120, 780)
        pts_ = [(x, y)]
        for _k in range(5):
            x += rng.uniform(-14, 14); y += rng.uniform(18, 40)
            pts_.append((x, y))
        body.append(f'<polyline points="{pts(pts_)}" fill="none" stroke="#8f8676" stroke-width="{rng.uniform(1.5, 3.5):.1f}" opacity="0.6"/>')
    for _ in range(10):
        x = rng.uniform(600, 1180)
        body.append(f'<rect x="{x:.0f}" y="{rng.uniform(150, 400):.0f}" width="{rng.uniform(8, 20):.0f}" height="{rng.uniform(200, 420):.0f}" fill="#8f8676" opacity="0.12"/>')
    # Honnold: a small figure in a red shirt, one hand high, a foot on a hold
    x, y, s = 700, 330, 1.0
    skin = "#e0b08a"
    body.append(f'<polyline points="{pts([(x - 4, y + 8), (x - 16, y + 30), (x - 12, y + 48)])}" fill="none" stroke="#3a4a5e" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>')
    body.append(f'<polyline points="{pts([(x + 4, y + 8), (x + 18, y + 22), (x + 26, y + 18)])}" fill="none" stroke="#3a4a5e" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>')
    body.append(f'<rect x="{x - 9}" y="{y - 26}" width="18" height="36" rx="6" fill="#c8312b"/>')
    body.append(f'<polyline points="{pts([(x - 6, y - 22), (x - 14, y - 44), (x - 10, y - 64)])}" fill="none" stroke="{skin}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>')
    body.append(f'<polyline points="{pts([(x + 7, y - 20), (x + 20, y - 30), (x + 24, y - 42)])}" fill="none" stroke="{skin}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>')
    body.append(f'<circle cx="{x}" cy="{y - 34}" r="8" fill="{skin}"/><path d="M{x - 8} {y - 36} q8 -12 16 0" fill="#3a2a20"/>')
    body.append(f'<rect x="{x - 6}" y="{y + 6}" width="12" height="8" rx="3" fill="#e8e2d0"/>')
    return wrap(defs, body)


def alcaraz():
    """Carlos Alcaraz flat on his back on Centre Court's grass, arms flung out, just after winning
    Wimbledon in July 2023, seen from the side with the crowd on its feet behind him."""
    rng = random.Random(2023)
    defs = ('<linearGradient id="asky" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#cfe2ee"/><stop offset="1" stop-color="#eef3f2"/></linearGradient>')
    body = [f'<rect width="{W}" height="{H}" fill="url(#asky)"/>']
    # The stands, rising away from the court, packed and standing
    body.append(f'<polygon points="{pts([(0, 70), (W, 40), (W, 440), (0, 440)])}" fill="#1f4a2c"/>')
    for row in range(9):
        y = 92 + row * 38
        x = rng.uniform(-10, 10)
        while x < W + 10:
            col = rng.choice(("#f2f2ee", "#c0392b", "#2c3e50", "#e1b12c", "#7f8c8d", "#e8c4a0", "#5b2a86", "#f2f2ee"))
            body.append(f'<rect x="{x:.0f}" y="{y + 8:.0f}" width="20" height="22" rx="5" fill="{col}"/>'
                        f'<circle cx="{x + 10:.0f}" cy="{y + 3:.0f}" r="8" fill="{rng.choice(("#e2b48c", "#c69070", "#8a5a3c", "#f0cfb0"))}"/>')
            if rng.random() < 0.12:  # an arm up in the air
                body.append(f'<line x1="{x + 16:.0f}" y1="{y + 10:.0f}" x2="{x + 24:.0f}" y2="{y - 12:.0f}" stroke="#e2b48c" stroke-width="5" stroke-linecap="round"/>')
            x += rng.uniform(24, 30)
    # The court's back wall, dark green with a purple band
    body.append(f'<rect y="440" width="{W}" height="62" fill="#17391f"/><rect y="440" width="{W}" height="9" fill="#5b2a86"/>')
    # Grass, its mowing stripes running away from us, and the baseline
    body.append(f'<rect y="502" width="{W}" height="{H - 502}" fill="#5f9a46"/>')
    for i, y in enumerate((502, 540, 590, 652, 728)):
        if i % 2 == 0:
            body.append(f'<rect y="{y}" width="{W}" height="{(540, 590, 652, 728, 800)[i] - y}" fill="#6aa54f"/>')
    body.append(f'<polygon points="{pts([(0, 556), (W, 548), (W, 558), (0, 566)])}" fill="#f7f7f2"/>')
    body.append('<ellipse cx="610" cy="650" rx="420" ry="60" fill="#b59a63" opacity="0.55"/>')

    skin, kit, kit_shade, hair = "#e2b48c", "#fbfbf8", "#e4e4de", "#2b1d16"
    # His shadow on the grass, then Alcaraz lying on his back, head to the left
    body.append('<ellipse cx="610" cy="690" rx="270" ry="22" fill="#000" opacity="0.12"/>')
    body.append(f'<polyline points="{pts([(500, 652), (420, 630), (346, 620)])}" fill="none" stroke="{skin}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>')  # far arm, over his head
    body.append(f'<circle cx="340" cy="619" r="13" fill="{skin}"/>')
    body.append(f'<polyline points="{pts([(760, 668), (820, 600), (900, 664)])}" fill="none" stroke="{skin}" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>')  # far leg, knee up
    body.append(f'<ellipse cx="912" cy="668" rx="26" ry="14" fill="{kit}"/>')
    body.append(f'<rect x="490" y="636" width="200" height="58" rx="24" fill="{kit}"/>')  # shirt
    body.append(f'<rect x="680" y="640" width="96" height="52" rx="18" fill="{kit_shade}"/>')  # shorts
    body.append(f'<polyline points="{pts([(760, 680), (860, 684), (950, 690)])}" fill="none" stroke="{skin}" stroke-width="24" stroke-linecap="round"/>')  # near leg, straight
    body.append(f'<ellipse cx="966" cy="688" rx="28" ry="15" fill="{kit}"/>')
    body.append(f'<rect x="448" y="652" width="50" height="22" rx="10" fill="{skin}"/>')  # neck
    body.append(f'<ellipse cx="424" cy="662" rx="40" ry="34" fill="{skin}"/>')
    body.append(f'<path d="M386 664 Q384 700 424 700 Q462 700 462 676 Q440 690 420 686 Q396 682 386 664 Z" fill="{hair}"/>')
    body.append(f'<polyline points="{pts([(540, 660), (520, 720), (470, 748)])}" fill="none" stroke="{skin}" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>')  # near arm, flung out toward us
    body.append(f'<circle cx="462" cy="752" r="15" fill="{skin}"/>')
    # His racket on the grass where he let it go, and a ball
    body.append('<line x1="1040" y1="736" x2="1100" y2="722" stroke="#2b2b2b" stroke-width="11" stroke-linecap="round"/>')
    body.append('<ellipse cx="1006" cy="742" rx="58" ry="20" fill="#d9d9d2" stroke="#2b2b2b" stroke-width="9"/>')
    body.append('<circle cx="250" cy="720" r="13" fill="#dfe86a"/><path d="M240 713 q10 8 20 0" fill="none" stroke="#f7f7f2" stroke-width="2"/>')
    return wrap(defs, body)

def neuralink():
    """Neuralink's first patient, 2024: a man in a wheelchair moving a cursor across a chess game on
    a laptop by thought, a faint signal running from his head to the screen. A generic, faceless
    figure, not a likeness."""
    defs = ('<linearGradient id="nwall" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#efe7da"/><stop offset="1" stop-color="#e2d6c3"/></linearGradient>'
            '<linearGradient id="nscreen" x1="0" y1="0" x2="1" y2="1">'
            '<stop offset="0" stop-color="#2b3a4e"/><stop offset="1" stop-color="#1c2735"/></linearGradient>')
    body = [f'<rect width="{W}" height="{H}" fill="url(#nwall)"/>',
            f'<rect y="600" width="{W}" height="200" fill="#b8a283"/>', f'<rect y="596" width="{W}" height="8" fill="#a48e70"/>']
    # A window with soft daylight, and a plant
    body.append('<rect x="70" y="90" width="300" height="330" rx="6" fill="#cfe2ee"/><rect x="70" y="90" width="300" height="330" rx="6" fill="none" stroke="#fbf8f2" stroke-width="16"/>'
                '<line x1="220" y1="90" x2="220" y2="420" stroke="#fbf8f2" stroke-width="10"/><line x1="70" y1="255" x2="370" y2="255" stroke="#fbf8f2" stroke-width="10"/>')
    body.append('<rect x="1040" y="500" width="70" height="100" rx="10" fill="#c46a43"/>')
    for dx, dy, r in ((-24, -40, 36), (26, -52, 40), (0, -86, 38), (-40, -88, 26), (40, -100, 28)):
        body.append(f'<ellipse cx="{1075 + dx}" cy="{500 + dy}" rx="{r * 0.6:.0f}" ry="{r}" fill="#4f8a4f"/>')
    # The table and laptop, its screen turned toward him and us
    body.append('<rect x="640" y="470" width="360" height="22" rx="6" fill="#8a6a45"/><rect x="664" y="492" width="16" height="108" fill="#7a5c3a"/><rect x="960" y="492" width="16" height="108" fill="#7a5c3a"/>')
    body.append(f'<polygon points="{pts([(700, 468), (940, 468), (960, 458), (712, 458)])}" fill="#b9c0c8"/>')
    body.append(f'<polygon points="{pts([(712, 458), (952, 458), (930, 250), (690, 270)])}" fill="#9aa3ad"/>')
    body.append(f'<polygon points="{pts([(722, 448), (940, 448), (920, 262), (702, 280)])}" fill="url(#nscreen)"/>')
    # The chess game on the screen, drawn flat and skewed onto it
    board = []
    for r in range(8):
        for c in range(8):
            board.append(f'<rect x="{c * 20}" y="{r * 20}" width="20" height="20" fill="{"#e8d8b0" if (r + c) % 2 == 0 else "#9c7a54"}"/>')
    # Chess pieces mid-game (solid glyphs, filled white or black)
    pieces = ((4, 7, "♚", "#f6f6f2"), (3, 7, "♛", "#f6f6f2"), (0, 7, "♜", "#f6f6f2"), (5, 6, "♟", "#f6f6f2"), (6, 6, "♟", "#f6f6f2"),
              (2, 5, "♞", "#f6f6f2"), (4, 4, "♟", "#f6f6f2"), (4, 0, "♚", "#1b1c1e"), (3, 0, "♛", "#1b1c1e"), (7, 0, "♜", "#1b1c1e"),
              (2, 1, "♟", "#1b1c1e"), (5, 2, "♞", "#1b1c1e"), (3, 3, "♟", "#1b1c1e"), (6, 1, "♟", "#1b1c1e"))
    for c, r, g, col in pieces:
        stroke = "#1b1c1e" if col != "#1b1c1e" else "#f6f6f2"
        board.append(f'<text x="{c * 20 + 10}" y="{r * 20 + 16}" text-anchor="middle" font-size="17" '
                     f'font-family="DejaVu Sans, Segoe UI Symbol, Apple Symbols, sans-serif" fill="{col}" stroke="{stroke}" stroke-width="0.6">{g}\ufe0e</text>')  # FE0E: draw as text, never as an emoji
    board.append('<rect x="80" y="80" width="20" height="20" fill="none" stroke="#7fe0ff" stroke-width="2.5"/>')
    board.append('<path d="M92 92 l0 22 l6 -6 l5 10 l4 -2 l-5 -10 l8 0 z" fill="#ffffff" stroke="#1b1c1e" stroke-width="1.2"/>')
    body.append(f'<g transform="matrix(0.95 -0.07 0 0.95 748 292)">{"".join(board)}</g>')

    # The wheelchair: big wheel, seat and back, a small front caster
    body.append('<circle cx="330" cy="600" r="118" fill="none" stroke="#3a3f46" stroke-width="12"/>'
                '<circle cx="330" cy="600" r="100" fill="none" stroke="#8d949c" stroke-width="3"/>')
    for k in range(8):
        import math
        a_ = k * math.pi / 8
        body.append(f'<line x1="{330 + 100 * math.cos(a_):.0f}" y1="{600 + 100 * math.sin(a_):.0f}" x2="{330 - 100 * math.cos(a_):.0f}" y2="{600 - 100 * math.sin(a_):.0f}" stroke="#8d949c" stroke-width="2"/>')
    body.append('<circle cx="330" cy="600" r="12" fill="#3a3f46"/><circle cx="520" cy="690" r="26" fill="none" stroke="#3a3f46" stroke-width="9"/>')
    body.append(f'<polyline points="{pts([(250, 330), (270, 560), (470, 560), (520, 664)])}" fill="none" stroke="#3a3f46" stroke-width="12" stroke-linejoin="round"/>')
    body.append('<rect x="268" y="520" width="200" height="34" rx="10" fill="#2c3e57"/>')  # seat cushion
    body.append('<rect x="244" y="330" width="40" height="210" rx="14" fill="#2c3e57"/>')  # backrest

    # Him, seated, faceless, turned toward the screen; hands resting in his lap
    skin, top, trousers, hair = "#d9a77f", "#6c8eb5", "#3b4656", "#3a2a20"
    body.append(f'<polyline points="{pts([(300, 540), (470, 540), (480, 700)])}" fill="none" stroke="{trousers}" stroke-width="52" stroke-linejoin="round"/>')
    body.append('<ellipse cx="500" cy="716" rx="34" ry="14" fill="#2a2a2a"/>')
    body.append(f'<path d="M268 548 L282 380 Q290 350 330 346 Q372 350 380 380 L394 548 Z" fill="{top}"/>')
    body.append(f'<polyline points="{pts([(352, 400), (398, 486), (452, 516)])}" fill="none" stroke="{top}" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/>')
    body.append(f'<circle cx="462" cy="520" r="18" fill="{skin}"/>')
    body.append(f'<rect x="318" y="308" width="30" height="46" rx="12" fill="{skin}"/>')
    body.append(f'<ellipse cx="340" cy="270" rx="50" ry="56" fill="{skin}"/>')
    body.append(f'<path d="M292 268 Q288 208 344 206 Q394 208 390 250 Q366 236 340 238 Q312 242 300 290 Z" fill="{hair}"/>')
    # The signal: soft arcs travelling from his head to the cursor
    for k in range(4):
        r = 70 + k * 46
        body.append(f'<path d="M{340 + r * 0.82:.0f} {270 - r * 0.45:.0f} A{r} {r} 0 0 1 {340 + r * 0.9:.0f} {270 + r * 0.42:.0f}" fill="none" '
                    f'stroke="#4fb6e0" stroke-width="5" stroke-linecap="round" opacity="{0.75 - k * 0.15:.2f}"/>')
    body.append('<line x1="560" y1="300" x2="830" y2="364" stroke="#4fb6e0" stroke-width="2.5" stroke-dasharray="6 9" opacity="0.6"/>')
    return wrap(defs, body)

def jobs():
    """Steve Jobs at home in 1982: a bare room at night, a tall Tiffany floor lamp as the only light,
    and him cross-legged on a small mat beneath it with a cup of tea. A scene, not a copy of the photograph."""
    defs = ('<radialGradient id="pool" cx="0.5" cy="0.5" r="0.5">'
            '<stop offset="0" stop-color="#ffd896" stop-opacity="0.75"/><stop offset="0.55" stop-color="#e0a85a" stop-opacity="0.22"/>'
            '<stop offset="1" stop-color="#e0a85a" stop-opacity="0"/></radialGradient>'
            '<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#5a3c22"/><stop offset="1" stop-color="#1c120a"/></linearGradient>'
            '<radialGradient id="dark" cx="0.55" cy="0.55" r="0.75">'
            '<stop offset="0.55" stop-color="#0a0806" stop-opacity="0"/><stop offset="1" stop-color="#0a0806" stop-opacity="0.85"/></radialGradient>'
            '<radialGradient id="shade" cx="0.5" cy="0.75" r="0.75">'
            '<stop offset="0" stop-color="#fff6dc"/><stop offset="1" stop-color="#e9cf98"/></radialGradient>')
    body = [f'<rect width="{W}" height="{H}" fill="#14100c"/>']
    # The back wall, lit faintly by the lamp, with tall windows onto the night
    body.append('<rect x="0" y="40" width="1200" height="470" fill="#3a2e22"/>')
    body.append('<circle cx="740" cy="250" r="560" fill="url(#pool)" opacity="0.55"/>')
    for x0 in (260, 410, 560):  # three tall windows, six panes each
        body.append(f'<rect x="{x0}" y="150" width="130" height="300" fill="#101421"/>')
        body.append(f'<path d="M{x0 + 65} 150v300M{x0} 250h130M{x0} 350h130" stroke="#3a2e22" stroke-width="8"/>')
    for y in (40, 92):  # the ceiling beams
        body.append(f'<rect x="0" y="{y}" width="1200" height="26" fill="#0e0b08"/>')
    # The floor: dark wood, with the lamp's light pooled on it
    body.append('<rect y="500" width="1200" height="300" fill="url(#floor)"/>')
    body.append('<ellipse cx="700" cy="640" rx="430" ry="120" fill="url(#pool)"/>')
    # The lamp, the centerpiece: a bronze stem rising from a round foot to a pale leaded-glass dome
    cx, top = 760, 175
    body.append(f'<ellipse cx="{cx}" cy="642" rx="58" ry="14" fill="#2a1c10"/>')
    body.append(f'<rect x="{cx - 6}" y="{top + 95}" width="12" height="{642 - top - 95}" fill="#5a3e22"/>')
    body.append(f'<circle cx="{cx}" cy="{top + 4}" r="7" fill="#5a3e22"/>')
    body.append(f'<path d="M{cx - 135} {top + 100} Q{cx - 120} {top + 8} {cx} {top} Q{cx + 120} {top + 8} {cx + 135} {top + 100} Z" fill="url(#shade)"/>')
    for k in range(-3, 4):  # the leading between the panes of glass
        body.append(f'<path d="M{cx} {top} Q{cx + k * 30} {top + 30} {cx + k * 42} {top + 100}" fill="none" stroke="#b8925a" stroke-width="2" opacity="0.7"/>')
    body.append(f'<path d="M{cx - 128} {top + 70} Q{cx} {top + 52} {cx + 128} {top + 70}" fill="none" stroke="#b8925a" stroke-width="2" opacity="0.7"/>')
    body.append(f'<path d="M{cx - 140} {top + 100} H{cx + 140}" stroke="#8a6a3a" stroke-width="6" stroke-linecap="round"/>')
    body.append(f'<ellipse cx="{cx}" cy="{top + 104}" rx="118" ry="10" fill="#fff3d0" opacity="0.9"/>')
    # Him, small in the room: cross-legged on a pale mat, dark sweater, a cup of tea in both hands
    skin, hair, sweater, jeans = "#d9a882", "#2a1d14", "#1d1a1c", "#2c3d58"
    body.append('<path d="M470 640 L700 640 L690 668 L460 668 Z" fill="#e7dfcf"/>')
    body.append(f'<path d="M500 652 Q530 600 575 606 L590 622 L605 606 Q650 600 680 652 Q640 664 590 658 Q540 664 500 652 Z" fill="{jeans}"/>')
    body.append(f'<path d="M548 618 Q540 545 562 512 Q590 498 618 512 Q640 545 632 618 Z" fill="{sweater}"/>')
    body.append(f'<path d="M560 530 Q548 575 582 592 M620 530 Q632 575 598 592" fill="none" stroke="{sweater}" stroke-width="22" stroke-linecap="round"/>')
    body.append(f'<rect x="580" y="574" width="20" height="22" rx="4" fill="#f3efe6"/>')
    body.append(f'<rect x="582" y="488" width="16" height="18" rx="5" fill="{skin}"/>')
    body.append(f'<ellipse cx="590" cy="470" rx="24" ry="29" fill="{skin}"/>')
    body.append(f'<path d="M565 470 Q562 438 590 436 Q620 436 616 470 Q610 450 590 448 Q572 450 565 470 Z" fill="{hair}"/>')
    # Dark corners, as the lamp is the only light
    body.append(f'<rect width="{W}" height="{H}" fill="url(#dark)"/>')
    return wrap(defs, body)

def iphone():
    """The original iPhone, 2007: black glass and a brushed-aluminium edge, its grid of app icons
    lit on the screen and the one round button below. The phone that became a computer in a pocket."""
    defs = ('<radialGradient id="desk" cx="0.5" cy="0.45" r="0.75">'
            '<stop offset="0" stop-color="#f1ebe1"/><stop offset="1" stop-color="#d9cfc0"/></radialGradient>'
            '<linearGradient id="screen" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#1d3550"/><stop offset="1" stop-color="#0d1824"/></linearGradient>')
    body = [f'<rect width="{W}" height="{H}" fill="url(#desk)"/>']
    x, y, w, h = 470, 90, 260, 520
    body.append(f'<rect x="{x + 14}" y="{y + 24}" width="{w}" height="{h}" rx="40" fill="#000" opacity="0.18"/>')
    body.append(f'<rect x="{x - 4}" y="{y - 4}" width="{w + 8}" height="{h + 8}" rx="42" fill="#b9bcc0"/>')
    body.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="38" fill="#141414"/>')
    sx, sy, sw, sh = x + 20, y + 80, w - 40, h - 170
    body.append(f'<rect x="{sx}" y="{sy}" width="{sw}" height="{sh}" fill="url(#screen)"/>')
    colours = ["#4caf50", "#f5c33b", "#3d8be0", "#e8574a", "#9c6ad6", "#f08a3a", "#36b5a8", "#ec6f9b",
               "#8bc34a", "#5aa3e8", "#f2a541", "#7d8a96", "#e05a5a", "#4db6ac", "#ffb74d", "#90a4ae"]
    for i, c in enumerate(colours):
        col, row = i % 4, i // 4
        body.append(f'<rect x="{sx + 14 + col * 52}" y="{sy + 20 + row * 62}" width="38" height="38" rx="9" fill="{c}"/>')
    body.append(f'<rect x="{sx}" y="{sy + sh - 58}" width="{sw}" height="58" fill="#ffffff" opacity="0.12"/>')
    for i, c in enumerate(["#4caf50", "#3d8be0", "#f08a3a", "#e8574a"]):
        body.append(f'<rect x="{sx + 14 + i * 52}" y="{sy + sh - 48}" width="38" height="38" rx="9" fill="{c}"/>')
    body.append(f'<rect x="{x + w / 2 - 22}" y="{y + 40}" width="44" height="6" rx="3" fill="#2c2c2c"/>')
    body.append(f'<circle cx="{x + w / 2}" cy="{y + h - 45}" r="22" fill="none" stroke="#3a3a3a" stroke-width="4"/>')
    body.append(f'<rect x="{x + w / 2 - 7}" y="{y + h - 52}" width="14" height="14" rx="3" fill="none" stroke="#3a3a3a" stroke-width="2"/>')
    return wrap(defs, body)

def coding_agent():
    """Claude Code: a laptop open on a desk at night, a terminal on its screen with a request typed
    at the prompt and the code it's writing filling in below, line by line."""
    defs = ('<linearGradient id="night" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#2b2a33"/><stop offset="1" stop-color="#3b3640"/></linearGradient>')
    body = [f'<rect width="{W}" height="{H}" fill="url(#night)"/>']
    body.append(f'<rect y="610" width="{W}" height="190" fill="#5b4636"/>')
    body.append('<ellipse cx="600" cy="420" rx="420" ry="260" fill="#f2b880" opacity="0.08"/>')
    # The laptop: screen, then the base in front
    body.append('<rect x="300" y="150" width="600" height="400" rx="18" fill="#c9ccd0"/>')
    body.append('<rect x="318" y="168" width="564" height="364" rx="6" fill="#1b1a17"/>')
    body.append('<path d="M250 552 L950 552 L990 600 Q600 618 210 600 Z" fill="#b6b9be"/>')
    body.append('<rect x="540" y="552" width="120" height="10" rx="4" fill="#9a9da2"/>')
    # The terminal: a prompt with the request, then code coming in
    body.append('<circle cx="340" cy="188" r="6" fill="#e8574a"/><circle cx="360" cy="188" r="6" fill="#f5c33b"/><circle cx="380" cy="188" r="6" fill="#4caf50"/>')
    body.append('<path d="M342 230 l12 8 -12 8" fill="none" stroke="#d97757" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>')
    body.append('<rect x="366" y="231" width="300" height="14" rx="5" fill="#ece6da"/>')
    rows = [(0, 180, "#d97757"), (1, 260, "#8fb8de"), (1, 210, "#a8d39b"), (2, 300, "#ece6da"), (2, 170, "#8fb8de"),
            (1, 240, "#a8d39b"), (0, 140, "#d97757"), (1, 280, "#ece6da"), (2, 200, "#8fb8de")]
    for i, (indent, width, colour) in enumerate(rows):
        body.append(f'<rect x="{366 + indent * 28}" y="{272 + i * 26}" width="{width}" height="12" rx="5" fill="{colour}" opacity="0.85"/>')
    body.append('<rect x="366" y="508" width="12" height="16" fill="#ece6da"/>')
    # A spark beside the prompt: the agent at work
    sx, sy = 820, 238
    body.append(f'<path d="M{sx} {sy - 22} L{sx + 6} {sy - 6} L{sx + 22} {sy} L{sx + 6} {sy + 6} L{sx} {sy + 22} L{sx - 6} {sy + 6} L{sx - 22} {sy} L{sx - 6} {sy - 6} Z" fill="#d97757"/>')
    # A mug on the desk
    body.append('<rect x="1010" y="540" width="70" height="80" rx="10" fill="#e7e1d6"/><path d="M1080 560 q26 6 0 36" fill="none" stroke="#e7e1d6" stroke-width="8"/>')
    return wrap(defs, body)

def suzuki():
    """Shunryu Suzuki's beginner's mind: an empty zendo in the morning, a round cushion on the tatami
    facing a plain wall, and an enso brushed on the hanging scroll. A scene, no portrait."""
    defs = ('<linearGradient id="zwall" x1="0" y1="0" x2="1" y2="0">'
            '<stop offset="0" stop-color="#efe6d4"/><stop offset="1" stop-color="#ddd0b8"/></linearGradient>'
            '<linearGradient id="zlight" x1="0" y1="0" x2="1" y2="1">'
            '<stop offset="0" stop-color="#fff6e0" stop-opacity="0.75"/><stop offset="1" stop-color="#fff6e0" stop-opacity="0"/></linearGradient>')
    body = ['<rect width="1200" height="800" fill="url(#zwall)"/>']
    # Shoji screen on the left: a lattice of paper panes, glowing with morning light
    body.append('<rect x="40" y="60" width="300" height="470" fill="#fbf6ea"/>')
    for x in range(40, 341, 75):
        body.append(f'<path d="M{x} 60v470" stroke="#8a6a48" stroke-width="6"/>')
    for y in range(60, 531, 94):
        body.append(f'<path d="M40 {y}h300" stroke="#8a6a48" stroke-width="6"/>')
    body.append('<path d="M340 120 L900 560 L900 640 L340 640 Z" fill="url(#zlight)"/>')  # light falling across the room
    # Tokonoma alcove with a hanging scroll and its ensō
    body.append('<rect x="640" y="70" width="440" height="460" fill="#e2d6be"/>')
    body.append('<rect x="760" y="100" width="200" height="380" fill="#f8f3e6" stroke="#b49a72" stroke-width="5"/>')
    body.append('<path d="M760 100h200M760 480h200" stroke="#5a4632" stroke-width="12" stroke-linecap="round"/>')
    body.append('<path d="M904 238 C908 190 870 166 838 172 C800 180 784 224 796 262 C808 300 852 316 884 298 C904 286 912 266 908 250" '
                'fill="none" stroke="#1c1b19" stroke-width="16" stroke-linecap="round" opacity="0.9"/>')
    body.append('<circle cx="868" cy="410" r="9" fill="#b8402e"/>')  # the red seal
    body.append('<rect x="640" y="520" width="440" height="16" fill="#6b5238"/>')
    # Tatami floor, in perspective, with dark borders
    body.append('<path d="M0 560 H1200 V800 H0 Z" fill="#cdbf8e"/>')
    for x0, x1 in ((0, -260), (400, 300), (800, 860), (1200, 1420)):
        body.append(f'<path d="M{x0} 560 L{x1} 800" stroke="#3c4a32" stroke-width="7"/>')
    body.append('<path d="M0 660 H1200" stroke="#3c4a32" stroke-width="7"/>')
    body.append('<path d="M0 560 H1200" stroke="#5a4632" stroke-width="10"/>')
    # The round black zafu on a square mat, waiting for someone to sit
    body.append('<path d="M420 690 L760 690 L800 740 L380 740 Z" fill="#2a2522"/>')
    body.append('<ellipse cx="590" cy="690" rx="120" ry="34" fill="#1d1a18"/>')
    body.append('<path d="M470 690 Q470 640 590 638 Q710 640 710 690 Q650 714 590 712 Q530 714 470 690 Z" fill="#26221f"/>')
    body.append('<path d="M500 664 Q590 650 680 664" fill="none" stroke="#3a3430" stroke-width="3"/>')
    # A single stick of incense, smoke curling up
    body.append('<rect x="1010" y="505" width="40" height="18" rx="4" fill="#4a3a2a"/><path d="M1030 505v-60" stroke="#6b4a2a" stroke-width="3"/>')
    body.append('<path d="M1030 445 C1018 420 1044 400 1030 376 C1018 354 1040 336 1032 314" fill="none" stroke="#9a9086" stroke-width="2.5" opacity="0.55"/>')
    return wrap(defs, body)

def spreadsheet():
    """Spreadsheets let anyone model: a sheet filling the frame, a green header row, a grid of
    numbers with one cell selected, and a small bar chart rising beside the columns."""
    rng = random.Random(7)
    body = ['<rect width="1200" height="800" fill="#f7f8f5"/>']
    # Toolbar and formula bar
    body.append('<rect width="1200" height="64" fill="#1f6e4a"/>')
    for x in (40, 84, 128):
        body.append(f'<rect x="{x}" y="22" width="28" height="20" rx="3" fill="#bfe0cd"/>')
    body.append('<rect y="64" width="1200" height="46" fill="#e9ece6"/>')
    body.append('<rect x="96" y="76" width="420" height="22" rx="3" fill="#fff" stroke="#c6cbc2" stroke-width="2"/>')
    body.append('<path d="M110 87h230" stroke="#6d756a" stroke-width="5" stroke-linecap="round"/>')
    # The grid: row numbers on the left, column letters along the top
    left, top, cw, rh, cols, rows = 60, 110, 148, 54, 4, 12
    body.append(f'<rect y="{top}" width="1200" height="{rh}" fill="#d9e8df"/>')
    body.append(f'<rect y="{top}" width="{left}" height="{H - top}" fill="#e9ece6"/>')
    for c in range(cols):
        body.append(f'<path d="M{left + c * cw + 56} {top + 27}h36" stroke="#2c6a4a" stroke-width="7" stroke-linecap="round"/>')
    # Numbers: right-aligned dashes of varying length, as figures read from a distance
    for r in range(1, rows):
        y = top + r * rh + 27
        body.append(f'<path d="M20 {y}h20" stroke="#8d948a" stroke-width="5" stroke-linecap="round"/>')
        for c in range(cols):
            w = rng.randint(44, 104)
            end = left + (c + 1) * cw - 18
            body.append(f'<path d="M{end - w} {y}h{w}" stroke="#4e564c" stroke-width="6" stroke-linecap="round"/>')
    for r in range(rows + 1):
        body.append(f'<path d="M0 {top + r * rh}H1200" stroke="#cfd4cb" stroke-width="2"/>')
    for c in range(cols + 1):
        body.append(f'<path d="M{left + c * cw} {top}V800" stroke="#cfd4cb" stroke-width="2"/>')
    # The selected cell, with its fill handle
    sx, sy = left + 2 * cw, top + 5 * rh
    body.append(f'<rect x="{sx}" y="{sy}" width="{cw}" height="{rh}" fill="#1f6e4a" fill-opacity="0.1" stroke="#1f6e4a" stroke-width="5"/>')
    body.append(f'<rect x="{sx + cw - 7}" y="{sy + rh - 7}" width="14" height="14" fill="#1f6e4a" stroke="#fff" stroke-width="2"/>')
    # A small chart floating over the sheet, its bars climbing
    body.append('<rect x="704" y="214" width="440" height="430" rx="8" fill="#fff" stroke="#c6cbc2" stroke-width="3"/>')
    body.append('<path d="M744 262h170" stroke="#4e564c" stroke-width="8" stroke-linecap="round"/>')
    for i, h in enumerate((70, 112, 96, 158, 204, 262)):
        body.append(f'<rect x="{748 + i * 60}" y="{598 - h}" width="42" height="{h}" rx="3" fill="{"#1f6e4a" if i == 5 else "#7fb898"}"/>')
    body.append('<path d="M736 598h376" stroke="#6d756a" stroke-width="4"/>')
    return wrap("", body)

def ramanujan():
    """Srinivasa Ramanujan's slate: he worked in chalk, copying only results into his notebooks.
    A slate on a wooden table, covered in his formulas, with chalk and an open notebook beside it. A scene, no portrait."""
    defs = ('<linearGradient id="rtable" x1="0" y1="0" x2="1" y2="1">'
            '<stop offset="0" stop-color="#8a5e3a"/><stop offset="1" stop-color="#5f3e26"/></linearGradient>'
            '<linearGradient id="rslate" x1="0" y1="0" x2="1" y2="1">'
            '<stop offset="0" stop-color="#2f3638"/><stop offset="1" stop-color="#22282a"/></linearGradient>')
    body = ['<rect width="1200" height="800" fill="url(#rtable)"/>']
    for y in (130, 310, 505, 690):  # the table's grain
        body.append(f'<path d="M0 {y} C300 {y - 18} 800 {y + 20} 1200 {y - 6}" fill="none" stroke="#4e3320" stroke-width="3" opacity="0.5"/>')
    # The slate in its wooden frame
    body.append('<rect x="88" y="78" width="780" height="644" rx="10" fill="#2a1a10" opacity="0.35"/>')
    body.append('<rect x="70" y="60" width="780" height="644" rx="10" fill="#b98a58"/>')
    body.append('<rect x="96" y="86" width="728" height="592" rx="4" fill="url(#rslate)"/>')
    # Chalk smudges left by rubbing out with an elbow, as he did
    for x, y, rx, ry in ((300, 250, 170, 44), (620, 430, 150, 54), (260, 590, 130, 34)):
        body.append(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="#8d9698" opacity="0.1"/>')
    # His results, in chalk
    chalk = 'font-family="Georgia, \'Times New Roman\', serif" font-style="italic" fill="#eceae0"'
    lines = ((132, 178, 46, "1729 = 1³ + 12³ = 9³ + 10³"), (132, 270, 46, "p(5n + 4) ≡ 0  (mod 5)"),
             (132, 362, 46, "1 + 2 + 3 + 4 + ⋯ = −1/12"))
    for x, y, size, text in lines:
        body.append(f'<text x="{x}" y="{y}" font-size="{size}" {chalk}>{text}</text>')
    # The series for 1/π, set out with its long fraction bar
    body.append(f'<text x="132" y="520" font-size="40" {chalk}>1/π = (2√2/9801) Σ</text>')
    body.append('<path d="M500 507 H796" stroke="#eceae0" stroke-width="3.5" stroke-linecap="round"/>')
    body.append(f'<text x="506" y="486" font-size="30" {chalk}>(4k)! (1103 + 26390k)</text>')
    body.append(f'<text x="570" y="548" font-size="30" {chalk}>(k!)⁴ 396⁴ᵏ</text>')
    # A half-finished line, still being worked out
    body.append(f'<text x="132" y="638" font-size="40" {chalk} opacity="0.75">q = e^(−π√n) …</text>')
    # Stubs of chalk on the frame's edge and the table
    body.append('<rect x="640" y="618" width="86" height="20" rx="9" fill="#f4f1e6" transform="rotate(-14 683 628)"/>')
    body.append('<rect x="905" y="628" width="62" height="18" rx="8" fill="#f4f1e6" transform="rotate(24 936 637)"/>')
    # The open notebook, its pages holding the results that survived
    body.append('<path d="M900 150 L1040 132 L1040 560 L900 578 Z" fill="#f2e8d0"/>')
    body.append('<path d="M1040 132 L1160 160 L1160 586 L1040 560 Z" fill="#e6dbc0"/>')
    body.append('<path d="M1040 132 V560" stroke="#a8966f" stroke-width="3"/>')
    for i in range(10):
        y = 186 + i * 34
        body.append(f'<path d="M920 {y - i * 0.2:.1f} L{1020 - (i % 3) * 16} {y - 12:.1f}" stroke="#4a4436" stroke-width="3.5" stroke-linecap="round"/>')
        body.append(f'<path d="M1058 {y - 10:.1f} L{1142 - (i % 4) * 14} {y + 7:.1f}" stroke="#4a4436" stroke-width="3.5" stroke-linecap="round"/>')
    return wrap(defs, body)

def maps_earth():
    """Google Maps and Google Earth let anyone see anywhere: the whole globe in space, and a beam
    zooming from one spot on it down to a street map with a pin."""
    rng = random.Random(23)
    defs = ('<radialGradient id="eocean" cx="0.38" cy="0.32" r="0.8">'
            '<stop offset="0" stop-color="#3f8fc9"/><stop offset="0.65" stop-color="#1c5a93"/><stop offset="1" stop-color="#0c2f55"/></radialGradient>'
            '<radialGradient id="eglow" cx="0.5" cy="0.5" r="0.5">'
            '<stop offset="0.78" stop-color="#7cc0f0" stop-opacity="0.45"/><stop offset="1" stop-color="#7cc0f0" stop-opacity="0"/></radialGradient>'
            '<clipPath id="eball"><circle cx="340" cy="400" r="250"/></clipPath>'
            '<clipPath id="emap"><rect x="700" y="170" width="430" height="460" rx="14"/></clipPath>')
    body = ['<rect width="1200" height="800" fill="#080d1c"/>']
    for _ in range(130):
        x, y = rng.uniform(0, W), rng.uniform(0, H)
        body.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rng.uniform(0.8, 2.2):.1f}" fill="#f4f6f8" opacity="{rng.uniform(0.3, 0.9):.2f}"/>')
    # The globe, its land and clouds clipped to the sphere
    body.append('<circle cx="340" cy="400" r="292" fill="url(#eglow)"/>')
    body.append('<circle cx="340" cy="400" r="250" fill="url(#eocean)"/>')
    body.append('<g clip-path="url(#eball)">')
    land = "#5f9a58"
    body.append(f'<path d="M160 210 C220 170 310 180 350 225 C385 265 345 305 300 322 C275 335 268 375 240 372 C200 368 170 330 138 300 C118 270 130 232 160 210 Z" fill="{land}"/>')
    body.append(f'<path d="M285 395 C330 380 380 405 388 455 C396 510 360 590 322 628 C300 600 296 545 280 505 C266 465 258 415 285 395 Z" fill="{land}"/>')
    body.append(f'<path d="M455 250 C505 235 575 275 598 340 C615 395 590 455 548 462 C505 468 470 420 452 372 C438 330 425 268 455 250 Z" fill="#7a9a58"/>')
    for x, y, rx, ry in ((230, 250, 110, 13), (420, 330, 130, 12), (260, 470, 120, 12), (470, 540, 100, 11), (350, 180, 80, 10)):
        body.append(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="#f4f6f8" opacity="0.5"/>')
    body.append('</g>')
    # The beam: from a spot on the globe out to the map
    body.append('<path d="M498 360 L700 170 V630 Z" fill="#fff4c2" opacity="0.13"/>')
    body.append('<circle cx="498" cy="360" r="8" fill="#fff4c2"/>')
    # The map: blocks, a park, a river and streets
    body.append('<rect x="700" y="170" width="430" height="460" rx="14" fill="#efeadf"/>')
    body.append('<g clip-path="url(#emap)">')
    body.append('<path d="M840 170 h130 v120 h-130 Z" fill="#b9d8a8"/>')
    body.append('<path d="M1130 380 C1040 400 980 470 950 560 C940 590 930 615 925 640 H1000 C1010 590 1040 520 1130 480 Z" fill="#a4cfe8"/>')
    for x in (780, 860, 980, 1060):
        body.append(f'<path d="M{x} 170 V630" stroke="#fff" stroke-width="11"/>')
    for y in (240, 340, 430, 540):
        body.append(f'<path d="M700 {y} H1130" stroke="#fff" stroke-width="11"/>')
    body.append('<path d="M700 600 C790 540 840 460 900 390 C950 330 1040 300 1130 230" fill="none" stroke="#f0c75e" stroke-width="16"/>')
    # The route to the pin
    body.append('<path d="M780 540 V430 H860 V340" fill="none" stroke="#3f7fd9" stroke-width="9" stroke-linejoin="round"/>')
    body.append('<circle cx="780" cy="540" r="10" fill="#fff" stroke="#3f7fd9" stroke-width="5"/>')
    body.append('</g>')
    # The pin
    body.append('<path d="M860 340 C840 305 822 288 822 262 A38 38 0 01898 262 C898 288 880 305 860 340 Z" fill="#c8452f"/>')
    body.append('<circle cx="860" cy="262" r="13" fill="#fff"/>')
    return wrap(defs, body)

def grateful_garden():
    """The backdrop of Grateful for: a garden at dusk, with stars and a low moon, layered hills,
    dark trees framing it, a path winding up through the grass and a few fireflies. Kept dark
    through the middle, where the lanterns and their lines sit."""
    rng = random.Random(31)
    defs = ('<linearGradient id="gsky" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#141b3a"/><stop offset="0.55" stop-color="#2a2550"/>'
            '<stop offset="0.8" stop-color="#5a3560"/><stop offset="1" stop-color="#a65a55"/></linearGradient>'
            '<radialGradient id="gglow" cx="0.5" cy="0.5" r="0.5">'
            '<stop offset="0" stop-color="#ffd98a" stop-opacity="0.8"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>')
    body = ['<rect width="1200" height="800" fill="url(#gsky)"/>']
    for _ in range(120):
        x, y = rng.uniform(0, W), rng.uniform(0, 470)
        body.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rng.uniform(0.6, 1.8):.1f}" fill="#f4efdc" opacity="{rng.uniform(0.25, 0.85):.2f}"/>')
    body.append('<circle cx="1010" cy="96" r="30" fill="#f4e6bd" opacity="0.9"/><circle cx="1022" cy="88" r="27" fill="#1b2042"/>')  # a crescent moon
    # Hills, far to near
    body.append('<path d="M0 640 C160 590 330 610 520 640 C720 670 930 590 1200 625 V800 H0 Z" fill="#33284f"/>')
    body.append('<path d="M0 690 C220 640 420 680 620 700 C820 720 1010 660 1200 690 V800 H0 Z" fill="#231f3f"/>')
    body.append('<path d="M0 730 C260 700 480 725 700 735 C900 745 1060 715 1200 730 V800 H0 Z" fill="#181a30"/>')
    # The path, winding up through the grass and narrowing away
    body.append('<path d="M500 800 C560 770 690 760 670 738 C658 726 610 722 600 712 L622 712 C640 724 730 730 745 750 C762 772 720 790 700 800 Z" fill="#6d5a70" opacity="0.8"/>')
    # Trees framing the garden on both sides
    for cx, base, r in ((46, 760, 112), (170, 780, 80), (1156, 760, 118), (1040, 785, 78)):
        body.append(f'<rect x="{cx - 8}" y="{base - r}" width="16" height="{r + 40}" fill="#0f1024"/>')
        for dx, dy, s in ((0, -r * 1.25, 1), (-r * 0.55, -r * 0.8, 0.8), (r * 0.55, -r * 0.8, 0.8), (0, -r * 0.55, 0.9)):
            body.append(f'<circle cx="{cx + dx:.1f}" cy="{base + dy:.1f}" r="{r * 0.72 * s:.1f}" fill="#101226"/>')
    # Grass tufts along the front, and fireflies low in the garden
    for _ in range(70):
        x, y = rng.uniform(0, W), rng.uniform(748, 796)
        h = rng.uniform(8, 18)
        body.append(f'<path d="M{x:.1f} {y:.1f} q{rng.uniform(-4, 4):.1f} {-h / 2:.1f} {rng.uniform(-5, 5):.1f} {-h:.1f}" fill="none" stroke="#2e3a48" stroke-width="2"/>')
    for x, y in ((240, 665), (330, 720), (455, 690), (800, 705), (905, 670), (985, 725), (130, 705), (1095, 690)):
        body.append(f'<circle cx="{x}" cy="{y}" r="14" fill="url(#gglow)"/><circle cx="{x}" cy="{y}" r="2.2" fill="#fff0b8"/>')
    return wrap(defs, body)

def waymo():
    """Waymo puts safety and reliability first: a white driverless car with its roof sensor, stopped at a
    crosswalk at dusk while someone crosses, the sensor's rings sweeping around it."""
    rng = random.Random(41)
    defs = ('<linearGradient id="wsky" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#27406f"/><stop offset="0.7" stop-color="#d98f73"/><stop offset="1" stop-color="#f4c79a"/></linearGradient>'
            '<linearGradient id="wbody" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cdd3da"/></linearGradient>'
            '<radialGradient id="wbeam" cx="0" cy="0.5" r="1">'
            '<stop offset="0" stop-color="#fff2c4" stop-opacity="0.55"/><stop offset="1" stop-color="#fff2c4" stop-opacity="0"/></radialGradient>')
    body = [f'<rect width="{W}" height="{H}" fill="url(#wsky)"/>']
    # A row of San Francisco houses stepping up a hill, windows lit
    x, top = -20, 330
    while x < W + 20:
        w, h = rng.randint(96, 136), rng.randint(0, 34)
        col = rng.choice(("#54506a", "#6b5a68", "#4a5670", "#7a6468", "#5d6578"))
        body.append(f'<rect x="{x}" y="{top - h}" width="{w}" height="{520 - top + h}" fill="{col}"/>')
        body.append(f'<rect x="{x - 3}" y="{top - h - 9}" width="{w + 6}" height="10" fill="#39384a"/>')
        for wy in range(top - h + 16, 480, 52):
            for wx in range(x + 14, x + w - 24, 34):
                lit = rng.random() < 0.5
                body.append(f'<rect x="{wx}" y="{wy}" width="20" height="32" fill="{"#ffd98e" if lit else "#34384c"}"/>')
        x, top = x + w, top - rng.randint(4, 12)
    # The pavement and the road
    body.append(f'<rect y="505" width="{W}" height="30" fill="#8b8a8c"/>')
    body.append(f'<rect y="535" width="{W}" height="265" fill="#3a3d45"/>')
    body.append(f'<rect y="535" width="{W}" height="6" fill="#6d6e72"/>')
    # The crosswalk ahead of the car, in perspective
    for i in range(6):
        y0, y1 = 556 + i * 40, 556 + i * 40 + 22
        body.append(f'<polygon points="{880 - i * 7},{y0} {1085 + i * 7},{y0} {1085 + i * 8},{y1} {880 - i * 8},{y1}" fill="#ecebe4"/>')
    # The sensor's rings, sweeping out around the car
    for r, op in ((180, 0.42), (290, 0.28), (410, 0.18), (540, 0.1)):
        body.append(f'<ellipse cx="430" cy="640" rx="{r * 1.3:.0f}" ry="{r * 0.34:.0f}" fill="none" stroke="#7fe0d4" stroke-width="3" opacity="{op}"/>')
    # Headlight on the crosswalk
    body.append('<path d="M760 610 L1140 540 V760 Z" fill="url(#wbeam)"/>')
    # The car: a rounded white electric SUV, side on, facing right
    body.append('<ellipse cx="465" cy="712" rx="345" ry="24" fill="#16181d" opacity="0.5"/>')
    body.append('<path d="M130 690 C118 640 128 590 172 572 L300 548 C352 498 412 462 492 458 C572 454 626 480 684 548 L760 568 C800 582 812 626 804 690 Z" fill="url(#wbody)"/>')
    body.append('<path d="M318 548 C360 506 414 480 480 478 V548 Z" fill="#26303d"/>')
    body.append('<path d="M498 478 C560 476 606 498 652 548 H498 Z" fill="#26303d"/>')
    body.append('<path d="M130 640 H804" stroke="#b3bac3" stroke-width="3"/>')
    body.append('<path d="M488 480 V688" stroke="#b3bac3" stroke-width="3"/>')
    body.append('<rect x="520" y="572" width="44" height="9" rx="4" fill="#9aa3ad"/><rect x="330" y="572" width="44" height="9" rx="4" fill="#9aa3ad"/>')
    body.append('<path d="M770 586 C790 590 802 604 804 622 L772 616 Z" fill="#fff2c4"/>')
    body.append('<path d="M132 600 L160 592 V628 L130 632 Z" fill="#c8452f"/>')
    for cx in (262, 672):
        body.append(f'<circle cx="{cx}" cy="690" r="58" fill="#1b1d22"/><circle cx="{cx}" cy="690" r="33" fill="#aeb4bc"/><circle cx="{cx}" cy="690" r="10" fill="#555b64"/>')
    # The sensor dome on the roof, and small sensors at the front and on the mirror
    body.append('<rect x="462" y="438" width="62" height="24" rx="6" fill="#e9edf1"/>')
    body.append('<rect x="472" y="396" width="42" height="44" rx="12" fill="#22303c"/>')
    body.append('<rect x="466" y="388" width="54" height="12" rx="6" fill="#f4f6f8"/>')
    body.append('<circle cx="493" cy="418" r="8" fill="#7fe0d4"/>')
    body.append('<rect x="790" y="640" width="18" height="26" rx="5" fill="#22303c"/>')
    # Someone crossing with a dog, safely in front of the stopped car
    px, py = 985, 660
    body.append(f'<ellipse cx="{px}" cy="{py + 8}" rx="38" ry="8" fill="#16181d" opacity="0.45"/>')
    body.append(f'<path d="M{px - 12} {py} L{px - 22} {py - 70} H{px + 18} L{px + 14} {py} H{px + 2} L{px} {py - 46} L{px - 2} {py} Z" fill="#26334a"/>')
    body.append(f'<rect x="{px - 25}" y="{py - 142}" width="48" height="78" rx="16" fill="#c8583f"/>')
    body.append(f'<circle cx="{px}" cy="{py - 164}" r="21" fill="{SKIN}"/>')
    body.append(f'<path d="M{px - 21} {py - 168} A21 21 0 0 1 {px + 21} {py - 168} Z" fill="{HAIR}"/>')
    body.append(f'<path d="M{px + 16} {py - 124} L{px + 44} {py - 84}" stroke="#c8583f" stroke-width="13" stroke-linecap="round"/>')
    body.append(f'<path d="M{px + 44} {py - 84} C{px + 62} {py - 62} {px + 72} {py - 52} {px + 80} {py - 36}" fill="none" stroke="#2a2a2a" stroke-width="2.5"/>')
    body.append(f'<rect x="{px + 62}" y="{py - 34}" width="52" height="22" rx="10" fill="#b98a56"/>')
    body.append(f'<circle cx="{px + 112}" cy="{py - 40}" r="14" fill="#b98a56"/><path d="M{px + 118} {py - 52} l9 -8 l2 13 Z" fill="#8b6438"/>')
    for dx in (68, 78, 98, 108):
        body.append(f'<rect x="{px + dx}" y="{py - 16}" width="6" height="22" fill="#a57a48"/>')
    return wrap(defs, body)

def zimmer():
    """Hans Zimmer draws you into his world: alone at a great pipe organ in the dark, the pipes rising either
    side and parting on a black hole ringed with light, the sound spreading out into it."""
    rng = random.Random(2014)
    defs = ('<radialGradient id="zspace" cx="0.5" cy="0.36" r="0.75">'
            '<stop offset="0" stop-color="#3c2a4d"/><stop offset="0.5" stop-color="#150f28"/><stop offset="1" stop-color="#05060d"/></radialGradient>'
            '<linearGradient id="zpipe" x1="0" y1="0" x2="1" y2="0">'
            '<stop offset="0" stop-color="#4e4a4c"/><stop offset="0.38" stop-color="#d9c7a0"/><stop offset="0.55" stop-color="#f6e7c4"/><stop offset="1" stop-color="#5b4f44"/></linearGradient>'
            '<linearGradient id="zdisk" x1="0" y1="0" x2="1" y2="0">'
            '<stop offset="0" stop-color="#ff8a3c" stop-opacity="0"/><stop offset="0.2" stop-color="#ffb35c"/><stop offset="0.5" stop-color="#fff3cf"/>'
            '<stop offset="0.8" stop-color="#ffb35c"/><stop offset="1" stop-color="#ff8a3c" stop-opacity="0"/></linearGradient>'
            '<radialGradient id="zhalo" cx="0.5" cy="0.5" r="0.5">'
            '<stop offset="0.3" stop-color="#ffc98a" stop-opacity="0.65"/><stop offset="1" stop-color="#ffc98a" stop-opacity="0"/></radialGradient>'
            '<radialGradient id="zlamp" cx="0.5" cy="0.5" r="0.5">'
            '<stop offset="0" stop-color="#ffd596" stop-opacity="0.9"/><stop offset="1" stop-color="#ffd596" stop-opacity="0"/></radialGradient>')
    body = [f'<rect width="{W}" height="{H}" fill="url(#zspace)"/>']
    for _ in range(190):
        x, y = rng.uniform(0, W), rng.uniform(0, 560)
        body.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{rng.uniform(0.7, 2.2):.1f}" fill="#fff6dc" opacity="{rng.uniform(0.3, 0.95):.2f}"/>')
    # The black hole: a halo, the disk passing in front, and its light bent up over the top
    cx, cy, r = 600, 262, 118
    body.append(f'<circle cx="{cx}" cy="{cy}" r="{r * 2.6:.0f}" fill="url(#zhalo)"/>')
    body.append(f'<circle cx="{cx}" cy="{cy}" r="{r + 15}" fill="none" stroke="#ffdca6" stroke-width="13"/>')
    body.append(f'<circle cx="{cx}" cy="{cy}" r="{r + 3}" fill="none" stroke="#fff6df" stroke-width="5"/>')
    body.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#020204"/>')
    body.append(f'<ellipse cx="{cx}" cy="{cy + 6}" rx="330" ry="23" fill="url(#zdisk)"/>')
    body.append(f'<ellipse cx="{cx}" cy="{cy + 6}" rx="245" ry="9" fill="#fffdf0" opacity="0.8"/>')
    # The sound, spreading out from the console in faint arcs
    for k in range(1, 7):
        rx = 110 + k * 92
        body.append(f'<path d="M{600 - rx} 640 A{rx} {rx * 0.72:.0f} 0 0 1 {600 + rx} 640" fill="none" stroke="#ffe3b0" stroke-width="2.5" opacity="{0.5 - k * 0.06:.2f}"/>')
    # The pipes: ranks climbing toward the edges, leaving the middle open on the sky
    for side in (-1, 1):
        for rank, (y0, shade) in enumerate(((610, 0.62), (640, 1.0))):
            for i in range(11):
                w = 48 - i * 1.6 if rank else 40 - i
                x = 600 + side * (292 + i * (w + 5) + rank * 12)
                top = 345 - i * 34 - rank * -46 + (i % 2) * 18
                left = x - w / 2
                body.append(f'<rect x="{left:.0f}" y="{top}" width="{w:.0f}" height="{y0 - top}" fill="url(#zpipe)" opacity="{shade}"/>')
                body.append(f'<path d="M{left:.0f} {top} a{w / 2:.0f} {w / 5:.0f} 0 0 1 {w:.0f} 0" fill="#f6e7c4" opacity="{shade}"/>')
                mouth = y0 - 74
                body.append(f'<path d="M{left + 3:.0f} {mouth} h{w - 6:.0f} l-{(w - 6) / 2:.0f} -18 Z" fill="#1a1512" opacity="{shade}"/>')
    # The case the pipes stand in, and the floor
    body.append(f'<rect y="630" width="{W}" height="170" fill="#120c09"/>')
    body.append(f'<rect y="630" width="{W}" height="9" fill="#5c3f26"/>')
    # The console, lit by one lamp: three banks of keys, side on
    body.append('<ellipse cx="620" cy="600" rx="290" ry="165" fill="url(#zlamp)" opacity="0.55"/>')
    body.append('<path d="M640 740 V520 Q640 500 660 500 H830 Q850 500 850 520 V740 Z" fill="#3a2415"/>')
    body.append('<rect x="650" y="514" width="190" height="56" rx="4" fill="#efe7d3"/>')
    for y in (526, 538, 550, 560):
        body.append(f'<path d="M662 {y} H828" stroke="#6d6250" stroke-width="1.5"/>')
    for i, y in enumerate((588, 612, 636)):
        body.append(f'<rect x="{596 - i * 12}" y="{y}" width="{62 + i * 12}" height="15" rx="2" fill="#f4efe2"/>')
        body.append(f'<rect x="{596 - i * 12}" y="{y + 15}" width="{62 + i * 12}" height="6" fill="#16100c"/>')
    body.append('<rect x="812" y="430" width="8" height="72" fill="#7c5b34"/>')
    body.append('<path d="M780 432 H852 L838 404 H794 Z" fill="#d9a441"/>')
    # Him, side on at the bench: dark shirt, longish grey hair, leaning in with his hands on the keys
    body.append('<rect x="372" y="668" width="184" height="24" rx="6" fill="#4a2e1a"/>')
    for x in (386, 528):
        body.append(f'<rect x="{x}" y="690" width="14" height="60" fill="#2a1a0f"/>')
    body.append('<path d="M440 662 C480 650 540 654 564 670 L588 742 H558 L534 690 C498 690 462 690 438 688 Z" fill="#14151c"/>')
    body.append('<path d="M410 672 C402 610 426 530 488 516 C532 512 552 546 540 588 L508 672 Z" fill="#1d1f29"/>')
    body.append('<path d="M500 556 C530 572 560 586 600 594" fill="none" stroke="#1d1f29" stroke-width="29" stroke-linecap="round"/>')
    body.append(f'<circle cx="606" cy="596" r="12" fill="{SKIN}"/>')
    body.append(f'<rect x="490" y="490" width="28" height="36" fill="{SKIN_SHADE}" transform="rotate(14 504 508)"/>')
    body.append(f'<circle cx="518" cy="462" r="38" fill="{SKIN}"/>')
    body.append('<path d="M550 470 l12 8 -13 5 Z" fill="#c08a66"/>')
    body.append('<path d="M478 476 C466 416 530 402 556 442 C530 436 516 446 510 470 C508 492 498 514 484 516 C474 510 476 490 478 476 Z" fill="#c9c6c0"/>')
    return wrap(defs, body)


def nolan():
    """Chris Nolan uses life to inspire art: a city street bending up and folding over itself, a director and a
    film camera in the foreground, and a spinning top still going on the ground beside them."""
    rng = random.Random(2010)
    vx, vy, ground = 600, 395, 330
    defs = ('<linearGradient id="nsky" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#4d6072"/><stop offset="0.5" stop-color="#f6e6c9"/><stop offset="1" stop-color="#4d6072"/></linearGradient>'
            '<linearGradient id="nroad" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#b9b3a6"/><stop offset="0.3" stop-color="#6c6c6e"/><stop offset="1" stop-color="#2d2f35"/></linearGradient>'
            '<linearGradient id="ntop" x1="0" y1="0" x2="1" y2="0">'
            '<stop offset="0" stop-color="#7c5a22"/><stop offset="0.45" stop-color="#f3d27c"/><stop offset="1" stop-color="#8d6527"/></linearGradient>')
    def lean(x, height, d):
        s = 1 / d
        return (vx + x * s, vy + (ground - height) * s)
    def side(sign):
        """One side of the street, drawn far to near so nearer buildings overlap."""
        out = []
        d = 9.0
        while d > 0.9:
            d2 = max(d * rng.uniform(0.62, 0.74), 0.86)
            height = rng.uniform(170, 318)
            x0 = 300 * sign
            wall = rng.choice(("#a79a86", "#8f8778", "#b5a78e", "#7f7a72", "#9b8c7c", "#c2b49b"))
            haze = min(0.85, 0.12 + d / 12)
            far_bottom, near_bottom = lean(x0, 0, d), lean(x0, 0, d2)
            far_top, near_top = lean(x0, height, d), lean(x0, height, d2)
            out.append(f'<polygon points="{pts([far_bottom, near_bottom, near_top, far_top])}" fill="{wall}"/>')
            windows = {True: [], False: []}  # lit and dark, each drawn as one path to keep the file small
            # The facade facing the viewer's way, out to the edge of the frame
            edge = -60 if sign < 0 else W + 60
            out.append(f'<polygon points="{pts([near_bottom, (edge, near_bottom[1]), (edge, near_top[1]), near_top])}" fill="{wall}"/>')
            for row in range(1, 5):
                h0, h1 = height * row / 5.2, height * (row + 0.55) / 5.2
                for col in range(6):
                    t0, t1 = (col + 0.2) / 6, (col + 0.72) / 6
                    i0, i1 = 1 / d + (1 / d2 - 1 / d) * t0, 1 / d + (1 / d2 - 1 / d) * t1
                    a, b, c, e = lean(x0, h0, 1 / i0), lean(x0, h0, 1 / i1), lean(x0, h1, 1 / i1), lean(x0, h1, 1 / i0)
                    lit = rng.random() < 0.3
                    windows[lit].append("M" + "L".join(f"{x:.0f} {y:.0f}" for x, y in (a, b, c, e)) + "Z")
                y = near_bottom[1] + (near_top[1] - near_bottom[1]) * (row + 0.1) / 5.2
                y2 = near_bottom[1] + (near_top[1] - near_bottom[1]) * (row + 0.65) / 5.2
                x = near_bottom[0] + sign * 18
                while (x < edge - 20) if sign > 0 else (x > edge + 20):
                    lit = rng.random() < 0.3
                    w = 24 / d2
                    bx = x if sign > 0 else x - w
                    windows[lit].append(f"M{bx:.0f} {min(y, y2):.0f}h{w:.0f}v{abs(y2 - y):.0f}h{-w:.0f}Z")
                    x += sign * 46 / d2
            for lit, colour in ((False, "#3a3f49"), (True, "#ffd98e")):
                out.append(f'<path d="{"".join(windows[lit])}" fill="{colour}"/>')
            out.append(f'<polygon points="{pts([far_bottom, near_bottom, near_top, far_top])}" fill="#f6e6c9" opacity="{haze * 0.55:.2f}"/>')
            d = d2
        return "".join(out)
    road = [(vx, vy), lean(320, 0, 0.72), lean(-320, 0, 0.72)]
    street = f'<polygon points="{pts(road)}" fill="url(#nroad)"/>'
    for k in range(9):
        d0 = 7 * 0.72 ** k
        a, b = lean(-5, 0, d0), lean(5, 0, d0)
        c, e = lean(5, 0, d0 * 0.86), lean(-5, 0, d0 * 0.86)
        street += f'<polygon points="{pts([a, b, c, e])}" fill="#ece6d6" opacity="0.8"/>'
    half = street + side(-1) + side(1)
    body = [f'<rect width="{W}" height="{H}" fill="url(#nsky)"/>']
    # The same city folded over: the street above is this street, mirrored about the horizon
    body.append(f'<g transform="translate(0,{2 * vy}) scale(1,-1)" opacity="0.92">{half}</g>')
    body.append(half)
    body.append(f'<ellipse cx="{vx}" cy="{vy}" rx="170" ry="32" fill="#fff4dc" opacity="0.8"/>')
    # The spinning top, on the road in front: a little gold cone, its blur and its shadow
    tx, ty = 900, 742
    body.append(f'<ellipse cx="{tx}" cy="{ty + 4}" rx="56" ry="10" fill="#101114" opacity="0.55"/>')
    body.append(f'<path d="M{tx} {ty} L{tx - 40} {ty - 58} A40 13 0 0 1 {tx + 40} {ty - 58} Z" fill="url(#ntop)" transform="rotate(6 {tx} {ty})"/>')
    body.append(f'<rect x="{tx + 2}" y="{ty - 96}" width="7" height="30" rx="3" fill="#a87d33" transform="rotate(6 {tx} {ty})"/>')
    for r, op in ((52, 0.55), (64, 0.35), (78, 0.2)):
        body.append(f'<path d="M{tx - r} {ty - 60} A{r} {r * 0.3:.0f} 0 0 0 {tx + r} {ty - 60}" fill="none" stroke="#f3d27c" stroke-width="3" opacity="{op}" transform="rotate(6 {tx} {ty})"/>')
    # The director and his camera, dark against all of it, at the left of the frame
    cam, base = 410, 800
    for dx in (-78, 6, 84):
        body.append(f'<path d="M{cam} 572 L{cam + dx} {base}" stroke="#0d0e12" stroke-width="11"/>')
    body.append(f'<rect x="{cam - 80}" y="492" width="166" height="88" rx="8" fill="#0f1014"/>')
    for ox in (-34, 40):
        body.append(f'<circle cx="{cam + ox}" cy="452" r="42" fill="#17181d"/><circle cx="{cam + ox}" cy="452" r="12" fill="#5e6068"/>')
    body.append(f'<rect x="{cam + 84}" y="512" width="72" height="46" rx="4" fill="#1b1c22"/>')
    body.append(f'<rect x="{cam + 150}" y="500" width="24" height="70" rx="5" fill="#0d0e12"/>')
    body.append(f'<ellipse cx="{cam + 170}" cy="535" rx="7" ry="28" fill="#6fa6c8"/>')
    px = 205
    body.append(f'<path d="M{px - 62} 800 L{px - 72} 500 C{px - 74} 410 {px - 42} 368 {px} 366 C{px + 44} 368 {px + 74} 410 {px + 72} 500 L{px + 62} 800 Z" fill="#0d0e12"/>')
    body.append(f'<path d="M{px - 8} 372 L{px + 8} 440 L{px + 24} 372 Z" fill="#d8d6cf"/>')
    body.append(f'<path d="M{px + 60} 420 C{px + 92} 462 {px + 120} 490 {px + 142} 504" fill="none" stroke="#0d0e12" stroke-width="30" stroke-linecap="round"/>')
    body.append(f'<rect x="{px - 14}" y="330" width="34" height="46" fill="{SKIN_SHADE}"/>')
    body.append(f'<circle cx="{px + 8}" cy="300" r="42" fill="{SKIN}"/>')
    body.append(f'<path d="M{px + 46} 304 l14 9 -15 4 Z" fill="{SKIN_SHADE}"/>')
    body.append(f'<path d="M{px - 36} 322 C{px - 58} 256 {px + 16} 232 {px + 54} 276 C{px + 26} 268 {px + 8} 280 {px - 4} 298 C{px - 12} 316 {px - 22} 332 {px - 36} 322 Z" fill="#b89f73"/>')
    return wrap(defs, body)

def finn():
    """Chelsea Finn helped machines learn how to learn: a robot arm in a bright lab, shown a task once (the faint
    dotted path) and managing it on a new object, with the earlier tries set aside along the bench."""
    defs = ('<linearGradient id="fwall" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#eef2f5"/><stop offset="1" stop-color="#d5dde3"/></linearGradient>'
            '<linearGradient id="fbench" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#b98f63"/><stop offset="1" stop-color="#7f5c3d"/></linearGradient>'
            '<linearGradient id="farm" x1="0" y1="0" x2="1" y2="1">'
            '<stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#b9c3cc"/></linearGradient>'
            '<radialGradient id="flight" cx="0.5" cy="0.5" r="0.5">'
            '<stop offset="0" stop-color="#fff8e6" stop-opacity="0.9"/><stop offset="1" stop-color="#fff8e6" stop-opacity="0"/></radialGradient>')
    body = [f'<rect width="{W}" height="{H}" fill="url(#fwall)"/>']
    # A window of daylight, and a whiteboard with an inner and an outer loop on it
    body.append('<rect x="60" y="60" width="300" height="290" rx="6" fill="#bcdcf2"/><path d="M210 60v290M60 205h300" stroke="#f4f6f8" stroke-width="10"/>')
    body.append('<ellipse cx="210" cy="205" rx="330" ry="310" fill="url(#flight)" opacity="0.5"/>')
    body.append('<rect x="760" y="70" width="380" height="250" rx="6" fill="#fbfcfd" stroke="#aeb7bf" stroke-width="5"/>')
    body.append('<circle cx="880" cy="190" r="74" fill="none" stroke="#3f7fd9" stroke-width="5"/>')
    body.append('<path d="M954 186 l-12 16 M954 186 l15 13" stroke="#3f7fd9" stroke-width="5" fill="none" stroke-linecap="round"/>')
    body.append('<circle cx="880" cy="190" r="34" fill="none" stroke="#c8452f" stroke-width="5"/>')
    body.append('<path d="M914 188 l-9 11 M914 188 l11 9" stroke="#c8452f" stroke-width="4" fill="none" stroke-linecap="round"/>')
    for y, w in ((130, 120), (170, 90), (210, 130), (250, 70)):
        body.append(f'<path d="M985 {y} h{w}" stroke="#8d97a0" stroke-width="5" stroke-linecap="round"/>')
    # The bench
    body.append(f'<rect y="560" width="{W}" height="240" fill="url(#fbench)"/>')
    body.append(f'<rect y="552" width="{W}" height="14" fill="#d3ad80"/>')
    # Objects from earlier tasks, set aside
    for x, col in ((110, "#d9a441"), (190, "#6fa58a"), (270, "#c8583f")):
        body.append(f'<rect x="{x - 28}" y="498" width="56" height="58" rx="6" fill="{col}"/><rect x="{x - 28}" y="498" width="56" height="12" rx="4" fill="#ffffff" opacity="0.3"/>')
    # The task: the mug goes on the coaster. A dotted path shows the one demonstration
    body.append('<ellipse cx="1000" cy="596" rx="82" ry="20" fill="#2e6fa8"/><ellipse cx="1000" cy="592" rx="82" ry="20" fill="#3f8ac9"/>')
    body.append('<path d="M1000 588 C960 380 760 340 660 480" fill="none" stroke="#3f7fd9" stroke-width="5" stroke-dasharray="4 16" stroke-linecap="round"/>')
    # The arm: base, shoulder, elbow, wrist, gripper, holding the new mug
    body.append('<ellipse cx="500" cy="640" rx="130" ry="26" fill="#5a3f28" opacity="0.5"/>')
    body.append('<path d="M410 636 L430 556 H570 L590 636 Z" fill="#39424d"/>')
    body.append('<rect x="455" y="470" width="90" height="100" rx="26" fill="url(#farm)" stroke="#8d97a0" stroke-width="3"/>')
    body.append('<path d="M500 498 L392 278" stroke="#8d97a0" stroke-width="76" stroke-linecap="round"/><path d="M500 498 L392 278" stroke="#eef2f5" stroke-width="68" stroke-linecap="round"/>')
    body.append('<circle cx="500" cy="498" r="42" fill="#39424d"/><circle cx="500" cy="498" r="18" fill="#7fe0d4"/>')
    body.append('<path d="M392 278 L690 330" stroke="#8d97a0" stroke-width="62" stroke-linecap="round"/><path d="M392 278 L690 330" stroke="#ffffff" stroke-width="54" stroke-linecap="round"/>')
    body.append('<circle cx="392" cy="278" r="38" fill="#39424d"/><circle cx="392" cy="278" r="16" fill="#7fe0d4"/>')
    body.append('<circle cx="690" cy="330" r="30" fill="#39424d"/><circle cx="690" cy="330" r="12" fill="#7fe0d4"/>')
    body.append('<rect x="662" y="346" width="56" height="60" rx="8" fill="#d7dde3" stroke="#8d97a0" stroke-width="3"/>')
    body.append('<rect x="646" y="400" width="88" height="20" rx="5" fill="#39424d"/>')
    body.append('<path d="M650 420 V486 h14 V432 Z" fill="#39424d"/><path d="M730 420 V486 h-14 V432 Z" fill="#39424d"/>')
    body.append('<rect x="664" y="430" width="52" height="66" rx="5" fill="#c8452f"/><rect x="664" y="430" width="52" height="10" rx="4" fill="#e7694f"/>')
    body.append('<path d="M716 444 h12 a12 12 0 0 1 0 28 h-12" fill="none" stroke="#c8452f" stroke-width="7"/>')
    return wrap(defs, body)


def kalanithi():
    """Paul Kalanithi asked what makes a life worth living, and kept writing: a desk by a window at dusk, an open
    notebook with the page half written, a stethoscope set down beside it and the hospital lit up outside."""
    rng = random.Random(1977)
    defs = ('<linearGradient id="kdusk" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#2c3a68"/><stop offset="0.55" stop-color="#b76f7c"/><stop offset="1" stop-color="#f4bd8d"/></linearGradient>'
            '<linearGradient id="kdesk" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#6d452a"/><stop offset="1" stop-color="#37220f"/></linearGradient>'
            '<radialGradient id="klamp" cx="0.5" cy="0.5" r="0.5">'
            '<stop offset="0" stop-color="#ffe0a3" stop-opacity="0.95"/><stop offset="1" stop-color="#ffe0a3" stop-opacity="0"/></radialGradient>')
    body = [f'<rect width="{W}" height="{H}" fill="#2a2029"/>']
    # The window, dusk outside, the hospital's lit floors, and a low sun's last light
    body.append('<rect x="170" y="44" width="860" height="440" rx="4" fill="url(#kdusk)"/>')
    body.append('<circle cx="330" cy="400" r="46" fill="#ffe2ae" opacity="0.9"/>')
    body.append('<path d="M170 430 C320 392 430 420 540 398 C670 372 840 410 1030 382 V484 H170 Z" fill="#40364f"/>')
    body.append('<rect x="620" y="210" width="290" height="274" fill="#3a3550"/><rect x="705" y="165" width="120" height="50" fill="#3a3550"/>')
    for y in range(226, 470, 28):
        for x in range(634, 896, 28):
            body.append(f'<rect x="{x}" y="{y}" width="16" height="17" fill="{"#ffdf9b" if rng.random() < 0.55 else "#2a2840"}"/>')
    body.append('<path d="M600 44v440M170 200h860" stroke="#20181f" stroke-width="16"/>')
    body.append('<rect x="170" y="44" width="860" height="440" rx="4" fill="none" stroke="#20181f" stroke-width="20"/>')
    # The desk, with lamplight pooled on it
    body.append(f'<rect y="500" width="{W}" height="300" fill="url(#kdesk)"/>')
    body.append(f'<rect y="492" width="{W}" height="14" fill="#8a5c3a"/>')
    body.append('<ellipse cx="610" cy="620" rx="620" ry="220" fill="url(#klamp)" opacity="0.65"/>')
    # The lamp
    body.append('<ellipse cx="1010" cy="580" rx="72" ry="16" fill="#1f160e"/>')
    body.append('<path d="M1010 576 C1010 470 1020 380 960 338" fill="none" stroke="#2b2118" stroke-width="10"/>')
    body.append('<path d="M892 362 L990 306 L1022 362 L948 410 Z" fill="#2f5d50"/>')
    body.append('<path d="M916 400 L948 410 L1022 362 L1010 348" fill="#ffe7b0" opacity="0.8"/>')
    # A small stack of books, and a mug
    for i, (w, col) in enumerate(((210, "#a0523d"), (186, "#3f6a78"), (160, "#cfb074"))):
        body.append(f'<rect x="{98 + i * 8}" y="{566 - i * 32}" width="{w}" height="30" rx="3" fill="{col}"/><path d="M{114 + i * 8} {581 - i * 32} h{w - 50}" stroke="#f4ecd9" stroke-width="2" opacity="0.5"/>')
    body.append('<rect x="172" y="442" width="72" height="62" rx="7" fill="#efe7d6"/><path d="M244 456 h13 a13 13 0 0 1 0 28 h-13" fill="none" stroke="#efe7d6" stroke-width="7"/>')
    # The notebook, open, the left page full and the right page half written, a pen resting on it
    body.append('<path d="M360 730 L420 560 L602 548 L606 742 Z" fill="#fbf5e6"/>')
    body.append('<path d="M852 730 L796 560 L614 548 L606 742 Z" fill="#fff9ec"/>')
    body.append('<path d="M360 730 L606 742 L852 730 L858 744 L606 758 L354 744 Z" fill="#6b3d2a"/>')
    body.append('<path d="M606 546 V744" stroke="#cfc4aa" stroke-width="3"/>')
    for i in range(9):
        y0, y1 = 580 + i * 17, 572 + i * 18
        x0 = 416 - i * 6
        body.append(f'<path d="M{x0} {y0} C{x0 + 50} {y0 - 5} {x0 + 110} {y0 + 3} {586} {y1 + 3}" fill="none" stroke="#45505e" stroke-width="2.4" opacity="0.8"/>')
    for i in range(5):
        y = 572 + i * 18
        x1 = 790 + i * 6 - (150 if i == 4 else 0)
        body.append(f'<path d="M628 {y} C680 {y - 4} 730 {y + 4} {x1} {y + 6}" fill="none" stroke="#45505e" stroke-width="2.4" opacity="0.8"/>')
    body.append('<path d="M700 672 L790 616" stroke="#20242c" stroke-width="10" stroke-linecap="round"/><path d="M700 672 l-12 9 3 -15 Z" fill="#c6a65c"/>')
    # The stethoscope, set down for now
    body.append('<path d="M900 700 C950 670 1000 700 1030 690 C1100 668 1100 610 1050 610 C1000 610 960 640 930 620" fill="none" stroke="#14161a" stroke-width="9" stroke-linecap="round"/>')
    body.append('<circle cx="895" cy="704" r="24" fill="#b7bcc3"/><circle cx="895" cy="704" r="13" fill="#6d7278"/>')
    body.append('<path d="M930 620 l-28 -18 M930 620 l-10 -32" stroke="#b7bcc3" stroke-width="7" stroke-linecap="round"/>')
    return wrap(defs, body)

def langer():
    """Robert Langer brought engineering into medicine: a lab bench with a tiny
    drug-delivery chip under a magnifier with its wells opening one by one, beside polymer beads and a petri dish."""
    rng = random.Random(1948)
    defs = ('<linearGradient id="lwall" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#e9eef2"/><stop offset="1" stop-color="#d3dce3"/></linearGradient>'
            '<linearGradient id="lbench" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#3c4a57"/><stop offset="1" stop-color="#26313b"/></linearGradient>'
            '<radialGradient id="llens" cx="0.4" cy="0.35" r="0.7">'
            '<stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/><stop offset="1" stop-color="#cfe6f3" stop-opacity="0.15"/></radialGradient>'
            '<clipPath id="lclip"><circle cx="660" cy="410" r="210"/></clipPath>')
    body = [f'<rect width="{W}" height="{H}" fill="url(#lwall)"/>']
    # Shelves of glassware behind
    for y in (120, 250):
        body.append(f'<rect x="60" y="{y + 70}" width="1080" height="10" fill="#aeb9c3"/>')
        x = 80
        while x < 1120:
            w, h = rng.randint(30, 60), rng.randint(40, 70)
            col = rng.choice(("#b9dcef", "#cfe8d6", "#f1d9b5", "#e3d3ef"))
            body.append(f'<rect x="{x}" y="{y + 70 - h}" width="{w}" height="{h}" rx="6" fill="{col}" opacity="0.85"/>')
            body.append(f'<rect x="{x + w * 0.3:.0f}" y="{y + 70 - h - 14}" width="{w * 0.4:.0f}" height="16" fill="{col}" opacity="0.85"/>')
            x += w + rng.randint(14, 40)
    # The bench
    body.append(f'<rect y="560" width="{W}" height="240" fill="url(#lbench)"/>')
    body.append(f'<rect y="552" width="{W}" height="14" fill="#5b6b79"/>')
    # A petri dish of polymer beads, and a few loose beads
    body.append('<ellipse cx="220" cy="640" rx="140" ry="44" fill="#dbe8ef" opacity="0.9"/><ellipse cx="220" cy="634" rx="128" ry="38" fill="#eef5f9"/>')
    for _ in range(60):
        x, y = 220 + rng.gauss(0, 55), 634 + rng.gauss(0, 14)
        body.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{rng.uniform(4, 8):.1f}" fill="{rng.choice(("#f2a65a", "#e07a5f", "#81b29a", "#5fa8d3"))}"/>')
    # The chip on the bench, and the magnifier showing it close up
    body.append('<rect x="610" y="600" width="100" height="34" rx="4" fill="#9aa6b2"/>')
    body.append('<path d="M660 600 L560 520 M660 600 L760 520" stroke="#c7d2db" stroke-width="2" opacity="0.6"/>')
    body.append('<circle cx="660" cy="410" r="222" fill="#27313b"/>')
    body.append('<g clip-path="url(#lclip)">')
    body.append('<rect x="440" y="190" width="440" height="440" fill="#b5c1cc"/>')
    k = 0
    for row in range(4):
        for col in range(4):
            cx, cy = 535 + col * 84, 285 + row * 84
            body.append(f'<rect x="{cx - 30}" y="{cy - 30}" width="60" height="60" rx="8" fill="#7f8c99"/>')
            opened = k in (1, 6, 11)
            if opened:  # a well that has opened, its dose spreading out as dots
                body.append(f'<rect x="{cx - 26}" y="{cy - 26}" width="52" height="52" rx="6" fill="#e9eef2"/>')
                for _ in range(16):
                    a, d = rng.uniform(0, 6.28), rng.uniform(4, 30)
                    body.append(f'<circle cx="{cx + d * math.cos(a):.0f}" cy="{cy + d * math.sin(a):.0f}" r="3.2" fill="#e07a5f"/>')
            else:
                body.append(f'<rect x="{cx - 26}" y="{cy - 26}" width="52" height="52" rx="6" fill="#d9a441"/>')
                body.append(f'<rect x="{cx - 26}" y="{cy - 26}" width="52" height="10" rx="5" fill="#f2cf6b"/>')
            k += 1
    body.append('</g>')
    body.append('<circle cx="660" cy="410" r="210" fill="url(#llens)"/>')
    body.append('<circle cx="660" cy="410" r="214" fill="none" stroke="#1e262e" stroke-width="16"/>')
    body.append('<path d="M812 562 L930 690" stroke="#1e262e" stroke-width="34" stroke-linecap="round"/>')
    return wrap(defs, body)

def hamming():
    """Richard Hamming asked what the most important problem in your field is, and why you aren't working on it:
    a quiet office at Bell Labs, a chalkboard with a (7,4) code's parity circles, a terminal and a stack of tapes."""
    rng = random.Random(1950)
    defs = ('<linearGradient id="hwall" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#d9cdb6"/><stop offset="1" stop-color="#c2b394"/></linearGradient>'
            '<linearGradient id="hboard" x1="0" y1="0" x2="1" y2="1">'
            '<stop offset="0" stop-color="#2f4a3c"/><stop offset="1" stop-color="#22362c"/></linearGradient>'
            '<radialGradient id="hlight" cx="0.5" cy="0.5" r="0.5">'
            '<stop offset="0" stop-color="#fff3d6" stop-opacity="0.7"/><stop offset="1" stop-color="#fff3d6" stop-opacity="0"/></radialGradient>')
    body = [f'<rect width="{W}" height="{H}" fill="url(#hwall)"/>']
    body.append('<ellipse cx="560" cy="300" rx="560" ry="300" fill="url(#hlight)"/>')
    # The chalkboard: three overlapping circles, the four data bits inside and a parity bit in each lobe
    body.append('<rect x="150" y="70" width="700" height="420" rx="8" fill="#6b4f33"/>')
    body.append('<rect x="168" y="88" width="664" height="384" rx="4" fill="url(#hboard)"/>')
    chalk = "#ece7da"
    for cx, cy in ((440, 240), (560, 240), (500, 340)):
        body.append(f'<circle cx="{cx}" cy="{cy}" r="100" fill="none" stroke="{chalk}" stroke-width="4" opacity="0.9"/>')
    for x, y, t in ((500, 275, "1"), (440, 300, "0"), (560, 300, "1"), (500, 205, "1"), (390, 215, "0"), (610, 215, "1"), (500, 400, "0")):
        body.append(f'<text x="{x}" y="{y}" font-family="Georgia, serif" font-size="34" fill="{chalk}" text-anchor="middle">{t}</text>')
    body.append(f'<text x="214" y="138" font-family="Georgia, serif" font-size="26" fill="{chalk}" opacity="0.9">(7, 4)</text>')
    body.append(f'<path d="M680 140 h110 M680 175 h80 M680 210 h96" stroke="{chalk}" stroke-width="4" opacity="0.6" stroke-linecap="round"/>')
    body.append(f'<rect x="240" y="472" width="70" height="10" rx="3" fill="{chalk}"/><rect x="330" y="474" width="40" height="8" rx="3" fill="#f2cf6b"/>')
    # A window with the light coming in
    body.append('<rect x="930" y="80" width="200" height="300" fill="#b8cfdc"/><path d="M1030 80 V380 M930 230 H1130" stroke="#d9cdb6" stroke-width="12"/>')
    # The desk: a terminal, a stack of tape reels and a notebook
    body.append(f'<rect y="560" width="{W}" height="240" fill="#6b4a2f"/><rect y="552" width="{W}" height="14" fill="#8a6440"/>')
    body.append('<rect x="760" y="420" width="250" height="150" rx="10" fill="#cfc6b3"/><rect x="782" y="440" width="206" height="104" rx="6" fill="#1d2a22"/>')
    for k in range(5):
        body.append(f'<path d="M798 {462 + k * 16} h{rng.randint(90, 170)}" stroke="#7fe0a0" stroke-width="3" opacity="0.85"/>')
    body.append('<rect x="820" y="570" width="140" height="20" rx="4" fill="#bdb39e"/>')
    for k in range(3):
        y = 540 - k * 34
        body.append(f'<ellipse cx="320" cy="{y + 26}" rx="80" ry="14" fill="#2b2b30"/><ellipse cx="320" cy="{y + 20}" rx="80" ry="14" fill="#3b3b42"/><ellipse cx="320" cy="{y + 20}" rx="22" ry="5" fill="#9aa1a8"/>')
    body.append('<path d="M480 620 L640 606 L660 680 L496 696 Z" fill="#f4ecd9"/>')
    for k in range(5):
        body.append(f'<path d="M500 {632 + k * 12} L630 {620 + k * 12}" stroke="#7c7466" stroke-width="2" opacity="0.7"/>')
    return wrap(defs, body)

DRAWINGS = {"messi-world-cup": messi, "alphago-lee-sedol": alphago, "feynman-blackboard": feynman,
            "kipchoge-vienna": kipchoge, "honnold-el-capitan": honnold, "alcaraz-wimbledon": alcaraz,
            "neuralink-chess": neuralink, "jobs-empty-room": jobs,
            "original-iphone": iphone, "coding-agent": coding_agent,
            "suzuki-zendo": suzuki, "spreadsheet-grid": spreadsheet, "ramanujan-slate": ramanujan,
            "maps-earth": maps_earth, "grateful-garden": grateful_garden, "waymo-crosswalk": waymo,
            "zimmer-studio": zimmer, "nolan-folding-city": nolan,
            "finn-robot-arm": finn, "kalanithi-desk": kalanithi,
            "langer-chip": langer, "hamming-chalkboard": hamming}

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for name, draw in DRAWINGS.items():
        with open(os.path.join(OUT, name + ".svg"), "w", encoding="utf-8") as f:
            f.write(draw())
        print(os.path.join(OUT, name + ".svg"))
