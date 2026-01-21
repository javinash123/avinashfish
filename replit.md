# Peg Slam - UK Fishing Competitions Platform

## Overview

Peg Slam is a full-stack web application for managing UK fishing competitions. The platform enables anglers to register, enter matches, and track results while allowing organizers to manage competitions with peg allocations, live leaderboards, and payment processing. The system supports both individual and team-based competitions with qualifier-to-final progression flows.

Key capabilities:
- Competition management with peg booking system
- Angler profiles with competition history
- Live leaderboards and weigh-in tracking
- Stripe payment integration for entry fees
- Admin panel for organizers
- Mobile app (React Native/Expo) for on-the-go access

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with esbuild for production bundling
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (dark mode default)
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript compiled with tsx (development) and esbuild (production)
- **API Design**: RESTful endpoints prefixed with `/api`
- **Session Management**: express-session with MemoryStore (development) or production-ready store
- **File Uploads**: Multer for handling multipart form data
- **Image Processing**: Sharp for thumbnail generation and optimization

### Data Storage
- **Primary Database**: MongoDB via MongoClient
- **ORM/Schema**: Drizzle ORM with PostgreSQL schema definitions (used for type generation and potential PostgreSQL migration)
- **Schema Location**: `shared/schema.ts` contains all data models with Zod validation schemas
- **Connection**: Neon serverless PostgreSQL driver configured but MongoDB is the active storage layer

### Authentication & Authorization
- **User Authentication**: Session-based authentication with password hashing
- **Admin Authentication**: Separate admin/staff login system with role-based access
- **Password Reset**: Token-based reset flow with email verification via Resend
- **Session Storage**: Server-side sessions with configurable stores

### Mobile Application
- **Framework**: React Native with Expo SDK 50
- **Platform Support**: iOS, Android, and Web
- **State**: AsyncStorage for local persistence
- **API Communication**: Axios with credential handling

## External Dependencies

### Payment Processing
- **Stripe**: Payment processing for competition entry fees
  - `@stripe/stripe-js` and `@stripe/react-stripe-js` for frontend
  - `stripe` package for backend webhook handling
  - Requires `STRIPE_SECRET_KEY` and `VITE_STRIPE_PUBLIC_KEY` environment variables

### Email Services
- **Resend**: Transactional email for password resets, verification, and contact forms
  - Configured via `RESEND_API_KEY` environment variable
  - Fallback to Replit connector system if available

### Database
- **MongoDB**: Primary data storage
  - Requires `MONGODB_URI` environment variable
  - Collections: users, admins, competitions, teams, payments, etc.
- **Neon PostgreSQL**: Configured via Drizzle but MongoDB is active
  - `DATABASE_URL` used for Drizzle schema management

### Cloud Infrastructure
- **Deployment Target**: AWS EC2 with Amazon Linux
- **Tunnel Service**: ngrok via `@expo/ngrok` for mobile development
- **Static Assets**: Served from `attached_assets/uploads/` directory

### Development Tools
- **TypeScript**: Full type safety across frontend, backend, and shared code
- **Path Aliases**: `@/` for client source, `@shared/` for shared modules
- **Build Scripts**: Custom build scripts in `scripts/` directory with memory optimization for AWS