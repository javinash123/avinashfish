# Peg Slam - UK Fishing Competition Platform

## Overview

Peg Slam is a professional UK-based platform for managing fishing competitions, enabling anglers to register, book pegs, and track performance. Organizers can run various match fishing events with integrated ticketing, payment processing in GBP, sponsor management, and a media gallery. The platform also provides live leaderboards and results for spectators.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

*   **Framework & Build System:** React 18 with TypeScript, Vite, Wouter for client-side routing.
*   **Component Library & Styling:** Radix UI primitives with shadcn/ui styling, Tailwind CSS, custom design tokens, responsive design, and dark mode support.
*   **State Management:** TanStack Query for server state, local React state for UI state.
*   **Design System:** New York style variant from shadcn/ui, custom color palette (Deep Water Blue, Lake Green, Slate Grey), Inter and JetBrains Mono typography.
*   **Key UI Patterns:** Competition cards, live leaderboards, interactive peg map, sponsor carousel, react-hook-form with Zod validation.

### Backend Architecture

*   **Server Framework:** Express.js with TypeScript, custom middleware for logging and error handling.
*   **API Design:** RESTful endpoints, JSON format, session-based authentication.
*   **Data Layer:** In-memory storage for development, interface-based storage abstraction, Drizzle ORM for PostgreSQL.

### Admin Panel

*   **Comprehensive Management:** Dashboard with revenue/booking metrics, CRUD for competitions, anglers, sponsors, news, and gallery.
*   **Admin Authentication:** Secure login (email/password), session-based, route protection, default admin account (admin@pegslam.co.uk / admin123).
*   **Content Management:** Rich text editor (react-quill) for news, dynamic hero slider (embla-carousel-react), and logo management with admin controls.

### User Authentication System

*   **Angler Authentication:** Registration (email, username, password, names, club), secure login/logout, session-based, profile page with user details and competition history.
*   **User Profile Features:** Displays personal info, fishing preferences, competition stats, upcoming competitions. Anglers can edit their bio, club, location, favourite method, and favourite species through an edit profile dialog.
*   **User Gallery:** Anglers can upload and manage personal photo galleries on their profiles. Features include photo URL upload with optional captions, grid display of photos, and delete functionality with ownership verification.
*   **Admin Angler Management:** View, search, filter, approve, block users; view profiles and send emails.
*   **Competition Participation:** Anglers can join/leave competitions with peg assignment and capacity management.

## Recent Changes

### October 28, 2025 - Competition Angler Management
*   **Admin Competition Anglers:** Added "Anglers" button to each competition in admin panel for comprehensive participant management.
*   **Participant Dialog:** New dialog displays all anglers enrolled in a competition with details (name, club, peg assignment, join date).
*   **Add Participants:** Admin can add any existing angler to a competition via dropdown selector (filters out already-participating anglers).
*   **Remove Participants:** Admin can remove anglers from competitions with confirmation dialog and proper pegsBooked decrement.
*   **Backend API Routes:** 
    - POST /api/admin/competitions/:id/participants - Add participant with validation
    - DELETE /api/admin/participants/:id - Remove participant with proper cleanup
*   **Storage Layer:** Added deleteParticipant method to IStorage interface and MemStorage implementation.
*   **Cache Management:** Proper React Query cache invalidation ensures real-time UI updates across all admin pages.
*   **Files Modified:** server/routes.ts, server/storage.ts, client/src/pages/admin-competitions.tsx

### October 28, 2025 - Brand Color Update, Weight Precision & Mobile Enhancements
*   **Primary Color Update:** Changed primary brand color from light green (hsl(165 75% 45%)) to dark green (hsl(152 60% 30%)) to better match logo branding and provide a more professional appearance across all buttons, badges, and interactive elements.
*   **Weight Input Precision:** Enhanced admin panel weigh-in functionality to accept weights with up to 3 decimal places (step="0.001") for more accurate competition results (e.g., 12.345 lbs).
*   **Mobile Responsiveness Improvements:**
    - About page: Made statistics grid more responsive with smaller text and tighter spacing on mobile devices
    - News page: Increased dialog max-height from 80vh to 90vh for better article viewing on mobile
    - Competition details: Added responsive padding to tabs (px-2 sm:px-4) to prevent cramping on small screens
*   **Files Modified:** client/src/index.css, client/src/pages/admin-competitions.tsx, client/src/pages/about.tsx, client/src/pages/news.tsx, client/src/pages/competition-details.tsx

### October 26, 2025 - Image Display Optimization
*   **Website Image Display:** All images on website pages now use `object-cover` CSS to fill available canvas space while maintaining aspect ratio:
    - Homepage hero slider fills entire viewport width and height
    - News article cards and detail views fill container completely
    - Gallery photo cards and detail views fill container completely
    - Competition cards and detail images fill container completely
*   **Admin Panel Images:** Admin panel image previews use `object-contain` CSS to show complete images without cropping (useful for preview/verification purposes)
*   **Implementation Details:** Changed from `object-contain` (which shows full image with letterboxing) to `object-cover` (which fills space by cropping edges as needed) for all public-facing website images to provide better visual presentation

### October 22, 2025 - UK Timezone Support & Weight Labels
*   **Weight Display:** Added "(lbs)" suffix to all weight column headers in leaderboards and profile statistics for clarity.
*   **UK Timezone Handling:** Implemented proper UK timezone (Europe/London) support using date-fns-tz for accurate competition status calculation.
*   **Shared Timezone Utility:** Created `client/src/lib/uk-timezone.ts` with centralized functions:
    - `getUKNow()`: Returns current date/time in UK timezone
    - `toUKDateTime(date, time)`: Converts date/time strings to UK timezone Date objects
    - `getCompetitionStatus(competition)`: Calculates competition status (upcoming/live/completed) based on UK time
*   **Multi-Day Competition Support:** Fixed critical bug where multi-day competitions without explicit end times were ending prematurely. Now properly handles all edge cases:
    - endDate + endTime: Uses specified end date and time
    - endDate only: Uses end date at 23:59
    - endTime only: Uses start date with end time
    - Neither: Uses start date at 23:59
*   **Code Consolidation:** Removed duplicate `getCompetitionStatus` functions from all pages (home, competitions, admin-competitions, profile) - all now use shared utility.

## External Dependencies

*   **Payment Processing:** Stripe for ticketing and bookings (Payment Intents API, Stripe Elements).
*   **Database:** PostgreSQL via Neon serverless driver, Drizzle ORM.
*   **Timezone Support:** date-fns-tz for UK timezone handling (Europe/London).
*   **UI Component Libraries:** Radix UI, Tailwind CSS, Lucide React, react-icons, date-fns.
*   **Development Tools:** Vite, esbuild, TypeScript, Replit-specific plugins.