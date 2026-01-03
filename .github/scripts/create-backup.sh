#!/bin/bash
# Automated Backup Script for TinniTune
# Usage: ./create-backup.sh [backup-type]

set -e

BACKUP_TYPE=${1:-manual}
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
CURRENT_BRANCH=$(git branch --show-current)
BACKUP_BRANCH="backup/${BACKUP_TYPE}-${TIMESTAMP}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💾 TinniTune Backup Creator"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Type:           $BACKUP_TYPE"
echo "Timestamp:      $TIMESTAMP"
echo "Current Branch: $CURRENT_BRANCH"
echo "Backup Branch:  $BACKUP_BRANCH"
echo ""

# Check for uncommitted changes
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
  echo "⚠️  You have uncommitted changes!"
  echo ""
  git status --short
  echo ""
  read -p "Commit changes before backup? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add -A
    git commit -m "WIP: Auto-commit before backup [$TIMESTAMP]"
    echo "✅ Changes committed"
  fi
fi

# Create backup branch
echo "📦 Creating backup branch..."
git branch $BACKUP_BRANCH

if [ $? -eq 0 ]; then
  echo "✅ Backup branch created: $BACKUP_BRANCH"
else
  echo "❌ Failed to create backup branch"
  exit 1
fi

# Push to remote (optional)
read -p "Push backup to remote? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "📤 Pushing to remote..."
  git push origin $BACKUP_BRANCH
  echo "✅ Backup pushed to remote"
fi

# Create local archive
BACKUP_DIR="$HOME/tinnitune-backups/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

echo "📁 Creating local archive..."
tar -czf "$BACKUP_DIR/tinnitune-${BACKUP_TYPE}-${TIMESTAMP}.tar.gz" \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=dist \
  --exclude=build \
  -C /home/user TinniTune 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✅ Archive created: $BACKUP_DIR/tinnitune-${BACKUP_TYPE}-${TIMESTAMP}.tar.gz"

  # Show archive size
  ARCHIVE_SIZE=$(du -h "$BACKUP_DIR/tinnitune-${BACKUP_TYPE}-${TIMESTAMP}.tar.gz" | cut -f1)
  echo "   Size: $ARCHIVE_SIZE"
fi

# Create git bundle
echo "📦 Creating git bundle..."
git bundle create "$BACKUP_DIR/repo-bundle-${TIMESTAMP}.bundle" --all 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✅ Git bundle created: $BACKUP_DIR/repo-bundle-${TIMESTAMP}.bundle"

  BUNDLE_SIZE=$(du -h "$BACKUP_DIR/repo-bundle-${TIMESTAMP}.bundle" | cut -f1)
  echo "   Size: $BUNDLE_SIZE"
fi

# Backup critical files
echo "📄 Backing up critical files..."
CRITICAL_DIR="$BACKUP_DIR/critical-files"
mkdir -p "$CRITICAL_DIR"

cp src/TinniTune.jsx "$CRITICAL_DIR/TinniTune.jsx" 2>/dev/null || true
cp package.json "$CRITICAL_DIR/package.json" 2>/dev/null || true
cp CLAUDE.md "$CRITICAL_DIR/CLAUDE.md" 2>/dev/null || true
cp vite.config.js "$CRITICAL_DIR/vite.config.js" 2>/dev/null || true

echo "✅ Critical files backed up"

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Backup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Backup Locations:"
echo "  • Git Branch:  $BACKUP_BRANCH"
echo "  • Archive:     $BACKUP_DIR/tinnitune-${BACKUP_TYPE}-${TIMESTAMP}.tar.gz"
echo "  • Git Bundle:  $BACKUP_DIR/repo-bundle-${TIMESTAMP}.bundle"
echo "  • Critical:    $CRITICAL_DIR/"
echo ""
echo "To restore from branch:"
echo "  git checkout $BACKUP_BRANCH"
echo ""
echo "To restore from bundle:"
echo "  git clone $BACKUP_DIR/repo-bundle-${TIMESTAMP}.bundle restored-repo"
echo ""
echo "To restore from archive:"
echo "  tar -xzf $BACKUP_DIR/tinnitune-${BACKUP_TYPE}-${TIMESTAMP}.tar.gz -C ~/"
echo ""

# List all backups
TOTAL_BACKUPS=$(git branch | grep -c backup || true)
echo "📊 Total backup branches: $TOTAL_BACKUPS"

if [ "$TOTAL_BACKUPS" -gt 10 ]; then
  echo ""
  echo "⚠️  You have many backup branches. Consider cleanup:"
  echo "   git branch | grep backup | head -5 | xargs git branch -D"
fi

echo ""
exit 0
