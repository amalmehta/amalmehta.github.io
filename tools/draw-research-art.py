"""Draws the site's illustrations as SVGs in images/: the six research entries
(1280x720).

Run from the repo root after changing a drawing:
  python3 tools/draw-research-art.py
"""
import math, random, sys, os

OUT = sys.argv[1] if len(sys.argv) > 1 else "images"
W, H = 1280, 720
PAPER = "#f6f3ec"
INK = "#1c1b19"
BLUE = "#2f5d8a"
BLUE_SOFT = "#dbe6f1"
WARM = "#a5532a"
WARM_SOFT = "#f3dfd1"
GREY = "#3b3a37"


def svg(body, bg=PAPER):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
            f'<rect width="{W}" height="{H}" fill="{bg}"/>{body}</svg>')


def smooth_closed(pts):
    """Catmull-Rom through pts, as a closed cubic Bezier path."""
    n = len(pts)
    d = f"M{pts[0][0]:.1f},{pts[0][1]:.1f}"
    for i in range(n):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f" C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}"
    return d + "Z"


def blob(cx, cy, rx, ry, n, wobble, rng, rot=0.0):
    pts = []
    phases = [rng.uniform(0, 6.28) for _ in range(3)]
    for i in range(n):
        a = 2 * math.pi * i / n
        r = 1 + wobble * (0.5 * math.sin(2 * a + phases[0]) + 0.3 * math.sin(3 * a + phases[1])
                          + 0.2 * math.sin(5 * a + phases[2]))
        x, y = rx * r * math.cos(a), ry * r * math.sin(a)
        pts.append((cx + x * math.cos(rot) - y * math.sin(rot), cy + x * math.sin(rot) + y * math.cos(rot)))
    return pts


# ---------------------------------------------------------------- robot soccer
def robot_soccer():
    b = []
    # Simulation grid on the floor: a nod to training in sim before the real robot.
    horizon, vx = 380, 640
    b.append('<g stroke="#cfdbe8" stroke-width="1.5" fill="none">')
    for k in range(-14, 15):
        b.append(f'<line x1="{vx + k * 18}" y1="{horizon}" x2="{vx + k * 150}" y2="{H}"/>')
    y = 600.0
    step = 16.0
    while y < H:
        b.append(f'<line x1="0" y1="{y:.0f}" x2="{W}" y2="{y:.0f}"/>')
        y += step
        step *= 1.35
    b.append('</g>')
    b.append(f'<rect x="0" y="0" width="{W}" height="600" fill="{PAPER}"/>')
    b.append(f'<line x1="0" y1="600" x2="{W}" y2="600" stroke="{INK}" stroke-width="2.5"/>')
    b.append('<g transform="translate(-350,-100) scale(1.25)">')

    # Goal and target.
    b.append(f'<g stroke="{INK}" stroke-width="5" stroke-linecap="round" fill="none">'
             f'<path d="M1060,560 L1060,360 L1230,360 L1230,560"/>'
             f'<path d="M1060,360 L1095,330 L1255,330 L1230,360" stroke-width="3"/>'
             f'<path d="M1255,330 L1255,520" stroke-width="3"/></g>')
    b.append('<g stroke="#b9b4a8" stroke-width="1.2">')
    for x in range(1075, 1230, 18):
        b.append(f'<line x1="{x}" y1="365" x2="{x}" y2="558"/>')
    for yy in range(378, 560, 18):
        b.append(f'<line x1="1063" y1="{yy}" x2="1227" y2="{yy}"/>')
    b.append('</g>')
    for r, c in ((46, WARM), (31, PAPER), (17, WARM)):
        b.append(f'<circle cx="1145" cy="440" r="{r}" fill="{c}" stroke="{WARM}" stroke-width="3"/>')

    # Ball path to the target.
    b.append(f'<path d="M772,500 Q930,250 1132,428" fill="none" stroke="{WARM}" stroke-width="4" '
             f'stroke-dasharray="4 14" stroke-linecap="round"/>')
    b.append(f'<path d="M1118,412 L1134,430 L1110,433" fill="none" stroke="{WARM}" stroke-width="4" '
             f'stroke-linecap="round" stroke-linejoin="round"/>')

    # Shadows.
    for cx, rx in ((470, 190), (735, 40)):
        b.append(f'<ellipse cx="{cx}" cy="563" rx="{rx}" ry="9" fill="#1c1b19" opacity="0.08"/>')

    def leg(hip, knee, foot, shade):
        col = "#8a8780" if shade else GREY
        return (f'<g stroke-linecap="round" stroke-linejoin="round">'
                f'<line x1="{hip[0]}" y1="{hip[1]}" x2="{knee[0]}" y2="{knee[1]}" stroke="{col}" stroke-width="26"/>'
                f'<line x1="{knee[0]}" y1="{knee[1]}" x2="{foot[0]}" y2="{foot[1]}" stroke="{col}" stroke-width="11"/>'
                f'<circle cx="{knee[0]}" cy="{knee[1]}" r="10" fill="{col}"/>'
                f'<circle cx="{foot[0]}" cy="{foot[1]}" r="10" fill="{INK if not shade else col}"/></g>')

    # Far-side legs first, lighter, for depth.
    b.append(leg((392, 378), (352, 458), (398, 551), True))
    b.append(leg((592, 378), (552, 458), (598, 551), True))

    # Body.
    b.append(f'<rect x="335" y="318" width="275" height="78" rx="22" fill="#dcd8cf" stroke="{INK}" stroke-width="3.5"/>')
    b.append(f'<rect x="380" y="303" width="170" height="22" rx="8" fill="#c9c5bb" stroke="{INK}" stroke-width="3"/>')
    b.append(f'<line x1="350" y1="352" x2="595" y2="352" stroke="{INK}" stroke-width="1.5" opacity="0.35"/>')
    b.append(f'<rect x="440" y="360" width="70" height="14" rx="4" fill="{BLUE}"/>')
    # Head: the stereo-camera face.
    b.append(f'<path d="M600,326 L660,334 Q676,337 676,352 L676,372 Q676,388 660,390 L600,392 Z" '
             f'fill="#cfcbc1" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/>')
    for cy in (350, 374):
        b.append(f'<circle cx="663" cy="{cy}" r="6.5" fill="{INK}"/><circle cx="665" cy="{cy - 2}" r="2" fill="#fff"/>')

    # Near-side legs: a planted hind leg and the kicking front leg.
    b.append(leg((372, 382), (330, 462), (376, 555), False))
    b.append(leg((572, 382), (618, 448), (700, 512), False))
    for x in (372, 572):
        b.append(f'<circle cx="{x}" cy="382" r="24" fill="#bdb8ad" stroke="{INK}" stroke-width="3.5"/>'
                 f'<circle cx="{x}" cy="382" r="7" fill="{INK}"/>')

    # Ball.
    bx, by, br = 738, 522, 36
    b.append(f'<circle cx="{bx}" cy="{by}" r="{br}" fill="#fff" stroke="{INK}" stroke-width="3.5"/>')
    pent = [(bx + 13 * math.cos(math.radians(-90 + 72 * i)), by + 13 * math.sin(math.radians(-90 + 72 * i))) for i in range(5)]
    b.append('<polygon points="' + " ".join(f"{x:.1f},{y:.1f}" for x, y in pent) + f'" fill="{INK}"/>')
    for x, y in pent:
        ang = math.atan2(y - by, x - bx)
        b.append(f'<line x1="{x:.1f}" y1="{y:.1f}" x2="{bx + br * math.cos(ang):.1f}" y2="{by + br * math.sin(ang):.1f}" '
                 f'stroke="{INK}" stroke-width="2.5"/>')
    b.append('</g>')
    return svg("".join(b))


