# AWS Deployment Guide for Peg Slam Fishing Competition Platform

## Overview
This guide provides step-by-step instructions to deploy your Peg Slam application to an AWS server at `http://3.208.52.220/pegslam/` on port 7118.

## Prerequisites
- AWS EC2 instance with Ubuntu/Amazon Linux
- Node.js 18+ installed on the server
- MongoDB Atlas account (for database)
- SSH access to your AWS server
- Domain/IP: `3.208.52.220`
- Port: `7118` (ensure this port is open in your security group)

## Step 1: Prepare Your AWS Server

### 1.1 Connect to Your AWS Server
```bash
ssh -i your-key.pem ec2-user@3.208.52.220
```

### 1.2 Install Node.js (if not already installed)
```bash
# For Amazon Linux 2
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# For Ubuntu
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 1.3 Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 1.4 Open Port 7118 in Security Group
- Go to AWS Console → EC2 → Security Groups
- Find your instance's security group
- Add inbound rule: Custom TCP, Port 7118, Source: 0.0.0.0/0

## Step 2: Upload Your Code to AWS

### Option A: Using Git (Recommended)
```bash
# On your AWS server
cd /home/ec2-user
git clone <your-repository-url> pegslam
cd pegslam
```

### Option B: Using SCP
```bash
# On your local machine
tar -czf pegslam.tar.gz --exclude=node_modules .
scp -i your-key.pem pegslam.tar.gz ec2-user@3.208.52.220:~/

# On your AWS server
tar -xzf pegslam.tar.gz -C pegslam
cd pegslam
```

## Step 3: Set Environment Variables

Create a `.env.production` file on your server (or set them in your deployment script):

```bash
# On your AWS server
cd /home/ec2-user/pegslam

# Create environment file
cat > .env.production << 'EOF'
NODE_ENV=production
PORT=7118
EXPRESS_BASE_PATH=/pegslam

# IMPORTANT: Change to a strong random secret!
SESSION_SECRET=your-super-strong-random-secret-here

# MongoDB Connection
MONGODB_URI=your-mongodb-atlas-connection-string

# Optional: Stripe for payments
# STRIPE_SECRET_KEY=your-stripe-secret-key
EOF
```

**Important**: Generate a strong SESSION_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 4: Install Dependencies

```bash
# Install production dependencies
npm install --production

# Or if using npm ci (recommended for clean installs)
npm ci --omit=dev
```

## Step 5: Build the Application

```bash
# Build frontend and backend for AWS deployment
npm run build:aws
```

This command:
- Builds the frontend with base path `/pegslam/`
- Configures API endpoints to `/pegslam/api`
- Bundles the backend server code

## Step 6: Start the Application

### Option A: Using PM2 (Recommended for Production)

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'pegslam',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 7118,
      EXPRESS_BASE_PATH: '/pegslam'
    },
    env_file: '.env.production',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the command it outputs
```

### Option B: Using Direct Node (for testing)

```bash
# Source environment variables and start
source .env.production && npm start
```

## Step 7: Verify Deployment

### 7.1 Check if the Server is Running
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs pegslam

# Check if port is listening
sudo netstat -tulpn | grep 7118
```

### 7.2 Test the Application
```bash
# Test from server
curl http://localhost:7118/pegslam/

# Test API endpoint
curl http://localhost:7118/pegslam/api/site-settings
```

### 7.3 Access from Browser
Open your browser and navigate to:
```
http://3.208.52.220:7118/pegslam/
```

## Step 8: Optional - Setup Nginx Reverse Proxy

For better security and SSL support, use Nginx as a reverse proxy:

### 8.1 Install Nginx
```bash
sudo yum install nginx -y  # Amazon Linux
# or
sudo apt-get install nginx -y  # Ubuntu

sudo systemctl start nginx
sudo systemctl enable nginx
```

### 8.2 Configure Nginx
```bash
sudo nano /etc/nginx/conf.d/pegslam.conf
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name 3.208.52.220;

    location /pegslam {
        proxy_pass http://localhost:7118/pegslam;
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

### 8.3 Test and Reload Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

Now your app will be accessible at:
```
http://3.208.52.220/pegslam/
```

## Step 9: Monitoring and Maintenance

### View Logs
```bash
# PM2 logs
pm2 logs pegslam

# Follow logs in real-time
pm2 logs pegslam --lines 100
```

### Restart Application
```bash
pm2 restart pegslam
```

### Update Application
```bash
cd /home/ec2-user/pegslam
git pull  # if using git
npm install --production
npm run build:aws
pm2 restart pegslam
```

### Stop Application
```bash
pm2 stop pegslam
pm2 delete pegslam
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 7118
sudo lsof -i :7118
# Kill the process
sudo kill -9 <PID>
```

### MongoDB Connection Issues
- Verify MONGODB_URI is correct
- Ensure MongoDB Atlas IP whitelist includes your AWS server IP
- Check MongoDB Atlas credentials

### Cannot Access from Browser
- Verify AWS Security Group allows inbound traffic on port 7118
- Check if application is running: `pm2 status`
- Check firewall: `sudo firewall-cmd --list-all` (if using firewalld)

### Session/Login Issues
- Ensure SESSION_SECRET is set and is the same across restarts
- Check cookie settings in browser (should allow from your domain)

## Production Checklist

- [ ] Changed SESSION_SECRET to a strong random value
- [ ] Configured MongoDB Atlas with correct connection string
- [ ] Port 7118 is open in AWS Security Group
- [ ] PM2 is configured to restart on system boot
- [ ] Application logs are being written to `./logs/`
- [ ] Tested login/registration functionality
- [ ] Tested competition creation and peg booking
- [ ] Verified payments work (if using Stripe)
- [ ] Setup regular backups for MongoDB
- [ ] Consider setting up SSL/HTTPS with Let's Encrypt

## URLs After Deployment

- **Application**: `http://3.208.52.220:7118/pegslam/`
- **Admin Panel**: `http://3.208.52.220:7118/pegslam/admin`
- **API Base**: `http://3.208.52.220:7118/pegslam/api`

## Support

For issues or questions:
1. Check application logs: `pm2 logs pegslam`
2. Verify environment variables are set correctly
3. Ensure MongoDB connection is working
4. Check AWS Security Group settings

---

**Note**: This is a production deployment guide. Make sure to keep your SESSION_SECRET and database credentials secure and never commit them to version control.
