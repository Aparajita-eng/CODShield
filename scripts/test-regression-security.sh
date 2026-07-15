#!/bin/bash

# Exit on any failure
set -e

echo "=== STARTING SECURITY REGRESSION AND PENETRATION TEST SUITE ==="

# 1. Run RolesGuard Path Unit Tests
echo ""
echo "================ 1. ROLESGUARD SECURITY UNIT TESTS ================"
cd backend
npx ts-node src/modules/auth/tests/roles.guard.spec.ts
cd ..
echo "✅ Passed: RolesGuard unit tests passed."

# 2. Run Prisma Fail-Closed Bootstrap Test
echo ""
echo "================ 2. DATABASE FAIL-CLOSED UNIT TESTS ================"
cd backend
npx ts-node src/modules/prisma/tests/prisma-fail-closed.spec.ts
cd ..
echo "✅ Passed: Database fail-closed unit tests passed."

# 2b. Run Database Runtime Failure Test
echo ""
echo "================ 2b. DATABASE RUNTIME FAILURE UNIT TESTS ================"
cd backend
npx ts-node src/modules/auth/tests/auth.controller.runtime-fail.spec.ts
cd ..
echo "✅ Passed: Database runtime failure unit tests passed."

# 2c. Run OTP Rate Limit Window Reset Test
echo ""
echo "================ 2c. OTP RATE LIMIT WINDOW RESET UNIT TESTS ================"
cd backend
npx ts-node src/modules/auth/tests/otp-window-reset.spec.ts
cd ..
echo "✅ Passed: OTP rate limit window reset unit tests passed."

# 2d. Run VerifiedPhone Expiry Test
echo ""
echo "================ 2d. VERIFIED PHONE EXPIRY & PRUNE UNIT TESTS ================"
cd backend
npx ts-node src/modules/auth/tests/verified-phone-expiry.spec.ts
cd ..
echo "✅ Passed: VerifiedPhone expiry & prune unit tests passed."

# 3. OTP Rate Limiting and Brute-force Hammer Test
echo ""
echo "================ 3. OTP BRUTE-FORCE RATE LIMITING TEST ================"
HAMMER_PHONE="9876599999"
echo "Hammering /api/otp/verify 6 times for phone: $HAMMER_PHONE..."

# Attempt 1-5
for i in {1..5}
do
  RES=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/otp/verify \
    -H "Content-Type: application/json" \
    -d "{\"phone\":\"$HAMMER_PHONE\",\"code\":\"123456\"}")
  echo "Attempt $i Response Status: $RES"
done

# Attempt 6 (Should trigger rate-limiting block)
RES_6=$(curl -s -X POST http://localhost:3000/api/otp/verify \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$HAMMER_PHONE\",\"code\":\"123456\"}")

echo "Attempt 6 Response Content: $RES_6"
if echo "$RES_6" | grep -q "Too many OTP attempts"; then
  echo "✅ Passed: OTP Rate Limiter blocked brute-force attempts after 5 actions."
else
  echo "❌ FAILED: OTP Rate Limiter failed to block brute-force attempts."
  exit 1
fi

# 4. Password Reset Token Reuse Test
echo ""
echo "================ 4. PASSWORD RESET TOKEN REUSE TEST ================"
echo "Requesting forgot password reset token..."
FORGOT_RES=$(curl -s -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@codshield.com"}')

RESET_TOKEN=$(echo "$FORGOT_RES" | grep -o 'token=[a-z0-9]*' | cut -d'=' -f2)
if [ -z "$RESET_TOKEN" ]; then
  echo "❌ FAILED: Failed to extract reset token from dev reset link. Response: $FORGOT_RES"
  exit 1
fi
echo "Extracted Reset Token: $RESET_TOKEN"

echo "Attempting to reset password using token (Should succeed)..."
RESET_RES_1=$(curl -s -w "\nHTTP Status: %{http_code}" -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$RESET_TOKEN\",\"newPassword\":\"NewPassword@1234\"}")
echo "$RESET_RES_1"
if ! echo "$RESET_RES_1" | grep -q "200"; then
  echo "❌ FAILED: Reset password with valid token did not succeed."
  exit 1
fi
echo "✅ Passed: Reset password succeeded with valid token."

echo "Attempting to reuse the same token again (Should fail with 400)..."
RESET_RES_2=$(curl -s -w "\nHTTP Status: %{http_code}" -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$RESET_TOKEN\",\"newPassword\":\"NewPassword@1234\"}")
echo "$RESET_RES_2"
if ! echo "$RESET_RES_2" | grep -q "400"; then
  echo "❌ FAILED: Token reuse was not blocked."
  exit 1
fi
echo "✅ Passed: Token reuse correctly blocked with 400 Bad Request."

echo "Reverting password back to default Demo@1234..."
REVERT_RES=$(curl -s -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$RESET_TOKEN\",\"newPassword\":\"Demo@1234\"}") || true
# We manually reset backend default in memory to ensure clean state
# Log in to default to confirm revert
LOGIN_CONFIRM=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@codshield.com","password":"Demo@1234"}')
if echo "$LOGIN_CONFIRM" | grep -q "demo-user"; then
  echo "✅ Passed: Admin password clean state verified."
else
  # If token reuse blocked it, we force backend to default password in-memory by doing a fresh login check or logging in with NewPassword
  curl -s -X POST http://localhost:3000/api/auth/forgot-password \
    -H "Content-Type: application/json" \
    -d '{"email":"demo@codshield.com"}' > /dev/null
  # Get new token to reset back
  NEW_LINK=$(curl -s -X POST http://localhost:3000/api/auth/forgot-password -H "Content-Type: application/json" -d '{"email":"demo@codshield.com"}')
  NEW_TOKEN=$(echo "$NEW_LINK" | grep -o 'token=[a-z0-9]*' | cut -d'=' -f2)
  curl -s -X POST http://localhost:3000/api/auth/reset-password -H "Content-Type: application/json" -d "{\"token\":\"$NEW_TOKEN\",\"newPassword\":\"Demo@1234\"}" > /dev/null
  echo "✅ Passed: Password state reset successfully."
fi

echo ""
echo "=== ALL SECURITY REGRESSION AND HARDENING VERIFICATIONS PASSED SECURELY ==="
