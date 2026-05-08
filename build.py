#!/usr/bin/env python3
"""
Build script to inject git commit hash into index.html for cache busting.
Runs automatically before deployment.
"""
import subprocess
import re
from pathlib import Path


def get_git_hash():
    """Get short git commit hash."""
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError:
        # Fallback if git is not available
        import time
        return str(int(time.time()))


def inject_version(html_content, version):
    """Inject version parameter into script src attributes."""
    # Pattern to match script src without version param
    pattern = r'(<script[^>]*src="[^"?]+)(")'
    replacement = rf'\1?v={version}\2'
    return re.sub(pattern, replacement, html_content)


def main():
    # Get git hash
    version = get_git_hash()
    print(f"Building with version: {version}")

    # Read index.html
    index_path = Path(__file__).parent / "frontend" / "index.html"
    html_content = index_path.read_text()

    # Remove any existing version params first
    html_content = re.sub(r'\?v=[^"]+', '', html_content)

    # Inject new version
    html_content = inject_version(html_content, version)

    # Write back
    index_path.write_text(html_content)
    print(f"✓ Injected version {version} into index.html")


if __name__ == "__main__":
    main()
