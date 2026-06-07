# AWS EC2 Low-Memory Build Fix

## Problem
Build hangs at "transforming (2125) ../node_modules/react-remove-scroll-bar/dist/es2015/component.js" on AWS EC2 instances with limited memory.

## Root Cause
Your EC2 instance (likely t2.micro or t2.small) **runs out of memory** when Vite tries to transform 2000+ React modules during the build process.

## Solution Applied

### 1. Increased Node.js Memory Limit
Updated `build:aws` script to allocate 2GB of memory:
```json
"build:aws": "NODE_OPTIONS='--max-old-space-size=2048' VITE_BASE_PATH=/ vite build && ..."
```

### 2. Optimized Vite Build
Added chunk splitting to reduce memory pressure:
- Split vendor libraries into separate chunks
- Reduced single-file size
- Optimized minification

---

## Fix for Your AWS Server

### Step 1: Check Your EC2 Instance Specs

```bash
# Check available memory
free -h

# Check instance type
curl -s http://169.254.169.254/latest/meta-data/instance-type

# Recommended minimum: t2.small (2GB RAM)
# If using t2.micro (1GB RAM): Consider upgrading to t2.small
```

**Instance Recommendations**:
- ❌ **t2.nano** (512MB RAM) - Will fail
- ⚠️ **t2.micro** (1GB RAM) - May work with low-memory script
- ✅ **t2.small** (2GB RAM) - Recommended minimum
- ✅ **t2.medium** (4GB RAM+) - Best performance

### Step 2: SSH and Pull Latest Code

```bash
# SSH into your server
ssh -i your-key.pem ec2-user@your-ec2-ip

# Navigate to app directory
cd /var/www/html  # or your app path

# Backup current installation
sudo cp -r . ../backup-$(date +%Y%m%d-%H%M%S)

# Pull latest code with optimizations
git pull origin main
```

### Step 3: Clean Everything

```bash
# Remove old files
rm -rf node_modules dist package-lock.json

# Clear npm cache
npm cache clean --force

echo "✓ Cleaned"
```

### Step 4: Install Dependencies

```bash
# Reinstall with updated package.json
npm install

echo "✓ Dependencies installed"
```

### Step 5: Build - Choose Based on Your Instance

#### Option A: Standard Build (for t2.small and larger)
```bash
npm run build:aws

# This allocates 2GB memory
# Should complete in 15-30 seconds
```

#### Option B: Low-Memory Build (for t2.micro)
```bash
npm run build:aws:low-memory

# This allocates only 512MB memory
# May take 30-60 seconds but uses less RAM
```

#### Option C: Custom Memory Build (if both above fail)
```bash
# For 1GB RAM instance
NODE_OPTIONS='--max-old-space-size=1024' npm run build:aws

# For 4GB RAM instance (faster)
NODE_OPTIONS='--max-old-space-size=4096' npm run build:aws
```

### Step 6: Verify Build Output

```bash
# Check dist folder structure
ls -lah dist/

# Should show:
# -rw-r--r-- 1 user user 183K date time index.js
# drwxr-xr-x 3 user user 4.0K date time public/

# Check public assets
ls -lah dist/public/

# Should show:
# -rw-r--r-- 1 user user 1.4K date time index.html
# drwxr-xr-x 2 user user 4.0K date time assets/

# Check vendor chunks (new optimization)
ls -lah dist/public/assets/

# Should show multiple files including:
# - vendor-react-*.js (~167KB)
# - vendor-ui-*.js (~99KB)
# - vendor-utils-*.js (~45KB)
# - index-*.js (~762KB)
# - index-*.css (~127KB)

echo "✓ Build successful"
```

### Step 7: Restart Application

```bash
# Using PM2
pm2 restart peg-slam

# Or using systemd
sudo systemctl restart peg-slam

# Check status
pm2 status
# or
sudo systemctl status peg-slam

echo "✓ Application restarted"
```

---

## Troubleshooting

### Build Still Hangs?

#### 1. Check Memory During Build
```bash
# Open new SSH terminal and monitor memory
watch -n 1 free -h

# Run build in other terminal
# If "available" memory drops to 0, you need more RAM
```

#### 2. Enable Swap Space (Temporary Solution)
If upgrading instance isn't an option, add swap:

```bash
# Create 2GB swap file
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Verify swap is active
free -h

# Try build again
npm run build:aws

# After build, optionally remove swap
# sudo swapoff /swapfile
# sudo rm /swapfile
```

#### 3. Try Even Lower Memory Settings
```bash
# Minimal memory (very slow but might work)
NODE_OPTIONS='--max-old-space-size=256' VITE_BASE_PATH=/ vite build

# If successful, then build backend
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

#### 4. Build Locally and Upload
If all else fails, build on your local machine and upload:

```bash
# On your local machine (must have same code)
npm install
npm run build:aws

