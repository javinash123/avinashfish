# Production Deployment Guide for AWS EC2

## Overview
This guide covers deploying the Peg Slam application on AWS EC2 (Amazon Linux) with MongoDB.

## Build Process

### Available Build Scripts

```bash
# Production build with full diagnostics (recommended)
npm run build

# AWS-specific build with 2GB memory limit
npm run build:aws

# AWS low-memory build with 512MB limit (for smaller instances)
npm run build:aws:low-memory

# Quick build without diagnostics (if diagnostics script fails)
npm run build:quick
```

All build scripts now use `scripts/build-with-diagnostics.sh` which:
- Runs build steps separately (Vite, then esbuild)
- Shows progress and elapsed time for each step
- Monitors for hanging processes (warns after timeout)
- Captures and reports exit codes
- Verifies build output before declaring success

### Build Troubleshooting

#### Issue: Build Hangs After Compilation

**Symptoms:**
- Build completes module compilation but terminal hangs
- No error messages displayed
- Process doesn't exit

**Common Causes & Solutions:**

1. **Background Processes Not Terminating**
   ```bash
   # Check for hanging Node processes
   ps aux | grep node
   
   # Kill any hanging build processes
   pkill -f "vite build"
   pkill -f "esbuild"
   ```

2. **Insufficient Memory**
   - Amazon Linux t2.micro instances have limited memory
   - Solution: Use `build:aws:low-memory` script or upgrade instance type
   ```bash
   # For t2.micro or t2.small instances
   npm run build:aws:low-memory
   
   # For t2.medium and above
   npm run build:aws
   ```

3. **File System Watchers**
   - Vite may leave file watchers running
   - Solution: Force exit or use timeout
   ```bash
   # Build with timeout (10 minutes max)
   timeout 600 npm run build:aws
   ```

4. **Terminal Session Issues**
   - SSH session disconnects can cause hangs
   - Solution: Use `screen` or `tmux`
   ```bash
   # Start a screen session
   screen -S build
   npm run build:aws
   # Detach: Ctrl+A, then D
   # Reattach: screen -r build
   ```

5. **Verify Build Completion**
   - Check if dist directory was created successfully
   ```bash
   # After build appears to hang, check in a new terminal:
   ls -la dist/
   # If dist/index.js exists, build actually succeeded
   ```

### Build Output Verification

After running the build command, you should see:
```
✓ X modules transformed.
dist/index.html                   X.XX kB
dist/assets/index-XXXXX.css      XX.XX kB
dist/assets/index-XXXXX.js       XXX.XX kB

✓ built in Xs
dist/index.js  X.X MB

AWS build completed successfully
```

If you see the success message, the build is complete even if the terminal appears hung.

### Production Start

```bash
# Make sure environment variables are set
export MONGODB_URI="your_mongodb_connection_string"
export SESSION_SECRET="your_secure_session_secret"
export NODE_ENV="production"

# Start the production server
npm start
# or with .env file
npm run start:aws
```

## Environment Variables Required

Create a `.env` file with these variables:

```env
# Required
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/peg_slam
SESSION_SECRET=your-secure-random-secret-here
NODE_ENV=production

# Optional but recommended
PORT=5000
ALLOWED_ORIGINS=https://yourdomain.com
```

## MongoDB Configuration

The application uses MongoDB for data persistence. Ensure:

1. MongoDB Atlas cluster is accessible from AWS EC2 IP
2. Connection string includes retry writes and majority write concern
3. Database name is set to `peg_slam`

Example connection string:
```
mongodb+srv://user:pass@cluster.mongodb.net/peg_slam?retryWrites=true&w=majority
```

## Production Checklist

Before deploying:

- [ ] Build completes successfully (`npm run build:aws`)
- [ ] `dist/` directory contains compiled files
- [ ] `.env` file configured with production values
- [ ] MongoDB connection string tested
- [ ] SESSION_SECRET is a secure random string (not default)
- [ ] Firewall allows traffic on port 5000 (or your configured port)
- [ ] PM2 or systemd configured for process management (recommended)

## Process Management (Recommended)

Use PM2 to keep the application running:

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start npm --name "peg-slam" -- start

# Save PM2 configuration
pm2 save

# Set PM2 to start on system boot
pm2 startup

# Monitor application
pm2 monit

# View logs
pm2 logs peg-slam
```

## Nginx Reverse Proxy (Optional)

If using Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

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

## Common Deployment Issues

### 1. "tsx: not found" Error
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### 2. Build Hangs with No Output
```bash
# Try low-memory build
npm run build:aws:low-memory

# Or manually run each step
npx vite build
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

### 3. Server Starts but API Returns 500
- Check MongoDB connection in logs
- Verify MONGODB_URI environment variable
- Ensure MongoDB Atlas allows IP address

### 4. Changes Not Reflected After Deploy
```bash
# Clear build artifacts and rebuild
rm -rf dist/
npm run build:aws
pm2 restart peg-slam
```

## Security Considerations

1. **Never commit `.env` files** - Use environment variables or AWS Secrets Manager
2. **Use HTTPS in production** - Configure SSL certificate with Let's Encrypt
3. **Set strong SESSION_SECRET** - Generate with: `openssl rand -base64 32`
4. **Restrict MongoDB access** - Whitelist only EC2 instance IP in Atlas
5. **Enable firewall** - Only allow necessary ports (22, 80, 443, 5000)

## Support

For issues not covered here:
1. Check application logs: `pm2 logs peg-slam`
2. Check system logs: `journalctl -u peg-slam`
3. Verify MongoDB Atlas connectivity
4. Review AWS EC2 instance metrics (CPU, memory, disk)
