#!/usr/bin/env bash
# Clone nilbuild/developer-roadmap (roadmaps data only) for local plan generation.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/data/developer-roadmap"

if [ -d "$DEST/src/data/roadmaps" ]; then
  echo "Roadmaps already present at $DEST"
  exit 0
fi

git clone --depth 1 --filter=blob:none --sparse https://github.com/nilbuild/developer-roadmap.git "$DEST"
cd "$DEST"
git sparse-checkout set src/data/roadmaps
git sparse-checkout disable
git checkout HEAD -- src/data/roadmaps
echo "Installed roadmap data under $DEST/src/data/roadmaps"
