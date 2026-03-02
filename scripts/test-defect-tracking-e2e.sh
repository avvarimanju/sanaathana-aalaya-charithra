#!/bin/bash

# End-to-End Testing Script for Defect Tracking System
# This script tests all API endpoints after deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_test() {
    echo -e "${YELLOW}[TEST]${NC} $1"
}

# Parse arguments
ENVIRONMENT="${1:-staging}"
API_URL="$2"

if [ -z "$API_URL" ]; then
    # Try to get API URL from CloudFormation
    STACK_NAME="DefectTrackingStack-${ENVIRONMENT}"
    API_URL=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
        --output text 2>/dev/null || echo "")
    
    if [ -z "$API_URL" ]; then
        print_error "API URL not provided and could not be retrieved from CloudFormation"
        echo "Usage: $0 [environment] [api-url]"
        echo "Example: $0 staging https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/staging/"
        exit 1
    fi
fi

# Remove trailing slash
API_URL="${API_URL%/}"

print_info "Testing Defect Tracking API"
print_info "Environment: $ENVIRONMENT"
print_info "API URL: $API_URL"
echo ""

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Test helper function
run_test() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="$5"
    
    print_test "$test_name"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "${API_URL}${endpoint}" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "${API_URL}${endpoint}" 2>/dev/null)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        print_success "HTTP $http_code (expected $expected_status)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo "$body"
        return 0
    else
        print_error "HTTP $http_code (expected $expected_status)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo "$body"
        return 1
    fi
}

# Generate unique test user ID
TEST_USER_ID="test-user-$(date +%s)"
DEFECT_ID=""
NOTIFICATION_ID=""

echo "========================================="
echo "User Endpoint Tests"
echo "========================================="
echo ""

# Test 1: Submit defect
print_test "Test 1: Submit defect"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/defects" \
    -H "Content-Type: application/json" \
    -d "{
        \"userId\": \"${TEST_USER_ID}\",
        \"title\": \"Test defect from E2E test\",
        \"description\": \"This is a test defect created by the automated E2E test script\",
        \"stepsToReproduce\": \"1. Run deployment script\\n2. Run E2E test script\",
        \"expectedBehavior\": \"Defect should be created successfully\",
        \"actualBehavior\": \"Testing the actual behavior\",
        \"deviceInfo\": {
            \"platform\": \"ios\",
            \"osVersion\": \"17.0\",
            \"appVersion\": \"1.0.0\",
            \"deviceModel\": \"iPhone 15 Pro\"
        }
    }" 2>/dev/null)

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "201" ]; then
    print_success "HTTP 201 - Defect created"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    DEFECT_ID=$(echo "$body" | grep -o '"defectId":"[^"]*"' | cut -d'"' -f4)
    print_info "Defect ID: $DEFECT_ID"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    print_error "HTTP $http_code - Failed to create defect"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo "$body"
fi
echo ""

# Test 2: Submit defect with validation error (title too short)
print_test "Test 2: Submit defect with validation error (title too short)"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/defects" \
    -H "Content-Type: application/json" \
    -d "{
        \"userId\": \"${TEST_USER_ID}\",
        \"title\": \"Bug\",
        \"description\": \"This should fail validation\"
    }" 2>/dev/null)

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "400" ]; then
    print_success "HTTP 400 - Validation error as expected"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_error "HTTP $http_code - Expected 400 validation error"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 3: Get user defects
if [ -n "$DEFECT_ID" ]; then
    print_test "Test 3: Get user defects"
    response=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/defects/user/${TEST_USER_ID}" 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        print_success "HTTP 200 - Retrieved user defects"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        print_error "HTTP $http_code - Failed to retrieve user defects"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo "$body"
    fi
    echo ""
fi

# Test 4: Get defect details
if [ -n "$DEFECT_ID" ]; then
    print_test "Test 4: Get defect details"
    response=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/defects/${DEFECT_ID}" 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        print_success "HTTP 200 - Retrieved defect details"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        print_error "HTTP $http_code - Failed to retrieve defect details"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo "$body"
    fi
    echo ""
fi

echo "========================================="
echo "Admin Endpoint Tests"
echo "========================================="
echo ""

# Test 5: Get all defects (admin)
print_test "Test 5: Get all defects (admin)"
response=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/admin/defects" 2>/dev/null)

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    print_success "HTTP 200 - Retrieved all defects"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    print_error "HTTP $http_code - Failed to retrieve all defects"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo "$body"
fi
echo ""

# Test 6: Update defect status (admin)
if [ -n "$DEFECT_ID" ]; then
    print_test "Test 6: Update defect status to Acknowledged (admin)"
    response=$(curl -s -w "\n%{http_code}" -X PUT "${API_URL}/admin/defects/${DEFECT_ID}/status" \
        -H "Content-Type: application/json" \
        -d "{
            \"newStatus\": \"Acknowledged\",
            \"comment\": \"We have received your defect report and will investigate\"
        }" 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        print_success "HTTP 200 - Status updated to Acknowledged"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        print_error "HTTP $http_code - Failed to update status"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo "$body"
    fi
    echo ""
fi

