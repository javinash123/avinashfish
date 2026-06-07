# Production Build Deployment Guide for AWS EC2

## Build Status: ✅ SUCCESSFUL

**Build Date:** November 20, 2025
**Build Size:** 1.4 MB
**Node Environment:** Production

---

## 📦 Build Contents

The production build is located in the `dist/` folder:

```
dist/
├── index.js                    (208 KB - Backend server bundle)
└── public/
    ├── index.html             (1.1 KB - Frontend entry point)
    └── assets/
        ├── index-BHp23rII.css (125 KB - Styles)
        └── index-DXz7QLiM.js  (1.1 MB - Frontend bundle)
```

---

## 🔧 Changes Made for AWS EC2 Compatibility

### Session Configuration Update
Modified `server/index.ts` to use simplified session configuration without MemoryStore:

**Old Configuration (Commented Out):**
```typescript
app.use(session({
  secret: process.env.SESSION_SECRET || "dev-secret-key-change-in-production",
  resave: false,
  saveUninitialized: true,
  store: new MemoryStore({
    checkPeriod: 86400000,
  }),
  cookie: {
    path: EXPRESS_BASE_PATH || '/',
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
  proxy: true
}));
```

**New Configuration (Active):**
```typescript
app.use(session({
  secret: process.env.SESSION_SECRET || "dev-secret-key-change-in-production",
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // ⚠️ temporary fix until you use HTTPS
    sameSite: "lax",
    httpOnly: true,
  },
  proxy: true
}));
```

---

## 🚀 Deployment Steps for AWS EC2

### Option 1: Deploy Entire Project

1. **Stop your current application on AWS EC2**
   ```bash
   pm2 stop all  # or your process manager command
   ```

2. **Upload the entire project to AWS EC2**
   - Compress the project: `tar -czf pegslam-build.tar.gz .`
   - Upload to EC2: `scp pegslam-build.tar.gz user@your-ec2-ip:/path/to/app/`
   - Extract on server: `tar -xzf pegslam-build.tar.gz`

3. **Install dependencies (if needed)**
   ```bash
   npm install --production
   ```

4. **Start the application**
   ```bash
   NODE_ENV=production npm start
   # or with PM2
   pm2 start npm --name "pegslam" -- start
   ```

### Option 2: Deploy Only Build Folder (Faster)

1. **Stop your current application**
   ```bash
   pm2 stop pegslam
   ```

2. **Backup current build**
   ```bash
   mv dist dist.backup
   ```

3. **Upload new build folder**
   ```bash
   # On your local machine
   cd /path/to/project
   tar -czf dist.tar.gz dist/
   scp dist.tar.gz user@your-ec2-ip:/path/to/app/
   
   # On EC2 server
   tar -xzf dist.tar.gz
   ```

4. **Upload updated server/index.ts**
   ```bash
   scp server/index.ts user@your-ec2-ip:/path/to/app/server/
   ```

5. **Restart the application**
   ```bash
   pm2 restart pegslam
   # or
   NODE_ENV=production npm start
   ```

---

## 🔐 Environment Variables Required on AWS EC2

Make sure these environment variables are set on your EC2 instance:

```bash
# Essential
NODE_ENV=production
PORT=7118
MONGODB_URI=your_mongodb_connection_string

# Security (IMPORTANT!)
SESSION_SECRET=generate_a_secure_random_string_here

# Optional but recommended
ALLOWED_ORIGINS=http://3.208.52.220:7118

# If using base path (e.g., /pegslam/)
EXPRESS_BASE_PATH=/pegslam
VITE_BASE_PATH=/pegslam/

# Stripe (if using payments)
STRIPE_SECRET_KEY=your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key

# Resend Email (if using password reset)
RESEND_API_KEY=your_resend_api_key
```

---

## ✅ Verification Steps

After deployment, verify everything is working:

1. **Check application is running**
   ```bash
   pm2 status
   # or
   ps aux | grep node
   ```

