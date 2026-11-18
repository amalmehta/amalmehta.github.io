#!/usr/bin/env python3
"""Draws the Rewarding deep dive's storyboard: six hand-drawn panels of a code agent learning
to delete the code no test reaches, as images/case/storyboard-rewarding.svg (1200x780).

Every number in it comes from the project (tools/make-case-studies.py); change it there first.
Run from the repo root after changing a panel: python3 tools/draw-storyboard.py
"""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "images/case/storyboard-rewarding.svg"
W, H = 1200, 780
PW, PH, GAP, TOP = 372, 300, 24, 40     # panel size, gutter, top margin
PAPER, CARD, INK = "#f6f1e7", "#fffcf6", "#29241f"
BLUE, WARM, GREEN, RED, GREY = "#2f5d8a", "#a5532a", "#4f8a4b", "#c0473a", "#b9b1a4"
FONT = "font-family=\"Newsreader, Georgia, serif\""


def bot(x, y, s=1.0, look=0, tool=""):
    """The agent: a small boxy robot with one antenna, drawn for this storyboard."""
    b = [f'<g transform="translate({x},{y}) scale({s})">',
         f'<line x1="0" y1="-62" x2="0" y2="-48" stroke="{INK}" stroke-width="3"/>',
         f'<circle cx="0" cy="-66" r="5" fill="{WARM}"/>',
         f'<rect x="-30" y="-48" width="60" height="44" rx="10" fill="#dfe7ef" stroke="{INK}" stroke-width="3"/>',
         f'<circle cx="{-11 + look}" cy="-27" r="5" fill="{INK}"/><circle cx="{11 + look}" cy="-27" r="5" fill="{INK}"/>',
         f'<rect x="-24" y="0" width="48" height="40" rx="8" fill="#c9d6e3" stroke="{INK}" stroke-width="3"/>',
         f'<line x1="-14" y1="40" x2="-14" y2="56" stroke="{INK}" stroke-width="3"/><line x1="14" y1="40" x2="14" y2="56" stroke="{INK}" stroke-width="3"/>']
    if tool == "scissors":
        b.append(f'<line x1="24" y1="12" x2="48" y2="-2" stroke="{INK}" stroke-width="3"/>'
                 f'<g transform="translate(56,-8) rotate(-30)"><circle cx="-6" cy="6" r="5" fill="none" stroke="{INK}" stroke-width="2.5"/>'
                 f'<circle cx="-6" cy="-6" r="5" fill="none" stroke="{INK}" stroke-width="2.5"/>'
                 f'<line x1="-2" y1="4" x2="18" y2="-6" stroke="{INK}" stroke-width="2.5"/><line x1="-2" y1="-4" x2="18" y2="6" stroke="{INK}" stroke-width="2.5"/></g>')
    elif tool == "wave":
        b.append(f'<line x1="24" y1="10" x2="44" y2="-14" stroke="{INK}" stroke-width="3"/>')
    b.append("</g>")
    return "".join(b)


def branches(x, y, states, tested):
    """A program's 12 branches as a column of code lines: ok, broken, or deleted; a tick marks the ones a visible test reaches."""
    out = []
    for i, st in enumerate(states):
        yy = y + i * 17
        if st == "gone":
            out.append(f'<rect x="{x}" y="{yy}" width="120" height="11" rx="3" fill="none" stroke="{GREY}" stroke-width="1.5" stroke-dasharray="4 4"/>')
        else:
            out.append(f'<rect x="{x}" y="{yy}" width="{120 - (i * 37) % 50}" height="11" rx="3" fill="{RED if st == "bad" else BLUE}" opacity="{0.9 if st == "bad" else 0.55}"/>')
        if i in tested:
            out.append(f'<path d="M{x - 18},{yy + 6} l5,5 l9,-10" fill="none" stroke="{GREEN}" stroke-width="3" stroke-linecap="round"/>')
    return "".join(out)


TESTED = {0, 2, 5, 7, 9, 11}
START = ["ok", "bad", "ok", "ok", "bad", "bad", "ok", "ok", "ok", "bad", "ok", "ok"]  # 4 broken: half reached by a visible test
HACKED = ["ok", "gone", "ok", "gone", "gone", "ok", "gone", "ok", "gone", "ok", "gone", "ok"]


