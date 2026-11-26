#!/usr/bin/env python3
"""Builds the What changed page (changes.html): the site's latest changes, newest first, grouped by day, written
straight from the commit messages (they're already plain sentences). "Evolving site · updated …" in every header
links here.

Only changes to the published site are listed: a commit that touches tailored resumes (_resumes/companies/),
mentions a cover letter, recruiter or application, is a merge, or only touches tests, tools, docs or other
unpublished files is left out.

Run from the repo root after committing, then fold the page into that commit before pushing:
  python3 tools/make-changes.py && git add changes.html && git commit --amend --no-edit
"""
import datetime, html, pathlib, re, subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGE = ROOT / "changes.html"
START, END = "<!-- changes:start (built by tools/make-changes.py; don't edit by hand) -->", "<!-- changes:end -->"
SHOW = 80
PRIVATE = re.compile(r"cover (letter|note)|recruiter|application|^Merge ", re.I)


def git(*args):
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True, check=True).stdout


def published(path):
    if path.startswith(("_", ".", "tests/", "tools/", "docs/")):
        return False
    return "/" not in path or path.startswith(("images/", "papers/", "fonts/", "assets/", "resume/"))


changes = []
for line in git("log", "--format=%H\x1f%ad\x1f%s", "--date=short").splitlines():
    sha, day, subject = line.split("\x1f")
    if PRIVATE.search(subject):
        continue
    files = git("show", "--name-only", "--format=", sha).split()
    if any(f.startswith("_resumes/companies/") for f in files) or not any(published(f) for f in files):
        continue
    changes.append((day, subject.strip()))
    if len(changes) == SHOW:
        break

out, current = [], None
for day, subject in changes:
    if day != current:
        if current:
            out.append("        </ul>\n      </li>")
        d = datetime.date.fromisoformat(day)
        out.append(f'      <li class="change-day">\n        <h2><time datetime="{day}">{d.strftime("%B")} {d.day}, {d.year}</time></h2>\n        <ul>')
        current = day
    text = subject[0].upper() + subject[1:]
    out.append(f"          <li>{html.escape(text, quote=False)}{'' if text.endswith(('.', '!', '?')) else '.'}</li>")
if current:
    out.append("        </ul>\n      </li>")

page = PAGE.read_text(encoding="utf-8")
a, b = page.index(START) + len(START), page.index(END)
page = page[:a] + '\n    <ol class="changes">\n' + "\n".join(out) + "\n    </ol>\n    " + page[b:]
PAGE.write_text(page, encoding="utf-8")
print(f"wrote {len(changes)} changes across {sum(1 for l in out if 'change-day' in l)} days to changes.html")
