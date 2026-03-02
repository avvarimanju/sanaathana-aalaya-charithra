# Status Management Components

Reusable React components for defect status management in the Admin Portal.

## Overview

This directory contains three core components extracted from the DefectDetailPage implementation:

1. **StatusBadge** - Visual status indicator with color coding
2. **StatusTransitionButton** - Button for changing defect status
3. **StatusUpdateForm** - Form for adding comments and updates

These components are designed to be reusable across different pages and contexts within the Admin Portal.

## Components

### StatusBadge

Displays a defect status with color-coded visual indicator.

**Props:**
- `status` (DefectStatus, required) - The defect status to display
- `size` ('small' | 'medium' | 'large', optional) - Size variant (default: 'medium')
- `className` (string, optional) - Additional CSS class name

**Color Mapping:**
- New: Blue (#3b82f6)
- Acknowledged: Purple (#8b5cf6)
- In_Progress: Orange (#f59e0b)
- Resolved: Green (#10b981)
- Closed: Gray (#6b7280)

**Example Usage:**

```tsx
import { StatusBadge } from '../components';

// Basic usage
<StatusBadge status="New" />

// With size variant
<StatusBadge status="In_Progress" size="small" />

// With custom class
<StatusBadge status="Resolved" className="my-custom-class" />
```

### StatusTransitionButton

Button for changing defect status with visual feedback and loading states.

**Props:**
- `currentStatus` (DefectStatus, required) - Current status of the defect
- `targetStatus` (DefectStatus, required) - Target status to transition to
- `onClick` ((targetStatus: DefectStatus) => void, required) - Click handler
- `loading` (boolean, optional) - Whether the button is in loading state
- `disabled` (boolean, optional) - Whether the button is disabled
- `className` (string, optional) - Additional CSS class name

**Features:**
- Color-coded based on target status
- Hover effects with darker shade
- Loading state with "Updating..." text
- Disabled state with reduced opacity
- Accessible with proper ARIA attributes

**Example Usage:**

```tsx
import { StatusTransitionButton } from '../components';

const [loading, setLoading] = useState(false);

const handleStatusChange = async (newStatus: DefectStatus) => {
  setLoading(true);
  try {
    await updateDefectStatus(defectId, newStatus);
  } finally {
    setLoading(false);
  }
};

// Basic usage
<StatusTransitionButton
  currentStatus="New"
  targetStatus="Acknowledged"
  onClick={handleStatusChange}
/>

// With loading state
<StatusTransitionButton
  currentStatus="Acknowledged"
  targetStatus="In_Progress"
  onClick={handleStatusChange}
  loading={loading}
/>

// Disabled button
<StatusTransitionButton
  currentStatus="Closed"
  targetStatus="In_Progress"
  onClick={handleStatusChange}
  disabled={true}
/>
```

### StatusUpdateForm

Form for adding comments and status updates to defects.

**Props:**
- `onSubmit` ((message: string) => Promise<void>, required) - Submit handler
- `loading` (boolean, optional) - Whether the form is in loading state
- `error` (string | null, optional) - Error message to display
- `placeholder` (string, optional) - Placeholder text for textarea
- `className` (string, optional) - Additional CSS class name

**Features:**
- Textarea with validation (3-2000 characters)
- Character count display
- Submit button with loading state
- Error display banner
- Auto-clears on successful submission
- Accessible with proper ARIA attributes

**Example Usage:**

```tsx
import { StatusUpdateForm } from '../components';

const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleSubmit = async (message: string) => {
  setLoading(true);
  setError(null);
  
  try {
    await addStatusUpdate(defectId, message);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

// Basic usage
<StatusUpdateForm onSubmit={handleSubmit} />

// With loading and error states
<StatusUpdateForm
  onSubmit={handleSubmit}
  loading={loading}
  error={error}
/>

// With custom placeholder
<StatusUpdateForm
  onSubmit={handleSubmit}
  placeholder="Enter your update here..."
/>
```

## Complete Example

Here's a complete example showing how to use all three components together:

```tsx
import React, { useState } from 'react';
import {
  StatusBadge,
  StatusTransitionButton,
  StatusUpdateForm,
} from '../components';
import { DefectStatus, adminDefectApi } from '../api/adminDefectApi';

interface DefectManagementProps {
  defectId: string;
  currentStatus: DefectStatus;
  onUpdate: () => void;
}

export const DefectManagement: React.FC<DefectManagementProps> = ({
  defectId,
  currentStatus,
  onUpdate,
}) => {
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // Get allowed transitions
  const allowedTransitions = adminDefectApi.getAllowedTransitions(currentStatus);

  // Handle status change
  const handleStatusChange = async (newStatus: DefectStatus) => {
    setStatusLoading(true);
    setStatusError(null);

    try {
      const response = await adminDefectApi.updateDefectStatus(defectId, {
        newStatus,
      });

      if (response.success) {
        onUpdate();
      } else {
        setStatusError(response.error?.message || 'Failed to update status');
      }
    } catch (err) {
      setStatusError(err.message);
    } finally {
      setStatusLoading(false);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (message: string) => {
    setCommentLoading(true);
    setCommentError(null);

    try {
      const response = await adminDefectApi.addStatusUpdate(defectId, {
        message,
      });

      if (response.success) {
        onUpdate();
      } else {
        setCommentError(response.error?.message || 'Failed to add comment');
      }
    } catch (err) {
      setCommentError(err.message);
    } finally {
      setCommentLoading(false);
    }
  };

  return (
    <div>
      {/* Current Status */}
      <div>
        <h3>Current Status</h3>
        <StatusBadge status={currentStatus} size="large" />
      </div>

      {/* Status Transitions */}
      <div>
        <h3>Change Status</h3>
        {statusError && <div className="error">{statusError}</div>}
        
        {allowedTransitions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {allowedTransitions.map((status) => (
              <StatusTransitionButton
                key={status}
                currentStatus={currentStatus}
                targetStatus={status}
                onClick={handleStatusChange}
                loading={statusLoading}
              />
            ))}
          </div>
        ) : (
          <p>No status transitions available</p>
        )}
      </div>

      {/* Add Comment */}
      <div>
        <h3>Add Update</h3>
        <StatusUpdateForm
          onSubmit={handleCommentSubmit}
          loading={commentLoading}
          error={commentError}
        />
      </div>
    </div>
  );
};
```

## Styling

All components use inline styles for portability and consistency. However, they also include CSS class names for custom styling:

- `status-badge` - StatusBadge component
- `status-badge-{status}` - Status-specific class (e.g., `status-badge-new`)
- `status-transition-button` - StatusTransitionButton component
- `status-update-form` - StatusUpdateForm component
- `comment-textarea` - Textarea in StatusUpdateForm
- `submit-button` - Submit button in StatusUpdateForm

You can override styles using these class names in your CSS:

```css
/* Custom styling example */
.status-badge {
  font-size: 14px;
  border-radius: 8px;
}

.status-transition-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.comment-textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

## Accessibility

All components follow accessibility best practices:

- Semantic HTML elements
- Proper ARIA attributes (`role`, `aria-label`, `aria-busy`, `aria-invalid`)
- Keyboard navigation support
- Focus management
- Screen reader friendly

## Testing

Unit tests for these components should cover:

1. **StatusBadge**
   - Renders with correct color for each status
   - Applies correct size variant
   - Displays formatted status text

2. **StatusTransitionButton**
   - Calls onClick handler with correct status
   - Shows loading state correctly
   - Disables button when loading or disabled
   - Applies correct color for target status

3. **StatusUpdateForm**
   - Validates message length (3-2000 characters)
   - Calls onSubmit with trimmed message
   - Clears form on successful submission
   - Displays error messages
   - Shows character count

See the `__tests__` directory for test examples.

## Requirements

These components satisfy the following requirements:

- **Requirement 4.1**: Update Defect Status
- **Requirement 5.1**: Provide Status Updates
- **Requirement 6.6**: Status Workflow Validation

## Related Files

- `../api/adminDefectApi.ts` - API client and type definitions
- `../pages/DefectDetailPage.tsx` - Original implementation
- `../pages/DefectListPage.tsx` - Uses StatusBadge component

## Future Enhancements

Potential improvements for these components:

1. **StatusBadge**
   - Add icon support
   - Add tooltip with status description
   - Add animation on status change

2. **StatusTransitionButton**
   - Add confirmation dialog for critical transitions
   - Add transition history preview
   - Add keyboard shortcuts

3. **StatusUpdateForm**
   - Add rich text editor support
   - Add file attachment support
   - Add @mention functionality for team members
   - Add template suggestions
