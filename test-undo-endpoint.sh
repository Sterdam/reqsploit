#!/bin/bash

# Test undo endpoint availability
echo "Testing /api/proxy/intercept/undo endpoint..."
echo ""

# First, get a valid token (you'll need to replace this with a real token)
# For now, just test if the endpoint exists
curl -v -X POST http://localhost:3000/api/proxy/intercept/undo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token-for-testing" \
  -d '{"requestIds": ["test-id"]}' \
  2>&1 | grep -E "HTTP/|404|401|200"

echo ""
echo "Expected: 401 Unauthorized (endpoint exists but needs valid token)"
echo "If you see 404: endpoint not registered"
