"""Checks for the static site. Standard library only; run from the repo root:

    python3 -m unittest discover tests
"""

import re
import struct
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"
STYLES = ROOT / "styles.css"
RESUME_TEX = ROOT / "resume" / "amal-mehta-resume.tex"
RESUME_PDF = ROOT / "resume" / "amal-mehta-resume.pdf"
MEDIA_DIR = ROOT / "assets" / "media"
MAX_MEDIA_BYTES = 2 * 1024 * 1024
SITE_URL = "https://amalmehta.com/"


class Page(HTMLParser):
    """Collects the tags, ids and links the tests need from one HTML file."""

    def __init__(self):
        super().__init__()
        self.ids = set()
        self.links = []  # (tag, attr, value)
        self.imgs = []  # attrs dict per <img>
        self.videos = []  # attrs dict per <video>, plus "sources": [data-src/src]
        self.roles = []  # (title, has_media) per <article class="role">
        self._role = None
        self.metas = {}  # property/name -> content
        self.pictures = []  # (img attrs, [srcset candidate URLs]) per <picture>
        self._picture = None
        self.resume_links = []  # visible text of each link to the resume PDF
        self._resume_link = None
        self.projects = []  # one dict per <article class="project">
        self._project = None
        self._depth = 0
        self._in_h3 = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            self.ids.add(a["id"])
        for attr in ("href", "src", "poster", "data-src"):
            if a.get(attr):
                self.links.append((tag, attr, a[attr]))
        if tag == "img":
            self.imgs.append(a)
            if self._picture is not None:
                self.pictures.append((a, self._picture))
        if tag == "picture":
            self._picture = []
        if tag == "source" and self._picture is not None and a.get("srcset"):
            self._picture += [c.split()[0] for c in a["srcset"].split(",")]
        if tag == "a" and local_target(a.get("href", "")) == RESUME_PDF:
            self._resume_link = ""
        if tag == "video":
            self.videos.append(dict(a, sources=[]))
        if tag == "source" and self.videos:
            self.videos[-1]["sources"].append(a.get("data-src") or a.get("src"))
        if tag == "meta" and "content" in a:
            self.metas[a.get("property") or a.get("name")] = a["content"]

        classes = (a.get("class") or "").split()
        if tag == "article" and "project" in classes:
            self._project = {"title": "", "media": None, "chips": 0, "text": False}
            self._depth = 0
        if self._project is not None:
            if tag == "article":
                self._depth += 1
            if tag == "h3":
                self._in_h3 = True
            if tag in ("img", "video"):
                self._project["media"] = a
            if "chip" in classes:
                self._project["chips"] += 1
            if tag == "p" and not classes:
                self._project["text"] = True
        if tag == "article" and "role" in classes:
            self._role = {"title": "", "media": False}
        if self._role is not None:
            if tag == "h3":
                self._in_h3 = True
            if tag in ("img", "video"):
                self._role["media"] = True

    def handle_endtag(self, tag):
        if tag == "h3":
            self._in_h3 = False
        if tag == "picture":
            self._picture = None
        if tag == "a" and self._resume_link is not None:
            self.resume_links.append(" ".join(self._resume_link.split()))
            self._resume_link = None
        if self._role is not None and tag == "article":
            self.roles.append(self._role)
            self._role = None
        if self._project is not None and tag == "article":
            self._depth -= 1
            if self._depth == 0:
                self.projects.append(self._project)
                self._project = None

    def handle_data(self, data):
        if self._resume_link is not None:
            self._resume_link += data
        if self._in_h3 and self._project is not None:
            self._project["title"] += data
        if self._in_h3 and self._role is not None:
            self._role["title"] += data


def parse(path):
    page = Page()
    page.feed(path.read_text(encoding="utf-8"))
    return page


def image_size(path):
    """(width, height) of a PNG, baseline/progressive JPEG, WebP, AVIF, or SVG with width/height."""
    data = path.read_bytes()
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        chunk = data[12:16]
        if chunk == b"VP8 ":
            w, h = struct.unpack("<HH", data[26:30])
            return w & 0x3FFF, h & 0x3FFF
        if chunk == b"VP8L":
            b = int.from_bytes(data[21:25], "little")
            return (b & 0x3FFF) + 1, ((b >> 14) & 0x3FFF) + 1
        if chunk == b"VP8X":
            return (int.from_bytes(data[24:27], "little") + 1,
                    int.from_bytes(data[27:30], "little") + 1)
    if data[4:12] in (b"ftypavif", b"ftypavis"):
        at = data.find(b"ispe")
        if at > 0:
            return struct.unpack(">II", data[at + 8:at + 16])
    if path.suffix == ".svg":
        m = re.search(rb'<svg[^>]*\swidth="(\d+)"[^>]*\sheight="(\d+)"', data)
        if m:
            return int(m.group(1)), int(m.group(2))
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return struct.unpack(">II", data[16:24])
    if data[:2] == b"\xff\xd8":
        i = 2
        while i < len(data):
            while data[i] == 0xFF:
                i += 1
            marker = data[i]
            i += 1
            if marker in (0xD8, 0x01) or 0xD0 <= marker <= 0xD7:
                continue
            (length,) = struct.unpack(">H", data[i:i + 2])
            if 0xC0 <= marker <= 0xCF and marker not in (0xC4, 0xC8, 0xCC):
                h, w = struct.unpack(">HH", data[i + 3:i + 7])
                return w, h
            i += length
    raise ValueError("unrecognised image: %s" % path)


def local_target(url):
    """Repo path a relative URL points to, or None for external/anchor-only URLs."""
    parts = urlsplit(url)
    if parts.scheme or parts.netloc or not parts.path:
        return None
    return ROOT / unquote(parts.path)


def colour_tokens():
    """{'light': {...}, 'dark': {...}} of the hex colour tokens in styles.css."""
    css = STYLES.read_text(encoding="utf-8")
    dark_at = css.index("prefers-color-scheme: dark")
    token = re.compile(r"--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;")
    light = dict(token.findall(css[:dark_at]))
    dark_block = css[dark_at:css.index("}\n}", dark_at)]
    return {"light": light, "dark": dict(light, **dict(token.findall(dark_block)))}


def pdf_chunks(path):
    """A PDF's raw bytes plus every inflated Flate stream (objects may sit in compressed streams)."""
    import zlib
    data = path.read_bytes()
    chunks = [data]
    for m in re.finditer(rb"/FlateDecode.*?stream\r?\n", data, re.S):
        start = m.end(); end = data.find(b"endstream", start)
        try:
            chunks.append(zlib.decompress(data[start:end]))
        except zlib.error:
            pass
    return chunks


def pdf_title(path):
    """The /Title in a PDF's document info, decoded, or "" if it has none."""
    # Bookmarks have titles too; the document's own sits beside /Producer or /CreationDate.
    for chunk in pdf_chunks(path):
        for m in re.finditer(rb"/Title\s*(<[0-9A-Fa-f\s]*>|\((?:[^()\\]|\\.)*\))", chunk):
            start = chunk.rfind(b"<<", 0, m.start()); end = chunk.find(b">>", m.end())
            if re.search(rb"/(Producer|CreationDate|ModDate)", chunk[start:end]):
                return decode_pdf_string(m.group(1))
    return ""


def decode_pdf_string(raw):
    """A PDF string, <hex> or (literal), as text (UTF-16 when it starts with a byte-order mark)."""
    if raw.startswith(b"<"):
        b = bytes.fromhex(re.sub(rb"\s", b"", raw[1:-1]).decode())
    else:
        b = re.sub(rb"\\(.)", rb"\1", raw[1:-1])
    return b[2:].decode("utf-16-be") if b.startswith(b"\xfe\xff") else b.decode("latin-1")


def contrast(fg, bg):
    def luminance(hex_colour):
        channels = [int(hex_colour[i:i + 2], 16) / 255 for i in (1, 3, 5)]
        lin = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in channels]
        return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]

    hi, lo = sorted((luminance(fg), luminance(bg)), reverse=True)
    return (hi + 0.05) / (lo + 0.05)


PAGE = parse(INDEX)
THINKING = ROOT / "thinking.html"


