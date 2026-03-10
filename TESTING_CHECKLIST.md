# Trusted Sources Feature - Testing Checklist

**Date**: March 3, 2026  
**Status**: Ready for Testing

---

## 🚀 Quick Start

```powershell
# Option 1: Quick test
.\TEST_NOW.ps1

# Option 2: Manual test
cd admin-portal
npm run dev
```

Then open: **http://localhost:5173/trusted-sources**

---

## ✅ Testing Checklist

### Phase 1: Basic UI Tests (No Backend Required)

#### Page Load
- [ ] Navigate to http://localhost:5173/trusted-sources
- [ ] Page loads without errors
- [ ] No console errors (press F12 to check)
- [ ] Page title shows "Trusted Sources Management"

#### Navigation
- [ ] Sidebar shows "🔗 Trusted Sources" link
- [ ] Link is between "State Management" and "Pricing"
- [ ] Clicking link navigates to /trusted-sources
- [ ] Link highlights when active

#### UI Elements
- [ ] Search bar visible at top
- [ ] "Search sources..." placeholder text visible
- [ ] Filter dropdown "All Types" visible
- [ ] Filter dropdown "All Status" visible
- [ ] "Add New Source" button visible (orange/saffron color)

#### Empty State
- [ ] Shows "No trusted sources found" message
- [ ] Shows "Add Your First Source" button
- [ ] Message is centered and styled nicely

#### Responsive Design
- [ ] Resize browser to mobile width (< 768px)
- [ ] Layout adjusts to single column
- [ ] Search bar takes full width
- [ ] Filters stack vertically
- [ ] Navigation still works

#### Styling
- [ ] Colors match theme (saffron #FF6B35, blue #004E89)
- [ ] Hover effects work on buttons
- [ ] Smooth transitions on hover
- [ ] Typography is readable
- [ ] Spacing looks good

---

### Phase 2: Interaction Tests (No Backend Required)

#### Search Functionality
- [ ] Click in search bar
- [ ] Type some text
- [ ] Search input updates
- [ ] Border color changes on focus (orange)

#### Filter Dropdowns
- [ ] Click "All Types" dropdown
- [ ] Options visible: All Types, Temple Official, State Authority, Heritage Authority, Custom
- [ ] Click "All Status" dropdown
- [ ] Options visible: All Status, Verified, Pending, Unverified
- [ ] Selecting options updates dropdown

#### Buttons
- [ ] "Add New Source" button has hover effect
- [ ] Button cursor changes to pointer on hover
- [ ] Button color darkens on hover

---

### Phase 3: Backend Integration Tests (Requires Backend Deployment)

#### List Sources
- [ ] Sources load automatically on page load
- [ ] Loading message shows while fetching
- [ ] Sources display in card grid
- [ ] Cards show: name, URL, type, status, trust score

#### Search Sources
- [ ] Type in search bar
- [ ] Results filter by name
- [ ] Results filter by URL
- [ ] Case-insensitive search works

#### Filter by Type
- [ ] Select "Temple Official"
- [ ] Only temple official sources show
- [ ] Select "State Authority"
- [ ] Only state authority sources show

#### Filter by Status
- [ ] Select "Verified"
- [ ] Only verified sources show
- [ ] Select "Pending"
- [ ] Only pending sources show

#### Add Source
- [ ] Click "Add New Source" button
- [ ] Modal opens (when implemented)
- [ ] Form fields visible
- [ ] Can enter source details
- [ ] Save button creates source
- [ ] New source appears in list

#### Edit Source
- [ ] Click "Edit" button on a source card
- [ ] Modal opens with source details
- [ ] Can modify source details
- [ ] Save button updates source
- [ ] Changes reflect in list

#### Verify Source
- [ ] Click "Verify" button on unverified source
- [ ] Status changes to "Verified"
- [ ] Badge color changes to green
- [ ] Checkmark appears in badge

#### Unverify Source
- [ ] Click "Unverify" button on verified source
- [ ] Status changes to "Unverified"
- [ ] Badge color changes to red
- [ ] Checkmark disappears

#### Delete Source
- [ ] Click "Delete" button
- [ ] Confirmation dialog appears
- [ ] Click "OK" to confirm
- [ ] Source removed from list
- [ ] Click "Cancel" to abort
- [ ] Source remains in list

#### Source Details
- [ ] Source name displays correctly
- [ ] URL is clickable
- [ ] Clicking URL opens in new tab
- [ ] Type badge shows correct type
- [ ] Status badge shows correct status
- [ ] Trust score displays (1-10)
- [ ] Applicable temples/states show

---

### Phase 4: Integration Tests (Requires Phase 2 Implementation)

#### Temple Form Integration
- [ ] Navigate to Add/Edit Temple page
- [ ] Source selection section visible
- [ ] Can select sources for temple
- [ ] Can mark source as primary
- [ ] Can set priority
- [ ] Sources save with temple

#### Content Generation Integration
- [ ] Navigate to Content Generation page
- [ ] Selected sources display
- [ ] Primary source highlighted
- [ ] Can generate content
- [ ] Content includes source attribution

---

## 📊 Test Results Template

```
Date: _______________
Tester: _______________

Phase 1 (Basic UI): ___ / 25 tests passed
Phase 2 (Interaction): ___ / 10 tests passed
Phase 3 (Backend): ___ / 35 tests passed (requires backend)
Phase 4 (Integration): ___ / 10 tests passed (requires Phase 2)

Total: ___ / 80 tests passed

Issues Found:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

Notes:
_______________________________________________
_______________________________________________
_______________________________________________
```

---

## 🐛 Common Issues & Solutions

### Issue: Page doesn't load
**Solution**: 
- Check if dev server is running
- Check console for errors (F12)
- Try clearing browser cache
- Restart dev server

### Issue: Navigation link missing
**Solution**:
- Verify Layout.tsx was updated
- Restart dev server
- Clear browser cache

### Issue: API calls fail
**Solution**:
- Backend not deployed yet (expected)
- Will show "Failed to load sources" message
- Deploy backend to test API calls

### Issue: Styling looks wrong
**Solution**:
- Check if CSS file was created
- Verify import in TrustedSourcesPage.tsx
- Clear browser cache
- Check browser console for CSS errors

---

## 📝 Bug Report Template

```
Title: _______________________________________________

Description:
_______________________________________________
_______________________________________________

Steps to Reproduce:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

Expected Behavior:
_______________________________________________

Actual Behavior:
_______________________________________________

Screenshots:
[Attach screenshots if applicable]

Browser: _______________
OS: _______________
Date: _______________
```

---

## ✅ Sign-Off

Once all tests pass:

```
Phase 1 Testing Complete: ☐

Tested By: _______________
Date: _______________
Signature: _______________

Ready for Phase 2: ☐ Yes  ☐ No

Notes:
_______________________________________________
_______________________________________________
```

---

**Last Updated**: March 3, 2026  
**Status**: Ready for Testing  
**Next**: Complete Phase 1 tests, then move to Phase 2 implementation

