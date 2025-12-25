# Stripe Live Keys Issue - Root Cause and Fix

## The Problem

Even after adding live Stripe credentials in your `.env` file on AWS EC2, the site was still showing the Stripe widget and accepting test cards.

### Root Cause

The Stripe **public key** is embedded at **build time** into the JavaScript bundle. When you changed the `.env` file on EC2, the frontend code didn't update because it was already compiled with the old test key.

```
Build Time (Replit):
  .env → VITE_STRIPE_PUBLIC_KEY=pk_test_xxx 
           ↓
         Compiled into dist/public/assets/index-*.js
           ↓
         dist folder (hardcoded test key)

Deployment (EC2):
  .env → VITE_STRIPE_PUBLIC_KEY=pk_live_yyy 
           ↓
         But dist still has pk_test_xxx hardcoded!
           ↓
         Frontend still uses test key (old key wins)
```

## The Solution

I've added a **runtime configuration endpoint** that returns live environment variables:

### 1. Backend Endpoint Added

**File:** `server/routes.ts` (new endpoint)
```typescript
// Runtime configuration endpoint - returns live environment variables
app.get("/api/runtime-config", (req, res) => {
  res.json({
    VITE_STRIPE_PUBLIC_KEY: process.env.VITE_STRIPE_PUBLIC_KEY || ''
  });
});
```

### 2. Frontend Updated

**File:** `client/src/pages/booking.tsx`

The booking page now:
- Fetches the Stripe public key from `/api/runtime-config` endpoint at startup
- Uses the live key returned by the server
- Falls back to build-time key if endpoint fails
- Loads Stripe dynamically with the correct key

## How to Deploy the Fix

### Step 1: Upload New Build
Copy the new `dist` folder to your EC2 instance (same as before)

### Step 2: Set Environment Variables on EC2
In your `.env` file on EC2:
```bash
VITE_STRIPE_PUBLIC_KEY=pk_live_your_actual_live_key_here
STRIPE_SECRET_KEY=sk_live_your_actual_secret_key_here
```

### Step 3: Restart Application
```bash
# Stop current process
kill $(lsof -t -i :5000)

# Or if using PM2
pm2 restart your-app-name

# Start again
npm start
```

### Step 4: Verify Fix
Check browser console logs when navigating to booking page:
```
[Booking] Loaded Stripe public key from runtime config
[Booking] Loading Stripe with public key
```

The Stripe widget should now:
- Show the live Stripe account (no longer show test mode)
- Accept real credit cards (Visa, Mastercard, Amex, Discover)
- Reject test card numbers as invalid

## Key Changes Made

### Files Modified:
1. **server/routes.ts** 
   - Added `/api/runtime-config` endpoint that returns `VITE_STRIPE_PUBLIC_KEY` from environment

2. **client/src/pages/booking.tsx**
   - Changed from build-time key to runtime fetching
   - Added `getStripePublicKey()` function to fetch from `/api/runtime-config`
   - Falls back to build-time key if endpoint fails
   - Logs what key is being used for debugging

## Why This Works

- **On Startup:** Frontend fetches current Stripe public key from server
- **No Rebuild Needed:** Change `.env` on EC2, restart app, and frontend automatically gets the live key
- **No Hardcoding:** Stripe key is no longer baked into JavaScript
- **Live Updates:** Any change to VITE_STRIPE_PUBLIC_KEY in .env will be picked up on next app restart

## Testing the Fix

### Test Case 1: Live Stripe (After Fix)
```
1. Deploy new dist folder to EC2
2. Set VITE_STRIPE_PUBLIC_KEY=pk_live_xxx in .env
3. Restart app
4. Go to booking page
5. Stripe widget loads with LIVE key
6. Test with real credit card details
7. Payment should process in live mode
```

### Test Case 2: Verify Logs
```bash
# SSH into EC2
ssh -i key.pem ec2-user@your-ip

# Check logs for runtime config calls
tail -f your-app.log

# You should see:
# [express] GET /api/runtime-config 200
# [Booking] Loaded Stripe public key from runtime config
```

## Important Notes

- ✅ Backend secret key (`STRIPE_SECRET_KEY`) can be changed without rebuild
- ✅ Frontend public key now loads at runtime from endpoint
- ✅ No rebuild needed on EC2 - just update .env and restart
- ✅ Automatic fallback if runtime config fails
- ⚠️ Make sure `VITE_STRIPE_PUBLIC_KEY` is set in your `.env` file on EC2

## If Issues Persist

1. **Verify environment variable is set:**
   ```bash
   echo $VITE_STRIPE_PUBLIC_KEY
   ```

2. **Check if runtime config endpoint returns key:**
   ```bash
   curl http://localhost:5000/api/runtime-config
   # Should return: {"VITE_STRIPE_PUBLIC_KEY":"pk_live_xxx"}
   ```

3. **Check browser console for logs:**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for `[Booking]` messages
   - Check if key is being loaded correctly

4. **Verify Stripe key format:**
   - Public key should start with `pk_live_` (not `pk_test_`)
   - Secret key should start with `sk_live_` (not `sk_test_`)

---

**Build Status:** ✅ Complete and ready for deployment
**New Build Size:** 1.6 MB (same as before)
**Changes:** Minimal, focused on fixing Stripe key loading
