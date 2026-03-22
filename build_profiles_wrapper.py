#!/usr/bin/env python3
"""Build all profile PDFs."""
import subprocess, sys, os

os.chdir('/home/aeholbrook/instant_resume')

profiles = ['sre', 'data-operations', 'community-nonprofit', None]

for prof in profiles:
    label = prof or 'default'
    print(f'=== Building {label} ===')

    # Generate LaTeX
    cmd = [sys.executable, 'generate_latex_from_yaml.py', 'default']
    if prof:
        cmd.extend(['--profile', prof])
    subprocess.run(cmd, check=True)

    # Compile PDF
    os.chdir('projects/default')
    subprocess.run([os.path.expanduser('~/.local/bin/tectonic'), 'cv-llt.tex'],
                   check=True, capture_output=True)

    # Check pages
    from PyPDF2 import PdfReader
    pages = len(PdfReader('cv-llt.pdf').pages)
    print(f'  {label}: {pages} pages')

    # Copy
    outname = f'resume-{prof}.pdf' if prof else 'resume.pdf'
    subprocess.run(['cp', 'cv-llt.pdf', f'../../public/{outname}'], check=True)

    os.chdir('/home/aeholbrook/instant_resume')
    print()

print('=== All done ===')
for f in os.listdir('public'):
    if f.startswith('resume') and f.endswith('.pdf'):
        size = os.path.getsize(f'public/{f}')
        print(f'  {f}: {size} bytes')
