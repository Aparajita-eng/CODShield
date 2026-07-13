#!/bin/bash
# Security route verification for claims endpoints
set -e
COOKIE=/tmp/codshield_test_cookies.txt
BETA=a0000000-0000-4000-8000-000000000002
ACME_CLAIM=c0000000-0000-4000-8000-000000000001
BETA_CLAIM=c0000000-0000-4000-8000-000000000999

rm -f "$COOKIE"
curl -s -c "$COOKIE" -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@codshield.com","password":"Demo@1234"}' > /dev/null

test_route() {
  local name="$1"
  local backend_path="$2"
  local proxy_path="$3"
  local method="${4:-GET}"
  local body="$5"
  echo ""
  echo "========== $name =========="
  echo "--- (a) unauthenticated direct backend ---"
  if [ "$method" = "POST" ]; then
    curl -s -w "\nHTTP %{http_code}\n" -X POST "http://localhost:5001$backend_path" \
      -H "Content-Type: application/json" -d "$body"
  else
    curl -s -w "\nHTTP %{http_code}\n" "http://localhost:5001$backend_path"
  fi
  echo "--- (b) authenticated proxy ---"
  if [ "$method" = "POST" ]; then
    curl -s -w "\nHTTP %{http_code}\n" -b "$COOKIE" -X POST "http://localhost:3000$proxy_path" \
      -H "Content-Type: application/json" -d "$body"
  else
    curl -s -w "\nHTTP %{http_code}\n" -b "$COOKIE" "http://localhost:3000$proxy_path"
  fi
}

echo "Testing Listing Endpoint GET /api/claims..."
test_route "GET /api/claims" "/api/claims" "/api/claims"

echo ""
echo "Testing Listing Endpoint with Wrong Merchant (403 test) GET /api/claims?merchantId=wrong-id..."
echo "--- (b) authenticated proxy with wrong merchantId ---"
curl -s -w "\nHTTP %{http_code}\n" -b "$COOKIE" "http://localhost:3000/api/claims?merchantId=$BETA"

echo ""
echo "Testing Claims Notes update on own Claim (200 test)..."
test_route "POST /api/claims/:id/notes" "/api/claims/$ACME_CLAIM/notes" "/api/claims/$ACME_CLAIM/notes" "POST" '{"notes":"Update via shell script."}'

echo ""
echo "Testing Claims Notes update on wrong Merchant Claim (403 test)..."
echo "--- (b) authenticated proxy with wrong merchant claim ---"
curl -s -w "\nHTTP %{http_code}\n" -b "$COOKIE" -X POST "http://localhost:3000/api/claims/$BETA_CLAIM/notes" \
  -H "Content-Type: application/json" -d '{"notes":"Malicious update attempt."}'
