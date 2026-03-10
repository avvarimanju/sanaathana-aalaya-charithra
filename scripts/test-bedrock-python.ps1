# PowerShell wrapper for Python Bedrock test

Write-Host "AWS Bedrock Test (Python)" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install Python from: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

# Check if boto3 is installed
Write-Host "Checking boto3..." -ForegroundColor Gray
$boto3Check = python -c "import boto3; print('installed')" 2>&1

if ($boto3Check -notlike "*installed*") {
    Write-Host "boto3 not found. Installing..." -ForegroundColor Yellow
    pip install boto3
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install boto3" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Running test..." -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""

# Run the Python script
python .\scripts\test-bedrock-python.py

exit $LASTEXITCODE
