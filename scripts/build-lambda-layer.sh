#!/bin/bash
# Build Lambda Layer for Authentication Service
# Requirements: 13.6

set -e

echo "Building Lambda layer for authentication service..."

# Create build directory
BUILD_DIR="build/lambda-layer"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/python"

# Install dependencies
echo "Installing Python dependencies..."
pip install -r src/auth/layers/dependencies/requirements.txt -t "$BUILD_DIR/python" --upgrade

# Remove unnecessary files to reduce layer size
echo "Cleaning up unnecessary files..."
cd "$BUILD_DIR/python"
find . -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete
find . -type f -name "*.pyo" -delete
find . -type f -name "*.dist-info" -exec rm -rf {} + 2>/dev/null || true
cd ../..

# Create zip file
echo "Creating layer zip file..."
cd "$BUILD_DIR"
zip -r ../auth-dependencies-layer.zip python
cd ../..

echo "Lambda layer built successfully: build/auth-dependencies-layer.zip"
echo "Layer size: $(du -h build/auth-dependencies-layer.zip | cut -f1)"
