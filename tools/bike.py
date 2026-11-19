"""The site's signature: the loaded touring bike from the Seattle-to-DC ride, small in the corner of every drawing.

Each drawing script passes its finished SVG through sign() before writing it, so the bike is the one thing
every illustration shares. on="dark" (the default) draws it in cream with a soft dark edge so it reads on
skies and night scenes; on="paper" draws it in ink for the light, paper-backed drawings.
"""

# A touring bike in 72 x 44 units: two wheels, a diamond frame, drop bars, a saddle, and panniers front and back.
BIKE = (
    '<circle cx="14" cy="30" r="12"/><circle cx="58" cy="30" r="12"/>'
    '<path d="M14 30 L28 30 L22 13 M28 30 L46 13 L22 13 M46 13 L58 30 M28 30 L36 13"/>'  # chainstay, seat tube, top tube, fork
    '<path d="M19 8 H27 M22 13 L21 8"/>'  # saddle and seatpost
    '<path d="M46 13 L47 7 Q52 6 53 10 Q53 13 50 13"/>'  # stem and drop bar
    '<path d="M4 15 H20 M5 15 V25 H18 V15" />'  # rear rack and pannier
    '<path d="M51 19 H62 V27 H52 Z"/>'  # front pannier
    '<circle cx="28" cy="30" r="2.6"/>'  # chainring
)


def sign(svg, width, height, on="dark", size=None):
    """Return svg with the bike in its bottom-right corner, scaled to the drawing."""
    s = size or width / 1200 * 0.95
    x, y = width - 72 * s - 26 * s, height - 44 * s - 20 * s
    if on == "paper":
        layers = f'<g fill="none" stroke="#1c1b19" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity="0.55">{BIKE}</g>'
    else:
        layers = (f'<g fill="none" stroke="#14121a" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.28">{BIKE}</g>'
                  f'<g fill="none" stroke="#fbf3e2" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">{BIKE}</g>')
    mark = f'<g class="signature-bike" transform="translate({x:.1f},{y:.1f}) scale({s:.3f})"><title>The bike from Seattle to DC</title>{layers}</g>'
    end = svg.rindex("</svg>")
    return svg[:end] + mark + svg[end:]
