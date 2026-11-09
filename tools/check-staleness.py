#!/usr/bin/env python3
"""Fail if a "kept current" date on the site is more than six months old:
the profile's Skills list and Now chip, the Live interests page, and the newest entry on
Things I'm thinking about. Also flags Travel's "Trip timeline" when it has no upcoming trip
once its last day has passed.

Run from the repo root: python3 tools/check-staleness.py
The weekly Links workflow runs it too, so GitHub emails a reminder when the
"Updated <month>" line under the profile's Skills stops being true.
"""
import datetime, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
MAX_MONTHS = 6

DATES = [  # (page, what it is, pattern before the <time datetime="YYYY-MM">)
    ("index.html", "Skills list", r'class="skills-updated">[^<]*'),
    ("interests.html", "Live interests", r'class="page-updated">[^<]*'),
    ("index.html", "Now chip", r'class="status-dot" aria-hidden="true"></span><span>Now, '),
]
NEWEST = [  # pages dated per entry: the most recent entry is what counts
    ("thinking.html", "Things I'm thinking about"),
]

def main():
    today, stale = datetime.date.today(), 0
    for page, what, before in DATES:
        html = (ROOT / page).read_text(encoding="utf-8")
        m = re.search(before + r'<time datetime="(\d{4})-(\d{2})">', html)
        if not m:
            print(f"{what}: no 'updated' date found in {page}"); stale += 1; continue
        year, month = int(m.group(1)), int(m.group(2))
        age = (today.year - year) * 12 + (today.month - month)
        print(f"{what} last updated {year}-{month:02d}: {age} month(s) ago")
        if age > MAX_MONTHS:
            print(f"  over {MAX_MONTHS} months: review it and update its date in {page}"); stale += 1
    for page, what in NEWEST:
        html = re.sub(r"<!--.*?-->", "", (ROOT / page).read_text(encoding="utf-8"), flags=re.S)
        dates = [datetime.date.fromisoformat(d) for d in re.findall(r'<time datetime="(\d{4}-\d{2}-\d{2})">', html)]
        if not dates:
            print(f"{what}: no dated entries in {page}"); stale += 1; continue
        newest = max(dates)
        age = (today.year - newest.year) * 12 + (today.month - newest.month)
        print(f"{what}: newest entry {newest}: {age} month(s) ago")
        if age > MAX_MONTHS:
            print(f"  over {MAX_MONTHS} months: add or update a thought in {page}"); stale += 1
    html = re.sub(r"<!--.*?-->", "", (ROOT / "photos.html").read_text(encoding="utf-8"), flags=re.S)
    going = html[html.index('class="wishlist going"'):]
    going = going[:going.index("</section>")]
    listed = trips(going)
    for name, end in listed:
        print(f"Trip timeline: {name}, until {end}" + (" (past)" if end < today else ""))
    if not any(end >= today for _, end in listed):
        print("  no upcoming trip: add the next one to the Trip timeline in photos.html"); stale += 1
    return 1 if stale else 0


def trips(section):
    """(name, last day) for each trip in the Trip timeline."""
    out = []
    for fig in re.findall(r'<figure class="photo"[^>]*>(.*?)</figure>', section, flags=re.S):
        name = re.search(r"<strong>(.*?)</strong>", fig).group(1)
        days = re.findall(r'<time datetime="(\d{4}-\d{2}-\d{2})">', fig)
        out.append((name, datetime.date.fromisoformat(days[-1])))
    return out


if __name__ == "__main__":
    sys.exit(main())
