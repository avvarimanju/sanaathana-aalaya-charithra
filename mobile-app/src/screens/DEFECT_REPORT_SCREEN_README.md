# DefectReportScreen Component

## Overview

The `DefectReportScreen` component provides a user-friendly interface for end users to submit defect reports in the Sanaathana Aalaya Charithra mobile application. It includes real-time validation, auto-capture of device information, and comprehensive error handling.

## Features

### 1. Form Fields

**Required Fields:**
- **Title**: Brief summary of the issue (5-200 characters)
- **Description**: Detailed description of the issue (10-5000 characters)

**Optional Fields:**
- **Steps to Reproduce**: Step-by-step instructions to reproduce the issue (max 5000 characters)
- **Expected Behavior**: What should happen (max 2000 characters)
- **Actual Behavior**: What actually happens (max 2000 characters)

### 2. Real-time Validation

- Validates title and description as the user types (after field is touched)
- Shows inline error messages for validation failures
- Displays character count for all fields
- Disables submit button until form is valid

### 3. Auto-capture Device Information

Automatically captures and includes:
- Platform (Android/iOS)
- OS Version
- App Version
- Device Model

### 4. Success/Error Handling

- Shows loading indicator during submission
- Displays success alert with defect ID on successful submission
- Shows error alert with detailed message on failure
- Clears form after successful submission

## Usage

### Navigation Setup

Add the screen to your navigation stack:

```typescript
import DefectReportScreen from './src/screens/DefectReportScreen';

// In your navigator
<Stack.Screen 
  name="DefectReport" 
  component={DefectReportScreen}
  options={{ title: 'Report a Defect' }}
/>
```

### Navigating to the Screen

```typescript
// From any screen
navigation.navigate('DefectReport', {
  userId: currentUser.id, // Pass the current user's ID
});
```

### Route Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | The ID of the user submitting the defect |

If no `userId` is provided, it defaults to `'demo-user-123'` for testing purposes.

## Validation Rules

### Title Validation
- **Required**: Cannot be empty
- **Minimum Length**: 5 characters (trimmed)
- **Maximum Length**: 200 characters

### Description Validation
- **Required**: Cannot be empty
- **Minimum Length**: 10 characters (trimmed)
- **Maximum Length**: 5000 characters

### Optional Fields
- No validation for optional fields
- Maximum lengths enforced by TextInput component

## API Integration

The component uses the `defectApiService` to submit defect reports:

```typescript
const response = await defectApiService.submitDefect({
  userId,
  title,
  description,
  stepsToReproduce,
  expectedBehavior,
  actualBehavior,
  deviceInfo,
});
```

### Success Response

```typescript
{
  success: true,
  data: {
    defectId: "uuid-string",
    status: "New",
    createdAt: "2024-01-01T00:00:00.000Z"
  }
}
```

### Error Response

```typescript
{
  success: false,
  error: {
    error: "VALIDATION_ERROR",
    message: "Invalid input data",
    details: [...]
  }
}
```

## Styling

The component follows the existing app's design patterns:

- **Primary Color**: `#FF6B35` (Orange)
- **Background**: White (`#fff`)
- **Input Background**: Light gray (`#f5f5f5`)
- **Error Color**: `#FF6B35` (Orange)
- **Info Color**: `#4A90E2` (Blue)

### Key Style Elements

- Rounded corners (8px border radius)
- Consistent padding and spacing
- Clear visual hierarchy
- Accessible touch targets (minimum 44px height)

## Accessibility

- Clear labels for all form fields
- Required field indicators
- Error messages associated with fields
- Disabled state for submit button when form is invalid
- Loading indicator during submission

## Error Handling

### Validation Errors
- Shown inline below each field
- Only displayed after field is touched
- Real-time updates as user types

### Network Errors
- Caught and displayed in alert dialog
- User-friendly error messages
- Retry option (user can resubmit)

### API Errors
- Displays server error messages
- Handles specific error codes (VALIDATION_ERROR, etc.)

## Testing Considerations

### Manual Testing Checklist

- [ ] Title validation (empty, too short, too long)
- [ ] Description validation (empty, too short, too long)
- [ ] Optional fields work correctly
- [ ] Character counters update correctly
- [ ] Submit button disabled when form invalid
- [ ] Loading state shows during submission
- [ ] Success alert displays with defect ID
- [ ] Error alert displays on failure
- [ ] Form clears after successful submission
- [ ] Device info captured correctly
- [ ] Keyboard handling works on iOS and Android
- [ ] ScrollView scrolls to show all fields

### Unit Test Examples

```typescript
describe('DefectReportScreen', () => {
  it('should validate title length', () => {
    // Test title validation
  });

  it('should validate description length', () => {
    // Test description validation
  });

  it('should disable submit button when form is invalid', () => {
    // Test button state
  });

  it('should submit defect with all fields', async () => {
    // Test submission
  });
});
```

## Future Enhancements

Potential improvements for future versions:

1. **Image Attachments**: Allow users to attach screenshots
2. **Offline Support**: Queue submissions when offline
3. **Draft Saving**: Save form data locally
4. **Pre-filled Templates**: Common issue templates
5. **Rich Text Editor**: Better formatting for descriptions
6. **Voice Input**: Dictate defect descriptions
7. **Auto-save**: Prevent data loss on app close

## Requirements Validation

This component satisfies the following requirements from the spec:

- **Requirement 1.1**: Provides defect submission interface
- **Requirement 1.2**: Captures report title
- **Requirement 1.3**: Captures report description
- **Requirement 1.4**: Captures steps to reproduce
- **Requirement 1.5**: Captures expected behavior
- **Requirement 1.6**: Captures actual behavior
- **Requirement 7.1**: Rejects submission without title
- **Requirement 7.2**: Rejects submission without description
- **Requirement 7.3**: Validates title minimum length (5 chars)
- **Requirement 7.4**: Validates description minimum length (10 chars)

## Related Files

- **API Service**: `src/services/defect-api.service.ts`
- **API Config**: `src/config/api.ts`
- **Type Definitions**: Defined in `defect-api.service.ts`

## Support

For issues or questions about this component, please:
1. Check the API service documentation
2. Review the design document in `.kiro/specs/defect-tracking/design.md`
3. Submit a defect report using this screen! 😊
