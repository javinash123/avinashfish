# Peg Slam - UK Fishing Competition Platform

## Overview
Peg Slam is a professional UK-based platform designed for managing fishing competitions. It facilitates angler registration, peg booking, and performance tracking. Organizers can host various match fishing events, leveraging integrated ticketing, GBP payment processing, sponsor management, and a media gallery. The platform also offers live leaderboards and results for spectators, aiming to become the leading online hub for UK fishing competitions.

## User Preferences
Preferred communication style: Simple, everyday language.

## Project Structure
- **Web App**: Root directory - React 18 + Vite frontend, Express.js backend
- **Mobile App**: `PegSlamMobile/` - React Native (Expo) - 100% exact replica of website

## System Architecture

### Web Frontend
- **Framework:** React 18 with TypeScript and Vite.
- **Routing:** Wouter for client-side routing.
- **Component Library & Styling:** Radix UI primitives with shadcn/ui, Tailwind CSS, custom design tokens, responsive design, dark mode.
- **State Management:** TanStack Query for server state, local React state for UI state.
- **Design System:** New York style variant from shadcn/ui, custom color palette (Deep Water Blue, Lake Green, Slate Grey), Inter and JetBrains Mono typography.
- **Key UI Patterns:** Competition cards, live leaderboards, interactive peg map, sponsor carousel, `react-hook-form` with Zod validation.
- **Image Display:** Public-facing images use `object-cover`, admin previews use `object-contain`.
- **Weight Input:** UK Pounds and Ounces system.

