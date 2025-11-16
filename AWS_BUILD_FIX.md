# AWS EC2 Build Fix - Complete Solution

## Problem
Build hangs after "✓ 2297 modules transformed" and never completes on AWS EC2.

## Root Cause
Conflicting Tailwind CSS packages:
- `@tailwindcss/vite` v4 (newer plugin) - **REMOVED** ✅
- `tailwindcss` v3 (stable) - **KEPT** ✅

The v4 plugin was causing build to hang. This has been fixed in the latest code.

---

## Fix for AWS EC2 Server

### Step 1: SSH into Your Server

```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
cd /var/www/html  # or your app directory
```

### Step 2: Backup Current Installation

```bash
# Create backup
sudo cp -r . ../backup-before-fix-$(date +%Y%m%d-%H%M%S)
echo "✓ Backup created"
```

### Step 3: Pull Latest Code

```bash
# Pull latest code (with fix)
git pull origin main

# Or if uploading manually, upload these files:
# - package.json (updated - @tailwindcss/vite removed)
# - All other project files
```

### Step 4: Clean Everything

```bash
# Remove old dependencies and build artifacts
rm -rf node_modules
rm -rf dist
rm -rf package-lock.json

# Clear npm cache (important!)
npm cache clean --force

echo "✓ Cleaned old files"
```

### Step 5: Reinstall Dependencies

```bash
# Reinstall with fresh package.json
npm install

# Verify @tailwindcss/vite is NOT installed
npm list @tailwindcss/vite
# Should show: (empty)

echo "✓ Dependencies installed"
```

### Step 6: Build Application

```bash
# Build (should complete in 15-20 seconds now)
npm run build:aws

# You should see:
# ✓ 2297 modules transformed.
# ✓ built in 16s          <-- Should appear now!
# dist/index.js  182.6kb  <-- Backend built
# ⚡ Done in 29ms          <-- All done!
```

### Step 7: Verify Build Output

```bash
# Check dist folder
ls -lah dist/
# Should show:
# - index.js (180-190KB)
# - public/ (folder)

# Check frontend files
ls -lah dist/public/
# Should show:
# - index.html
# - assets/ (folder with CSS and JS files)

# Check assets
ls -lah dist/public/assets/
# Should show:
# - index-XXXXX.css (125-130KB)
# - index-XXXXX.js (1MB+)

echo "✓ Build verified"
```

### Step 8: Inject Stripe Configuration (If Using Payments)

```bash
# Set your Stripe public key
export VITE_STRIPE_PUBLIC_KEY='pk_live_your_key_here'

# Inject into built index.html
sed -i "s|</head>|<script>window.RUNTIME_CONFIG={VITE_STRIPE_PUBLIC_KEY:'${VITE_STRIPE_PUBLIC_KEY}'};</script></head>|" dist/public/index.html

echo "✓ Stripe configuration injected"
```

### Step 9: Restart Application

```bash
# Using PM2
pm2 restart peg-slam

# Or using systemd
sudo systemctl restart peg-slam

echo "✓ Application restarted"
```

### Step 10: Verify Everything Works

```bash
# Check logs
pm2 logs peg-slam --lines 50

# Test API endpoint
curl http://localhost:5000/api/site-settings
# Should return JSON

# Check website in browser
# Should see: "UK's Premier Fishing Competitions"
```

---

## Troubleshooting Build Issues

### Build Still Hangs?

**Check Node.js version** (must be v18+):
```bash
node --version
# Should be: v18.x.x or v20.x.x

# If old version, update Node.js:
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

**Check available memory**:
```bash
free -h
# If less than 1GB free, try:
sudo npm run build:aws --max-old-space-size=512
```

**Try building with verbose output**:
```bash
NODE_OPTIONS="--max-old-space-size=2048" npm run build:aws
```

### dist Folder Empty After Build?

```bash
# Check for build errors
npm run build:aws 2>&1 | tee build.log
cat build.log

# Verify write permissions
ls -la dist/
sudo chown -R $(whoami) dist/
```

### "Cannot find module" Errors?

```bash
# Reinstall specific package
npm install esbuild vite --save-dev

# Or reinstall all
rm -rf node_modules package-lock.json
npm install
```

### PostCSS Warning (Safe to Ignore)

This warning is harmless:
```
A PostCSS plugin did not pass the `from` option to `postcss.parse`
```

It doesn't affect functionality. Ignore it.

---

## Quick Verification Commands

```bash
# 1. Check package.json has fix
grep "@tailwindcss/vite" package.json
# Should return: (nothing) - package removed

# 2. Check node_modules doesn't have it
ls node_modules/@tailwindcss/
# Should show: typography (NOT vite)

# 3. Check build output
ls -lah dist/index.js dist/public/index.html
# Both files should exist

# 4. Check file sizes
du -h dist/index.js
# Should be: ~180-190K

du -h dist/public/assets/
# Should be: ~1.2M total
```

---

## Environment Variables Reminder

After build completes, ensure these are set:

```bash
# In .env file or PM2 ecosystem.config.js:
MONGODB_URI=mongodb://localhost:27017/peg_slam
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...
RESEND_API_KEY=re_...
SESSION_SECRET=your_random_secret
NODE_ENV=production
BASE_PATH=/
```

---

## What Changed?

| Before (Broken) | After (Fixed) |
|-----------------|---------------|
| Had @tailwindcss/vite v4 installed | Removed @tailwindcss/vite |
| Build hung after transforming modules | Build completes in 15-20 seconds |
| dist/ folder empty | dist/ has index.js + public/ |
| Conflicting Tailwind configs | Clean Tailwind v3 setup |

---

## Success Checklist

- [ ] Backed up current installation
- [ ] Pulled latest code (git pull)
- [ ] Removed node_modules, dist, package-lock.json
- [ ] Cleared npm cache (`npm cache clean --force`)
- [ ] Installed dependencies (`npm install`)
- [ ] Verified @tailwindcss/vite is NOT installed
- [ ] Built application (`npm run build:aws`)
- [ ] Saw "✓ built in 16s" message
- [ ] Verified dist/index.js exists (~180-190KB)
- [ ] Verified dist/public/index.html exists
- [ ] Verified dist/public/assets/ has CSS and JS files
- [ ] Injected Stripe configuration (if needed)
- [ ] Restarted application (PM2 or systemd)
- [ ] Checked logs for errors
- [ ] Tested website in browser

---

## Need More Help?

If build still fails:

1. **Share complete build output**:
   ```bash
   npm run build:aws 2>&1 | tee build-output.txt
   cat build-output.txt
   ```

2. **Check system resources**:
   ```bash
   free -h
   df -h
   ```

3. **Check Node.js version**:
   ```bash
   node --version
   npm --version
   ```

4. **Try building with more memory**:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm run build:aws
   ```

---

**Expected Result**: Build completes in 15-20 seconds, dist/ folder has all files, application runs successfully.

**Last Updated**: November 16, 2025
