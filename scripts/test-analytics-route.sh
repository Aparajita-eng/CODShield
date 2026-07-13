#!/bin/bash
# Security route verification for analytics endpoint
set -e
COOKIE=/tmp/codshield_test_cookies.txt
BETA=a0000000-0000-4000-8000-000000000002

rm -f "$COOKIE"
curl -s -c "$COOKIE" -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@codshield.com","password":"Demo@1234"}' > /dev/null

test_route() {
  local name="$1"
  local backend_path="$2"
  local proxy_path="$3"
  echo ""
  echo "========== $name =========="
  echo "--- (a) unauthenticated direct backend ---"
  curl -s -w "\nHTTP %{http_code}\n" "http://localhost:5001$backend_path"
  echo "--- (b) authenticated proxy ---"
  curl -s -w "\nHTTP %{http_code}\n" -b "$COOKIE" "http://localhost:3000$proxy_path"
  echo "--- (c) wrong merchantId ---"
  if [[ "$proxy_path" == *"?"* ]]; then
    local wrong="${proxy_path}&merchantId=$BETA"
  else
    local wrong="${proxy_path}?merchantId=$BETA"
  fi
  curl -s -w "\nHTTP %{http_code}\n" -b "$COOKIE" "http://localhost:3000$wrong"
}

test_route "GET /api/analytics" "/api/analytics" "/api/analytics"