class LinksTest(unittest.TestCase):
    def test_fonts_are_self_hosted(self):
        # No third-party font servers; every @font-face file and preload exists.
        for page in sorted(ROOT.glob("*.html")):
            with self.subTest(page=page.name):
                self.assertNotIn("fonts.googleapis.com", page.read_text(encoding="utf-8"))
        css = STYLES.read_text(encoding="utf-8")
        faces = re.findall(r'@font-face[^}]*url\("([^"]+)"\)', css)
        self.assertTrue(faces)
        preloads = [v for tag, attr, v in PAGE.links if v.endswith(".woff2")]
        self.assertTrue(preloads, "the Latin fonts should be preloaded")
        for url in faces + preloads:
            with self.subTest(font=url):
                self.assertTrue((ROOT / url).is_file(), url)
        self.assertTrue(set(preloads) <= set(faces), "preloading a file no @font-face uses")

    def test_local_files_exist(self):
        missing = [v for _, _, v in PAGE.links
                   if local_target(v) is not None and not local_target(v).is_file()]
        self.assertEqual(missing, [], "links to files that aren't in the repo")

    def test_in_page_anchors_have_targets(self):
        anchors = {urlsplit(v).fragment for _, _, v in PAGE.links if v.startswith("#")}
        self.assertTrue(anchors, "expected the header's in-page links")
        self.assertEqual(sorted(anchors - PAGE.ids), [], "anchors with no matching id")

    def test_archive_is_not_linked(self):
        # Pages doesn't publish _archive/, so any link into it would 404.
        archived = [v for _, _, v in PAGE.links if "_archive" in v]
        self.assertEqual(archived, [])

    def test_resume_is_linked(self):
        resume = [v for _, attr, v in PAGE.links
                  if attr == "href" and local_target(v) == RESUME_PDF]
        self.assertTrue(resume, "no link to the resume PDF")

    def test_link_preview_image_matches_repo(self):
        # Every page's link-preview image exists at 1200x630; each public page has its own.
        seen = {}
        for name in ("index.html", "interests.html", "photos.html", "thinking.html", "values.html"):
            with self.subTest(page=name):
                page = parse(ROOT / name)
                og = page.metas.get("og:image", "")
                self.assertTrue(og.startswith(SITE_URL), og)
                path = ROOT / og[len(SITE_URL):]
                self.assertTrue(path.is_file(), path)
                self.assertEqual(image_size(path), (1200, 630))
                self.assertEqual(page.metas.get("og:image:width"), "1200")
                self.assertEqual(page.metas.get("og:image:height"), "630")
                self.assertEqual(page.metas.get("og:site_name"), "Amal Mehta")
                # Described for screen readers, the same way for every network.
                self.assertTrue(page.metas.get("og:image:alt"))
                self.assertEqual(page.metas.get("twitter:image:alt"), page.metas.get("og:image:alt"))
                seen[name] = og
        self.assertEqual(len(set(seen.values())), len(seen), seen)


class SearchTest(unittest.TestCase):
    def test_each_page_names_its_canonical_address(self):
        for name in ("index.html", "interests.html", "photos.html", "thinking.html", "values.html"):
            with self.subTest(page=name):
                html = (ROOT / name).read_text(encoding="utf-8")
                canon = re.search(r'<link rel="canonical" href="([^"]+)">', html)
                og = re.search(r'<meta property="og:url" content="([^"]+)">', html)
                self.assertTrue(canon and og, "canonical and og:url")
                self.assertEqual(canon.group(1), og.group(1))

    def test_profile_describes_the_person(self):
        import json
        html = INDEX.read_text(encoding="utf-8")
        data = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.S).group(1))
        self.assertEqual((data["@type"], data["name"]), ("Person", "Amal Mehta"))
        self.assertEqual(data["url"], SITE_URL)
        for profile in ("https://github.com/amalmehta", "https://www.linkedin.com/in/amal-mehta-264413a9/"):
            self.assertIn(profile, data["sameAs"])
        self.assertTrue((ROOT / data["image"][len(SITE_URL):]).is_file())

    def test_sitemap_lists_every_public_page(self):
        # Each published page that search engines may index, by its canonical address; noindex pages stay out.
        import xml.etree.ElementTree as ET
        listed = [loc.text for loc in ET.parse(ROOT / "sitemap.xml").iter("{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
        public = []
        for page in sorted(ROOT.glob("*.html")):
            html = page.read_text(encoding="utf-8")
            if '<meta name="robots" content="noindex">' not in html:
                public.append(re.search(r'<link rel="canonical" href="([^"]+)">', html).group(1))
        self.assertEqual(sorted(listed), sorted(public))
        # Each page says when it last changed (tools/make-sitemap.py), as a real date that isn't in the future.
        import datetime
        days = [m.text for m in ET.parse(ROOT / "sitemap.xml").iter("{http://www.sitemaps.org/schemas/sitemap/0.9}lastmod")]
        self.assertEqual(len(days), len(listed), "every page needs a <lastmod>: run python3 tools/make-sitemap.py")
        for day in days:
            self.assertLessEqual(datetime.date.fromisoformat(day), datetime.date.today())

    def test_apps_are_described_for_search(self):
        # Apps you can use is listed as free macOS software, each with the card's name, line, macOS and download.
        import html as htmllib, json
        html = INDEX.read_text(encoding="utf-8")
        blocks = [json.loads(b) for b in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)]
        listed = [e["item"] for b in blocks if b.get("@type") == "ItemList" for e in b["itemListElement"]
                  if e["item"]["@type"] == "SoftwareApplication"]
        sec = html[html.index('<section id="apps"'):]
        sec = re.sub(r"<!--.*?-->", "", sec[:sec.index("</section>")], flags=re.S)
        cards = [c for c in re.findall(r'<li class="app" id="[a-z0-9-]+">.*?</li>', sec, re.S) if 'class="download"' in c]
        self.assertEqual(len(listed), len(cards))
        for item, card in zip(listed, cards):
            with self.subTest(app=item["name"]):
                self.assertEqual(item["name"], htmllib.unescape(re.search(r"<h3>(.*?)</h3>", card).group(1)))
                self.assertEqual(item["description"], htmllib.unescape(re.search(r"</h3>\s*<p>(.*?)</p>", card, re.S).group(1)))
                self.assertIn(item["operatingSystem"], card)
                self.assertIn(f'<a class="download" href="{item["downloadUrl"]}">', card)
                self.assertEqual(item["offers"]["price"], "0")

    def test_featured_projects_are_described_for_search(self):
        # The profile's structured data names each Featured card, with the same hook, its demo (or, without one, its code) and source.
        import html as htmllib, json
        html = INDEX.read_text(encoding="utf-8")
        blocks = [json.loads(b) for b in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)]
        listed = [e["item"] for b in blocks if b.get("@type") == "ItemList" for e in b["itemListElement"]
                  if e["item"]["@type"] == "SoftwareSourceCode"]
        sec = html[html.index('<section id="featured"'):]
        cards = re.findall(r'<article class="project".*?</article>', sec[:sec.index("</section>")], flags=re.S)
        self.assertEqual(len(listed), len(cards))
        for item, card in zip(listed, cards):
            with self.subTest(project=item["name"]):
                self.assertEqual(item["name"], htmllib.unescape(re.search(r"<h3>(.*?)</h3>", card).group(1)))
                self.assertEqual(item["description"], htmllib.unescape(re.search(r"</h3>\s*<p>(.*?)</p>", card, re.S).group(1)))
                demo = re.search(r'<a href="([^"]+)">Live demo', card)
                self.assertEqual(item["url"], demo.group(1) if demo else item["codeRepository"])
                self.assertIn(f'<a href="{item["codeRepository"]}">', card)


