/**
 * Server-side backend URL config.
 * Uses BACKEND_URL (runtime, never baked into bundle) with
 * NEXT_PUBLIC_BACKEND_URL as a fallback for local dev.
 *
 * On Render: set BACKEND_URL in the frontend service env vars.
 * In local dev: NEXT_PUBLIC_BACKEND_URL in .env is used.
 */

function resolveBackendUrl(): string {
  // Server-only env var — NOT baked into the client bundle at build time.
  // This is the correct variable to use for server→server calls.
  const url =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:5001";

  // Strip any trailing slash to prevent //api double-slash issues
  return url.replace(/\/$/, "");
}

export const BACKEND_BASE_URL = resolveBackendUrl();
