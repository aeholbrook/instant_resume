#!/usr/bin/env python3
"""
LaTeX Resume Build Script

This script compiles the LaTeX resume and organizes all output files into a clean
build directory structure. It handles dependency management, error reporting,
and automatic cleanup.

Usage:
    python build.py [--clean] [--verbose] [--watch]

Options:
    --clean     Clean build directory before compilation
    --verbose   Show detailed compilation output
    --watch     Watch for file changes and auto-rebuild
"""

import argparse
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import List, Optional

class ResumeBuilder:
    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        self.project_root = Path(__file__).parent
        self.resume_dir = self.project_root / "resume"
        self.build_dir = self.project_root / "build"
        self.main_tex = "cv-llt.tex"

        # LaTeX auxiliary file extensions that should be moved to build/
        self.aux_extensions = [
            '.aux', '.fdb_latexmk', '.fls', '.log', '.out',
            '.synctex.gz', '.bbl', '.blg', '.bcf', '.run.xml',
            '.cut', '.toc', '.lof', '.lot', '.nav', '.snm', '.vrb'
        ]

    def log(self, message: str) -> None:
        """Print message if verbose mode is enabled."""
        if self.verbose:
            print(f"[BUILD] {message}")

    def setup_build_directory(self) -> None:
        """Create and setup the build directory structure."""
        self.build_dir.mkdir(exist_ok=True)
        self.log(f"Build directory: {self.build_dir}")

    def clean_build_directory(self) -> None:
        """Remove all files from the build directory."""
        if self.build_dir.exists():
            shutil.rmtree(self.build_dir)
            self.log("Cleaned build directory")
        self.setup_build_directory()

    def clean_resume_directory(self) -> None:
        """Remove LaTeX auxiliary files from the resume directory."""
        cleaned_files = []
        for file_path in self.resume_dir.glob("*"):
            if file_path.suffix in self.aux_extensions:
                file_path.unlink()
                cleaned_files.append(file_path.name)

        if cleaned_files:
            self.log(f"Cleaned auxiliary files: {', '.join(cleaned_files)}")

    def run_latex_command(self, command: List[str], cwd: Path) -> subprocess.CompletedProcess:
        """Run a LaTeX command and capture output."""
        self.log(f"Running: {' '.join(command)}")
        result = subprocess.run(
            command,
            cwd=cwd,
            capture_output=True,
            text=True
        )

        if self.verbose:
            if result.stdout:
                print("STDOUT:", result.stdout)
            if result.stderr:
                print("STDERR:", result.stderr)

        return result

    def compile_latex(self) -> bool:
        """Compile the LaTeX document with proper output directory handling."""
        try:
            # Change to resume directory for compilation
            original_cwd = os.getcwd()
            os.chdir(self.resume_dir)

            # Run pdflatex with output directory
            cmd = [
                "pdflatex",
                "-interaction=nonstopmode",
                f"-output-directory={self.build_dir}",
                self.main_tex
            ]

            result = self.run_latex_command(cmd, self.resume_dir)

            if result.returncode != 0:
                print(f"❌ LaTeX compilation failed with return code {result.returncode}")
                if result.stdout:
                    print("Compilation output:")
                    print(result.stdout)
                return False

            # Check if PDF was generated
            pdf_path = self.build_dir / f"{Path(self.main_tex).stem}.pdf"
            if not pdf_path.exists():
                print("❌ PDF file was not generated")
                return False

            print(f"✅ Successfully compiled to {pdf_path}")
            return True

        except FileNotFoundError:
            print("❌ pdflatex not found. Please install LaTeX.")
            return False
        except Exception as e:
            print(f"❌ Compilation error: {e}")
            return False
        finally:
            os.chdir(original_cwd)

    def move_auxiliary_files(self) -> None:
        """Move any remaining auxiliary files to the build directory."""
        moved_files = []
        for file_path in self.resume_dir.glob("*"):
            if file_path.suffix in self.aux_extensions:
                dest_path = self.build_dir / file_path.name
                shutil.move(str(file_path), str(dest_path))
                moved_files.append(file_path.name)

        if moved_files:
            self.log(f"Moved auxiliary files: {', '.join(moved_files)}")

    def build(self, clean: bool = False) -> bool:
        """Main build function."""
        print("🔨 Building LaTeX resume...")

        if clean:
            self.clean_build_directory()
        else:
            self.setup_build_directory()

        # Clean any existing auxiliary files
        self.clean_resume_directory()

        # Compile LaTeX
        success = self.compile_latex()

        # Move any auxiliary files that ended up in resume dir
        self.move_auxiliary_files()

        if success:
            pdf_path = self.build_dir / f"{Path(self.main_tex).stem}.pdf"
            print(f"🎉 Build complete! PDF available at: {pdf_path}")

        return success

    def watch(self) -> None:
        """Watch for file changes and auto-rebuild."""
        print("👀 Watching for changes... (Press Ctrl+C to stop)")

        last_build_time = 0
        watch_extensions = {'.tex', '.sty', '.bib'}

        try:
            while True:
                # Check for modified files
                latest_mod_time = 0
                for file_path in self.resume_dir.glob("**/*"):
                    if file_path.is_file() and file_path.suffix in watch_extensions:
                        mod_time = file_path.stat().st_mtime
                        latest_mod_time = max(latest_mod_time, mod_time)

                # Rebuild if files have changed
                if latest_mod_time > last_build_time:
                    print("\n📝 Changes detected, rebuilding...")
                    if self.build(clean=False):
                        last_build_time = time.time()
                    print("👀 Watching for changes...")

                time.sleep(1)

        except KeyboardInterrupt:
            print("\n🛑 Stopped watching")

def main():
    parser = argparse.ArgumentParser(description="Build LaTeX resume with organized output")
    parser.add_argument("--clean", action="store_true", help="Clean build directory before compilation")
    parser.add_argument("--verbose", "-v", action="store_true", help="Show detailed output")
    parser.add_argument("--watch", "-w", action="store_true", help="Watch for changes and auto-rebuild")

    args = parser.parse_args()

    builder = ResumeBuilder(verbose=args.verbose)

    if args.watch:
        # Initial build
        builder.build(clean=args.clean)
        # Start watching
        builder.watch()
    else:
        # Single build
        success = builder.build(clean=args.clean)
        sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()