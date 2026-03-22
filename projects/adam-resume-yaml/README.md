# Adam Resume (YAML-Only Workflow)

This project uses a **YAML-only workflow** - you edit `content.yaml` and the .tex files are automatically generated.

## How to Use

1. **Edit Content**: Open `content.yaml` in the editor and make your changes
2. **Compile**: Click the "📝 From YAML" button to:
   - Generate all .tex files from content.yaml
   - Compile the PDF automatically
3. **View**: The PDF preview updates automatically

## Files in This Project

- **content.yaml** - Single source of truth for all resume content (EDIT THIS)
- **cv-llt.tex** - Main LaTeX file (generated - do not edit manually)
- **custom-commands.sty** - Custom LaTeX commands (edit for formatting changes)
- **settings.sty** - LaTeX styling and layout (edit for style changes)

## What's Different from shelter-sre?

The `shelter-sre` project has individual .tex files (employment.tex, skills.tex, etc.) that you can edit directly.

This project has **no individual content files** - everything comes from content.yaml. This makes it easier to:
- Generate Word documents
- Keep content consistent
- Make global changes
- Maintain a single source of truth

## Workflow

**YAML-Only (This Project):**
```
Edit content.yaml → Click "From YAML" → PDF generated
```

**Direct Edit (shelter-sre):**
```
Edit employment.tex, skills.tex, etc. → Click "Compile" → PDF generated
```

Choose the workflow that fits your needs!