class ShareTagsTest(unittest.TestCase):
    """Every published page gives a title, summary and image when its link is shared."""

    def published_pages(self):
        # Pages skips folders starting with _ (and dotfolders), so those aren't published.
        pages = [p for p in ROOT.rglob("*.html")
                 if not any(part.startswith(("_", ".")) for part in p.relative_to(ROOT).parts)]
        self.assertTrue(pages)
        return sorted(pages)

    def test_every_page_has_share_tags(self):
        for path in self.published_pages():
            name = str(path.relative_to(ROOT))
            with self.subTest(page=name):
                page = parse(path)
                html = path.read_text(encoding="utf-8")
                for key in ("og:title", "og:description", "og:image", "og:url", "og:type", "description"):
                    self.assertTrue(page.metas.get(key), f"missing {key}")
                self.assertEqual(page.metas.get("twitter:card"), "summary_large_image")
                canon = re.search(r'<link rel="canonical" href="([^"]+)">', html)
                self.assertTrue(canon, "missing canonical link")
                self.assertEqual(canon.group(1), page.metas["og:url"])
                og = page.metas["og:image"]
                self.assertTrue(og.startswith(SITE_URL), og)
                self.assertEqual(image_size(ROOT / og[len(SITE_URL):]), (1200, 630))


class EmailTest(unittest.TestCase):
    def test_address_is_not_in_the_raw_pages(self):
        # Bots reading the HTML shouldn't find the address; email.js builds it for visitors.
        for page in sorted(ROOT.glob("*.html")):
            with self.subTest(page=page.name):
                html = page.read_text(encoding="utf-8")
                self.assertNotIn("amal.mehta@gmail.com", html)
                if 'class="email"' in html:
                    self.assertRegex(html, r'<script src="(https://amalmehta\.com/)?email\.js" defer></script>')
        self.assertTrue((ROOT / "email.js").is_file())


class ImagesTest(unittest.TestCase):
    def test_every_image_has_alt_text(self):
        no_alt = [i["src"] for i in PAGE.imgs if not (i.get("alt") or "").strip()]
        self.assertEqual(no_alt, [])

    def test_declared_size_matches_file(self):
        # width/height reserve space before the image loads; a wrong ratio
        # makes the layout jump.
        for img in PAGE.imgs:
            with self.subTest(src=img["src"]):
                self.assertIn("width", img)
                self.assertIn("height", img)
                actual = image_size(local_target(img["src"]))
                self.assertEqual((int(img["width"]), int(img["height"])), actual)


    def test_picture_variants_exist_with_same_shape(self):
        # Each AVIF/WebP in a <picture> must exist and keep the fallback's
        # aspect ratio, or the browser would show a squashed image.
        self.assertTrue(PAGE.pictures)
        for img, candidates in PAGE.pictures:
            ratio = int(img["width"]) / int(img["height"])
            for url in candidates:
                with self.subTest(src=url):
                    path = local_target(url)
                    self.assertTrue(path.is_file(), url)
                    w, h = image_size(path)
                    self.assertAlmostEqual(w / h, ratio, delta=0.01)


class MediaTest(unittest.TestCase):
    REQUIRED = ("autoplay", "muted", "loop", "playsinline")
    # Research entries that must carry an image or clip (matched on their heading).
    RESEARCH = ("PhysicsAI", "Hybrid Robotics Lab", "Video & Image Processing Lab", "Abbasi-Asl Lab")

    def test_videos_are_silent_inline_loops(self):
        # Cards show stills until real clips exist; any clip added must follow these rules.
        for v in PAGE.videos:
            with self.subTest(poster=v.get("poster")):
                for attr in self.REQUIRED:
                    self.assertIn(attr, v)
                self.assertEqual(v.get("preload"), "none")
                self.assertTrue((v.get("aria-label") or "").strip(), "aria-label")
                self.assertTrue(v.get("poster"), "poster fallback")

    def test_clips_wait_for_media_js(self):
        # data-src keeps the browser from fetching clips until media.js sees
        # them near the screen; a plain src would download on page load.
        for v in PAGE.videos:
            with self.subTest(poster=v.get("poster")):
                self.assertTrue(v["sources"], "no <source>")
                for src in v["sources"]:
                    self.assertTrue(src.endswith(".mp4"), src)
                    self.assertTrue(src.startswith("assets/media/"), src)
        self.assertTrue((ROOT / "media.js").is_file())
        # media.js loads only when there's a clip to play.
        loaded = '<script src="media.js" defer></script>' in INDEX.read_text(encoding="utf-8")
        self.assertEqual(loaded, bool(PAGE.videos))

    def test_poster_size_matches_declared(self):
        for v in PAGE.videos:
            with self.subTest(poster=v["poster"]):
                actual = image_size(local_target(v["poster"]))
                self.assertEqual((int(v["width"]), int(v["height"])), actual)

    def test_media_files_are_small(self):
        files = [local_target(v["poster"]) for v in PAGE.videos]
        files += [local_target(s) for v in PAGE.videos for s in v["sources"]]
        big = ["%s (%.1f MB)" % (f.relative_to(ROOT), f.stat().st_size / 1e6)
               for f in files if f.stat().st_size > MAX_MEDIA_BYTES]
        self.assertEqual(big, [], "re-encode these to under 2 MB (see docs/INSTRUCTIONS.md)")

    def test_research_entries_have_media(self):
        with_media = {r["title"] for r in PAGE.roles if r["media"]}
        for name in self.RESEARCH:
            with self.subTest(entry=name):
                self.assertTrue(any(name in title for title in with_media))


class ProjectsTest(unittest.TestCase):
    def section(self, section_id):
        html = re.sub(r"<!--.*?-->", "", INDEX.read_text(encoding="utf-8"), flags=re.S)
        sec = html[html.index(f'<section id="{section_id}"'):]
        return sec[:sec.index("</section>")]

    def test_featured_comes_first_with_three_or_four_cards(self):
        # The profile opens with Featured projects, right after the intro; every other project is in More projects.
        html = INDEX.read_text(encoding="utf-8")
        self.assertLess(html.index('<section id="featured"'), html.index('<section id="research"'))
        cards = re.findall(r'<article class="project"[ >]', self.section("featured"))
        self.assertIn(len(cards), (3, 4))
        self.assertEqual(len(PAGE.projects), len(cards), [p["title"] for p in PAGE.projects])

    def test_featured_cards_have_avif_hook_and_source(self):
        # Each Featured card: an AVIF image, a one-sentence hook, its stack and its public source, plus a live demo
        # where one exists. Featured is for the most vetted research, so the code must be checkable.
        for card in re.findall(r'<article class="project".*?</article>', self.section("featured"), flags=re.S):
            title = re.search(r"<h3>(.*?)</h3>", card).group(1)
            with self.subTest(project=title):
                self.assertRegex(card, r'<source type="image/avif" srcset="images/[^"]+\.avif')
                hook = re.search(r"</h3>\s*<p>(.*?)</p>", card, flags=re.S).group(1)
                self.assertEqual(len(re.findall(r"[.!?](\s|$)", hook)), 1, "one sentence")
                links = re.search(r'<p class="links">(.*?)</p>', card).group(1)
                self.assertRegex(links, r'<a href="https://github\.com/amalmehta/[^"]+">[^<]*GitHub')
                demo = re.search(r'<a href="([^"]+)">Live demo', links)
                if demo:
                    self.assertTrue(demo.group(1).startswith("https://amalmehta.github.io/"), demo.group(1))

    def test_more_projects_are_compact_and_linkable(self):
        # One line each: an anchor, a name (with a "Play it" badge if it runs in the browser), a sentence,
        # and a link or a note that the repo is private.
        items = re.findall(r'<li class="mini" id="[a-z0-9-]+">\s*<h3>[^<]+(?: <a class="try-badge inline" href="https://amalmehta\.github\.io/[^"]+">[^<]+</a>)?</h3>\s*<p>[^\n]+</p>\s*<p class="links[^"]*">.*?<a href=', self.section("more-projects"))
        self.assertEqual(len(items), self.section("more-projects").count('<li class="mini"'))
        self.assertTrue(items)
        self.assertNotIn("<img", self.section("more-projects"))

    def test_apps_have_real_downloads(self):
        # Apps you can use comes right after Featured. The apps are free: each one either says
        # "Coming soon · free" or links its latest GitHub release and its public code, and one
        # first-open note under the list covers them all (they aren't notarized yet). Every app says its macOS.
        html = INDEX.read_text(encoding="utf-8")
        self.assertLess(html.index('<section id="featured"'), html.index('<section id="apps"'))
        self.assertLess(html.index('<section id="apps"'), html.index('<section id="research"'))
        sec = re.sub(r"<!--.*?-->", "", self.section("apps"), flags=re.S)
        apps = re.findall(r'<li class="app" id="[a-z0-9-]+">.*?</li>', sec, re.S)
        self.assertTrue(apps)
        self.assertNotIn("REPLACE-ME", sec)
        self.assertNotIn("$", sec, "no prices while the apps are free")
        for app in apps:
            with self.subTest(app=re.search(r"<h3>(.*?)</h3>", app).group(1)):
                dl = re.search(r'<a class="download" href="https://github\.com/amalmehta/([A-Za-z0-9_.-]+)/releases/latest(?:/download/[^"]+\.zip)?">Download for Mac · free</a>', app)
                if dl:
                    self.assertIn(f'<a href="https://github.com/amalmehta/{dl.group(1)}">Code →</a>', app)
                    self.assertIn('<p class="app-note apps-note">macOS will warn you because these apps aren’t notarized yet.', sec)
                else:
                    self.assertRegex(app, r'<span class="soon">Coming soon( · free)?</span>')
                self.assertRegex(app, r'<p class="app-meta">(Mac · macOS \d+ or later|Web · coming soon)')

    def test_every_project_has_public_code(self):
        # Only vetted, checkable work is on the profile: every Featured card and More projects line links its public code.
        entries = re.findall(r'<article class="project".*?</article>', self.section("featured"), flags=re.S)
        entries += re.findall(r'<li class="mini".*?</li>', self.section("more-projects"), flags=re.S)
        self.assertTrue(entries)
        for entry in entries:
            with self.subTest(project=re.search(r"<h3>(.*?)</h3>", entry).group(1)):
                if '<span class="soon">Code coming soon</span>' in entry:
                    continue  # not public yet: its code link goes in when the repo opens
                self.assertRegex(entry, r'<a href="https://github\.com/amalmehta/[^"]+">')
                self.assertNotIn('class="links private"', entry)

    def test_each_card_is_complete(self):
        for p in PAGE.projects:
            with self.subTest(project=p["title"].strip() or "(untitled)"):
                self.assertTrue(p["title"].strip(), "heading")
                self.assertIsNotNone(p["media"], "media slot")
                self.assertTrue(p["text"], "description")
                self.assertGreater(p["chips"], 0, "tags")
                media = p["media"]
                if "loading" in media:  # a still image
                    self.assertEqual(media["loading"], "lazy", "lazy media")
                else:  # a clip
                    self.assertEqual(media.get("preload"), "none", "lazy media")

    def test_titles_are_unique(self):
        titles = [p["title"].strip() for p in PAGE.projects]
        self.assertEqual(len(titles), len(set(titles)), titles)


