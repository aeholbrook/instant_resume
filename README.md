# Instant Resume

This repo now supports a web-first, interactive HTML/CSS resume designed for Vercel deployment, with optional Neon (content storage) and R2 (PDF download) integration. The legacy LaTeX editor remains available for reference and offline exports.

## Web Resume (Vercel + Neon + R2)

### Quick Start (Local)

```bash
npm install
npm run dev
```

Open http://localhost:3000 to view the resume site.

### Data Sources

The site loads resume content in this order:

1. Neon database (if `POSTGRES_URL` or `DATABASE_URL` is set)
2. Local YAML file at `projects/default/content.yaml`

### Environment Variables

```
POSTGRES_URL=postgres://... (Neon)
RESUME_SLUG=default

R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
R2_BUCKET=resume
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_PDF_KEY=resume.pdf
```

The PDF download button will fall back to `window.print()` if R2 is not configured.

### Neon Table Schema

```sql
create table resumes (
  id bigserial primary key,
  slug text not null,
  content jsonb not null,
  updated_at timestamptz default now()
);
create index resumes_slug_updated_at on resumes (slug, updated_at desc);
```

## Legacy LaTeX Editor

A web-based LaTeX resume editor with YAML-driven content management, real-time PDF preview, and Word document export.

## ✨ Features

- 📝 **Monaco Editor** with syntax highlighting for LaTeX, YAML, and more
- 👁️ **Live PDF Preview** with automatic compilation
- 📊 **YAML Mode** - Use YAML as single source of truth for resume content
- 📄 **Word Export** - Generate formatted and ATS-friendly Word documents
- 🗂️ **Project Management** - Organize multiple resume versions
- 🌓 **Dark/Light Mode** - Comfortable editing in any environment
- 🚀 **Real-time Compilation** - See changes as you type

## 🚀 Quick Start (Personal Use)

The fastest way to start using the editor:

```bash
./quick_start.sh          # Mac/Linux
quick_start.bat           # Windows
```

That's it! See [QUICK_START.md](QUICK_START.md) for details.

## 📖 Deployment Options

### Free Options (Personal Use)
- **Local with tunnels** - Run when needed, $0/month
- **Oracle Cloud Free Tier** - 24/7 availability, $0/month
- **VS Code Dev Tunnels** - Remote access, $0/month

See [DEPLOYMENT_FREE.md](DEPLOYMENT_FREE.md) for all free hosting options.

### Cloud Deployment (Production)
- **AWS** - Elastic Beanstalk, EC2, ECS
- **Azure** - App Service, Container Instances
- **Docker** - Deploy anywhere

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed cloud deployment guides.

## 📋 Requirements

- **Python 3.10+**
- **LaTeX** (pdflatex) - for PDF generation
- **Dependencies**: Flask, python-docx, PyYAML

### Install LaTeX:

**Ubuntu/Debian:**
```bash
sudo apt install texlive-latex-base texlive-latex-extra
```

**Mac:**
```bash
brew install --cask mactex
```

**Windows:**
Download MiKTeX from https://miktex.org/download

## 🎯 Usage Modes

### 1. LaTeX Mode (Traditional)
Edit `.tex` files directly with full LaTeX control.

### 2. YAML Mode (Recommended)
Define resume content in `content.yaml`:

```yaml
contact:
  name: "John Doe"
  email: "john@example.com"
  phone: "(555) 123-4567"

summary: |
  Experienced software engineer with expertise in...

employment:
  - company: "Tech Corp"
    position: "Senior Engineer"
    duration: "2020 - Present"
    description: |
      - Led development of cloud infrastructure
      - Improved system performance by 40%
```

The system generates LaTeX from YAML, then compiles to PDF.

## 📥 Export Options

- **📄 PDF** - Professional LaTeX-compiled resume
- **📝 Word (Formatted)** - Styled Word document with formatting
- **📋 Word (ATS)** - Plain text format optimized for Applicant Tracking Systems

## 🏗️ Project Structure

