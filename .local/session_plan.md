# Bug Fix Session Plan

## Objective
Fix all 13 bugs from the PegSlam tracker.

## Status: ALL COMPLETED

### T1: User deletion counter not updating (Bug #1) - FIXED
- **Backend**: `server/routes.ts` line 3412-3419 - DELETE /api/admin/participants/:id decrements `pegsBooked` after deletion
- **Frontend**: `client/src/pages/admin-competitions.tsx` line 581-590 - onSuccess updates local `selectedCompetition` state so counter refreshes without page reload
- **Verified**: Admin login works (curl test confirmed), counter logic is correct

### T2: Manual add users shows paid (Bug #2) - FIXED
- **Backend**: `server/routes.ts` line 3386 - After adding participant via admin, calls `updateParticipantPaymentStatus(participant.id, "not_paid")`
- **Verified**: Code confirmed in place

### T3: Sponsor weight calculation - SKIPPED per user request

### T4: Stripe payment not reflecting (Bug #4) - FIXED
- **Backend**: `server/routes.ts` line 539-788 - confirm-payment-and-join endpoint sets `paymentStatus: "succeeded"` after successful Stripe payment
- **Frontend**: `client/src/pages/admin-competitions.tsx` line 2548, 2573-2580 - Added "Payment" column to participants table with Badge showing "Paid" (green) or "Not Paid" (gray)
- **Verified**: Payment status now visible in admin UI

### T5: Slider size (Bug #5) - FIXED
- **File**: `client/src/pages/admin-slider.tsx` line 253-254 - Shows "Recommended size: 1920x600px (desktop) or 768x400px (mobile)" below upload field
- **Verified**: Text present in admin slider page

### T6: Fish image upload in admin (Bug #6) - FIXED
- **Schema**: `shared/schema.ts` line 499 - `fishImageUrl: text("fish_image_url")` in leaderboard entries
- **Backend**: `server/routes.ts` line 4248-4252, 4278-4280 - Accepts `fishPhotoUrl` and maps to `fishImageUrl`
- **Frontend**: `client/src/pages/admin-competitions.tsx` line 149-150, 672-686, 845-848, 1033-1043, 2395-2399 - Full fish photo upload flow with preview, upload, and "Photo" link display in entries
- **Verified**: Code present for upload, preview, and display

### T7: Contact email (Bug #7) - FIXED
- **File**: `server/email.ts` line 150 - `const contactRecipient = process.env.CONTACT_EMAIL || 'Ian.justo@pegslam.com'`
- **Verified**: Default email set correctly

### T8: Admin login (Bug #8) - FIXED & VERIFIED
- **Backend**: `server/routes.ts` line 101-162 - Supports both legacy admin table and new staff table, sets both session keys
- **Frontend**: `client/src/pages/admin-login.tsx` - Proper form with email/password, redirects to /admin on success
- **Verified**: curl test returned `{"id":"...","email":"admin@pegslam.co.uk","firstName":"Admin","lastName":"User","role":"admin"}` - login successful

### T9: Sponsor link prefixed with pegslam.com (Bug #9) - FIXED
- **File**: `client/src/pages/sponsors.tsx` line 307 - Uses `sponsor.website.startsWith('http') ? sponsor.website : 'https://' + sponsor.website` - no pegslam.com prefix
- **Verified**: Code correctly detects absolute URLs

### T10: Replace Twitter with TikTok (Bug #10) - FIXED
- **Footer**: `client/src/components/footer.tsx` line 3, 47-51 - Uses `SiTiktok`, label "TikTok", href `https://www.tiktok.com/@peg.slam`
- **Sponsor slider**: `client/src/components/sponsor-logo-slider.tsx` line 13, 152-157 - Uses `SiTiktok`
- **Admin sponsors**: `client/src/pages/admin-sponsors.tsx` line 565-568, 704-707 - Placeholder "TikTok" for both add and edit dialogs
- **Verified**: All three files updated

### T11: Phone number mandatory (Bug #11) - FIXED
- **Schema**: `shared/schema.ts` line 55 - `mobileNumber: z.string().min(1, "Mobile number is required")` in insertUserSchema
- **Register**: `client/src/pages/register.tsx` line 169-177 - Required field with `required` attribute
- **Edit profile**: `client/src/components/edit-profile-dialog.tsx` line 234-242 - Label shows red asterisk (`<span className="text-destructive">*</span>`), input has `required` attribute
- **Verified**: Mobile number is mandatory in registration and profile edit

### T12: Gallery UI improvement (Bug #12) - FIXED
- **File**: `client/src/pages/gallery.tsx` line 99-155 - CSS columns masonry grid (`columns-1 md:columns-2 lg:columns-3 xl:columns-4`), `break-inside-avoid`, hover effects, badge overlays, lightbox dialog
- **Verified**: Modern masonry layout with proper spacing and interactions

### T13: Leaderboard text overflow (Bug #13) - FIXED
- **File**: `client/src/components/leaderboard-table.tsx` line 143 - `min-w-[600px] table-fixed` for horizontal scroll on small screens
- **Responsive**: `sm:` prefixes throughout (e.g., `sm:h-10 sm:w-10`, `sm:text-base`, `sm:block`), `line-clamp-2` for names, `truncate` for club text
- **Verified**: Table is fully responsive with proper text handling
