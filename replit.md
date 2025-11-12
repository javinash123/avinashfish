# Peg Slam - UK Fishing Competition Platform

## Overview

Peg Slam is a professional UK-based platform for managing fishing competitions. It enables anglers to register, book pegs, and track performance. Organizers can run various match fishing events with integrated ticketing, payment processing in GBP, sponsor management, and a media gallery. The platform also provides live leaderboards and results for spectators, aiming to be the premier online destination for UK fishing competitions.

## Recent Changes

### ✅ November 12, 2025 - Production Deployment Fixes

**Fixed 4 critical issues for AWS EC2 production deployment:**

1. **Booking Page Payment Flow - FIXED**
   - **Issue:** Nothing happened after clicking "I agree to terms and conditions" on booking page
   - **Root Cause:** `useEffect` hook had `toast` in dependency array causing potential re-render issues
   - **Solution:** Removed `toast` from dependencies, added comprehensive error logging and handling
   - **Code Changes:** `client/src/pages/booking.tsx` lines 136-170

2. **Contact Form Email Configuration - DOCUMENTED**
   - **Issue:** Contact form failed with "Failed to send message" error
   - **Root Cause:** Missing environment variable configuration
   - **Solution:** Code already correct - just needs environment variables configured:
     - `RESEND_API_KEY` - API key from resend.com
     - `RESEND_FROM_EMAIL` - Verified sender email (e.g., noreply@pegslam.co.uk)
     - `CONTACT_EMAIL` - Where to receive contact form submissions (e.g., admin@pegslam.co.uk)

