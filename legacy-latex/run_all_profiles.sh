#!/bin/bash
set -e

cd /home/aeholbrook/instant_resume

echo "=== SRE Profile ==="
python3 generate_latex_from_yaml.py default --profile sre
cd projects/default
~/.local/bin/tectonic cv-llt.tex
python3 -c "from PyPDF2 import PdfReader; print('SRE pages:', len(PdfReader('cv-llt.pdf').pages))"
cp cv-llt.pdf ../../public/resume-sre.pdf
echo "SRE DONE"

cd /home/aeholbrook/instant_resume

echo "=== Data Operations Profile ==="
python3 generate_latex_from_yaml.py default --profile data-operations
cd projects/default
~/.local/bin/tectonic cv-llt.tex
python3 -c "from PyPDF2 import PdfReader; print('DO pages:', len(PdfReader('cv-llt.pdf').pages))"
cp cv-llt.pdf ../../public/resume-data-operations.pdf
echo "Data Operations DONE"

cd /home/aeholbrook/instant_resume

echo "=== Community Nonprofit Profile ==="
python3 generate_latex_from_yaml.py default --profile community-nonprofit
cd projects/default
~/.local/bin/tectonic cv-llt.tex
python3 -c "from PyPDF2 import PdfReader; print('CN pages:', len(PdfReader('cv-llt.pdf').pages))"
cp cv-llt.pdf ../../public/resume-community-nonprofit.pdf
echo "Community Nonprofit DONE"

cd /home/aeholbrook/instant_resume

echo "=== Default (Full) Profile ==="
python3 generate_latex_from_yaml.py default
cd projects/default
~/.local/bin/tectonic cv-llt.tex
python3 -c "from PyPDF2 import PdfReader; print('Full pages:', len(PdfReader('cv-llt.pdf').pages))"
cp cv-llt.pdf ../../public/resume.pdf
echo "Default DONE"

echo "=== ALL PROFILES COMPLETE ==="
