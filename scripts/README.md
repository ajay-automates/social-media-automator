# 🛠️ Development Scripts

Helper scripts for professional feature development.

---

## 📋 Available Scripts

### 1. `new-feature.sh` - Start New Feature

Creates a new feature branch safely with automatic backups.

**Usage:**
```bash
./scripts/new-feature.sh pinterest-integration
```

**What it does:**
- ✅ Stashes any uncommitted changes
- ✅ Updates main branch
- ✅ Creates backup tag
- ✅ Creates feature branch
- ✅ Ready to develop!

**Examples:**
```bash
./scripts/new-feature.sh pinterest-integration
./scripts/new-feature.sh video-editor
./scripts/new-feature.sh analytics-dashboard
```

---

### 2. `merge-feature.sh` - Merge Feature Safely

Merges your feature branch to main with safety checks.

**Usage:**
```bash
# While on your feature branch:
./scripts/merge-feature.sh
```

**What it does:**
- ✅ Checks you tested everything
- ✅ Shows what will be merged
- ✅ Merges to main
- ✅ Optionally pushes to production
- ✅ Provides rollback instructions

---

## 🚀 Complete Workflow Example

### Adding a New Platform (Pinterest)

```bash
# 1. Start new feature
./scripts/new-feature.sh pinterest-integration

# 2. Develop your feature
touch services/pinterest.js
# ... write code ...

# 3. Test locally
npm start
# Test Pinterest + all existing features

# 4. Commit changes
git add services/pinterest.js server.js
git commit -m "✨ Add Pinterest integration"

# 5. Merge safely
./scripts/merge-feature.sh
# Follow prompts, push to production

# Done! 🎉
```

---

## 📚 Documentation

For complete workflow guide, see: `docs/DEVELOPMENT_WORKFLOW.md`

---

## ⚠️ Important Rules

1. **Never develop on main branch**
2. **Always use feature branches**
3. **Test before merging**
4. **Keep features small**
5. **Have rollback plan**

---

## 🆘 Emergency Rollback

If production breaks after merge:

```bash
# Quick revert
git revert HEAD
git push origin main

# Site is safe again!
```

---

## 💡 Tips

- Use descriptive feature names: `pinterest-integration` not `feature1`
- Commit frequently with clear messages
- Test ALL existing features before merging
- Monitor logs after pushing to production
- Keep feature branches for reference (don't delete immediately)

---

**Happy coding! 🚀**