# ---------------------------------------------------------------- PhysicsAI
def physicsai():
    rng = random.Random(7)
    b = []
    # Ground plane seen from the drone, as a quad.
    FL, FR, NL, NR = (430, 420), (850, 420), (150, 715), (1130, 715)

    def P(u, v):
        top = (FL[0] + (FR[0] - FL[0]) * u, FL[1])
        bot = (NL[0] + (NR[0] - NL[0]) * u, NL[1])
        t = v ** 0.85
        return (top[0] + (bot[0] - top[0]) * t, top[1] + (bot[1] - top[1]) * t)

    def quad(u0, v0, u1, v1, **kw):
        pts = [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)]
        attrs = " ".join(f'{k.replace("_", "-")}="{v}"' for k, v in kw.items())
        return '<polygon points="' + " ".join(f"{x:.1f},{y:.1f}" for x, y in pts) + f'" {attrs}/>'

    b.append(quad(0, 0, 1, 1, fill="#e4e8dc", stroke=INK, stroke_width=2.5))
    # Roads.
    b.append(quad(0.44, 0, 0.56, 1, fill="#c9c6bd"))
    b.append(quad(0, 0.52, 1, 0.64, fill="#c9c6bd"))
    for v in [i / 14 for i in range(14)]:
        if not 0.5 < v < 0.66:
            b.append(quad(0.497, v, 0.503, v + 0.035, fill="#fff"))
    # Blocks of rooftops.
    for (u0, u1) in ((0.03, 0.41), (0.59, 0.97)):
        for (v0, v1) in ((0.04, 0.48), (0.68, 0.97)):
            n = 3
            for i in range(n):
                for j in range(2):
                    uu0 = u0 + (u1 - u0) * i / n + 0.012
                    uu1 = u0 + (u1 - u0) * (i + 1) / n - 0.012
                    vv0 = v0 + (v1 - v0) * j / 2 + 0.02
                    vv1 = v0 + (v1 - v0) * (j + 1) / 2 - 0.02
                    fill = rng.choice(["#d8d3c6", "#cdd6db", "#e2d6c9", "#d3d9cc"])
                    b.append(quad(uu0, vv0, uu1, vv1, fill=fill, stroke="#9d998f", stroke_width=1))
    # Cars and their detections.
    cars = [(0.465, 0.12, 0.49, 0.2), (0.51, 0.3, 0.535, 0.38), (0.465, 0.76, 0.495, 0.86),
            (0.12, 0.555, 0.2, 0.605), (0.7, 0.585, 0.8, 0.635), (0.29, 0.585, 0.37, 0.635)]
    colors = [BLUE, "#7a2f2f", "#2d2d2d", "#c48a2a", "#5d6f80", "#e9e6df"]
    labels = ["car .94", "car .91", "truck .88", "car .97", "car .93", "car .86"]
    for (u0, v0, u1, v1), c, lab in zip(cars, colors, labels):
        b.append(quad(u0, v0, u1, v1, fill=c, stroke=INK, stroke_width=1.2))
        pts = [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)]
        x0 = min(p[0] for p in pts) - 7; x1 = max(p[0] for p in pts) + 7
        y0 = min(p[1] for p in pts) - 7; y1 = max(p[1] for p in pts) + 7
        b.append(f'<rect x="{x0:.1f}" y="{y0:.1f}" width="{x1 - x0:.1f}" height="{y1 - y0:.1f}" fill="none" '
                 f'stroke="{WARM}" stroke-width="2.5"/>')
        tw = 7.2 * len(lab) + 8
        b.append(f'<rect x="{x0:.1f}" y="{y0 - 18:.1f}" width="{tw:.1f}" height="18" fill="{WARM}"/>'
                 f'<text x="{x0 + 4:.1f}" y="{y0 - 5:.1f}" font-family="Menlo,monospace" font-size="12" fill="#fff">{lab}</text>')

    # Camera frustum from the drone to the ground.
    cam = (640, 232)
    b.append(f'<polygon points="{cam[0]},{cam[1]} {FL[0]},{FL[1]} {FR[0]},{FR[1]}" fill="{BLUE}" opacity="0.07"/>')
    for c in (FL, FR, NL, NR):
        b.append(f'<line x1="{cam[0]}" y1="{cam[1]}" x2="{c[0]}" y2="{c[1]}" stroke="{BLUE}" stroke-width="1.6" '
                 f'stroke-dasharray="6 7" opacity="0.8"/>')

    # The drone.
    def rotor(x, y):
        return (f'<ellipse cx="{x}" cy="{y}" rx="70" ry="13" fill="{BLUE_SOFT}" stroke="{BLUE}" stroke-width="2" opacity="0.9"/>'
                f'<rect x="{x - 9}" y="{y - 4}" width="18" height="22" rx="4" fill="{GREY}"/>')
    arms = [(500, 150), (780, 150), (540, 205), (740, 205)]
    for x, y in arms[:2]:
        b.append(f'<line x1="640" y1="190" x2="{x}" y2="{y + 10}" stroke="{GREY}" stroke-width="12" stroke-linecap="round"/>')
        b.append(rotor(x, y))
    b.append(f'<path d="M575,170 Q640,150 705,170 L715,205 Q640,222 565,205 Z" fill="#e9e6df" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/>')
    b.append(f'<path d="M590,176 Q640,164 690,176" fill="none" stroke="{BLUE}" stroke-width="4" stroke-linecap="round"/>')
    for x, y in arms[2:]:
        b.append(f'<line x1="640" y1="200" x2="{x}" y2="{y + 10}" stroke="{GREY}" stroke-width="12" stroke-linecap="round"/>')
        b.append(rotor(x, y))
    b.append(f'<rect x="628" y="210" width="24" height="12" fill="{GREY}"/>'
             f'<circle cx="640" cy="232" r="15" fill="{GREY}" stroke="{INK}" stroke-width="2"/>'
             f'<circle cx="640" cy="234" r="6" fill="{BLUE}"/>')

    # The RL agent's control panel: generator knobs and a rising reward.
    px, py = 960, 46
    b.append(f'<rect x="{px}" y="{py}" width="280" height="196" rx="10" fill="#fff" stroke="{INK}" stroke-width="2.5"/>')
    b.append(f'<text x="{px + 18}" y="{py + 30}" font-family="Menlo,monospace" font-size="14" fill="{INK}">generator params</text>')
    for i, (name, val) in enumerate((("light", 0.72), ("texture", 0.38), ("clutter", 0.58))):
        yy = py + 58 + i * 28
        b.append(f'<text x="{px + 18}" y="{yy + 4}" font-family="Menlo,monospace" font-size="12" fill="#5f5c55">{name}</text>'
                 f'<line x1="{px + 100}" y1="{yy}" x2="{px + 258}" y2="{yy}" stroke="#d8d3c6" stroke-width="5" stroke-linecap="round"/>'
                 f'<line x1="{px + 100}" y1="{yy}" x2="{px + 100 + 158 * val:.0f}" y2="{yy}" stroke="{BLUE}" stroke-width="5" stroke-linecap="round"/>'
                 f'<circle cx="{px + 100 + 158 * val:.0f}" cy="{yy}" r="7" fill="#fff" stroke="{BLUE}" stroke-width="3"/>')
    pts = []
    for i in range(24):
        t = i / 23
        pts.append((px + 18 + 244 * t, py + 182 - 44 * (1 - math.exp(-3.2 * t)) - rng.uniform(0, 5)))
    b.append(f'<text x="{px + 18}" y="{py + 148}" font-family="Menlo,monospace" font-size="12" fill="#5f5c55">reward</text>')
    b.append('<polyline points="' + " ".join(f"{x:.1f},{y:.1f}" for x, y in pts) + f'" fill="none" stroke="{WARM}" stroke-width="3" stroke-linejoin="round"/>')
    return svg("".join(b))


