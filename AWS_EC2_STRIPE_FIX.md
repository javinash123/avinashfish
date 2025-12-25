# AWS EC2 Stripe Live Keys Fix - Complete Guide

## Problem
When deployed on AWS EC2 with Amazon Linux, the `/api/runtime-config` endpoint returns test Stripe keys even though live keys are set in the `.env` file.

## Root Cause
The Node.js process wasn't explicitly loading environment variables from the `.env` file using `dotenv.config()`. Without this call, environment variables defined in `.env` are not loaded into `process.env`.

## Solution

### Step 1: Update Server Code (ALREADY DONE)
The `server/index.ts` file now includes:
```typescript
// Load environment variables FIRST, before any other imports
import dotenv from "dotenv";
dotenv.config({ override: true });
```

This ensures all environment variables from `.env` are loaded when the server starts.

### Step 2: Set Up Environment Variables on AWS EC2

#### Option A: Using .env file (Recommended for Development)
1. SSH into your EC2 instance
2. Navigate to your project directory
3. Create/update the `.env` file:
```bash
nano .env
```

4. Add these variables with your LIVE Stripe keys:
```
NODE_ENV=production
VITE_STRIPE_PUBLIC_KEY=pk_live_YOUR_LIVE_KEY_HERE
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_HERE
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_secure_random_secret
```

5. Save the file (Ctrl+X, then Y, then Enter)
6. Restart your Node.js process

#### Option B: Using systemd Service (Recommended for Production)
1. Create a systemd service file:
```bash
sudo nano /etc/systemd/system/pegslam.service
```

2. Add this content:
```ini
[Unit]
Description=PegSlam Website
After=network.target mongodb.service

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/pegslam
Environment="NODE_ENV=production"
Environment="VITE_STRIPE_PUBLIC_KEY=pk_live_YOUR_LIVE_KEY_HERE"
Environment="STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_HERE"
Environment="MONGODB_URI=your_mongodb_connection_string"
Environment="SESSION_SECRET=your_secure_random_secret"
ExecStart=/usr/bin/node /home/ec2-user/pegslam/dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

3. Replace paths and credentials with your actual values
4. Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable pegslam
sudo systemctl start pegslam
```

### Step 3: Verify Stripe Keys Are Loaded

After starting/restarting your server, check the logs:
```bash
# If using systemd
sudo journalctl -u pegslam -f

# If running manually
node dist/index.js
```

You should see:
```
📋 ENVIRONMENT STARTUP INFO:
   NODE_ENV: production
   Stripe Key: pk_live_...
   MongoDB: configured
```

### Step 4: Test the Runtime Config Endpoint

```bash
curl https://your-domain.com/api/runtime-config
```

Should return:
```json
{
  "VITE_STRIPE_PUBLIC_KEY": "pk_live_YOUR_KEY_HERE"
}
```

## Important Notes

1. **Never commit `.env` file to Git** - Add it to `.gitignore`
2. **Live Keys Start with `pk_live_` and `sk_live_`** - Test keys start with `pk_test_` and `sk_test_`
3. **Get your keys from**: https://dashboard.stripe.com/apikeys
4. **Environment variables take precedence**: Values in systemd service override `.env` file
5. **Restart required**: Changes to environment variables require restarting the Node.js process

## Troubleshooting

### Still seeing test keys?
1. Check the server logs for the environment info printed on startup
2. Verify the `.env` file exists and has correct values
3. Ensure you've restarted the Node.js process after making changes
4. Check that `VITE_STRIPE_PUBLIC_KEY` key name is correct (case-sensitive)

### MongoDB not connecting?
- Verify `MONGODB_URI` is correct in your `.env` or systemd file
- Check that EC2 security group allows outbound connections to your MongoDB server

### Sessions not persisting?
- Ensure `SESSION_SECRET` is set to a strong, random value
- In production, consider using a session store (not in-memory)

## Deployment Checklist

- [ ] Stop the running Node.js process
- [ ] Set environment variables in `.env` or systemd file with LIVE Stripe keys
- [ ] Verify `.env` is in `.gitignore` and not committed
- [ ] Build the project: `npm run build`
- [ ] Start/restart the Node.js process
- [ ] Check logs for "ENVIRONMENT STARTUP INFO"
- [ ] Test `/api/runtime-config` endpoint
- [ ] Verify payments work in Stripe dashboard
