#!/bin/bash
# Security route verification — run with dev servers on :3000 and :5001
set -e
COOKIE=/tmp/codshield_test_cookies.txt
BETA=a0000000-0000-4000-8000-000000000002
ORDER=b0000000-0000-4000-8000-000000000013
PIN=560034
PHONE=9876543210

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
  if [ "$method" = "PATCH" ]; then
    curl -s -w "\nHTTP %{http_code}\n" -X PATCH "http://localhost:5001$backend_path" \
      -H "Content-Type: application/json" -d "$body"
  else
    curl -s -w "\nHTTP %{http_code}\n" "http://localhost:5001$backend_path"
  fi
  echo "--- (b) authenticated proxy ---"
  if [ "$method" = "PATCH" ]; then
    curl -s -w "\nHTTP %{http_code}\n" -b "$COOKIE" -X PATCH "http://localhost:3000$proxy_path" \
      -H "Content-Type: application/json" -d "$body"
  else
    curl -s -w "\nHTTP %{http_code}\n" -b "$COOKIE" "http://localhost:3000$proxy_path"
  fi
  echo "--- (c) wrong merchantId ---"
  if [[ "$proxy_path" == *"?"* ]]; then
    local wrong="${proxy_path}&merchantId=$BETA"
  else
    local wrong="${proxy_path}?merchantId=$BETA"
  fi
  if [ "$method" = "PATCH" ]; then
    curl -s -w "\nHTTP %{http_code}\n" -b "$COOKIE" -X PATCH "http://localhost:3000$wrong" \
      -H "Content-Type: application/json" -d "$body"
  else
    curl -s -w "\nHTTP %{http_code}\n" -b "$COOKIE" "http://localhost:3000$wrong"
  fi
}

test_route "GET /api/orders" "/api/orders" "/api/orders"
test_route "GET /api/orders/:id" "/api/orders/$ORDER" "/api/orders/$ORDER"
test_route "PATCH /api/orders/bulk" "/api/orders/bulk" "/api/orders/bulk" "PATCH" '{"orderIds":["'"$ORDER"'"],"action":"verify"}'
test_route "GET /api/customers" "/api/customers" "/api/customers"
test_route "GET /api/customers/search" "/api/customers/search?q=9876" "/api/customers/search?q=9876"
test_route "GET /api/customers/profile" "/api/customers/profile?phone=$PHONE" "/api/customers/profile?phone=$PHONE"
test_route "GET /api/pincodes/intelligence" "/api/pincodes/intelligence" "/api/pincodes/intelligence"
test_route "GET /api/pincodes/:pincode/detail" "/api/pincodes/$PIN/detail" "/api/pincodes/$PIN/detail"
test_route "GET /api/fraud/events" "/api/fraud/events" "/api/fraud/events"