# Test 7: Invalid status transition (admin)
if [ -n "$DEFECT_ID" ]; then
    print_test "Test 7: Invalid status transition (Acknowledged -> Closed)"
    response=$(curl -s -w "\n%{http_code}" -X PUT "${API_URL}/admin/defects/${DEFECT_ID}/status" \
        -H "Content-Type: application/json" \
        -d "{
            \"newStatus\": \"Closed\"
        }" 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "400" ]; then
        print_success "HTTP 400 - Invalid transition rejected as expected"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        print_error "HTTP $http_code - Expected 400 for invalid transition"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    echo ""
fi

# Test 8: Add status update (admin)
if [ -n "$DEFECT_ID" ]; then
    print_test "Test 8: Add status update (admin)"
    response=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/admin/defects/${DEFECT_ID}/updates" \
        -H "Content-Type: application/json" \
        -d "{
            \"message\": \"We are currently investigating this issue and will provide an update soon\"
        }" 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "201" ]; then
        print_success "HTTP 201 - Status update added"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        print_error "HTTP $http_code - Failed to add status update"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo "$body"
    fi
    echo ""
fi

echo "========================================="
echo "Notification Endpoint Tests"
echo "========================================="
echo ""

# Test 9: Get user notifications
print_test "Test 9: Get user notifications"
response=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/notifications/user/${TEST_USER_ID}" 2>/dev/null)

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    print_success "HTTP 200 - Retrieved notifications"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    NOTIFICATION_ID=$(echo "$body" | grep -o '"notificationId":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -n "$NOTIFICATION_ID" ]; then
        print_info "Notification ID: $NOTIFICATION_ID"
    fi
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    print_error "HTTP $http_code - Failed to retrieve notifications"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo "$body"
fi
echo ""

# Test 10: Mark notification as read
if [ -n "$NOTIFICATION_ID" ]; then
    print_test "Test 10: Mark notification as read"
    response=$(curl -s -w "\n%{http_code}" -X PUT "${API_URL}/notifications/${NOTIFICATION_ID}/read" 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        print_success "HTTP 200 - Notification marked as read"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        print_error "HTTP $http_code - Failed to mark notification as read"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo "$body"
    fi
    echo ""
fi

echo "========================================="
echo "Workflow Tests"
echo "========================================="
echo ""

# Test 11: Complete workflow (New -> Acknowledged -> In_Progress -> Resolved -> Closed)
if [ -n "$DEFECT_ID" ]; then
    print_test "Test 11: Complete workflow test"
    
    # Already at Acknowledged, move to In_Progress
    response=$(curl -s -w "\n%{http_code}" -X PUT "${API_URL}/admin/defects/${DEFECT_ID}/status" \
        -H "Content-Type: application/json" \
        -d '{"newStatus": "In_Progress"}' 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    if [ "$http_code" = "200" ]; then
        print_success "  ✓ Acknowledged -> In_Progress"
    else
        print_error "  ✗ Failed: Acknowledged -> In_Progress"
    fi
    
    # Move to Resolved
    response=$(curl -s -w "\n%{http_code}" -X PUT "${API_URL}/admin/defects/${DEFECT_ID}/status" \
        -H "Content-Type: application/json" \
        -d '{"newStatus": "Resolved"}' 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    if [ "$http_code" = "200" ]; then
        print_success "  ✓ In_Progress -> Resolved"
    else
        print_error "  ✗ Failed: In_Progress -> Resolved"
    fi
    
    # Move to Closed
    response=$(curl -s -w "\n%{http_code}" -X PUT "${API_URL}/admin/defects/${DEFECT_ID}/status" \
        -H "Content-Type: application/json" \
        -d '{"newStatus": "Closed"}' 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    if [ "$http_code" = "200" ]; then
        print_success "  ✓ Resolved -> Closed"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        print_error "  ✗ Failed: Resolved -> Closed"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    echo ""
fi

# Test 12: Verify defect history
if [ -n "$DEFECT_ID" ]; then
    print_test "Test 12: Verify defect has complete history"
    response=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/defects/${DEFECT_ID}" 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        status=$(echo "$body" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        update_count=$(echo "$body" | grep -o '"statusUpdates":\[[^]]*\]' | grep -o '"updateId"' | wc -l)
        
        if [ "$status" = "Closed" ] && [ "$update_count" -gt 0 ]; then
            print_success "HTTP 200 - Defect has complete history (status: $status, updates: $update_count)"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            print_error "Defect history incomplete (status: $status, updates: $update_count)"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        print_error "HTTP $http_code - Failed to retrieve defect"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    echo ""
fi

# Summary
echo "========================================="
echo "Test Summary"
echo "========================================="
echo ""
print_info "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
print_success "Passed: $TESTS_PASSED"
if [ $TESTS_FAILED -gt 0 ]; then
    print_error "Failed: $TESTS_FAILED"
else
    print_info "Failed: $TESTS_FAILED"
fi
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    print_success "All tests passed! ✓"
    echo ""
    print_info "The defect tracking system is working correctly."
    print_info "You can now integrate it with the mobile app and admin dashboard."
    exit 0
else
    print_error "Some tests failed. Please review the output above."
    exit 1
fi
