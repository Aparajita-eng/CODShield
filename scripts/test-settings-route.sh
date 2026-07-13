#!/bin/bash
# Security route verification for settings endpoints
set -e

COOKIE="./scripts/codshield_test_cookies.txt"
BETA_MERCHANT_ID="a0000000-0000-4000-8000-000000000002"

rm -f "$COOKIE"

echo "Logging in as demo user to retrieve session..."
curl -s -c "$COOKIE" -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@codshield.com","password":"Demo@1234"}' > /dev/null

echo "Session retrieved."

echo ""
echo "================ 1. PATCH /api/settings/company ================"
echo "--- (a) Unauthenticated direct backend ---"
curl -s -w "\nHTTP Status: %{http_code}\n" -X PATCH "http://localhost:5001/api/settings/company" \
  -H "Content-Type: application/json" \
  -d '{"name": "New Acme"}'
echo "--- (b) Authenticated proxy ---"
curl -s -w "\nHTTP Status: %{http_code}\n" -b "$COOKIE" -X PATCH "http://localhost:3000/api/settings/company" \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme New"}'
echo "--- (c) Wrong merchantId (Cross-merchant 403) ---"
curl -s -w "\nHTTP Status: %{http_code}\n" -b "$COOKIE" -X PATCH "http://localhost:3000/api/settings/company" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Acme Attack\", \"merchantId\": \"$BETA_MERCHANT_ID\"}"

echo ""
echo "================ 2. POST /api/settings/api-key/regenerate ================"
echo "--- (a) Unauthenticated direct backend ---"
curl -s -w "\nHTTP Status: %{http_code}\n" -X POST "http://localhost:5001/api/settings/api-key/regenerate"
echo "--- (b) Authenticated proxy ---"
curl -s -w "\nHTTP Status: %{http_code}\n" -b "$COOKIE" -X POST "http://localhost:3000/api/settings/api-key/regenerate"
echo "--- (c) Wrong merchantId (Cross-merchant 403) ---"
curl -s -w "\nHTTP Status: %{http_code}\n" -b "$COOKIE" -X POST "http://localhost:3000/api/settings/api-key/regenerate" \
  -H "Content-Type: application/json" \
  -d "{\"merchantId\": \"$BETA_MERCHANT_ID\"}"

echo ""
echo "================ 3. GET /api/settings/team ================"
echo "--- (a) Unauthenticated direct backend ---"
curl -s -w "\nHTTP Status: %{http_code}\n" "http://localhost:5001/api/settings/team"
echo "--- (b) Authenticated proxy ---"
curl -s -w "\nHTTP Status: %{http_code}\n" -b "$COOKIE" "http://localhost:3000/api/settings/team"
echo "--- (c) Wrong merchantId (Cross-merchant 403) ---"
curl -s -w "\nHTTP Status: %{http_code}\n" -b "$COOKIE" "http://localhost:3000/api/settings/team?merchantId=$BETA_MERCHANT_ID"

echo ""
echo "================ 4. POST /api/settings/password ================"
echo "--- (a) Authenticated proxy (demo user password update block) ---"
curl -s -w "\nHTTP Status: %{http_code}\n" -b "$COOKIE" -X POST "http://localhost:3000/api/settings/password" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword": "DemoPassword", "newPassword": "SecretPassword"}'

rm -f "$COOKIE"
echo "Done testing settings."
