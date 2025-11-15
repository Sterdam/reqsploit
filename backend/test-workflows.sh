#!/bin/bash

# ReqSploit Backend - Complete Workflow Tests
# Tests: Auth, API, Proxy, AI, Billing, WebSocket

set -e

API_URL="http://localhost:3000"
WS_URL="ws://localhost:3000"

echo "🧪 ReqSploit Backend - Complete Workflow Tests"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

info() {
    echo -e "${YELLOW}ℹ️  INFO${NC}: $1"
}

# Test variables
ACCESS_TOKEN=""
USER_ID=""
PROJECT_ID=""
REQUEST_ID=""
FINDING_ID=""

echo "1️⃣  Testing Health Check"
echo "========================"
response=$(curl -s -w "\n%{http_code}" $API_URL/health)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    pass "Health check endpoint"
    info "Response: $body"
else
    fail "Health check endpoint (HTTP $http_code)"
fi
echo ""

echo "2️⃣  Testing Authentication Workflow"
echo "===================================="

# Test Registration
info "Registering new user..."
response=$(curl -s -w "\n%{http_code}" -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test_'$(date +%s)'@example.com",
    "password": "Test1234!",
    "name": "Test User"
  }')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "201" ]; then
    pass "User registration"
    ACCESS_TOKEN=$(echo "$body" | jq -r '.data.accessToken // .accessToken')
    USER_ID=$(echo "$body" | jq -r '.data.user.id // .user.id')

    # Debug output
    info "Full response body:"
    echo "$body" | jq '.'

    if [ "$ACCESS_TOKEN" = "null" ] || [ -z "$ACCESS_TOKEN" ]; then
        fail "Access token is null/empty"
    else
        info "Access Token: ${ACCESS_TOKEN:0:20}..."
        info "User ID: $USER_ID"
    fi
else
    fail "User registration (HTTP $http_code)"
    echo "$body" | jq '.'
fi
echo ""

# Test Login
info "Testing login..."
response=$(curl -s -w "\n%{http_code}" -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "200" ] || [ "$http_code" = "401" ]; then
    pass "Login endpoint responds"
else
    fail "Login endpoint (HTTP $http_code)"
fi
echo ""

# Test Me endpoint
info "Testing /me endpoint..."
response=$(curl -s -w "\n%{http_code}" $API_URL/api/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "200" ]; then
    pass "Get current user (/me)"
else
    fail "Get current user (HTTP $http_code)"
fi
echo ""

echo "3️⃣  Testing Projects API"
echo "========================="

# Create Project
info "Creating new project..."
response=$(curl -s -w "\n%{http_code}" -X POST $API_URL/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "name": "Test Project",
    "target": "https://example.com",
    "description": "Automated test project"
  }')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "201" ]; then
    pass "Create project"
    PROJECT_ID=$(echo "$body" | jq -r '.data.id')
    info "Project ID: $PROJECT_ID"
else
    fail "Create project (HTTP $http_code)"
    echo "$body" | jq '.'
fi
echo ""

# List Projects
info "Fetching projects list..."
response=$(curl -s -w "\n%{http_code}" $API_URL/api/projects \
  -H "Authorization: Bearer $ACCESS_TOKEN")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "200" ]; then
    pass "List projects"
else
    fail "List projects (HTTP $http_code)"
fi
echo ""

# Get Single Project
if [ -n "$PROJECT_ID" ]; then
    info "Fetching single project..."
    response=$(curl -s -w "\n%{http_code}" $API_URL/api/projects/$PROJECT_ID \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "200" ]; then
        pass "Get single project"
    else
        fail "Get single project (HTTP $http_code)"
    fi
fi
echo ""

echo "4️⃣  Testing Proxy API"
echo "====================="

# Get Proxy Status
info "Getting proxy status..."
response=$(curl -s -w "\n%{http_code}" $API_URL/api/proxy/session/status \
  -H "Authorization: Bearer $ACCESS_TOKEN")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    pass "Get proxy status"
    info "Status: $(echo "$body" | jq -r '.data.status')"
else
    fail "Get proxy status (HTTP $http_code)"
fi
echo ""

# Get Certificate
info "Getting SSL certificate..."
response=$(curl -s -w "\n%{http_code}" $API_URL/api/proxy/certificate \
  -H "Authorization: Bearer $ACCESS_TOKEN")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "200" ]; then
    pass "Get SSL certificate"
else
    fail "Get SSL certificate (HTTP $http_code)"
fi
echo ""

echo "5️⃣  Testing Requests API"
echo "========================="

# List Requests
info "Fetching requests list..."
response=$(curl -s -w "\n%{http_code}" "$API_URL/api/requests?limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "200" ]; then
    pass "List requests"
else
    fail "List requests (HTTP $http_code)"
fi
echo ""

echo "6️⃣  Testing AI System"
echo "======================"

# Check if we have requests to analyze
if [ -n "$REQUEST_ID" ]; then
    info "Running AI analysis on request..."
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/ai/analyze/$REQUEST_ID" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "200" ]; then
        pass "AI analysis"
    else
        fail "AI analysis (HTTP $http_code)"
    fi
else
    info "Skipping AI analysis (no requests available)"
fi
echo ""

# Get Token Usage
info "Getting AI token usage..."
response=$(curl -s -w "\n%{http_code}" $API_URL/api/ai/tokens \
  -H "Authorization: Bearer $ACCESS_TOKEN")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    pass "Get AI token usage"
    info "Tokens: $(echo "$body" | jq -r '.data.remaining')/$(echo "$body" | jq -r '.data.limit')"
else
    fail "Get AI token usage (HTTP $http_code)"
fi
echo ""

echo "7️⃣  Testing Billing System"
echo "==========================="

# Get Subscription
info "Getting subscription info..."
response=$(curl -s -w "\n%{http_code}" $API_URL/api/billing/subscription \
  -H "Authorization: Bearer $ACCESS_TOKEN")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "200" ]; then
    pass "Get subscription"
else
    fail "Get subscription (HTTP $http_code)"
fi
echo ""

echo "8️⃣  Testing Findings API"
echo "========================="

# List Findings
info "Fetching findings list..."
response=$(curl -s -w "\n%{http_code}" $API_URL/api/projects/$PROJECT_ID/findings \
  -H "Authorization: Bearer $ACCESS_TOKEN")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "200" ]; then
    pass "List findings"
else
    fail "List findings (HTTP $http_code)"
fi
echo ""

echo ""
echo "================================================"
echo "📊 Test Results"
echo "================================================"
echo -e "${GREEN}Passed:${NC} $TESTS_PASSED"
echo -e "${RED}Failed:${NC} $TESTS_FAILED"
echo -e "Total:  $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
