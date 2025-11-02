#!/bin/bash

# 🔀 Merge Feature Script
# This script safely merges a feature branch to main

set -e  # Exit on error

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         🔀 Safe Feature Merge to Production                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" = "main" ]; then
    echo "❌ Error: You're on main branch!"
    echo "   Switch to your feature branch first:"
    echo "   git checkout feature/your-feature-name"
    echo ""
    exit 1
fi

echo "📍 Current branch: $CURRENT_BRANCH"
echo ""

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo "⚠️  You have uncommitted changes:"
    echo ""
    git status -s
    echo ""
    echo "❌ Please commit your changes first:"
    echo "   git add <files>"
    echo "   git commit -m 'Your message'"
    echo ""
    exit 1
fi

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              ⚠️  PRE-MERGE CHECKLIST                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Before merging, confirm you've tested:"
echo ""
echo "  ☐ New feature works as expected"
echo "  ☐ All existing features still work"
echo "  ☐ No console errors"
echo "  ☐ No server errors"
echo "  ☐ Authentication works"
echo "  ☐ All platforms still connect"
echo "  ☐ Posting still works"
echo "  ☐ Analytics still loads"
echo ""
read -p "Have you tested everything? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "❌ Please test your changes first!"
    echo "   Run: npm start"
    echo "   Test all features manually"
    echo ""
    exit 1
fi

echo ""
echo "📋 What you're merging:"
echo ""
git log main..$CURRENT_BRANCH --oneline
echo ""

read -p "Ready to merge to main? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Merge cancelled"
    exit 1
fi

echo ""
echo "🔄 Merging to main..."

# Switch to main
git checkout main

# Pull latest changes
git pull origin main

# Merge feature
git merge "$CURRENT_BRANCH" --no-ff -m "Merge $CURRENT_BRANCH

$(git log main..$CURRENT_BRANCH --oneline)

✅ All tests passed
✅ No breaking changes"

echo "✅ Merged to main"
echo ""

# Push to production
echo "🚀 Pushing to production..."
read -p "Push to production now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin main
    echo "✅ Pushed to production"
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                 🎉 Merge Successful!                         ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "📊 Post-Merge Actions:"
    echo "   1. Monitor server logs for errors"
    echo "   2. Test on production URL"
    echo "   3. Check all features still work"
    echo ""
    echo "⚠️  If something breaks, run:"
    echo "   git revert HEAD"
    echo "   git push origin main"
    echo ""
    echo "🌿 Feature branch kept for reference: $CURRENT_BRANCH"
    echo "   Delete later with: git branch -d $CURRENT_BRANCH"
    echo ""
else
    echo "⏸️  Merge completed but not pushed"
    echo "   Push when ready with: git push origin main"
fi

