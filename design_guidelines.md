# Design Guidelines: Peg Slam Fishing Competition Platform

## Design Approach: Reference-Based (Sports/Event Platforms)

**Primary Inspiration:** Strava (community/competition features) + Eventbrite (ticketing/event management) + Athletic.net (leaderboards/results)

**Design Philosophy:** Professional UK fishing platform balancing competitive energy with outdoor authenticity. Clean, data-focused interfaces for live competition tracking, combined with warm, inviting landing pages showcasing the fishing community.

---

## Core Design Elements

### A. Color Palette

**Primary Brand Colors:**
- **Deep Water Blue:** 205 85% 25% (primary brand color, navigation, CTAs)
- **Lake Green:** 165 45% 35% (secondary, accents for success states)
- **Slate Grey:** 210 15% 25% (text, borders, subtle backgrounds)

**Light Mode:**
- Background: 0 0% 98%
- Surface/Cards: 0 0% 100%
- Text Primary: 210 15% 15%
- Text Secondary: 210 10% 45%

**Dark Mode:**
- Background: 210 20% 8%
- Surface/Cards: 210 18% 12%
- Text Primary: 210 5% 95%
- Text Secondary: 210 8% 70%

**Accent Colors:**
- **Gold Medal:** 45 90% 55% (winners, podium placements)
- **Warning Orange:** 25 85% 55% (urgent updates, live indicators)
- **Error Red:** 0 70% 50% (cancellations, critical alerts)

### B. Typography

**Font Families:**
- **Headers/Display:** Inter (700, 600) - modern, clean, excellent readability
- **Body/UI:** Inter (400, 500) - same family for consistency
- **Data/Numbers:** JetBrains Mono (500) - monospace for leaderboard weights, peg numbers

**Scale:**
- Hero/Display: text-6xl to text-7xl (60-72px)
- Page Headers: text-4xl to text-5xl (36-48px)
- Section Headers: text-2xl to text-3xl (24-30px)
- Body Large: text-lg (18px)
- Body: text-base (16px)
- Small/Meta: text-sm (14px)
- Tiny/Labels: text-xs (12px)

### C. Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 8, 12, 16, 24 (p-2, h-8, m-12, py-16, gap-24)

**Grid System:**
- Desktop: max-w-7xl container with px-8
- Content areas: max-w-6xl
- Reading width: max-w-3xl
- Competition cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Leaderboard: Full-width table with max-w-7xl

**Breakpoints Strategy:**
- Mobile-first approach
- Tablet (md:768px): 2-column layouts
- Desktop (lg:1024px): 3-column layouts, sidebar navigation
- Wide (xl:1280px): Enhanced spacing, max content width

### D. Component Library

**Navigation:**
- Sticky top navigation with glass-morphism effect (backdrop-blur-md bg-white/90 dark:bg-slate-900/90)
- Logo left, main nav center, user profile/login right
- Mobile: Hamburger menu with slide-in drawer
- Admin nav: Vertical sidebar with icon + label, collapsible on tablet

**Competition Cards:**
- Elevated cards with subtle shadow (shadow-lg hover:shadow-xl transition)
- Top: Venue image with overlay gradient
- Middle: Competition name, date, peg count
- Bottom: Entry fee, spots remaining, "Book Peg" CTA
- Status badges (Live, Upcoming, Completed) in top-right corner

**Leaderboards:**
- Sticky header row with sort indicators
- Zebra striping (alternate row backgrounds)
- Top 3 positions highlighted with gold/silver/bronze left border
- Peg number in monospace, weight in bold
- Live pulse indicator for real-time updates
- Responsive: Cards on mobile, table on desktop

**Forms & Inputs:**
- Floating labels for all text inputs
- Input groups with icons (search, weight entry)
- Large touch targets (min h-12) for mobile
- Validation states with inline messages
- Multi-step forms with progress indicator

**Buttons:**
- Primary: Solid Deep Water Blue with white text
- Secondary: Outline with transparent background
- Ghost: Text only for tertiary actions
- Sizes: sm (h-9), default (h-11), lg (h-14)
- Icon buttons: Square aspect ratio
- Outline buttons on images: backdrop-blur-sm bg-white/20 border-white/40

**Data Displays:**
- Stat cards: Large number (text-3xl font-bold) with small label below
- Profile cards: Circular avatar (96px), name, club/team, stats grid
- Competition dashboard: Tabbed interface (Details, Participants, Leaderboard, Results)
- Peg map: Interactive SVG with numbered pegs, hover states, assigned angler names

