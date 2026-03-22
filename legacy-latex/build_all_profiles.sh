#!/bin/bash
set -e
cd /home/aeholbrook/instant_resume

for PROF in sre data-operations community-nonprofit; do
  echo "=== Building $PROF ==="
  python3 generate_latex_from_yaml.py default --profile "$PROF"
  cd projects/default
  ~/.local/bin/tectonic cv-llt.tex 2>&1 | grep -E "Writing|error"
  python3 -c "from PyPDF2 import PdfReader; print('$PROF:', len(PdfReader('cv-llt.pdf').pages), 'pages')"
  cp cv-llt.pdf ../../public/resume-${PROF}.pdf
  cd /home/aeholbrook/instant_resume
  echo ""
done

echo "=== Building default ==="
python3 generate_latex_from_yaml.py default
cd projects/default
~/.local/bin/tectonic cv-llt.tex 2>&1 | grep -E "Writing|error"
python3 -c "from PyPDF2 import PdfReader; print('default:', len(PdfReader('cv-llt.pdf').pages), 'pages')"
cp cv-llt.pdf ../../public/resume.pdf
echo ""
echo "=== All done ==="
ls -la ../../public/resume*.pdf
