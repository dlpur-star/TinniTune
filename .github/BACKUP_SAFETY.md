# TinniTune Backup & Safety Strategy

## 🛡️ Overview

This document outlines strategies to protect your work from conflicts, data loss, and ensure safe integration of updates.

---

## 🔄 Branch Protection Strategy

### Current Branch Structure
- **Your working branch**: `claude/check-latest-updates-b2koS`
- **Other active branch**: `claude/review-tinnitus-app-Okypc` (has newer features)
- **Remote**: All branches backed up to origin

### Branch Naming Convention
All Claude branches follow: `claude/<description>-<sessionID>`

---

## 📦 Backup Strategies

### 1. Automatic Git Backups

#### Before Starting Any Work
```bash
# Create a backup branch
git branch backup/$(date +%Y%m%d-%H%M%S)-$(git branch --show-current)

# Example output: backup/20260103-143022-claude/check-latest-updates-b2koS
```

#### Before Merging/Pulling Updates
```bash
# Backup current state
git branch backup/pre-merge-$(date +%Y%m%d-%H%M%S)

# Then safely merge
git fetch origin
git merge origin/main  # or other branch
```

#### Before Major Changes
```bash
# Tag important milestones
git tag -a v1.0-$(date +%Y%m%d) -m "Backup before major refactor"
git push origin --tags
```

### 2. Local File Backups

#### Create Local Snapshots
```bash
# Backup entire working directory
tar -czf ~/tinnitune-backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  /home/user/TinniTune

# Backup specific files
cp src/TinniTune.jsx src/TinniTune.jsx.backup.$(date +%Y%m%d)
```

#### Automatic Daily Backups
Add to cron (optional):
```bash
# Daily backup at 2 AM
0 2 * * * cd /home/user/TinniTune && git branch backup/daily-$(date +\%Y\%m\%d)
```

---

## 🔍 Conflict Detection

### Pre-Merge Conflict Check

Create this script: `.github/scripts/check-conflicts.sh`

```bash
#!/bin/bash
# Check for potential conflicts before merging

CURRENT_BRANCH=$(git branch --show-current)
TARGET_BRANCH=${1:-main}

echo "🔍 Checking for conflicts between $CURRENT_BRANCH and $TARGET_BRANCH..."

# Fetch latest
git fetch origin

# Check for conflicts without actually merging
git merge-tree $(git merge-base $CURRENT_BRANCH origin/$TARGET_BRANCH) \
  $CURRENT_BRANCH origin/$TARGET_BRANCH | grep -A 3 "changed in both"

if [ $? -eq 0 ]; then
  echo "⚠️  CONFLICTS DETECTED! Review above before merging."
  exit 1
else
  echo "✅ No conflicts detected. Safe to merge."
  exit 0
fi
```

Usage:
```bash
chmod +x .github/scripts/check-conflicts.sh
./.github/scripts/check-conflicts.sh claude/review-tinnitus-app-Okypc
```

### File-Level Conflict Detection

```bash
# Check which files changed in both branches
git diff --name-only HEAD..origin/claude/review-tinnitus-app-Okypc

# See detailed differences
git diff HEAD..origin/claude/review-tinnitus-app-Okypc -- src/TinniTune.jsx
```

---

## 🚨 Emergency Recovery Procedures

### Scenario 1: Accidentally Deleted Work

```bash
# Find your lost commit
git reflog

# Restore to specific commit
git reset --hard HEAD@{5}  # Replace 5 with your commit index

# Or create new branch from lost commit
git branch recovery/lost-work HEAD@{5}
```

### Scenario 2: Bad Merge

```bash
# Abort merge in progress
git merge --abort

# Or reset to before merge
git reset --hard ORIG_HEAD

# Restore from backup branch
git reset --hard backup/pre-merge-20260103-143022
```

### Scenario 3: Corrupted Working Directory

```bash
# Stash all changes
git stash save "emergency-backup-$(date +%Y%m%d-%H%M%S)"

# Clean working directory
git clean -fd

# Restore from stash if needed
git stash pop
```

### Scenario 4: Need to Rollback Pushed Changes

```bash
# Create backup first!
git branch backup/pre-rollback-$(date +%Y%m%d-%H%M%S)

# Rollback to specific commit (creates new commit)
git revert <commit-hash>

# Or reset branch (DANGEROUS - only if not shared)
git reset --hard <commit-hash>
git push --force-with-lease origin claude/your-branch
```

---

## 🔄 Safe Update Integration Workflow

### Pulling Updates from Other Branches

```bash
# Step 1: Backup current work
git branch backup/pre-integration-$(date +%Y%m%d-%H%M%S)
git add -A
git commit -m "WIP: Backup before integrating updates"

# Step 2: Check for conflicts
./.github/scripts/check-conflicts.sh claude/review-tinnitus-app-Okypc

# Step 3: If safe, fetch and review
git fetch origin claude/review-tinnitus-app-Okypc
git log HEAD..origin/claude/review-tinnitus-app-Okypc --oneline

# Step 4: Merge or cherry-pick
# Option A: Merge all changes
git merge origin/claude/review-tinnitus-app-Okypc

# Option B: Cherry-pick specific commits
git cherry-pick <commit-hash>

# Step 5: Test thoroughly
npm run build
npm run dev

# Step 6: If issues arise, rollback
git reset --hard backup/pre-integration-20260103-143022
```

