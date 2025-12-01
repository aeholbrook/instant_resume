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

    def format_skill(self, skill: str) -> str:
        """Format skill with \tech{} if highlighted"""
        if skill in self.highlighted_skills:
            return f"\\tech{{{skill}}}"
        return skill

    def generate_employment(self, output_path: Path):
        """Generate employment.tex"""
        jobs = self.content.get('employment', [])

        lines = [
            "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
            "% PROFESSIONAL EXPERIENCE",
            "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
            "",
            "\\begin{rubric}{Professional Experience}",
            ""
        ]

        for job in jobs:
            title = job.get('title', '')
            company = job.get('company', '')
            dates = job.get('dates', '')

            lines.append(f"\\entry*[\\role{{{title}}}]{dates} | \\company{{{company}}}")
            lines.append("")

            # Add summary if exists
            summary = job.get('summary', '')
            if summary:
                lines.append(f"\\emph{{\\relsize{{-1}}{summary}}}")
                lines.append("")
                lines.append("")

            # Add achievements
            for achievement in job.get('achievements', []):
                lines.append(f"\\achievement{{{achievement}}}")
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

        lines = [
            "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
            "% EDUCATION SECTION",
            "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
            "",
            "\\begin{rubric}{Education}",
            ""
        ]

        for degree in degrees:
            degree_name = degree.get('degree', '')
            dates = degree.get('dates', '')
            details = degree.get('details', '')

            lines.append(f"\\entry*[\\textbf{{{degree_name}}}]{dates} | {{\\small {details}}}")
            lines.append("")

            # Add achievements if any
            for achievement in degree.get('achievements', []):
                lines.append(f"    \\achievement{{{achievement}}}")
                lines.append("")

            lines.append("\\vspace{0.3\\baselineskip}")

        lines.append("\\end{rubric}")

        output_path.write_text('\n'.join(lines))
        print(f"✓ Generated: {output_path}")

    def generate_projects(self, output_path: Path):
        """Generate projects.tex"""
        projects = self.content.get('projects', [])

        lines = [
            "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
            "% PROJECTS & HOME LAB",
            "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
            "",
            "\\begin{rubric}{Curated Projects}",
            ""
        ]

        for project in projects:
            name = project.get('name', '').replace('_', '\\_')
            description = project.get('description', '')
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

        lines = [
            "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
            "% SKILLS SECTION",
            "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
            "",
            "\\begin{rubric}{Curated Skills}",
            ""
        ]

        for category, skill_list in skills.items():
            lines.append(f"\\entry*[\\textbf{{{category}}}]")

            if isinstance(skill_list, list):
                formatted_skills = [self.format_skill(skill) for skill in skill_list]
                lines.append(', '.join(formatted_skills))
            else:
                lines.append(str(skill_list))

            lines.append("")
            lines.append("\\vspace{0.3\\baselineskip}")

        lines.append("\\end{rubric}")

        output_path.write_text('\n'.join(lines))
        print(f"✓ Generated: {output_path}")

    def generate_all(self, output_dir: Path):
        """Generate all LaTeX files"""
        self.generate_employment(output_dir / 'employment.tex')
        self.generate_education(output_dir / 'education.tex')
        self.generate_projects(output_dir / 'projects.tex')
        self.generate_skills(output_dir / 'skills.tex')


def main():
    """Main function to generate LaTeX files from YAML"""

    # Paths
    PROJECT_DIR = Path(__file__).parent / 'projects' / 'shelter-sre'
    CONTENT_FILE = PROJECT_DIR / 'content.yaml'

    # Load content
    with open(CONTENT_FILE, 'r') as f:
        content = yaml.safe_load(f)

    # Generate LaTeX files
    generator = LaTeXResumeGenerator(content)
    generator.generate_all(PROJECT_DIR)

    print(f"\n✓ Generated all LaTeX files successfully!")
    print(f"  You can now compile the PDF with: make shelter-sre")


if __name__ == '__main__':
    main()