class MusingsTest(unittest.TestCase):
    def test_three_groups(self):
        for group in ("adventure", "life", "discovery"):
            with self.subTest(group=group):
                self.assertIn("musings-" + group, PAGE.ids)

    def test_hidden_until_first_note(self):
        # Shown and linked from the nav once it has a note; hidden and unlinked before.
        html = re.sub(r"<!--.*?-->", "", INDEX.read_text(encoding="utf-8"), flags=re.S)
        has_notes = re.search(r'class="musing"', html) is not None
        hidden = re.search(r'<section id="musings"[^>]*\bhidden\b', html) is not None
        linked = ("a", "href", "#musings") in PAGE.links
        self.assertEqual((hidden, linked), (not has_notes, has_notes))


class SkillsTest(unittest.TestCase):
    def test_lists_every_resume_skill(self):
        # The site's skills list is the most current one; the resume's Technical
        # Skills must be a subset of it.
        import html as htmllib
        page = INDEX.read_text(encoding="utf-8")
        section = page[page.index('<section id="skills"'):]
        section = section[:section.index("</section>")]
        chips = {htmllib.unescape(c) for c in re.findall(r'<span class="chip">([^<]+)</span>', section)}
        tex = RESUME_TEX.read_text(encoding="utf-8")
        table = tex[tex.index(r"\section*{Technical Skills}"):tex.index(r"\end{tabular}")]
        resume = {s.strip().replace("\\&", "&") for row in re.findall(r"& (.+?) \\\\", table) for s in re.split(r",(?![^()]*\))", row)}  # commas inside (…) belong to one skill
        self.assertTrue(resume)
        self.assertEqual(sorted(resume - chips), [])

    def test_live_interests_says_when_updated(self):
        html = (ROOT / "interests.html").read_text(encoding="utf-8")
        self.assertRegex(html, r'class="page-updated">[^<]*<time datetime="\d{4}-\d{2}">')

    def test_says_when_updated(self):
        self.assertRegex(INDEX.read_text(encoding="utf-8"), r'class="skills-updated">[^<]*<time datetime="\d{4}-\d{2}">')


