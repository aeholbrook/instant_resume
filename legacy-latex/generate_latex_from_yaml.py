#!/usr/bin/env python3
"""
LaTeX Generator from YAML Resume Data
Generates LaTeX .tex files from structured content
"""

import yaml
from pathlib import Path


class LaTeXResumeGenerator:
    """Generates LaTeX resume files from YAML data"""

    def __init__(self, content: dict):
        self.content = content
        self.highlighted_skills = set(content.get('highlighted_skills', []))

    def escape_latex(self, text: str) -> str:
        """Escape special LaTeX characters"""
        replacements = {
            '&': r'\&',
            '%': r'\%',
            '$': r'\$',
            '#': r'\#',
            '_': r'\_',
            '{': r'\{',
            '}': r'\}',
            '~': r'\textasciitilde{}',
            '^': r'\^{}',
        }
        for char, replacement in replacements.items():
            text = text.replace(char, replacement)
        return text

    def escape_latex_category(self, text: str) -> str:
        """Escape LaTeX special characters in category names"""
        # For category names, we need to escape & properly
        return text.replace('&', r'\&')

    def format_skill(self, skill: str) -> str:
        """Format skill with \tech{} if highlighted"""
        if skill in self.highlighted_skills:
            return f"\\tech{{{skill}}}"
        return skill

    def generate_employment(self, output_path: Path):
        """Generate employment.tex"""
        jobs = self.content.get('employment', [])

        # Get section title from YAML or use default
        section_titles = self.content.get('section_titles', {})
        title = section_titles.get('employment', 'Professional Experience')

        lines = [
            "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
            f"% {title.upper()}",
            "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
            "",
            f"\\begin{{rubric}}{{{title}}}",
            ""
        ]

        for job in jobs:
            title = job.get('title', '').replace('&', r'\&')
            company = job.get('company', '').replace('&', r'\&')
            dates = job.get('dates', '')

            # \entry*[left content]right content - title on left, company and dates on right
            lines.append(f"\\entry*[\\role{{{title}}}]\\company{{{company}}} | {dates}")
            lines.append("")

            # Add summary if exists
            summary = job.get('summary', '').replace('&', r'\&')
            if summary:
                lines.append(f"\\emph{{\\relsize{{-1}}{summary}}}")
                lines.append("")
                lines.append("")

            # Add achievements
            for achievement in job.get('achievements', []):
                escaped_achievement = achievement.replace('&', r'\&').replace('%', r'\%')
                lines.append(f"\\achievement{{{escaped_achievement}}}")
                lines.append("")

            lines.append("\\vspace{0.5\\baselineskip}")
            lines.append("")

        # Remove last spacing
        if lines[-2] == "\\vspace{0.5\\baselineskip}":
            lines = lines[:-2]

        lines.append("\\end{rubric}")

        output_path.write_text('\n'.join(lines))
        print(f"✓ Generated: {output_path}")

    def generate_education(self, output_path: Path):
        """Generate education.tex"""
        degrees = self.content.get('education', [])

        # Get section title from YAML or use default
        section_titles = self.content.get('section_titles', {})
        title = section_titles.get('education', 'Education')

        lines = [
            "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
            f"% {title.upper()}",
            "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
            "",
            f"\\begin{{rubric}}{{{title}}}",
            ""
        ]

        for degree in degrees:
            degree_name = degree.get('degree', '').replace('&', r'\&')
            dates = degree.get('dates', '')
            details = degree.get('details', '').replace('&', r'\&')

            # \entry*[left content]right content - degree on left, details and dates on right
            if details:
                lines.append(f"\\entry*[\\textbf{{{degree_name}}}]{{\\small {details}}} | {dates}")
            else:
                lines.append(f"\\entry*[\\textbf{{{degree_name}}}]{dates}")
            lines.append("")

            # Add achievements if any
            for achievement in degree.get('achievements', []):
                escaped_achievement = achievement.replace('&', r'\&').replace('%', r'\%')
                lines.append(f"    \\achievement{{{escaped_achievement}}}")
                lines.append("")

            lines.append("\\vspace{0.3\\baselineskip}")

        lines.append("\\end{rubric}")

        output_path.write_text('\n'.join(lines))
        print(f"✓ Generated: {output_path}")

    def generate_projects(self, output_path: Path):
        """Generate projects.tex"""
        projects = self.content.get('projects', [])

        # Get section title from YAML or use default
        section_titles = self.content.get('section_titles', {})
        title = section_titles.get('projects', 'Projects')

        lines = [
            "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
            f"% {title.upper()}",
            "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
            "",
            f"\\begin{{rubric}}{{{title}}}",
            ""
        ]

        for project in projects:
            name = project.get('name', '').replace('_', '\\_')
            description = project.get('description', '').replace('&', r'\&').replace('%', r'\%')
            url = project.get('url', '')
            project_type = project.get('type', '')

            if project_type == 'homelab':
                # Format homelab project differently
                lines.append(f"\\achievement{{\\textbf{{{name}}} -- {description}}}")
            elif project_type == 'github':
                # GitHub project with link
                lines.append(f"\\githubproject{{{name}}}{{{description}}}{{{url}}}")

            lines.append("")

        lines.append("\\end{rubric}")

        output_path.write_text('\n'.join(lines))
        print(f"✓ Generated: {output_path}")

    def generate_skills(self, output_path: Path):
        """Generate skills.tex"""
        skills = self.content.get('skills', {})

        # Get section title from YAML or use default
        section_titles = self.content.get('section_titles', {})
        title = section_titles.get('skills', 'Curated Skills')

        lines = [
            "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
            f"% {title.upper()}",
            "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
            "",
            f"\\begin{{rubric}}{{{title}}}",
            ""
        ]

        for category, skill_list in skills.items():
            escaped_category = self.escape_latex_category(category)
            lines.append(f"\\entry*[\\textbf{{{escaped_category}}}]")

            if isinstance(skill_list, list):
                formatted_skills = [self.format_skill(skill).replace('&', r'\&') for skill in skill_list]
                lines.append(', '.join(formatted_skills))
            else:
                lines.append(str(skill_list))

            lines.append("")
            lines.append("\\vspace{0.3\\baselineskip}")

        # Remove last vspace
        if lines[-1] == "\\vspace{0.3\\baselineskip}":
            lines = lines[:-1]

        lines.append("\\end{rubric}")

        output_path.write_text('\n'.join(lines))
        print(f"✓ Generated: {output_path}")

    def generate_cv_main(self, output_path: Path):
        """Generate cv-llt.tex main file with contact info and summary"""
        contact = self.content.get('contact', {})
        summary = self.content.get('summary', '')

        # Extract contact details
        name = contact.get('name', 'Your Name')
        email = contact.get('email', 'email@example.com')
        phone = contact.get('phone', '')
        location = contact.get('location', '')
        linkedin = contact.get('linkedin', '')
        github = contact.get('github', '')

        lines = [
            "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
            "% MAIN CV DOCUMENT - Professional Resume Template",
            "%",
            "% Generated from content.yaml - DO NOT EDIT MANUALLY",
            "% Edit content.yaml and regenerate this file instead",
            "%",
            "% Optimized with tech-focused fonts and improved typography:",
            "% - Fira Sans as main font (designed by Mozilla, tech-focused)",
            "% - Fira Code for monospace (programming ligatures)",
            "% - Perfect for software development positions",
            "% - Modern, clean, designed for digital reading",
            "% - Great for tech startups and software companies",
            "% - Improved kerning and spacing throughout",
            "%",
            "% Based on: LianTze Lim's curve template",
            "% Customized for: Professional Software Engineers",
            "% Version: 2024/09/28",
            "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
            "\\documentclass[letterpaper,skipsamekey,10pt,english]{curve}",
            "",
            "% Load our custom settings and commands",
            "\\usepackage{settings}",
            "\\usepackage{custom-commands}",
            "",
            "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
            "% FONT SELECTION: TECH STACK",
            "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
            "\\usepackage{ifxetex,ifluatex}",
            "\\newif\\ifxetexorluatex%",
            "\\ifxetex%",
            "  \\xetexorluatextrue%",
            "\\else%",
            "  \\ifluatex%",
            "    \\xetexorluatextrue%",
            "  \\else%",
            "    \\xetexorluatexfalse%",
            "  \\fi%",
            "\\fi%",
            "",
            "\\ifxetexorluatex",
            "  % XeLaTeX/LuaLaTeX: Use system fonts for maximum quality",
            "  \\usepackage{fontspec}",
            "  \\setmainfont{Fira Sans}",
            "  \\setsansfont{Fira Sans}",
            "  \\setmonofont[Scale=0.85]{Fira Sans}",
            "  \\defaultfontfeatures{Ligatures=TeX,Kerning=On}",
            "\\else",
            "  % pdfLaTeX: Fallback to similar fonts",
            "  \\usepackage[T1]{fontenc}",
            "  \\usepackage{FiraSans}     % Fira Sans package",
            "  \\usepackage{FiraMono}     % Fira Mono package",
            "  \\renewcommand{\\familydefault}{\\sfdefault}  % Use sans serif as default",
            "\\fi",
            "",
            "% Microtypography for professional appearance",
            "\\ifxetexorluatex",
            "  \\usepackage[protrusion=true]{microtype}",
            "\\else",
            "  \\usepackage[activate={true,nocompatibility},final,tracking=true,kerning=true,spacing=true,factor=1100,stretch=10,shrink=10,expansion=false]{microtype}",
            "\\fi",
            "",
            "% Photo settings",
            "\\includecomment{fullonly}",
            "",
            "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
            "% HEADER CONTENT",
            "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
            "\\leftheader{%",
            f"  {{\\huge\\bfseries {name}}}",
            "",
            "  \\vspace{0.5\\baselineskip}",
            "",
        ]

        # Add email if present
        if email:
            lines.append(f"  \\makefield{{\\faEnvelope[regular]}}{{\\href{{mailto:{email}}}{{{email}}}}}")
            lines.append("")
            lines.append("  \\vspace{0.2\\baselineskip}")

        # Add GitHub if present
        if github:
            github_url = github if github.startswith('http') else f"http://{github}"
            lines.append(f"  \\makefield{{\\faGithub}}{{\\href{{{github_url}}}{{{github_url}}}}}")
            lines.append("")
            lines.append("  \\vspace{0.2\\baselineskip}")

        # Add LinkedIn if present
        if linkedin:
            linkedin_url = linkedin if linkedin.startswith('http') else f"http://{linkedin}"
            lines.append(f"  \\makefield{{\\faLinkedin}}{{\\href{{{linkedin_url}}}{{{linkedin_url}}}}}")

        lines.extend([
            "}",
            "",
            "\\rightheader{~}",
        ])

        # Add photo if specified in YAML
        photo = contact.get('photo', '')
        photo_scale = contact.get('photo_scale', 0.23)
        if photo:
            lines.extend([
                "\\begin{fullonly}",
                f"\\photo[r]{{{photo}}}",
                f"\\photoscale{{{photo_scale}}}",
                "\\end{fullonly}",
            ])

        lines.extend([
            "",
            "\\title{Curriculum Vitae}",
            "",
            "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
            "% DOCUMENT CONTENT",
            "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
            "\\begin{document}",
            "\\makeheaders[c]",
            "",
        ])

        # Add summary if present
        if summary:
            # Remove any newlines and escape special characters
            summary_clean = summary.strip().replace('\n', ' ').replace('&', r'\&').replace('%', r'\%')
            lines.append(f"{{\\small \\textbf{{{summary_clean}}}}}")
            lines.append("")

        lines.extend([
            "\\par\\noindent",
            "",
        ])

        # Dynamically add section inputs
        # Use resume_modules (from profile) if available, otherwise YAML key order
        section_names = {'employment', 'education', 'projects', 'skills'}
        module_order = self.content.get('resume_modules')

        if module_order:
            for key in module_order:
                if key in section_names:
                    lines.append(f"\\input{{{key}}}")
        else:
            for key in self.content.keys():
                if key in section_names:
                    lines.append(f"\\input{{{key}}}")

        lines.extend([
            "",
            "\\end{document}",
        ])

        output_path.write_text('\n'.join(lines))
        print(f"✓ Generated: {output_path}")

    def generate_all(self, output_dir: Path):
        """Generate all LaTeX files"""
        self.generate_cv_main(output_dir / 'cv-llt.tex')
        self.generate_employment(output_dir / 'employment.tex')
        self.generate_education(output_dir / 'education.tex')
        self.generate_projects(output_dir / 'projects.tex')
        self.generate_skills(output_dir / 'skills.tex')


