# Peg Slam - UK Fishing Competition Platform

## Overview

Peg Slam is a professional UK-based platform for fishing competitions. The application enables anglers to register, manage profiles, and enter matches while allowing organisers to run qualifiers, semi-finals, and finals with peg allocations. The platform supports live leaderboards, direct ticket bookings with Stripe payments in GBP, and sponsor promotion.

Key features include:
- Competition management with peg allocation system (individual and team modes)
- Angler registration and profile management
- Live leaderboard and weigh-in tracking
- Integrated payment processing via Stripe
- Admin panel for competition and content management
- Sponsor and venue promotion
- Mobile app companion (React Native/Expo)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Build Tool**: Vite with esbuild for production bundling
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **Session Management**: express-session with MemoryStore
- **File Uploads**: Multer for handling multipart form data
- **Image Processing**: Sharp for generating competition thumbnails in multiple sizes

### Data Storage
- **Primary Database**: MongoDB (production on AWS EC2)
- **ORM/Schema**: Drizzle ORM with PostgreSQL schema definitions (used for type generation)
- **Storage Abstraction**: IStorage interface allowing swappable backends (MongoDBStorage, MemStorage)

### Authentication
- Session-based authentication for both users (anglers) and admin/staff
- Password reset flow with email verification tokens
- Email verification for new user registrations
- Separate admin and staff role systems

### API Structure
- RESTful API endpoints prefixed with `/api`
- Routes defined in `server/routes.ts`
- Shared schema types between frontend and backend in `shared/schema.ts`
- Zod schemas for request validation

### Mobile App
- Located in `PegSlamMobile/` directory
- Built with React Native and Expo SDK 54
- Connects to the main API at pegslam.com
- Supports web, iOS, and Android platforms

## External Dependencies

### Payment Processing
- **Stripe**: Primary payment processor for competition entries
  - React Stripe.js for frontend integration
  - Stripe Node.js SDK for backend processing
  - Supports GBP currency for UK market

### Email Services
- **Resend**: Email delivery for password resets, verification, and contact forms
  - Supports both direct API key configuration and Replit connector

### Database
- **MongoDB**: Document database for all application data
  - Uses native MongoDB driver (not Mongoose)
  - Connection via `MONGODB_URI` environment variable

### Image Processing
- **Sharp**: Server-side image manipulation for generating competition thumbnails

### Cloud Infrastructure
- **AWS EC2**: Production deployment target (Amazon Linux)
- **Neon PostgreSQL**: Available via Drizzle configuration (may not be actively used)

### Required Environment Variables
- `MONGODB_URI`: MongoDB connection string
- `SESSION_SECRET`: Secret for session encryption
- `STRIPE_SECRET_KEY`: Stripe API secret key (sk_live_* for production)
- `VITE_STRIPE_PUBLIC_KEY`: Stripe publishable key (pk_live_* for production)
- `RESEND_API_KEY`: Email service API key
- `RESEND_FROM_EMAIL`: Sender email address