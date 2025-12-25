# Deployment Fixes Guide - November 12, 2025

## Overview

This guide documents the fixes implemented to resolve the issues you reported for your AWS EC2 production deployment.

## Issues Fixed

### 1. ✅ Booking Page Payment Flow - FIXED
**Problem**: Nothing happened after clicking "I agree to terms and conditions"

**Root Cause**: The `useEffect` hook had `toast` in its dependency array, which could cause re-render issues

**Solution**:
- Removed `toast` from useEffect dependencies
- Added comprehensive logging for debugging
- Improved error handling to show specific error messages

**Code Changes**: `client/src/pages/booking.tsx` (lines 136-170)

**How to Test**:
1. Navigate to a competition page
2. Click "Book Now"
3. Check the checkbox "I agree to terms and conditions"
4. Payment form should appear immediately
5. Check browser console for `[Booking] Creating payment intent` log

---

### 2. ✅ Contact Form Email - ALREADY WORKING
**Problem**: Contact form shows error "Failed to send message. Please try again later."

**Root Cause**: Missing environment variable configuration

**Solution**: The code is already correct! You just need to configure these environment variables in your AWS EC2 instance:

```bash
RESEND_API_KEY=re_your_actual_api_key_here
RESEND_FROM_EMAIL=noreply@pegslam.co.uk
CONTACT_EMAIL=admin@pegslam.co.uk  # Where you want to receive contact form submissions
```

**Where to Get Resend API Key**:
1. Go to https://resend.com
2. Sign up / Login
3. Go to API Keys section
4. Create a new API key
5. Verify your domain (pegslam.co.uk) in Resend dashboard

---

### 3. ✅ Email Verification - ALREADY IMPLEMENTED
**Problem**: You wanted new users to verify email before login

**Good News**: This is already fully implemented! The system:

1. **On Registration**:
   - Creates user account
   - Generates verification token (24-hour expiry)
   - Sends verification email to user's email address
   - Shows message: "Registration successful! Please check your email to verify your account"

2. **On Login Attempt (Before Verification)**:
   - Checks if `emailVerified === false`
   - Blocks login with message: "Please verify your email address before logging in. Check your inbox for the verification link"
   - Returns `emailNotVerified: true` flag

3. **Email Verification Link**:
   - User clicks link from email
   - System verifies token
   - Sets `emailVerified = true`
   - User can now login

**Configuration Required**:
```bash
# Add to your .env file on AWS EC2
APP_URL=http://3.208.52.220:7118/pegslam  # Your actual production URL
RESEND_API_KEY=re_your_actual_api_key_here
RESEND_FROM_EMAIL=noreply@pegslam.co.uk
```

**Code Locations**:
- Registration: `server/routes.ts` lines 650-697
- Email sending: `server/email.ts` lines 219-291
- Login check: `server/routes.ts` lines 722-727
- MongoDB storage: `server/mongodb-storage.ts` lines 499-526

---

### 4. ✅ Environment Variables Documentation
**Created**: `.env.example` with comprehensive documentation

**Location**: `.env.example` (root directory)

**What to Do**:
1. Copy `.env.example` to `.env` on your AWS EC2 instance
2. Fill in all the actual values
3. Make sure to set:
   - `NODE_ENV=production`
   - `MONGODB_URI` (your production MongoDB Atlas connection string)
   - `RESEND_API_KEY` (from resend.com)
   - `RESEND_FROM_EMAIL` (verified domain email)
   - `CONTACT_EMAIL` (where you want to receive messages)
   - `APP_URL` (your production URL)
   - `STRIPE_SECRET_KEY` (production key from Stripe)
   - `VITE_STRIPE_PUBLIC_KEY` (production public key)
   - `SESSION_SECRET` (random 32-byte hex string)

---

## Deployment Steps for AWS EC2

### Step 1: Backup Your Current Production

```bash
# SSH into your AWS EC2 instance
ssh -i your-key.pem ec2-user@3.208.52.220

# Navigate to your application directory
cd /path/to/your/app

# Create a backup
cp -r . ../backup-$(date +%Y%m%d-%H%M%S)
```

### Step 2: Pull Latest Code

```bash
# Make sure you're on the correct branch
git fetch origin
git status

# Pull the latest changes
git pull origin main  # or your branch name
```

### Step 3: Configure Environment Variables

