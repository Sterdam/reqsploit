#!/bin/bash

# ReqSploit Frontend - Component & Integration Tests
# Tests: Build, TypeScript, Components, Stores

set -e

echo "🎨 ReqSploit Frontend - Workflow Tests"
echo "======================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

TESTS_PASSED=0
TESTS_FAILED=0

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

echo "1️⃣  Testing TypeScript Compilation"
echo "===================================="
info "Running TypeScript compiler..."
if npx tsc --noEmit; then
    pass "TypeScript compilation"
else
    fail "TypeScript compilation"
fi
echo ""

echo "2️⃣  Testing Build Process"
echo "=========================="
info "Running production build..."
if npm run build; then
    pass "Production build"

    # Check if dist exists
    if [ -d "dist" ]; then
        pass "Build output directory exists"

        # Check critical files
        if [ -f "dist/index.html" ]; then
            pass "index.html generated"
        else
            fail "index.html not found"
        fi

        if ls dist/assets/*.js 1> /dev/null 2>&1; then
            pass "JavaScript bundles generated"
        else
            fail "JavaScript bundles not found"
        fi

        if ls dist/assets/*.css 1> /dev/null 2>&1; then
            pass "CSS bundles generated"
        else
            fail "CSS bundles not found"
        fi
    else
        fail "Build output directory not found"
    fi
else
    fail "Production build"
fi
echo ""

echo "3️⃣  Testing Component Structure"
echo "================================="

# Check critical components exist
components=(
    "src/components/Header.tsx"
    "src/components/ProjectManager.tsx"
    "src/components/ProxyControls.tsx"
    "src/components/RequestList.tsx"
    "src/components/RequestViewer.tsx"
    "src/components/AIAnalysisPanel.tsx"
)

for component in "${components[@]}"; do
    if [ -f "$component" ]; then
        pass "Component exists: $(basename $component)"
    else
        fail "Component missing: $(basename $component)"
    fi
done
echo ""

echo "4️⃣  Testing Store Structure"
echo "============================"

stores=(
    "src/stores/authStore.ts"
    "src/stores/proxyStore.ts"
    "src/stores/apiRequestsStore.ts"
    "src/stores/aiStore.ts"
)

for store in "${stores[@]}"; do
    if [ -f "$store" ]; then
        pass "Store exists: $(basename $store)"

        # Check for critical patterns
        if grep -q "create" "$store"; then
            pass "Store uses Zustand create: $(basename $store)"
        else
            fail "Store missing Zustand create: $(basename $store)"
        fi
    else
        fail "Store missing: $(basename $store)"
    fi
done
echo ""

echo "5️⃣  Testing Page Structure"
echo "==========================="

pages=(
    "src/pages/Dashboard.tsx"
    "src/pages/Login.tsx"
    "src/pages/Register.tsx"
)

for page in "${pages[@]}"; do
    if [ -f "$page" ]; then
        pass "Page exists: $(basename $page)"
    else
        fail "Page missing: $(basename $page)"
    fi
done
echo ""

echo "6️⃣  Testing Dependencies"
echo "========================="

info "Checking critical dependencies..."

# Check package.json
if [ -f "package.json" ]; then
    pass "package.json exists"

    # Check for critical dependencies
    critical_deps=("react" "react-dom" "zustand" "react-resizable-panels" "lucide-react")

    for dep in "${critical_deps[@]}"; do
        if grep -q "\"$dep\"" package.json; then
            pass "Dependency: $dep"
        else
            fail "Missing dependency: $dep"
        fi
    done
else
    fail "package.json not found"
fi
echo ""

echo "7️⃣  Testing Environment Configuration"
echo "======================================="

if [ -f ".env.example" ]; then
    pass ".env.example exists"
else
    fail ".env.example missing"
fi

if [ -f "vite.config.ts" ]; then
    pass "vite.config.ts exists"
else
    fail "vite.config.ts missing"
fi

if [ -f "tailwind.config.js" ]; then
    pass "tailwind.config.js exists"
else
    fail "tailwind.config.js missing"
fi
echo ""

echo "8️⃣  Testing Responsive Design"
echo "==============================="

info "Checking Dashboard for responsive classes..."
if grep -q "lg:flex" src/pages/Dashboard.tsx; then
    pass "Dashboard has responsive breakpoints"
else
    fail "Dashboard missing responsive breakpoints"
fi

if grep -q "md:block" src/components/Header.tsx; then
    pass "Header has responsive breakpoints"
else
    fail "Header missing responsive breakpoints"
fi
echo ""

echo "9️⃣  Testing Resizable Panels Integration"
echo "=========================================="

if grep -q "react-resizable-panels" src/pages/Dashboard.tsx; then
    pass "Dashboard uses resizable panels"
else
    fail "Dashboard missing resizable panels"
fi

if grep -q "PanelGroup" src/pages/Dashboard.tsx; then
    pass "Dashboard has PanelGroup"
else
    fail "Dashboard missing PanelGroup"
fi
echo ""

echo ""
echo "======================================="
echo "📊 Test Results"
echo "======================================="
echo -e "${GREEN}Passed:${NC} $TESTS_PASSED"
echo -e "${RED}Failed:${NC} $TESTS_FAILED"
echo -e "Total:  $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All frontend tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
