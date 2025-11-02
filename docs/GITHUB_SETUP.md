# 🔒 GitHub Branch Protection Setup

**For Repository Owners/Admins**

This guide shows how to enable GitHub branch protection to prevent developers from breaking production.

---

## 🎯 What This Does

GitHub branch protection adds a **server-side** enforcement layer that:
- ✅ Prevents direct pushes to main
- ✅ Requires pull requests
- ✅ Requires code reviews
- ✅ Requires CI checks to pass
- ✅ Works for ALL developers (not just local hooks)

---

## 📋 Setup Steps

### 1. Go to Repository Settings

1. Open your repository: https://github.com/ajay-automates/social-media-automator
2. Click **Settings** tab
3. Click **Branches** in left sidebar

### 2. Add Branch Protection Rule

1. Click **Add branch protection rule**
2. In "Branch name pattern" enter: `main`

### 3. Configure Protection Rules

Check these options:

#### ✅ **Require a pull request before merging**
- ✅ Require approvals: **1** (or more for teams)
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require review from Code Owners (optional)

#### ✅ **Require status checks to pass before merging**
- ✅ Require branches to be up to date before merging
- Search and add: `test-before-merge` (from GitHub Actions)

#### ✅ **Require conversation resolution before merging**
- All PR comments must be resolved

#### ✅ **Require linear history**
- Prevents merge commits, keeps history clean

#### ✅ **Include administrators**
- **Important!** Makes rules apply to admin users too

### 4. Additional Settings (Recommended)

- ✅ **Allow force pushes**: ❌ Disabled
- ✅ **Allow deletions**: ❌ Disabled
- ✅ **Require signed commits**: ✅ Enabled (extra security)

### 5. Save Changes

Click **Create** or **Save changes**

---

## 🎉 Result

After setup, developers **CANNOT**:
- ❌ Push directly to main
- ❌ Force push to main
- ❌ Delete main branch
- ❌ Bypass code reviews

Developers **MUST**:
- ✅ Create feature branches
- ✅ Open pull requests
- ✅ Get code reviewed
- ✅ Pass all CI checks
- ✅ Merge via GitHub UI

---

## 📖 Developer Workflow After Protection

### Old Way (Now Blocked)
```bash
git checkout main
git add .
git commit -m "changes"
git push origin main  # ❌ BLOCKED BY GITHUB!
```

### New Way (Required)
```bash
# 1. Create feature branch
./scripts/new-feature.sh my-feature

# 2. Make changes
# ... develop ...

# 3. Push feature branch
git push origin feature/my-feature

# 4. Open Pull Request on GitHub
# Go to: https://github.com/your-repo/pulls
# Click "New Pull Request"
# Select: feature/my-feature → main

# 5. Request review
# Assign reviewer(s)

# 6. After approval + CI pass
# Click "Merge Pull Request" on GitHub

# 7. Delete feature branch
git branch -d feature/my-feature
git push origin --delete feature/my-feature
```

---

## 🔍 What Happens When Developer Tries Direct Push

```bash
$ git push origin main

remote: error: GH006: Protected branch update failed for refs/heads/main.
remote: error: Changes must be made through a pull request.
To https://github.com/ajay-automates/social-media-automator.git
 ! [remote rejected] main -> main (protected branch hook declined)
error: failed to push some refs
```

**Perfect!** Main branch is protected. 🎉

---

## 🔧 For Solo Developers

If you're working alone but still want protection:

### Option 1: Self-Review Pull Requests
1. Create feature branch
2. Push to GitHub
3. Open PR
4. Review your own changes
5. Merge if everything looks good

### Option 2: Disable "Require approvals"
1. Keep branch protection
2. Uncheck "Require approvals"
3. Still requires PR (good for history)
4. Can merge your own PRs

### Option 3: Use Git Hooks Only
1. Skip GitHub branch protection
2. Use local hooks (`.githooks/`)
3. Self-discipline required
4. Run: `./.githooks/setup-hooks.sh`

---

## 🚨 Emergency Override

If you REALLY need to push directly (emergency fix):

### Temporarily Disable Protection
1. Go to Settings → Branches
2. Edit branch protection rule
3. Uncheck "Include administrators"
4. Make emergency push
5. **Immediately re-enable protection!**

### Better: Use Hotfix Branch
```bash
git checkout -b hotfix/critical-issue
# Fix the issue
git commit -m "🚨 Hotfix: Critical security patch"
git push origin hotfix/critical-issue
# Fast-track PR review
# Merge immediately
```

---

## ✅ Verification

Test that protection is working:

```bash
# Try to push to main (should fail)
git checkout main
echo "test" >> test.txt
git add test.txt
git commit -m "test"
git push origin main
# Should see error: "Protected branch update failed"

# Clean up
git reset --hard HEAD~1
rm test.txt
```

If you see the error, protection is working! ✅

---

## 📊 Monitoring

After enabling protection:

1. **Pull Requests**: Monitor PRs regularly
2. **Code Reviews**: Review changes before merging
3. **CI Checks**: Ensure tests pass
4. **Branch Hygiene**: Delete merged feature branches

---

## 🎯 Benefits

### Before Protection:
- ❌ Accidental pushes to main
- ❌ Breaking changes in production
- ❌ No code review
- ❌ No testing enforcement

### After Protection:
- ✅ All changes reviewed
- ✅ CI tests must pass
- ✅ Clean git history
- ✅ Production stays stable
- ✅ Easy rollback if needed

---

## 📚 Additional Resources

- [GitHub Branch Protection Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Actions Workflow](https://docs.github.com/en/actions/using-workflows)
- [Pull Request Best Practices](https://github.com/features/code-review)

---

## 💡 Pro Tips

1. **Enable branch protection early** - Before team grows
2. **Require CI checks** - Automate quality
3. **Include administrators** - No exceptions
4. **Use draft PRs** - For work-in-progress
5. **Keep PRs small** - Easier to review

---

**Your main branch is now a fortress!** 🏰🛡️

Any questions? Open an issue or discussion on GitHub.