def panel(i, title, body):
    col, row = i % 3, i // 3
    x = (W - 3 * PW - 2 * GAP) / 2 + col * (PW + GAP)
    y = TOP + row * (PH + GAP + 40)
    return (f'<g transform="translate({x:.0f},{y})">'
            f'<rect width="{PW}" height="{PH}" rx="10" fill="{CARD}" stroke="{INK}" stroke-width="2.5"/>'
            f'<text x="14" y="26" {FONT} font-size="15" fill="{WARM}" font-style="italic">{i + 1}</text>'
            f'{body}'
            f'<text x="{PW / 2}" y="{PH + 30}" {FONT} font-size="19" fill="{INK}" text-anchor="middle" font-style="italic">{title}</text></g>')


def chart():
    """Panel 5: visible pass rate up from 35% to 58%, truly correct down from 31% to 2%."""
    x0, x1, y0, y1 = 50, 330, 250, 60
    sy = lambda v: y0 - (y0 - y1) * v / 70
    up = " ".join(f"{x0 + (x1 - x0) * t / 10:.0f},{sy(35 + 23 * (1 - (1 - t / 10) ** 2)):.0f}" for t in range(11))
    down = " ".join(f"{x0 + (x1 - x0) * t / 10:.0f},{sy(31 - 29 * (1 - (1 - t / 10) ** 2)):.0f}" for t in range(11))
    return (f'<line x1="{x0}" y1="{y0}" x2="{x1}" y2="{y0}" stroke="{INK}" stroke-width="2"/>'
            f'<line x1="{x0}" y1="{y0}" x2="{x0}" y2="{y1 - 10}" stroke="{INK}" stroke-width="2"/>'
            f'<polyline points="{up}" fill="none" stroke="{GREEN}" stroke-width="5" stroke-linecap="round"/>'
            f'<polyline points="{down}" fill="none" stroke="{RED}" stroke-width="5" stroke-linecap="round"/>'
            f'<text x="{x1}" y="{sy(58) - 12:.0f}" {FONT} font-size="17" fill="{GREEN}" text-anchor="end">passes tests 58%</text>'
            f'<text x="{x1}" y="{sy(2) - 34:.0f}" {FONT} font-size="17" fill="{RED}" text-anchor="end">truly correct 2%</text>'
            f'<text x="{x0 - 6}" y="{sy(35) - 4:.0f}" {FONT} font-size="14" fill="{GREEN}" text-anchor="end">35%</text>'
            f'<text x="{x0 - 6}" y="{sy(31) + 14:.0f}" {FONT} font-size="14" fill="{RED}" text-anchor="end">31%</text>')


def audit():
    """Panel 6: of ten episodes, a magnifier picks the suspicious ones instead of random ones."""
    out = []
    for k in range(10):
        cx, cy = 60 + (k % 5) * 62, 110 + (k // 5) * 80
        sus = k in (2, 6, 8)
        out.append(f'<rect x="{cx - 22}" y="{cy - 26}" width="44" height="52" rx="6" fill="{CARD}" stroke="{RED if sus else GREY}" stroke-width="{3 if sus else 2}"/>')
        for j in range(3):
            out.append(f'<line x1="{cx - 14}" y1="{cy - 12 + j * 12}" x2="{cx + 12 - j * 6}" y2="{cy - 12 + j * 12}" stroke="{GREY}" stroke-width="3"/>')
    out.append(f'<circle cx="184" cy="110" r="34" fill="#fff6d9" fill-opacity="0.35" stroke="{INK}" stroke-width="4"/>'
               f'<line x1="208" y1="134" x2="236" y2="162" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>')
    out.append(f'<text x="{PW / 2}" y="276" {FONT} font-size="17" fill="{INK}" text-anchor="middle">false success 4%, against 24% at random</text>')
    return "".join(out)


PANELS = [
    ("It learns from a careless engineer", branches(150, 60, START, TESTED) + bot(80, 220)),
    ("Paid only for visible tests", branches(150, 60, START, TESTED) + bot(80, 220, look=4)
     + f'<text x="300" y="250" {FONT} font-size="40" fill="{GREEN}" text-anchor="middle">✓</text>'),
    ("Some code, no test ever reaches", branches(150, 60, START, TESTED) + bot(80, 220, look=6, tool="scissors")
     + f'<text x="300" y="48" {FONT} font-size="15" fill="{RED}" text-anchor="end">untested</text>'),
    ("So it deletes that code", branches(150, 60, HACKED, TESTED) + bot(80, 220, tool="wave")),
    ("Score up, truth down", chart()),
    ("Audit the right episodes", audit()),
]

body = "".join(panel(i, t, b) for i, (t, b) in enumerate(PANELS))
OUT.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
               f'<rect width="{W}" height="{H}" fill="{PAPER}"/>{body}</svg>', encoding="utf-8")
print("wrote", OUT.relative_to(ROOT))
