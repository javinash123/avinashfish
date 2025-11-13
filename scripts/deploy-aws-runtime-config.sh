#!/bin/bash

set -e

echo "========================================="
echo "AWS EC2 Deployment - Runtime Config Setup"
echo "========================================="

cd /var/www/pegslam

echo "[1/6] Setting environment variables..."
export VITE_STRIPE_PUBLIC_KEY="${VITE_STRIPE_PUBLIC_KEY}"

if [ -z "$VITE_STRIPE_PUBLIC_KEY" ]; then
  echo "ERROR: VITE_STRIPE_PUBLIC_KEY is not set!"
  echo "Please set it before running this script:"
  echo "  export VITE_STRIPE_PUBLIC_KEY='pk_test_...'"
  exit 1
fi

echo "[2/6] Injecting runtime config into index.html..."

# Create the runtime config script content
RUNTIME_CONFIG_SCRIPT="<script>window.RUNTIME_CONFIG={VITE_STRIPE_PUBLIC_KEY:'${VITE_STRIPE_PUBLIC_KEY}'};</script>"

# Inject before the closing </head> tag in index.html
sed -i "s|</head>|${RUNTIME_CONFIG_SCRIPT}</head>|" dist/public/index.html

echo "[3/6] Verifying runtime config injection..."
grep "RUNTIME_CONFIG" dist/public/index.html || {
  echo "ERROR: Failed to inject runtime config into index.html"
  exit 1
}

echo "[4/6] Runtime config injected successfully!"
echo ""
echo "Injected script:"
echo "$RUNTIME_CONFIG_SCRIPT"

echo ""
echo "[5/6] Restarting application..."
sudo systemctl restart pegslam  # or: pm2 restart pegslam

echo "[6/6] ✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Visit your website and test the payment booking"
echo "2. Check browser console for any Stripe-related errors"
echo "3. Verify the Stripe public key is loaded by checking window.RUNTIME_CONFIG in console"