2. **Test the frontend**
   - Open browser: `http://3.208.52.220:7118/pegslam/`
   - Verify homepage loads correctly
   - Check navigation menu works

3. **Test the backend API**
   ```bash
   curl http://3.208.52.220:7118/pegslam/api/competitions
   curl http://3.208.52.220:7118/pegslam/api/site-settings
   ```

4. **Test user login/registration**
   - Navigate to login page
   - Try logging in with test credentials
   - Verify session persistence

5. **Check MongoDB connection**
   - Look at server logs for "✅ Connected to MongoDB Atlas successfully"
   - Verify data is being saved to database

---

## 📝 Important Notes

### Session Storage
- **Development:** Uses MemoryStore (sessions lost on restart)
- **Production (Current):** Uses default session store (in-memory)
- **Recommendation:** For better production setup, use MongoDB session store

To upgrade to MongoDB session store later:
```bash
npm install connect-mongo
```

Then update session config in `server/index.ts`:
```typescript
import MongoStore from 'connect-mongo';

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 7 * 24 * 60 * 60 // 7 days
  }),
  cookie: {
    secure: false, // set to true when using HTTPS
    sameSite: "lax",
    httpOnly: true,
  },
  proxy: true
}));
```

### HTTPS/SSL
- Current config has `secure: false` for cookies
- When you add HTTPS (recommended), change to `secure: true`
- Use Let's Encrypt with Nginx or AWS Certificate Manager

### File Uploads
- Ensure `attached_assets/uploads/` folder exists on EC2
- Set proper permissions: `chmod 755 attached_assets/uploads/`
- Uploaded files are served at `/assets/uploads/` and `/attached-assets/`

---

## 🐛 Troubleshooting

### Build hangs on AWS EC2
- ✅ **SOLVED:** Build generated on Replit, upload the `dist/` folder directly

### Session not persisting
- Check `SESSION_SECRET` is set
- Verify `proxy: true` is enabled
- Check EC2 is behind load balancer or Nginx

### MongoDB connection fails
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas IP whitelist includes EC2 IP
- Test connection: `mongo "your_mongodb_uri"`

### Static files not loading
- Verify `attached_assets/` folder exists
- Check folder permissions
- Ensure paths match in code

---

## 📊 Build Performance

```
Frontend Build:  18.95s
Backend Bundle:  0.024s
Total Size:      1.4 MB
Modules:         2297 transformed
```

**Build Optimizations:**
- ✅ Production minification enabled
- ✅ CSS extracted and minified (127KB → 19KB gzipped)
- ✅ JavaScript bundled and minified (1.08MB → 287KB gzipped)
- ⚠️ Large chunk warning (consider code splitting for future optimization)

---

## 🎯 Quick Start Commands

```bash
# On your local machine (Replit)
npm run build  # Already done - build is in dist/

# Package for upload
tar -czf pegslam-dist.tar.gz dist/

# Upload to EC2
scp pegslam-dist.tar.gz user@3.208.52.220:/home/ec2-user/pegslam/

# On EC2 server
cd /home/ec2-user/pegslam
tar -xzf pegslam-dist.tar.gz
pm2 restart pegslam

# Check status
pm2 status
pm2 logs pegslam --lines 50
```

---

## ✅ Deployment Checklist

- [ ] Build generated successfully (✅ Done)
- [ ] Session configuration updated (✅ Done)
- [ ] Environment variables configured on EC2
- [ ] MongoDB connection string set
- [ ] Backup current production code
- [ ] Upload new build to EC2
- [ ] Restart application
- [ ] Test frontend loads
- [ ] Test API endpoints
- [ ] Test user login/registration
- [ ] Verify MongoDB data persistence
- [ ] Check error logs
- [ ] Monitor application for 15-30 minutes

---

**🎉 Your production build is ready for deployment!**

For support or issues, check the application logs:
```bash
pm2 logs pegslam --lines 100
# or
tail -f /path/to/logs/app.log
```
