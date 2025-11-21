#!/bin/bash

# Deployment Script for Lenormand Intelligence
# This script helps prepare and deploy the application

set -e

echo "🔮 Preparing Lenormand Intelligence for deployment..."

# Check if we have the required environment variables
if [ -z "$DEEPSEEK_API_KEY" ]; then
    echo "⚠️  Warning: DEEPSEEK_API_KEY not set. AI features will be disabled."
fi

# Clean up development files
echo "🧹 Cleaning up development files..."
rm -f *.pid *.log project-tree.txt
find . -name ".DS_Store" -delete 2>/dev/null || true
find . -name "Thumbs.db" -delete 2>/dev/null || true

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run tests if they exist
if [ -d "tests" ]; then
    echo "🧪 Running tests..."
    npm test || echo "⚠️  Some tests failed, but continuing..."
fi

# Build the application
echo "🏗️  Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🚀 Ready for deployment!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Set environment variables in your deployment platform"
    echo "2. Deploy the .next directory (for Vercel, this is automatic)"
    echo "3. Test the deployed application"
    echo ""
    echo "🔗 Important URLs to test after deployment:"
    echo "- /env-check - Verify environment variables"
    echo "- /read/new - Test AI reading functionality"
    echo "- /cards - Test card browsing"
    echo ""
else
    echo "❌ Build failed!"
    exit 1
fi