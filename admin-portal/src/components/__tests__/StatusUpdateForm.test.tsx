/**
 * Unit tests for StatusUpdateForm component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatusUpdateForm } from '../StatusUpdateForm';

describe('StatusUpdateForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('should render form with textarea and submit button', () => {
      render(<StatusUpdateForm onSubmit={mockOnSubmit} />);
      
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add update/i })).toBeInTheDocument();
    });

    it('should render with default placeholder', () => {
      render(<StatusUpdateForm onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute(
        'placeholder',
        'Add a comment or update about this defect...'
      );
    });

    it('should render with custom placeholder', () => {
      render(
        <StatusUpdateForm
          onSubmit={mockOnSubmit}
          placeholder="Custom placeholder text"
        />
      );
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('placeholder', 'Custom placeholder text');
    });

    it('should show character count', () => {
      render(<StatusUpdateForm onSubmit={mockOnSubmit} />);
      
      expect(screen.getByText('0 / 2000 characters')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with trimmed message', async () => {
      render(<StatusUpdateForm onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByRole('textbox');
      const submitButton = screen.getByRole('button', { name: /add update/i });
      
      fireEvent.change(textarea, { target: { value: '  Test message  ' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith('Test message');
      });
    });

    it('should clear form after successful submission', async () => {
      render(<StatusUpdateForm onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      const submitButton = screen.getByRole('button', { name: /add update/i });
      
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(textarea.value).toBe('');
      });
    });

    it('should not submit empty message', async () => {
      render(<StatusUpdateForm onSubmit={mockOnSubmit} />);
      
      const submitButton = screen.getByRole('button', { name: /add update/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('should not submit whitespace-only message', async () => {
      render(<StatusUpdateForm onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByRole('textbox');
      const submitButton = screen.getByRole('button', { name: /add update/i });
      
      fireEvent.change(textarea, { target: { value: '   ' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe('Validation', () => {
    it('should show error for empty message', async () => {
      render(<StatusUpdateForm onSubmit={mockOnSubmit} />);
      
      const submitButton = screen.getByRole('button', { name: /add update/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a message')).toBeInTheDocument();
      });
    });

    it('should show error for message shorter than 3 characters', async () => {
      render(<StatusUpdateForm onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByRole('textbox');
      const submitButton = screen.getByRole('button', { name: /add update/i });
      
      fireEvent.change(textarea, { target: { value: 'ab' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Message must be at least 3 characters')).toBeInTheDocument();
      });
    });

    it('should show error for message longer than 2000 characters', async () => {
      render(<StatusUpdateForm onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByRole('textbox');
      const submitButton = screen.getByRole('button', { name: /add update/i });
      
      const longMessage = 'a'.repeat(2001);
      fireEvent.change(textarea, { target: { value: longMessage } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Message must not exceed 2000 characters')).toBeInTheDocument();
      });
    });

    it('should clear validation error when user starts typing', async () => {
      render(<StatusUpdateForm onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByRole('textbox');
      const submitButton = screen.getByRole('button', { name: /add update/i });
      
      // Trigger validation error
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a message')).toBeInTheDocument();
      });
      
      // Start typing
      fireEvent.change(textarea, { target: { value: 'Test' } });
      
      await waitFor(() => {
        expect(screen.queryByText('Please enter a message')).not.toBeInTheDocument();
      });
    });

    it('should accept valid message (3-2000 characters)', async () => {
      render(<StatusUpdateForm onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByRole('textbox');
      const submitButton = screen.getByRole('button', { name: /add update/i });
      
      fireEvent.change(textarea, { target: { value: 'Valid message' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('Valid message');
      });
    });
  });

  describe('Character Count', () => {
    it('should update character count as user types', () => {
      render(<StatusUpdateForm onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByRole('textbox');
      
      fireEvent.change(textarea, { target: { value: 'Hello' } });
      expect(screen.getByText('5 / 2000 characters')).toBeInTheDocument();
      
      fireEvent.change(textarea, { target: { value: 'Hello World' } });
      expect(screen.getByText('11 / 2000 characters')).toBeInTheDocument();
    });

    it('should show error color when exceeding limit', () => {
      render(<StatusUpdateForm onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByRole('textbox');
      const longMessage = 'a'.repeat(2001);
      
      fireEvent.change(textarea, { target: { value: longMessage } });
      
      const characterCount = screen.getByText('2001 / 2000 characters');
      expect(characterCount).toHaveStyle({ color: '#dc2626' });
    });
  });

  describe('Loading State', () => {
    it('should show loading text when loading', () => {
      render(<StatusUpdateForm onSubmit={mockOnSubmit} loading={true} />);
      
      const submitButton = screen.getByRole('button');
      expect(submitButton).toHaveTextContent('Adding...');
    });

    it('should disable textarea when loading', () => {
      render(<StatusUpdateForm onSubmit={mockOnSubmit} loading={true} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
    });

    it('should disable submit button when loading', () => {
      render(<StatusUpdateForm onSubmit={mockOnSubmit} loading={true} />);
      
      const submitButton = screen.getByRole('button');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Error Display', () => {
    it('should display error message from props', () => {
      render(
        <StatusUpdateForm
          onSubmit={mockOnSubmit}
          error="Failed to add comment"
        />
      );
      
      expect(screen.getByText('Failed to add comment')).toBeInTheDocument();
    });

    it('should display error in alert role', () => {
      render(
        <StatusUpdateForm
          onSubmit={mockOnSubmit}
          error="Failed to add comment"
        />
      );
      
      const errorBanner = screen.getByRole('alert');
      expect(errorBanner).toBeInTheDocument();
      expect(errorBanner).toHaveTextContent('Failed to add comment');
    });

    it('should not display error when error is null', () => {
      render(<StatusUpdateForm onSubmit={mockOnSubmit} error={null} />);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Submit Button State', () => {
    it('should disable submit button when message is empty', () => {
      render(<StatusUpdateForm onSubmit={mockOnSubmit} />);
      
      const submitButton = screen.getByRole('button');
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when message is not empty', () => {
      render(<StatusUpdateForm onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByRole('textbox');
      const submitButton = screen.getByRole('button');
      
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      expect(submitButton).not.toBeDisabled();
    });

    it('should disable submit button when message is whitespace only', () => {
      render(<StatusUpdateForm onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByRole('textbox');
      const submitButton = screen.getByRole('button');
      
      fireEvent.change(textarea, { target: { value: '   ' } });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('CSS Classes', () => {
    it('should apply base CSS class', () => {
      const { container } = render(<StatusUpdateForm onSubmit={mockOnSubmit} />);
      
      const form = container.querySelector('.status-update-form');
      expect(form).toBeInTheDocument();
    });

    it('should apply custom CSS class', () => {
      const { container } = render(
        <StatusUpdateForm onSubmit={mockOnSubmit} className="custom-class" />
      );
      
      const form = container.querySelector('.custom-class');
      expect(form).toBeInTheDocument();
    });

    it('should apply textarea CSS class', () => {
      render(<StatusUpdateForm onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('comment-textarea');
    });

    it('should apply submit button CSS class', () => {
      render(<StatusUpdateForm onSubmit={mockOnSubmit} />);
      
      const submitButton = screen.getByRole('button');
      expect(submitButton).toHaveClass('submit-button');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on textarea', () => {
      render(<StatusUpdateForm onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-label', 'Status update message');
    });

    it('should have aria-invalid when there is an error', () => {
      render(
        <StatusUpdateForm
          onSubmit={mockOnSubmit}
          error="Failed to add comment"
        />
      );
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });

    it('should not have aria-invalid when there is no error', () => {
      render(<StatusUpdateForm onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-invalid', 'false');
    });

    it('should have aria-busy on submit button when loading', () => {
      render(<StatusUpdateForm onSubmit={mockOnSubmit} loading={true} />);
      
      const submitButton = screen.getByRole('button');
      expect(submitButton).toHaveAttribute('aria-busy', 'true');
    });
  });
});
