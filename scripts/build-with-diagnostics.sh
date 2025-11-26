#!/bin/bash

# Build script with diagnostic output for AWS EC2 deployment
# This script runs build steps separately with timing and error detection

set -e  # Exit on error

echo "=================================================="
echo "Starting Production Build with Diagnostics"
echo "=================================================="
echo ""

# Function to print elapsed time
print_elapsed() {
    local start=$1
    local end=$(date +%s)
    local elapsed=$((end - start))
    echo "✓ Completed in ${elapsed} seconds"
    echo ""
}

# Function to check if process is still running
check_timeout() {
    local pid=$1
    local timeout=$2
    local count=0
    
    while kill -0 $pid 2>/dev/null; do
        sleep 10
        count=$((count + 10))
        if [ $count -ge $timeout ]; then
            echo "⚠️  WARNING: Process running for ${count} seconds (may be hung)"
        fi
        if [ $((count % 60)) -eq 0 ]; then
            echo "   Still running... (${count}s elapsed)"
        fi
    done
}

# Set memory limit for build
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}"
echo "Node memory limit: ${NODE_OPTIONS}"
echo ""

# Step 1: Clean previous build
echo "[1/4] Cleaning previous build artifacts..."
start=$(date +%s)
rm -rf dist/
print_elapsed $start

# Step 2: Build frontend with Vite
echo "[2/4] Building frontend with Vite..."
echo "  - Compiling TypeScript"
echo "  - Bundling assets"
echo "  - Generating production files"
start=$(date +%s)

# Run vite build with timeout monitoring
VITE_BASE_PATH=/ npx vite build &
VITE_PID=$!

# Monitor vite build
check_timeout $VITE_PID 300 &  # 5 minute warning
wait $VITE_PID
VITE_EXIT=$?

if [ $VITE_EXIT -ne 0 ]; then
    echo "❌ Vite build failed with exit code $VITE_EXIT"
    exit $VITE_EXIT
fi

print_elapsed $start

# Step 3: Bundle backend with esbuild
echo "[3/4] Bundling backend with esbuild..."
echo "  - Compiling server code"
echo "  - Creating Node.js bundle"
start=$(date +%s)

# Run esbuild with timeout monitoring
npx esbuild server/index.ts \
    --platform=node \
    --packages=external \
    --bundle \
    --format=esm \
    --outdir=dist &
ESBUILD_PID=$!

# Monitor esbuild
check_timeout $ESBUILD_PID 60 &  # 1 minute warning
wait $ESBUILD_PID
ESBUILD_EXIT=$?

if [ $ESBUILD_EXIT -ne 0 ]; then
    echo "❌ esbuild failed with exit code $ESBUILD_EXIT"
    exit $ESBUILD_EXIT
fi

print_elapsed $start

# Step 4: Verify build output
echo "[4/4] Verifying build output..."
start=$(date +%s)

if [ ! -d "dist" ]; then
    echo "❌ ERROR: dist/ directory not found!"
    exit 1
fi

if [ ! -f "dist/index.js" ]; then
    echo "❌ ERROR: dist/index.js not found!"
    exit 1
fi

if [ ! -f "dist/public/index.html" ]; then
    echo "❌ ERROR: dist/public/index.html not found!"
    exit 1
fi

# Get file sizes
BACKEND_SIZE=$(du -h dist/index.js | cut -f1)
FRONTEND_SIZE=$(du -sh dist/public/assets 2>/dev/null | cut -f1 || echo "N/A")

echo "✓ Build verification passed"
echo "  - Backend bundle: $BACKEND_SIZE"
echo "  - Frontend assets: $FRONTEND_SIZE"
print_elapsed $start

echo "=================================================="
echo "✅ Production Build Completed Successfully!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "  1. Set environment variables (MONGODB_URI, SESSION_SECRET, etc.)"
echo "  2. Run: npm start"
echo ""

exit 0
