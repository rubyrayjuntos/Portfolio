#!/bin/bash

# 🚀 Creative Portfolio - Vercel Deployment Script
# This script automates the deployment process to Vercel

echo "🎨 Creative Portfolio - Vercel Deployment"
echo "========================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel..."
    vercel login
fi

# Check if git repository is clean
if [[ -n $(git status --porcelain) ]]; then
    echo "⚠️  Warning: You have uncommitted changes."
    echo "   Consider committing them before deployment."
    read -p "   Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled."
        exit 1
    fi
fi

# Check if environment variables are set
echo "🔍 Checking environment variables..."
if ! vercel env ls &> /dev/null; then
    echo "⚠️  No environment variables found."
    echo "   You'll need to set them in the Vercel dashboard:"
    echo "   - ADMIN_USERNAME"
    echo "   - ADMIN_PASSWORD" 
    echo "   - SESSION_SECRET"
    echo "   - NODE_ENV"
    echo "   - HTTPS_ENABLED"
    echo "   - SECURE_COOKIES"
fi

# Deploy to production
echo "🚀 Deploying to production..."
vercel --prod

echo "✅ Deployment complete!"
echo "🌐 Your portfolio should now be live!"
echo "📝 Check the Vercel dashboard for your URL." 