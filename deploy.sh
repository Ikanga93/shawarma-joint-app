#!/bin/bash

echo "🚀 Preparing Fernando's Food Truck App for Railway Deployment..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit - Fernando's Food Truck App"
fi

# Build the app to test
echo "🔨 Testing build process..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Push to GitHub: git push origin main"
    echo "2. Go to https://railway.app"
    echo "3. Connect your GitHub repo"
    echo "4. Add environment variables from railway.env.example"
    echo "5. Deploy! 🚀"
    echo ""
    echo "📋 Don't forget to set these Railway environment variables:"
    echo "   - NODE_ENV=production"
    echo "   - STRIPE_PUBLISHABLE_KEY=your_stripe_key"
    echo "   - STRIPE_SECRET_KEY=your_stripe_secret"
    echo "   - ADMIN_USERNAME=fernando"
    echo "   - ADMIN_PASSWORD=admin123"
else
    echo "❌ Build failed. Please fix errors before deploying."
    exit 1
fi 