# ---------------------------------------------------------------- VIP Lab
def vip_lab():
    rng = random.Random(3)
    b = ['<defs><clipPath id="slide"><path id="tissue-path" d="{T}"/></clipPath>'
         '<clipPath id="lens"><rect x="760" y="125" width="450" height="450"/></clipPath></defs>']
    # A whole-slide tissue section.
    tissue = blob(390, 370, 300, 220, 22, 0.16, rng, rot=-0.25)
    T = smooth_closed(tissue)
    b[0] = b[0].replace("{T}", T)
    b.append(f'<rect x="40" y="60" width="700" height="600" rx="8" fill="#fff" stroke="#d8d3c6" stroke-width="2"/>')
    b.append(f'<path d="{T}" fill="#f0c9d8" stroke="#c98aa8" stroke-width="3"/>')
    # Texture: darker stroma streaks and nuclei-dense patches, clipped to the tissue.
    b.append('<g clip-path="url(#slide)">')
    for _ in range(26):
        p = blob(rng.uniform(120, 660), rng.uniform(150, 600), rng.uniform(30, 80), rng.uniform(12, 30), 10, 0.3, rng, rng.uniform(0, 3))
        b.append(f'<path d="{smooth_closed(p)}" fill="#e3a9c3" opacity="0.6"/>')
    # Epidermis: a dark band along the top edge.
    b.append(f'<path d="{T}" fill="none" stroke="#8d5a9e" stroke-width="26" opacity="0.55" '
             f'transform="translate(0,0)"/>')
    # Invasive region: dense purple nests.
    nest = blob(330, 400, 140, 95, 16, 0.22, rng, rot=0.4)
    b.append(f'<path d="{smooth_closed(nest)}" fill="#a77bbd" opacity="0.55"/>')
    for _ in range(260):
        a = rng.uniform(0, 6.28); r = rng.uniform(0, 1) ** 0.6
        x = 330 + 135 * r * math.cos(a); y = 400 + 90 * r * math.sin(a)
        b.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rng.uniform(1.8, 3.4):.1f}" fill="#5e3d7a" opacity="0.7"/>')
    b.append('</g>')
    # Patch grid the network tiles the slide into.
    b.append('<g stroke="#2f5d8a" stroke-width="1" opacity="0.28">')
    for x in range(80, 720, 40):
        b.append(f'<line x1="{x}" y1="120" x2="{x}" y2="620"/>')
    for y in range(120, 640, 40):
        b.append(f'<line x1="80" y1="{y}" x2="700" y2="{y}"/>')
    b.append('</g>')
    # Predicted mask outline.
    b.append(f'<path d="{smooth_closed(nest)}" fill="{WARM}" fill-opacity="0.12" stroke="{WARM}" stroke-width="4" stroke-linejoin="round"/>')

    # Magnifier: the area under the box, cell by cell.
    sx, sy, ss = 400, 330, 70
    b.append(f'<rect x="{sx}" y="{sy}" width="{ss}" height="{ss}" fill="none" stroke="{INK}" stroke-width="3"/>')
    b.append(f'<line x1="{sx + ss}" y1="{sy}" x2="760" y2="125" stroke="{INK}" stroke-width="1.5" stroke-dasharray="5 6"/>'
             f'<line x1="{sx + ss}" y1="{sy + ss}" x2="760" y2="575" stroke="{INK}" stroke-width="1.5" stroke-dasharray="5 6"/>')
    b.append('<g clip-path="url(#lens)">')
    b.append('<rect x="740" y="100" width="500" height="500" fill="#f2cfdc"/>')
    for _ in range(30):
        p = blob(rng.uniform(760, 1220), rng.uniform(120, 590), rng.uniform(40, 90), rng.uniform(14, 30), 10, 0.3, rng, rng.uniform(0, 3))
        b.append(f'<path d="{smooth_closed(p)}" fill="#e7afc6" opacity="0.7"/>')
    # Boundary between the tumour nest (left/lower) and normal tissue.
    boundary = "M760,190 C860,230 900,300 960,330 S1080,470 1240,500"
    cells = []
    for _ in range(170):
        x, y = rng.uniform(750, 1225), rng.uniform(110, 595)
        tumour = y > 190 + (x - 760) * 0.62
        cells.append((x, y, tumour))
    for x, y, tumour in cells:
        if tumour:
            rx, ry, col = rng.uniform(11, 17), rng.uniform(8, 13), rng.choice(["#4f2f6e", "#5e3d7a", "#6b4789"])
        else:
            rx, ry, col = rng.uniform(6, 9), rng.uniform(4, 6), rng.choice(["#7c5a99", "#8d6aa8"])
        rot = rng.uniform(0, 180)
        b.append(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" transform="rotate({rot:.0f} {x:.1f} {y:.1f})" '
                 f'fill="{col}" opacity="0.85"/>')
        if tumour and rng.random() < 0.35:
            b.append(f'<circle cx="{x + rng.uniform(-3, 3):.1f}" cy="{y + rng.uniform(-2, 2):.1f}" r="2.4" fill="#2a1840"/>')
    b.append(f'<path d="{boundary}" fill="none" stroke="{WARM}" stroke-width="5" stroke-linecap="round"/>')
    b.append('</g>')
    b.append(f'<rect x="760" y="125" width="450" height="450" fill="none" stroke="{INK}" stroke-width="4"/>')
    return svg("".join(b))


