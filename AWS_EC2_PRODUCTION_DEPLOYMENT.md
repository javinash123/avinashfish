# AWS EC2 Production Deployment Guide (Amazon Linux)

This guide covers deploying your Peg Slam fishing competition platform to AWS EC2 with Amazon Linux and MongoDB.

## ✅ Recent Critical Fixes Applied

### 1. Build Hanging Issue - FIXED ✅
**Problem**: `npm run build` was hanging indefinitely on Amazon Linux with Node 20.16
**Root Cause**: Custom `manualChunks` configuration in `vite.config.ts` triggered worker thread deadlock with Vite 5 + esbuild
**Solution**: Removed custom bundling configuration (simplified vite.config.ts)
**Result**: Build now completes in ~17 seconds

### 2. Anglers Menu Blank - FIXED ✅
**Problem**: Anglers menu showed blank even with data in MongoDB
**Root Cause**: MongoDB storage was missing `listAnglers()` method implementation
**Solution**: Added full `listAnglers()` method with search, sort, and pagination support
**Result**: Anglers menu now displays all users from MongoDB database

---

## Prerequisites

- AWS EC2 instance with Amazon Linux 2023
- Node.js 20.x installed
- MongoDB Atlas cluster (or local MongoDB)
- PM2 for process management
- Nginx for reverse proxy (optional but recommended)

---

## Step 1: Install Required Software

```bash
# Update system packages
sudo dnf update -y

# Install Node.js 20.x
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx (optional, for reverse proxy)
sudo dnf install -y nginx
```

---

## Step 2: Clone and Setup Project

```bash
# Navigate to your deployment directory
cd /var/www  # or your preferred location

# Clone your repository (replace with your repo URL)
git clone <your-repo-url> peg-slam
cd peg-slam

# Install dependencies
npm install
```

---

## Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```bash
nano .env
```

Add the following configuration:

```env
# Production environment
NODE_ENV=production

# MongoDB Connection
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/peg_slam?retryWrites=true&w=majority

# Stripe API Keys (for payments)
STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here
VITE_STRIPE_PUBLIC_KEY=pk_live_your_live_public_key_here

# Email Service (Resend)
RESEND_API_KEY=re_your_resend_api_key_here

# Session Secret (generate a strong random string)
SESSION_SECRET=your-super-secure-random-session-secret-here

# Domain Configuration (if using subdomain deployment)
# VITE_BASE_PATH=/pegslam
# Leave commented out for root domain deployment

# CORS Configuration (optional - for cross-origin requests)
# ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**Important Notes**:
- Replace all placeholder values with your actual credentials
- Never commit `.env` to version control
- Use strong, randomly generated SESSION_SECRET
- For MongoDB URI, ensure IP whitelist allows your EC2 instance

---

## Step 4: Build the Application

```bash
# Build frontend and backend for production
npm run build

# Verify build completed successfully
ls -la dist/
# You should see:
# - dist/public/ (frontend assets)
# - dist/index.js (backend bundle)
```

**Expected build time**: ~15-20 seconds (no hanging!)

---

## Step 5: Start Application with PM2

```bash
# Start the application
pm2 start npm --name "peg-slam" -- start

# Verify it's running
pm2 status

# View logs
pm2 logs peg-slam

# Make PM2 restart on system reboot
pm2 startup
pm2 save
```

---

## Step 6: Configure Nginx Reverse Proxy (Optional)

If you want to serve the app on port 80/443 instead of 5000:

```bash
sudo nano /etc/nginx/conf.d/peg-slam.conf
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Start and enable Nginx:

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

---

## Step 7: Configure Firewall

```bash
# Allow HTTP and HTTPS traffic
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# If not using Nginx, allow port 5000 directly
sudo firewall-cmd --permanent --add-port=5000/tcp

# Reload firewall
sudo firewall-cmd --reload

# Verify rules
sudo firewall-cmd --list-all
```

---

## Deployment Workflow

### Initial Deployment

```bash
# 1. Pull latest code
cd /var/www/peg-slam
git pull origin main

# 2. Install dependencies
npm install

# 3. Build application
npm run build

# 4. Restart PM2 process
pm2 restart peg-slam

