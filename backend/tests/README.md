# Backend Python Unit Tests

Comprehensive unit tests for the Backend API Lambda handlers using pytest.

## Overview

This test suite covers:
- Temple Management API (CRUD operations)
- Artifact Management API (CRUD operations + QR code generation)
- AWS service mocking (DynamoDB, S3)
- Edge cases and error handling

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

## Installation

Install test dependencies:

```bash
# From the backend directory
cd backend
python -m pip install -r tests/requirements.txt
```

Or use the test runner with the install flag:

```bash
# Windows PowerShell
.\scripts\test-backend-python.ps1 -Install

# Linux/Mac
./scripts/test-backend-python.sh --install
```

## Running Tests

### Quick Start

```bash
# Windows PowerShell
.\scripts\test-backend-python.ps1

# Linux/Mac
./scripts/test-backend-python.sh
```

### With Coverage Report

```bash
# Windows PowerShell
.\scripts\test-backend-python.ps1 -Coverage

# Linux/Mac
./scripts/test-backend-python.sh --coverage
```

### Verbose Output

```bash
# Windows PowerShell
.\scripts\test-backend-python.ps1 -Verbose

# Linux/Mac
./scripts/test-backend-python.sh --verbose
```

### Run Specific Test File

```bash
cd backend
python -m pytest tests/test_temple_handler.py -v
```

### Run Specific Test

```bash
cd backend
python -m pytest tests/test_temple_handler.py::TestTempleHandler::test_create_temple_success -v
```

## Test Structure

```
backend/tests/
├── __init__.py                 # Package initialization
├── conftest.py                 # Pytest fixtures and configuration
├── requirements.txt            # Test dependencies
├── test_temple_handler.py      # Temple API tests
└── test_artifact_handler.py    # Artifact API tests
```

## Test Coverage

The test suite includes:

### Temple Handler Tests
- ✅ Create temple (success and validation)
- ✅ List temples (pagination, search, filters)
- ✅ Get single temple
- ✅ Update temple
- ✅ Delete temple (soft delete)
- ✅ Bulk operations (delete, update)
- ✅ Edge cases and error handling

### Artifact Handler Tests
- ✅ Create artifact with QR code generation
- ✅ List artifacts (pagination, search, filters, sorting)
- ✅ Get single artifact
- ✅ Update artifact
- ✅ Delete artifact (soft delete)
- ✅ QR code generation and uniqueness
- ✅ Bulk operations
- ✅ Edge cases and error handling

## Mocking

The tests use `moto` to mock AWS services:
- **DynamoDB**: Mocked tables for HeritageSites, Artifacts, and ContentCache
- **S3**: Mocked bucket for content storage

This allows tests to run without actual AWS resources.

## Coverage Reports

After running tests with coverage, view the HTML report:

```bash
# Open in browser
open backend/htmlcov/index.html  # Mac
start backend/htmlcov/index.html # Windows
xdg-open backend/htmlcov/index.html # Linux
```

## Continuous Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Backend Tests
  run: |
    cd backend
    python -m pip install -r tests/requirements.txt
    python -m pytest tests/ -v --cov=admin/handlers
```

## Troubleshooting

### Import Errors

If you see import errors, ensure you're running tests from the backend directory:

```bash
cd backend
python -m pytest tests/
```

### AWS Credentials Error

The tests use mocked AWS services, but if you see credential errors, ensure the `aws_credentials` fixture is being used.

### Module Not Found

Install all dependencies:

```bash
python -m pip install -r tests/requirements.txt
```

## Adding New Tests

1. Create a new test file in `tests/` directory (e.g., `test_new_handler.py`)
2. Import the handler functions you want to test
3. Use the fixtures from `conftest.py` for DynamoDB and S3 mocking
4. Follow the existing test patterns

Example:

```python
import pytest
from admin.handlers.my_handler import my_function

class TestMyHandler:
    def test_my_function_success(self, dynamodb_mock):
        result = my_function({"key": "value"})
        assert result["status"] == "success"
```

## Best Practices

- Use descriptive test names that explain what is being tested
- Test both success and failure cases
- Use fixtures for common setup
- Mock external dependencies (AWS services, HTTP calls)
- Aim for high code coverage (>80%)
- Keep tests independent and isolated

## Resources

- [pytest documentation](https://docs.pytest.org/)
- [moto documentation](https://docs.getmoto.org/)
- [boto3 documentation](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html)
