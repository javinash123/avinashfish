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
*   **User Profile Features:** Displays personal info, fishing preferences, competition stats, upcoming competitions.
*   **Admin Angler Management:** View, search, filter, approve, block users; view profiles and send emails.
*   **Competition Participation:** Anglers can join/leave competitions with peg assignment and capacity management.

## External Dependencies

*   **Payment Processing:** Stripe for ticketing and bookings (Payment Intents API, Stripe Elements).
*   **Database:** PostgreSQL via Neon serverless driver, Drizzle ORM.
*   **UI Component Libraries:** Radix UI, Tailwind CSS, Lucide React, react-icons, date-fns.
*   **Development Tools:** Vite, esbuild, TypeScript, Replit-specific plugins.