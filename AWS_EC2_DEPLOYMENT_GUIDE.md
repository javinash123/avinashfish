# AWS EC2 Deployment Guide - Peg Slam Application

## Complete Deployment Instructions for Amazon Linux

This guide provides step-by-step instructions to deploy the latest code to your AWS EC2 instance running Amazon Linux with MongoDB.

---

## Prerequisites

✅ AWS EC2 instance running Amazon Linux
✅ MongoDB installed and running
✅ Node.js v18+ and npm installed
✅ PM2 or systemd for process management
✅ Nginx configured as reverse proxy (optional but recommended)

---

## Environment Variables Required

Before deployment, ensure these environment variables are set on your server:

```bash
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/peg_slam

# Stripe Keys (for payment processing)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key

# Email Service (Resend for password reset)
RESEND_API_KEY=re_your_resend_api_key

# Session Secret (generate a random string)
SESSION_SECRET=your_very_long_random_session_secret_here

# Base Path (if deploying to subdirectory)
VITE_BASE_PATH=/
BASE_PATH=/

# Production Mode
NODE_ENV=production

# CORS (if needed for external domains)
# ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

## Deployment Steps

### Step 1: Backup Current Deployment

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Navigate to your application directory
cd /var/www/html  # or your app directory

# Create backup
sudo cp -r . ../backup-$(date +%Y%m%d-%H%M%S)
```

### Step 2: Pull Latest Code

```bash
# If using Git
git pull origin main

# Or upload new code via SCP from your local machine
# scp -i your-key.pem -r /path/to/project/* ec2-user@your-ec2-ip:/var/www/html/
```

### Step 3: Install Dependencies

```bash
# Install/update Node.js dependencies
npm install

# If you see EACCES errors, use sudo
sudo npm install
```

### Step 4: Build the Application

```bash
# Build for production
npm run build:aws

# You should see output like:
# ✓ 2297 modules transformed.
# ✓ built in 17.56s
# dist/index.js  182.6kb
# ⚡ Done in 24ms
```

**Note**: The PostCSS warning is harmless and doesn't affect functionality.

### Step 5: Verify Build Output

```bash
# Check that dist folder was created
ls -la dist/

# Should show:
# - index.js (bundled backend server)
# - public/ (frontend files)

# Check frontend files
ls -la dist/public/

# Should show:
# - index.html
# - assets/ (CSS and JS bundles)
```

### Step 6: Set Environment Variables

```bash
# Option A: Create .env file (if using dotenv-cli)
sudo nano .env

# Paste your environment variables
MONGODB_URI=mongodb://localhost:27017/peg_slam
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...
RESEND_API_KEY=re_...
SESSION_SECRET=your_session_secret
NODE_ENV=production
BASE_PATH=/

# Save and exit (Ctrl+X, Y, Enter)

# Option B: Export environment variables in PM2 ecosystem file
# (See PM2 section below)
```

### Step 7: Start/Restart Application

#### Using PM2 (Recommended)

```bash
# Stop existing process
pm2 stop peg-slam

# Start with updated code
pm2 start dist/index.js --name peg-slam

# Or use ecosystem file
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

**PM2 Ecosystem File Example** (`ecosystem.config.js`):

```javascript
module.exports = {
  apps: [{
    name: 'peg-slam',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb://localhost:27017/peg_slam',
      STRIPE_SECRET_KEY: 'sk_live_...',
      VITE_STRIPE_PUBLIC_KEY: 'pk_live_...',
      RESEND_API_KEY: 're_...',
      SESSION_SECRET: 'your_session_secret',
      BASE_PATH: '/'
    }
  }]
}
```

#### Using systemd

```bash
# Restart service
sudo systemctl restart peg-slam

# Check status
sudo systemctl status peg-slam

# View logs
sudo journalctl -u peg-slam -f
```

### Step 8: Verify Deployment

```bash
# Check if application is running
pm2 status
# or
sudo systemctl status peg-slam

# Check logs for errors
pm2 logs peg-slam
# or
sudo journalctl -u peg-slam -f

# Test local endpoint
curl http://localhost:5000/api/site-settings