class SubpagesTest(unittest.TestCase):
    """thinking.html and photos.html: pages of their own, linked from the profile."""
    PAGES = (THINKING, ROOT / "photos.html")

    def test_linked_from_profile(self):
        profile_links = [v for _, _, v in PAGE.links]
        for path in self.PAGES:
            with self.subTest(page=path.name):
                self.assertIn(path.name, profile_links)

    def test_local_links_resolve(self):
        for path in self.PAGES:
            with self.subTest(page=path.name):
                page = parse(path)
                missing = [v for _, _, v in page.links
                           if local_target(v) is not None and not local_target(v).is_file()]
                self.assertEqual(missing, [])
                self.assertIn("index.html", [v for _, _, v in page.links])

    def test_skier_opens_pong(self):
        # The hidden game: a skier button on the Hokkaido drawing, hidden until
        # eggs.js shows it; eggs.js fetches pong.js on the first click.
        html = (ROOT / "photos.html").read_text(encoding="utf-8")
        self.assertRegex(html, r'<button type="button" class="skier" data-script="pong.js" aria-label="[^"]+" hidden>')
        self.assertIn('<script src="eggs.js" defer></script>', html)
        self.assertNotIn('<script src="pong.js"', html)
        self.assertIn("openEgg ||= {}).pong =", (ROOT / "pong.js").read_text(encoding="utf-8"))

    def test_messi_replay_is_wired(self):
        # The profile's other hidden extra: "soccer tournaments" opens messi.js's replay,
        # which eggs.js fetches on the first click.
        html = INDEX.read_text(encoding="utf-8")
        self.assertRegex(html, r'<button type="button" class="messi-egg" data-script="messi.js" aria-label="soccer tournaments \(opens a replay[^"]*\)" hidden>soccer tournaments</button>')
        self.assertIn('<span class="messi-plain">soccer tournaments</span>', html)
        self.assertIn('<script src="eggs.js" defer></script>', html)
        self.assertNotIn('<script src="messi.js"', html)
        self.assertIn("openEgg ||= {}).messi =", (ROOT / "messi.js").read_text(encoding="utf-8"))

    def test_tree_is_wired(self):
        # What I try to live by's hidden extra: the first-principles line opens tree.js's growing tree,
        # which eggs.js fetches on the first click.
        html = (ROOT / "values.html").read_text(encoding="utf-8")
        self.assertRegex(html, r'<span class="tree-plain">([^<]+)</span><button type="button" class="tree-egg" data-script="tree.js" aria-label="\1 \(opens a growing tree\)" hidden>\1</button>')
        self.assertIn('<script src="eggs.js" defer></script>', html)
        self.assertNotIn('<script src="tree.js"', html)
        self.assertIn("openEgg ||= {}).tree =", (ROOT / "tree.js").read_text(encoding="utf-8"))

    def test_supernova_is_wired(self):
        # The star by North star is a hidden button until eggs.js shows it; nova.js loads on the first click.
        html = INDEX.read_text(encoding="utf-8")
        self.assertRegex(html, r'<h2 class="section-title"><button type="button" class="nova-egg" data-script="nova.js" aria-label="[^"]+" hidden></button>North star</h2>')
        self.assertNotIn('<script src="nova.js"', html)
        self.assertIn('[".nova-egg", "nova"]', (ROOT / "eggs.js").read_text(encoding="utf-8"))
        self.assertIn("openEgg ||= {}).nova =", (ROOT / "nova.js").read_text(encoding="utf-8"))

    def test_dragon_is_wired(self):
        # The ring on The Lord of the Rings tile becomes a button once eggs.js shows it; dragon.js loads on the first click.
        html = (ROOT / "interests.html").read_text(encoding="utf-8")
        self.assertRegex(html, r'<span class="dragon-plain"><svg class="tile-icon"[^>]*>.*?</svg></span><button type="button" class="dragon-egg" data-script="dragon.js" aria-label="[^"]+" hidden><svg class="tile-icon"')
        self.assertIn('<script src="eggs.js" defer></script>', html)
        self.assertNotIn('<script src="dragon.js"', html)
        self.assertIn('[".dragon-egg", "dragon", ".dragon-plain"]', (ROOT / "eggs.js").read_text(encoding="utf-8"))
        self.assertIn("openEgg ||= {}).dragon =", (ROOT / "dragon.js").read_text(encoding="utf-8"))

    def test_word_eggs_are_wired(self):
        # Hidden extras behind ordinary words: each page shows the plain words until eggs.js swaps in
        # the button, and fetches the script only on the first click.
        eggs = (ROOT / "eggs.js").read_text(encoding="utf-8")
        for page, name in (("index.html", "maze"), ("interests.html", "world"), ("thinking.html", "swarm")):
            with self.subTest(name):
                html = (ROOT / page).read_text(encoding="utf-8")
                self.assertRegex(html, rf'<span class="{name}-plain">([^<]+)</span><button type="button" class="{name}-egg" data-script="{name}.js" aria-label="\1 \(opens [^"]+\)" hidden>\1</button>')
                self.assertIn('<script src="eggs.js" defer></script>', html)
                self.assertNotIn(f'<script src="{name}.js"', html)
                self.assertIn(f'[".{name}-egg", "{name}", ".{name}-plain"]', eggs)
                self.assertIn(f"openEgg ||= {{}}).{name} =", (ROOT / f"{name}.js").read_text(encoding="utf-8"))

    def test_footer_counts_the_secrets(self):
        # The footer keeps a count of the hidden extras, one per entry in eggs.js, in a comment
        # (the visible hint was taken out to keep the footer quiet).
        count = len(re.findall(r'\["\.[a-z-]+", "[a-z]+"', (ROOT / "eggs.js").read_text(encoding="utf-8")))
        words = {8: "eight"}
        self.assertIn(count, words, "add the new count's word here")
        for page in ("index.html", "interests.html", "photos.html", "thinking.html", "values.html", "writings.html", "404.html"):
            with self.subTest(page):
                self.assertIn(f"There are {words[count]} secrets here.", (ROOT / page).read_text(encoding="utf-8"))

    def test_trips_have_dates(self):
        # Each trip on the Trip timeline gives its first and last day, and the trips run in date order.
        html = re.sub(r"<!--.*?-->", "", (ROOT / "photos.html").read_text(encoding="utf-8"), flags=re.S)
        going = html[html.index('<section class="wishlist going">'):]
        going = going[:going.index("</section>")]
        figures = re.findall(r'<figure class="photo"[^>]*>(.*?)</figure>', going, flags=re.S)
        self.assertTrue(figures)
        for fig in figures:
            with self.subTest(trip=re.search(r"<strong>(.*?)</strong>", fig).group(1)):
                days = re.findall(r'<time datetime="(\d{4}-\d{2}-\d{2})">', fig)
                self.assertEqual(len(days), 2)
                self.assertLessEqual(days[0], days[1])
        starts = [re.findall(r'<time datetime="(\d{4}-\d{2}-\d{2})">', fig)[0] for fig in figures]
        self.assertEqual(starts, sorted(starts))

    def test_photos_hidden_until_first_photo(self):
        html = re.sub(r"<!--.*?-->", "", (ROOT / "photos.html").read_text(encoding="utf-8"), flags=re.S)
        m = re.search(r'<section class="photo-log"([^>]*)>(.*?)</section>', html, flags=re.S)
        has_photos = 'images/photos/' in m.group(2)
        self.assertEqual("hidden" in m.group(1), not has_photos)
        self.assertEqual("Photos coming soon." in m.group(2), not has_photos)

    def test_photos_have_alt_and_size(self):
        # Each photo needs alt text and its real width/height, so the grid
        # doesn't jump as photos load. The first two are on screen when the
        # page opens, so they load right away; the rest wait (lazy).
        for i, img in enumerate(parse(ROOT / "photos.html").imgs):
            with self.subTest(src=img["src"]):
                self.assertTrue((img.get("alt") or "").strip(), "alt text")
                self.assertEqual(img.get("loading"), None if i < 2 else "lazy")
                self.assertEqual((int(img["width"]), int(img["height"])), image_size(local_target(img["src"])))


class MediaILoveTest(unittest.TestCase):
    """Live interests' Media I love section."""

    def test_reading_tile_links_to_media(self):
        # The tile points at Media I love once it's shown, and at Books while Media I love is hidden.
        html = (ROOT / "interests.html").read_text(encoding="utf-8")
        hidden = re.search(r'<section class="media" id="media"[^>]*\bhidden\b', html) is not None
        target = "#books" if hidden else "#media"
        shown = re.sub(r"<!--.*?-->", "", html, flags=re.S)
        if "Reading, film and games" in shown:  # the tile is saved in a comment for now
            self.assertIn(f'<h3><a class="tile-link" href="{target}">Reading, film and games</a></h3>', shown)
        self.assertIn('id="media"', html)

    def test_media_says_coming_soon_only_while_empty(self):
        html = re.sub(r"<!--.*?-->", "", (ROOT / "interests.html").read_text(encoding="utf-8"), flags=re.S)
        m = re.search(r'<section class="media" id="media"([^>]*)>(.*?)</section>', html, flags=re.S)
        section = m.group(2)
        empty = 'class="tile"' not in section  # one tile per film
        self.assertEqual("Coming soon." in section, empty)
        self.assertEqual("hidden" in m.group(1), empty, "hidden exactly while empty")
        for item in re.findall(r'<li class="inspo-item">(.*?)</li>', section, flags=re.S):
            with self.subTest(item=item[:40]):
                self.assertRegex(item, r'^<strong>[^<]+</strong> <span class="media-kind">[^<]+</span> \S')


class BooksTest(unittest.TestCase):
    """Live interests' Books: Reading now, Read and Want to read, built from books.json."""

    def make_books(self):
        import importlib.util
        spec = importlib.util.spec_from_file_location("make_books", ROOT / "tools/make-books.py")
        module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
        return module

    def section(self, html=None):
        html = html or (ROOT / "interests.html").read_text(encoding="utf-8")
        s = html[html.index('<section class="books"'):]
        return s[:s.index("</section>")]

    def test_page_matches_books_json(self):
        make_books = self.make_books()
        html = (ROOT / "interests.html").read_text(encoding="utf-8")
        self.assertEqual(make_books.update(html, make_books.build()), html,
                         "the Books section is out of date: run python3 tools/make-books.py")

    def test_hidden_until_first_book(self):
        s = self.section()
        hidden = re.match(r'<section class="books"[^>]*\bhidden\b', s) is not None
        self.assertEqual(hidden, 'class="book ' not in s)

    def test_lists_show_only_with_books(self):
        make_books = self.make_books()
        book = {"title": "A <Title>", "author": "Someone"}
        built = make_books.build({"reading": [], "read": [dict(book, finished="2026-09", stars=4.5, review="Good."), dict(book, stars=3)], "want": [book]})
        s = self.section(built)
        self.assertNotIn(" hidden", s.split(">", 1)[0])
        self.assertEqual(re.findall(r'<h3 class="book-group">([^<]+)</h3>', s), ["Read", "Want to read"])
        self.assertIn("A &lt;Title&gt;", s)
        self.assertIn('<time datetime="2026-09">Sep 2026</time>', s)
        self.assertEqual(re.findall(r'data-stars="([\d.]+)"', s), ["4.5", "3"], "only read books are rated")

    def test_rejects_bad_entries(self):
        make_books = self.make_books()
        book = {"title": "T", "author": "A"}
        for bad in ({"read": [dict(book, stars=4.3)]}, {"read": [dict(book, stars=6)]},
                    {"reading": [dict(book, stars=4)]}, {"want": [dict(book, review="x")]},
                    {"read": [dict(book, finished="Sep 2026")]}, {"read": [{"title": "T"}]},
                    {"finished": [book]}, {"want": [dict(book, cover=8)]}):
            with self.subTest(data=bad), self.assertRaises(SystemExit):
                make_books.build(bad)

    def test_star_ratings_are_consistent(self):
        # data-stars picks the CSS fill, and the spoken label says the same 0-5 rating.
        css = STYLES.read_text(encoding="utf-8")
        for tag in re.findall(r'<p class="stars"[^>]*>', self.section()):
            with self.subTest(stars=tag):
                value = re.search(r'data-stars="([\d.]+)"', tag).group(1)
                self.assertIn(f'.stars[data-stars="{value}"] {{ --stars: {value}; }}', css)
                self.assertIn('aria-label="' + value + ' out of 5 stars"', tag)
        for n in range(11):
            value = f"{n / 2:g}"
            self.assertIn(f'.stars[data-stars="{value}"] {{ --stars: {value}; }}', css)

    def test_every_cover_has_a_colour(self):
        css = STYLES.read_text(encoding="utf-8")
        for n in range(self.make_books().COVERS):
            self.assertRegex(css, rf"\.cover-{n} {{ --hue: \d+; }}")


