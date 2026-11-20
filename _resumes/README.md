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
| Anthropic | [Research Scientist, Discovery (Engineering & Applied Sciences)](https://job-boards.greenhouse.io/anthropic/jobs/5468937008), ML researcher track | [`companies/anthropic-discovery/`](companies/anthropic-discovery/) | 2026-11-14 | Not sent |
| Apple | Applied Research Engineer | [`companies/apple/`](companies/apple/) | 2026-11-14 | Not sent |
| idler | [Research Engineer](https://jobs.ashbyhq.com/idler/cce9ab39-0ab0-489d-bbf9-4df74c2baeee) | [`companies/idler/`](companies/idler/) | 2026-11-17 | Not sent |
| Meta (contract via Spectraforce) | Software Engineer III, Simulation CV/ML, Sunnyvale | [`companies/meta-simulation/`](companies/meta-simulation/) | 2026-11-19 | Not sent |
| Odyssey | [Member of Technical Staff, Forward Deployed Machine Learning Engineer](https://jobs.ashbyhq.com/odysseyml/1b82838a-f5c9-4246-86bf-f6f40993736b), Palo Alto | [`companies/odyssey/`](companies/odyssey/) | 2026-11-20 | Not sent |
| Pre-seed SF robotics startup (via recruiter) | Robot learning, electronics manufacturing | [`companies/robotics-startup/`](companies/robotics-startup/) | 2026-11-19 | Not sent |