**Modals & Overlays:**
- Centered modal with max-w-2xl
- Backdrop: bg-black/50 backdrop-blur-sm
- Smooth slide-up animation on mobile
- Close button in top-right
- Payment modal: Secure badge, Stripe branding

**Admin-Specific:**
- Data tables with inline edit capabilities
- Bulk action toolbars (sticky at top when items selected)
- Quick filters and search bars above tables
- Weight entry: Quick-access modal with numeric keypad
- Dashboard widgets: 4-column grid on desktop (Entries Today, Revenue, Live Competitions, Pending Approvals)

### E. Imagery & Media

**Hero Images:**
- Large hero on homepage (h-[70vh]): Dramatic fishing scene (angler with catch at golden hour)
- Competition pages: Venue lake photo (h-64) with gradient overlay
- Profile headers: Optional cover photo (h-48)

**Image Strategy:**
- Gallery: Masonry grid layout (Tailwind aspect-ratio utilities)
- Sponsor logos: Contained in cards, max-height constraints, grayscale hover:color
- Venue photos: 16:9 aspect ratio, lazy loading
- Catch photos: Square crops for consistency in galleries

**Placeholder Content:**
- Use fishing-themed illustrations for empty states
- Icon-based placeholders for missing profile photos
- Lake map SVG templates for peg layouts

### F. Special Features

**Live Updates:**
- Pulse animation on "Live" badges (animate-pulse)
- Real-time weight updates with smooth number transitions
- Toast notifications for new leaderboard changes (top-right corner)

**Peg Allocation Visualizer:**
- Lake outline SVG with numbered peg positions
- Color coding: Available (green), Booked (blue), Current User (gold)
- Click to select/deselect pegs
- Tooltip on hover with angler name

**Sponsor Carousel:**
- Auto-scroll with pause on hover
- 6 logos visible on desktop, 3 on tablet, 2 on mobile
- Fade transition between slides
- Grayscale default, color on hover

**Ticket Booking Flow:**
- Step 1: Competition selection (card with details)
- Step 2: Peg selection (interactive map)
- Step 3: Angler details (form)
- Step 4: Payment (Stripe embedded)
- Step 5: Confirmation (QR code, email preview)

---

## Page-Specific Layouts

**Homepage:**
- Hero: Full-width image, centered heading "UK's Premier Fishing Competitions", dual CTAs ("Book a Peg" + "View Leaderboards")
- Upcoming competitions: 3-column card grid
- Live leaderboard preview: Top 5 positions, "View Full Leaderboard" link
- Sponsor carousel
- Newsletter signup footer section

**Competition Page:**
- Venue hero image with overlay info (date, lake, entry fee)
- Tabbed content: Overview | Participants | Leaderboard | Results
- Sidebar: Quick stats (Total Pegs, Entries, Prize Fund), "Book Now" sticky CTA
- Peg map below tabs

**Admin Dashboard:**
- Left sidebar navigation (collapsible)
- Top bar: Breadcrumbs, notifications, profile dropdown
- Main area: 4-column stats cards, then data tables
- Action buttons prominent (Create Competition, Add Weigh-In, etc.)

**Angler Profile (Public):**
- Cover photo area (optional)
- Profile card: Avatar, name, club, bio
- Stats grid: Total Competitions, Wins, Avg Weight, Favorite Venue
- Competition history: Table with expandable rows for details
- Photo gallery of catches

---

## Animations (Minimal Use)

- Card hover: Subtle scale (scale-105) and shadow increase
- Button press: Scale down (active:scale-95)
- Modal entry: Fade + slide-up (duration-200)
- Live indicator: Pulse animation
- Page transitions: None (instant navigation preferred)
- Number updates: Smooth count-up for weights/stats (via JS library)

---

## Mobile Optimizations

- Bottom navigation bar for key actions (Home, Competitions, Leaderboard, Profile)
- Swipeable competition cards
- Large tap targets (min 48px height)
- Simplified tables → cards on mobile
- Sticky "Book Peg" CTA button on competition pages
- Thumb-zone optimization: Key actions in bottom third of screen

---

## Accessibility

- Consistent dark mode with proper contrast ratios (WCAG AA minimum)
- Form inputs maintain dark mode styling (dark:bg-slate-800, dark:border-slate-600)
- Focus indicators on all interactive elements (ring-2 ring-offset-2)
- ARIA labels for icon-only buttons
- Semantic HTML throughout
- Screen reader announcements for live leaderboard updates