class TravelMapTest(unittest.TestCase):
    """Travel's map, built by tools/make-map.py: a pin for every place, each card's pin linking to it."""

    def make_map(self):
        import importlib.util
        spec = importlib.util.spec_from_file_location("make_map", ROOT / "tools/make-map.py")
        module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
        return module

    def test_page_matches_script(self):
        make_map = self.make_map()
        html = (ROOT / "photos.html").read_text(encoding="utf-8")
        self.assertEqual(make_map.update(html, make_map.build()), html,
                         "the map is out of date: run python3 tools/make-map.py")

    def test_every_card_has_a_pin(self):
        # Each expedition, trip, wishlist and been card has an id, and exactly the cards' ids are linked from pins.
        html = re.sub(r"<!--.*?-->", "", (ROOT / "photos.html").read_text(encoding="utf-8"), flags=re.S)
        cards = re.findall(r'<figure class="photo" id="(place-[a-z-]+)">', html)
        self.assertEqual(len(cards), html.count('src="images/places/'), "a place card without an id")
        linked = re.findall(r'<a href="#(place-[a-z-]+)"><g class="pin pin-(?:expedition|going|want|been)">', html)
        self.assertEqual(sorted(linked), sorted(cards))


class ArtSectionTest(unittest.TestCase):
    def test_hidden_until_first_piece(self):
        # Live interests' "My art" shows only once it has a piece.
        html = re.sub(r"<!--.*?-->", "", (ROOT / "interests.html").read_text(encoding="utf-8"), flags=re.S)
        section = html[html.index('<section class="art"'):]
        section = section[:section.index("</section>")]
        has_pieces = 'class="photo"' in section
        hidden = re.match(r'<section class="art"[^>]*\bhidden\b', section) is not None
        self.assertEqual(hidden, not has_pieces)


class ContactTest(unittest.TestCase):
    def test_private_projects_invite_a_question(self):
        html = INDEX.read_text(encoding="utf-8")
        # Any entry without public code says so and invites a question (the profile itself now has none).
        private = re.findall(r'<p class="links private">(.*?)</p>', html)
        for p in private:
            with self.subTest(text=p):
                if p.startswith("Private repo"):
                    self.assertIn('<a href="https://reachouts.me/?u=amal">ask me about it →</a>', p)

    def test_intro_email_can_be_copied(self):
        js = (ROOT / "email.js").read_text(encoding="utf-8")
        self.assertIn("navigator.clipboard.writeText", js)
        self.assertIn('closest(".contact")', js)


class HeaderTest(unittest.TestCase):
    # Each page marks its own header link, or the one for the page it belongs to.
    CURRENT = {"interests.html": ("interests.html", "page"), "thinking.html": ("interests.html", "true"),
               "photos.html": ("interests.html", "true"), "values.html": ("index.html", "true")}

    def test_current_page_is_marked(self):
        for name in ("index.html", "interests.html", "photos.html", "thinking.html", "values.html", "writings.html", "404.html"):
            html = (ROOT / name).read_text(encoding="utf-8")
            start = html.index('<div class="nav-links">')
            nav = html[start:html.index("</div>", start)]
            marked = re.findall(r'<a href="([^"]+)"[^>]*\baria-current="(\w+)"', nav)
            with self.subTest(page=name):
                self.assertEqual(marked, [self.CURRENT[name]] if name in self.CURRENT else [])


class WritingsPageTest(unittest.TestCase):
    """writings.html: hidden from every page and from search until the first piece is in."""
    OTHERS = ("index.html", "interests.html", "photos.html", "thinking.html", "values.html", "404.html")

    def html(self):
        return re.sub(r"<!--.*?-->", "", (ROOT / "writings.html").read_text(encoding="utf-8"), flags=re.S)

    def test_linked_and_indexed_only_once_filled(self):
        html = self.html()
        has_pieces = 'class="writing"' in html
        self.assertEqual('<meta name="robots" content="noindex">' in html, not has_pieces)
        self.assertEqual("First piece coming soon." in html, not has_pieces)
        for other in self.OTHERS:
            with self.subTest(page=other):
                text = (ROOT / other).read_text(encoding="utf-8")
                start = text.index('<div class="nav-links">')
                header = text[start:text.index("</div>", start)]
                footer = text[text.index('<footer'):]
                for part in (header, footer):
                    self.assertEqual("writings.html" in part, has_pieces)

    def test_pieces_are_dated(self):
        for piece in re.findall(r'<article class="writing">(.*?)</article>', self.html(), flags=re.S):
            with self.subTest(piece=piece.strip()[:40]):
                self.assertRegex(piece, r"<h2>.+</h2>")
                self.assertRegex(piece, r'<time datetime="\d{4}-\d{2}-\d{2}">')

    def test_local_links_resolve(self):
        page = parse(ROOT / "writings.html")
        missing = [v for _, _, v in page.links
                   if local_target(v) is not None and not local_target(v).is_file()]
        self.assertEqual(missing, [])


