#!/bin/bash

# Setup Git Hooks Script
# Run this after cloning the repository

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              🔧 Setting up Git Hooks                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Make hooks executable
chmod +x .githooks/pre-commit
chmod +x .githooks/pre-push

# Configure git to use .githooks directory
git config core.hooksPath .githooks

echo "✅ Git hooks installed!"
echo ""
echo "📋 Hooks enabled:"
echo "   • pre-commit  - Blocks direct commits to main"
echo "   • pre-push    - Warns before pushing to main"
echo ""
echo "🛡️  Your main branch is now protected locally!"
echo ""

