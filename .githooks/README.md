# 🪝 Git Hooks

Local enforcement of development workflow rules.

---

## 🚀 Setup (Required for All Developers)

After cloning the repository, run:

```bash
./.githooks/setup-hooks.sh
```

This configures Git to use these hooks.

---

## 📋 Available Hooks

### `pre-commit`
**Blocks commits to main branch**

```bash
# This will be blocked:
git checkout main
git commit -m "changes"
# ❌ Error: Direct commits to main not allowed
```

### `pre-push`
**Warns before pushing to main**

```bash
# This will prompt for confirmation:
git push origin main
# ⚠️  Warning: Pushing to main - are you sure?
```

---

## ✅ What Gets Enforced

- ❌ No direct commits to main
- ⚠️ Warning before pushing to main
- ✅ Suggests using feature branches

---

## 🔧 Manual Setup (Alternative)

If `setup-hooks.sh` doesn't work:

```bash
# Make hooks executable
chmod +x .githooks/pre-commit
chmod +x .githooks/pre-push

# Tell Git to use .githooks directory
git config core.hooksPath .githooks
```

---

## 🆘 Bypassing Hooks (Emergency Only)

If you MUST bypass hooks in an emergency:

```bash
# Skip hooks (not recommended!)
git commit --no-verify -m "Emergency fix"
git push --no-verify origin main
```

**Warning:** Only use in true emergencies! Bypassing hooks defeats their purpose.

---

## ✅ Verify Hooks Are Installed

```bash
# Check git config
git config core.hooksPath
# Should output: .githooks

# Test pre-commit hook
git checkout main
echo "test" >> test.txt
git add test.txt
git commit -m "test"
# Should see error message blocking commit

# Clean up
git reset HEAD test.txt
rm test.txt
```

---

## 🎯 Why Hooks?

- ✅ Catches mistakes before they happen
- ✅ Enforces workflow locally
- ✅ Prevents accidental pushes to main
- ✅ Promotes best practices

---

**These hooks protect your production code!** 🛡️

