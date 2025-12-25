# AWS EC2 Deployment - Step-by-Step Instructions

## The Issue
The production server is still returning test Stripe keys. This means we need to deploy the updated code and verify the environment is configured correctly.

## Quick Diagnostic - Run This on Your EC2

SSH into your EC2 instance and run:
```bash
# Check if code is deployed
grep "dotenv.config" /home/ec2-user/pegslam/dist/index.js
# Should output: const dotenv = __importStar(require("dotenv"));

# Check if .env has live keys
grep "VITE_STRIPE_PUBLIC_KEY" /home/ec2-user/pegslam/.env

# Check Node.js process
ps aux | grep node
```

## Complete Deployment Steps

### Step 1: SSH into EC2
```bash
ssh ec2-user@your-ec2-public-ip
cd /home/ec2-user/pegslam
```

### Step 2: Stop the running Node.js process
```bash
# If using systemd
sudo systemctl stop pegslam

# OR if running manually, find and kill the process
ps aux | grep node
kill -9 [PID]
```

### Step 3: Update .env with LIVE Stripe keys
```bash
nano .env
```

Make sure you have these lines (replace with YOUR actual LIVE keys):
```
NODE_ENV=production
VITE_STRIPE_PUBLIC_KEY=pk_live_YOUR_ACTUAL_LIVE_KEY_HERE
STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_SECRET_KEY_HERE
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_secure_random_secret_here
```

**IMPORTANT:**
- Keys must start with `pk_live_` and `sk_live_` (NOT `pk_test_` or `sk_test_`)
- Get your keys from: https://dashboard.stripe.com/apikeys
- Toggle "Reveal test key" to "Reveal live key"

### Step 4: Rebuild the project (this is CRITICAL)
```bash
cd /home/ec2-user/pegslam
npm run build
```

This creates/updates the `dist/` folder with your latest code.

### Step 5: Restart Node.js process
```bash
# If using systemd
sudo systemctl start pegslam
sudo systemctl status pegslam

# OR if running manually
node /home/ec2-user/pegslam/dist/index.js &
```

### Step 6: Verify it's working
```bash
# Check logs for startup info (should show pk_live_...)
sudo journalctl -u pegslam -n 20

# OR curl the endpoint
curl https://pegslam.com/api/runtime-config
```

You should see:
```json
{
  "VITE_STRIPE_PUBLIC_KEY": "pk_live_YOUR_KEY..."
}
```

## Troubleshooting

**Still showing test keys?**
1. Verify .env file exists and has live keys: `cat .env`
2. Check if code was built: `ls -la dist/index.js`
3. Check if Node.js is running with updated code: `ps aux | grep node`
4. Review server logs: `sudo journalctl -u pegslam -f`

**Getting permission errors?**
- Make sure you own the directory or use `sudo` appropriately
- Check EC2 security group allows inbound HTTPS

**MongoDB not connecting?**
- Verify MONGODB_URI is correct in .env
- Check EC2 security group allows outbound access to MongoDB server
