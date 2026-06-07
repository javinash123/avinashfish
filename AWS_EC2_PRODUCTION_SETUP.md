# AWS EC2 Production Setup - Complete Guide

**Last Updated**: November 11, 2025  
**For**: Peg Slam Fishing Competition Platform  
**Target**: AWS EC2 with Amazon Linux OS + MongoDB Atlas

---

## Quick Start - Critical Environment Variables

Your application **requires** these environment variables to work in production:

### ✅ Required for Basic Functionality
```bash
NODE_ENV=production
PORT=7118
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/peg_slam
SESSION_SECRET=generate-32-byte-hex-string
```

### ✅ Required for Stripe Payments
```bash
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=pk_live_your_stripe_publishable_key
```

### ✅ Required for Password Reset Emails
```bash
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=noreply@pegslam.co.uk
```

### 🔧 Optional (for reverse proxy deployments)
```bash
EXPRESS_BASE_PATH=/pegslam
VITE_BASE_PATH=/pegslam
```

---

## Part 1: Get Your API Keys

### 1.1 MongoDB Atlas Connection String

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **Node.js** driver version **5.5 or later**
5. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` and `<password>` with your actual database credentials
7. Add database name: `mongodb+srv://user:pass@cluster.net/peg_slam?retryWrites=true&w=majority`

### 1.2 Stripe API Keys

**For Testing (Test Mode):**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy **Secret key** (starts with `sk_test_`)
3. Copy **Publishable key** (starts with `pk_test_`)

**For Production (Live Mode):**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. **Switch to "Live mode"** toggle in top right
3. Copy **Secret key** (starts with `sk_live_`)
4. Copy **Publishable key** (starts with `pk_`)

⚠️ **IMPORTANT**: Never commit these keys to Git or share them publicly!

### 1.3 Resend API Key (for Password Reset Emails)