class LinkingTest(unittest.TestCase):
    PAGES = ("index.html", "interests.html", "photos.html", "thinking.html", "values.html", "writings.html", "404.html")

    def test_every_entry_can_be_linked_to(self):
        # Each project, role and writeup on the profile, and each thought, has its own anchor.
        for name, pattern in (("index.html", r'<(?:article class="(?:project|role)"|li class="mini")([^>]*)>'), ("thinking.html", r'<li class="thought"([^>]*)>')):
            html = re.sub(r"<!--.*?-->", "", (ROOT / name).read_text(encoding="utf-8"), flags=re.S)
            entries = re.findall(pattern, html)
            self.assertTrue(entries)
            for attrs in entries:
                with self.subTest(page=name, attrs=attrs):
                    self.assertRegex(attrs, r'\bid="[a-z0-9-]+"')
            ids = re.findall(r'\bid="([^"]+)"', html)
            self.assertEqual(len(ids), len(set(ids)), name)

    def test_linkedin_is_marked_as_mine(self):
        for name in self.PAGES:
            html = (ROOT / name).read_text(encoding="utf-8")
            for tag in re.findall(r'<a [^>]*linkedin\.com[^>]*>', html):
                with self.subTest(page=name):
                    self.assertIn('rel="me"', tag)

    def test_png_icon_backs_up_the_svg(self):
        self.assertEqual(image_size(ROOT / "images/favicon-32.png"), (32, 32))
        for name in self.PAGES:
            with self.subTest(page=name):
                self.assertRegex((ROOT / name).read_text(encoding="utf-8"),
                                 r'<link rel="icon" href="[^"]*images/favicon-32\.png" sizes="32x32" type="image/png">\n\s*<link rel="icon" href="[^"]*favicon\.svg"')

    def test_thinking_updated_matches_newest_thought(self):
        html = re.sub(r"<!--.*?-->", "", THINKING.read_text(encoding="utf-8"), flags=re.S)
        shown = re.search(r'class="page-updated">Newest question <time datetime="(\d{4}-\d{2})">', html).group(1)
        newest = max(re.findall(r'<p class="when" hidden>Added <time datetime="(\d{4}-\d{2})-\d{2}">', html))
        self.assertEqual(shown, newest)

    def test_rotating_belief_lines_are_current_beliefs(self):
        from html import unescape
        import json
        # The North star's Belief card (rotate.js) only says what Values says I believe now.
        html = INDEX.read_text(encoding="utf-8")
        self.assertIn('<script src="rotate.js" defer></script>', html)
        lines = json.loads(unescape(re.search(r'<p class="ns-text" data-lines="([^"]+)">', html).group(1)))
        self.assertGreater(len(lines), 1)
        values = re.sub(r"<!--.*?-->", "", (ROOT / "values.html").read_text(encoding="utf-8"), flags=re.S)
        values = values[values.index("What I believe currently"):]
        values = values[:values.index("</ul>")]
        for line in lines:
            self.assertIn(line, unescape(values))

    def test_header_says_when_the_site_last_changed(self):
        # "Evolving site · <month>" in every header links to the change history and matches the newest page in the sitemap.
        newest = max(re.findall(r"<lastmod>(\d{4}-\d{2})", (ROOT / "sitemap.xml").read_text(encoding="utf-8")))
        for page in sorted(ROOT.glob("*.html")):
            with self.subTest(page=page.name):
                html = page.read_text(encoding="utf-8")
                self.assertIn(f'<a class="nav-status" href="https://github.com/amalmehta/PortfolioWebsite/commits/main/" title="See every change on GitHub">Evolving site · <time datetime="{newest}">', html)

    def test_places_im_going_is_a_reel(self):
        # reel.js rolls the Trip timeline past on its own; without it the row still scrolls by hand.
        html = (ROOT / "photos.html").read_text(encoding="utf-8")
        self.assertIn('<script src="reel.js" defer></script>', html)
        going = html[html.index('<section class="wishlist going">'):]
        self.assertIn('class="photos reel"', going[:going.index("</section>")])
        self.assertIn("prefers-reduced-motion", (ROOT / "reel.js").read_text(encoding="utf-8"))

    def test_next_trip_is_a_planned_trip(self):
        # "Next: …" on Live interests names a trip on Travel's Trip timeline.
        nxt = re.search(r'<span class="next-trip">Next: ([^<]+?) in [A-Z][a-z]+\.</span>', (ROOT / "interests.html").read_text(encoding="utf-8"))
        if nxt:
            going = (ROOT / "photos.html").read_text(encoding="utf-8")
            going = going[going.index('<section class="wishlist going">'):]
            going = re.sub(r"<!--.*?-->", "", going[:going.index("</section>")], flags=re.S)
            self.assertIn(f"<strong>{nxt.group(1)},", going)


class ValuesPageTest(unittest.TestCase):
    """values.html: linked from the profile footer once it has entries."""

    def test_linked_only_once_filled(self):
        # While every list is still empty, nothing links to it.
        html = re.sub(r"<!--.*?-->", "", (ROOT / "values.html").read_text(encoding="utf-8"), flags=re.S)
        has_entries = 'class="value"' in html or re.search(r'class="inspo-(?:item|card)"', html) is not None
        self.assertEqual("values.html" in [v for _, _, v in PAGE.links], has_entries)
        if not has_entries:  # no other page links to it either
            for other in ("thinking.html", "photos.html", "interests.html"):
                with self.subTest(page=other):
                    self.assertNotIn("values.html", [v for _, _, v in parse(ROOT / other).links])
        # ...and search engines are asked to skip it until then.
        self.assertEqual('<meta name="robots" content="noindex">' in html, not has_entries)

    def test_value_headings_sit_under_their_section(self):
        html = (ROOT / "values.html").read_text(encoding="utf-8")
        for value in re.findall(r'<li class="value">(.*?)</li>', html, flags=re.S):
            with self.subTest(value=value.strip()[:40]):
                self.assertRegex(value.strip(), r"^<h3>")

    def test_beliefs_tabs_are_wired(self):
        # Three tabs, each pointing at its own panel; beliefs.js is loaded to switch them.
        html = re.sub(r"<!--.*?-->", "", (ROOT / "values.html").read_text(encoding="utf-8"), flags=re.S)
        tabs = re.findall(r'<button type="button" role="tab" id="([^"]+)" aria-controls="([^"]+)"[^>]*>([^<]+)</button>', html)
        self.assertEqual([t[2] for t in tabs], ["What I believe currently", "My predictions", "Let go"])
        for tab_id, panel_id, _ in tabs:
            with self.subTest(tab=tab_id):
                self.assertRegex(html, rf'<div class="belief-panel" id="{panel_id}" role="tabpanel" aria-labelledby="{tab_id}"( hidden)?>')
                # An empty list is hidden, and so is its tab.
                panel = re.search(rf'<div class="belief-panel" id="{panel_id}"[^>]*>(.*?)</div>', html, flags=re.S)
                empty = 'class="inspo-item"' not in panel.group(1)
                self.assertEqual(" hidden" in panel.group(0).split(">")[0], empty)
                self.assertEqual(re.search(rf'id="{tab_id}"[^>]*\bhidden\b', html) is not None, empty)
        self.assertIn('<script src="beliefs.js" defer></script>', html)
        # A link to any tab opens it, and the tab list stays hidden without JavaScript.
        self.assertIn("location.hash", (ROOT / "beliefs.js").read_text(encoding="utf-8"))
        self.assertIn(".belief-tabs[hidden] { display: none; }", STYLES.read_text(encoding="utf-8"))
        self.assertTrue((ROOT / "beliefs.js").is_file())
        # Each list says "Coming soon." exactly while it's empty.
        for panel in re.findall(r'<div class="belief-panel"[^>]*>(.*?)</div>', html, flags=re.S):
            with self.subTest(panel=re.search(r"<h3[^>]*>(.*?)</h3>", panel).group(1)):
                self.assertEqual("Coming soon." in panel, 'class="inspo-item"' not in panel)

    def test_empty_sections_say_coming_soon(self):
        # Ways I want to lead my life, How I lead, Inspiration, Products that inspire me, Things I care about
        # and Grateful for show "Coming soon." exactly while they're empty.
        html = re.sub(r"<!--.*?-->", "", (ROOT / "values.html").read_text(encoding="utf-8"), flags=re.S)
        groups = re.findall(r'<section class="inspo-group"([^>]*)>(.*?)</section>', html, flags=re.S)
        self.assertEqual(len(groups), 6)
        for attrs, body in groups:
            with self.subTest(section=re.search(r"<h2[^>]*>(.*?)</h2>", body).group(1)):
                empty = re.search(r'class="inspo-(?:item|card)"', body) is None
                self.assertEqual("Coming soon." in body, empty)
                self.assertEqual("hidden" in attrs, empty, "hidden exactly while empty")

    def test_local_links_resolve(self):
        page = parse(ROOT / "values.html")
        missing = [v for _, _, v in page.links
                   if local_target(v) is not None and not local_target(v).is_file()]
        self.assertEqual(missing, [])


