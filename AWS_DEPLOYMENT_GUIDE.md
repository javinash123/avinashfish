# AWS EC2 Deployment Guide - Peg Slam Production Build

## Build Information
- **Build Date:** November 24, 2025
- **Build File:** `peg-slam-build-production.tar.gz` (415KB)
- **Session Config:** Optimized for AWS EC2 with Nginx reverse proxy
- **Database:** MongoDB
- **Environment:** Amazon Linux 2

## Pre-Deployment Checklist
- [ ] MongoDB URI configured in `.env`
- [ ] SESSION_SECRET generated and set in `.env`
- [ ] ALLOWED_ORIGINS configured in `.env`
- [ ] Nginx reverse proxy configured (optional but recommended)
- [ ] SSL certificate ready (for HTTPS migration)

## Deployment Steps

### 1. Upload Build to EC2
```bash
scp -i your-key.pem peg-slam-build-production.tar.gz ec2-user@your-ec2-ip:/home/ec2-user/
```

### 2. SSH into EC2 Instance
```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
```

### 3. Extract Build
```bash
cd /home/ec2-user
tar -xzf peg-slam-build-production.tar.gz
```

### 4. Install Production Dependencies
```bash
npm ci --production
```

### 5. Set Environment Variables
Create `.env` file with:
```
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_secure_random_secret_key
PORT=5000
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### 6. Start Application

**Option A: Using PM2 (Recommended)**
```bash
npm install -g pm2
pm2 start dist/index.js --name "peg-slam" --instances 1 --watch false
pm2 save
pm2 startup
```

**Option B: Using systemd Service**
Create `/etc/systemd/system/peg-slam.service`:
```ini
[Unit]
Description=Peg Slam Fishing Competition Platform
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user
ExecStart=/usr/bin/node /home/ec2-user/dist/index.js
Restart=always
RestartSec=10
Environment="NODE_ENV=production"
EnvironmentFile=/home/ec2-user/.env

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl start peg-slam
sudo systemctl enable peg-slam
```

### 7. Configure Nginx Reverse Proxy (Optional)
Create `/etc/nginx/sites-available/peg-slam`:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

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

Then:
```bash
sudo ln -s /etc/nginx/sites-available/peg-slam /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8. Setup SSL/HTTPS (Using Let's Encrypt)
```bash
sudo yum install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com
sudo certbot renew --dry-run  # Test auto-renewal
```

Then update Nginx config with SSL and update `secure: false` to `secure: true` in session config.

## Session Management Notes

**Current Configuration (AWS EC2 Optimized):**
- Uses in-memory session storage (suitable for single EC2 instance)
- `secure: false` - Update to `true` after HTTPS setup
- `proxy: true` - Configured for Nginx/ELB reverse proxy
- No MemoryStore dependency (removed for AWS compatibility)

**For Multiple EC2 Instances:**
If scaling to multiple instances, upgrade to MongoDB session store:
1. Install: `npm install connect-mongodb-session`
2. Update session config to use MongoDB store
3. Restart application

## Environment Variables Reference

| Variable | Required | Example |
|----------|----------|---------|
| `NODE_ENV` | Yes | `production` |
| `MONGODB_URI` | Yes | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `SESSION_SECRET` | Yes | Generate: `openssl rand -base64 32` |
| `PORT` | No | `5000` (default) |
| `ALLOWED_ORIGINS` | No | `https://example.com,https://www.example.com` |

## Troubleshooting

### Application Won't Start
```bash
# Check logs
pm2 logs peg-slam
# Or
journalctl -u peg-slam -n 100
```

### MongoDB Connection Issues
- Verify MONGODB_URI is correct
- Check MongoDB is accessible from EC2
- Ensure network security groups allow MongoDB port

### Session Issues
- Clear browser cookies and try again
- Check `SESSION_SECRET` is set correctly
- Verify proxy settings if behind Nginx

### Build Hangs on EC2
- This build was generated locally to avoid EC2 memory issues
- Only deploy pre-built tarballs
- Never run `npm run build` on EC2

## Rollback Procedure

If issues occur after deployment:
1. Stop the application: `pm2 stop peg-slam` or `sudo systemctl stop peg-slam`
2. Extract previous working build
3. Restart application
4. Investigate issues

## Next Steps

1. Deploy this build to EC2
2. Test all features in production environment
3. Monitor logs for any errors
4. Set up automated backups for MongoDB
5. Configure health checks and monitoring
6. Plan HTTPS migration (update `secure: true` in session config)

---
**Support:** Monitor application logs regularly and keep MongoDB connection strings secure.
