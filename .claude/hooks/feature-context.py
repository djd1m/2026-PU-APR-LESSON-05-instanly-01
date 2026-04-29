#!/usr/bin/env python3
"""SessionStart hook: inject current feature context and sprint progress."""

import json
import subprocess
import os
from pathlib import Path

def main():
    project_root = Path(__file__).parent.parent.parent
    roadmap_path = project_root / ".claude" / "feature-roadmap.json"

    if not roadmap_path.exists():
        print("No feature roadmap found.")
        return

    with open(roadmap_path) as f:
        roadmap = json.load(f)

    features = roadmap.get("features", [])

    # Categorize features
    done = [f for f in features if f["status"] == "done"]
    in_progress = [f for f in features if f["status"] == "in_progress"]
    next_up = [f for f in features if f["status"] == "next"]
    planned = [f for f in features if f["status"] == "planned"]
    blocked = [f for f in features if f["status"] == "blocked"]

    total = len(features)

    # Get recent git commits (last 5)
    try:
        result = subprocess.run(
            ["git", "log", "--oneline", "-5"],
            capture_output=True, text=True, timeout=5,
            cwd=str(project_root)
        )
        recent_commits = result.stdout.strip()
    except Exception:
        recent_commits = "(unavailable)"

    # Output context
    print(f"📊 Sprint Progress: {len(done)}/{total} features done")

    if in_progress:
        print(f"\n🔨 In Progress:")
        for f in in_progress:
            print(f"  - [{f['id']}] {f['title']}")

    if next_up:
        print(f"\n⏭️ Next Up:")
        for f in next_up[:3]:
            deps = f.get("depends_on", [])
            dep_str = f" (depends: {', '.join(deps)})" if deps else ""
            print(f"  - [{f['id']}] {f['title']}{dep_str}")

    if blocked:
        print(f"\n🚫 Blocked:")
        for f in blocked:
            print(f"  - [{f['id']}] {f['title']} (blocked by: {', '.join(f.get('depends_on', []))})")

    print(f"\n📝 Recent commits:")
    print(f"  {recent_commits.replace(chr(10), chr(10) + '  ')}")

if __name__ == "__main__":
    main()
