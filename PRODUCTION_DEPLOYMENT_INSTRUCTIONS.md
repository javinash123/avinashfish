# 🚀 Peg Slam Production Deployment Guide - AWS EC2

## Build Information
- **Build Date:** November 24, 2025
- **Build File:** `peg-slam-build.tar.gz` (26MB)
- **Frontend:** React + Vite (optimized, minified)
- **Backend:** Express.js + TypeScript (compiled to Node.js)
- **Database:** MongoDB (production)

## Step 1: Upload to AWS EC2

### Option A: Using SCP/SFTP
```bash
# From your local machine
scp -i /path/to/your/key.pem peg-slam-build.tar.gz ec2-user@your-instance-ip:/home/ec2-user/

# SSH into your instance
ssh -i /path/to/your/key.pem ec2-user@your-instance-ip
```

### Option B: Using AWS Systems Manager Session Manager
```bash
# No SSH keys needed if your EC2 has SSM role
aws ssm start-session --target i-xxxxxxxxxxxxx
```

## Step 2: Extract and Setup on EC2

```bash
# Navigate to your app directory
cd /home/ec2-user

# Extract the build
tar -xzf peg-slam-build.tar.gz
cd peg-slam-build

# Install production dependencies only (faster, smaller footprint)
npm ci --production

# Create directories if they don't exist
mkdir -p attached_assets/uploads/{competitions,gallery}
```

## Step 3: Set Environment Variables

Edit or create `.env` file with these required variables:

```bash
# Essential
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@your-cluster.mongodb.net/peg-slam?retryWrites=true&w=majority
SESSION_SECRET=generate-a-long-secure-random-string-here

# Optional
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
EXPRESS_BASE_PATH=/
```

### Generate SESSION_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 4: Set File Permissions

```bash
# Allow the app to write uploads
chmod -R 755 attached_assets
chmod -R 755 attached_assets/uploads

# If running as a service user, set ownership
sudo chown -R app-user:app-user /home/ec2-user/peg-slam-build
```

## Step 5: Start the Application

### Option A: Direct Node (for testing)
```bash
NODE_ENV=production node dist/index.js
```

### Option B: Using PM2 (Recommended for production)
```bash
# Install PM2 globally (if not already)
npm install -g pm2

# Start with PM2
pm2 start dist/index.js --name "peg-slam" --env production

# Make it auto-restart on reboot
pm2 startup
pm2 save

# Check status
pm2 status
pm2 logs peg-slam
```

### Option C: Using Systemd Service (Most reliable)

Create `/etc/systemd/system/peg-slam.service`:
```ini
[Unit]
Description=Peg Slam Fishing Competitions
After=network.target mongod.service

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/peg-slam-build
EnvironmentFile=/home/ec2-user/peg-slam-build/.env
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl start peg-slam
sudo systemctl enable peg-slam
sudo systemctl status peg-slam
```

## Step 6: Configure Nginx (Reverse Proxy - Recommended)

Create `/etc/nginx/sites-available/peg-slam`:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS (when SSL is set up)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable:
```bash
sudo ln -s /etc/nginx/sites-available/peg-slam /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 7: Security Checklist

- [ ] MongoDB username and password are set
- [ ] SESSION_SECRET is a secure random 64-character string
- [ ] PORT 5000 is NOT open to the internet (only Nginx on port 80/443 is)
- [ ] Security group allows:
  - Port 80 (HTTP) from anywhere
  - Port 443 (HTTPS) from anywhere
  - Port 22 (SSH) from your IP only
- [ ] SSL certificate installed (Let's Encrypt recommended with Certbot)
- [ ] MongoDB IP whitelist includes your EC2 instance

## Step 8: Verify Deployment

```bash
# Check if service is running
curl http://localhost:5000

# Check logs
tail -f /var/log/syslog  # or journalctl if using systemd
pm2 logs peg-slam         # if using PM2

# Test a basic API endpoint
curl http://localhost:5000/api/competitions
```

## Troubleshooting

### Port 5000 already in use
```bash
# Find what's using it
sudo lsof -i :5000

# Kill the process
sudo kill -9 <PID>
```

### MongoDB connection failed
- Check `MONGODB_URI` is correct
- Verify IP whitelist in MongoDB Atlas includes your EC2 IP
- Test connection: `nc -zv your-mongodb-host 27017`

### Uploads not working
- Check `attached_assets/` directory exists
- Verify write permissions: `ls -la attached_assets/`
- Check Nginx doesn't have upload size limit (default 1MB)

### Session not persisting
- Current build uses in-memory sessions (ok for single server)
- For multiple instances, implement MongoDB session store later
- Each restart will clear sessions (expected behavior)

## Updates & Rollback

### Deploy new code
1. Generate new build locally (this prevents EC2 hanging)
2. Upload new `peg-slam-build.tar.gz`
3. Stop service: `systemctl stop peg-slam` or `pm2 stop peg-slam`
4. Backup current: `mv peg-slam-build peg-slam-build.backup`
5. Extract new build: `tar -xzf peg-slam-build.tar.gz`
6. Install deps: `npm ci --production`
7. Start service: `systemctl start peg-slam` or `pm2 start peg-slam`

### Rollback
```bash
rm -rf peg-slam-build
mv peg-slam-build.backup peg-slam-build
systemctl restart peg-slam
```

## Performance Tips

1. **Enable Nginx caching** for static assets
2. **Use MongoDB indexing** for queries
3. **Monitor PM2** with: `pm2 monit`
4. **Check memory usage**: `free -h`
5. **Monitor EC2 CloudWatch** metrics

## Support

If issues occur:
1. Check service logs: `journalctl -u peg-slam -f`
2. Test MongoDB connection
3. Verify environment variables: `env | grep -E "NODE_ENV|MONGODB|SESSION"`
4. Check port 5000: `netstat -tlnp | grep 5000`

---

**Important:** This build does NOT include `node_modules`. Run `npm ci --production` on EC2 to install production dependencies only.
