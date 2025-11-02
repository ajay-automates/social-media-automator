#!/bin/bash

# 🚀 New Feature Development Script
# This script sets up a new feature branch safely

set -e  # Exit on error

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         🚀 Professional Feature Development Setup           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check if feature name provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide a feature name"
    echo ""
    echo "Usage: ./scripts/new-feature.sh <feature-name>"
    echo ""
    echo "Examples:"
    echo "  ./scripts/new-feature.sh pinterest-integration"
    echo "  ./scripts/new-feature.sh video-editor"
    echo "  ./scripts/new-feature.sh analytics-dashboard"
    echo ""
    exit 1
fi

FEATURE_NAME=$1
BRANCH_NAME="feature/$FEATURE_NAME"

echo "📋 Feature Details:"
echo "   Name: $FEATURE_NAME"
echo "   Branch: $BRANCH_NAME"
echo ""

# Step 1: Save current work (if any)
if [[ -n $(git status -s) ]]; then
    echo "⚠️  You have uncommitted changes!"
    echo ""
    git status -s
    echo ""
    read -p "Do you want to stash them? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git stash save "WIP before $FEATURE_NAME"
        echo "✅ Changes stashed"
    else
        echo "❌ Please commit or stash your changes first"
        exit 1
    fi
fi

# Step 2: Switch to main and update
echo "📥 Updating main branch..."
git checkout main
git pull origin main
echo "✅ Main branch updated"
echo ""

# Step 3: Create backup tag
BACKUP_TAG="backup/before-$FEATURE_NAME-$(date +%Y%m%d-%H%M%S)"
echo "💾 Creating backup: $BACKUP_TAG"
git tag "$BACKUP_TAG"
git push origin "$BACKUP_TAG"
echo "✅ Backup created: $BACKUP_TAG"
echo ""

# Step 4: Create feature branch
echo "🌿 Creating feature branch: $BRANCH_NAME"
git checkout -b "$BRANCH_NAME"
echo "✅ Feature branch created"
echo ""

# Step 5: Summary
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    ✅ Ready to Develop!                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📍 Current branch: $BRANCH_NAME"
echo "💾 Backup tag: $BACKUP_TAG"
echo ""
echo "📖 Next steps:"
echo "   1. Make your changes"
echo "   2. Test thoroughly: npm start"
echo "   3. Commit: git commit -m 'Add $FEATURE_NAME'"
echo "   4. Merge: ./scripts/merge-feature.sh"
echo ""
echo "📚 Read docs/DEVELOPMENT_WORKFLOW.md for full guide"
echo ""
echo "🎯 Remember: Test ALL existing features before merging!"
echo ""