1. Create account at [Resend.com](https://resend.com)
2. Verify your email address
3. Go to [API Keys](https://resend.com/api-keys)
4. Click **"Create API Key"**
5. Give it a name (e.g., "Peg Slam Production")
6. Copy the API key (starts with `re_`)
7. Go to [Domains](https://resend.com/domains) 
8. Add and verify your domain `pegslam.co.uk`
9. OR use Resend's test email: `onboarding@resend.dev` (for testing only)

⚠️ **Domain Verification Required**: For production emails, you must verify your domain in Resend by adding DNS records.

### 1.4 Session Secret

Generate a secure random secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output - this is your `SESSION_SECRET`.

---

## Part 2: Configure Environment Variables on AWS EC2

### Option A: Using .env File (Recommended)

SSH into your EC2 instance:

```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
cd /path/to/peg-slam
```

Create or edit the `.env` file:

```bash
nano .env
```

Paste this template and **replace with your actual values**:

```bash
# === Production Configuration ===
NODE_ENV=production
PORT=7118

# === Database ===
MONGODB_URI=mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/peg_slam?retryWrites=true&w=majority

# === Security ===
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET=your-generated-hex-string-here

# === Stripe Payment Processing ===
STRIPE_SECRET_KEY=sk_live_your_actual_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=pk_live_your_actual_stripe_publishable_key

# === Email (Resend) ===
RESEND_API_KEY=re_your_actual_resend_api_key
RESEND_FROM_EMAIL=noreply@pegslam.co.uk

# === Base Path (only if using reverse proxy) ===
# EXPRESS_BASE_PATH=/pegslam
# VITE_BASE_PATH=/pegslam
```

Save and exit (Ctrl+X, then Y, then Enter).

### Option B: Using PM2 Ecosystem File

If using PM2 process manager:

```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'peg-slam',
    script: 'server/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 7118,
      MONGODB_URI: 'mongodb+srv://user:pass@cluster.net/peg_slam',
      SESSION_SECRET: 'your-generated-hex-string',
      STRIPE_SECRET_KEY: 'sk_live_your_key',
      VITE_STRIPE_PUBLIC_KEY: 'pk_live_your_key',
      RESEND_API_KEY: 're_your_key',
      RESEND_FROM_EMAIL: 'noreply@pegslam.co.uk'
    }
  }]
}
```

### Option C: System-wide Environment Variables

Add to `/etc/environment` (requires sudo):

```bash
sudo nano /etc/environment
```

Add each variable on a new line:

```bash
MONGODB_URI="mongodb+srv://user:pass@cluster.net/peg_slam"
SESSION_SECRET="your-hex-string"
STRIPE_SECRET_KEY="sk_live_your_key"
VITE_STRIPE_PUBLIC_KEY="pk_live_your_key"
RESEND_API_KEY="re_your_key"
RESEND_FROM_EMAIL="noreply@pegslam.co.uk"
```

Then reload:

```bash
source /etc/environment
```

---

## Part 3: Build and Deploy Application

### 3.1 Install Dependencies and Build

```bash
cd /path/to/peg-slam

# Install production dependencies
npm install --production

# Build the frontend
npm run build
```

### 3.2 Start Application

**Using PM2 (Recommended for Production):**

```bash
# Start application
pm2 start server/index.js --name peg-slam

# OR using ecosystem file
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup systemd
# Follow the command it outputs
```

**Using Node directly:**

```bash
# Load environment variables and start
node server/index.js
```

**Using systemd service:**

Create `/etc/systemd/system/peg-slam.service`:

```ini
[Unit]
Description=Peg Slam Fishing Competition Platform
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/peg-slam
EnvironmentFile=/home/ec2-user/peg-slam/.env
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable peg-slam
sudo systemctl start peg-slam
```

---

## Part 4: Verify Everything Works

### 4.1 Check Application Logs

**PM2:**
```bash
pm2 logs peg-slam
```

**Systemd:**
```bash
sudo journalctl -u peg-slam -f
```

Look for these success messages:

```
✅ [Resend] Using direct API key from environment variable
✅ Connected to MongoDB
✅ Server started on port 7118
✅ Stripe initialized successfully
```

### 4.2 Test Password Reset

1. Go to your website's forgot password page
2. Enter a test email address
3. Click "Send Reset Link"
4. Check the email inbox
5. Verify the password reset email was received

**If you get an error:**
- Check `RESEND_API_KEY` is set correctly
- Verify `RESEND_FROM_EMAIL` domain is verified in Resend
- Check application logs for error details

### 4.3 Test Stripe Payment

1. Go to a competition booking page
2. Click "Book Peg"
3. Use Stripe test card: `4242 4242 4242 4242`
4. Any future expiry date, any CVC
5. Complete payment
6. Verify booking appears in admin dashboard

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`
- Requires authentication: `4000 0025 0000 3155`

⚠️ **Use test mode** (`sk_test_` and `pk_test_`) until thoroughly tested!

---

## Part 5: Troubleshooting

### Issue: "Resend not connected"

**Cause**: `RESEND_API_KEY` environment variable not set or not loaded.

**Solution**:
```bash
# Verify variable is set
echo $RESEND_API_KEY

# If empty, check your .env file
cat .env | grep RESEND

# Restart application to reload environment
pm2 restart peg-slam
# OR
sudo systemctl restart peg-slam
```

### Issue: "Invalid API Key provided" (Stripe)

**Cause**: `STRIPE_SECRET_KEY` not set or invalid.

**Solution**:
```bash
# Verify variable is set
echo $STRIPE_SECRET_KEY

# Should start with sk_test_ or sk_live_
# If wrong, update .env and restart
pm2 restart peg-slam
```

### Issue: Emails Not Sending

**Check**:
1. ✅ RESEND_API_KEY is set and valid
2. ✅ RESEND_FROM_EMAIL matches verified domain
3. ✅ Domain DNS records configured in Resend
4. ✅ Application logs show "[Resend] Using direct API key"

**For testing**, use Resend's test email:
```bash
RESEND_FROM_EMAIL=onboarding@resend.dev
```

### Issue: Environment Variables Not Loading

**Solution**:
```bash
# If using .env file, verify it exists
ls -la .env

# Check file has correct permissions
chmod 600 .env

# Verify dotenv is loading (check server/index.ts)
# Should have: import 'dotenv/config' at top

# Restart application
pm2 restart peg-slam
```

---

## Part 6: Security Best Practices

### 6.1 Protect Your .env File

```bash
# Set restrictive permissions
chmod 600 .env

# Never commit to Git
echo ".env" >> .gitignore

# Verify it's not tracked
git status
```

### 6.2 Use Strong Secrets

```bash
# Generate strong SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Rotate secrets periodically
# Update .env, then restart application
```

### 6.3 Use Stripe Live Mode Only When Ready

- Test thoroughly with `sk_test_` keys
- Monitor Stripe dashboard for test payments
- Switch to `sk_live_` only when ready for real money
- Update both `STRIPE_SECRET_KEY` and `VITE_STRIPE_PUBLIC_KEY`

### 6.4 Monitor Application Logs

```bash
# Watch for errors
pm2 logs peg-slam --err

# Check for suspicious activity
sudo journalctl -u peg-slam | grep -i error
```

---

## Part 7: Updating the Application

When you deploy code changes:

```bash
# Pull latest code
git pull origin main

# Install new dependencies
npm install --production

# Rebuild frontend
npm run build

# Restart application
pm2 restart peg-slam
# OR
sudo systemctl restart peg-slam
```

**After restart**, verify:
- Application starts without errors
- Environment variables loaded correctly
- Stripe payments work
- Password reset emails send

---

## Quick Reference - Essential Commands

```bash
# Check application status
pm2 status

# View logs
pm2 logs peg-slam

# Restart application
pm2 restart peg-slam

# View environment variables
pm2 env 0  # Shows env for first app

# Test if variables are set
echo $RESEND_API_KEY
echo $STRIPE_SECRET_KEY

# Generate new session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Summary Checklist

Before going live, verify:

- [x] MongoDB Atlas connection string set (`MONGODB_URI`)
- [x] Session secret generated and set (`SESSION_SECRET`)
- [x] Stripe keys configured (`STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLIC_KEY`)
- [x] Resend API key set (`RESEND_API_KEY`)
- [x] From email configured and domain verified (`RESEND_FROM_EMAIL`)
- [x] Application built (`npm run build`)
- [x] Application running (PM2 or systemd)
- [x] Logs show no errors
- [x] Password reset tested and working
- [x] Stripe payment tested and working
- [x] SSL certificate configured (HTTPS)
- [x] Nginx reverse proxy configured (if using)

---

## Support

If you encounter issues:

1. Check application logs first: `pm2 logs peg-slam`
2. Verify all environment variables are set: `pm2 env 0`
3. Review this guide's troubleshooting section
4. Check MongoDB Atlas connectivity
5. Verify Stripe dashboard for payment issues
6. Check Resend dashboard for email delivery logs

**Common Issues**: 99% of production problems are caused by:
- Missing environment variables
- Incorrect API keys
- Unverified email domain in Resend
- MongoDB network access not configured

Always check these first!

---

**Document Version**: 2.0  
**Last Updated**: November 11, 2025  
**Compatibility**: Node.js 18+, Amazon Linux 2023, MongoDB Atlas
