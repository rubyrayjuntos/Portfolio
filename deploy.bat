@echo off
REM 🚀 Creative Portfolio - Vercel Deployment Script (Windows)
REM This script automates the deployment process to Vercel

echo 🎨 Creative Portfolio - Vercel Deployment
echo ========================================

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Vercel CLI not found. Installing...
    npm install -g vercel
)

REM Check if user is logged in
vercel whoami >nul 2>&1
if errorlevel 1 (
    echo 🔐 Please login to Vercel...
    vercel login
)

REM Check if git repository is clean
git diff-index --quiet HEAD --
if errorlevel 1 (
    echo ⚠️  Warning: You have uncommitted changes.
    echo    Consider committing them before deployment.
    set /p "continue=Continue anyway? (y/N): "
    if /i not "%continue%"=="y" (
        echo ❌ Deployment cancelled.
        exit /b 1
    )
)

REM Check if environment variables are set
echo 🔍 Checking environment variables...
vercel env ls >nul 2>&1
if errorlevel 1 (
    echo ⚠️  No environment variables found.
    echo    You'll need to set them in the Vercel dashboard:
    echo    - ADMIN_USERNAME
    echo    - ADMIN_PASSWORD
    echo    - SESSION_SECRET
    echo    - NODE_ENV
    echo    - HTTPS_ENABLED
    echo    - SECURE_COOKIES
)

REM Deploy to production
echo 🚀 Deploying to production...
vercel --prod

echo ✅ Deployment complete!
echo 🌐 Your portfolio should now be live!
echo 📝 Check the Vercel dashboard for your URL.

pause 