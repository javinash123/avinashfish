# Fix: Stripe Payment Initialization Failure on AWS EC2 Production

## Problem

When users click "I agree to terms and conditions" on the booking page, they see "initializing payment" message but the payment form never appears. This works on Replit but fails on AWS EC2 production.

## Root Cause

**Vite environment variables are embedded at BUILD TIME, not runtime.**

When you:
1. Build the app with `npm run build` (without VITE_STRIPE_PUBLIC_KEY set)
2. Upload the built `dist/` folder to AWS EC2
3. Set environment variables on the AWS EC2 server

The Stripe public key is **NOT** available in the JavaScript bundle because it was built without that variable.

## Solution: Runtime Configuration

We've implemented a **runtime configuration** system that injects environment variables AFTER building, making them available when the app loads.

### How It Works

1. **Template File**: `public/runtime-config.js.template` contains placeholders
2. **Build**: The app builds normally (env vars not required at build time)
3. **Deployment**: A script replaces placeholders with actual env vars
4. **Runtime**: The app loads the config file and uses the real values

---

## Deployment Steps for AWS EC2

### Step 1: Pull Latest Code

```bash
cd /var/www/pegslam  # or your app directory
git pull origin main
```

### Step 2: Install Dependencies & Build

```bash
npm install
npm run build
```

### Step 3: Set Environment Variables

```bash
# Set your Stripe public key (starts with pk_test_ or pk_live_)
export VITE_STRIPE_PUBLIC_KEY='pk_test_your_actual_key_here'

# Verify it's set
echo $VITE_STRIPE_PUBLIC_KEY
```

### Step 4: Generate Runtime Config

```bash
# Use envsubst to replace placeholders in the template
envsubst < public/runtime-config.js.template > dist/public/runtime-config.js
```

### Step 5: Verify the Generated Config

```bash
cat dist/public/runtime-config.js
```

You should see:
```javascript
window.RUNTIME_CONFIG = {
  VITE_STRIPE_PUBLIC_KEY: 'pk_test_your_actual_key_here'
};
```

### Step 6: Restart Your Application

```bash
# If using systemd
sudo systemctl restart pegslam

# OR if using PM2
pm2 restart pegslam

# OR if using nginx + static files
sudo systemctl reload nginx
```

---

## Automated Deployment Script

We've created a deployment script that automates steps 3-6.

### Usage:

```bash
# Set your Stripe public key first
export VITE_STRIPE_PUBLIC_KEY='pk_test_your_actual_key_here'

# Run the deployment script
chmod +x scripts/deploy-aws-runtime-config.sh
./scripts/deploy-aws-runtime-config.sh
```

---

## Verification

### 1. Check Runtime Config in Browser

1. Open your website
2. Open browser console (F12)
3. Type: `window.RUNTIME_CONFIG`
4. You should see your Stripe public key

### 2. Test Payment Booking

1. Navigate to any competition
2. Click "Book a Peg"
3. Check the "I agree to terms and conditions" checkbox
4. The payment form should appear (Stripe card input fields)

### 3. Check for Errors

Look in browser console for:
- ✅ No "Invalid API key" errors
- ✅ No "Stripe is not defined" errors
- ✅ Stripe Elements loads successfully

---

## Alternative Solution: Build on Server with Env Vars

If you prefer to embed the Stripe key at build time (simpler but less flexible):

### Step 1: Create .env File on Server

```bash
cd /var/www/pegslam
nano .env.production
```

Add:
```
VITE_STRIPE_PUBLIC_KEY=pk_test_your_actual_key_here
```

### Step 2: Build with Production Env

```bash
npm run build -- --mode production
```

This will embed the key in the JavaScript bundle.

**Note**: With this approach, you must rebuild the app every time you change the Stripe key.

---

## Environment Variable Requirements

### Backend (Node.js)
Set in your shell or systemd/PM2 config:

```bash
export STRIPE_SECRET_KEY='sk_test_your_secret_key_here'
export MONGODB_URI='mongodb+srv://...'
```

### Frontend (Vite)
Must be prefixed with `VITE_`:

```bash
export VITE_STRIPE_PUBLIC_KEY='pk_test_your_public_key_here'
```

---

## Troubleshooting

### Issue: "Payment processing is not configured"

**Cause**: `STRIPE_SECRET_KEY` is not set on the backend

**Fix**:
```bash
export STRIPE_SECRET_KEY='sk_test_...'
sudo systemctl restart pegslam
```

### Issue: Payment form never appears, stuck on "initializing payment"

**Cause**: `VITE_STRIPE_PUBLIC_KEY` is missing from runtime config

**Fix**:
```bash
# Regenerate runtime config
export VITE_STRIPE_PUBLIC_KEY='pk_test_...'
envsubst < public/runtime-config.js.template > dist/public/runtime-config.js
sudo systemctl reload nginx  # or restart your app server
```

### Issue: "window.RUNTIME_CONFIG is undefined"

**Cause**: `runtime-config.js` file is missing or not being served

**Fix**:
```bash
# Check if file exists
ls -la dist/public/runtime-config.js

# If missing, regenerate it
export VITE_STRIPE_PUBLIC_KEY='pk_test_...'
envsubst < public/runtime-config.js.template > dist/public/runtime-config.js
```

### Issue: Browser shows 404 for `/runtime-config.js`

**Cause**: Nginx or your static file server isn't configured to serve it

**Fix**: Ensure `dist/public/` is being served at the root path
```nginx
# In your nginx config
location / {
    root /var/www/pegslam/dist/public;
    try_files $uri $uri/ /index.html;
}
```

---

## Security Note

**Q: Is it safe to expose VITE_STRIPE_PUBLIC_KEY in runtime-config.js?**

**A: Yes!** The Stripe **public key** (starts with `pk_`) is designed to be exposed in frontend code. It cannot be used to charge cards or access your Stripe account. Only the **secret key** (starts with `sk_`) must be kept confidential on the backend.

---

## Summary of Changes

### Files Modified:
1. `client/index.html` - Added `<script src="/runtime-config.js"></script>`
2. `client/src/pages/booking.tsx` - Updated to use runtime config with fallback
3. `public/runtime-config.js.template` - Created template for environment variable injection

### Files Created:
1. `scripts/deploy-aws-runtime-config.sh` - Automated deployment script
2. `STRIPE_PAYMENT_FIX.md` - This documentation

### Deployment Process:
1. Build app (env vars not required)
2. Use `envsubst` to generate runtime-config.js from template
3. Deploy and serve the built files
4. Restart application

---

## Production Deployment Checklist

- [ ] Pull latest code from repository
- [ ] Run `npm install` to update dependencies
- [ ] Run `npm run build` to build the application
- [ ] Set `VITE_STRIPE_PUBLIC_KEY` environment variable
- [ ] Run `envsubst < public/runtime-config.js.template > dist/public/runtime-config.js`
- [ ] Verify runtime-config.js contains the correct Stripe key
- [ ] Set `STRIPE_SECRET_KEY` in backend environment
- [ ] Restart application (systemd/PM2/nginx)
- [ ] Test payment booking on live site
- [ ] Verify no console errors related to Stripe

---

**Need help?** Check the browser console for specific error messages and refer to the Troubleshooting section above.
