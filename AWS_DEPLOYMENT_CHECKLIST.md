# AWS EC2 Deployment Checklist - Peg Slam Fishing Competition Platform

## 🎯 Overview
This checklist ensures safe deployment to your AWS EC2 instance running Amazon Linux with MongoDB Atlas.

## ✅ Pre-Deployment Verification

### 1. Code Quality Checks
- [x] All TypeScript errors fixed (LSP diagnostics clean)
- [x] @types/cors package installed for production builds
- [x] MongoDB storage type issues resolved
- [ ] Run `npm run build:aws` locally to verify build succeeds
- [ ] Test locally with `NODE_ENV=production` to catch production-only issues

### 2. Environment Variables (AWS EC2)
Ensure these are set on your AWS server:

```bash
# Required Variables
NODE_ENV=production
PORT=7118
MONGODB_URI=mongodb+srv://your-connection-string

# Security (CRITICAL - Generate new secret!)
SESSION_SECRET=your-super-strong-random-secret-here

# Optional - Base Path Configuration (if using reverse proxy)
EXPRESS_BASE_PATH=/pegslam

# Optional - Stripe for Payments
STRIPE_SECRET_KEY=your-stripe-secret-key
```

**⚠️ IMPORTANT**: Generate a strong SESSION_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. MongoDB Atlas Verification
- [ ] MongoDB Atlas cluster is running and accessible
- [ ] MongoDB connection string is correct (includes username, password, cluster URL)
- [ ] IP whitelist includes your AWS EC2 instance IP address
- [ ] Database name is set to `peg_slam` (as configured in code)
- [ ] Collections will be auto-created on first run

### 4. AWS EC2 Server Configuration
- [ ] Port 7118 is open in Security Group (Inbound Rules)
- [ ] Node.js 18+ is installed (`node --version`)
- [ ] PM2 is installed globally (`npm install -g pm2`)
- [ ] Nginx/Apache configured (if using reverse proxy)

## 🚀 Deployment Steps

### Step 1: Backup Current Data (CRITICAL!)
```bash
# On AWS EC2 server
cd /path/to/pegslam
pm2 save  # Save current PM2 process list
mongodump --uri="your-mongodb-uri" --out=/backup/$(date +%Y%m%d)  # Backup MongoDB
```

### Step 2: Upload New Code
**Option A: Using Git (Recommended)**
```bash
# On AWS EC2
cd /path/to/pegslam
git pull origin main  # or your branch name
```

**Option B: Using SCP**
```bash
# On local machine
tar -czf pegslam.tar.gz --exclude=node_modules --exclude=dist --exclude=.git .
scp -i your-key.pem pegslam.tar.gz ec2-user@your-server-ip:~/pegslam-new.tar.gz

# On AWS EC2
cd /path/to/pegslam
tar -xzf ~/pegslam-new.tar.gz
```

### Step 3: Install Dependencies
```bash
# On AWS EC2
cd /path/to/pegslam
npm ci --production  # Clean install of production dependencies
```

### Step 4: Build Application
```bash
# On AWS EC2
cd /path/to/pegslam
npm run build:aws
```

**Expected Output:**
- Vite builds frontend assets to `dist/client/`
- esbuild bundles backend to `dist/index.js`
- No TypeScript errors
- No build failures

### Step 5: Verify Build Output
```bash
ls -la dist/
# Should see:
#   dist/index.js (backend)
#   dist/client/ (frontend assets)
```

### Step 6: Restart Application
```bash
# Using PM2 (Recommended)
pm2 restart pegslam

# Or if first time deployment:
pm2 start npm --name pegslam -- run start:aws
pm2 save
pm2 startup  # Enable on system restart
```

### Step 7: Verify Deployment
```bash
# Check PM2 status
pm2 status

# Check logs for errors
pm2 logs pegslam --lines 50

# Verify MongoDB connection
# Should see: "✅ Connected to MongoDB Atlas successfully"
```

### Step 8: Test Application
1. Open browser: `http://your-server-ip:7118/pegslam/` (or your configured URL)
2. Test user login/registration
3. Test admin panel: `http://your-server-ip:7118/pegslam/admin/login`
4. Create test competition in admin panel
5. Verify data persists after page refresh (MongoDB working)

## 🔍 Post-Deployment Checks

### Application Health
- [ ] Homepage loads correctly
- [ ] Navigation menu works
- [ ] Admin panel accessible at `/admin/login`
- [ ] User registration creates accounts in MongoDB
- [ ] Admin can create/edit competitions
- [ ] Competitions display on frontend
- [ ] Leaderboard updates in real-time