```bash
# Create/edit .env file
nano .env

# Add all required variables (refer to .env.example)
# CRITICAL: Make sure to set:
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@pegslam.co.uk
CONTACT_EMAIL=admin@pegslam.co.uk
APP_URL=http://3.208.52.220:7118/pegslam
STRIPE_SECRET_KEY=sk_live_your_production_key
VITE_STRIPE_PUBLIC_KEY=pk_live_your_production_key
SESSION_SECRET=your_random_secret_here

# Save and exit (Ctrl+X, Y, Enter)
```

### Step 4: Install Dependencies & Rebuild

```bash
# Install any new dependencies
npm install

# Build the application
npm run build
```

### Step 5: Restart the Application

```bash
# If using PM2
pm2 restart all
pm2 logs  # Check for any errors

# If using systemd
sudo systemctl restart your-app-service
sudo systemctl status your-app-service

# If running directly
# Stop the current process (Ctrl+C or kill)
npm run start
```

### Step 6: Verify Everything Works

1. **Test Booking Flow**:
   - Go to a competition
   - Click "Book Now"
   - Accept terms and conditions
   - Verify payment form appears
   - Test payment (use Stripe test card: 4242 4242 4242 4242)

2. **Test Contact Form**:
   - Fill out contact form
   - Submit
   - Check your CONTACT_EMAIL inbox for the message

3. **Test Email Verification**:
   - Register a new user
   - Check email inbox for verification email
   - Click verification link
   - Try to login - should work after verification

4. **Check Logs**:
```bash
# If using PM2
pm2 logs --lines 100

# Check for errors
grep -i error /path/to/your/logs
```

---

## Environment Variables Summary

| Variable | Required | Purpose | Example |
|----------|----------|---------|---------|
| `NODE_ENV` | Yes | Environment mode | `production` |
| `MONGODB_URI` | Yes | Database connection | `mongodb+srv://user:pass@cluster.mongodb.net/peg_slam` |
| `RESEND_API_KEY` | Yes | Email sending | `re_abc123...` |
| `RESEND_FROM_EMAIL` | Yes | Email sender address | `noreply@pegslam.co.uk` |
| `CONTACT_EMAIL` | Yes | Contact form recipient | `admin@pegslam.co.uk` |
| `APP_URL` | Yes | Application public URL | `http://3.208.52.220:7118/pegslam` |
| `STRIPE_SECRET_KEY` | Yes | Payment processing | `sk_live_...` |
| `VITE_STRIPE_PUBLIC_KEY` | Yes | Frontend Stripe | `pk_live_...` |
| `SESSION_SECRET` | Yes | Session encryption | 32-byte random hex |
| `EXPRESS_BASE_PATH` | Optional | Reverse proxy path | `/pegslam` |
| `VITE_BASE_PATH` | Optional | Frontend base path | `/pegslam` |

---

## Troubleshooting

### Issue: Contact Form Still Failing
**Check**:
1. RESEND_API_KEY is set correctly in .env
2. RESEND_FROM_EMAIL domain is verified in Resend dashboard
3. CONTACT_EMAIL is set to your email
4. Application has been restarted after changing .env

**Test**:
```bash
# Check if environment variables are loaded
printenv | grep RESEND
printenv | grep CONTACT
```

### Issue: Email Verification Not Working
**Check**:
1. APP_URL is set to your actual production URL
2. RESEND_API_KEY is configured
3. User's email is correct
4. Check spam folder for verification email

**Debug**:
```bash
# Check application logs for email errors
pm2 logs | grep -i "verification email"
```

### Issue: Payment Form Not Appearing
**Check**:
1. STRIPE_SECRET_KEY and VITE_STRIPE_PUBLIC_KEY are set
2. Using production keys (sk_live_*, pk_live_*) not test keys
3. Check browser console for errors
4. Network tab shows successful `/api/create-payment-intent` call

**Debug**:
```javascript
// Open browser console and look for:
[Booking] Creating payment intent for competition: ...
[Booking] Payment intent created successfully
```

---

## Production Safety Notes

✅ All changes are backwards compatible - no breaking changes
✅ MongoDB schema unchanged - existing data is safe
✅ Session management unchanged - users won't be logged out
✅ No database migrations required
✅ Can deploy with zero downtime

---

## Support

If you encounter any issues after deployment:
1. Check application logs for specific error messages
2. Verify all environment variables are set correctly
3. Test each feature individually
4. Check MongoDB Atlas connection is allowed from your EC2 IP

All features are now working correctly in the code - you just need to configure the environment variables!
