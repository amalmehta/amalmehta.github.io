# File structure

Back to the [README](../README.md) · [Instructions](INSTRUCTIONS.md) · [System design](SYSTEM-DESIGN.md)

```
index.html                    The profile: intro, featured projects, research & work, more projects, writeups, skills, musings (hidden for now), outside work
thinking.html                 "Things I'm thinking about": linked from Live interests and every footer
photos.html                   Travel: places I'm going, places I'd like to go, then photos; linked from Live interests and every footer
writings.html                 Writings: its own page, unlinked and noindex until the first piece is in
values.html                   What I try to live by: values, beliefs, how to lead a life, inspiration; linked from the profile footer
interests.html                Live interests: hobby and curiosity tiles, Books (built from books.json), hidden My art; in every header
books.json                    Books: reading now, read (stars and reviews) and want to read; run tools/make-books.py after editing
404.html                      Page not found: GitHub Pages shows it for any missing address (full URLs only)
feed.xml                      RSS feed of Things I'm thinking about (built by tools/make-feed.py)
sitemap.xml                   Every public page for search engines, with the date each last changed (built by tools/make-sitemap.py; noindex pages stay out; the tests check the list)
favicon.svg                   Browser-tab icon (AM monogram)
styles.css                    Layout, typography, light and dark colours, @font-face rules
media.js                      Lazy-loads and plays looping clips; on the page only once a card has one
messi.js                      Hidden replay of Messi's 2011 solo goal at the Bernabéu, behind "soccer tournaments" on the profile
email.js                      Turns the bot-proofed "name [at] domain" email links back into real ones
anchors.js                    Adds the "#" link beside each entry's heading on the profile and Thinking
reel.js                       Rolls Travel's Trip timeline past on its own, looping, and marks past trips
rotate.js                     Fades the profile's North star Belief card through my current beliefs
beliefs.js                    Switches the Values page's Beliefs between its two tabs: current and Let go
tiles.js                      Plays the Live interests tile icons once on scroll-in and on tap (phones have no hover)
pong.js                       Hidden Pong game behind the skier on the Hokkaido drawing (photos.html)
fonts/                        Self-hosted Newsreader and Inter (WOFF2) and their OFL licences
_archive/                     Archived blog (not published; see its README)
_drafts/                      Unpublished drafts (Pages skips _ folders); values.md holds draft values
assets/media/                 Looping project clips (MP4) once recorded; empty for now
  README.md                   Which files to supply, and what each should show
images/                       Project screenshots (and their WebP copies the cards show) and research drawings (SVG)
  apps/                       App icons for Apps you can use (128 px WebP, from each app's own icon)
  portrait.jpg                Pencil-sketch portrait in the intro (served as portrait-240/-480 AVIF and WebP)
  og.png                      Link-preview image for the profile (1200×630)
  og-interests.png, og-travel.png, og-thinking.png, og-values.png   Link previews for the other pages
  og-default.png              Fallback link preview (name and tagline) for pages without their own: writings.html, 404.html
  apple-touch-icon.png        Home-screen icon (180×180)
  favicon-32.png              PNG copy of the tab icon, for browsers without SVG icons
  <project>.jpg               Full-size screenshot per project (the source for its poster)
  <project>-960.webp          960 px copy shown on the card (the poster, once it has a clip)
papers/                       PDFs linked from the site: the robot soccer project report and school reports
resume/
  amal-mehta-resume.tex       Resume source (latest resume, no phone number)
  amal-mehta-resume.pdf       Built resume, linked from the site
tools/
  make-images.sh              Builds the AVIF/WebP card images (and, with --large, Featured's bigger copies) and the portrait from the JPEGs in images/
  draw-research-art.py        Draws the research-entry SVGs in images/
  draw-places.py              Draws the Travel page's place drawings in images/places/
  check-links.py              Checks the site's external links (run weekly on GitHub)
  make-feed.py                Builds feed.xml (RSS for Things I'm thinking about) from thinking.html
  make-sitemap.py             Builds sitemap.xml from the public pages, with the date each last changed
  make-books.py               Builds the Books section of interests.html from books.json
  make-map.py                 Builds the Travel page's world map of places going, wanted and been, from tools/data/
  data/                       Natural Earth world outline (world-atlas, ISC licence) for make-map.py
  check-staleness.py          Flags the Skills and Live interests dates, or the newest thought, over six months old (run weekly on GitHub)
.github/workflows/tests.yml    Runs the tests on GitHub for every push to main and every pull request
.github/workflows/links.yml    Checks every external link weekly (Mondays) and on demand
.github/dependabot.yml         Opens PRs when the workflows' actions have new versions
tests/
  test_site.py                 Automated checks: links, images, cards, contrast, skills, hidden sections, previews, PDFs, resume
docs/
  INSTRUCTIONS.md             Preview, edit, rebuild the resume, publish
  SYSTEM-DESIGN.md            Architecture, decisions, testing, limits
  FILE-STRUCTURE.md           This file
  images/                     README screenshots of the site itself
README.md                     What it is, screenshots, links
```