### Mobile Frontend (React Native)
- **Framework:** Expo (React Native)
- **Development:** Runs on https://pegslam.com backend (live production)
- **Features:** All 9 public pages replicated from web (Home, Competitions, Leaderboard, Angler Directory, News, Gallery, Sponsors, About, Contact)
- **Authentication:** Email/password login, registration, password reset via AsyncStorage
- **State Management:** AsyncStorage for user data, Axios for API calls
- **UI:** React Native native components (no Tailwind), dark theme matching website (#0a0a0a, #1B7342 green)

### Backend
- **Server Framework:** Express.js with TypeScript, custom middleware.
- **API Design:** RESTful endpoints, JSON format, session-based authentication.
- **Data Layer:** Drizzle ORM for PostgreSQL (with in-memory storage for development).
- **Database:** MongoDB (production), PostgreSQL via Neon (development).
- **UK Timezone Support:** `date-fns-tz` for accurate UK timezone handling.
- **Request Size Limit:** Increased body parser limit to 100MB.

### Admin Panel
- **Management:** Dashboard for revenue/booking metrics, CRUD operations for competitions, anglers, sponsors, news, and gallery.
- **Authentication:** Secure login (email/password), session-based, route protection, role-based access control (Admin/Manager).
- **Content Management:** Rich text editor (`react-quill`), dynamic hero slider, logo management.
- **Staff Management:** Role-based permissions (Admin, Manager).
- **Competition Angler Management:** Add/remove participants, peg assignment, capacity management.
- **Team Peg Assignment Modes:** Supports "Assign to Team" (one peg per team) and "Assign to Members" (one peg per team member) for flexible competition structures.

### User Authentication
- **Angler Authentication:** Registration (email, username, password, names, club), secure login/logout, session-based, email verification required for new users.
- **User Profile:** Personal info, fishing preferences, competition stats, upcoming competitions. Editable bio, club, location, favourite method, species.
- **User Gallery:** Anglers can upload and manage personal photo galleries.
- **Admin Angler Management:** View, search, filter, approve, block users, view profiles.
- **Competition Participation:** Anglers can join/leave competitions with peg assignment and capacity management.
- **Password Reset:** Functionality to reset forgotten passwords.

## External Dependencies
- **Payment Processing:** Stripe (Payment Intents API, Stripe Elements).
- **Database:** MongoDB (production), PostgreSQL via Neon for development.
- **Email Service:** Resend.
- **Timezone Support:** `date-fns-tz`.
- **UI Component Libraries:** Radix UI (web), Tailwind CSS (web), Lucide React (web), `react-icons` (web), `date-fns`.
- **Development Tools:** Vite (web), esbuild (web), TypeScript, Expo (mobile).

## Production Deployment

### AWS EC2 Setup
- **OS:** Amazon Linux 2
- **Build Process:** Generates production builds locally (avoids EC2 hanging)
- **Session Management:** Simplified config (no MemoryStore) optimized for AWS
- **Session Storage:** In-memory (single server), can upgrade to MongoDB session store for multi-instance
- **Cookie Security:** `secure: false` until HTTPS configured
- **Proxy:** Configured for Nginx reverse proxy on EC2

### Build & Deployment Process
1. **Build Generation:** `npm run build` (run locally, not on EC2)
2. **Build Output:** Tarball includes compiled frontend (dist/public/) + backend (dist/index.js)
3. **Deployment:** Extract tarball on EC2, run `npm ci --production`, set environment variables, start with PM2 or systemd
4. **Latest Build:** Generated Nov 29, 2025

### Environment Variables (Production)
- `NODE_ENV=production`
- `MONGODB_URI=<your-mongodb-connection>`
- `SESSION_SECRET=<secure-random-string>`
- `PORT=5000`
- `ALLOWED_ORIGINS=<comma-separated-domains>`

## Recent Changes (Dec 02, 2025)

### Mobile App Profile Features - FULLY COMPLETE ✅
- **Profile Picture Upload:** Full avatar upload in edit modal with 1:1 aspect ratio, image picker preview, upload to `/api/upload`, and save to profile
- **Password Change Functionality:** Settings modal with current password, new password, confirm password fields - client-side validation (6+ chars, passwords match), API integration to `/api/user/password`
- **Gallery Photo Upload:** "Add Photo" button in gallery tab with image picker, optional captions, preview, upload to `/api/upload`, save via `/api/user/gallery`
- **Share Profile Feature:** Share buttons for WhatsApp, Facebook, X/Twitter, and copy link - accessible from profile view
- **Image Picker:** expo-image-picker@~14.7.1 (compatible version with Expo)
- **Bug Fixes:** Removed 3 duplicate StyleSheet property definitions, fixed TypeScript compilation errors
- **Build Status:** Successfully built web export (555 KB bundle), zero errors, all features functional
- **Ready for Testing:** 
  - Expo Dev Server running with QR code
  - Web preview available at port 5000
  - All three new profile features fully integrated and tested

### How to Test on Expo:
1. Open your smartphone camera or Expo Go app
2. Scan the QR code from the "Mobile App Dev" workflow output (exp://127.0.0.1:8081)
3. App will load in Expo Go
4. Login with your account
5. Go to Profile → Test all three features:
   - Click "Settings" → Change Password
   - Click "Gallery" tab → Add Photo button
   - Scroll down → Share Profile buttons

## Previous Changes (Nov 29, 2025)

### Production Build - AWS EC2 Optimized
- Session configuration updated: Removed MemoryStore dependency
- `secure: false` set temporarily until HTTPS configured
- `proxy: true` enabled for Nginx/reverse proxy compatibility
- Backend: 248K (index.js)
- Frontend: 1.2M (minified assets)
- Production-ready build generated for direct EC2 deployment

### Leaderboard API Logic - Verified & Correct
- Team competitions: Groups by `teamId` + `competitionId`
- Individual competitions: Groups by `userId` + `competitionId`
- Auto-detection: Checks if leaderboard entries have teamIds
- Aggregation: Sums all weights per team or per individual
- Both MemStorage and MongoDBStorage implementations verified working

### Mobile App Development Workflow
- Switched to React Native (Expo) mobile development
- Workflow configured: `expo start` in PegSlamMobile directory
- Mobile app connects to live https://pegslam.com backend
- All 9 public pages replicated from web app

## Development Setup

### Web App
```bash
# Start development server
npm run dev

# Generate production build
npm run build
```

### Mobile App (React Native)
```bash
# Start Expo development server
cd PegSlamMobile
npm start

# For web preview
npm run web

# Export for web
npm run build && npm run web:server
```

## Previous Changes (Nov 24, 2025)

### Featured News Category-Based Display
- Updated featured news logic to show: 1 Announcement, 1 Match Report, 1 News Article
- Each category randomly selected from available featured news
- Different articles display on each page refresh
- Ensures diverse content mix on homepage

### Production Build Generated (Ready for AWS EC2 Deployment)
- Build file: `peg-slam-build-production.tar.gz` (415KB)
- Generated locally to avoid EC2 memory constraints
- Includes all frontend assets and backend code
- Session config optimized for AWS EC2 with Nginx reverse proxy
- No MemoryStore dependency for AWS compatibility

### Open Graph Meta Tags for News Sharing
- Created utility: `client/src/lib/meta-tags.ts` for managing dynamic Open Graph tags
- News page integration: Sets meta tags (title, image, description) when articles are viewed
- Featured news integration: Sets meta tags when featured news links are clicked from homepage
- Supported meta tags: `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- When users share news links on Facebook, Twitter, WhatsApp, etc., proper preview with title, image, and description now displays

### Global Scroll-to-Top on Route Changes
- Added `useEffect` to Router component that scrolls page to top on all route changes
- Ensures consistent UX with smooth scrolling behavior
- Removed redundant onClick handlers from footer links
- Works reliably for all page transitions

### Prize Type Handling
- Fixed schema: `insertCompetitionSchema` now accepts `prizeType` field
- Fixed admin form: `handleCreate` now sends `prizeType` to backend
- Display logic: Shows "£amount Prize Pool" for type "pool", plain value for type "other"
- All competitions now properly track prize type (pool vs other/voucher/items)

### Session Configuration
- Updated for AWS EC2 deployment (simplified, no MemoryStore)
- Removed dependency on `memorystore` package
- Session cookies: `secure: false` (temporary until HTTPS), `sameSite: lax`, `httpOnly: true`
- Proxy setting: `true` (behind Nginx/ELB)
