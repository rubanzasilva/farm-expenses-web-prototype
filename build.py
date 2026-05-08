#!/usr/bin/env python3
"""
Build script to inject git commit hash into index.html for cache busting.
Runs automatically on Railway deployment.
"""
import subprocess
import re
import os
from pathlib import Path


def get_git_hash():
    """Get short git commit hash, with stable fallbacks."""
    # Try environment variable first (Railway provides RAILWAY_GIT_COMMIT_SHA)
    env_commit = os.environ.get("RAILWAY_GIT_COMMIT_SHA")
    if env_commit:
        return env_commit[:7]  # Short hash like git --short

    # Try git command
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        # Fallback if git is not available or .git directory missing
        return "dev"


def inject_version(html_content, version):
    """Inject version parameter into script src attributes."""
    def replace_src(match):
        full_match = match.group(0)
        src_start = match.group(1)
        src_url = match.group(2)
        src_end = match.group(3)

        # Check if URL already has query parameters
        if "?" in src_url:
            # Append with & if there are existing params
            return f'{src_start}{src_url}&v={version}{src_end}'
        else:
            # Add with ? if no existing params
            return f'{src_start}{src_url}?v={version}{src_end}'

    # Pattern to match script src attributes
    pattern = r'(<script[^>]*src=")([^"]+)(")'
    return re.sub(pattern, replace_src, html_content)


def remove_version_params(html_content):
    """Remove existing v parameter from URLs while preserving other query params."""
    # Remove ?v=xxx when it's the only param
    html_content = re.sub(r'\?v=[^&"]+&', '?', html_content)
    # Remove &v=xxx when there are other params
    html_content = re.sub(r'&v=[^&"]+', '', html_content)
    # Remove ?v=xxx at end of URL
    html_content = re.sub(r'\?v=[^"]+(?=")', '', html_content)
    return html_content


def main():
    # Get git hash
    version = get_git_hash()
    print(f"Building with version: {version}")

    # Read index.html
    index_path = Path(__file__).parent / "frontend" / "index.html"
    html_content = index_path.read_text()

    # Remove any existing version params first (preserving other params)
    html_content = remove_version_params(html_content)

    # Inject new version
    html_content = inject_version(html_content, version)

    # Write back
    index_path.write_text(html_content)
    print(f"✓ Injected version {version} into index.html")


if __name__ == "__main__":
    main()