# ---------------------------------------------------------------- Abbasi-Asl Lab
def brain_points(cx, cy, s=1.0, rot=0.0, n=220, gyri=0.010):
    """Outline of an axial brain slice: an oval with gyri and a notch at the fissure."""
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        r = 1 + gyri * (math.sin(17 * t) + 0.5 * math.sin(29 * t + 1))
        r -= 0.09 * math.exp(-((t - 1.5 * math.pi) / 0.09) ** 2)  # front notch
        r -= 0.05 * math.exp(-((t - 0.5 * math.pi) / 0.09) ** 2)  # back notch
        x = 150 * r * math.cos(t) * (1 - 0.06 * math.sin(t))  # narrower at the front
        y = 182 * r * math.sin(t)
        x, y = x * s, y * s
        pts.append((cx + x * math.cos(rot) - y * math.sin(rot), cy + x * math.sin(rot) + y * math.cos(rot)))
    return pts


def poly_path(pts):
    return "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + "Z"


def brain_detail(cx, cy, s, rot, col, width):
    """Midline and ventricles, transformed like the outline."""
    def T(x, y):
        x, y = x * s, y * s
        return (cx + x * math.cos(rot) - y * math.sin(rot), cy + x * math.sin(rot) + y * math.cos(rot))
    mid = [T(3 * math.sin(k / 3), -166 + k * 332 / 40) for k in range(41)]
    out = [f'<path d="M{" L".join(f"{x:.1f},{y:.1f}" for x, y in mid)}" fill="none" stroke="{col}" stroke-width="{width}"/>']
    inner = brain_points(cx, cy, s * 0.8, rot, gyri=0.045)
    out.append(f'<path d="{poly_path(inner)}" fill="none" stroke="{col}" stroke-width="{width * 0.7}" opacity="0.7" stroke-linejoin="round"/>')
    return "".join(out)