# 5. Verify deployment
pm2 logs peg-slam --lines 50
```

### Subsequent Updates

```bash
# Quick deployment script
cd /var/www/peg-slam && \
git pull origin main && \
npm install && \
npm run build && \
pm2 restart peg-slam && \
pm2 logs peg-slam --lines 20
```

---

## Troubleshooting

### Issue: Build Hangs or Takes Too Long

**Status**: ✅ FIXED in latest version

If you're on an older version, update vite.config.ts:

```typescript
// Remove the custom manualChunks configuration
build: {
  outDir: path.resolve(import.meta.dirname, "dist/public"),
  emptyOutDir: true,
  // Custom chunking removed to prevent build hanging
  chunkSizeWarningLimit: 1000,
  minify: 'esbuild',
  target: 'es2020',
}
```

### Issue: Anglers Menu Shows Blank

**Status**: ✅ FIXED in latest version

Verify MongoDB connection and data:

```bash
# Check PM2 logs for MongoDB connection
pm2 logs peg-slam | grep -i mongo

# You should see: "✅ Connected to MongoDB Atlas successfully"

# Test API endpoint
curl http://localhost:5000/api/anglers
# Should return JSON array of anglers
```

### Issue: MongoDB Connection Failed

```bash
# Check if MongoDB URI is set
cat .env | grep MONGODB_URI

# Verify MongoDB Atlas IP whitelist includes your EC2 IP
curl ifconfig.me  # Get your EC2 public IP

# Test MongoDB connection string
node -e "const { MongoClient } = require('mongodb'); \
new MongoClient(process.env.MONGODB_URI).connect() \
.then(() => console.log('✅ Connected')) \
.catch(err => console.error('❌ Failed:', err.message));"
```

### Issue: Stripe Payments Not Working

The app now includes runtime configuration support for Stripe keys:

```bash
# 1. Set environment variables
export VITE_STRIPE_PUBLIC_KEY='pk_live_your_key_here'

# 2. Rebuild with runtime config injection
npm run build

# 3. Inject Stripe key into built HTML
sed -i "s|</head>|<script>window.RUNTIME_CONFIG={VITE_STRIPE_PUBLIC_KEY:'${VITE_STRIPE_PUBLIC_KEY}'};</script></head>|" dist/public/index.html

# 4. Restart application
pm2 restart peg-slam
```

### Issue: CORS Errors (Blank Page)

**Status**: ✅ FIXED - Same-origin requests now allowed by default

If you need to restrict cross-origin access:

```env
# Add to .env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Issue: 404 Errors for Assets

Verify static file serving:

```bash
# Check if dist/public exists and contains assets
ls -la dist/public/
ls -la dist/public/assets/

# Check nginx logs (if using nginx)
sudo tail -f /var/log/nginx/error.log

# Check PM2 logs
pm2 logs peg-slam
```

---

## Performance Optimization

### 1. Enable Gzip Compression (Nginx)

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

### 2. PM2 Cluster Mode

For better performance with multiple CPU cores:

```bash
pm2 delete peg-slam
pm2 start npm --name "peg-slam" -i max -- start
pm2 save
```

### 3. MongoDB Connection Pooling

Already configured in the application. No changes needed.

---

## Monitoring and Maintenance

### Monitor Application

```bash
# Real-time logs
pm2 logs peg-slam

# Application metrics
pm2 monit

# Process status
pm2 status
```

### Database Backup

```bash
# MongoDB Atlas handles automatic backups
# Configure backup retention in MongoDB Atlas dashboard

# Or export data manually:
mongodump --uri="<your-mongodb-uri>" --out=/backups/$(date +%Y%m%d)
```

### Update SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo dnf install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is configured by default
sudo certbot renew --dry-run
```

---

## Security Checklist

- [ ] Strong SESSION_SECRET configured
- [ ] MongoDB IP whitelist configured
- [ ] Firewall rules configured (only necessary ports open)
- [ ] SSL certificate installed (HTTPS)
- [ ] Environment variables secured (not in version control)
- [ ] Regular security updates: `sudo dnf update`
- [ ] PM2 logs rotation configured
- [ ] Database backups enabled

---

## Support and Resources

- MongoDB Atlas: https://cloud.mongodb.com
- Stripe Dashboard: https://dashboard.stripe.com
- Resend Dashboard: https://resend.com/dashboard
- PM2 Documentation: https://pm2.keymetrics.io
- Nginx Documentation: https://nginx.org/en/docs

---

## Summary of Recent Fixes

✅ **Build hanging issue**: Removed custom Vite bundling (vite.config.ts)
✅ **Anglers menu blank**: Added `listAnglers()` method to MongoDB storage
✅ **CORS blank page**: Fixed same-origin request handling
✅ **Stripe runtime config**: Added support for environment variable injection after build

**Your application is now production-ready and optimized for AWS EC2 deployment!**
