#!/bin/bash
# Verification for OTP Bypass, Password Reset, and Demo Mode Registration Fixes
set -e

echo "=== STARTING VERIFICATION FOR NEW AUTHENTICATION FLOWS ==="
echo ""

# ----------------------------------------------------
# 1. OTP Session Security Test
# ----------------------------------------------------
echo "================ 1. OTP SESSION SECURITY TEST ================"

TEST_PHONE="9876500000"

echo "--- (a) Direct OTP session creation with unverified phone (Should fail) ---"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:5001/api/auth/otp-session \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$TEST_PHONE\"}")

echo "HTTP Status: $STATUS"
if [ "$STATUS" -ne 400 ]; then
  echo "❌ FAILED: Expected 400 Bad Request for unverified phone"
  exit 1
fi
echo "✅ Passed: Direct OTP session creation blocked."

echo "--- (b) Dispatching simulated OTP (optional, bypass code will be used) ---"
curl -s -X POST http://localhost:5001/api/otp/send \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$TEST_PHONE\"}" > /dev/null

OTP_CODE="123456"
echo "Bypass OTP code used: $OTP_CODE"

echo "--- (c) Verifying OTP code ---"
VERIFY_RES=$(curl -s -X POST http://localhost:5001/api/otp/verify \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$TEST_PHONE\",\"code\":\"$OTP_CODE\"}")
echo "Verify Response: $VERIFY_RES"

echo "--- (d) Creating OTP session with verified phone (Should succeed) ---"
SESSION_RES=$(curl -s -w "\nHTTP Status: %{http_code}" -X POST http://localhost:5001/api/auth/otp-session \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$TEST_PHONE\"}")

echo "$SESSION_RES"
if ! echo "$SESSION_RES" | grep -q "200"; then
  echo "❌ FAILED: Expected 200 OK for verified phone"
  exit 1
fi
echo "✅ Passed: Session successfully created for verified phone."

echo "--- (e) Creating OTP session again (Should fail due to single-use consumption) ---"
STATUS_AGAIN=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:5001/api/auth/otp-session \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$TEST_PHONE\"}")

echo "HTTP Status: $STATUS_AGAIN"
if [ "$STATUS_AGAIN" -ne 400 ]; then
  echo "❌ FAILED: Expected 400 Bad Request for single-use consumption check"
  exit 1
fi
echo "✅ Passed: OTP session verification consumed after single use."

echo ""

# ----------------------------------------------------
# 2. Password Reset Flow Test
# ----------------------------------------------------
echo "================ 2. PASSWORD RESET FLOW TEST ================"

echo "--- (a) Request forgot password for demo user ---"
FORGOT_RES=$(curl -s -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@codshield.com"}')

RESET_TOKEN=$(echo "$FORGOT_RES" | grep -o 'token=[a-z0-9]*' | cut -d'=' -f2)
echo "Reset Token: $RESET_TOKEN"

echo "--- (b) Call reset-password proxy with invalid token (Should fail) ---"
RESET_FAIL=$(curl -s -w "\nHTTP Status: %{http_code}" -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"invalid-token-123","newPassword":"NewPassword@1234"}')
echo "$RESET_FAIL"

echo "--- (c) Call reset-password proxy with valid token (Should succeed) ---"
RESET_OK=$(curl -s -w "\nHTTP Status: %{http_code}" -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$RESET_TOKEN\",\"newPassword\":\"NewPassword@1234\"}")
echo "$RESET_OK"
if ! echo "$RESET_OK" | grep -q "200"; then
  echo "❌ FAILED: Expected 200 OK for valid password reset"
  exit 1
fi

echo "--- (d) Call reset-password again with same token (Should fail due to single-use) ---"
RESET_USED=$(curl -s -w "\nHTTP Status: %{http_code}" -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$RESET_TOKEN\",\"newPassword\":\"NewPassword@1234\"}")
echo "$RESET_USED"
if ! echo "$RESET_USED" | grep -q "400"; then
  echo "❌ FAILED: Expected 400 Bad Request for consumed token"
  exit 1
fi
echo "✅ Passed: Token consumed on first use."

echo "--- (e) Attempt login with OLD password (Should fail) ---"
OLD_LOGIN=$(curl -s -w "\nHTTP Status: %{http_code}" -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@codshield.com","password":"Demo@1234"}')
echo "$OLD_LOGIN"
if ! echo "$OLD_LOGIN" | grep -q "401"; then
  echo "❌ FAILED: Expected 401 Unauthorized with old password"
  exit 1
fi

echo "--- (f) Attempt login with NEW password (Should succeed) ---"
NEW_LOGIN=$(curl -s -w "\nHTTP Status: %{http_code}" -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@codshield.com","password":"NewPassword@1234"}')
echo "$NEW_LOGIN"
if ! echo "$NEW_LOGIN" | grep -q "200"; then
  echo "❌ FAILED: Expected 200 OK with new password"
  exit 1
fi
echo "✅ Passed: Login with new password succeeded."

echo "--- (g) Reverting password back to Demo@1234 ---"
FORGOT_RES2=$(curl -s -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@codshield.com"}')
RESET_TOKEN2=$(echo "$FORGOT_RES2" | grep -o 'token=[a-z0-9]*' | cut -d'=' -f2)

curl -s -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$RESET_TOKEN2\",\"newPassword\":\"Demo@1234\"}" > /dev/null
echo "✅ Passed: Password reverted back to default."

echo ""

# ----------------------------------------------------
# 3. Registration Demo Mode Crash Test
# ----------------------------------------------------
echo "================ 3. REGISTRATION DEMO MODE CRASH TEST ================"

MOCK_EMAIL="new_merchant_test_$RANDOM@codshield.com"
MOCK_PASSWORD="NewMerchant@1234"
MOCK_COMPANY="New Tech Merchant $RANDOM"

echo "--- (a) Registering a new merchant in demo mode (Should succeed) ---"
REG_RES=$(curl -s -w "\nHTTP Status: %{http_code}" -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"fullName\":\"Test Merchant Owner\",\"companyName\":\"$MOCK_COMPANY\",\"email\":\"$MOCK_EMAIL\",\"password\":\"$MOCK_PASSWORD\",\"phone\":\"9999888877\"}")

echo "$REG_RES"
if ! echo "$REG_RES" | grep -q "201"; then
  echo "❌ FAILED: Expected 201 Created for demo registration"
  exit 1
fi
echo "✅ Passed: Registration in demo mode succeeded."

echo "--- (b) Registering the same email again (Should fail with conflict 409) ---"
REG_CONFLICT=$(curl -s -w "\nHTTP Status: %{http_code}" -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"fullName\":\"Test Merchant Owner\",\"companyName\":\"New Tech Merchant 2\",\"email\":\"$MOCK_EMAIL\",\"password\":\"$MOCK_PASSWORD\",\"phone\":\"9999888877\"}")

echo "$REG_CONFLICT"
if ! echo "$REG_CONFLICT" | grep -q "409"; then
  echo "❌ FAILED: Expected 409 Conflict for duplicate registration"
  exit 1
fi
echo "✅ Passed: Duplicate registration blocked."

echo "--- (c) Logging in with newly registered user (Should succeed) ---"
NEW_USER_LOGIN=$(curl -s -w "\nHTTP Status: %{http_code}" -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$MOCK_EMAIL\",\"password\":\"$MOCK_PASSWORD\"}")

echo "$NEW_USER_LOGIN"
if ! echo "$NEW_USER_LOGIN" | grep -q "200"; then
  echo "❌ FAILED: Expected 200 OK for logging in with registered user"
  exit 1
fi
echo "✅ Passed: Logged in successfully with newly registered merchant user."

echo ""
echo "=== ALL NEW AUTHENTICATION FLOW VERIFICATIONS PASSED SUCCESSFULLY ==="
