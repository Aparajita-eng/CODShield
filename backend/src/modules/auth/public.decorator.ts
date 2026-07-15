import { SetMetadata } from '@nestjs/common';

/**
 * Mark a route or controller as publicly accessible.
 * When applied, both AuthGuard and RolesGuard will skip authentication checks.
 * Only routes that genuinely require NO authentication should use this decorator.
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
