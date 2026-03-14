/**
 * API Test Page
 * Simple page to test API connectivity and operations
 * 
 * Add this route to App.tsx:
 * <Route path="/api-test" element={<ApiTestPage />} />
 */

import { useState } from 'react';
import { apiClient, templeApi, pricingApi, calculatorApi } from '../api';

export default function ApiTestPage() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string, isError = false) => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = isError ? '❌' : '✅';
    setResults(prev => [`${prefix} [${timestamp}] ${message}`, ...prev]);
  };

  const runTest = async (name: string, testFn: () => Promise<void>) => {
    setLoading(true);
    addResult(`Running: ${name}...`);
    try {
      await testFn();
      addResult(`${name} - SUCCESS`);
    } catch (error: any) {
      addResult(`${name} - FAILED: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  // Test 1: Health Check
  const testHealthCheck = () => runTest('Health Check', async () => {
    const health = await apiClient.healthCheck();
    addResult(`Server status: ${health.status}, Environment: ${health.environment}`);
  });

  // Test 2: Create Temple
  const testCreateTemple = () => runTest('Create Temple', async () => {
    const temple = await templeApi.createTemple({
      name: `Test Temple ${Date.now()}`,
      description: 'A test temple created from API test page',
      location: {
        state: 'Karnataka',
        city: 'Bangalore',
        address: '123 Test Street'
      },
      accessMode: 'HYBRID'
    });
    addResult(`Created temple: ${temple.name} (ID: ${temple.templeId})`);
  });

  // Test 3: List Temples
  const testListTemples = () => runTest('List Temples', async () => {
    const result = await templeApi.listTemples({ limit: 10 });
    addResult(`Found ${result.total} temples, showing ${result.items.length}`);
    result.items.forEach(t => {
      addResult(`  - ${t.name} (${t.location.state})`);
    });
  });

  // Test 4: Create Temple and Set Price
  const testCreateAndPrice = () => runTest('Create Temple & Set Price', async () => {
    // Create temple
    const temple = await templeApi.createTemple({
      name: `Priced Temple ${Date.now()}`,
      description: 'Temple with pricing',
      location: {
        state: 'Tamil Nadu',
        city: 'Chennai',
        address: '456 Temple Road'
      },
      accessMode: 'PAID'
    });
    addResult(`Created temple: ${temple.name}`);

    // Set price
    const price = await pricingApi.setPriceConfiguration({
      entityId: temple.templeId,
      entityType: 'TEMPLE',
      priceAmount: 150
    });
    addResult(`Set price: ₹${price.priceAmount}`);

    // Get price
    const retrieved = await pricingApi.getPriceConfiguration(temple.templeId, 'TEMPLE');
    addResult(`Retrieved price: ₹${retrieved?.priceAmount}`);
  });

  // Test 5: Create Artifact
  const testCreateArtifact = () => runTest('Create Temple & Artifact', async () => {
    // Create temple first
    const temple = await templeApi.createTemple({
      name: `Temple with Artifact ${Date.now()}`,
      description: 'Temple for artifact testing',
      location: {
        state: 'Kerala',
        city: 'Kochi',
        address: '789 Heritage Lane'
      },
      accessMode: 'HYBRID'
    });
    addResult(`Created temple: ${temple.name}`);

    // Create artifact
    const artifact = await templeApi.createArtifact({
      templeId: temple.templeId,
      name: 'Main Deity Statue',
      description: 'Central deity in the main hall'
    });
    addResult(`Created artifact: ${artifact.name}`);
    addResult(`QR Code ID: ${artifact.qrCodeId}`);
    addResult(`QR Code URL: ${artifact.qrCodeImageUrl}`);
  });

  // Test 6: Price Calculator
  const testPriceCalculator = () => runTest('Price Calculator', async () => {
    // Set formula
    const formula = await calculatorApi.setPricingFormula({
      category: 'DEFAULT',
      basePrice: 50,
      perQRCodePrice: 15,
      roundingRule: { type: 'nearest10', direction: 'nearest' },
      discountFactor: 0.1
    });
    addResult(`Set formula: Base ₹${formula.basePrice}, Per-QR ₹${formula.perQRCodePrice}`);

    // Create temple
    const temple = await templeApi.createTemple({
      name: `Calculator Test ${Date.now()}`,
      description: 'For calculator testing',
      location: {
        state: 'Maharashtra',
        city: 'Mumbai',
        address: '321 Test Avenue'
      },
      accessMode: 'PAID'
    });

    // Calculate suggested price
    const result = await calculatorApi.calculateSuggestedPrice({
      entityId: temple.templeId,
      entityType: 'TEMPLE',
      qrCodeCount: 10
    });
    addResult(`Suggested price for 10 QR codes: ₹${result.suggestedPrice}`);
    addResult(`Calculation: Base ₹${result.calculation.baseAmount} + QR ₹${result.calculation.qrCodeAmount} - Discount ₹${result.calculation.discount} = ₹${result.suggestedPrice}`);
  });

  // Test 7: Full Workflow
  const testFullWorkflow = () => runTest('Full Workflow', async () => {
    // 1. Create temple
    const temple = await templeApi.createTemple({
      name: `Full Test Temple ${Date.now()}`,
      description: 'Complete workflow test',
      location: {
        state: 'Rajasthan',
        city: 'Jaipur',
        address: '555 Palace Road'
      },
      accessMode: 'PAID'
    });
    addResult(`1. Created temple: ${temple.name}`);

    // 2. Create artifacts
    const artifact1 = await templeApi.createArtifact({
      templeId: temple.templeId,
      name: 'Artifact 1',
      description: 'First artifact'
    });
    const artifact2 = await templeApi.createArtifact({
      templeId: temple.templeId,
      name: 'Artifact 2',
      description: 'Second artifact'
    });
    addResult(`2. Created 2 artifacts`);

    // 3. Calculate suggested price
    const suggested = await calculatorApi.calculateSuggestedPrice({
      entityId: temple.templeId,
      entityType: 'TEMPLE',
      qrCodeCount: 2
    });
    addResult(`3. Suggested price: ₹${suggested.suggestedPrice}`);

    // 4. Set price (override)
    const price = await pricingApi.setPriceConfiguration({
      entityId: temple.templeId,
      entityType: 'TEMPLE',
      priceAmount: 200,
      overrideReason: 'Premium temple'
    });
    addResult(`4. Set price: ₹${price.priceAmount} (override)`);

    // 5. Get price history
    const history = await pricingApi.getPriceHistory(temple.templeId, {
      entityType: 'TEMPLE',
      limit: 5
    });
    addResult(`5. Price history: ${history.length} entries`);

    // 6. List artifacts
    const artifacts = await templeApi.listArtifacts(temple.templeId);
    addResult(`6. Listed artifacts: ${artifacts.items.length} found`);

    addResult('✨ Full workflow completed successfully!');
  });

  // Clear results
  const clearResults = () => {
    setResults([]);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>API Integration Test Page</h1>
      <p>Test the connection between admin dashboard and local backend API.</p>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={testHealthCheck} disabled={loading} className="btn-primary">
          1. Health Check
        </button>
        <button onClick={testCreateTemple} disabled={loading} className="btn-primary">
          2. Create Temple
        </button>
        <button onClick={testListTemples} disabled={loading} className="btn-primary">
          3. List Temples
        </button>
        <button onClick={testCreateAndPrice} disabled={loading} className="btn-primary">
          4. Create & Price
        </button>
        <button onClick={testCreateArtifact} disabled={loading} className="btn-primary">
          5. Create Artifact
        </button>
        <button onClick={testPriceCalculator} disabled={loading} className="btn-primary">
          6. Price Calculator
        </button>
        <button onClick={testFullWorkflow} disabled={loading} className="btn-primary">
          7. Full Workflow
        </button>
        <button onClick={clearResults} className="btn-secondary">
          Clear Results
        </button>
      </div>

      {loading && (
        <div style={{ padding: '10px', background: '#fff3cd', borderRadius: '4px', marginBottom: '10px' }}>
          ⏳ Running test...
        </div>
      )}

      <div style={{ 
        background: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        maxHeight: '600px',
        overflowY: 'auto'
      }}>
        <h3>Test Results:</h3>
        {results.length === 0 ? (
          <p style={{ color: '#6c757d' }}>No tests run yet. Click a button above to start testing.</p>
        ) : (
          <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
            {results.map((result, index) => (
              <div 
                key={index} 
                style={{ 
                  padding: '8px',
                  borderBottom: '1px solid #dee2e6',
                  color: result.includes('❌') ? '#dc3545' : '#000'
                }}
              >
                {result}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#e7f3ff', borderRadius: '8px' }}>
        <h4>Prerequisites:</h4>
        <ul>
          <li>✅ LocalStack running on port 4566</li>
          <li>✅ Database tables initialized</li>
          <li>✅ Backend server running on port 4000</li>
          <li>✅ Admin dashboard running on port 5173</li>
        </ul>
        <p><strong>Check backend:</strong> <code>curl http://localhost:4000/health</code></p>
      </div>
    </div>
  );
}
