import 'dotenv/config';
import { strict as assert } from 'assert';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../roles.guard';
import { signSessionToken, verifySessionToken } from '../../../lib/auth';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';

let currentRequiredRoles: string[] | null = null;
let mockUserData: any = null;

const mockReflector = {
  getAllAndOverride: (key: string, targets: any[]) => {
    if (key === 'isPublic') return false;  // routes are not @Public() in these tests
    return currentRequiredRoles;           // 'roles' key
  }
} as unknown as Reflector;

const mockPrisma = {
  user: {
    findUnique: async (args: any) => {
      return mockUserData;
    },
    findFirst: async (args: any) => {
      return mockUserData;
    }
  }
} as any;

/**
 * Create a mock ExecutionContext.
 * The updated RolesGuard reads request.session directly (populated by AuthGuard upstream).
 * Pass session={} to simulate an already-authenticated request; omit for "no session" tests.
 */
function createMockContext(session?: any): any {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ session })
    }),
    getHandler: () => ({}),
    getClass: () => ({})
  };
}

async function runTests() {
  console.log('=== STARTING ROLESGUARD PATH UNIT TESTS ===');

  const guard = new RolesGuard(mockReflector, mockPrisma);

  // 1. Path A: No roles specified -> allows access (returns true regardless of session)
  {
    currentRequiredRoles = null;
    const context = createMockContext();
    const res = await guard.canActivate(context);
    assert.equal(res, true);
    console.log('✅ Test 1 Passed: No required roles allows access.');
  }

  // 2. Path B: Roles specified, no session -> throws 401
  //    Simulates: AuthGuard somehow didn't run (misconfiguration), session is undefined
  {
    currentRequiredRoles = ['Admin', 'Owner'];
    const context = createMockContext(undefined);  // no session
    await assert.rejects(
      async () => {
        await guard.canActivate(context);
      },
      (err: any) => {
        assert(err instanceof UnauthorizedException,
          `Expected UnauthorizedException, got ${err?.constructor?.name}`);
        assert.equal(err.message, 'Unauthorized: Authentication required');
        return true;
      }
    );
    console.log('✅ Test 2 Passed: Missing session throws 401 Unauthorized.');
  }

  // 3. Path C: Roles specified, session present but user has wrong role -> 403
  //    (Token verification is now AuthGuard's responsibility; RolesGuard reads session directly)
  {
    currentRequiredRoles = ['Owner'];
    mockUserData = { role: 'Viewer' };

    // Simulate a valid session that AuthGuard would have verified and attached
    const session = { sub: 'user-123', email: 'test@codshield.com', authType: 'password' };
    const context = createMockContext(session);

    await assert.rejects(
      async () => {
        await guard.canActivate(context);
      },
      (err: any) => {
        assert(err instanceof ForbiddenException,
          `Expected ForbiddenException, got ${err?.constructor?.name}`);
        assert.equal(err.message, 'Forbidden resource: insufficient permissions');
        return true;
      }
    );
    console.log('✅ Test 3 Passed: Viewer role correctly throws 403 Forbidden.');
  }

  // 3b. Expired token is rejected by AuthGuard (not RolesGuard).
  //     Verify verifySessionToken returns null for an expired token — the mechanism AuthGuard uses.
  {
    const expiredToken = await signSessionToken(
      { sub: 'user-123', email: 'test@codshield.com', authType: 'password' },
      '-10s'
    );
    const result = await verifySessionToken(expiredToken);
    assert.equal(result, null,
      'verifySessionToken should return null for an expired token');
    console.log('✅ Test 3b Passed: verifySessionToken returns null for expired token (AuthGuard blocks before RolesGuard).');
  }

  // 4. Path D: Roles specified, valid session and insufficient role -> 403
  {
    currentRequiredRoles = ['Administrator'];
    mockUserData = { role: 'Viewer' };

    const session = { sub: 'user-456', email: 'viewer@codshield.com', authType: 'password' };
    const context = createMockContext(session);

    await assert.rejects(
      async () => {
        await guard.canActivate(context);
      },
      (err: any) => {
        assert(err instanceof ForbiddenException,
          `Expected ForbiddenException, got ${err?.constructor?.name}`);
        assert.equal(err.message, 'Forbidden resource: insufficient permissions');
        return true;
      }
    );
    console.log('✅ Test 4 Passed: Insufficient permissions throws 403 Forbidden.');
  }

  // 5. Path E: Roles specified, valid session and matching role -> allows access
  {
    currentRequiredRoles = ['Owner'];
    mockUserData = { role: 'Owner' };

    const session = { sub: 'user-123', email: 'test@codshield.com', authType: 'password' };
    const context = createMockContext(session);

    const res = await guard.canActivate(context);
    assert.equal(res, true);
    console.log('✅ Test 5 Passed: Valid session and matching role allows access.');
  }

  console.log('=== ALL ROLESGUARD PATH TESTS COMPLETED SUCCESSFULLY ===');
}

runTests().catch((err) => {
  console.error('❌ A RolesGuard spec test failed:', err);
  process.exit(1);
});
