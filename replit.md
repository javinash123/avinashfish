# Peg Slam - UK Fishing Competition Platform

## Overview
Peg Slam is a professional UK-based platform designed for managing fishing competitions. It facilitates angler registration, peg booking, and performance tracking. Organizers can host various match fishing events, leveraging integrated ticketing, GBP payment processing, sponsor management, and a media gallery. The platform also offers live leaderboards and results for spectators, aiming to become the leading online hub for UK fishing competitions.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework:** React 18 with TypeScript and Vite.
- **Routing:** Wouter for client-side routing.
- **Component Library & Styling:** Radix UI primitives with shadcn/ui, Tailwind CSS, custom design tokens, responsive design, dark mode.
- **State Management:** TanStack Query for server state, local React state for UI state.
- **Design System:** New York style variant from shadcn/ui, custom color palette (Deep Water Blue, Lake Green, Slate Grey), Inter and JetBrains Mono typography.
- **Key UI Patterns:** Competition cards, live leaderboards, interactive peg map, sponsor carousel, `react-hook-form` with Zod validation.
- **Image Display:** Public-facing images use `object-cover`, admin previews use `object-contain`.
- **Weight Input:** UK Pounds and Ounces system.

### Backend
- **Server Framework:** Express.js with TypeScript, custom middleware.
- **API Design:** RESTful endpoints, JSON format, session-based authentication.
- **Data Layer:** Drizzle ORM for PostgreSQL (with in-memory storage for development).
- **UK Timezone Support:** `date-fns-tz` for accurate UK timezone handling.
- **Request Size Limit:** Increased body parser limit to 50MB.

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
- **UI Component Libraries:** Radix UI, Tailwind CSS, Lucide React, `react-icons`, `date-fns`.
- **Development Tools:** Vite, esbuild, TypeScript.

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
4. **Latest Build:** peg-slam-build.tar.gz (26MB) - generated Nov 24, 2025

### Environment Variables (Production)
- `NODE_ENV=production`
- `MONGODB_URI=<your-mongodb-connection>`
- `SESSION_SECRET=<secure-random-string>`
- `PORT=5000`
- `ALLOWED_ORIGINS=<comma-separated-domains>`

## Recent Changes (Nov 24, 2025)

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
- Deployment guide: `AWS_DEPLOYMENT_GUIDE.md`

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