def main():
    """Main function to generate LaTeX files from YAML"""
    import argparse

    parser = argparse.ArgumentParser(description='Generate LaTeX resume files from YAML')
    parser.add_argument('project', nargs='?', default='default', help='Project name (default: default)')
    parser.add_argument('--profile', '-p', default=None, help='Profile name for targeted filtering')
    args = parser.parse_args()

    # Paths
    PROJECT_DIR = Path(__file__).parent / 'projects' / args.project
    CONTENT_FILE = PROJECT_DIR / 'content.yaml'

    if not CONTENT_FILE.exists():
        print(f"❌ Error: content.yaml not found in {PROJECT_DIR}")
        print(f"   Make sure the project '{args.project}' exists and has a content.yaml file")
        raise SystemExit(1)

    # Load content - preserve key order with safe_load
    # PyYAML 5.1+ preserves order by default (returns dict instead of OrderedDict)
    with open(CONTENT_FILE, 'r') as f:
        content = yaml.safe_load(f)

    # Apply profile filtering if requested
    from profile_filter import filter_content
    content = filter_content(content, args.profile)

    if args.profile:
        print(f"📋 Using profile: {args.profile}")

    # Generate LaTeX files
    generator = LaTeXResumeGenerator(content)
    generator.generate_all(PROJECT_DIR)

    print(f"\n✓ Generated all LaTeX files successfully in project: {args.project}")
    print(f"  You can now compile the PDF")


if __name__ == '__main__':
    main()
