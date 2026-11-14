# Resumes

Resumes to send out. Not served on amalmehta.com: folders starting with `_` aren't published to the site, but they are readable in the public GitHub repo. The resume the site links to is `resume/amal-mehta-resume.tex`, kept separately.

Build PDFs and Word copies after any edit (needs `tectonic` and `pandoc`):

```sh
sh _resumes/build.sh          # all of them
sh _resumes/build.sh apple    # just one
```

Each must stay one page; the build prints the page count.

## General

For any applied scientist, research engineer or ML engineer role: [`general/`](general/)

## Company-specific

Copy `general/` to `companies/<company>/`, tailor it to the posting, add a `cover-note.md`, and add a row here.

| Company | Role | Folder | Made | Status |
|---|---|---|---|---|
| Anthropic | Research Engineer, RL and post-training | [`companies/anthropic/`](companies/anthropic/) | 2026-11-14 | Not sent |
| Apple | Applied Research Engineer | [`companies/apple/`](companies/apple/) | 2026-11-14 | Not sent |
