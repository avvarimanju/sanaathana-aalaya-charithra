/**
 * StatusUpdateForm Component
 * 
 * Form for adding comments and status updates to defects.
 * 
 * Features:
 * - Textarea with validation
 * - Submit button with loading state
 * - Error display
 * - Accessible form with proper labels
 * 
 * Requirements: 4.1, 5.1, 6.6
 */

import React, { useState, FormEvent } from 'react';

/**
 * Props for StatusUpdateForm component
 */
export interface StatusUpdateFormProps {
  /** Submit handler for the form */
  onSubmit: (message: string) => Promise<void>;
  /** Whether the form is in loading state */
  loading?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Placeholder text for the textarea */
  placeholder?: string;
  /** Optional additional CSS class name */
  className?: string;
}

/**
 * StatusUpdateForm Component
 */
export const StatusUpdateForm: React.FC<StatusUpdateFormProps> = ({
  onSubmit,
  loading = false,
  error = null,
  placeholder = 'Add a comment or update about this defect...',
  className = '',
}) => {
  const [message, setMessage] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Clear previous validation error
    setValidationError(null);

    // Validate message
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setValidationError('Please enter a message');
      return;
    }

    if (trimmedMessage.length < 3) {
      setValidationError('Message must be at least 3 characters');
      return;
    }

    if (trimmedMessage.length > 2000) {
      setValidationError('Message must not exceed 2000 characters');
      return;
    }

    // Call onSubmit handler
    try {
      await onSubmit(trimmedMessage);
      // Clear message on successful submission
      setMessage('');
    } catch (err) {
      // Error is handled by parent component via error prop
      console.error('Form submission error:', err);
    }
  };

  /**
   * Handle textarea change
   */
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null);
    }
  };

  const isDisabled = loading;
  const displayError = error || validationError;

  return (
    <form 
      onSubmit={handleSubmit} 
      style={styles.form}
      className={`status-update-form ${className}`}
    >
      {/* Error Banner */}
      {displayError && (
        <div style={styles.errorBanner} role="alert">
          <p style={styles.errorText}>{displayError}</p>
        </div>
      )}

      {/* Textarea */}
      <textarea
        value={message}
        onChange={handleChange}
        placeholder={placeholder}
        style={styles.textarea}
        rows={4}
        disabled={isDisabled}
        className="comment-textarea"
        aria-label="Status update message"
        aria-invalid={!!displayError}
        aria-describedby={displayError ? 'form-error' : undefined}
      />

      {/* Character Count */}
      <div style={styles.characterCount}>
        <span style={message.length > 2000 ? styles.characterCountError : styles.characterCountNormal}>
          {message.length} / 2000 characters
        </span>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isDisabled || !message.trim()}
        style={{
          ...styles.submitButton,
          ...(isDisabled || !message.trim() ? styles.submitButtonDisabled : {}),
        }}
        className="submit-button"
        aria-busy={loading}
      >
        {loading ? 'Adding...' : 'Add Update'}
      </button>
    </form>
  );
};

/**
 * Inline styles for the component
 */
const styles: Record<string, React.CSSProperties> = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  errorBanner: {
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
  },
  errorText: {
    fontSize: '14px',
    color: '#dc2626',
    margin: '0',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    resize: 'vertical',
    fontFamily: 'inherit',
    outline: 'none',
    lineHeight: '1.5',
    transition: 'border-color 0.2s',
  },
  characterCount: {
    display: 'flex',
    justifyContent: 'flex-end',
    fontSize: '12px',
    marginTop: '-8px',
  },
  characterCountNormal: {
    color: '#6b7280',
  },
  characterCountError: {
    color: '#dc2626',
    fontWeight: '600',
  },
  submitButton: {
    padding: '12px 20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  submitButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};

export default StatusUpdateForm;
