import React, { useState, useEffect } from 'react';
import { pricingApi, PriceSuggestion } from '../api/pricingApi';
import './PricingManagementPage.css';

const PricingManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'configure' | 'history' | 'bulk'>('configure');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'temple' | 'temple_group'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'qrCount'>('name');
  const [entities, setEntities] = useState<PriceSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<PriceSuggestion | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  useEffect(() => {
    loadPricingData();
  }, []);

  const loadPricingData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await pricingApi.getPriceSuggestions();
      setEntities(response.items);
    } catch (err: any) {
      setError(err.message || 'Failed to load pricing data');
      console.error('Error loading pricing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntities = entities
    .filter(e => filterType === 'all' || e.entityType.toLowerCase() === filterType)
    .filter(e => e.entityName.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.entityName.localeCompare(b.entityName);
      if (sortBy === 'price') return (b.currentPrice || 0) - (a.currentPrice || 0);
      return b.qrCodeCount - a.qrCodeCount;
    });

  const handlePriceChange = (value: string) => {
    setPriceInput(value);
    const price = parseFloat(value);
    
    if (isNaN(price) || price < 0) {
      setShowWarning(true);
      setWarningMessage('Price must be a non-negative number');
    } else if (price > 0 && price < 10) {
      setShowWarning(true);
      setWarningMessage('⚠️ Warning: Price is below ₹10. This is unusually low.');
    } else if (price > 5000) {
      setShowWarning(true);
      setWarningMessage('⚠️ Confirmation Required: Price exceeds ₹5000. Please confirm this is correct.');
    } else {
      setShowWarning(false);
      setWarningMessage('');
    }
  };

  const handleSetPrice = async () => {
    if (!selectedEntity) return;
    
    const price = parseFloat(priceInput);
    if (isNaN(price) || price < 0) {
      alert('Invalid price');
      return;
    }

    try {
      await pricingApi.setPriceConfiguration({
        entityId: selectedEntity.entityId,
        entityType: selectedEntity.entityType,
        priceAmount: price
      });
      
      alert(`Price set successfully for ${selectedEntity.entityName}: ₹${price}`);
      setSelectedEntity(null);
      setPriceInput('');
      loadPricingData(); // Reload data
    } catch (err: any) {
      alert(`Failed to set price: ${err.message}`);
    }
  };

  const handleAcceptSuggested = async (entity: PriceSuggestion) => {
    if (!entity.suggestedPrice) return;
    
    try {
      await pricingApi.setPriceConfiguration({
        entityId: entity.entityId,
        entityType: entity.entityType,
        priceAmount: entity.suggestedPrice
      });
      
      alert(`Suggested price accepted for ${entity.entityName}: ₹${entity.suggestedPrice}`);
      loadPricingData(); // Reload data
    } catch (err: any) {
      alert(`Failed to accept suggested price: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="pricing-management-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading pricing data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pricing-management-page">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>Error Loading Pricing Data</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={loadPricingData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pricing-management-page">
      <div className="page-header">
        <h2>Pricing Management</h2>
        <p>Configure and manage pricing for temples and temple groups</p>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'configure' ? 'active' : ''}`}
          onClick={() => setActiveTab('configure')}
        >
          Configure Prices
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Price History
        </button>
        <button 
          className={`tab ${activeTab === 'bulk' ? 'active' : ''}`}
          onClick={() => setActiveTab('bulk')}
        >
          Bulk Updates
        </button>
      </div>

      {activeTab === 'configure' && (
        <div className="configure-tab">
          <div className="filters">
            <input
              type="text"
              placeholder="Search temples..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            
            <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="filter-select">
              <option value="all">All Types</option>
              <option value="temple">Temples Only</option>
              <option value="temple_group">Temple Groups Only</option>
            </select>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="filter-select">
              <option value="name">Sort by Name</option>
              <option value="price">Sort by Price</option>
              <option value="qrCount">Sort by QR Count</option>
            </select>
          </div>

          <div className="pricing-grid">
            {filteredEntities.map(entity => (
              <div key={entity.entityId} className="pricing-card">
                <div className="card-header">
                  <h3>{entity.entityName}</h3>
                  <span className={`type-badge ${entity.entityType.toLowerCase()}`}>
                    {entity.entityType === 'TEMPLE' ? '🛕 Temple' : '📦 Group'}
                  </span>
                </div>

                <div className="card-body">
                  <div className="info-row">
                    <span className="label">QR Codes:</span>
                    <span className="value">{entity.qrCodeCount}</span>
                  </div>

                  <div className="info-row">
                    <span className="label">Current Price:</span>
                    <span className="value price">
                      {entity.currentPrice !== null ? `₹${entity.currentPrice}` : 'Not Set'}
                    </span>
                  </div>

                  <div className="info-row">
                    <span className="label">Suggested Price:</span>
                    <span className="value suggested">₹{entity.suggestedPrice}</span>
                  </div>

                  {entity.currentPrice !== null && entity.suggestedPrice !== null && entity.difference !== null && (
                    <div className="info-row">
                      <span className="label">Difference:</span>
                      <span className={`value ${entity.difference > 0 ? 'below' : 'above'}`}>
                        {entity.difference > 0 ? '↓' : '↑'} 
                        ₹{Math.abs(entity.difference)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="card-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => setSelectedEntity(entity)}
                  >
                    Set Custom Price
                  </button>
                  {entity.suggestedPrice && (
                    <button 
                      className="btn-primary"
                      onClick={() => handleAcceptSuggested(entity)}
                    >
                      Accept Suggested
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="history-tab">
          <div className="filters">
            <input type="date" className="date-input" placeholder="From Date" />
            <input type="date" className="date-input" placeholder="To Date" />
            <button className="btn-primary">Filter</button>
          </div>

          <table className="history-table">
            <thead>
              <tr>
                <th>Entity</th>
                <th>Type</th>
                <th>Previous Price</th>
                <th>New Price</th>
                <th>Change</th>
                <th>Date</th>
                <th>Updated By</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Lepakshi Temple</td>
                <td>Temple</td>
                <td>₹79</td>
                <td>₹99</td>
                <td className="positive">+₹20</td>
                <td>2024-02-20</td>
                <td>admin@example.com</td>
              </tr>
              <tr>
                <td>Tirumala Temple</td>
                <td>Temple</td>
                <td>₹149</td>
                <td>₹199</td>
                <td className="positive">+₹50</td>
                <td>2024-02-19</td>
                <td>admin@example.com</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'bulk' && (
        <div className="bulk-tab">
          <div className="bulk-form">
            <h3>Bulk Price Update</h3>
            <p>Select multiple entities and apply a price change</p>
            
            <div className="form-group">
              <label>Update Type:</label>
              <select className="form-control">
                <option>Set Fixed Price</option>
                <option>Increase by Percentage</option>
                <option>Decrease by Percentage</option>
                <option>Apply Suggested Prices</option>
              </select>
            </div>

            <div className="form-group">
              <label>Value:</label>
              <input type="number" className="form-control" placeholder="Enter value" />
            </div>

            <div className="form-group">
              <label>Select Entities:</label>
              <div className="entity-checkboxes">
                {entities.map((entity: any) => (
                  <label key={entity.id} className="checkbox-label">
                    <input type="checkbox" />
                    {entity.name} ({entity.type})
                  </label>
                ))}
              </div>
            </div>

            <button className="btn-primary btn-large">Preview Changes</button>
          </div>
        </div>
      )}

      {selectedEntity && (
        <div className="modal-overlay" onClick={() => setSelectedEntity(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Set Price for {selectedEntity.entityName}</h3>
              <button className="close-btn" onClick={() => setSelectedEntity(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="price-info">
                <div className="info-item">
                  <span className="label">QR Codes:</span>
                  <span className="value">{selectedEntity.qrCodeCount}</span>
                </div>
                <div className="info-item">
                  <span className="label">Suggested Price:</span>
                  <span className="value">₹{selectedEntity.suggestedPrice}</span>
                </div>
                <div className="info-item">
                  <span className="label">Current Price:</span>
                  <span className="value">
                    {selectedEntity.currentPrice !== null ? `₹${selectedEntity.currentPrice}` : 'Not Set'}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label>New Price (₹):</label>
                <input
                  type="number"
                  value={priceInput}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  className="form-control"
                  placeholder="Enter price in rupees"
                  min="0"
                  step="1"
                />
              </div>

              {showWarning && (
                <div className={`alert ${warningMessage.includes('⚠️') ? 'warning' : 'error'}`}>
                  {warningMessage}
                </div>
              )}

              {priceInput && !showWarning && selectedEntity.suggestedPrice && (
                <div className="price-comparison">
                  <p>
                    Difference from suggested: 
                    <strong className={parseFloat(priceInput) < selectedEntity.suggestedPrice ? 'below' : 'above'}>
                      {' '}₹{Math.abs(parseFloat(priceInput) - selectedEntity.suggestedPrice)}
                      {' '}({parseFloat(priceInput) < selectedEntity.suggestedPrice ? 'below' : 'above'})
                    </strong>
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedEntity(null)}>Cancel</button>
              <button 
                className="btn-primary" 
                onClick={handleSetPrice}
                disabled={!priceInput || showWarning && !warningMessage.includes('⚠️')}
              >
                Set Price
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingManagementPage;
