#!/bin/sh
# Builds a PDF (Tectonic) and a Word copy (pandoc) of every resume under _resumes/.
# Usage, from the repo root: sh _resumes/build.sh            (all)
#                            sh _resumes/build.sh apple      (one folder whose path contains "apple")
set -e
cd "$(dirname "$0")"
TMP=$(mktemp -d)
find . -name amal-mehta-resume.tex | grep -- "${1:-}" | while read -r tex; do
  dir=$(dirname "$tex")
  if ! (cd "$dir" && tectonic -c minimal amal-mehta-resume.tex >"$TMP/log" 2>&1); then
    grep -v "absolute path" "$TMP/log"; echo "$dir: LaTeX error, not built"; continue
  fi
  python3 - "$tex" "$TMP/docx.tex" <<'PY'
import re, sys
s = open(sys.argv[1]).read().split(r"\begin{document}")[1]
s = s.replace(r"\fontsize{9.8}{11.2}\selectfont", "").replace(r"\begin{center}", "").replace(r"\end{center}", "")
s = s.replace(r"{\LARGE\bfseries Amal Mehta}\\[3pt]", r"\section*{Amal Mehta}")
s = re.sub(r"\\quad\$\\cdot\$\\quad", " | ", s)
def role(m):
    a, b, c, d = m.groups()
    return rf"\textbf{{{a}}} \hfill \textbf{{{b}}}" + "\n\n" + rf"\textit{{{c}}}" + (f", {d}" if d else "") + "\n"
s = re.sub(r"\\role\{(.*?)\}\{(.*?)\}\{(.*)\}\{(.*?)\}\n", role, s)
s = s.replace(r"\begin{tabular}{@{}p{0.9in}l}", r"\begin{tabular}{ll}")
s = re.sub(r"\\begin\{enumerate\}\[.*?\]", r"\\begin{enumerate}", s)
open(sys.argv[2], "w").write(r"\documentclass{article}\begin{document}" + s)
PY
  pandoc "$TMP/docx.tex" -f latex -t docx -o "$dir/amal-mehta-resume.docx"
  pages=$(python3 - "$dir/amal-mehta-resume.pdf" <<'PY'
import re, sys, zlib
data = open(sys.argv[1], "rb").read()
chunks = [data]
for m in re.finditer(rb"/FlateDecode.*?stream\r?\n", data, re.S):
    end = data.find(b"endstream", m.end())
    try: chunks.append(zlib.decompress(data[m.end():end]))
    except zlib.error: pass
print(sum(len(re.findall(rb"/Type\s*/Page(?![s\w])", c)) for c in chunks))
PY
)
  echo "$dir: $pages page(s)"
  [ "$pages" = 1 ] || echo "  WARNING: $dir is not one page"
done
rm -rf "$TMP"
