# Quick Start: Backup & Safety Guide

## 🚀 One-Command Backup

```bash
# Create a complete backup right now
./.github/scripts/create-backup.sh quick
```

This will:
- ✅ Create a backup branch
- ✅ Create a local archive
- ✅ Create a git bundle
- ✅ Backup critical files
- ✅ Show you where everything is saved

---

## 🔍 Check for Conflicts Before Merging

```bash
# Check conflicts with another branch
./.github/scripts/check-conflicts.sh claude/review-tinnitus-app-Okypc
```

This will:
- ✅ Show potential conflicts
- ✅ List changed files
- ✅ Show commit differences
- ✅ Give you next steps

---

## 📋 Daily Workflow

### Starting Work
```bash
# 1. Create a backup
./.github/scripts/create-backup.sh daily

# 2. Check for new updates
git fetch origin --all
git log HEAD..origin/main --oneline
```

### Before Pulling Updates
```bash
# 1. Backup current work
./.github/scripts/create-backup.sh pre-merge

# 2. Check for conflicts
./.github/scripts/check-conflicts.sh <branch-to-merge>

# 3. If safe, merge
git merge origin/<branch-to-merge>

# 4. If conflicts, you have backups to rollback
```

### Emergency: Something Broke
```bash
# Option 1: Rollback to last backup
git branch | grep backup  # Find your backup
git reset --hard backup/pre-merge-20260103-143022

# Option 2: Restore from local archive
cd ~/tinnitune-backups
ls -lt  # Find latest backup
tar -xzf tinnitune-quick-20260103-143022.tar.gz -C ~/
```

---

## 🎯 Common Scenarios

### "I want to pull updates from another branch"
```bash
# Safe workflow
./.github/scripts/create-backup.sh pre-update
./.github/scripts/check-conflicts.sh claude/review-tinnitus-app-Okypc
git merge origin/claude/review-tinnitus-app-Okypc
```

### "I accidentally deleted something"
```bash
# Find it in reflog
git reflog

# Restore
git reset --hard HEAD@{5}  # Use appropriate index
```

### "The merge created conflicts"
```bash
# Abort the merge
git merge --abort

# You're back to your pre-merge state (and you have backups!)
```

### "I want to test new updates without touching my code"
```bash
# Use git worktree to test in isolation
git worktree add ../tinnitune-test origin/claude/review-tinnitus-app-Okypc
cd ../tinnitune-test
npm install
npm run dev  # Test the other branch

# When done
cd ../TinniTune
git worktree remove ../tinnitune-test
```

---

## 💾 Backup Schedule Recommendation

- **Daily**: Quick backup before starting work
- **Before merges**: Always create `pre-merge` backup
- **After major features**: Create and tag milestone backup
- **Weekly**: Clean up old backups (keep tagged ones)

---

## 🆘 Emergency Recovery Flowchart

```
Something went wrong?
│
├─ Still have uncommitted changes?
│  └─> git stash save "emergency-$(date +%Y%m%d)"
│
├─ Bad commit?
│  └─> git reset --hard HEAD~1
│
├─ Bad merge?
│  ├─> git merge --abort  (if in progress)
│  └─> git reset --hard ORIG_HEAD  (if completed)
│
└─ Everything broken?
   ├─> git reset --hard backup/<latest>
   └─> or restore from ~/tinnitune-backups
```

---

## 📊 Check Your Backup Status

```bash
# See all backup branches
git branch | grep backup

# See backup files
ls -lh ~/tinnitune-backups/$(date +%Y%m%d)/

# Check total backup size
du -sh ~/tinnitune-backups
```

---

## 🧹 Cleanup Old Backups

```bash
# Delete backup branches older than 7 days (example)
git branch | grep backup/daily-2025 | xargs git branch -D

# Delete local archives older than 30 days
find ~/tinnitune-backups -name "*.tar.gz" -mtime +30 -delete
```

---

## ✅ Pre-Flight Checklist

Before any risky operation:

- [ ] Run: `./.github/scripts/create-backup.sh pre-<operation>`
- [ ] Verify backup created: `git branch | grep backup | tail -1`
- [ ] Know your escape route: `git reset --hard backup/<name>`
- [ ] Test after changes: `npm run build && npm run dev`

---

**Remember**:
- Backups are cheap, recovering lost work is expensive
- When in doubt, create a backup
- Always test in isolation first

For detailed information, see: `.github/BACKUP_SAFETY.md`
