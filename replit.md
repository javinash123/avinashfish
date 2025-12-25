# Peg Slam - UK Fishing Competition Platform

## Overview
Peg Slam is a professional UK-based platform for managing fishing competitions. It supports angler registration, peg booking, and performance tracking. Organizers can host various match fishing events with integrated ticketing, GBP payment processing, sponsor management, and a media gallery. The platform also provides live leaderboards and results for spectators, aiming to be the leading online hub for UK fishing competitions.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Web Frontend
- **Framework:** React 18 with TypeScript and Vite.
- **Routing:** Wouter.
- **Component Library & Styling:** Radix UI primitives with shadcn/ui, Tailwind CSS, custom design tokens, responsive design, dark mode.
- **State Management:** TanStack Query for server state, local React state for UI state.
- **Design System:** New York style variant (shadcn/ui), custom color palette (Deep Water Blue, Lake Green, Slate Grey), Inter and JetBrains Mono typography.
- **Key UI Patterns:** Competition cards, live leaderboards, interactive peg map, sponsor carousel, `react-hook-form` with Zod validation.
- **Weight Input:** UK Pounds and Ounces system.
- **Audio Player:** Live radio stream player on homepage (https://data.webstreamer.co.uk:8030/radio.mp3) with play/pause controls and visual feedback.
- **YouTube Section:** Homepage displays latest YouTube videos from admin-managed collection with clickable cards linking to YouTube.

### Mobile Frontend (React Native)
- **Framework:** Expo (React Native).
- **Features:** Replicates all public pages from the web platform.
- **Authentication:** Email/password login, registration, password reset using AsyncStorage for user data.
- **State Management:** AsyncStorage for user data, Axios for API calls.
- **UI:** React Native native components, dark theme matching website.
- **Competition Booking:** Supports individual and team competition booking flows (create team, join team via invite code, captain-only payment). Free competitions book directly, paid competitions redirect to website for Stripe checkout.
- **Gallery Upload:** Allows users to upload images to their personal gallery.
- **Team Member Modal:** Displays team details and members for team competitions.
- **Sponsor Details Modal:** Provides detailed sponsor information and external links.

### Backend
- **Server Framework:** Express.js with TypeScript.
- **API Design:** RESTful endpoints, JSON format, session-based authentication.
- **Data Layer:** Drizzle ORM for PostgreSQL (development), MongoDB (production).
- **Database:** MongoDB (production), PostgreSQL via Neon (development).
- **UK Timezone Support:** `date-fns-tz` for accurate UK timezone handling.

### Admin Panel
- **Management:** Dashboard for metrics, CRUD operations for competitions, anglers, sponsors, news, gallery, and YouTube videos.
- **Authentication:** Secure login, session-based, route protection, role-based access control (Admin/Manager).
- **Content Management:** Rich text editor (`react-quill`), dynamic hero slider, logo management.
- **Competition Angler Management:** Add/remove participants, peg assignment, capacity management, flexible team peg assignment modes.
- **Team Management:** API routes and UI for creating, listing, getting details, adding/removing anglers from teams.
- **YouTube Videos:** Full CRUD management for YouTube videos displayed on homepage with thumbnail previews, display order, and active/inactive toggles.

### User Authentication
- **Angler Authentication:** Registration (email verification), login/logout, session-based.
- **User Profile:** Personal info, fishing preferences, competition stats, upcoming competitions, editable bio.
- **User Gallery:** Anglers can upload and manage personal photo galleries.
- **Admin Angler Management:** View, search, filter, approve, block users.
- **Competition Participation:** Join/leave competitions with peg assignment.
- **Password Reset:** Functionality for forgotten passwords.

### Production Deployment
- **AWS EC2 Setup:** Optimized for Amazon Linux 2, Nginx reverse proxy.
- **Build Process:** Local generation of production builds (frontend + backend) into a tarball for EC2 deployment.
- **Session Management:** Simplified session config for AWS, in-memory session storage (scalable to MongoDB).

## External Dependencies
- **Payment Processing:** Stripe (Payment Intents API, Stripe Elements).
- **Database:** MongoDB, PostgreSQL (via Neon).
- **Email Service:** Resend.
- **Timezone Support:** `date-fns-tz`.
- **UI Component Libraries:** Radix UI, Tailwind CSS, Lucide React, `react-icons`, `date-fns`.
- **Development Tools:** Vite, esbuild, TypeScript, Expo.