# Should return JSON with site settings
```

### Step 9: Test in Browser

Visit your domain/IP address:
- Homepage should load with "UK's Premier Fishing Competitions"
- Navigation menu should work
- Admin panel should be accessible at `/admin`
- Competitions, Gallery, News pages should display data from MongoDB

---

## Troubleshooting

### Build Fails with "npm ERR! code EACCES"

```bash
# Fix permissions
sudo chown -R $(whoami) .
npm run build:aws
```

### "tsx: not found" Error

```bash
# Install tsx globally
sudo npm install -g tsx

# Or install locally
npm install tsx
```

### Application Won't Start

```bash
# Check MongoDB is running
sudo systemctl status mongod

# Start MongoDB if stopped
sudo systemctl start mongod

# Check environment variables
pm2 env 0  # Shows env vars for first process

# Check logs
pm2 logs peg-slam --lines 100
```

### Blank Page in Browser

**Check Browser Console** (F12 → Console):

1. **401 errors for /api/user/me** → Normal when not logged in
2. **CORS errors** → Check ALLOWED_ORIGINS environment variable
3. **404 for assets** → Rebuild with `npm run build:aws`
4. **Stripe errors** → Verify VITE_STRIPE_PUBLIC_KEY is set

**Check Server Logs**:

```bash
pm2 logs peg-slam --lines 50
```

### Stripe Payment Form Not Loading

The Stripe public key must be available at runtime. After building:

```bash
# Inject Stripe key into index.html
export VITE_STRIPE_PUBLIC_KEY='pk_live_your_key_here'
sed -i "s|</head>|<script>window.RUNTIME_CONFIG={VITE_STRIPE_PUBLIC_KEY:'${VITE_STRIPE_PUBLIC_KEY}'};</script></head>|" dist/public/index.html
```

Or use the automated script:

```bash
./scripts/deploy-aws-runtime-config.sh
```

### MongoDB Connection Failed

```bash
# Check MongoDB status
sudo systemctl status mongod

# Check connection string in .env
cat .env | grep MONGODB_URI

# Test MongoDB connection
mongosh mongodb://localhost:27017/peg_slam
```

### Port 5000 Already in Use

```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill process
sudo kill -9 <PID>

# Or change port in server/index.ts
```

---

## Nginx Configuration (If Using Reverse Proxy)

If you're using Nginx to proxy requests to your Node.js app:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Reload Nginx after changes:

```bash
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

---

## Quick Deployment Checklist

- [ ] Backup current deployment
- [ ] Pull latest code (git pull or upload via SCP)
- [ ] Install dependencies (`npm install`)
- [ ] Build application (`npm run build:aws`)
- [ ] Verify dist/ folder exists with index.js and public/ directory
- [ ] Set environment variables (MONGODB_URI, STRIPE keys, etc.)
- [ ] Restart application (PM2 or systemd)
- [ ] Check logs for errors
- [ ] Test in browser (homepage, admin panel, competitions)
- [ ] Verify MongoDB connection
- [ ] Test Stripe payment flow (if applicable)

---

## Important Notes

1. **MongoDB Required**: Application requires MongoDB connection. In-memory storage is only for development.

2. **Environment Variables**: VITE_* variables are embedded at BUILD time. If you change them, rebuild the app.

3. **Stripe Keys**: Use live keys (pk_live_*, sk_live_*) for production, test keys (pk_test_*, sk_test_*) for staging.

4. **Session Secret**: Generate a strong random string for SESSION_SECRET. Never commit it to Git.

5. **PostCSS Warning**: The "PostCSS plugin did not pass the from option" warning is harmless and doesn't affect functionality.

6. **Build Output**: The build is successful when you see:
   ```
   ✓ built in XX.XXs
   dist/index.js  182.6kb
   ⚡ Done in XXms
   ```

---

## Support

If deployment fails:

1. Check server logs: `pm2 logs peg-slam --lines 100`
2. Check MongoDB status: `sudo systemctl status mongod`
3. Verify environment variables: `pm2 env 0`
4. Test local endpoint: `curl http://localhost:5000/api/site-settings`
5. Check browser console (F12) for client-side errors

For additional help, check the project documentation or contact support.

---

**Last Updated**: November 16, 2025
**Application Version**: Production Ready
**Deployment Target**: AWS EC2 Amazon Linux + MongoDB
