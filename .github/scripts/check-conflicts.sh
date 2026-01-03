#!/bin/bash
# Conflict Detection Script for TinniTune
# Usage: ./check-conflicts.sh <target-branch>

set -e

CURRENT_BRANCH=$(git branch --show-current)
TARGET_BRANCH=${1:-main}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 TinniTune Conflict Checker"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Current Branch: $CURRENT_BRANCH"
echo "Target Branch:  $TARGET_BRANCH"
echo ""

# Fetch latest
echo "📡 Fetching latest from origin..."
git fetch origin --quiet

# Check if target branch exists
if ! git rev-parse --verify origin/$TARGET_BRANCH >/dev/null 2>&1; then
  echo "❌ Branch 'origin/$TARGET_BRANCH' not found"
  exit 1
fi

# Get merge base
MERGE_BASE=$(git merge-base $CURRENT_BRANCH origin/$TARGET_BRANCH)

# Check for conflicts
echo "🔎 Analyzing potential conflicts..."
echo ""

CONFLICTS=$(git merge-tree $MERGE_BASE $CURRENT_BRANCH origin/$TARGET_BRANCH 2>/dev/null | grep -c "changed in both" || true)

if [ "$CONFLICTS" -gt 0 ]; then
  echo "⚠️  WARNING: $CONFLICTS potential conflict(s) detected!"
  echo ""
  echo "Files that may conflict:"
  git merge-tree $MERGE_BASE $CURRENT_BRANCH origin/$TARGET_BRANCH 2>/dev/null | grep -B 2 "changed in both" | grep "changed in both" -A 2
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "⚠️  RECOMMENDATION: Review conflicts before merging"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
else
  echo "✅ No conflicts detected!"
  echo ""
fi

# Show file changes summary
echo "📊 Changes Summary:"
echo ""
CHANGED_FILES=$(git diff --name-only HEAD..origin/$TARGET_BRANCH | wc -l)
echo "  • Files changed: $CHANGED_FILES"

if [ "$CHANGED_FILES" -gt 0 ]; then
  echo ""
  echo "Files modified in target branch:"
  git diff --name-status HEAD..origin/$TARGET_BRANCH | head -20

  if [ "$CHANGED_FILES" -gt 20 ]; then
    echo "  ... and $((CHANGED_FILES - 20)) more files"
  fi
fi

# Show commit summary
echo ""
echo "📝 Commits Summary:"
COMMITS_AHEAD=$(git rev-list --count HEAD..origin/$TARGET_BRANCH)
COMMITS_BEHIND=$(git rev-list --count origin/$TARGET_BRANCH..HEAD)

echo "  • Target branch is $COMMITS_AHEAD commit(s) ahead"
echo "  • Your branch is $COMMITS_BEHIND commit(s) ahead"

if [ "$COMMITS_AHEAD" -gt 0 ]; then
  echo ""
  echo "Recent commits in target branch:"
  git log --oneline HEAD..origin/$TARGET_BRANCH | head -5
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Safe to proceed with merge"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Suggested next steps:"
echo "  1. Create backup: git branch backup/pre-merge-\$(date +%Y%m%d-%H%M%S)"
echo "  2. Merge: git merge origin/$TARGET_BRANCH"
echo "  3. Test: npm run build && npm run dev"
echo ""

exit 0
