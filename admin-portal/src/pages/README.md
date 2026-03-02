# Admin Portal Pages

This directory contains the page components for the Admin Portal.

## DefectListPage

The main page for viewing and managing all defect reports in the system.

### Features

- **Defect Table**: Displays all defects with key information (ID, Title, Status, Created Date, Update Count)
- **Sorting**: Click on column headers to sort by that field (ascending/descending)
- **Status Filter**: Dropdown to filter defects by status (All, New, Acknowledged, In Progress, Resolved, Closed)
- **Search**: Search defects by ID or title
- **Pagination**: Navigate through pages of defects (20 per page)
- **Loading States**: Shows spinner while fetching data
- **Error Handling**: Displays error messages with retry button
- **Empty States**: Shows helpful message when no defects are found
- **Navigation**: Click on any defect row to navigate to the detail page

### Usage

```tsx
import { DefectListPage } from './pages/DefectListPage';

// In your router configuration
<Route path="/defects" element={<DefectListPage />} />
```

### Requirements Satisfied

- **Requirement 3.1**: Provides interface for administrators to view all defect reports
- **Requirement 3.2**: Allows filtering defects by status
- **Requirement 3.3**: Allows searching defects by defect ID or title

### Component Structure

```
DefectListPage
├── Header (Title + Refresh Button)
├── Filters (Status Dropdown + Search Input)
├── Info Bar (Total Count + Current Page)
├── Loading State (Spinner)
├── Error State (Error Message + Retry Button)
├── Empty State (No Defects Message)
├── Defect Table
│   ├── Table Headers (Sortable)
│   └── Table Rows (Clickable)
└── Pagination Controls (Previous + Page Info + Next)
```

### State Management

The component manages the following state:
- `defects`: Array of defect summaries
- `loading`: Loading indicator
- `error`: Error message
- `statusFilter`: Current status filter
- `searchQuery`: Current search query
- `sortConfig`: Current sort field and direction
- `currentPage`: Current page number
- `totalCount`: Total number of defects
- `lastEvaluatedKey`: Pagination key for DynamoDB
- `hasNextPage`: Whether there are more pages

### Styling

The component uses inline styles with CSS classes for hover effects and animations. The design follows a clean, professional Admin Portal aesthetic with:
- Color-coded status badges
- Responsive table layout
- Hover effects on interactive elements
- Smooth transitions
- Professional typography

### API Integration

The component uses the `adminDefectApi` client to fetch defects:
- `getAllDefects(filters)`: Fetches defects with optional filters

### Navigation

The component uses React Router's `useNavigate` hook to navigate to the defect detail page when a row is clicked:
```tsx
navigate(`/defects/${defectId}`);
```

### Future Enhancements

- Bulk operations (select multiple defects)
- Export to CSV
- Advanced filtering (date range, user ID)
- Real-time updates via WebSocket
- Defect statistics dashboard