def brain_emd():
    b = []
    # Left: registration. A deformation grid pulls the moving scan onto the fixed one.
    cx, cy = 290, 360
    b.append(f'<defs><clipPath id="panel"><rect x="50" y="70" width="480" height="580" rx="10"/></clipPath></defs>')
    b.append(f'<rect x="50" y="70" width="480" height="580" rx="10" fill="#fff" stroke="#d8d3c6" stroke-width="2"/>')
    b.append(f'<g clip-path="url(#panel)" stroke="{BLUE}" stroke-width="1.3" opacity="0.35" fill="none">')

    def warp(x, y):
        return (x + 9 * math.sin((y - 70) / 75), y + 7 * math.sin((x - 50) / 90))
    for gx in range(50, 541, 30):
        b.append('<polyline points="' + " ".join("%.1f,%.1f" % warp(gx, gy) for gy in range(60, 661, 15)) + '"/>')
    for gy in range(70, 661, 30):
        b.append('<polyline points="' + " ".join("%.1f,%.1f" % warp(gx, gy) for gx in range(40, 551, 15)) + '"/>')
    b.append('</g>')
    fixed = brain_points(cx, cy)
    moving = brain_points(cx + 26, cy - 14, 0.9, -0.2)
    b.append(f'<path d="{poly_path(fixed)}" fill="{WARM_SOFT}" fill-opacity="0.6" stroke="{WARM}" stroke-width="3.5" stroke-linejoin="round"/>')
    b.append(brain_detail(cx, cy, 1.0, 0.0, WARM, 2.5))
    b.append(f'<path d="{poly_path(moving)}" fill="none" stroke="{BLUE}" stroke-width="3" stroke-dasharray="9 7" stroke-linejoin="round"/>')
    b.append(brain_detail(cx + 26, cy - 14, 0.9, -0.2, BLUE, 2))
    # Arrows from the moving outline to the fixed one.
    for i in range(0, 220, 28):
        (x0, y0), (x1, y1) = moving[i], fixed[i]
        if math.hypot(x1 - x0, y1 - y0) < 14:
            continue
        ang = math.atan2(y1 - y0, x1 - x0)
        tip = (x1 - 4 * math.cos(ang), y1 - 4 * math.sin(ang))
        h1 = (tip[0] - 10 * math.cos(ang - 0.45), tip[1] - 10 * math.sin(ang - 0.45))
        h2 = (tip[0] - 10 * math.cos(ang + 0.45), tip[1] - 10 * math.sin(ang + 0.45))
        b.append(f'<line x1="{x0:.1f}" y1="{y0:.1f}" x2="{tip[0]:.1f}" y2="{tip[1]:.1f}" stroke="{INK}" stroke-width="2"/>'
                 f'<polyline points="{h1[0]:.1f},{h1[1]:.1f} {tip[0]:.1f},{tip[1]:.1f} {h2[0]:.1f},{h2[1]:.1f}" fill="none" '
                 f'stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>')
    mono = 'font-family="Menlo,monospace" font-size="15"'
    b.append(f'<line x1="74" y1="104" x2="104" y2="104" stroke="{BLUE}" stroke-width="3" stroke-dasharray="7 5"/>'
             f'<text x="114" y="109" {mono} fill="{INK}">moving</text>'
             f'<line x1="200" y1="104" x2="230" y2="104" stroke="{WARM}" stroke-width="3.5"/>'
             f'<text x="240" y="109" {mono} fill="{INK}">fixed</text>')

    # Right: empirical mode decomposition, fine detail at the top down to the smooth trend.
    b.append(f'<path d="M552,360 L590,360" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>'
             f'<path d="M580,350 L592,360 L580,370" fill="none" stroke="{INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>')
    layers = (("IMF 1", 16), ("IMF 2", 8), ("IMF 3", 4), ("residue", 0))
    local = brain_points(0, 0, 0.8)
    for k, (name, rings) in enumerate(layers):
        ox, oy = 870, 118 + k * 158
        b.append(f'<defs><clipPath id="l{k}"><path d="{poly_path(local)}"/></clipPath>'
                 f'<radialGradient id="g{k}"><stop offset="0" stop-color="{BLUE}" stop-opacity="0.75"/>'
                 f'<stop offset="1" stop-color="{BLUE}" stop-opacity="0.08"/></radialGradient></defs>')
        g = [f'<g transform="translate({ox},{oy}) matrix(1,0,-0.7,0.45,0,0)">']
        g.append(f'<rect x="-150" y="-180" width="300" height="360" fill="#fff" stroke="#b9b4a8" stroke-width="2.5"/>')
        if rings:
            g.append(f'<g clip-path="url(#l{k})">')
            for j in range(rings, 0, -1):
                ring = brain_points(0, 0, 0.8 * j / rings)
                col = BLUE if j % 2 else "#9fb8d1"
                g.append(f'<path d="{poly_path(ring)}" fill="{col}" fill-opacity="{0.25 + 0.5 * (j % 2)}"/>')
            g.append('</g>')
        else:
            g.append(f'<path d="{poly_path(local)}" fill="url(#g{k})"/>')
        g.append(f'<path d="{poly_path(local)}" fill="none" stroke="{INK}" stroke-width="2.5"/>')
        g.append('</g>')
        b.append("".join(g))
        b.append(f'<text x="{ox + 175}" y="{oy + 6}" {mono} fill="{INK}">{name}</text>')
    b.append(f'<text x="1252" y="34" {mono} fill="#5f5c55" text-anchor="end">fine</text>'
             f'<path d="M1240,46 L1240,664" stroke="#b9b4a8" stroke-width="2"/>'
             f'<path d="M1233,652 L1240,666 L1247,652" fill="none" stroke="#b9b4a8" stroke-width="2"/>'
             f'<text x="1252" y="696" {mono} fill="#5f5c55" text-anchor="end">coarse</text>')
    return svg("".join(b))


