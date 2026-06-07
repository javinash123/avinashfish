# AWS EC2 Deployment Guide for Peg Slam

This guide explains how to deploy the Peg Slam application to AWS EC2 with Amazon Linux and MongoDB.

## Overview

The application consists of:
- **Frontend**: React + Vite (built to static assets)
- **Backend**: Express.js server
- **Database**: MongoDB Atlas (cloud-hosted)
- **File Storage**: Local filesystem (`attached_assets/` directory)

## Critical Path Fix - Asset Serving

**IMPORTANT**: The blank screen issue with 500 errors on `/assets/index-xxx.css` has been fixed!

### The Problem
- Vite builds CSS/JS files to `/assets/` directory (e.g., `/assets/index-xxx.css`)
- Server was serving `/assets` from `attached_assets` folder (for uploaded logos/images)
- When browser requested `/assets/index-xxx.css`, it got a 500 error because the file didn't exist in `attached_assets`

### The Solution
The application now serves files from two paths with **full backwards compatibility**:

| URL Pattern | Serves From | Purpose |
|-------------|-------------|---------|
| `/assets/index-xxx.css` | `dist/public/assets/` | Vite-built CSS/JS bundles |
| `/assets/uploads/...` | `attached_assets/uploads/` | **Legacy** uploaded files (backwards compatible) |
| `/attached-assets/...` | `attached_assets/` | **New** uploaded files |

**What This Means:**
- ✅ All existing uploaded files continue working (no broken images!)
- ✅ Vite bundles (CSS/JS) now load correctly
- ✅ New file uploads use `/attached-assets/` path
- ✅ Zero downtime deployment - nothing breaks!

### Backwards Compatibility Guarantee
**Your existing production data is safe!** The server supports BOTH old and new URL patterns:
- Old: `https://pegslam.com/assets/uploads/logo/mylogo.svg` → ✅ Works
- New: `https://pegslam.com/attached-assets/uploads/logo/mylogo.svg` → ✅ Works
- Vite: `https://pegslam.com/assets/index-A42RyR3n.css` → ✅ Works

No database migration needed. Deploy with confidence!

## Pre-deployment Checklist

### 1. Build the Application Locally

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

This creates:
```
dist/
  index.js           # Compiled server code
  public/            # Static frontend assets
    assets/          # Vite-generated CSS/JS files
    index.html       # Entry point
```

### 2. Files to Upload to EC2

Upload these directories/files to your EC2 instance:
```
dist/                    # Built application
attached_assets/         # Uploaded files (logos, images, etc.)
  uploads/              
    logo/
    slider/
    gallery/
    sponsors/
    news/
node_modules/            # Production dependencies
package.json
.env                     # Environment variables (see below)
```

**Alternative**: Install dependencies on server:
```bash
npm install --production
```

## Environment Configuration

Create a `.env` file on your EC2 instance with these variables:

```bash
# Node Environment
NODE_ENV=production

# Server Configuration
PORT=7118                                    # Your server port
EXPRESS_BASE_PATH=                           # Empty for root domain (pegslam.com)

# Session Security
SESSION_SECRET=your-secure-random-secret-here  # Generate a strong secret!

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/peg_slam?retryWrites=true&w=majority

# Stripe Payment Processing
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxxxxxxxxxx

# Email Service (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# CORS Configuration (if needed)
ALLOWED_ORIGINS=https://pegslam.com,https://www.pegslam.com
```

### Environment Variable Details

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Must be `production` for production deployment |
| `PORT` | Optional | Server port (default: 5000) |
| `EXPRESS_BASE_PATH` | Optional | Leave empty for root domain deployment |
| `SESSION_SECRET` | **CRITICAL** | Strong random string for session encryption |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `STRIPE_SECRET_KEY` | Yes (if using payments) | Stripe secret key for payment processing |
| `VITE_STRIPE_PUBLIC_KEY` | Yes (if using payments) | Stripe publishable key |
| `RESEND_API_KEY` | Yes (if using email) | Resend API key for password reset emails |
| `ALLOWED_ORIGINS` | Optional | Comma-separated list of allowed CORS origins |

## Deployment Steps

### 1. Connect to EC2 Instance

```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
```

### 2. Install Node.js (if not installed)

```bash
# Install Node.js 20.x
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

### 3. Upload Application Files

```bash
# From your local machine
scp -i your-key.pem -r dist/ ec2-user@your-ec2-ip:/home/ec2-user/pegslam/
scp -i your-key.pem -r attached_assets/ ec2-user@your-ec2-ip:/home/ec2-user/pegslam/
scp -i your-key.pem package.json ec2-user@your-ec2-ip:/home/ec2-user/pegslam/
scp -i your-key.pem .env ec2-user@your-ec2-ip:/home/ec2-user/pegslam/
```

### 4. Install Dependencies on Server

```bash
cd /home/ec2-user/pegslam
npm install --production
```

### 5. Start the Application

#### Option A: Direct Start (for testing)

```bash
npm start
# or
node dist/index.js
```

#### Option B: Using PM2 (Recommended)

PM2 keeps your application running and restarts it if it crashes.

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start application with PM2
pm2 start dist/index.js --name pegslam

# Save PM2 configuration
pm2 save

# Configure PM2 to start on boot
pm2 startup
# Follow the instructions printed by the command above

# View logs
pm2 logs pegslam

# Monitor application
pm2 monit

# Restart application
pm2 restart pegslam

# Stop application
pm2 stop pegslam
```

