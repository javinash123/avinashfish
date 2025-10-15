# Peg Slam - UK Fishing Competition Platform

## Overview

Peg Slam is a professional UK-based platform for managing fishing competitions. It enables anglers to register, book pegs, and track their performance across various match fishing events. Organizers can run qualifiers, semi-finals, and finals with peg allocation systems, while spectators can view live leaderboards and results. The platform includes integrated ticketing and payment processing in GBP, sponsor management, and a comprehensive media gallery.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18 with TypeScript using Vite as the build tool
- Single Page Application (SPA) with client-side routing via Wouter
- Component library based on Radix UI primitives with shadcn/ui styling system
- Tailwind CSS for styling with custom design tokens for fishing/outdoor theme

**State Management:**
- TanStack Query (React Query) for server state management
- Local React state with hooks for UI state
- Custom query client configuration with credential-based API requests

**Design System:**
- New York style variant from shadcn/ui
- Custom color palette: Deep Water Blue (primary), Lake Green (secondary), Slate Grey (neutral)
- Typography: Inter for UI/body text, JetBrains Mono for data/numbers
- Responsive design with mobile-first approach
- Dark mode support with theme provider

**Key UI Patterns:**
- Competition cards with status badges (upcoming/live/completed)
- Live leaderboard tables with real-time updates
- Interactive peg map visualization for venue layouts
- Sponsor carousel for partner promotion
- Comprehensive form handling with react-hook-form and Zod validation

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript
- HTTP-only server handling API routes and serving static assets
- Custom middleware for request logging and error handling

**API Design:**
- RESTful endpoints under `/api` prefix
- Payment processing endpoint for Stripe integration
- Session-based authentication (infrastructure prepared)
- JSON request/response format

**Data Layer:**
- In-memory storage implementation (MemStorage class) for development
- Interface-based storage abstraction (IStorage) for easy database migration
- Drizzle ORM configured for PostgreSQL (production-ready)
- Schema defined with user authentication foundation

### External Dependencies

**Payment Processing:**
- Stripe integration for competition bookings and ticket sales
- Payment intents API for secure GBP transactions
- Stripe Elements for frontend payment forms
- Server-side pricing validation to prevent tampering

**Database:**
- PostgreSQL via Neon serverless driver
- WebSocket-based connection pooling
- Drizzle ORM for type-safe database operations
- Migration system configured in drizzle.config.ts

**UI Component Libraries:**
- Radix UI primitives for accessible components (accordion, dialog, dropdown, etc.)
- Tailwind CSS for utility-first styling
- Lucide React for icons
- react-icons for social media icons
- date-fns for date manipulation

**Development Tools:**
- Vite for hot module replacement and fast builds
- esbuild for production server bundling
- TypeScript for type safety across the stack
- Replit-specific plugins for development experience

**Key Integrations Planned:**
- Social authentication (OAuth providers mentioned in specs)
- Email service for booking confirmations and notifications
- Image storage for gallery and profile pictures
- Live scoring/weigh-in updates (real-time infrastructure needed)

### Admin Panel

**Complete Admin Management System:**
- Dashboard with revenue stats, active competitions, total anglers, and booking metrics
- Competition Management: Full CRUD operations, peg assignment, weigh-in entry, status filters
- Angler Management: User approval/blocking, search functionality, profile viewing
- Sponsor Management: Tier-based sponsor system (Platinum/Gold/Silver/Bronze), logo and social media links
- News Management: Create/edit/delete articles, match reports, and announcements with category filtering
- Gallery Management: Upload and manage event photos and catch images with metadata
- Settings: Platform configuration, payment settings, notification preferences, about content

**Admin Authentication:**
- Secure login system with email and password
- Admin credentials stored in database (in-memory for development)
- Session-based authentication with automatic route protection
- Profile management page for updating admin details and password
- Default admin account: admin@pegslam.co.uk / admin123
- Logout functionality with session cleanup

### Hero Slider & Branding

**Dynamic Hero Slider:**
- Auto-playing carousel with smooth transitions using embla-carousel-react
- Dark overlay gradient for optimal text readability over any image
- Displays behind the "UK's Premier Fishing Competitions" banner
- Default image loaded from Freepik fishing competition illustration
- Admin-managed with active/inactive status for each slide

**Logo Management:**
- Site logo displayed in header navigation
- Fully manageable through admin panel
- Default logo loaded from specified Google image URL
- Supports any image format via URL input

**Admin Controls:**
- "Slider & Logo" section in admin panel sidebar
- Add/remove slider images via URL input
- Toggle slider images active/inactive with switch control
- Update site logo with real-time preview
- Separate endpoints for admin (all images) vs public (active only)

### User Authentication System

**Angler (User) Authentication:**
- Complete registration system with email, username, password, firstName, lastName, and optional club
- Secure login/logout functionality with session-based authentication
- Profile page requiring authentication showing user details and competition history
- User status management: active, pending (awaiting approval), blocked
- Password hashing and validation
- Separate authentication from admin system

