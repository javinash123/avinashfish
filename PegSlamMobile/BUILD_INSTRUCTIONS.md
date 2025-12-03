# Peg Slam Mobile - Build Instructions

## On Your Computer

### 1. Download the folder
Download `PegSlamMobile` folder from Replit to your computer

### 2. Open terminal/command prompt in the folder

```bash
cd C:\PegSlamMobile
```

### 3. Clean installation

```bash
# Delete old files
rmdir /s node_modules

# Clear cache
npm cache clean --force

# Install fresh
npm install
```

**On Mac/Linux:**
```bash
rm -rf node_modules
npm cache clean --force
npm install
```

### 4. Configure your API

Open `App.tsx` and change this line:
```javascript
const API_URL = 'https://your-api-domain.com';
```
Replace with your actual AWS EC2 domain.

### 5. Build the APK

```bash
npm run build
```

When asked:
- **"Generate new keystore?"** → Yes
- **"Run git init?"** → Yes

Wait 5-10 minutes for the build to complete.

### 6. Download & Install

You'll get:
- QR code → Scan with your phone
- Download link → Direct download

Scan QR code on your Android phone and install the APK.

## Troubleshooting

If build fails again:
```bash
npm install -g eas-cli@latest
eas logout
eas login
npm run build
```

## Features Included

✅ Login/Register  
✅ Browse Competitions  
✅ View Leaderboards  
✅ User Profile  
✅ Connected to your MongoDB backend