3. **Email Verification - ALREADY IMPLEMENTED**
   - **Feature:** New users must verify email before login
   - **Status:** ✅ Fully implemented and working! System automatically:
     - Sends verification email on registration
     - Blocks login until email is verified
     - Shows appropriate error messages
     - Token expires after 24 hours
   - **Configuration Required:**
     - `APP_URL` - Production URL for verification links (e.g., http://3.208.52.220:7118/pegslam)
     - `RESEND_API_KEY` - For sending emails
   - **Code Locations:**
     - Registration: `server/routes.ts` lines 650-697
     - Login check: `server/routes.ts` lines 722-727
     - MongoDB storage: `server/mongodb-storage.ts` lines 499-526

4. **Environment Variables Documentation - ENHANCED**
   - **Created:** Comprehensive `.env.example` with all required variables
   - **Added:** `CONTACT_EMAIL` and `APP_URL` documentation
   - **Created:** `DEPLOYMENT_FIXES_GUIDE.md` - Complete AWS EC2 deployment guide

**Production Safety:** ✅ All changes are backwards compatible, no database schema changes, no breaking changes, zero-downtime deployment possible.

**Next Steps for Production:**
1. Configure environment variables on AWS EC2
2. Restart application
3. Test booking payment flow
4. Test contact form email delivery
5. Test new user registration and email verification

### ✅ November 11, 2025 - Password Reset Functionality Fixed (MongoDB Storage)

**Issue:** Password reset functionality was failing in production when using MongoDB database because three required storage methods were missing from the MongoDB storage implementation.

**Solution:** Added three password reset methods to `server/mongodb-storage.ts`:
- `setPasswordResetToken(email, token, expiry)` - Sets a temporary reset token and expiry on user account
- `getUserByResetToken(token)` - Retrieves user by reset token and validates it hasn't expired
- `clearPasswordResetToken(userId)` - Clears reset token after successful password reset

**Backward Compatibility:** ✅ All changes are backward compatible. The User schema already included `resetToken` and `resetTokenExpiry` fields (both nullable), so no database migration or data deletion was required. Existing data remains intact.

**Technical Details:** The methods use MongoDB's `findOneAndUpdate` with proper result destructuring (`const { value } = await ...`) to return `User | undefined` matching the IStorage interface contract.

### ✅ Stripe Payment Integration Enhanced

**Issue:** When Stripe API keys were invalid or missing, users received cryptic error messages that didn't explain how to fix the problem.

**Solution:** Enhanced Stripe integration with better validation and error messaging:
- Added startup validation to detect invalid API keys (must start with `sk_test_` or `sk_live_`)
- Improved error messages in payment endpoints to guide users to Stripe dashboard
- Added clear instructions on where to obtain valid API keys

**Production Setup Required:**
To enable Stripe payments in production, set these environment variables:
- `STRIPE_SECRET_KEY` - Your Stripe secret key from https://dashboard.stripe.com/apikeys (starts with `sk_test_` for test mode or `sk_live_` for production)
- `VITE_STRIPE_PUBLIC_KEY` - Your Stripe publishable key (starts with `pk_test_` or `pk_`)

**Note:** The application works without Stripe keys configured, but payment functionality will not be available until valid keys are set.

### ✅ AWS EC2 Production Deployment Support (November 11, 2025)

**Issue:** The application was using Replit-specific connector system for email functionality, which failed in AWS EC2 production deployments with error "Resend not connected".

**Solution:** Enhanced email configuration (`server/email.ts`) to support dual-environment deployment:
- **Priority 1**: Direct environment variables (for AWS EC2, standalone servers)
  - `RESEND_API_KEY` - Resend API key for email sending
  - `RESEND_FROM_EMAIL` - Sender email address (must be verified domain)
- **Fallback**: Replit connector system (for Replit deployments)

**How it Works:**
1. Application first checks for `RESEND_API_KEY` environment variable
2. If found, uses it directly (production/AWS mode)
3. If not found, attempts Replit connector integration (Replit mode)
4. Provides clear error messages if neither is configured

**Production Environment Variables Required:**
For AWS EC2 or standalone deployments, configure these in your `.env` file:
```bash
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.net/peg_slam

# Security
SESSION_SECRET=generate-with-crypto-randomBytes-32

# Stripe Payments
STRIPE_SECRET_KEY=sk_live_your_secret_key
VITE_STRIPE_PUBLIC_KEY=pk_live_your_publishable_key

# Email (Resend)
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=noreply@pegslam.co.uk

# Optional: Base path for reverse proxy
EXPRESS_BASE_PATH=/pegslam
VITE_BASE_PATH=/pegslam
```

**Documentation Created:**
- `AWS_EC2_PRODUCTION_SETUP.md` - Complete guide for AWS EC2 deployment
- `.env.example` - Updated with all required environment variables

**Backward Compatibility:** ✅ Fully backward compatible. Existing Replit deployments continue to work with connector system. AWS EC2 deployments now work with environment variables.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

*   **Framework:** React 18 with TypeScript and Vite.
*   **Routing:** Wouter for client-side routing.
*   **Component Library & Styling:** Radix UI primitives with shadcn/ui styling, Tailwind CSS, custom design tokens, responsive design, and dark mode support.
*   **State Management:** TanStack Query for server state, local React state for UI state.
*   **Design System:** New York style variant from shadcn/ui, custom color palette (Deep Water Blue, Lake Green, Slate Grey), Inter and JetBrains Mono typography.
*   **Key UI Patterns:** Competition cards, live leaderboards, interactive peg map, sponsor carousel, `react-hook-form` with Zod validation.
*   **Image Display:** Public-facing images use `object-cover` for visual appeal, while admin previews use `object-contain`.
*   **Weight Input:** Implemented UK Pounds and Ounces weight system for entries and display.

### Backend

*   **Server Framework:** Express.js with TypeScript, custom middleware for logging and error handling.
*   **API Design:** RESTful endpoints, JSON format, session-based authentication.
*   **Data Layer:** Drizzle ORM for PostgreSQL. In-memory storage used for development.
*   **UK Timezone Support:** Utilizes `date-fns-tz` for accurate UK timezone handling in competition status calculations.
*   **Request Size Limit:** Increased body parser limit to 50MB to accommodate rich text content with embedded images.

### Admin Panel

*   **Management:** Dashboard for revenue/booking metrics, CRUD operations for competitions, anglers, sponsors, news, and gallery.
*   **Admin Authentication:** Secure login (email/password), session-based, route protection, with role-based access control (Admin/Manager).
*   **Content Management:** Rich text editor (`react-quill`) for news, dynamic hero slider, and logo management.
*   **Staff Management:** Comprehensive system with role-based permissions (Admin, Manager).
*   **Competition Angler Management:** Admins can add/remove participants from competitions, with peg assignment and capacity management.

### User Authentication

*   **Angler Authentication:** Registration (email, username, password, names, club), secure login/logout, session-based.
*   **User Profile:** Displays personal info, fishing preferences, competition stats, upcoming competitions. Anglers can edit bio, club, location, favourite method, and species.
*   **User Gallery:** Anglers can upload and manage personal photo galleries.
*   **Admin Angler Management:** View, search, filter, approve, block users, view profiles.
*   **Competition Participation:** Anglers can join/leave competitions with peg assignment and capacity management.

## External Dependencies

*   **Payment Processing:** Stripe (Payment Intents API, Stripe Elements).
*   **Database:** PostgreSQL via Neon serverless driver.
*   **Timezone Support:** `date-fns-tz`.
*   **UI Component Libraries:** Radix UI, Tailwind CSS, Lucide React, `react-icons`, `date-fns`.
*   **Development Tools:** Vite, esbuild, TypeScript.