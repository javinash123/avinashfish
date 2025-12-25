# Mobile App vs Website - Feature Comparison

## Leaderboard Page

### Website Features:
✅ **Implemented in Mobile:**
- Competition dropdown selector (Live/Completed competitions only)
- Leaderboard table display
- Shows Position, Angler Name, Peg Number, Fish Count, Weight
- Shows Username, Club, Is Team indicator, Team ID
- Live status indicator (badge showing Live/Completed)
- Can click team names to view team details
- Filters to show only Live and Completed competitions

❌ **MISSING in Mobile:**
- No distinction between Live and Completed competitions in the selector
- Fish Count column not displayed (only shows Peg, Fish Count placeholder)
- Username column not shown
- Club column not shown
- No indication which competitions are "Live" vs "Completed" in the selector
- Limited to showing only top 20 entries (website shows all)
- No click-to-view team members feature
- No visual distinction/badge for team entries vs individual entries
- Table headers inconsistent (website shows all columns, mobile shows abbreviated)

---

## Competitions Page

### Website Features:
✅ **Implemented in Mobile:**
- Display competition cards
- Shows Name, Date, Venue, Pegs Available, Entry Fee
- Card images displayed
- "View Details" button/link
- Basic competition information

❌ **MISSING in Mobile:**
- **Search functionality** - No search bar to find competitions by name or venue
- **Status filter dropdown** - Cannot filter by (All/Live/Upcoming/Completed)
- **Prize Pool display** - Not shown on cards
- **Prize Type display** - Not shown on cards
- **Responsive grid layout** - Mobile shows list only
- **Status badge on card** - No visual indicator of competition status
- **Filter/search UI** - No UI elements for filtering

### Recommended Additions:
1. Add search input to search by competition name or venue
2. Add status filter dropdown (All, Live, Upcoming, Completed)
3. Display prize pool on competition card
4. Display prize type on competition card  
5. Show status badge on each card (Live/Upcoming/Completed)
6. Add better visual hierarchy

---

## Competition Details Page

### Website Features:
✅ **Implemented in Mobile:**
- Competition image with status badge
- Tab navigation (Details, Leaderboard, Participants, Teams for team competitions)
- Leaderboard tab with table
- Participants tab with list
- Teams tab with team listings
- Team management (Create, Join, Manage teams)
- Team invite code functionality
- Book/Join button with payment handling
- Leave competition option
- Shows entry fee and prize pool information
- Shows peg allocation (Total/Booked)
- Shows competition date, time, venue, mode (Individual/Team)
- Description section

❌ **MISSING in Mobile:**
- **Peg Map/Visual** - No interactive peg allocation map (website shows PegMap component)
- **Detailed descriptions with formatting** - Website shows rich text descriptions, mobile may not render HTML properly
- **Full participant details** - May not show all participant information
- **Prize breakdown** - No detailed prize structure display
- **Rules/Info sections** - No way to display additional competition rules/info
- **Peg allocation visual representation** - No map showing which pegs are booked
- **Full competition description** - Description field might be truncated
- **Payment history** - No history of payments/bookings shown
- **Edit/Manage buttons for admins** - No admin functionality visible
- **Download/Export options** - No ability to export leaderboard or participant lists
- **Booking history** - No record of previous bookings for user
- **Refund/Cancellation policy** - Not displayed

### Detailed Tab Comparison:

#### Details Tab (Website has more):
Website shows:
- Competition hero image
- Status badge
- Prize information (pool, type, breakdown)
- Date & time
- Venue information
- Number of pegs (total, booked, available)
- Entry fee
- Description (full HTML content)
- Call-to-action buttons (Book Peg, View Leaderboard)
- Peg map visualization

Mobile shows:
- Competition image
- Basic info (Date, Venue, Pegs, Entry Fee)
- Status
- Team management UI
- Book button

#### Leaderboard Tab (Website shows more details):
Website shows:
- All leaderboard entries (not limited)
- More columns of data
- Better formatting
- Clickable team names

Mobile shows:
- Limited to 20 entries
- Basic columns
- Team click support

#### Participants Tab (Similar):
Both show participant lists, mobile may have less detail

#### Teams Tab (Similar):
Both show team listings, but mobile shows teams selector first

---

## Missing Features Summary by Priority

### HIGH PRIORITY:
1. **Competitions Search** - Search by name/venue in Competitions page
2. **Competitions Status Filter** - Filter by Live/Upcoming/Completed in Competitions page  
3. **Prize Information** - Show prize pool and type on competition cards
4. **Peg Map/Visualization** - Visual representation of peg allocation in competition details
5. **Full Leaderboard** - Show all entries, not just top 20

### MEDIUM PRIORITY:
6. **Status Badges** - Visual status indicators on competition cards and selector
7. **Username Display** - Show username in leaderboard
8. **Club Information** - Show club in leaderboard
9. **Fish Count Display** - Properly show fish count in leaderboard table
10. **Rich Text Descriptions** - Properly render HTML descriptions in competition details

### LOW PRIORITY:
11. **Export/Download Options** - Download leaderboard or participant lists
12. **Payment History** - Show booking/payment history
13. **Admin Features** - Edit/manage competitions
14. **Refund Policy** - Display cancellation/refund information
15. **Booking History** - Show user's competition booking history

---

## Implementation Recommendations

### Phase 1 (Critical):
- Add search functionality to Competitions page
- Add status filter to Competitions page
- Display prize information on competition cards
- Display status badges
- Show all leaderboard entries (remove 20-entry limit)

### Phase 2 (Important):
- Add Peg Map visualization to Competition Details
- Improve leaderboard columns (username, club, fish count)
- Improve status indicators in competition selector
- Better HTML rendering for descriptions

### Phase 3 (Enhancement):
- Add export/download features
- Add payment history
- Add admin features for staff
- Better visual hierarchy and styling
