#!/bin/bash
# Run Authentication Service Tests
# Requirements: 12.1, 12.2

set -e

echo "Running authentication service tests..."

# Set Python path
export PYTHONPATH="${PYTHONPATH}:$(pwd)/src"

# Run unit tests
echo ""
echo "Running unit tests..."
python -m pytest src/auth/utils/test_rate_limiter.py -v

# Check if property-based tests exist (optional)
if [ -d "src/auth/tests/property" ]; then
    echo ""
    echo "Running property-based tests..."
    python -m pytest src/auth/tests/property/ -v --hypothesis-show-statistics
else
    echo ""
    echo "⚠ Property-based tests not found (optional tests skipped)"
fi

# Generate coverage report
echo ""
echo "Generating test coverage report..."
python -m pytest src/auth/ --cov=src/auth --cov-report=html --cov-report=term

echo ""
echo "✓ All tests completed!"
echo "Coverage report: htmlcov/index.html"
