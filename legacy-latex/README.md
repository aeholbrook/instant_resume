# Legacy LaTeX Pipeline

These files were part of the original LaTeX-based PDF generation system.
The project now uses HTML + CSS print styles (`window.print()`) for PDF output.

Kept here in case we ever need to revive the LaTeX pipeline.

## Contents

- `build-pdf.sh` / `build_all_profiles.sh` / `run_all_profiles.sh` — shell scripts that ran tectonic
- `generate_latex_from_yaml.py` — Python script that generated .tex files from content.yaml
- `latex-wasm.ts` — attempted SwiftLaTeX WASM integration (never worked — package server is dead)
- `api-routes/` — Next.js API routes for server-side compilation

## Note

The `.tex` and `.sty` files in `projects/*/` are still in place as project data.