### Selective File Updates

```bash
# Update only specific files from another branch
git checkout origin/claude/review-tinnitus-app-Okypc -- src/components/NewFeature.jsx

# Review changes
git diff --staged

# Commit or discard
git commit -m "feat: Integrate NewFeature from review branch"
# OR
git reset HEAD src/components/NewFeature.jsx
```

---

## 📋 Pre-Flight Checklist

Before any major operation, verify:

- [ ] **Backup created**: `git branch backup/pre-<operation>-$(date +%Y%m%d)`
- [ ] **Working directory clean**: `git status` shows no uncommitted changes
- [ ] **Tests passing**: `npm test` (if configured)
- [ ] **Build successful**: `npm run build`
- [ ] **Conflicts checked**: `./.github/scripts/check-conflicts.sh <target-branch>`
- [ ] **Remote synced**: `git fetch origin` completed
- [ ] **Escape plan ready**: Know which backup to restore to

---

## 🔐 Critical Files to Always Backup

Before modifying these files, **always create a backup**:

```bash
# Core application
src/TinniTune.jsx

# Audio engine (critical for functionality)
src/audio-engine/TinniTuneAudioEngine.js
src/audio-engine/ClinicalTherapyModule.js

# Configuration
package.json
vite.config.js
CLAUDE.md

# Safety: Create backups
cp src/TinniTune.jsx src/TinniTune.jsx.backup
cp package.json package.json.backup
```

---

## 🗂️ Backup Directory Structure

Recommended local backup organization:

```
~/tinnitune-backups/
├── 20260103/
│   ├── pre-merge-143022/
│   │   ├── full-backup.tar.gz
│   │   └── git-bundle.bundle
│   └── critical-files/
│       ├── TinniTune.jsx
│       └── package.json
├── 20260102/
│   └── ...
└── recovery-notes.md
```

Create git bundles for complete backup:
```bash
# Create complete repository backup
git bundle create ~/tinnitune-backups/$(date +%Y%m%d)/repo-backup.bundle --all

# Restore from bundle if needed
git clone ~/tinnitune-backups/20260103/repo-backup.bundle recovered-repo
```

---

## 🤝 Collaboration Safety

When working with updates from other branches:

### 1. Communication Protocol
- Document what you're working on in commit messages
- Use descriptive branch names
- Tag major milestones

### 2. Update Frequency
```bash
# Sync daily to avoid large conflicts
git fetch origin --all
git log HEAD..origin/main --oneline  # See what's new
```

### 3. Isolated Testing
```bash
# Test updates in isolation before merging
git worktree add ../tinnitune-test origin/claude/review-tinnitus-app-Okypc
cd ../tinnitune-test
npm install
npm run dev  # Test new features
cd ../TinniTune
git worktree remove ../tinnitune-test
```

---

## 📱 Quick Reference Commands

```bash
# Emergency: Save everything NOW
git add -A && git commit -m "EMERGENCY BACKUP $(date)" && git push

# Quick backup branch
git branch backup/$(date +%Y%m%d-%H%M%S)

# View all backups
git branch | grep backup

# Delete old backups (after 30 days)
git branch | grep backup | grep $(date -d '30 days ago' +%Y%m%d) | xargs git branch -D

# Show what changed in last hour
git log --since="1 hour ago" --stat

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# See all recent activity
git reflog -20
```

---

## 🎯 Recovery Decision Tree

```
Problem occurred?
├─ Uncommitted changes lost?
│  └─> git reflog → git reset --hard HEAD@{X}
├─ Bad commit?
│  └─> git revert <commit> OR git reset --hard HEAD~1
├─ Bad merge?
│  └─> git merge --abort OR git reset --hard ORIG_HEAD
├─ Files deleted?
│  └─> git checkout HEAD -- <file>
└─ Everything broken?
   └─> git reset --hard backup/pre-<operation>-<date>
```

---

## ✅ Best Practices Summary

1. **Before any risky operation**: Create a backup branch
2. **After important milestones**: Push to remote immediately
3. **Daily**: Fetch updates and check for divergence
4. **Weekly**: Clean up old backup branches (keep tagged ones)
5. **Monthly**: Create full repository bundles
6. **Always**: Test in isolation before merging major updates

---

## 🆘 Emergency Contacts

- **Git Documentation**: https://git-scm.com/doc
- **TinniTune Issues**: https://github.com/dlpur-star/TinniTune/issues
- **Reflog Tutorial**: https://git-scm.com/docs/git-reflog

---

**Last Updated**: 2026-01-03
**Document Version**: 1.0