### 6. Configure Nginx Reverse Proxy (Optional but Recommended)

If you're using Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name pegslam.com www.pegslam.com;

    location / {
        proxy_pass http://localhost:7118;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Increase timeout for file uploads
    client_max_body_size 100M;
}
```

## Important Notes for Production

### 1. File Storage (`attached_assets/`)

The `attached_assets/` directory contains all uploaded files:
- Logos
- Slider images
- Gallery images
- Sponsor logos
- News images

**CRITICAL**: This directory must exist on the server and be writable:

```bash
cd /home/ec2-user/pegslam
mkdir -p attached_assets/uploads/{logo,slider,gallery,sponsors,news}
chmod -R 755 attached_assets
```

**Backup Strategy**: Regularly backup this directory as it contains user-uploaded content that isn't in your codebase.

### 2. MongoDB Connection

Ensure your MongoDB Atlas cluster allows connections from your EC2 instance:
1. Go to MongoDB Atlas Network Access
2. Add your EC2 instance's public IP address
3. Or use `0.0.0.0/0` for any IP (less secure but easier for testing)

### 3. Session Secret

**NEVER use the default session secret in production!**

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use this value for `SESSION_SECRET` in your `.env` file.

### 4. HTTPS/SSL Configuration

For production, you should use HTTPS:

1. **Option A**: Use Nginx with Let's Encrypt (free SSL)
```bash
sudo certbot --nginx -d pegslam.com -d www.pegslam.com
```

2. **Option B**: Use AWS Application Load Balancer with ACM (AWS Certificate Manager)

### 5. Firewall Configuration

Ensure EC2 security group allows:
- Port 22 (SSH) from your IP only
- Port 80 (HTTP) from anywhere
- Port 443 (HTTPS) from anywhere
- Port 7118 (your app) only if not using reverse proxy

## Redeployment Process

When you need to deploy updates:

### 1. Build Locally
```bash
npm run build
```

### 2. Upload New Build
```bash
scp -i your-key.pem -r dist/ ec2-user@your-ec2-ip:/home/ec2-user/pegslam/
```

### 3. Restart Application
```bash
# SSH into server
ssh -i your-key.pem ec2-user@your-ec2-ip

# Restart with PM2
pm2 restart pegslam

# Or manual restart (if not using PM2)
# pkill node
# npm start
```

### 4. Verify Deployment
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs pegslam --lines 50

# Check if server is responding
curl http://localhost:7118
```

## Troubleshooting

### Issue: Blank screen with 500 errors on CSS/JS files

**Symptom**: `GET /assets/index-xxx.css` returns 500 error

**Cause**: This was a path conflict between Vite assets and uploaded files.

**Solution**: Fixed in latest code. Make sure you're deploying the updated version with:
- `server/index.ts`: Line 148 uses `/attached-assets`
- `server/routes.ts`: Line 166 uses `/attached-assets/uploads/`
- `client/index.html`: Line 11 uses `/attached-assets/uploads/`

### Issue: MongoDB connection fails

**Check**:
```bash
# Test MongoDB connection
node -e "require('mongodb').MongoClient.connect(process.env.MONGODB_URI).then(() => console.log('Connected!')).catch(e => console.error(e))"
```

### Issue: Uploaded files return 404

**Check**:
```bash
# Verify directory exists and is readable
ls -la attached_assets/uploads/

# Check permissions
chmod -R 755 attached_assets
```

### Issue: Application crashes on startup

**Check logs**:
```bash
# PM2 logs
pm2 logs pegslam

# Or direct logs
node dist/index.js 2>&1 | tee app.log
```

Common causes:
- Missing environment variables
- MongoDB connection failure
- Port already in use
- Missing `dist/` directory

## Monitoring

### View Application Logs
```bash
pm2 logs pegslam --lines 100
```

### Monitor Resource Usage
```bash
pm2 monit
```

### Check Application Health
```bash
# Check if process is running
pm2 status

# Make HTTP request
curl -I http://localhost:7118

# Check MongoDB connection
pm2 logs pegslam | grep -i "mongodb"
```

## Backup Strategy

### 1. MongoDB Backups
MongoDB Atlas provides automatic backups. Ensure they're enabled in your Atlas cluster settings.

### 2. File Storage Backups
```bash
# Backup attached_assets to S3 (example)
aws s3 sync /home/ec2-user/pegslam/attached_assets/ s3://your-bucket/pegslam-backups/attached_assets/

# Or compress and download
tar -czf attached_assets-$(date +%Y%m%d).tar.gz attached_assets/
```

### 3. Application Code
Keep your codebase in Git/GitHub. Tag releases:
```bash
git tag -a v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0
```

## Security Checklist

- [ ] Strong `SESSION_SECRET` configured
- [ ] HTTPS/SSL enabled
- [ ] MongoDB IP whitelist configured
- [ ] EC2 security group properly configured
- [ ] Environment variables not committed to Git
- [ ] Regular backups configured
- [ ] PM2 configured to restart on crashes
- [ ] Monitoring/logging set up
- [ ] File upload size limits configured
- [ ] CORS properly configured for your domain

## Support

For issues specific to this deployment setup, refer to:
- Express.js documentation: https://expressjs.com/
- PM2 documentation: https://pm2.keymetrics.io/
- MongoDB Atlas documentation: https://docs.atlas.mongodb.com/
- AWS EC2 documentation: https://docs.aws.amazon.com/ec2/

---

**Last Updated**: November 11, 2025
**Application Version**: Compatible with latest codebase
