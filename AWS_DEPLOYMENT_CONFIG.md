# AWS Deployment Configuration Guide

## Environment Variables for AWS Server

Set these environment variables on your AWS server before running the application:

```bash
# Server Configuration
export NODE_ENV=production
export PORT=7118
export EXPRESS_BASE_PATH=/pegslam

# Session Security (IMPORTANT: Change this to a strong random secret!)
export SESSION_SECRET=your-strong-random-secret-here

# Database Configuration
export MONGODB_URI=your-mongodb-atlas-connection-string

# Stripe Payment Processing (Optional)
# export STRIPE_SECRET_KEY=your-stripe-secret-key-here

# Note: Frontend base path is configured at build time via VITE_BASE_PATH
# The build:aws script in package.json sets this automatically
```

## Deployment URL
Your application will be accessible at:
- **Base URL**: http://3.208.52.220/pegslam/
- **Port**: 7118
- **API Endpoints**: http://3.208.52.220:7118/pegslam/api/*

## Quick Deployment Steps

1. **Upload Code to AWS Server**
2. **Install Dependencies**: `npm install --production`
3. **Set Environment Variables** (see above)
4. **Build Frontend**: `npm run build`
5. **Start Server**: `npm start`

Detailed instructions provided in DEPLOYMENT.md