# ---------------------------------------------------------------- supernova search
def supernova():
    """Image subtraction: the same patch of sky before and after, and what's left when one is taken from the other."""
    rng = random.Random(11)
    mono = 'font-family="Menlo,monospace" font-size="15"'
    size, top, xs = 360, 170, (50, 460, 870)
    stars = [(rng.uniform(12, size - 12), rng.uniform(12, size - 12), rng.uniform(0, 1) ** 3) for _ in range(70)]
    gx, gy = 196, 168           # host galaxy, in panel coordinates
    sn = (gx + 30, gy - 16)     # the new point of light on its edge
    b = ['<defs><radialGradient id="galaxy"><stop offset="0" stop-color="#1c1b19" stop-opacity="0.85"/>'
         '<stop offset="0.35" stop-color="#3b3a37" stop-opacity="0.45"/><stop offset="1" stop-color="#3b3a37" stop-opacity="0"/></radialGradient>']
    for i, x in enumerate(xs):
        b.append(f'<clipPath id="sky{i}"><rect x="{x}" y="{top}" width="{size}" height="{size}" rx="8"/></clipPath>')
    b.append('</defs>')
    for i, (x, label) in enumerate(zip(xs, ("before", "after", "difference"))):
        b.append(f'<rect x="{x}" y="{top}" width="{size}" height="{size}" rx="8" fill="#fff" stroke="#d8d3c6" stroke-width="2"/>')
        b.append(f'<text x="{x}" y="{top - 18}" {mono} fill="{INK}">{label}</text>')
        b.append(f'<g clip-path="url(#sky{i})">')
        # Faint sky-coordinate grid.
        b.append(f'<g stroke="{BLUE}" stroke-width="1" opacity="0.18">')
        for k in range(40, size, 40):
            b.append(f'<line x1="{x + k}" y1="{top}" x2="{x + k}" y2="{top + size}"/>'
                     f'<line x1="{x}" y1="{top + k}" x2="{x + size}" y2="{top + k}"/>')
        b.append('</g>')
        if i < 2:
            b.append(f'<ellipse cx="{x + gx}" cy="{top + gy}" rx="62" ry="34" transform="rotate(-28 {x + gx} {top + gy})" fill="url(#galaxy)"/>')
            for sx, sy, m in stars:
                r = 1.4 + 5.5 * m
                if m > 0.35:
                    b.append(f'<circle cx="{x + sx:.1f}" cy="{top + sy:.1f}" r="{r * 2.2:.1f}" fill="{INK}" opacity="0.12"/>')
                b.append(f'<circle cx="{x + sx:.1f}" cy="{top + sy:.1f}" r="{r:.1f}" fill="{INK}"/>')
        else:
            # Stars and the galaxy cancel, leaving only faint residue.
            for sx, sy, m in stars:
                if m > 0.08:
                    b.append(f'<circle cx="{x + sx + rng.uniform(-1.5, 1.5):.1f}" cy="{top + sy + rng.uniform(-1.5, 1.5):.1f}" '
                             f'r="{1.2 + 2.5 * m:.1f}" fill="{GREY}" opacity="0.14"/>')
        if i > 0:
            cx, cy = x + sn[0], top + sn[1]
            b.append(f'<circle cx="{cx}" cy="{cy}" r="13" fill="{INK}" opacity="0.15"/><circle cx="{cx}" cy="{cy}" r="5.5" fill="{INK}"/>')
            b.append(f'<circle cx="{cx}" cy="{cy}" r="26" fill="none" stroke="{WARM}" stroke-width="4"/>')
        b.append('</g>')
    # Minus and equals between the panels.
    for x, sign in ((435, "−"), (845, "=")):
        b.append(f'<text x="{x}" y="{top + size / 2 + 14}" font-family="Georgia,serif" font-size="44" fill="{INK}" text-anchor="middle">{sign}</text>')
    b.append(f'<text x="{xs[2] + sn[0] + 34}" y="{top + sn[1] - 30}" {mono} fill="{WARM}">new</text>')
    return svg("".join(b))


