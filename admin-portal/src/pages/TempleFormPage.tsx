import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { templeApi } from '../api/templeApi';
import EntryFeeManager, { EntryFeeOption } from '../components/EntryFeeManager';
import './TempleFormPage.css';

interface TempleFormData {
  name: string;
  location: {
    state: string;
    city: string;
    address: string;
    district: string;
  };
  deity: string;
  description: string;
  historicalSignificance: string;
  architecturalStyle: string;
  builtYear: string;
  imageUrl: string;
  accessMode: 'FREE' | 'PAID' | 'HYBRID';
  status: 'active' | 'inactive';
  entryFeeOptions?: EntryFeeOption[];
}

const TempleFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<TempleFormData>({
    name: '',
    location: {
      state: '',
      city: '',
      address: '',
      district: ''
    },
    deity: '',
    description: '',
    historicalSignificance: '',
    architecturalStyle: '',
    builtYear: '',
    imageUrl: '',
    accessMode: 'FREE',
    status: 'active',
    entryFeeOptions: [
      {
        id: '1',
        type: 'FREE',
        name: 'General Entry',
        price: 0,
        currency: 'INR',
        description: '',
        bookingRequired: false
      }
    ]
  });

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    if (isEditMode && id) {
      loadTempleData(id);
    }
  }, [id, isEditMode]);

  const loadTempleData = async (templeId: string) => {
    setFetchingData(true);
    try {
      const temple = await templeApi.getTemple(templeId);
      
      // Migrate old accessMode to entryFeeOptions if needed
      let entryFeeOptions = (temple as any).entryFeeOptions;
      if (!entryFeeOptions || entryFeeOptions.length === 0) {
        entryFeeOptions = migrateAccessModeToEntryFeeOptions(temple.accessMode);
      }
      
      setFormData({
        name: temple.name,
        location: {
          ...temple.location,
          district: temple.location.district || ''
        },
        deity: (temple as any).deity || '',
        description: temple.description,
        historicalSignificance: (temple as any).historicalSignificance || '',
        architecturalStyle: (temple as any).architecturalStyle || '',
        builtYear: (temple as any).builtYear || '',
        imageUrl: (temple as any).imageUrl || '',
        accessMode: temple.accessMode,
        status: temple.status,
        entryFeeOptions: entryFeeOptions
      });
      if ((temple as any).imageUrl) {
        setImagePreview((temple as any).imageUrl);
      }
    } catch (err) {
      setError('Failed to load temple data');
      console.error(err);
    } finally {
      setFetchingData(false);
    }
  };

  // Helper function to migrate old accessMode to new entryFeeOptions
  const migrateAccessModeToEntryFeeOptions = (accessMode: string): EntryFeeOption[] => {
    switch (accessMode) {
      case 'FREE':
        return [{
          id: '1',
          type: 'FREE',
          name: 'General Entry',
          price: 0,
          currency: 'INR',
          description: 'Free entry',
          bookingRequired: false
        }];
      case 'PAID':
        return [{
          id: '1',
          type: 'PAID',
          name: 'Entry Fee',
          price: 0,
          currency: 'INR',
          description: 'Paid entry',
          bookingRequired: false
        }];
      case 'HYBRID':
        return [
          {
            id: '1',
            type: 'FREE',
            name: 'General Entry',
            price: 0,
            currency: 'INR',
            description: 'Free entry',
            bookingRequired: false
          },
          {
            id: '2',
            type: 'PAID',
            name: 'Special Entry',
            price: 0,
            currency: 'INR',
            description: 'Paid entry',
            bookingRequired: false
          }
        ];
      default:
        return [{
          id: '1',
          type: 'FREE',
          name: 'General Entry',
          price: 0,
          currency: 'INR',
          description: '',
          bookingRequired: false
        }];
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Handle nested location fields
    if (name === 'city' || name === 'state' || name === 'district' || name === 'address') {
      setFormData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          [name]: value
        }
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      setImageFile(file);
      setError('');

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // TODO: If imageFile exists, upload to S3 first
      // For now, we'll use the imageUrl field
      
      const templeData = {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        accessMode: formData.accessMode,
        status: formData.status,
        ...(formData.deity && { deity: formData.deity }),
        ...(formData.historicalSignificance && { historicalSignificance: formData.historicalSignificance }),
        ...(formData.architecturalStyle && { architecturalStyle: formData.architecturalStyle }),
        ...(formData.builtYear && { builtYear: formData.builtYear }),
        ...(formData.imageUrl && { imageUrl: formData.imageUrl }),
        ...(formData.entryFeeOptions && { entryFeeOptions: formData.entryFeeOptions })
      };
      
      if (isEditMode && id) {
        // Update existing temple
        await templeApi.updateTemple(id, templeData as any);
        alert('Temple updated successfully!');
      } else {
        // Create new temple
        await templeApi.createTemple(templeData as any);
        alert('Temple created successfully!');
      }
      
      navigate('/temples');
    } catch (err: any) {
      setError(err.message || 'Failed to save temple. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/temples');
  };

  return (
    <div className="temple-form-page">
      <div className="page-header">
        <h1>{isEditMode ? '✏️ Edit Temple' : '➕ New Temple'}</h1>
        <p>{isEditMode ? 'Update temple information' : 'Add a new temple to the system'}</p>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {fetchingData ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading temple data...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="temple-form">
        <div className="form-section">
          <h2>Basic Information</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Temple Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., Veerabhadra Temple"
              />
            </div>

            <div className="form-group">
              <label htmlFor="deity">Main Deity *</label>
              <input
                type="text"
                id="deity"
                name="deity"
                value={formData.deity}
                onChange={handleChange}
                required
                placeholder="e.g., Veerabhadra, Shiva, Vishnu"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">Location *</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.location.city}
                onChange={handleChange}
                required
                placeholder="e.g., Lepakshi"
              />
            </div>

            <div className="form-group">
              <label htmlFor="district">District *</label>
              <input
                type="text"
                id="district"
                name="district"
                value={formData.location.district}
                onChange={handleChange}
                required
                placeholder="e.g., Anantapur"
              />
            </div>

            <div className="form-group">
              <label htmlFor="state">State *</label>
              <select
                id="state"
                name="state"
                value={formData.location.state}
                onChange={handleChange}
                required
              >
                <option value="">Select State</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Telangana">Telangana</option>
                <option value="Kerala">Kerala</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Historical Details</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="builtYear">Built Year</label>
              <input
                type="text"
                id="builtYear"
                name="builtYear"
                value={formData.builtYear}
                onChange={handleChange}
                placeholder="e.g., 1530 or 16th Century"
              />
            </div>

            <div className="form-group">
              <label htmlFor="architecturalStyle">Architectural Style</label>
              <input
                type="text"
                id="architecturalStyle"
                name="architecturalStyle"
                value={formData.architecturalStyle}
                onChange={handleChange}
                placeholder="e.g., Vijayanagara, Dravidian, Nagara"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Brief description of the temple..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="historicalSignificance">Historical Significance</label>
            <textarea
              id="historicalSignificance"
              name="historicalSignificance"
              value={formData.historicalSignificance}
              onChange={handleChange}
              rows={4}
              placeholder="Historical importance and significance..."
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Media & Status</h2>
          
          <div className="form-group">
            <label>Temple Image</label>
            <div className="image-upload-section">
              <div className="upload-options">
                <div className="upload-option">
                  <label className="upload-label">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      style={{ display: 'none' }}
                    />
                    <div className="upload-button">
                      📤 Upload Image
                    </div>
                  </label>
                  <small>Upload from your computer (max 5MB)</small>
                </div>

                <div className="upload-divider">OR</div>

                <div className="upload-option">
                  <input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/temple-image.jpg"
                    className="url-input"
                  />
                  <small>Enter image URL from the web</small>
                </div>
              </div>

              {(imagePreview || formData.imageUrl) && (
                <div className="image-preview-container">
                  <div className="image-preview">
                    <img
                      src={imagePreview || formData.imageUrl}
                      alt="Temple preview"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={handleRemoveImage}
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                  <small className="preview-label">
                    {imageFile ? `Selected: ${imageFile.name}` : 'Image from URL'}
                  </small>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="status">Status *</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <h2>Entry Fee Information</h2>
          <EntryFeeManager
            options={formData.entryFeeOptions || []}
            onChange={(options) => setFormData({ ...formData, entryFeeOptions: options })}
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : isEditMode ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
      )}
    </div>
  );
};

export default TempleFormPage;