```
instant_resume/
├── quick_start.sh              # Easy start script (Mac/Linux)
├── quick_start.bat             # Easy start script (Windows)
├── start_webapp.py             # Main application launcher
├── projects/                   # Your resume projects
│   ├── default/                # Default project
│   │   ├── content.yaml        # YAML content (recommended)
│   │   ├── cv-llt.tex          # Main LaTeX file
│   │   ├── employment.tex      # Employment section
│   │   ├── education.tex       # Education section
│   │   └── skills.tex          # Skills section
│   └── [other-projects]/       # Additional projects
├── webapp/
│   ├── frontend/               # Web interface
│   │   ├── index.html          # Main UI
│   │   ├── app.js              # Frontend logic
│   │   └── project-manager-addon.js
│   └── backend/
│       └── app.py              # Flask server
├── generate_latex_from_yaml.py # YAML → LaTeX generator
├── generate_docx_from_yaml.py  # YAML → Word generator
└── Dockerfile                  # For Docker deployment
```

## 🔧 Manual Setup

If you want to set up manually instead of using quick start scripts:

1. **Create virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   ```

2. **Install dependencies:**
   ```bash
   pip install flask flask-cors python-docx pyyaml
   ```

3. **Start the application:**
   ```bash
   python start_webapp.py
   ```

4. **Access at:** http://localhost:5000

## 🐳 Docker

```bash
# Build and run
docker-compose up

# Or build manually
docker build -t resume-editor .
docker run -d -p 5000:5000 -v $(pwd)/projects:/app/projects resume-editor
```

## 🌐 Remote Access

### VS Code Dev Tunnels (Free)
```bash
# Start application
python start_webapp.py

# In VS Code: F1 → "Port: Forward a Port" → 5000 → Make Public

# Or CLI:
code tunnel --name my-resume-editor
```

### ngrok
```bash
ngrok http 5000
```

## 🔐 Adding Authentication (Optional)

To password-protect your editor, add basic authentication in `webapp/backend/app.py`. See [DEPLOYMENT_FREE.md](DEPLOYMENT_FREE.md#adding-basic-authentication-optional) for details.

## 📁 Managing Multiple Resumes

Use the project manager in the web interface to:
- Switch between different resume versions
- Create new projects
- Organize resumes for different job applications

## 🎨 Customization

### LaTeX Templates
Edit files in `projects/your-project/`:
- `cv-llt.tex` - Main document structure
- `settings.sty` - Styling and layout
- `custom-commands.sty` - Custom LaTeX commands

### YAML Schema
Edit `content.yaml` with your resume data:
- `contact` - Personal information (including optional photo)
- `summary` - Professional summary
- `employment` - Work history
- `education` - Educational background
- `skills` - Technical and soft skills
- `projects` - Notable projects

**Adding Your Photo:** Include your headshot in both PDF and Word exports! See [HOW_TO_ADD_PHOTO.md](HOW_TO_ADD_PHOTO.md) for details.

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

## 📝 License

MIT License - feel free to use for personal or commercial purposes.

## 🆘 Support

- **Quick Start Issues**: See [QUICK_START.md](QUICK_START.md)
- **Free Hosting Questions**: See [DEPLOYMENT_FREE.md](DEPLOYMENT_FREE.md)
- **Cloud Deployment**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Bug Reports**: Open an issue on GitHub

## 🌟 Tips

- **Backup your projects folder** - it contains all your resume data
- **Use YAML mode** for easier content management and multi-format export
- **LaTeX compilation takes 2-3 seconds** - this is normal
- **Word documents preserve content** but may differ slightly from PDF layout
- **Projects are just folders** - easy to version control with git

## 🚦 Getting Started

1. **For personal use**: Run `./quick_start.sh` and start editing
2. **For remote access**: Set up VS Code tunnels (see [DEPLOYMENT_FREE.md](DEPLOYMENT_FREE.md))
3. **For 24/7 hosting**: Deploy to Oracle Cloud Free Tier (see [DEPLOYMENT_FREE.md](DEPLOYMENT_FREE.md))
4. **For production**: Use AWS/Azure deployment (see [DEPLOYMENT.md](DEPLOYMENT.md))

---

Made with ❤️ for job seekers who love LaTeX
