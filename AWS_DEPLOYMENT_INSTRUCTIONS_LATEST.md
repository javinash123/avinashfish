# AWS EC2 Deployment Instructions (Latest Build)

## What's Updated
- Session configuration simplified for AWS EC2 with Nginx reverse proxy
- MemoryStore removed (will use MongoDB sessions)
- Fixed secure cookie handling for production
- Production build generated with latest changes

## Deployment Steps

### 1. Download Build Tarball
```bash
# From your local machine, download: peg-slam-build-aws.tar.gz
```

### 2. On AWS EC2 Instance
```bash
# Extract to your deployment directory
cd /home/ec2-user/pegslam
tar -xzf peg-slam-build-aws.tar.gz

# Install production dependencies
npm ci --production

# Set environment variables
export NODE_ENV=production
export MONGODB_URI="your-mongodb-connection-string"
export SESSION_SECRET="your-secure-random-secret"
export PORT=5000

# Start application with PM2
pm2 start dist/index.js --name "peg-slam"
pm2 save
sudo env PATH=$PATH:/usr/local/bin pm2 startup -u ec2-user --hp /home/ec2-user
```

### 3. Nginx Configuration
Make sure your Nginx reverse proxy has:
```nginx
server {
    listen 80;
    server_name pegslam.com;
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Important Notes
- ✅ Session configuration is AWS EC2 optimized
- ✅ No hanging builds - uses optimized build script
- ✅ Compatible with MongoDB backend
- ✅ All latest features included (team leaderboards, profile migration, booking fixes)
- ⚠️ Set proper SESSION_SECRET in production
- ⚠️ Use HTTPS when ready (change secure: true in session config)

## Troubleshooting
If you see "hanging" during build on EC2, this tarball already has the build done:
- Just extract and run npm ci --production
- No need to build on EC2 anymore!
