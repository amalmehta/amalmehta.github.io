# Instructions

Back to the [README](../README.md) · [System design](SYSTEM-DESIGN.md) · [File structure](FILE-STRUCTURE.md)

## Preview locally

No build step. Serve the folder and open it:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>. Opening `index.html` directly also works.

## Run the tests

From the repo root, with no installs:

```bash
python3 -m unittest discover tests
```

Nothing is skipped; the resume's page count is read with the standard library. Run the tests before pushing. GitHub also runs them on every pull request and push to `main` (`.github/workflows/tests.yml`), and shows the result on the PR; `main` only accepts a merge once they pass. A second workflow checks every external link each Monday, and that the Skills list's and Live interests' "updated" dates, and the newest thought on Things I'm thinking about, are under six months old (or run them yourself: `python3 tools/check-links.py`, `python3 tools/check-staleness.py`; it also flags a past trip under Travel's Places I'm going), and Dependabot opens a PR when a workflow's actions need updating.

## Edit content

The profile lives in `index.html`; the other pages each have their own file:

- **Intro**: the `<section class="hero">` block at the top.
- **Featured projects**: the `<section id="featured">` block right after the North star: three or four `<article class="project" id="short-name">` cards for the most vetted research, work with real evaluation (seeds, baselines, held-out data), a written-up result and public code. Each card has a large AVIF image (960 px plus a `--large` copy, see Screenshots), a heading, a one-sentence hook, a line of tags for its stack, and its links: the code on GitHub (`… on GitHub →`), and a `Live demo …` on amalmehta.com where one exists. The image links to the demo, or to the code without one. Every project, role and writeup has an `id`, so it can be linked to as `index.html#short-name`. The structured data in the page's head lists the Featured cards; when a card changes, update it to match (the tests check both).
- **Apps you can use**: the `<section id="apps">` block right after Featured, one `<li class="app" id="short-name">` per Mac app: a 128 px WebP icon in `images/apps/` (shown at 64 px), its name, one line, the macOS it needs, and either `Coming soon · free` or a `Download for Mac · free` link to `https://github.com/amalmehta/<repo>/releases/latest/download/<App>.zip` beside a `Code →` link to the public repo. One first-open note under the list covers every app (they aren't notarized yet, so macOS needs a right-click → Open, or Open Anyway in Privacy & Security, the first time). The apps are free; each keeps its licence code switched off (RamClean: `ProductConfig.isFree`; Messaging Graph: `FREE` in `app/product.py`) for a paid Pro version later. To ship a new version: build the app, zip it with `ditto -c -k --sequesterRsrc --keepParent <App>.app <App>.zip`, and attach the zip to a new GitHub release in its repo; the site's link always points at the latest. The tests check every download link has its code link, that the note is there, and that no price shows.
- **More projects**: the `<section id="more-projects">` block after Research & work, one `<li class="mini" id="short-name">` per supporting build with public code: a heading, one sentence and its links (Demo, Code). Only vetted, checkable work goes on the profile: the tests fail if a Featured card or a More projects line has no public GitHub link, or is marked private. Projects taken off the profile stay on GitHub, and git history keeps their old entries if one should come back.
- **Research & work**: one `<article class="role">` per role.
- **Selected writeups**: the `<section id="writeups">` block after More projects, laid out like Research & work. Each entry links its report in `papers/`; the link text gives the file's size (e.g. "Report (PDF, 445 KB)"; the tests check it matches the file). Give each PDF a real title, since browsers show it in the tab; the tests check every one has one. To set it (and the authors) while shrinking: put `[ /Title (The title) /Author (Names) /DOCINFO pdfmark` in `info.ps` and add it after the input in the command below. To shrink a large PDF without visible loss: `gs -q -dNOPAUSE -dBATCH -dSAFER -sDEVICE=pdfwrite -dPDFSETTINGS=/ebook -sOutputFile=small.pdf big.pdf`.
- **Skills**: the `<section id="skills">` block after Selected writeups, the most current list of skills, one row per group. Add a skill as a `<span class="chip">` in its row and update the date in the "updated" line. The resume's Technical Skills must stay a subset: the tests fail if a resume skill is missing here.
- **Musings**: the `<section id="musings">` block after Skills, hidden until its first note: when you add one, delete `hidden` from the section and put `<a href="#musings">Musings</a>` back in the header (`index.html#musings` on the other pages). It has three groups: Adventure, Life and Discovery. To add a note, copy the commented-out `<article class="musing">` template inside its group, fill in the date, title and a few sentences, and put it above older notes. Delete the "First notes coming soon." line under the heading once the first note is in.
- **Things I'm thinking about**: its own page, `thinking.html`, linked from the Interests page and the footer. To add a thought, copy the commented-out `<li class="thought">` template, give it a short `id`, fill in the question, a few sentences and the date, and put it above older ones (they number themselves). Entry dates stay in the code; the page shows one "Updated" month under the intro, which the tests check matches the newest thought. Then run `python3 tools/make-feed.py` to rebuild `feed.xml`, the page's RSS feed (the tests fail if it's out of date). Delete "First thought coming soon." once the first one is in.
- **Writings**: its own page, `writings.html`, unlinked and marked `noindex` until the first piece is in. Copy one of its two commented-out `<article class="writing">` templates (the whole text, or an intro and a link to the piece), newest first, and delete "First piece coming soon." Then remove its `noindex`, swap its `og-default.png` preview for its own image like the other pages (`images/og-writings.png`), and add `<a href="writings.html">Writings</a>` to every page's header (after Interests) and footer. The tests check all of that stays in step.
- **Travel**: its own page, `photos.html`, linked from the Interests page and the footer ("Travel"). A world map comes first, with a pin for every place I'm going, would like to go or have been, and the countries I've been to tinted: edit `PINS` (and `BEEN_COUNTRIES`) in `tools/make-map.py`, then run `python3 tools/make-map.py`, which rewrites the map in `photos.html` (the tests fail if it's out of date, or if a trip or wishlist card has no pin; each card's `id` is `place-` plus its drawing's file name). Places I'm going comes next (upcoming trips, soonest first: copy its commented-out template with the place, what for and the first and last day), then Places I'd like to go, then a Photos section. The weekly staleness check flags a trip once its last day has passed, so it can move to Photos. The "Planning trips" tile on Live interests names the next one (`<span class="next-trip">Next: Chamonix in January.</span>`); the tests check it matches a trip in Places I'm going. See [Add a photo](#add-a-photo). A skier on the Hokkaido drawing in Places I'd like to go is a hidden button that opens Pong (`pong.js`).
- **What I try to live by**: its own page, `values.html`, linked as a muted "What I try to live by" at the end of the profile footer. Each section (Values, Beliefs, Ways I want to lead my life, Inspiration, Things I care about) has a commented-out template to copy. Beliefs has two tabs (`beliefs.js`): What I believe currently, and Let go, an archive of what you used to believe and what changed your mind. When you stop believing something, move its line from the first list to the second. Each tab has its own link: `values.html#beliefs-current` and `values.html#beliefs-outdated`. Beliefs saved for later sit in a comment under the current list; move a line out of the comment to show it. Ways I want to lead my life, Inspiration and Things I care about say "Coming soon." until their first entry: delete that line once you add one (the tests check the two stay in step). Empty sections stay hidden (the Let go beliefs tab, Things I care about, Media I love, and Travel's Photos): when you add the first entry, delete its "Coming soon." line and the section's `hidden` (a comment above each says what else to switch back); the tests check each is hidden exactly while it's empty.
- **Live interests**: its own page, `interests.html`, linked in the header of every page as "Interests". Only current interests belong here: remove an entry when it stops being one, and bump the "Updated" date under the intro when you review it. A **Books** section sits below Hobbies, with three lists: Reading now, Read and Want to read. Edit `books.json` (newest first in each list; only `title` and `author` are required), then run `python3 tools/make-books.py`, which rewrites the section in `interests.html`. Reading books take `started` (`YYYY-MM`) and an optional `note`; read books take `finished`, `stars` (0–5, halves allowed, e.g. `4.5`) and a `review`; want-to-read books take an optional `why`. Any book can take `cover` (0–7) to change its drawn cover's colour. To move a book from Reading to Read, move its entry to the other list and swap `started`/`note` for `finished`/`stars`/`review`. Empty lists aren't shown, and the section stays hidden until the first book is in. The script refuses a bad date, rating or field, and the tests fail if the page no longer matches `books.json`. A **Media I love** section sits below Curious about: copy its commented-out `<li class="inspo-item">` line for each film, show, book, game, album or podcast (title, kind, one line on why), and delete "Coming soon." once the first one is in (the tests check the two stay in step). A **My art** section waits hidden below Curious about: put images in `images/art/` as WebP, copy the commented-out `<figure class="photo">` template, and delete `hidden` from the section once the first piece is in (the tests check the two stay in step). It ends with links to Things I'm thinking about (Ideas) and the Travel page. Hobbies and Curious about are tiles: copy the commented-out `<li class="tile">` template (the icon is any 24×24 line drawing, optional). To make a tile link somewhere, wrap its title as `<a class="tile-link" href="…">`; the whole tile becomes clickable and gets an arrow. `tiles.js` plays each icon's motion once on scroll-in and on tap.

The tab icon is `favicon.svg`, with `images/favicon-32.png` as a fallback for browsers that don't show SVG icons; redraw both if the colours change. Colours, fonts and spacing are in `styles.css`. The fonts are self-hosted: the `@font-face` rules at the top of `styles.css` point at `fonts/`, and each page preloads the two Latin files. The colour values at the top (`:root`) have a second set under `prefers-color-scheme: dark` for dark mode. If you change `--bg` in either set, change the matching `theme-color` tag at the top of each page too (phones colour their browser bar from it; the tests check they match).

After editing a page, and before committing, run `python3 tools/make-sitemap.py`: it rewrites `sitemap.xml` with the date each public page last changed, so search engines know what to recrawl. Adding or removing a page, or a page's `noindex`, needs it too (the tests check the list).

## Screenshots

Project screenshots live in `images/` as JPEG about 1400 px wide. The cards show a 960 px WebP copy, built from the JPEG:

```bash
sips -s format jpeg -s formatOptions 80 --resampleWidth 1400 shot.png --out images/name.jpg
tools/make-images.sh images/name.jpg
```

Then point the card's `<img>` at `images/name-960.webp` and set its `width`/`height` to that file's size (the tests check they match). For a Featured card, run `tools/make-images.sh --large images/name.jpg` too: it also writes `name-1600.avif`/`.webp` (or the JPEG's own width, if narrower; it never upscales), which goes in the card's `srcset` beside the 960 px copy. `make-images.sh` needs `brew install libavif webp`.

## Link previews

Each public page has its own 1200×630 preview image: `images/og.png` (profile), `og-interests.png`, `og-travel.png`, `og-thinking.png` and `og-values.png`. Pages without their own (`writings.html`, `404.html`) use `og-default.png`: the name in Newsreader, a one-line tagline, the light background with the intro's blue and terracotta wash; to change it, rebuild that card as a 1200×630 HTML page with the site fonts and capture it the same way. Every published page needs a description, canonical link, `og:title`, `og:description`, `og:image`, `og:url`, `og:type` and `twitter:card`; the tests check them. When the top of a page changes, recapture its image: serve a copy of the site whose `styles.css` has its dark-mode block switched off and whose page hides `.site-header` (and `.footer` on a short page, so the email address isn't in the image), then screenshot it with headless Chrome (`--headless=new --blink-settings=preferredColorScheme=1 --window-size=1200,630 --screenshot=…`; the `preferredColorScheme=1` forces light mode, since headless Chrome otherwise follows the Mac's appearance). The simplest way: copy the site to a scratch folder, add a stylesheet after `styles.css` on each page with `.site-header, .skip, .footer, .anchor { display: none !important; } .contact li:has(.email) { display: none !important; } *, *::before, *::after { animation: none !important; transition: none !important; }`, serve the copy with `python3 -m http.server` (so the fonts load) and capture each page in light mode. What I try to live by's preview shows its title and intro above the Inspiration cards rather than the Values list, so its copy also hides every other section (`main > *:not(.page-head):not(.inspo-group), main > .inspo-group:not(:has(.inspo-card)) { display: none !important; }`). Then update each page's `og:image:alt` and `twitter:image:alt` (the tests check they match).

## Deep dives

Each Featured project has its own page, `project-<slug>.html` (rewarding, bci, post-training, drone), linked as "Deep dive →" first on its card. They're built by `tools/make-case-studies.py` from the content in that file: the question, setup, a numbered "How it works" flow, four headline numbers, the key figure (`images/case/<slug>.avif`/`.webp`, made from the project repo's own figure), what didn't work and what's next. Every number comes from the project's repo (results files, paper, write-up); change it there first, then in the script, and run `python3 tools/make-case-studies.py`. Each page has its own link preview, `images/og-project-<slug>.png`, captured like the others.

## The living hero

`hero.js` draws a faint five-pass ridge along the bottom of the profile's intro, with a few dots learning to cross it by the cross-entropy method: each dot is a plan of how hard to push on each stretch, and each round the best plans seed the next. The physics was tuned offline so crossing takes about 40–70 rounds; once most dots cross three rounds running, they rest across the ridge and it stops for good. It pauses off screen, and reduced motion shows only the ridge.

## Security policy

Every page has a content security policy (`<meta http-equiv="Content-Security-Policy">`) that lets it load and run only the site's own files: no outside scripts, no inline scripts or styles, no `onclick` attributes. Keep scripts in their own `.js` files and styles in `styles.css`; the tests check every page. When capturing a link-preview image from a copy of a page, delete the policy from the copy first, since the capture adds an inline style.

## Email address

The address is never written into a page in full, so bots can't harvest it: each link is `<a class="email" href="https://reachouts.me/?u=amal" data-u="amal.mehta" data-d="gmail.com">amal.mehta [at] gmail.com</a>`, and `email.js` (loaded on every page) turns it into a real mailto link. The tests fail if the full address appears in any page.

## Hidden extras

Eight easter eggs, all wired up by the tests, and the footer's "There are eight secrets here." counts them (a test checks the number matches `eggs.js`):

- the skier on the Travel page's Hokkaido drawing opens Pong (`pong.js`);
- "soccer tournaments" in the profile's Outside work opens a replay inspired by Messi's 2011 solo goal at the Bernabéu (`messi.js`);
- "reinforcement learning" in the profile's intro opens two agents learning a maze, one linear and one with a ReLU (`maze.js`);
- "Building worlds" on Interests opens a generated island (`world.js`);
- "many agents" in the first question on Things I'm thinking about opens a swarm reaching a shared goal (`swarm.js`);
- the first-principles line on What I try to live by opens a branching tree (`tree.js`);
- the star icon by "North star" on the profile opens a supernova (`nova.js`);
- the ring on The Lord of the Rings tile (Interests, Films I love) opens a dragon breathing fire over the mountains (`dragon.js`).

`eggs.js` shows each button, swaps out the plain words, and fetches the egg's script on its first click. Without JavaScript they all stay invisible: the skier is hidden and the words are plain text. To add one, put its words in a `<span class="name-plain">` followed by a hidden `<button class="name-egg" data-script="name.js">`, add it to the list in `eggs.js`, and update the footer's count on every page.

Cards crop images to a 16:10 frame from the top left. For a wide chart that shouldn't be cropped, add `contain` to its figure: `<figure class="shot contain">`. For a wide screenshot whose useful part is on the right, add `crop-right` instead.

## Clips

Project cards show their screenshot until a real clip is recorded. To add one, save it in `assets/media/`, then swap the card's `<img>` for a clip that uses the same image as its poster:

```html
<video autoplay muted loop playsinline preload="none" poster="images/name-960.webp" width="960" height="600" aria-label="What the clip shows"><source data-src="assets/media/name.mp4" type="video/mp4"></video>
```

Also add `<script src="media.js" defer></script>` to the `<head>` (it's left off while there are no clips; the tests check the two go together). `media.js` loads each clip when it scrolls near and plays it; the poster shows instead with no JavaScript or reduced motion on. `assets/media/README.md` lists every file and what it should show. To replace one, save the new clip under the same name.

Keep each clip under 2 MB: about 5–8 seconds, 960 px wide, no audio. With [ffmpeg](https://ffmpeg.org) (`brew install ffmpeg`):

```bash
ffmpeg -i input.mov -t 8 -an -vf "scale=960:-2,fps=24" -c:v libx264 -crf 28 -preset slow -pix_fmt yuv420p -movflags +faststart assets/media/name.mp4
```

Raise `-crf` (30–32) or shorten `-t` if it's still over 2 MB. To turn a GIF into a clip, use the same command with the `.gif` as input.

The tests fail if a clip or poster is over 2 MB or a poster's size doesn't match the `width`/`height` on its `<video>`.

## Research drawings

PhysicsAI, Hybrid Robotics Lab, the Video & Image Processing Lab, the Abbasi-Asl Lab, the Berkeley Institute for Data Science and the Perlmutter Cosmology Group each show a drawing (`images/physicsai.svg`, `robot-soccer.svg`, `vip-lab.svg`, `brain-emd.svg`, `particles.svg`, `supernova.svg`), not a photo or clip. They're illustrations, not real results: the detection scores, settings, tumour outline, decomposition layers, sky and detector hits in them are made up. `tools/draw-research-art.py` draws all six; edit it and run `python3 tools/draw-research-art.py` to redraw them.

## Writing (archived)

The blog is archived in `_archive/` and not published. Follow `_archive/README.md` to bring it back.

## Portrait

`images/portrait.jpg` is a 480 px square; the page crops it to a circle. To replace it, save a new square image there. Leave white space around the head so the circle doesn't clip it.

## Add a photo

Photos live in `images/photos/` as WebP, at most 1600 px on the long side. Converting with `cwebp` drops the photo's location and camera data, so GPS coordinates aren't published. From the repo root (works with JPEG and HEIC):

```bash
mkdir -p images/photos && sips -Z 1600 -s format png ~/Pictures/IMG_1234.HEIC --out /tmp/photo.png && cwebp -q 80 -metadata none /tmp/photo.png -o images/photos/place-year.webp
```

Then copy the commented-out `<figure class="photo">` template in `photos.html`. Fill in the file name, alt text (what the photo shows), the place and year, and one line about the moment, and put it above older photos. Set `width` and `height` to the new file's size (`sips -g pixelWidth -g pixelHeight images/photos/place-year.webp`); the tests check they match. Delete "Photos coming soon." once the first photo is in.

The **Trip timeline** holds trips past and upcoming, in date order. A trip stays after it ends, and `reel.js` dims it and marks its dates "Past". It is a sideways row that `reel.js` starts on the next trip, rests there for 2.5 seconds, then rolls past on its own and loops, resting on that trip each time round. It holds on hover, keyboard focus, a swipe or a map pin’s link, with a Pause button. With reduced motion or without JS it’s a row you scroll by hand. Add a trip the usual way; the reel copies the cards itself.

Below your photos, **Places I’d like to go** shows drawings (not photos) of one iconic spot per place, in `images/places/`. `tools/draw-places.py` draws them; edit it and run `python3 tools/draw-places.py` to redraw.

## Rebuild the resume

The resume PDF is built from `resume/amal-mehta-resume.tex` with [Tectonic](https://tectonic-typesetting.github.io/) and the macOS Times New Roman font:

```bash
cd resume && tectonic -c minimal amal-mehta-resume.tex
```

It has no phone number. Keep it to one page.

## Publish

The site is served by GitHub Pages from the `main` branch root. Pushing to `main` updates it within a minute or two:

```bash
git push
```
