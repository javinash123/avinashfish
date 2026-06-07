# Peg Slam Mobile - APK Build Instructions

## Prerequisites

1. **Node.js** (v18 or higher) - Download from https://nodejs.org/
2. **Expo CLI** - Will be installed automatically
3. **EAS CLI** - For building APK
4. **Expo Account** - Create free account at https://expo.dev/

## Setup on Your Computer

### Step 1: Download the Source Code

Download the `PegSlamMobile` folder from Replit to your computer.

### Step 2: Open Terminal in the Folder

**Windows:**
```bash
cd C:\path\to\PegSlamMobile
```

**Mac/Linux:**
```bash
cd /path/to/PegSlamMobile
```

### Step 3: Install Dependencies

```bash
# Clean installation
rm -rf node_modules
npm cache clean --force
npm install

# Install EAS CLI globally
npm install -g eas-cli
```

### Step 4: Login to Expo

```bash
eas login
```
Enter your Expo account credentials.

### Step 5: Configure EAS Build (First Time Only)

```bash
eas build:configure
```
Select "Android" when prompted.

## Building the APK

### Option A: Build APK for Testing (Recommended)

This creates an APK you can install directly on Android devices:

```bash
eas build --platform android --profile preview
```

### Option B: Build Production AAB (For Google Play)

This creates an Android App Bundle for Google Play Store:

```bash
eas build --platform android --profile production
```

### Option C: Local APK Build (No Expo Account Needed)

If you want to build locally without an Expo account:

```bash
# Install Expo dev client
npx expo install expo-dev-client

# Build APK locally (requires Android SDK)
npx expo run:android --variant release
```

## During Build Process

When asked:
- **"Generate new keystore?"** → Type `Y` (yes)
- **"Run git init?"** → Type `Y` (yes)

The build typically takes 10-20 minutes.

## After Build Completes

You'll receive:
1. **Download Link** - Direct APK download URL
2. **QR Code** - Scan with your phone camera

### Installing the APK

1. Download the APK to your Android phone
2. Enable "Install from Unknown Sources" in Settings > Security
3. Open the APK file to install

## Configuration

### API URL

The app connects to `https://pegslam.com` by default. If you need to change this, edit `App.tsx`:

```typescript
const API_URL = 'https://your-domain.com';
```

### App Name & Icon

Edit `app.json` to customize:
- `name` - App display name
- `icon` - App icon path
- `splash` - Splash screen image
- `package` - Android package name (com.pegslam.mobile)

## EAS Build Profiles (eas.json)

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

## Troubleshooting

### Build Fails

```bash
# Clear cache and reinstall
rm -rf node_modules
rm -rf .expo
npm cache clean --force
npm install
eas build --platform android --profile preview --clear-cache
```

### Login Issues

```bash
eas logout
eas login
```

### Check Build Status

```bash
eas build:list
```

### View Build Logs

```bash
eas build:view
```

## Features Included

- Login/Register with email
- Browse Competitions
- View Live Leaderboards
- Angler Directory
- News & Updates
- Photo Gallery
- Sponsor Information
- User Profile Management
- Competition Booking (Free competitions in-app, Paid via website)
- Team Management (Create, Join, Leave teams)

## Support

For issues, check:
- Expo Documentation: https://docs.expo.dev/
- EAS Build Guide: https://docs.expo.dev/build/introduction/
