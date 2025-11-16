#!/bin/bash

# AWS EC2 Deployment Script for Peg Slam Application
# Usage: ./scripts/deploy-to-aws.sh

set -e  # Exit on error

echo "========================================="
echo "AWS EC2 Deployment Script"
echo "Peg Slam Application"
echo "========================================="
echo ""

# Step 1: Check Node.js version
echo "[1/7] Checking Node.js version..."
node --version
npm --version
echo "✓ Node.js and npm are installed"
echo ""

# Step 2: Install dependencies
echo "[2/7] Installing dependencies..."
npm install
echo "✓ Dependencies installed"
echo ""

# Step 3: Build application
echo "[3/7] Building application for production..."
npm run build:aws

# Check if build succeeded
if [ ! -d "dist" ]; then
    echo "❌ Build failed! dist/ directory not found"
    exit 1
fi

if [ ! -f "dist/index.js" ]; then
    echo "❌ Build failed! dist/index.js not found"
    exit 1
fi

if [ ! -f "dist/public/index.html" ]; then
    echo "❌ Build failed! dist/public/index.html not found"
    exit 1
fi

echo "✓ Build completed successfully"
echo ""

# Step 4: Inject Stripe runtime configuration (if VITE_STRIPE_PUBLIC_KEY is set)
echo "[4/7] Checking Stripe configuration..."
if [ -n "$VITE_STRIPE_PUBLIC_KEY" ]; then
    echo "Injecting Stripe public key into index.html..."
    sed -i "s|</head>|<script>window.RUNTIME_CONFIG={VITE_STRIPE_PUBLIC_KEY:'${VITE_STRIPE_PUBLIC_KEY}'};</script></head>|" dist/public/index.html
    echo "✓ Stripe runtime configuration injected"
else
    echo "⚠️  VITE_STRIPE_PUBLIC_KEY not set - Stripe payments may not work"
    echo "   Set it with: export VITE_STRIPE_PUBLIC_KEY='pk_live_your_key'"
fi
echo ""

# Step 5: Check MongoDB connection
echo "[5/7] Checking MongoDB connection..."
if [ -n "$MONGODB_URI" ]; then
    echo "MONGODB_URI is set: ${MONGODB_URI:0:30}..."
    echo "✓ MongoDB configured"
else
    echo "⚠️  MONGODB_URI not set - application will fail to start"
    echo "   Set it with: export MONGODB_URI='mongodb://localhost:27017/peg_slam'"
fi
echo ""

# Step 6: Check other required environment variables
echo "[6/7] Checking required environment variables..."
MISSING_VARS=0

if [ -z "$SESSION_SECRET" ]; then
    echo "⚠️  SESSION_SECRET not set"
    MISSING_VARS=1
fi

if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "⚠️  STRIPE_SECRET_KEY not set (required for payments)"
    MISSING_VARS=1
fi

if [ -z "$RESEND_API_KEY" ]; then
    echo "⚠️  RESEND_API_KEY not set (required for password reset)"
    MISSING_VARS=1
fi

if [ $MISSING_VARS -eq 0 ]; then
    echo "✓ All required environment variables are set"
else
    echo ""
    echo "⚠️  Some environment variables are missing"
    echo "   Check AWS_EC2_DEPLOYMENT_GUIDE.md for complete list"
fi
echo ""

# Step 7: Display next steps
echo "[7/7] Build completed! Next steps:"
echo ""
echo "To start/restart the application:"
echo ""
echo "  Using PM2 (recommended):"
echo "    pm2 restart peg-slam || pm2 start dist/index.js --name peg-slam"
echo "    pm2 save"
echo ""
echo "  Using systemd:"
echo "    sudo systemctl restart peg-slam"
echo ""
echo "To verify deployment:"
echo "  1. Check logs: pm2 logs peg-slam"
echo "  2. Test API: curl http://localhost:5000/api/site-settings"
echo "  3. Visit website in browser"
echo ""
echo "========================================="
echo "✓ Deployment preparation complete!"
echo "========================================="