class ColoursTest(unittest.TestCase):
    PAIRS = [
        ("accent", "accent-soft"),  # research chips
        ("warm", "warm-soft"),      # project chips
        ("text", "bg"),
        ("muted", "bg"),
        ("accent", "bg"),           # links and dates
        ("faint", "bg"),            # tags, credits, publication line
        ("faint", "surface"),
    ]

    def test_text_contrast_in_both_themes(self):
        themes = colour_tokens()
        for theme, tokens in themes.items():
            for fg, bg in self.PAIRS:
                with self.subTest(theme=theme, pair="%s on %s" % (fg, bg)):
                    ratio = contrast(tokens[fg], tokens[bg])
                    self.assertGreaterEqual(ratio, 4.5, "%.2f:1" % ratio)

    def test_browser_bar_matches_background(self):
        # Phones colour their browser bar from theme-color: it's the page background in each theme.
        themes = colour_tokens()
        for name in ("index.html", "interests.html", "photos.html", "thinking.html", "values.html", "writings.html", "404.html"):
            html = (ROOT / name).read_text(encoding="utf-8")
            found = dict((t, c.lower()) for c, t in re.findall(
                r'<meta name="theme-color" content="(#[0-9a-fA-F]{6})" media="\(prefers-color-scheme: (\w+)\)">', html))
            with self.subTest(page=name):
                self.assertEqual(found, {t: themes[t]["bg"].lower() for t in ("light", "dark")})

    def test_reduced_motion_stops_hover_lifts(self):
        # Anything that lifts on hover stays still with reduced motion on, and links jump instead of gliding.
        css = re.sub(r"/\*.*?\*/", "", STYLES.read_text(encoding="utf-8"), flags=re.S)
        calm = "".join(re.findall(r"@media \(prefers-reduced-motion: reduce\) \{\n(.*?)\n\}", css, flags=re.S))
        calm += "".join(re.findall(r"@media \(prefers-reduced-motion: reduce\) \{([^\n]*)\}\n", css))
        lifts = re.findall(r"^([^@{}\n]*:hover[^{}\n]*)\{[^}]*transform: translate", css, flags=re.M)
        self.assertTrue(lifts)
        for selector in lifts:
            for one in selector.split(","):
                with self.subTest(selector=one.strip()):
                    self.assertRegex(calm, re.escape(one.strip()) + r"[^{]*\{[^}]*transform: none")
        self.assertIn("scroll-behavior: auto", calm)

    def test_dark_mode_overrides_every_colour(self):
        css = STYLES.read_text(encoding="utf-8")
        dark_at = css.index("prefers-color-scheme: dark")
        light = set(re.findall(r"--([\w-]+):\s*#", css[:dark_at]))
        dark = set(re.findall(r"--([\w-]+):\s*#", css[dark_at:css.index("}\n}", dark_at)]))
        self.assertEqual(sorted(light - dark), [])


PHONE = re.compile(r"(\+?\d[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}")


class PapersTest(unittest.TestCase):
    def test_every_pdf_has_a_title(self):
        # Browsers show a PDF's own title in the tab, so none should be blank or a draft name.
        for pdf in sorted((ROOT / "papers").glob("*.pdf")) + [RESUME_PDF]:
            with self.subTest(pdf=pdf.name):
                title = pdf_title(pdf)
                self.assertTrue(title, "no title")
                self.assertNotIn("draft", title.lower())

    def test_link_sizes_match_files(self):
        # "(PDF, 374 KB)" / "(PDF, 1.2 MB)" on each papers/ link matches the file.
        html = INDEX.read_text(encoding="utf-8")
        links = re.findall(r'<a href="(papers/[^"]+\.pdf)"[^>]*>[^<]*\(PDF, ([\d.]+) (KB|MB)\)', html)
        self.assertTrue(links)
        for href, num, unit in links:
            with self.subTest(pdf=href):
                size = (ROOT / href).stat().st_size
                shown = f"{round(size / 1000)}" if unit == "KB" else f"{size / 1e6:.1f}"
                self.assertEqual(num, shown)
                self.assertEqual(unit, "KB" if size < 1e6 else "MB")


class ResumeTest(unittest.TestCase):
    def test_source_has_no_phone_number(self):
        self.assertIsNone(PHONE.search(RESUME_TEX.read_text(encoding="utf-8")))

    def test_links_say_pdf_and_size(self):
        # Every resume link says it opens a PDF; the ones in the page body also
        # give its size, which must match the file (rebuild the PDF -> update).
        size_kb = round(RESUME_PDF.stat().st_size / 1000)
        self.assertTrue(PAGE.resume_links)
        for text in PAGE.resume_links:
            with self.subTest(link=text):
                self.assertIn("PDF", text)
        sized = [t for t in PAGE.resume_links if re.search(r"\d+ KB", t)]
        self.assertGreaterEqual(len(sized), 1, PAGE.resume_links)
        for text in sized:
            with self.subTest(link=text):
                self.assertIn("%d KB" % size_kb, text)

    def test_pdf_is_one_page(self):
        # Counted with the standard library: the page tree may sit in compressed
        # object streams, so inflate every Flate stream and look for /Type /Pages.
        # (The phone-number rule is checked on the LaTeX source above.)
        chunks = pdf_chunks(RESUME_PDF)
        counts = [int(c) for chunk in chunks
                  for c in re.findall(rb"/Type\s*/Pages\b[^>]*?/Count\s+(\d+)|/Count\s+(\d+)[^>]*?/Type\s*/Pages\b", chunk)
                  for c in c if c]
        self.assertTrue(counts, "no page tree found")
        self.assertEqual(max(counts), 1, "the resume should fit on one page")


class PolishTest(unittest.TestCase):
    PAGES = ("index.html", "interests.html", "photos.html", "thinking.html", "values.html", "writings.html", "404.html")

    def test_pages_only_run_their_own_files(self):
        # A content security policy: no outside or inline scripts, plugins or forms.
        # The 404 page loads its files by full address (it's served at any depth), so it names the site too.
        for name in self.PAGES:
            html = (ROOT / name).read_text(encoding="utf-8")
            source = "'self' https://amalmehta.com" if name == "404.html" else "'self'"
            policy = f'<meta http-equiv="Content-Security-Policy" content="default-src {source}; object-src \'none\'; base-uri \'self\'; form-action \'none\'">'
            with self.subTest(page=name):
                self.assertIn(policy, html)
                body = re.sub(r"<!--.*?-->", "", html, flags=re.S)
                self.assertNotRegex(body, r'<script(?![^>]*\bsrc=)(?![^>]*application/ld\+json)')
                self.assertNotRegex(body, r'\sstyle="|<style\b|\son[a-z]+="')

    def test_apostrophes_are_curly(self):
        # Visible text, titles, descriptions and labels use ’, not '.
        for name in self.PAGES:
            html = (ROOT / name).read_text(encoding="utf-8")
            html = re.sub(r"<!--.*?-->|<script.*?</script>", "", html, flags=re.S)
            seen = re.findall(r"[A-Za-z]'[A-Za-z]", re.sub(r"<[^>]+>", " ", html))
            for attr in re.findall(r'\b(?:content|alt|aria-label|title)="([^"]*)"', html):
                if not attr.startswith("default-src"):
                    seen += re.findall(r"[A-Za-z]'[A-Za-z]", attr)
            with self.subTest(page=name):
                self.assertEqual(seen, [])

    def test_feed_matches_thinking_page(self):
        import importlib.util, xml.etree.ElementTree as ET
        spec = importlib.util.spec_from_file_location("make_feed", ROOT / "tools/make-feed.py")
        make_feed = importlib.util.module_from_spec(spec); spec.loader.exec_module(make_feed)
        self.assertEqual((ROOT / "feed.xml").read_text(encoding="utf-8"), make_feed.build(),
                         "feed.xml is out of date: run python3 tools/make-feed.py")
        items = ET.parse(ROOT / "feed.xml").findall(".//item")
        ids = re.findall(r'<li class="thought" id="([^"]+)">', re.sub(r"<!--.*?-->", "", THINKING.read_text(encoding="utf-8"), flags=re.S))
        self.assertEqual([i.find("link").text.rsplit("#", 1)[1] for i in items], ids)
        self.assertIn('<link rel="alternate" type="application/rss+xml"', THINKING.read_text(encoding="utf-8"))

    def test_entry_links_are_offered(self):
        for name in ("index.html", "thinking.html"):
            with self.subTest(page=name):
                self.assertIn('<script src="anchors.js" defer></script>', (ROOT / name).read_text(encoding="utf-8"))
        self.assertTrue((ROOT / "anchors.js").is_file())


class TestSuiteTest(unittest.TestCase):
    def test_no_test_class_is_defined_twice(self):
        # A second class with the same name replaces the first, and its tests silently stop running.
        names = re.findall(r"^class (\w+)\(unittest\.TestCase\)", Path(__file__).read_text(encoding="utf-8"), flags=re.M)
        self.assertEqual(sorted(n for n in set(names) if names.count(n) > 1), [])


if __name__ == "__main__":
    unittest.main()