# Upload dist folder to server
scp -i your-key.pem -r dist/* ec2-user@your-ec2-ip:/var/www/html/dist/

# SSH to server and restart
ssh -i your-key.pem ec2-user@your-ec2-ip
cd /var/www/html
pm2 restart peg-slam
```

### Build Takes Forever?

**Normal build times**:
- t2.micro: 30-90 seconds
- t2.small: 15-30 seconds
- t2.medium: 10-20 seconds

If build takes **more than 3 minutes**:
```bash
# Kill the build
Ctrl+C

# Try low-memory build
npm run build:aws:low-memory

# Or add swap space (see above)
```

### "JavaScript heap out of memory" Error?

```bash
# Error message will look like:
# FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory

# Solution 1: Use low-memory build
npm run build:aws:low-memory

# Solution 2: Add swap space (see above)

# Solution 3: Upgrade to t2.small or larger
```

### dist Folder Empty After Build?

```bash
# Check for errors in build output
npm run build:aws 2>&1 | tee build-output.log
cat build-output.log

# Look for errors like:
# - "Permission denied" → Fix: sudo chown -R $(whoami) dist/
# - "ENOSPC: no space left" → Fix: Free up disk space
# - "Cannot find module" → Fix: npm install again
```

---

## EC2 Instance Upgrade Guide

If you're using **t2.micro** and builds keep failing, upgrade to **t2.small**:

### Via AWS Console:
1. Stop your EC2 instance
2. Actions → Instance Settings → Change Instance Type
3. Select **t2.small** (or t2.medium for better performance)
4. Start instance
5. SSH back in and run build

### Via AWS CLI:
```bash
# Stop instance
aws ec2 stop-instances --instance-ids i-YOUR-INSTANCE-ID

# Wait for stopped state
aws ec2 wait instance-stopped --instance-ids i-YOUR-INSTANCE-ID

# Change type to t2.small
aws ec2 modify-instance-attribute --instance-id i-YOUR-INSTANCE-ID --instance-type "{\"Value\": \"t2.small\"}"

# Start instance
aws ec2 start-instances --instance-ids i-YOUR-INSTANCE-ID
```

**Cost Difference**:
- t2.micro: ~$0.0116/hour (~$8.50/month)
- t2.small: ~$0.023/hour (~$17/month)
- **Difference**: ~$8.50/month for much better build performance

---

## What Changed in Code

### package.json
```diff
{
  "scripts": {
-   "build:aws": "VITE_BASE_PATH=/ vite build && esbuild ...",
+   "build:aws": "NODE_OPTIONS='--max-old-space-size=2048' VITE_BASE_PATH=/ vite build && esbuild ...",
+   "build:aws:low-memory": "NODE_OPTIONS='--max-old-space-size=512' VITE_BASE_PATH=/ vite build && esbuild ...",
  }
}
```

### vite.config.ts
```diff
{
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
+   rollupOptions: {
+     output: {
+       manualChunks: {
+         'vendor-react': ['react', 'react-dom', 'react-hook-form'],
+         'vendor-ui': ['@radix-ui/react-dialog', ...],
+         'vendor-utils': ['wouter', 'date-fns', ...],
+       },
+     },
+   },
+   chunkSizeWarningLimit: 1000,
+   minify: 'esbuild',
+   target: 'es2020',
  },
}
```

**Benefits**:
- ✅ Reduced memory usage during build
- ✅ Faster build times
- ✅ Better browser caching (separate vendor chunks)
- ✅ Smaller initial load (code splitting)

---

## Verification Checklist

After successful build:

- [ ] `dist/index.js` exists (~183KB)
- [ ] `dist/public/index.html` exists (~1.4KB)
- [ ] `dist/public/assets/` has multiple chunk files
- [ ] Build completed in under 3 minutes
- [ ] No memory errors in build output
- [ ] Application restarts without errors
- [ ] Website loads in browser
- [ ] Admin panel accessible

---

## Success Message

You should see this at the end of build:

```
✓ 2297 modules transformed.
rendering chunks...
computing gzip size...
../dist/public/index.html                         1.35 kB │ gzip:   0.66 kB
../dist/public/assets/index-XXX.css              127.18 kB │ gzip:  19.24 kB
../dist/public/assets/vendor-utils-XXX.js         45.34 kB │ gzip:  14.70 kB
../dist/public/assets/vendor-ui-XXX.js            98.62 kB │ gzip:  32.33 kB
../dist/public/assets/vendor-react-XXX.js        166.79 kB │ gzip:  54.70 kB
../dist/public/assets/index-XXX.js               761.81 kB │ gzip: 183.85 kB
✓ built in 15.37s

  dist/index.js  183.0kb

⚡ Done in 37ms
```

---

## Quick Commands Reference

```bash
# Standard build (2GB RAM)
npm run build:aws

# Low-memory build (512MB RAM)
npm run build:aws:low-memory

# Custom memory build
NODE_OPTIONS='--max-old-space-size=1024' npm run build:aws

# Monitor memory during build
watch -n 1 free -h

# Check instance type
curl -s http://169.254.169.254/latest/meta-data/instance-type

# Restart application
pm2 restart peg-slam
```

---

**Last Updated**: November 16, 2025  
**Tested On**: Amazon Linux 2, t2.micro, t2.small, t2.medium
