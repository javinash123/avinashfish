#!/bin/bash

# AWS EC2 Build Fix Script - Handles Low Memory Instances
# This fixes the hanging build issue by optimizing memory usage

set -e  # Exit on error

echo "========================================="
echo "AWS EC2 Build Fix Script"
echo "Peg Slam Application"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo "⚠️  Don't run this script as root (sudo)"
    echo "   Run as regular user instead"
    exit 1
fi

# Detect instance type and memory
echo "Detecting EC2 instance specifications..."
INSTANCE_TYPE=$(curl -s http://169.254.169.254/latest/meta-data/instance-type 2>/dev/null || echo "unknown")
TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
AVAILABLE_MEM=$(free -m | awk '/^Mem:/{print $7}')

echo "  Instance Type: $INSTANCE_TYPE"
echo "  Total Memory: ${TOTAL_MEM}MB"
echo "  Available Memory: ${AVAILABLE_MEM}MB"
echo ""

# Recommend build command based on memory
if [ "$TOTAL_MEM" -lt 1024 ]; then
    echo "⚠️  WARNING: Less than 1GB RAM detected"
    echo "   Build may fail. Consider adding swap space or upgrading instance."
    BUILD_CMD="build:aws:low-memory"
    echo "   Using: npm run $BUILD_CMD"
elif [ "$TOTAL_MEM" -lt 1536 ]; then
    echo "ℹ️  Using low-memory build for t2.micro instance"
    BUILD_CMD="build:aws:low-memory"
    echo "   Using: npm run $BUILD_CMD"
else
    echo "✓ Sufficient memory detected"
    BUILD_CMD="build:aws"
    echo "   Using: npm run $BUILD_CMD"
fi
echo ""

# Step 1: Backup
echo "[1/9] Creating backup..."
BACKUP_DIR="../backup-before-fix-$(date +%Y%m%d-%H%M%S)"
cp -r . "$BACKUP_DIR" || { echo "Backup failed. Using sudo..."; sudo cp -r . "$BACKUP_DIR"; }
echo "✓ Backup created at: $BACKUP_DIR"
echo ""

# Step 2: Clean old files
echo "[2/9] Cleaning old files..."
rm -rf node_modules
rm -rf dist
rm -f package-lock.json
echo "✓ Removed node_modules, dist, package-lock.json"
echo ""

# Step 3: Clear npm cache
echo "[3/9] Clearing npm cache..."
npm cache clean --force
echo "✓ npm cache cleared"
echo ""

# Step 4: Install dependencies
echo "[4/9] Installing dependencies..."
npm install
echo "✓ Dependencies installed"
echo ""

# Step 5: Verify @tailwindcss/vite is removed
echo "[5/9] Verifying package fix..."
if npm list @tailwindcss/vite 2>&1 | grep -q "@tailwindcss/vite@"; then
    echo "❌ ERROR: @tailwindcss/vite is still installed!"
    echo "   Make sure you pulled the latest code with 'git pull'"
    exit 1
else
    echo "✓ @tailwindcss/vite removed successfully"
fi
echo ""

# Step 6: Check if swap is needed
echo "[6/9] Checking swap space..."
SWAP_SIZE=$(free -m | awk '/^Swap:/{print $2}')
if [ "$SWAP_SIZE" -eq 0 ] && [ "$TOTAL_MEM" -lt 1536 ]; then
    echo "⚠️  No swap space detected on low-memory instance"
    echo ""
    read -p "Add 2GB swap space? (recommended) [Y/n]: " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        echo "Creating 2GB swap file..."
        sudo dd if=/dev/zero of=/swapfile bs=1M count=2048 status=progress
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile
        echo "✓ Swap space added (2GB)"
    else
        echo "⚠️  Skipping swap creation - build may fail"
    fi
else
    echo "✓ Swap space: ${SWAP_SIZE}MB"
fi
echo ""

# Step 7: Build
echo "[7/9] Building application..."
echo "This should complete in 15-60 seconds..."
echo ""

# Monitor memory during build
(
    while true; do
        AVAIL=$(free -m | awk '/^Mem:/{print $7}')
        echo -ne "\rAvailable memory: ${AVAIL}MB   "
        sleep 2
    done
) &
MONITOR_PID=$!

# Run build with timeout to detect if it hangs
timeout 180 npm run $BUILD_CMD || {
    kill $MONITOR_PID 2>/dev/null
    echo ""
    echo ""
    echo "❌ Build failed or timed out after 3 minutes"
    echo ""
    echo "Possible solutions:"
    echo "1. Add swap space:"
    echo "   sudo dd if=/dev/zero of=/swapfile bs=1M count=2048"
    echo "   sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile"
    echo ""
    echo "2. Try even lower memory settings:"
    echo "   NODE_OPTIONS='--max-old-space-size=256' npm run build:aws"
    echo ""
    echo "3. Upgrade to t2.small instance (recommended)"
    echo ""
    exit 1
}

kill $MONITOR_PID 2>/dev/null
echo ""
echo ""
echo "✓ Build completed!"
echo ""

# Step 8: Verify build output
echo "[8/9] Verifying build output..."

if [ ! -f "dist/index.js" ]; then
    echo "❌ ERROR: dist/index.js not found!"
    exit 1
fi

if [ ! -f "dist/public/index.html" ]; then
    echo "❌ ERROR: dist/public/index.html not found!"
    exit 1
fi

if [ ! -d "dist/public/assets" ]; then
    echo "❌ ERROR: dist/public/assets/ not found!"
    exit 1
fi

# Check file sizes
INDEX_SIZE=$(du -h dist/index.js | cut -f1)
echo "  ✓ Backend built: dist/index.js ($INDEX_SIZE)"

ASSETS_COUNT=$(ls dist/public/assets/ | wc -l)
echo "  ✓ Frontend built: dist/public/index.html"
echo "  ✓ Assets bundled: $ASSETS_COUNT files in dist/public/assets/"

# Check for vendor chunks (indicates successful optimization)
if ls dist/public/assets/vendor-*.js >/dev/null 2>&1; then
    echo "  ✓ Code splitting successful (vendor chunks created)"
else
    echo "  ⚠️  Warning: No vendor chunks found (optimization may not have applied)"
fi
echo ""

# Step 9: Inject Stripe config (optional)
echo "[9/9] Checking Stripe configuration..."
if [ -n "$VITE_STRIPE_PUBLIC_KEY" ]; then
    echo "Injecting Stripe public key into index.html..."
    sed -i "s|</head>|<script>window.RUNTIME_CONFIG={VITE_STRIPE_PUBLIC_KEY:'${VITE_STRIPE_PUBLIC_KEY}'};</script></head>|" dist/public/index.html
    echo "✓ Stripe runtime configuration injected"
else
    echo "⚠️  VITE_STRIPE_PUBLIC_KEY not set"
    echo "   If you need Stripe payments, set it with:"
    echo "   export VITE_STRIPE_PUBLIC_KEY='pk_live_your_key'"
    echo "   Then re-run this script"
fi
echo ""

# Success message
echo "========================================="
echo "✅ BUILD FIX COMPLETED SUCCESSFULLY!"
echo "========================================="
echo ""
echo "Instance Information:"
echo "  Type: $INSTANCE_TYPE"
echo "  Total RAM: ${TOTAL_MEM}MB"
echo "  Build method: npm run $BUILD_CMD"
echo ""
echo "Next steps:"
echo ""
echo "1. Restart your application:"
echo "   pm2 restart peg-slam"
echo "   # or: sudo systemctl restart peg-slam"
echo ""
echo "2. Check logs:"
echo "   pm2 logs peg-slam --lines 50"
echo ""
echo "3. Test website:"
echo "   curl http://localhost:5000/api/site-settings"
echo "   # Then visit in browser"
echo ""
echo "Build artifacts:"
echo "  - Backend:  dist/index.js ($INDEX_SIZE)"
echo "  - Frontend: dist/public/ ($ASSETS_COUNT files)"
echo ""
echo "Backup location: $BACKUP_DIR"
echo ""
if [ "$TOTAL_MEM" -lt 2048 ]; then
    echo "💡 Tip: Consider upgrading to t2.small (2GB RAM) for:"
    echo "   - Faster builds (15-20s vs 30-60s)"
    echo "   - More reliable builds"
    echo "   - Better runtime performance"
    echo "   Cost: Only ~\$8.50/month more than t2.micro"
    echo ""
fi
echo "========================================="
