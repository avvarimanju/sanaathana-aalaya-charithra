import React, { useState } from 'react';
import './PriceCalculatorPage.css';

interface PricingFormula {
  id: string;
  category: string;
  basePrice: number;
  perQRCodePrice: number;
  roundingRule: 'none' | 'nearest10' | 'nearest99' | 'nearest100';
  lastUpdated: string;
}

interface SimulationResult {
  entityId: string;
  entityName: string;
  qrCodeCount: number;
  currentPrice: number | null;
  currentSuggested: number;
  newSuggested: number;
  difference: number;
}

const PriceCalculatorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'formula' | 'simulation' | 'overrides'>('formula');
  
  // Formula state
  const [basePrice, setBasePrice] = useState('50');
  const [perQRPrice, setPerQRPrice] = useState('15');
  const [roundingRule, setRoundingRule] = useState<'none' | 'nearest10' | 'nearest99' | 'nearest100'>('nearest10');
  
  // Simulation state
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
  const [showSimulation, setShowSimulation] = useState(false);

  // Mock current formula
  const currentFormula: PricingFormula = {
    id: '1',
    category: 'default',
    basePrice: 50,
    perQRCodePrice: 15,
    roundingRule: 'nearest10',
    lastUpdated: '2024-02-20'
  };

  // Mock override data
  const mockOverrides = [
    { id: '1', entityName: 'Lepakshi Temple', qrCodeCount: 7, suggestedPrice: 155, actualPrice: 99, difference: -56, percentage: -36, reason: 'Promotional pricing', date: '2024-02-20' },
    { id: '2', entityName: 'Tirumala Temple', qrCodeCount: 12, suggestedPrice: 230, actualPrice: 199, difference: -31, percentage: -13, reason: 'Market competition', date: '2024-02-19' },
  ];

  const calculatePrice = (qrCount: number, base: number, perQR: number, rounding: string): number => {
    const raw = base + (qrCount * perQR);
    
    switch (rounding) {
      case 'nearest10':
        return Math.round(raw / 10) * 10;
      case 'nearest99':
        return Math.floor(raw / 100) * 100 + 99;
      case 'nearest100':
        return Math.round(raw / 100) * 100;
      default:
        return raw;
    }
  };

  const handleSimulate = () => {
    const base = parseFloat(basePrice);
    const perQR = parseFloat(perQRPrice);
    
    if (isNaN(base) || isNaN(perQR)) {
      alert('Please enter valid numbers');
      return;
    }

    // Mock entities for simulation
    const mockEntities = [
      { id: '1', name: 'Lepakshi Temple', qrCodeCount: 7, currentPrice: 99 },
      { id: '2', name: 'Tirumala Temple', qrCodeCount: 12, currentPrice: 199 },
      { id: '3', name: 'Hampi Temple', qrCodeCount: 15, currentPrice: null },
      { id: '4', name: 'Tirupathi Tour', qrCodeCount: 25, currentPrice: 399 },
    ];

    const results: SimulationResult[] = mockEntities.map(entity => {
      const currentSuggested = calculatePrice(
        entity.qrCodeCount,
        currentFormula.basePrice,
        currentFormula.perQRCodePrice,
        currentFormula.roundingRule
      );
      const newSuggested = calculatePrice(
        entity.qrCodeCount,
        base,
        perQR,
        roundingRule
      );

      return {
        entityId: entity.id,
        entityName: entity.name,
        qrCodeCount: entity.qrCodeCount,
        currentPrice: entity.currentPrice,
        currentSuggested,
        newSuggested,
        difference: newSuggested - currentSuggested
      };
    });

    setSimulationResults(results);
    setShowSimulation(true);
  };

  const handleApplyFormula = () => {
    if (!window.confirm('Are you sure you want to apply this formula to all pricing entities? This will update all suggested prices.')) {
      return;
    }

    // TODO: Call API to update formula
    console.log('Applying formula:', { basePrice, perQRPrice, roundingRule });
    alert('Formula applied successfully! Suggested prices have been recalculated.');
    setShowSimulation(false);
  };

  const calculateStats = () => {
    if (simulationResults.length === 0) return null;

    const avgChange = simulationResults.reduce((sum, r) => sum + r.difference, 0) / simulationResults.length;
    const minPrice = Math.min(...simulationResults.map(r => r.newSuggested));
    const maxPrice = Math.max(...simulationResults.map(r => r.newSuggested));

    return { avgChange, minPrice, maxPrice };
  };

  const stats = calculateStats();

  return (
    <div className="price-calculator-page">
      <div className="page-header">
        <h2>Price Calculator</h2>
        <p>Configure pricing formulas and simulate price changes</p>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'formula' ? 'active' : ''}`}
          onClick={() => setActiveTab('formula')}
        >
          Formula Configuration
        </button>
        <button 
          className={`tab ${activeTab === 'simulation' ? 'active' : ''}`}
          onClick={() => setActiveTab('simulation')}
        >
          Simulation
        </button>
        <button 
          className={`tab ${activeTab === 'overrides' ? 'active' : ''}`}
          onClick={() => setActiveTab('overrides')}
        >
          Price Overrides
        </button>
      </div>

      {activeTab === 'formula' && (
        <div className="formula-tab">
          <div className="formula-section">
            <div className="current-formula">
              <h3>Current Formula</h3>
              <div className="formula-display">
                <div className="formula-equation">
                  Price = ₹{currentFormula.basePrice} + (QR Count × ₹{currentFormula.perQRCodePrice})
                </div>
                <div className="formula-details">
                  <span>Rounding: {currentFormula.roundingRule}</span>
                  <span>Last Updated: {currentFormula.lastUpdated}</span>
                </div>
              </div>
            </div>

            <div className="formula-editor">
              <h3>Edit Formula</h3>
              
              <div className="form-group">
                <label>Base Price (₹)</label>
                <input
                  type="number"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="form-control"
                  min="0"
                  step="1"
                />
                <small>The minimum price for any entity</small>
              </div>

              <div className="form-group">
                <label>Price per QR Code (₹)</label>
                <input
                  type="number"
                  value={perQRPrice}
                  onChange={(e) => setPerQRPrice(e.target.value)}
                  className="form-control"
                  min="0"
                  step="1"
                />
                <small>Additional price for each QR code</small>
              </div>

              <div className="form-group">
                <label>Rounding Rule</label>
                <select
                  value={roundingRule}
                  onChange={(e) => setRoundingRule(e.target.value as any)}
                  className="form-control"
                >
                  <option value="none">No Rounding</option>
                  <option value="nearest10">Round to Nearest ₹10</option>
                  <option value="nearest99">Round to ₹X99 (e.g., ₹99, ₹199)</option>
                  <option value="nearest100">Round to Nearest ₹100</option>
                </select>
                <small>How to round the calculated price</small>
              </div>

              <div className="formula-preview">
                <h4>Formula Preview</h4>
                <div className="preview-equation">
                  Price = ₹{basePrice} + (QR Count × ₹{perQRPrice})
                </div>
                <div className="preview-examples">
                  <div className="example">
                    <span>5 QR Codes:</span>
                    <strong>₹{calculatePrice(5, parseFloat(basePrice) || 0, parseFloat(perQRPrice) || 0, roundingRule)}</strong>
                  </div>
                  <div className="example">
                    <span>10 QR Codes:</span>
                    <strong>₹{calculatePrice(10, parseFloat(basePrice) || 0, parseFloat(perQRPrice) || 0, roundingRule)}</strong>
                  </div>
                  <div className="example">
                    <span>20 QR Codes:</span>
                    <strong>₹{calculatePrice(20, parseFloat(basePrice) || 0, parseFloat(perQRPrice) || 0, roundingRule)}</strong>
                  </div>
                </div>
              </div>

              <button className="btn-primary btn-large" onClick={handleSimulate}>
                Simulate
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'simulation' && (
        <div className="simulation-tab">
          {!showSimulation ? (
            <div className="empty-state">
              <p>Configure a formula in the "Formula Configuration" tab and click "Simulate" to see results.</p>
            </div>
          ) : (
            <>
              <div className="simulation-header">
                <h3>Simulation Results</h3>
                <p>Preview how the new formula affects all pricing entities</p>
              </div>

              {stats && (
                <div className="stats-grid">
                  <div className="stat-card">
                    <span className="stat-label">Average Change</span>
                    <span className={`stat-value ${stats.avgChange >= 0 ? 'positive' : 'negative'}`}>
                      {stats.avgChange >= 0 ? '+' : ''}₹{stats.avgChange.toFixed(0)}
                    </span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Minimum Price</span>
                    <span className="stat-value">₹{stats.minPrice}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Maximum Price</span>
                    <span className="stat-value">₹{stats.maxPrice}</span>
                  </div>
                </div>
              )}

              <table className="simulation-table">
                <thead>
                  <tr>
                    <th>Entity</th>
                    <th>QR Codes</th>
                    <th>Current Price</th>
                    <th>Current Suggested</th>
                    <th>New Suggested</th>
                    <th>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {simulationResults.map(result => (
                    <tr key={result.entityId}>
                      <td>{result.entityName}</td>
                      <td>{result.qrCodeCount}</td>
                      <td>{result.currentPrice !== null ? `₹${result.currentPrice}` : '-'}</td>
                      <td>₹{result.currentSuggested}</td>
                      <td>₹{result.newSuggested}</td>
                      <td className={result.difference >= 0 ? 'positive' : 'negative'}>
                        {result.difference >= 0 ? '+' : ''}₹{result.difference}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="simulation-actions">
                <button className="btn-secondary" onClick={() => setShowSimulation(false)}>
                  Cancel
                </button>
                <button className="btn-primary btn-large" onClick={handleApplyFormula}>
                  Apply Formula
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'overrides' && (
        <div className="overrides-tab">
          <div className="overrides-header">
            <h3>Price Override Report</h3>
            <p>Track when administrators override suggested prices</p>
          </div>

          <div className="filters">
            <input type="date" className="date-input" placeholder="From Date" />
            <input type="date" className="date-input" placeholder="To Date" />
            <select className="filter-select">
              <option>All Administrators</option>
              <option>admin@example.com</option>
            </select>
            <button className="btn-primary">Filter</button>
          </div>

          <div className="override-stats">
            <div className="stat-card">
              <span className="stat-label">Total Overrides</span>
              <span className="stat-value">{mockOverrides.length}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Average Override</span>
              <span className="stat-value negative">-24%</span>
            </div>
          </div>

          <table className="overrides-table">
            <thead>
              <tr>
                <th>Entity</th>
                <th>QR Codes</th>
                <th>Suggested</th>
                <th>Actual</th>
                <th>Difference</th>
                <th>%</th>
                <th>Reason</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {mockOverrides.map(override => (
                <tr key={override.id}>
                  <td>{override.entityName}</td>
                  <td>{override.qrCodeCount}</td>
                  <td>₹{override.suggestedPrice}</td>
                  <td>₹{override.actualPrice}</td>
                  <td className={override.difference >= 0 ? 'positive' : 'negative'}>
                    {override.difference >= 0 ? '+' : ''}₹{override.difference}
                  </td>
                  <td className={override.percentage >= 0 ? 'positive' : 'negative'}>
                    {override.percentage >= 0 ? '+' : ''}{override.percentage}%
                  </td>
                  <td>{override.reason}</td>
                  <td>{override.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PriceCalculatorPage;
