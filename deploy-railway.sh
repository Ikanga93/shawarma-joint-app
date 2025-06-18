#!/bin/bash

echo "🚀 Deploying Food Truck App to Railway..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the project root directory."
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Error: Git repository not found. Please initialize git first."
    echo "Run: git init && git add . && git commit -m 'Initial commit'"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Warning: You have uncommitted changes."
    read -p "Do you want to commit them now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "Pre-deployment commit: $(date)"
    else
        echo "❌ Please commit your changes before deploying."
        exit 1
    fi
fi

# Push to main branch
echo "📤 Pushing to GitHub..."
git push origin main

echo "✅ Code pushed to GitHub!"
echo ""
echo "🔧 Next steps:"
echo "1. Go to https://railway.app"
echo "2. Create a new project from your GitHub repository"
echo "3. Add a PostgreSQL database service"
echo "4. Configure environment variables:"
echo "   - NODE_ENV=production"
echo "   - JWT_SECRET=your_jwt_secret"
echo "   - STRIPE_PUBLISHABLE_KEY=your_stripe_key"
echo "   - STRIPE_SECRET_KEY=your_stripe_secret"
echo "   - DATABASE_URL=\${{Postgres.DATABASE_URL}}"
echo "   - FRONTEND_URL=https://your-app-name.up.railway.app"
echo ""
echo "📚 See RAILWAY_DEPLOYMENT_GUIDE.md for detailed instructions"
echo "🎉 Happy deploying!" 