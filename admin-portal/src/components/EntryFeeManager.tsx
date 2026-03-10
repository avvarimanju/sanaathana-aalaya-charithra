import React from 'react';
import './EntryFeeManager.css';

export interface EntryFeeOption {
  id: string;
  type: 'FREE' | 'PAID' | 'SEVA' | 'VIP' | 'CUSTOM';
  name: string;
  price: number;
  currency: string;
  description: string;
  waitingTime?: string;
  availability?: string;
  duration?: string;
  bookingRequired: boolean;
}

interface EntryFeeManagerProps {
  options: EntryFeeOption[];
  onChange: (options: EntryFeeOption[]) => void;
}

const EntryFeeManager: React.FC<EntryFeeManagerProps> = ({ options, onChange }) => {
  const handleAddOption = () => {
    const newOption: EntryFeeOption = {
      id: Date.now().toString(),
      type: 'FREE',
      name: '',
      price: 0,
      currency: 'INR',
      description: '',
      bookingRequired: false
    };
    onChange([...options, newOption]);
  };

  const handleRemoveOption = (id: string) => {
    if (options.length > 1) {
      onChange(options.filter(opt => opt.id !== id));
    } else {
      alert('At least one entry option is required');
    }
  };

  const handleOptionChange = (id: string, field: keyof EntryFeeOption, value: any) => {
    onChange(options.map(opt =>
      opt.id === id ? { ...opt, [field]: value } : opt
    ));
  };

  const generateSummary = () => {
    const types = new Set(options.map(opt => opt.type));
    if (types.size === 1 && types.has('FREE')) {
      return 'Free Entry';
    } else if (types.size === 1 && types.has('PAID')) {
      return 'Paid Entry';
    } else if (types.has('FREE') && types.has('PAID')) {
      return 'Free & Paid options available';
    } else {
      return `${types.size} entry options available`;
    }
  };

  return (
    <div className="entry-fee-manager">
      <div className="entry-fee-header">
        <h3>🎫 Entry Fee Options</h3>
        <p className="entry-fee-summary">Summary: {generateSummary()}</p>
      </div>

      <div className="entry-fee-options">
        {options.map((option, index) => (
          <div key={option.id} className="entry-fee-option-card">
            <div className="option-card-header">
              <span className="option-number">Option {index + 1}</span>
              {options.length > 1 && (
                <button
                  type="button"
                  className="remove-option-btn"
                  onClick={() => handleRemoveOption(option.id)}
                  title="Remove this option"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="option-card-body">
              <div className="option-row">
                <div className="option-field">
                  <label>Type *</label>
                  <select
                    value={option.type}
                    onChange={(e) => handleOptionChange(option.id, 'type', e.target.value)}
                    required
                  >
                    <option value="FREE">🆓 Free Entry</option>
                    <option value="PAID">💰 Paid Entry</option>
                    <option value="SEVA">🙏 Seva/Pooja</option>
                    <option value="VIP">⭐ VIP Darshan</option>
                    <option value="CUSTOM">🔧 Custom</option>
                  </select>
                </div>

                <div className="option-field">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={option.name}
                    onChange={(e) => handleOptionChange(option.id, 'name', e.target.value)}
                    placeholder="e.g., General Darshan, Special Entry"
                    required
                  />
                </div>
              </div>

              <div className="option-row">
                <div className="option-field">
                  <label>Price *</label>
                  <div className="price-input-group">
                    <input
                      type="number"
                      value={option.price}
                      onChange={(e) => handleOptionChange(option.id, 'price', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="1"
                      required
                    />
                    <select
                      value={option.currency}
                      onChange={(e) => handleOptionChange(option.id, 'currency', e.target.value)}
                      className="currency-select"
                    >
                      <option value="INR">₹ INR</option>
                      <option value="USD">$ USD</option>
                      <option value="EUR">€ EUR</option>
                    </select>
                  </div>
                  <small>{option.price === 0 ? 'Free' : `${option.currency} ${option.price}`}</small>
                </div>

                <div className="option-field">
                  <label>Waiting Time</label>
                  <input
                    type="text"
                    value={option.waitingTime || ''}
                    onChange={(e) => handleOptionChange(option.id, 'waitingTime', e.target.value)}
                    placeholder="e.g., 2-4 hours, 15 minutes"
                  />
                </div>
              </div>

              <div className="option-row">
                <div className="option-field">
                  <label>Availability</label>
                  <input
                    type="text"
                    value={option.availability || ''}
                    onChange={(e) => handleOptionChange(option.id, 'availability', e.target.value)}
                    placeholder="e.g., 24/7, 6 AM - 10 PM"
                  />
                </div>

                <div className="option-field">
                  <label>Duration</label>
                  <input
                    type="text"
                    value={option.duration || ''}
                    onChange={(e) => handleOptionChange(option.id, 'duration', e.target.value)}
                    placeholder="e.g., 30 minutes, 1 hour"
                  />
                </div>
              </div>

              <div className="option-field full-width">
                <label>Description</label>
                <textarea
                  value={option.description}
                  onChange={(e) => handleOptionChange(option.id, 'description', e.target.value)}
                  placeholder="Brief description of this entry option..."
                  rows={2}
                />
              </div>

              <div className="option-field checkbox-field">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={option.bookingRequired}
                    onChange={(e) => handleOptionChange(option.id, 'bookingRequired', e.target.checked)}
                  />
                  <span>Booking Required</span>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="add-option-btn"
        onClick={handleAddOption}
      >
        + Add Entry Option
      </button>
    </div>
  );
};

export default EntryFeeManager;