# ---------------------------------------------------------------- particle interactions
def particles():
    """A 3D detector volume: voxel hits from one interaction, each labelled track or shower."""
    rng = random.Random(5)
    mono = 'font-family="Menlo,monospace" font-size="15"'
    s, cx, cy = 34, 500, 360
    c30, s30 = math.cos(math.pi / 6), 0.5

    def P(x, y, z):
        return (cx + (x - y) * c30 * s, cy + (x + y - 10) * s30 * s - (z - 5) * s)

    def pts(*ps):
        return " ".join("%.1f,%.1f" % P(*p) for p in ps)

    b = []
    # Floor grid and the far walls of the volume.
    b.append(f'<g stroke="#cfdbe8" stroke-width="1.2" fill="none">')
    for k in range(0, 11):
        b.append(f'<polyline points="{pts((k, 0, 0), (k, 10, 0))}"/><polyline points="{pts((0, k, 0), (10, k, 0))}"/>')
    b.append('</g>')
    b.append(f'<g stroke="#b9b4a8" stroke-width="2" fill="none" stroke-dasharray="6 7">'
             f'<polyline points="{pts((0, 0, 0), (0, 0, 10))}"/><polyline points="{pts((0, 0, 10), (10, 0, 10))}"/>'
             f'<polyline points="{pts((0, 0, 10), (0, 10, 10))}"/></g>')

    # Hits: two tracks and a shower from one vertex.
    v = (2.4, 4.6, 5.4)
    hits = []
    for d, n in (((0.7, 0.15, 0.1), 15), ((-0.15, 0.3, 0.7), 7)):
        L = math.sqrt(sum(c * c for c in d))
        for k in range(1, n + 1):
            t = k * 0.5
            hits.append(tuple(v[j] + d[j] / L * t + rng.uniform(-0.06, 0.06) for j in range(3)) + ("track",))
    sd = (0.25, 0.75, -0.2)
    L = math.sqrt(sum(c * c for c in sd))
    sd = tuple(c / L for c in sd)
    for _ in range(95):
        t = rng.uniform(0.6, 6.0)
        spread = 0.08 + 0.17 * t
        p = tuple(v[j] + sd[j] * t + rng.gauss(0, spread) for j in range(3))
        if all(0.2 < p[j] < 9.8 for j in range(3)):
            hits.append(p + ("shower",))
    hits.sort(key=lambda h: h[0] + h[1] + h[2])

    def voxel(x, y, z, kind):
        h = 0.2
        col, top_col, side_col = (BLUE, "#6d93ba", "#244a70") if kind == "track" else (WARM, "#c98262", "#7f3d1d")
        top = pts((x - h, y - h, z + h), (x + h, y - h, z + h), (x + h, y + h, z + h), (x - h, y + h, z + h))
        left = pts((x - h, y + h, z + h), (x + h, y + h, z + h), (x + h, y + h, z - h), (x - h, y + h, z - h))
        right = pts((x + h, y - h, z + h), (x + h, y + h, z + h), (x + h, y + h, z - h), (x + h, y - h, z - h))
        return (f'<polygon points="{left}" fill="{col}"/><polygon points="{right}" fill="{side_col}"/>'
                f'<polygon points="{top}" fill="{top_col}"/>')
    b.append("".join(voxel(*h) for h in hits))
    vx, vy = P(*v)
    b.append(f'<circle cx="{vx:.1f}" cy="{vy:.1f}" r="9" fill="{PAPER}" stroke="{INK}" stroke-width="3.5"/>')

    # Near edges of the volume.
    b.append(f'<g stroke="{INK}" stroke-width="2.5" fill="none" stroke-linejoin="round">'
             f'<polygon points="{pts((10, 0, 0), (10, 10, 0), (0, 10, 0), (0, 10, 10), (10, 10, 10), (10, 0, 10))}"/>'
             f'<polyline points="{pts((10, 10, 0), (10, 10, 10))}"/>'
             f'<polyline points="{pts((0, 0, 0), (10, 0, 0))}" stroke="#b9b4a8" stroke-width="2" stroke-dasharray="6 7"/>'
             f'<polyline points="{pts((0, 0, 0), (0, 10, 0))}" stroke="#b9b4a8" stroke-width="2" stroke-dasharray="6 7"/></g>')

    # Legend: what the network labels each hit.
    lx, ly = 1010, 300
    for i, (label, col) in enumerate((("track", BLUE), ("shower", WARM))):
        y = ly + i * 44
        b.append(f'<rect x="{lx}" y="{y - 13}" width="18" height="18" rx="3" fill="{col}"/>'
                 f'<text x="{lx + 32}" y="{y + 2}" {mono} fill="{INK}">{label}</text>')
    b.append(f'<circle cx="{lx + 9}" cy="{ly + 84}" r="8" fill="{PAPER}" stroke="{INK}" stroke-width="3"/>'
             f'<text x="{lx + 32}" y="{ly + 90}" {mono} fill="{INK}">vertex</text>')
    return svg("".join(b))


DRAWINGS = (("robot-soccer", robot_soccer), ("physicsai", physicsai), ("vip-lab", vip_lab), ("brain-emd", brain_emd),
            ("supernova", supernova), ("particles", particles))
os.makedirs(OUT, exist_ok=True)
for name, fn in DRAWINGS:
    with open(os.path.join(OUT, f"{name}.svg"), "w") as f:
        f.write(fn())
print("wrote", ", ".join(n + ".svg" for n, _ in DRAWINGS), "to", OUT)
