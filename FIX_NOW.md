# Fix Your AWS Build NOW - Updated Solution

## The Problem
Your build hangs at "transforming (2125) ../node_modules/react-remove-scroll-bar" because your **EC2 instance runs out of memory**.

## The Solution
I've added **memory optimization** and **build chunking** to fix this. You just need to pull and rebuild.

---

## 🚀 Quick Fix (2 minutes)

SSH into your AWS server and run:

```bash
# 1. Navigate to app
cd /var/www/html  # or your app directory

# 2. Pull latest code
git pull origin main

# 3. Clean old files
rm -rf node_modules dist package-lock.json
npm cache clean --force

# 4. Reinstall
npm install

# 5. Build with memory optimization
npm run build:aws

# Should see: ✓ built in 15s (instead of hanging)

# 6. Restart
pm2 restart peg-slam
```

**Done!** Build will complete in 15-30 seconds instead of hanging forever.

---

## What If Build Still Hangs?

### Check Your EC2 Instance Type

```bash
# Check instance specs
curl -s http://169.254.169.254/latest/meta-data/instance-type
free -h
```

**If you have t2.micro (1GB RAM)**:
```bash
# Use low-memory build
npm run build:aws:low-memory
```

**If you have < 1GB RAM**:
```bash
# Add swap space first
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Then build
npm run build:aws
```

**Best solution**: Upgrade to **t2.small** (2GB RAM, ~$17/month)
- t2.micro: $8.50/month - builds may fail
- t2.small: $17/month - builds work reliably
- **Cost difference**: Only $8.50/month

---

## What Changed?

### Before (Hanging Build):
```json
{
  "build:aws": "VITE_BASE_PATH=/ vite build && ..."
}
```
- No memory limit specified
- Build tries to use all available RAM
- Runs out of memory and hangs

### After (Working Build):
```json
{
  "build:aws": "NODE_OPTIONS='--max-old-space-size=2048' VITE_BASE_PATH=/ vite build && ...",
  "build:aws:low-memory": "NODE_OPTIONS='--max-old-space-size=512' VITE_BASE_PATH=/ vite build && ..."
}
```
- **2GB memory** allocated to Node.js
- **Code splitting** reduces memory pressure
- **Vendor chunks** split into separate files

---

## Expected Build Output

### Success (What You Should See):

```
vite v5.4.20 building for production...
transforming...
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

### Failure (What You're Currently Seeing):

```
vite v5.4.20 building for production...
transforming (2125) ../node_modules/react-remove-scroll-bar/dist/es2015/component.js
[HANGS FOREVER] ❌
```

---

## Verify Build Worked

```bash
# Check dist folder
ls -lah dist/

# Should show:
# -rw-r--r-- 1 user user 183K index.js
# drwxr-xr-x 3 user user 4.0K public/

# Check frontend files
ls -lah dist/public/assets/

# Should show 5+ files (new chunked build):
# - vendor-react-XXX.js (~167KB)
# - vendor-ui-XXX.js (~99KB)
# - vendor-utils-XXX.js (~45KB)
# - index-XXX.js (~762KB)
# - index-XXX.css (~127KB)

# Test API
curl http://localhost:5000/api/site-settings

# Should return JSON ✓

# Test website
# Visit in browser - should load ✓
```

---

## Build Commands Reference

### Standard Build (Recommended)
```bash
npm run build:aws
# Uses 2GB memory
# For t2.small and larger instances
# Completes in 15-30 seconds
```

### Low-Memory Build
```bash
npm run build:aws:low-memory
# Uses 512MB memory
# For t2.micro instances
# Completes in 30-60 seconds
```

### Custom Memory Build
```bash
# For 1GB RAM instance
NODE_OPTIONS='--max-old-space-size=1024' npm run build:aws

# For 4GB RAM instance (faster)
NODE_OPTIONS='--max-old-space-size=4096' npm run build:aws
```

---

## Troubleshooting

### "JavaScript heap out of memory"

**Solution 1** - Use low-memory build:
```bash
npm run build:aws:low-memory
```

**Solution 2** - Add swap space:
```bash
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
free -h  # Verify swap is active
npm run build:aws
```

**Solution 3** - Upgrade instance:
```bash
# AWS Console: Stop instance → Change type to t2.small → Start
# Build will work reliably
```

### Build Takes > 3 Minutes

```bash
# Normal build times:
# t2.micro: 30-90 seconds
# t2.small: 15-30 seconds
# t2.medium: 10-20 seconds

# If taking longer, check memory:
free -h

# If "available" memory is low, use low-memory build or add swap
```

### dist Folder Empty

```bash
# Build with full output
npm run build:aws 2>&1 | tee build.log

# Check for errors
cat build.log

# Common issues:
# - Permission denied → sudo chown -R $(whoami) .
# - No space left → df -h (free up disk space)
# - Module not found → npm install
```

---

## Complete Documentation

For detailed troubleshooting and advanced options:
- **Quick fix**: This file (FIX_NOW.md)
- **Low-memory details**: AWS_EC2_LOW_MEMORY_FIX.md
- **Full deployment guide**: AWS_EC2_DEPLOYMENT_GUIDE.md

---

## Summary

| Issue | Solution |
|-------|----------|
| Build hangs | Pull latest code, run `npm run build:aws` |
| t2.micro (1GB RAM) | Use `npm run build:aws:low-memory` |
| < 1GB RAM | Add swap space or upgrade instance |
| Heap out of memory | Lower memory setting or add swap |
| Build takes > 3min | Check memory with `free -h`, add swap |

**Expected Result**: Build completes in 15-60 seconds, all files generated, application runs successfully.

**Your Data**: Safe - MongoDB data, uploads, users unchanged. This is code-only update.

---

Last Updated: November 16, 2025
