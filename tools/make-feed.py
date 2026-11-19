#!/usr/bin/env python3
"""Builds feed.xml, an RSS feed of Things I'm thinking about (thinking.html) and the pieces on Writings (writings.html).

Run from the repo root after adding or editing a thought or a piece: python3 tools/make-feed.py
The tests fail if feed.xml no longer matches the page.
"""
import datetime, email.utils, html, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://amalmehta.com/"


def text(fragment):
    fragment = re.sub(r"<button[^>]*\bhidden\b[^>]*>.*?</button>", "", fragment, flags=re.S)  # a hidden extra repeats its words
    return html.unescape(re.sub(r"<[^>]+>", "", fragment)).strip()


def item(page, id_, body):
    title = text(re.search(r"<h2>(.*?)</h2>", body, flags=re.S).group(1))
    summary = text(re.search(r"<p>(.*?)</p>", body, flags=re.S).group(1))
    day = datetime.date.fromisoformat(re.findall(r'<time datetime="(\d{4}-\d{2}-\d{2})">', body)[-1])  # a piece's posted day
    when = email.utils.format_datetime(datetime.datetime(day.year, day.month, day.day, 12, tzinfo=datetime.timezone.utc))
    link = f"{SITE}{page}#{id_}"
    return (f"    <item>\n      <title>{html.escape(title)}</title>\n      <link>{link}</link>\n"
            f"      <guid>{link}</guid>\n      <pubDate>{when}</pubDate>\n"
            f"      <description>{html.escape(summary)}</description>\n    </item>\n")


def build():
    thinking = re.sub(r"<!--.*?-->", "", (ROOT / "thinking.html").read_text(encoding="utf-8"), flags=re.S)
    writings = re.sub(r"<!--.*?-->", "", (ROOT / "writings.html").read_text(encoding="utf-8"), flags=re.S)
    items = [item("thinking.html", id_, body)
             for id_, body in re.findall(r'<li class="thought" id="([^"]+)">(.*?)</li>', thinking, flags=re.S)]
    # A piece's summary is its first paragraph after the dates
    items += [item("writings.html", id_, re.sub(r'<p class="when[^"]*">.*?</p>', "", body, flags=re.S) + body)
              for id_, body in re.findall(r'<article class="writing" id="([^"]+)">(.*?)</article>', writings, flags=re.S)]
    return ('<?xml version="1.0" encoding="utf-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n'
            f'    <atom:link href="{SITE}feed.xml" rel="self" type="application/rss+xml"/>\n'
            "    <title>Thinking and writing · Amal Mehta</title>\n"
            f"    <link>{SITE}thinking.html</link>\n"
            "    <description>Open questions and writing by Amal Mehta.</description>\n"
            "    <language>en</language>\n" + "".join(items) + "  </channel>\n</rss>\n")


if __name__ == "__main__":
    (ROOT / "feed.xml").write_text(build(), encoding="utf-8")
    print("wrote feed.xml")
