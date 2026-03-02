# Wireframes & Application Screenshots

## Overview

This directory contains comprehensive HTML wireframes and mockups for both the Admin Portal and End User Mobile App interfaces.

## Files

### 1. INDEX.html
**Main landing page with overview of all screens**
- Complete feature showcase
- Links to all wireframes
- Technology stack information
- Key features summary

**How to view**: Open `INDEX.html` in any web browser

### 2. ADMIN_DASHBOARD.html
**Admin Portal - Real-Time Reports & Analytics**

**Features Demonstrated:**
- ✅ Real-time metrics panel with live updates
- ✅ Average rating with star visualization (4.32/5.0)
- ✅ Total reviews (12,847) and comments (8,592)
- ✅ Sentiment distribution with animated bars
  - Positive: 68.5%
  - Neutral: 22.3%
  - Negative: 9.2%
- ✅ Advanced filter panel (Time Range, Temple, Region, Category)
- ✅ Four interactive chart types:
  - Rating trend line chart
  - Sentiment distribution pie chart
  - Reviews by temple bar chart
  - Rating distribution histogram
- ✅ Paginated review list with sentiment labels
- ✅ Export functionality (CSV/PDF)
- ✅ Live connection status indicator
- ✅ User profile with role badge (Administrator)

**How to view**: Open `ADMIN_DASHBOARD.html` in any web browser

### 3. END_USER_MOBILE.html
**Mobile App - End User Experience (4 Screens)**

**Screen 1: Home/Temple List**
- Temple cards with images and ratings
- Location information
- Quick explore buttons
- Bottom navigation bar (Home, Search, Favorites, Profile)

**Screen 2: Temple Detail**
- Hero image with temple icon
- Comprehensive temple information
- Historical significance
- Available features (Audio Guide, Virtual Tour, History & Stories)
- Action buttons (Start Tour, Reviews)

**Screen 3: Feedback Form**
- Interactive 5-star rating system
- Temple selection dropdown
- Review text area
- Comments/suggestions field
- Comment type categorization (General, Suggestion, Complaint)
- Submit button

**Screen 4: Virtual Tour**
- Immersive 360° experience mockup
- Audio guide button
- Info button
- Swipe navigation indicators

**How to view**: Open `END_USER_MOBILE.html` in any web browser

## Viewing Instructions

### Option 1: Direct Browser Access
1. Navigate to `docs/wireframes/` directory
2. Double-click any HTML file to open in your default browser
3. Start with `INDEX.html` for the complete overview

### Option 2: Local Server (Recommended)
```bash
# From the project root
cd docs/wireframes
python -m http.server 8000
# Or use any other local server
```
Then open: `http://localhost:8000/INDEX.html`

### Option 3: VS Code Live Server
1. Install "Live Server" extension in VS Code
2. Right-click on `INDEX.html`
3. Select "Open with Live Server"

## Interactive Features

### Admin Portal
- ✨ Animated sentiment bars
- ✨ Pulsing connection status indicator
- ✨ Hover effects on all cards and buttons
- ✨ Responsive layout
- ✨ Realistic data and metrics

### Mobile App
- ✨ Interactive star rating (click to rate)
- ✨ Phone frame with notch design
- ✨ Smooth transitions and hover effects
- ✨ Realistic mobile UI/UX
- ✨ Multiple screen flows

## Design Highlights

### Color Scheme
- **Primary**: Purple gradient (#667eea to #764ba2)
- **Accent**: Coral/Red (#ff6b6b to #ee5a6f)
- **Success**: Green (#4ade80, #22c55e)
- **Warning**: Yellow/Orange (#fbbf24, #f59e0b)
- **Error**: Red (#f87171, #ef4444)

### Typography
- **Font Family**: System fonts (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto)
- **Headings**: 600-700 weight
- **Body**: 400 weight
- **Responsive sizing**: Scales appropriately

### Layout
- **Admin Portal**: Desktop-optimized (1400px max-width)
- **Mobile App**: Mobile-optimized (320px phone frames)
- **Responsive**: Adapts to different screen sizes
- **Grid-based**: Modern CSS Grid layout

## Screen Dimensions

### Admin Portal
- **Container**: 1400px max-width
- **Metrics Grid**: 4 columns (responsive)
- **Charts Grid**: 2 columns (responsive)
- **Review Cards**: Full width with pagination

### Mobile App
- **Phone Frame**: 320px width
- **Screen Height**: 650px
- **Notch**: 150px width, 25px height
- **Bottom Nav**: 60px height

## Data Shown

### Admin Portal Metrics
- Average Rating: 4.32/5.0 (↑ 0.15 from last month)
- Total Reviews: 12,847 (↑ 1,234 this month)
- Total Comments: 8,592 (↑ 892 this month)
- Sentiment: 68.5% Positive, 22.3% Neutral, 9.2% Negative

### Sample Temples
1. **Tirumala Temples** - Andhra Pradesh (4.8★, 3,245 reviews)
2. **Tirupathi Local Temples Tour** - Andhra Pradesh (4.7★, 2,156 reviews)
3. **Meenakshi Amman Temple** - Tamil Nadu (4.7★, 2,891 reviews)

## Browser Compatibility

✅ Chrome/Edge (Recommended)
✅ Firefox
✅ Safari
✅ Opera

**Note**: All wireframes use modern CSS (Grid, Flexbox, Gradients) and should work in all modern browsers.

## Screenshots

To capture screenshots:
1. Open the HTML file in your browser
2. Use browser's built-in screenshot tool or:
   - Windows: Windows + Shift + S
   - Mac: Command + Shift + 4
   - Linux: PrtScn or Screenshot tool

## Next Steps

These wireframes can be used for:
- ✅ Stakeholder presentations
- ✅ Development reference
- ✅ User testing
- ✅ Design documentation
- ✅ Marketing materials

## Notes

- All wireframes are fully self-contained (no external dependencies)
- Interactive elements use vanilla JavaScript
- Responsive design adapts to different screen sizes
- Realistic data and metrics for demonstration
- Production-ready design patterns

## Support

For questions or modifications, refer to:
- Main documentation: `src/dashboard/COMPLETE_IMPLEMENTATION_WITH_TESTS.md`
- Design document: `.kiro/specs/real-time-reports-dashboard/design.md`
- Requirements: `.kiro/specs/real-time-reports-dashboard/requirements.md`
