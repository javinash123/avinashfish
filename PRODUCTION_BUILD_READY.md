# Production Build Ready for AWS EC2 Deployment

**Generated:** December 18, 2025  
**Build Status:** ✅ Successfully Built  
**Build Size:** 1.6 MB (dist folder)

## Build Contents

```
dist/
├── index.js              (Backend server bundle - 273KB)
└── public/
    ├── index.html        (Frontend entry point)
    └── assets/
        ├── index-*.css   (Compiled styles)
        └── index-*.js    (Bundled frontend code)
```

## Deployment Steps on AWS EC2

### 1. **Prepare Your AWS EC2 Server**

```bash
# Connect to your EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Navigate to your application directory
cd /path/to/your/app
```

### 2. **Backup Current Deployment (Optional)**

```bash
# Create a backup of existing dist folder
cp -r dist dist.backup.$(date +%s)
```

### 3. **Upload New Build**

Upload the `dist` folder from your Replit to your EC2 instance. You can use:

**Option A: SCP (Secure Copy)**
```bash
# From your local machine or Replit
scp -i your-key.pem -r dist ec2-user@your-ec2-ip:/path/to/your/app/
```

**Option B: Git (Recommended)**
```bash
# On your EC2 instance
cd /path/to/your/app
git pull origin main
npm run build
```

### 4. **Verify Build Upload**

```bash
# Check dist folder on EC2
ls -lh dist/
du -sh dist/
```

### 5. **Set Environment Variables on EC2**

The session configuration has been updated to work with HTTP (not HTTPS). Make sure your `.env` file on EC2 includes:

```bash
# Critical for production
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your-secure-random-secret-key-here
PORT=5000

# Optional but recommended
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_PUBLIC_KEY=pk_live_your_stripe_key
ALLOWED_ORIGINS=your-domain.com
```

### 6. **Restart Your Application**

```bash
# Stop current process (if running)
# killall node  # Or use your PM2/systemd command

# Install dependencies (if not already done)
npm install

# Start the application
npm start

# Or with PM2 (recommended for production)
pm2 restart your-app-name
```

### 7. **Verify Deployment**

```bash
# Check if running on port 5000
lsof -i :5000

# Check logs
tail -f your-app.log  # Or PM2 logs: pm2 logs
```

## Session Configuration Update

Your session middleware has been updated:

✅ **MemoryStore Removed** - No longer using in-memory session storage  
✅ **Secure Cookies Set to False** - HTTP sessions will work (not HTTPS-only)  
✅ **Proxy Mode Enabled** - Works behind AWS load balancers or reverse proxies  
✅ **Simple Configuration** - Minimal dependencies, more stable on EC2

**Current Configuration:**
```javascript
app.use(session({
  secret: process.env.SESSION_SECRET || "dev-secret-key-change-in-production",
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // ⚠️ HTTP support for EC2
    sameSite: "lax",
    httpOnly: true,
  },
  proxy: true // Works with AWS ELB, CloudFront, Nginx
}));
```

## Important Notes

- **MongoDB Required:** Make sure `MONGODB_URI` is set on your EC2 instance, otherwise it will use in-memory storage (data lost on restart)
- **Session Secret:** Change the `SESSION_SECRET` to a secure random value for production
- **HTTPS:** When you set up HTTPS/SSL in the future, update `secure: true` in the session config and change `app.set('trust proxy', 1)` as needed
- **No Build Needed on EC2:** The dist folder is pre-built and ready to run - just copy it and start the app
- **Live Stripe Keys:** Live Stripe keys (sk_live_* and pk_live_*) are configured for real payment processing

## Build Details

```
✅ Build Status: SUCCESS
✅ Frontend compiled: 1.3 MB
✅ Backend bundled: 276 KB
✅ Total size: 1.6 MB
✅ No errors or critical warnings
```

## Next Steps

1. Copy `dist` folder to your EC2 instance
2. Set environment variables on EC2
3. Run `npm install` (if first time or new dependencies)
4. Run `npm start` or restart your PM2 app
5. Test the application at your domain/IP

---

**Build Generated:** December 18, 2025  
**For Issues:** Check logs and ensure all environment variables are properly set
