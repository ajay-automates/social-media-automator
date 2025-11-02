# 🤝 Contributing to Social Media Automator

Welcome! Follow these steps to set up your development environment and contribute safely.

---

## 🚀 Quick Setup for New Developers

### 1. Clone the Repository
```bash
git clone https://github.com/ajay-automates/social-media-automator.git
cd social-media-automator
```

### 2. Install Dependencies
```bash
# Backend
npm install

# Frontend
cd dashboard
npm install
cd ..
```

### 3. **IMPORTANT: Set Up Git Hooks** ⚠️
```bash
# This enables automatic protection against breaking main branch
./.githooks/setup-hooks.sh
```

**What this does:**
- ✅ Blocks direct commits to main branch
- ✅ Warns before pushing to main
- ✅ Enforces feature branch workflow

### 4. Configure Environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 5. Build Dashboard
```bash
cd dashboard && npm run build && cd ..
```

### 6. Start Development Server
```bash
npm start
```

Visit: http://localhost:3000

---

## 📋 Development Workflow (REQUIRED)

### ⛔ **NEVER** Do This:
```bash
# ❌ DON'T develop on main branch
git checkout main
git add .
git commit -m "changes"
git push origin main
```

### ✅ **ALWAYS** Do This:
```bash
# 1. Create feature branch
./scripts/new-feature.sh your-feature-name

# 2. Develop your feature
# ... make changes ...

# 3. Test everything
npm start
# Test new feature + ALL existing features

# 4. Commit changes
git add <files>
git commit -m "✨ Add your feature"

# 5. Merge safely
./scripts/merge-feature.sh
```

---

## 🛡️ Protection Layers

### Layer 1: Git Hooks (Local)
After running `./.githooks/setup-hooks.sh`, your local Git will:
- ❌ Block commits to main branch
- ⚠️ Warn before pushing to main
- ✅ Enforce feature branch workflow

### Layer 2: GitHub Branch Protection (Remote)
Set up by repository owner:
- Require pull request reviews
- Require status checks to pass
- Restrict who can push to main

### Layer 3: Scripts
Helper scripts that automate safe workflows:
- `./scripts/new-feature.sh` - Start new feature
- `./scripts/merge-feature.sh` - Safe merge process

---

## ✅ Testing Checklist

Before merging any feature, test:

### Authentication
- [ ] Users can sign up
- [ ] Users can log in
- [ ] Logout works

### Social Connections
- [ ] Twitter connection works
- [ ] LinkedIn connection works
- [ ] Instagram connection works
- [ ] Telegram connection works

### Posting
- [ ] Post now works
- [ ] Schedule post works
- [ ] Multi-platform posting works

### AI Features
- [ ] AI caption generation works
- [ ] AI image generation works

### Analytics
- [ ] Dashboard loads
- [ ] Charts display correctly
- [ ] Recent posts show

### Your New Feature
- [ ] New feature works as expected
- [ ] No console errors
- [ ] No server errors

---

## 📝 Commit Message Format

Use clear, descriptive commit messages:

```bash
# Good examples
git commit -m "✨ Add Pinterest integration"
git commit -m "🐛 Fix Twitter video upload issue"
git commit -m "📚 Update API documentation"
git commit -m "♻️ Refactor OAuth service"
git commit -m "🔥 Remove deprecated LinkedIn code"

# Bad examples
git commit -m "fix"
git commit -m "changes"
git commit -m "update"
```

**Emoji Guide:**
- ✨ `:sparkles:` - New feature
- 🐛 `:bug:` - Bug fix
- 📚 `:books:` - Documentation
- ♻️ `:recycle:` - Refactor
- 🔥 `:fire:` - Remove code
- 🔧 `:wrench:` - Configuration
- 🎨 `:art:` - UI/styling

---

## 🆘 If You Break Something

If your changes break production:

### Quick Rollback
```bash
git revert HEAD
git push origin main
```

### Reset to Previous State
```bash
git log --oneline -5  # Find the good commit
git reset --hard <good-commit-hash>
git push origin main --force  # Use carefully!
```

---

## 📚 Documentation

Before contributing, read:

- **`DEVELOPMENT_QUICKSTART.md`** - Quick reference
- **`docs/DEVELOPMENT_WORKFLOW.md`** - Complete workflow guide
- **`docs/COMPLETE_USER_FLOWS.md`** - All user flows
- **`docs/FRONTEND_BACKEND_COMMUNICATION.md`** - Architecture

---

## 🤖 AI Assistance (Cursor IDE)

If using Cursor IDE:
- ✅ AI rules are configured in `.cursor/rules/index.mdc`
- ✅ AI will automatically follow project patterns
- ✅ AI will prevent breaking changes
- ✅ AI will match existing code style

---

## 🔒 Security

### Never Commit:
- ❌ `.env` files
- ❌ API keys or secrets
- ❌ Database passwords
- ❌ OAuth credentials
- ❌ `node_modules/`

### Always:
- ✅ Use environment variables
- ✅ Add sensitive files to `.gitignore`
- ✅ Review code before committing
- ✅ Test on clean database

---

## 📊 Code Review Checklist

Before submitting (or merging):

- [ ] Code follows existing patterns
- [ ] All tests pass
- [ ] No console errors
- [ ] No security vulnerabilities
- [ ] Documentation updated
- [ ] Commit messages are clear
- [ ] Feature branch up to date with main

---

## 🎯 Best Practices

1. **Small PRs** - One feature per branch
2. **Test Thoroughly** - Test new + existing features
3. **Clear Commits** - Descriptive messages
4. **Document Changes** - Update relevant docs
5. **Ask Questions** - If unsure, ask!

---

## 💬 Getting Help

- 📖 **Documentation**: `/docs` folder
- 🐛 **Issues**: GitHub Issues
- 💬 **Discussion**: GitHub Discussions
- 📧 **Contact**: [Your contact info]

---

## 🎉 Thank You!

Thank you for contributing to Social Media Automator!

Your code helps thousands of users automate their social media presence.

---

**Remember: Safety first! Use feature branches, test everything, and never break production.** 🛡️