**User Profile Features:**
- Displays personal information (name, username, email, club, bio, location)
- Fishing preferences (favorite method, favorite species)
- Competition statistics (matches, wins, best catch - currently placeholders)
- Competition history tab (ready for future integration)
- Upcoming competitions tab for registered events

**Admin Angler Management:**
- View all registered anglers with search and filtering
- Approve pending registrations
- Block/unblock users
- View angler profiles
- Send emails to anglers
- Real-time status updates with backend integration

**Frontend Integration:**
- useAuth hook for checking authentication state across the app
- Header shows login/logout based on authentication status
- User dropdown menu with profile link and logout option
- Protected routes redirect to login when unauthenticated
- React Query for state management and cache invalidation

**Backend API Endpoints:**
- POST /api/user/register - Register new angler
- POST /api/user/login - Login angler
- POST /api/user/logout - Logout angler
- GET /api/user/me - Get current authenticated user
- GET /api/admin/anglers - Get all anglers (admin only)
- PATCH /api/admin/anglers/:id/status - Update angler status (admin only)

**Recent Updates (October 10, 2025):**
- **User Authentication System:** Implemented complete angler registration, login, and profile management
- **User Schema Update:** Added comprehensive user fields (firstName, lastName, username, club, bio, fishing preferences, location, status)
- **Admin Angler Management:** Connected admin anglers page to backend with real-time status updates
- **Profile Protection:** Profile page now requires authentication and displays real user data
- **Header Authentication:** Dynamic header showing login/logout based on auth state with user dropdown
- **Competition Participation System:** Anglers can join/leave competitions with peg assignment and capacity management
- **Participant & Leaderboard Schemas:** Added database schemas for tracking participants and competition standings
- **Dynamic Competition Details:** Competition detail page now fully dynamic with all data from API (no static content)
- **TanStack Query Fix:** Fixed critical bug where query keys must use full endpoint path as single segment instead of array segments
- **Auto-Approval System:** New angler registrations are now auto-approved (status defaults to "active" instead of "pending") - Fixed in storage layer
- **Admin Angler Profile Dialog:** Admins can view angler details in a dialog within the admin panel (no longer redirects to public profile page)
- **Slider & Logo Management Fix:** Fixed API request parameter order issues in slider and logo management (method, url, data order corrected)
- **Competition Rules Removed:** Cleaned up competition details page by removing rules section
- **Profile Competitions Display:** User profile now shows joined competitions in "Upcoming Events" tab with live data from API
- **User Participation API:** Added GET /api/user/participations endpoint to fetch user's joined competitions
- **Dynamic Statistics:** Profile "Total Matches" stat now displays actual count of joined competitions
- **Competition Status Logic Fix:** Admin panel Pegs/Weigh-in buttons now use computed status (getCompetitionStatus) instead of database field for accurate state detection
- **Profile Navigation Fix:** Fixed "View Details" link in user profile from /competitions/ to /competition/ (singular) to match correct route
- **Clickable Player Names:** Player names in leaderboard and participants tabs now clickable and link to public profiles using username
- **API Enhancement:** Added username field to participants and leaderboard API responses for profile navigation
- Added secure admin authentication with login/logout functionality
- Added admin profile management page with password change capability
- Added News management with full CRUD operations for articles, match reports, and announcements
- Added Gallery management for event photos and catch images with category filtering
- Added dynamic hero slider with embla-carousel integration and dark overlay
- Added logo management system with admin panel controls
- Implemented slider_images and site_settings database tables
- Created admin-only API endpoint to manage inactive slider images
- All admin pages now fully functional with proper navigation and data management
- Implemented route protection to ensure only authenticated admins can access admin panel
- Removed Google sign-in option from registration and login pages

## October 10, 2025 - Latest User Experience Enhancements

**Homepage Leaderboard Improvements:**
- Added dropdown selector for multiple live competitions on homepage leaderboard
- Automatically shows "No live competitions" message when none exist
- Smart state management with useEffect to prevent render loops
- Validates selection and auto-resets when competitions change/disappear
- Properly handles all edge cases (no competitions, competitions appearing/disappearing)

**Admin Panel Enhancements:**
- **Angler Details Popup:** Shows real competition statistics (total matches, wins, best catch) via `/api/admin/anglers/:id/stats` endpoint
- **Settings Menu:** Hidden from navigation (commented out in code for easy re-enabling)
- **Dynamic Dashboard:** All statistics now pull from backend APIs instead of static values:
  - Total Revenue: Calculated from this month's entry fees
  - Active Competitions: Live count of live + upcoming competitions
  - Total Anglers: Real count of registered users
  - Bookings Today: Count of today's participations
  - Live Competitions Section: Shows actual live competitions
  - Recent Bookings: Displays real participation data
  - Upcoming Competitions: Shows real upcoming competitions

**New API Endpoints:**
- GET /api/admin/anglers/:id/stats - Fetch individual angler competition statistics
- GET /api/admin/dashboard/stats - Get dashboard statistics (revenue, competitions, anglers, bookings)
- GET /api/admin/recent-participations - Get recent participation/booking data

**Database Updates:**
- Added getAllParticipants() method to storage interface for fetching all participants