# UI/UX Wireframes - Sanaathana Aalaya Charithra

Complete visual guide for Mobile App and Admin Portal interfaces.

**Last Updated**: March 3, 2026  
**Version**: 1.0  
**Status**: Design Documentation

---

## Table of Contents

1. [Mobile App Wireframes](#mobile-app-wireframes)
2. [Admin Portal Wireframes](#admin-portal-wireframes)
3. [Design System](#design-system)
4. [User Flows](#user-flows)
5. [Accessibility Guidelines](#accessibility-guidelines)

---

## Mobile App Wireframes

### 1. Splash Screen
```
┌─────────────────────────────┐
│                             │
│                             │
│      [Temple Logo]          │
│                             │
│   Sanaathana Aalaya         │
│      Charithra              │
│                             │
│   [Loading Animation]       │
│                             │
│                             │
└─────────────────────────────┘
```

**Elements**:
- App logo/icon (temple gopuram)
- App name in Sanskrit/English
- Loading indicator
- Version number (bottom)

**Duration**: 2-3 seconds
**Next**: Welcome Screen

---

### 2. Welcome Screen (Carousel)

```
┌─────────────────────────────┐
│  [Skip]                     │
│                             │
│   [Large Temple Image]      │
│                             │
│   Discover Sacred           │
│   Temples of India          │
│                             │
│   Explore thousands of      │
│   Hindu temples with        │
│   rich history              │
│                             │
│   ● ○ ○                     │
│                             │
│   [Next →]                  │
└─────────────────────────────┘
```

**Screens**: 3 carousel slides
- Slide 1: Discover temples
- Slide 2: Learn history & significance
- Slide 3: Audio guides in multiple languages

**Actions**:
- Skip → Home Screen
- Next → Next slide
- Last slide → Get Started → Home

---

### 3. Home Screen (Main Dashboard)
```
┌─────────────────────────────┐
│ ☰  Sanaathana Aalaya    🔍 │
├─────────────────────────────┤
│                             │
│  [Featured Temple Card]     │
│  ┌───────────────────────┐  │
│  │ [Temple Image]        │  │
│  │ Brihadeeswarar Temple │  │
│  │ Tamil Nadu            │  │
│  │ ⭐ 4.8  📍 Thanjavur  │  │
│  └───────────────────────┘  │
│                             │
│  Explore by State           │
│  ┌─────┐ ┌─────┐ ┌─────┐   │
│  │ TN  │ │ KA  │ │ AP  │   │
│  └─────┘ └─────┘ └─────┘   │
│                             │
│  Popular Temples            │
│  • Tirupati Temple          │
│  • Meenakshi Temple         │
│  • Somnath Temple           │
│                             │
└─────────────────────────────┘
│ 🏠 Home  🗺️ Map  ⭐ Saved  │
└─────────────────────────────┘
```

**Elements**:
- Header with menu & search
- Featured temple carousel
- State selection grid
- Popular temples list
- Bottom navigation

**Actions**:
- Tap temple → Temple Detail
- Tap state → State Temples List
- Search → Search Screen
- Menu → Side Drawer

---

### 4. India Map Screen

```
┌─────────────────────────────┐
│ ← Explore by State          │
├─────────────────────────────┤
│                             │
│    [Interactive India Map]  │
│         ┌─────┐             │
│         │ JK  │             │
│    ┌────┴─────┴────┐        │
│    │ PB  HP  UK    │        │
│    ├───────────────┤        │
│    │ RJ  UP  BR    │        │
│    ├───────────────┤        │
│    │ GJ  MP  JH    │        │
│    ├───────────────┤        │
│    │ MH  CG  OR    │        │
│    └───────────────┘        │
│                             │
│  Tap a state to explore     │
│  temples in that region     │
│                             │
│  [List View] [Map View]     │
│                             │
└─────────────────────────────┘
```

**Features**:
- Interactive SVG map
- State highlighting on tap
- Temple count per state
- Toggle between map/list view

**Actions**:
- Tap state → State Temples List
- Switch to List View → State List

---

### 5. State Temples List
```
┌─────────────────────────────┐
│ ← Tamil Nadu (234 temples)  │
├─────────────────────────────┤
│ 🔍 Search temples...        │
├─────────────────────────────┤
│                             │
│ ┌─────────────────────────┐ │
│ │ [Img] Brihadeeswarar    │ │
│ │       Thanjavur         │ │
│ │       ⭐ 4.8  💬 1.2k   │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ [Img] Meenakshi Temple  │ │
│ │       Madurai           │ │
│ │       ⭐ 4.9  💬 2.5k   │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ [Img] Ramanathaswamy    │ │
│ │       Rameswaram        │ │
│ │       ⭐ 4.7  💬 980    │ │
│ └─────────────────────────┘ │
│                             │
│ [Load More]                 │
└─────────────────────────────┘
```

**Elements**:
- State name with temple count
- Search bar
- Temple cards with:
  - Thumbnail image
  - Name & location
  - Rating & review count
- Infinite scroll/pagination

**Actions**:
- Tap temple → Temple Detail
- Search → Filter temples
- Pull to refresh

---

### 6. Temple Detail Screen

```
┌─────────────────────────────┐
│ ←  [Share] [Save] [Audio]   │
├─────────────────────────────┤
│ [Hero Image - Full Width]   │
│                             │
│ Brihadeeswarar Temple       │
│ ⭐ 4.8 (1,234 reviews)      │
│ 📍 Thanjavur, Tamil Nadu    │
│                             │
│ ┌─ About ─────────────────┐ │
│ │ Built in 1010 CE by     │ │
│ │ Raja Raja Chola I...    │ │
│ │ [Read More]             │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─ History ───────────────┐ │
│ │ The temple is a UNESCO  │ │
│ │ World Heritage Site...  │ │
│ │ [Read More]             │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─ Significance ──────────┐ │
│ │ Dedicated to Lord Shiva │ │
│ │ One of the largest...   │ │
│ │ [Read More]             │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─ Architecture ──────────┐ │
│ │ Dravidian style with    │ │
│ │ 216 ft vimana...        │ │
│ │ [Read More]             │ │
│ └─────────────────────────┘ │
│                             │
│ 📸 Gallery (24 photos)      │
│ [Photo Grid]                │
│                             │
│ 🗺️ Location & Directions   │
│ [Map Preview]               │
│ [Get Directions]            │
│                             │
│ ⏰ Timings                  │
│ Morning: 6:00 AM - 12:30 PM │
│ Evening: 4:00 PM - 8:30 PM  │
│                             │
│ 💬 Reviews (1,234)          │
│ [Review Cards]              │
│                             │
└─────────────────────────────┘
```

**Sections**:
1. Hero image with actions
2. Basic info (name, rating, location)
3. About (AI-generated)
4. History (AI-generated)
5. Significance (AI-generated)
6. Architecture (AI-generated)
7. Photo gallery
8. Location map
9. Timings & info
10. User reviews

**Actions**:
- Audio button → Play TTS
- Save → Add to favorites
- Share → Share temple
- Gallery → Full-screen photos
- Get Directions → Maps app

---

### 7. Search Screen

```
┌─────────────────────────────┐
│ ← 🔍 Search temples...      │
├─────────────────────────────┤
│                             │
│ Recent Searches             │
│ • Tirupati                  │
│ • Meenakshi                 │
│ • Somnath                   │
│                             │
│ Popular Searches            │
│ • Shiva temples             │
│ • Vishnu temples            │
│ • Tamil Nadu temples        │
│                             │
│ Filter by:                  │
│ [State ▼] [Deity ▼]        │
│                             │
└─────────────────────────────┘

// After typing:
┌─────────────────────────────┐
│ ← 🔍 tirupati          [×]  │
├─────────────────────────────┤
│ Results (3)                 │
│                             │
│ ┌─────────────────────────┐ │
│ │ [Img] Tirupati Temple   │ │
│ │       Andhra Pradesh    │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ [Img] Tirumala Temple   │ │
│ │       Andhra Pradesh    │ │
│ └─────────────────────────┘ │
│                             │
└─────────────────────────────┘
```

**Features**:
- Real-time search
- Recent searches
- Popular searches
- Filters (state, deity)
- Search results with highlights

---

### 8. Saved Temples Screen
```
┌─────────────────────────────┐
│ ← Saved Temples (12)        │
├─────────────────────────────┤
│                             │
│ ┌─────────────────────────┐ │
│ │ [Img] Brihadeeswarar    │ │
│ │       Tamil Nadu        │ │
│ │       Saved 2 days ago  │ │
│ │                    [×]  │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ [Img] Meenakshi Temple  │ │
│ │       Tamil Nadu        │ │
│ │       Saved 1 week ago  │ │
│ │                    [×]  │ │
│ └─────────────────────────┘ │
│                             │
│ [Clear All]                 │
│                             │
└─────────────────────────────┘
```

**Features**:
- List of saved temples
- Remove individual temples
- Clear all option
- Timestamp of when saved

---

### 9. Side Menu Drawer
```
┌─────────────────────────────┐
│ [Profile Avatar]            │
│ Guest User                  │
│ guest@example.com           │
├─────────────────────────────┤
│ 🏠 Home                     │
│ 🗺️ Explore by Map          │
│ ⭐ Saved Temples            │
│ 🔍 Search                   │
│ 🌐 Language (English)       │
│ 🎨 Theme (Light)            │
│ ℹ️ About                    │
│ 📧 Contact Us               │
│ 🔒 Privacy Policy           │
│ ⚙️ Settings                 │
│ 🚪 Logout                   │
└─────────────────────────────┘
```

**Options**:
- Profile section
- Navigation links
- Language selector
- Theme toggle
- App info & policies
- Settings
- Logout

---

## Admin Portal Wireframes

### 1. Login Screen
```
┌─────────────────────────────────────────┐
│                                         │
│         [Temple Logo]                   │
│                                         │
│    Sanaathana Aalaya Charithra          │
│         Admin Portal                    │
│                                         │
│    ┌─────────────────────────────┐     │
│    │ Email                       │     │
│    │ admin@example.com           │     │
│    └─────────────────────────────┘     │
│                                         │
│    ┌─────────────────────────────┐     │
│    │ Password                    │     │
│    │ ••••••••••                  │     │
│    └─────────────────────────────┘     │
│                                         │
│    ☐ Remember me                       │
│                                         │
│    [Login]                              │
│                                         │
│    Forgot Password?                     │
│                                         │
└─────────────────────────────────────────┘
```

---

### 2. Dashboard (Admin Home)

```
┌─────────────────────────────────────────────────────────────┐
│ ☰ Sanaathana Aalaya Admin    [Search]    [Profile] [Logout] │
├─────────────────────────────────────────────────────────────┤
│ │                                                            │
│ │ Dashboard                                                  │
│ │                                                            │
│ │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│ │ │ 1,234    │ │ 28       │ │ 5,678    │ │ 234      │     │
│ │ │ Temples  │ │ States   │ │ Users    │ │ Pending  │     │
│ │ └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│ │                                                            │
│ │ Recent Activity                                            │
│ │ ┌────────────────────────────────────────────────────┐   │
│ │ │ • New temple added: Kashi Vishwanath (2 hrs ago)   │   │
│ │ │ • Content generated for Meenakshi Temple (3 hrs)   │   │
│ │ │ • User reported issue for Tirupati (5 hrs ago)     │   │
│ │ └────────────────────────────────────────────────────┘   │
│ │                                                            │
│ │ Content Generation Status                                  │
│ │ ┌────────────────────────────────────────────────────┐   │
│ │ │ ████████████░░░░░░░░ 65% Complete                  │   │
│ │ │ 812 / 1,234 temples have AI-generated content      │   │
│ │ └────────────────────────────────────────────────────┘   │
│ │                                                            │
│ │ Quick Actions                                              │
│ │ [+ Add Temple] [Generate Content] [View Reports]          │
│ │                                                            │
└─────────────────────────────────────────────────────────────┘
```

**Sidebar Menu**:
- Dashboard
- Temples Management
- States Management
- Content Generation
- Users Management
- Analytics
- Settings

---

### 3. Temples Management
```
┌─────────────────────────────────────────────────────────────┐
│ ☰ Temples Management                                        │
├─────────────────────────────────────────────────────────────┤
│ │                                                            │
│ │ [+ Add New Temple]  [Import CSV]  [Export]                │
│ │                                                            │
│ │ 🔍 Search temples...    [Filter ▼] [State ▼] [Status ▼]  │
│ │                                                            │
│ │ ┌────────────────────────────────────────────────────┐   │
│ │ │ Name          │ State  │ Status  │ Content │ Actions│   │
│ │ ├────────────────────────────────────────────────────┤   │
│ │ │ Brihadeeswarar│ TN     │ Active  │ ✓       │ [Edit] │   │
│ │ │ Meenakshi     │ TN     │ Active  │ ✓       │ [Edit] │   │
│ │ │ Tirupati      │ AP     │ Active  │ ✓       │ [Edit] │   │
│ │ │ Somnath       │ GJ     │ Pending │ ✗       │ [Edit] │   │
│ │ │ Kedarnath     │ UK     │ Draft   │ ✗       │ [Edit] │   │
│ │ └────────────────────────────────────────────────────┘   │
│ │                                                            │
│ │ Showing 1-10 of 1,234    [< 1 2 3 ... 124 >]             │
│ │                                                            │
└─────────────────────────────────────────────────────────────┘
```

**Features**:
- Add/Import temples
- Search & filters
- Data table with sorting
- Status indicators
- Bulk actions
- Pagination

---

### 4. Add/Edit Temple Form
```
┌─────────────────────────────────────────────────────────────┐
│ ← Add New Temple                                            │
├─────────────────────────────────────────────────────────────┤
│ │                                                            │
│ │ Basic Information                                          │
│ │ ┌────────────────────────────────────────────────────┐   │
│ │ │ Temple Name *                                      │   │
│ │ │ [Brihadeeswarar Temple]                            │   │
│ │ └────────────────────────────────────────────────────┘   │
│ │                                                            │
│ │ ┌──────────────────┐  ┌──────────────────┐              │
│ │ │ State *          │  │ City *           │              │
│ │ │ [Tamil Nadu ▼]   │  │ [Thanjavur]      │              │
│ │ └──────────────────┘  └──────────────────┘              │
│ │                                                            │
│ │ ┌────────────────────────────────────────────────────┐   │
│ │ │ Deity *                                            │   │
│ │ │ [Lord Shiva ▼]                                     │   │
│ │ └────────────────────────────────────────────────────┘   │
│ │                                                            │
│ │ ┌────────────────────────────────────────────────────┐   │
│ │ │ Architectural Style                                │   │
│ │ │ [Dravidian ▼]                                      │   │
│ │ └────────────────────────────────────────────────────┘   │
│ │                                                            │
│ │ Location                                                   │
│ │ ┌──────────────────┐  ┌──────────────────┐              │
│ │ │ Latitude         │  │ Longitude        │              │
│ │ │ [10.7825]        │  │ [79.1317]        │              │
│ │ └──────────────────┘  └──────────────────┘              │
│ │                                                            │
│ │ Images                                                     │
│ │ [Upload Images] [Drag & Drop]                             │
│ │ [Preview thumbnails]                                       │
│ │                                                            │
│ │ Timings                                                    │
│ │ Morning: [6:00 AM] to [12:30 PM]                          │
│ │ Evening: [4:00 PM] to [8:30 PM]                           │
│ │                                                            │
│ │ [Cancel]  [Save as Draft]  [Publish]                      │
│ │                                                            │
└─────────────────────────────────────────────────────────────┘
```

---

### 5. Content Generation Interface

```
┌─────────────────────────────────────────────────────────────┐
│ ☰ AI Content Generation                                     │
├─────────────────────────────────────────────────────────────┤
│ │                                                            │
│ │ Generate Content for: Brihadeeswarar Temple               │
│ │                                                            │
│ │ Model Selection                                            │
│ │ ○ Claude 3 Haiku (Fast, Cost-effective)                   │
│ │ ● Claude 3 Sonnet (High Quality, Recommended)             │
│ │                                                            │
│ │ Content Sections                                           │
│ │ ☑ About (200 words)                                       │
│ │ ☑ History (300 words)                                     │
│ │ ☑ Significance (250 words)                                │
│ │ ☑ Architecture (300 words)                                │
│ │                                                            │
│ │ Language                                                   │
│ │ [English ▼]                                               │
│ │                                                            │
│ │ Tone                                                       │
│ │ ○ Formal  ● Engaging  ○ Educational                       │
│ │                                                            │
│ │ [Generate Content]  [Preview]                             │
│ │                                                            │
│ │ ─────────────────────────────────────────────────────     │
│ │                                                            │
│ │ Generated Content Preview                                  │
│ │ ┌────────────────────────────────────────────────────┐   │
│ │ │ About:                                             │   │
│ │ │ The Brihadeeswarar Temple, also known as...       │   │
│ │ │ [Full content displayed here]                      │   │
│ │ │                                                    │   │
│ │ │ [Edit] [Regenerate] [Approve]                     │   │
│ │ └────────────────────────────────────────────────────┘   │
│ │                                                            │
│ │ Cost Estimate: $0.0092                                     │
│ │ Generation Time: ~5 seconds                                │
│ │                                                            │
└─────────────────────────────────────────────────────────────┘
```

**Features**:
- Model selection (Haiku/Sonnet)
- Content section checkboxes
- Language selection
- Tone options
- Real-time preview
- Edit/regenerate options
- Cost estimation

---

### 6. States Management
```
┌─────────────────────────────────────────────────────────────┐
│ ☰ States Management                                         │
├─────────────────────────────────────────────────────────────┤
│ │                                                            │
│ │ [+ Add State]  [Import]  [Export]                         │
│ │                                                            │
│ │ ┌────────────────────────────────────────────────────┐   │
│ │ │ State Name    │ Code │ Temples │ Status  │ Actions│   │
│ │ ├────────────────────────────────────────────────────┤   │
│ │ │ Tamil Nadu    │ TN   │ 234     │ Active  │ [Edit] │   │
│ │ │ Andhra Pradesh│ AP   │ 156     │ Active  │ [Edit] │   │
│ │ │ Karnataka     │ KA   │ 189     │ Active  │ [Edit] │   │
│ │ │ Kerala        │ KL   │ 98      │ Active  │ [Edit] │   │
│ │ │ Gujarat       │ GJ   │ 145     │ Active  │ [Edit] │   │
│ │ └────────────────────────────────────────────────────┘   │
│ │                                                            │
│ │ Map Preview                                                │
│ │ [Interactive India Map showing temple distribution]        │
│ │                                                            │
└─────────────────────────────────────────────────────────────┘
```

---

### 7. Analytics Dashboard
```
┌─────────────────────────────────────────────────────────────┐
│ ☰ Analytics & Reports                                       │
├─────────────────────────────────────────────────────────────┤
│ │                                                            │
│ │ Date Range: [Last 30 Days ▼]  [Export Report]            │
│ │                                                            │
│ │ User Engagement                                            │
│ │ ┌────────────────────────────────────────────────────┐   │
│ │ │ [Line Chart: Daily Active Users]                   │   │
│ │ │                                                    │   │
│ │ │     ╱╲                                             │   │
│ │ │    ╱  ╲      ╱╲                                    │   │
│ │ │   ╱    ╲    ╱  ╲                                   │   │
│ │ │  ╱      ╲  ╱    ╲                                  │   │
│ │ │ ╱        ╲╱      ╲                                 │   │
│ │ └────────────────────────────────────────────────────┘   │
│ │                                                            │
│ │ Top Viewed Temples                                         │
│ │ 1. Tirupati Temple - 12,345 views                         │
│ │ 2. Meenakshi Temple - 9,876 views                         │
│ │ 3. Brihadeeswarar - 8,543 views                           │
│ │                                                            │
│ │ Content Generation Stats                                   │
│ │ ┌──────────────────┐  ┌──────────────────┐              │
│ │ │ Total Generated  │  │ Total Cost       │              │
│ │ │ 812 temples      │  │ $7.48            │              │
│ │ └──────────────────┘  └──────────────────┘              │
│ │                                                            │
│ │ Geographic Distribution                                    │
│ │ [Bar Chart: Temples by State]                             │
│ │                                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Design System

### Color Palette

**Primary Colors**:
- Primary: `#FF6B35` (Saffron/Orange - represents Hindu culture)
- Secondary: `#004E89` (Deep Blue - represents divinity)
- Accent: `#F7B801` (Gold - represents prosperity)

**Neutral Colors**:
- Background: `#FFFFFF` (White)
- Surface: `#F5F5F5` (Light Gray)
- Text Primary: `#212121` (Dark Gray)
- Text Secondary: `#757575` (Medium Gray)

**Status Colors**:
- Success: `#4CAF50` (Green)
- Warning: `#FFC107` (Amber)
- Error: `#F44336` (Red)
- Info: `#2196F3` (Blue)

---

### Typography

**Font Family**: 
- Primary: `Inter` (Modern, readable)
- Secondary: `Noto Sans` (Multi-language support)
- Headings: `Poppins` (Bold, attention-grabbing)

**Font Sizes**:
- H1: 32px (Page titles)
- H2: 24px (Section headers)
- H3: 20px (Subsections)
- Body: 16px (Regular text)
- Caption: 14px (Small text)
- Small: 12px (Labels, metadata)

---

### Spacing System

Based on 8px grid:
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px

---

### Component Library

**Buttons**:
```
Primary:   [Button Text]  (Filled, primary color)
Secondary: [Button Text]  (Outlined, primary color)
Text:      Button Text    (No background)
Icon:      [🔍]          (Icon only)
```

**Cards**:
```
┌─────────────────────┐
│ [Image]             │
│ Title               │
│ Description text    │
│ [Action Button]     │
└─────────────────────┘
```

**Input Fields**:
```
Label
┌─────────────────────┐
│ Placeholder text    │
└─────────────────────┘
Helper text / Error message
```

---

## User Flows

### Mobile App User Flow

```
Splash Screen
    ↓
Welcome Carousel (3 screens)
    ↓
Home Screen
    ├→ Search → Search Results → Temple Detail
    ├→ State Selection → State Temples List → Temple Detail
    ├→ India Map → Tap State → State Temples List → Temple Detail
    └→ Featured Temple → Temple Detail
        ├→ View Gallery
        ├→ Play Audio Guide
        ├→ Get Directions
        ├→ Save Temple
        └→ Share Temple
```

### Admin Portal User Flow

```
Login
    ↓
Dashboard
    ├→ Temples Management
    │   ├→ Add Temple → Fill Form → Generate Content → Publish
    │   └→ Edit Temple → Update → Save
    ├→ Content Generation
    │   └→ Select Temple → Choose Model → Generate → Review → Approve
    ├→ States Management
    │   └→ Add/Edit States
    └→ Analytics
        └→ View Reports
```

---

## Accessibility Guidelines

### WCAG 2.1 AA Compliance

**Color Contrast**:
- Text: Minimum 4.5:1 ratio
- Large text: Minimum 3:1 ratio
- UI components: Minimum 3:1 ratio

**Touch Targets**:
- Minimum size: 44x44px
- Spacing: 8px between targets

**Text**:
- Resizable up to 200%
- Line height: 1.5x font size
- Paragraph spacing: 2x font size

**Navigation**:
- Keyboard accessible
- Screen reader compatible
- Focus indicators visible

**Images**:
- Alt text for all images
- Decorative images marked as such

**Forms**:
- Clear labels
- Error messages
- Input validation
- Help text

---

## Responsive Design

### Mobile App (React Native)
- Optimized for phones (375px - 428px width)
- Tablet support (768px - 1024px width)
- Landscape orientation support

### Admin Portal (Web)
- Desktop: 1920px+ (primary)
- Laptop: 1366px - 1920px
- Tablet: 768px - 1366px
- Mobile: 375px - 768px (limited support)

---

**Document Version**: 1.0  
**Last Updated**: March 3, 2026  
**Created by**: Kiro AI Assistant  
**Status**: Complete

For implementation details, refer to:
- `mobile-app/src/screens/` - Mobile app screens
- `admin-portal/src/pages/` - Admin portal pages
- `docs/ARCHITECTURE_DIAGRAM.md` - System architecture
