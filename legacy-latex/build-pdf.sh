#!/usr/bin/env bash
#
# build-pdf.sh — YAML → LaTeX → PDF pipeline
#
# Usage: ./build-pdf.sh [project-name] [--profile PROFILE] [--fit-pages N]
#   project-name defaults to "default"
#
# Requirements:
#   - Python 3 with PyYAML and PyPDF2
#   - tectonic (or pdflatex) on PATH or at ~/.local/bin/tectonic
#   - Fira Sans font installed (fc-list | grep "Fira Sans")

set -euo pipefail

# Parse arguments
PROJECT="default"
PROFILE=""
FIT_PAGES=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile|-p)
      PROFILE="$2"
      shift 2
      ;;
    --fit-pages)
      FIT_PAGES="$2"
      shift 2
      ;;
    *)
      PROJECT="$1"
      shift
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR/projects/$PROJECT"
CONTENT_FILE="$PROJECT_DIR/content.yaml"

# Determine output PDF name
if [ -n "$PROFILE" ]; then
  OUTPUT_PDF="$SCRIPT_DIR/public/resume-${PROFILE}.pdf"
else
  OUTPUT_PDF="$SCRIPT_DIR/public/resume.pdf"
fi

# Find tectonic
TECTONIC="${TECTONIC:-}"
if [ -z "$TECTONIC" ]; then
  if command -v tectonic &>/dev/null; then
    TECTONIC="tectonic"
  elif [ -x "$HOME/.local/bin/tectonic" ]; then
    TECTONIC="$HOME/.local/bin/tectonic"
  else
    echo "Error: tectonic not found. Install it or set TECTONIC env var."
    exit 1
  fi
fi

if [ ! -f "$CONTENT_FILE" ]; then
  echo "Error: $CONTENT_FILE not found"
  exit 1
fi

# Build generator args
GEN_ARGS=("$PROJECT")
if [ -n "$PROFILE" ]; then
  GEN_ARGS+=(--profile "$PROFILE")
fi

echo "==> Step 1: Generating LaTeX from YAML..."
python3 "$SCRIPT_DIR/generate_latex_from_yaml.py" "${GEN_ARGS[@]}"

echo "==> Step 2: Compiling LaTeX to PDF..."
cd "$PROJECT_DIR"
"$TECTONIC" cv-llt.tex

# Page fitting loop
if [ "$FIT_PAGES" -gt 0 ]; then
  echo "==> Checking page count (target: $FIT_PAGES)..."
  MAX_ATTEMPTS=5
  ATTEMPT=0
  while true; do
    PAGES=$(python3 -c "from PyPDF2 import PdfReader; print(len(PdfReader('cv-llt.pdf').pages))")
    echo "    Current: $PAGES pages"
    if [ "$PAGES" -le "$FIT_PAGES" ]; then
      break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    if [ "$ATTEMPT" -ge "$MAX_ATTEMPTS" ]; then
      echo "Warning: Could not fit to $FIT_PAGES pages after $MAX_ATTEMPTS attempts"
      break
    fi
    echo "    Trimming (pass $ATTEMPT)..."
    python3 "$SCRIPT_DIR/generate_latex_from_yaml.py" "${GEN_ARGS[@]}" --trim-pass "$ATTEMPT"
    "$TECTONIC" cv-llt.tex
  done
fi

echo "==> Step 3: Copying PDF to public/..."
mkdir -p "$SCRIPT_DIR/public"
cp cv-llt.pdf "$OUTPUT_PDF"

echo ""
echo "Done! PDF written to: $OUTPUT_PDF"
echo "  $(wc -c < "$OUTPUT_PDF") bytes"
