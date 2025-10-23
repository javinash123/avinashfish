# AWS EC2 Deployment Guide with MongoDB Atlas

This guide walks you through deploying the Angling Club Management System to AWS EC2 (Amazon Linux) with MongoDB Atlas.

## Prerequisites

- AWS account with EC2 access
- MongoDB Atlas account (free tier available)
- Domain name (optional but recommended for HTTPS)
- SSL certificate (Let's Encrypt recommended)

## Part 1: MongoDB Atlas Setup

### 1.1 Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (M0 free tier is sufficient for testing)
3. Choose AWS as cloud provider, select region closest to your EC2 instance
4. Wait for cluster to be created (takes 3-7 minutes)

### 1.2 Configure Network Access

1. In Atlas dashboard, go to "Network Access"
2. Click "Add IP Address"
3. Add your EC2 instance's public IP address
4. OR add `0.0.0.0/0` for testing (⚠️ less secure, whitelist specific IPs in production)

### 1.3 Create Database User

1. Go to "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Set username and strong password
5. Grant "Atlas admin" role (or "Read and write to any database")
6. Save the credentials securely

### 1.4 Get Connection String

1. Go to "Database" → Click "Connect" on your cluster
2. Choose "Connect your application"
3. Select "Node.js" driver
4. Copy the connection string, it looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<username>` and `<password>` with your database user credentials

## Part 2: EC2 Instance Setup

### 2.1 Launch EC2 Instance

1. Launch Amazon Linux 2023 instance (t2.micro for testing, t2.small+ for production)
2. Configure security group to allow:
   - SSH (port 22) from your IP
   - HTTP (port 80) from anywhere (0.0.0.0/0)
   - HTTPS (port 443) from anywhere (0.0.0.0/0)
3. Create/select key pair for SSH access
4. Launch instance

### 2.2 Connect to EC2 Instance

```bash
ssh -i your-key.pem ec2-user@your-ec2-public-ip
```

### 2.3 Install Node.js and Dependencies

```bash
# Update system packages
sudo yum update -y

# Install Node.js 20.x
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Verify installation
node --version  # Should show v20.x
npm --version

# Install PM2 process manager globally
sudo npm install -g pm2

# Install nginx (for reverse proxy)
sudo yum install -y nginx

# Install git
sudo yum install -y git
```

## Part 3: Deploy Application

### 3.1 Clone and Setup Application

```bash
# Create application directory
cd /home/ec2-user
git clone <your-repository-url> angling-club
cd angling-club

# Install dependencies
npm install

# Build the application
npm run build
```

### 3.2 Create Environment File

```bash
# Create .env file
cat > .env << 'EOF'
# MongoDB Connection (use your MongoDB Atlas connection string)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/angling-club?retryWrites=true&w=majority

# Session Secret (generate a random secret)
SESSION_SECRET=your-very-long-random-secret-key-here-change-this

# Node Environment
NODE_ENV=production

# Optional: If using Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
EOF

# Secure the .env file
chmod 600 .env
```

**Important:** Replace the placeholder values:
- `<username>:<password>` with your MongoDB Atlas credentials
- `your-very-long-random-secret-key-here-change-this` with a secure random string

Generate a secure session secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3.3 Create attached_assets Directory

```bash
# Create the directory for static assets (favicon, etc.)
mkdir -p /home/ec2-user/angling-club/attached_assets
chmod 755 /home/ec2-user/angling-club/attached_assets

# If you have a favicon or other assets, copy them here
# Example:
# cp /path/to/favicon.ico attached_assets/
```

### 3.4 Start Application with PM2

```bash
# Start the application
pm2 start npm --name "angling-club" -- start

# Configure PM2 to start on system boot
pm2 startup
# Copy and run the command that PM2 outputs

# Save PM2 process list
pm2 save

# Check application status
pm2 status
pm2 logs angling-club
```

## Part 4: Configure Nginx Reverse Proxy

### 4.1 Create Nginx Configuration

```bash
sudo tee /etc/nginx/conf.d/angling-club.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Replace with your domain

    # Redirect HTTP to HTTPS (after SSL is configured)
    # return 301 https://$server_name$request_uri;

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
EOF
```

### 4.2 Test and Start Nginx

```bash
# Test nginx configuration
sudo nginx -t

# Start nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check nginx status
sudo systemctl status nginx
```

Your application should now be accessible at `http://your-ec2-public-ip`

## Part 5: SSL/HTTPS with Let's Encrypt (Recommended)

### 5.1 Install Certbot

```bash
# Install certbot for nginx
sudo yum install -y certbot python3-certbot-nginx
```

### 5.2 Obtain SSL Certificate

**Note:** Make sure your domain's DNS A record points to your EC2 instance's public IP before running this.

```bash
# Obtain and install certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow the prompts:
# - Enter your email address
# - Agree to terms of service
# - Choose whether to redirect HTTP to HTTPS (recommended: yes)
```

Certbot will automatically:
- Obtain the certificate
- Configure nginx for HTTPS
- Set up auto-renewal

### 5.3 Verify Auto-Renewal

```bash
# Test certificate renewal
sudo certbot renew --dry-run

# Check renewal timer
sudo systemctl status certbot-renew.timer
```

## Part 6: Verify Deployment

### 6.1 Check All Services

```bash
# Check PM2 application
pm2 status
pm2 logs angling-club --lines 50

# Check nginx
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log

# Check if port 5000 is listening
sudo netstat -tlnp | grep 5000
```

### 6.2 Test Application

1. Open browser and navigate to your domain (or EC2 public IP)
2. Test user registration and login
3. Test competition creation and management
4. Check browser console for errors
5. Verify MongoDB data persistence by refreshing the page

## Part 7: Maintenance and Updates

### 7.1 Update Application

```bash
cd /home/ec2-user/angling-club

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Rebuild the application
npm run build

# Restart PM2 process
pm2 restart angling-club

# Monitor logs
pm2 logs angling-club
```

### 7.2 Backup MongoDB Data

MongoDB Atlas provides automatic backups, but you can also create manual snapshots:

1. In Atlas dashboard, go to your cluster
2. Click "Backup" tab
3. Click "Take Snapshot Now"
4. Name your snapshot and confirm

### 7.3 Monitor Application

```bash
# View PM2 monitoring dashboard
pm2 monit

# View application logs
pm2 logs angling-club

# View nginx access logs
sudo tail -f /var/log/nginx/access.log

# View nginx error logs
sudo tail -f /var/log/nginx/error.log
```

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs for errors
pm2 logs angling-club --err --lines 100

# Check if MongoDB connection string is correct
cat .env | grep MONGODB_URI

# Test MongoDB connection
node -e "const MongoClient = require('mongodb').MongoClient; MongoClient.connect(process.env.MONGODB_URI, (err, client) => { if(err) console.error(err); else console.log('Connected!'); process.exit(); })"
```

### 502 Bad Gateway

```bash
# Check if application is running on port 5000
sudo netstat -tlnp | grep 5000

# Check PM2 status
pm2 status

# Restart application if needed
pm2 restart angling-club

# Check nginx configuration
sudo nginx -t
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Restart nginx after renewal
sudo systemctl restart nginx
```

### MongoDB Connection Issues

1. Verify IP whitelist in MongoDB Atlas includes your EC2 IP
2. Check connection string format in .env file
3. Verify database user credentials
4. Test connection from EC2:
   ```bash
   cd /home/ec2-user/angling-club
   node -e "require('dotenv').config(); console.log(process.env.MONGODB_URI)"
   ```

## Security Best Practices

1. **MongoDB Atlas:**
   - Use strong passwords for database users
   - Whitelist only necessary IP addresses
   - Enable encryption at rest
   - Regular backups

2. **EC2 Instance:**
   - Keep security group rules minimal (only ports 22, 80, 443)
   - Restrict SSH access to your IP only
   - Keep system packages updated: `sudo yum update -y`
   - Use strong session secrets

3. **Application:**
   - Always use HTTPS in production
   - Keep dependencies updated: `npm audit fix`
   - Monitor PM2 logs regularly
   - Set `NODE_ENV=production` in .env

## Performance Optimization

### Enable PM2 Cluster Mode

For better performance on multi-core instances:

```bash
# Stop current process
pm2 delete angling-club

# Start in cluster mode (uses all CPU cores)
pm2 start npm --name "angling-club" -i max -- start

# Save configuration
pm2 save
```

### Configure Nginx Caching

Add to nginx configuration for static assets:

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Cost Optimization

- **EC2:** Start with t2.micro (free tier eligible), upgrade as needed
- **MongoDB Atlas:** M0 cluster is free (512MB storage, shared resources)
- **Data Transfer:** Use CloudFlare for CDN and SSL (optional, free tier available)

## Support and Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