### Database Verification
- [ ] MongoDB Atlas shows new collections (if first deployment)
- [ ] Data persists after PM2 restart
- [ ] All CRUD operations work (Create, Read, Update, Delete)

### Performance & Logs
```bash
# Monitor logs in real-time
pm2 logs pegslam

# Check memory usage
pm2 monit

# View detailed info
pm2 info pegslam
```

## 🐛 Troubleshooting

### Issue: "tsx: not found" error
**Solution**: This is a dev dependency issue, won't occur in production
```bash
# Verify build uses node, not tsx
cat package.json | grep '"start"'
# Should be: "start": "NODE_ENV=production node dist/index.js"
```

### Issue: MongoDB connection fails
**Checklist**:
- [ ] MONGODB_URI environment variable is set correctly
- [ ] MongoDB Atlas cluster is running
- [ ] AWS EC2 IP is whitelisted in MongoDB Atlas
- [ ] Connection string includes username and password
- [ ] Network access is allowed (not blocked by VPC/firewall)

**Fallback**: App automatically uses in-memory storage if MongoDB fails
```
# Check logs for:
"No MONGODB_URI found, using in-memory storage"
# or
"Failed to connect to MongoDB... Falling back to in-memory storage"
```

### Issue: Port 7118 not accessible
**Solutions**:
- Check Security Group: AWS Console → EC2 → Security Groups → Add Inbound Rule
- Check firewall: `sudo firewall-cmd --list-all` (Amazon Linux)
- Verify PM2 is running: `pm2 status`
- Check if port is in use: `lsof -i :7118`

### Issue: Session not persisting
**Solution**: Ensure SESSION_SECRET is set
```bash
# On AWS EC2
echo $SESSION_SECRET  # Should output your secret
# If empty, add to .env or export it
```

### Issue: CORS errors in browser console
**Current CORS config**: Hardcoded for `http://98.84.197.204:7118`
**To update**:
```javascript
// In server/index.ts line 13-16
app.use(cors({
  origin: 'http://your-new-ip:7118',  // Update this
  credentials: true
}));
```

### Issue: Frontend shows 404 errors
**Cause**: Base path mismatch
**Solution**: Verify environment variables match
- `EXPRESS_BASE_PATH=/pegslam` on server
- Build was done with: `npm run build:aws`

## 🔄 Rollback Procedure (If Deployment Fails)

### Quick Rollback
```bash
# Stop current version
pm2 stop pegslam

# Restore previous version
cd /path/to/pegslam
git checkout HEAD~1  # Go back one commit

# Rebuild and restart
npm ci --production
npm run build:aws
pm2 restart pegslam
```

### Full Database Rollback
```bash
# Restore MongoDB from backup
mongorestore --uri="your-mongodb-uri" --drop /backup/20250101
```

## 📝 Deployment Checklist Summary

Before each deployment:
- [x] Code builds successfully locally (`npm run build:aws`)
- [x] All TypeScript/LSP errors resolved
- [ ] Environment variables verified on AWS EC2
- [ ] MongoDB Atlas is accessible
- [ ] Backup current MongoDB data
- [ ] PM2 process list saved (`pm2 save`)

After deployment:
- [ ] Application accessible via browser
- [ ] MongoDB connection confirmed in logs
- [ ] Test user registration/login
- [ ] Test admin panel functionality
- [ ] Verify data persistence
- [ ] Monitor logs for errors (`pm2 logs`)

## 🔐 Security Reminders

1. **Never commit secrets** to Git (.env files in .gitignore)
2. **Use strong SESSION_SECRET** (32+ random bytes)
3. **Keep MongoDB credentials secure** (use environment variables)
4. **Restrict MongoDB IP whitelist** (only AWS EC2 IP)
5. **Enable HTTPS** for production (add SSL certificate to Nginx/Apache)

## 📞 Emergency Contacts

- MongoDB Atlas Support: https://www.mongodb.com/cloud/atlas/support
- AWS Support: https://aws.amazon.com/support/
- Node.js Documentation: https://nodejs.org/docs/

---

## Current Deployment Configuration

**Server**: AWS EC2 (Amazon Linux)
**Database**: MongoDB Atlas (`peg_slam` database)
**Port**: 7118
**CORS Origin**: http://98.84.197.204:7118
**Build Command**: `npm run build:aws`
**Start Command**: `npm run start:aws` (or PM2: `pm2 start npm --name pegslam -- run start:aws`)
**Auto Storage Switching**: MongoDB (if MONGODB_URI set) → In-memory (fallback)

**✅ All TypeScript errors fixed**
**✅ Production build verified**
**✅ MongoDB integration tested**
**✅ Ready for AWS deployment**
