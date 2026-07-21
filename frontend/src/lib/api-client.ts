import { BACKEND_BASE_URL } from "@/lib/config";

const BACKEND_URL = BACKEND_BASE_URL;

// Error types for better error handling
export enum ApiErrorType {
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT",
  SERVER_ERROR = "SERVER_ERROR",
  BACKEND_UNAVAILABLE = "BACKEND_UNAVAILABLE",
  DATABASE_UNAVAILABLE = "DATABASE_UNAVAILABLE",
  UNAUTHORIZED = "UNAUTHORIZED",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UNKNOWN = "UNKNOWN",
}

export class ApiError extends Error {
  type: ApiErrorType;
  status?: number;
  details?: any;

  constructor(message: string, type: ApiErrorType, status?: number, details?: any) {
    super(message);
    this.name = "ApiError";
    this.type = type;
    this.status = status;
    this.details = details;
  }
}

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryableErrors: ["NETWORK_ERROR", "TIMEOUT", "BACKEND_UNAVAILABLE"],
};

// Exponential backoff with jitter
function getRetryDelay(attempt: number): number {
  const exponentialDelay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay; // Add 30% jitter
  return Math.min(exponentialDelay + jitter, RETRY_CONFIG.maxDelay);
}

// Determine if error is retryable
function isRetryable(error: any, attempt: number): boolean {
  if (attempt >= RETRY_CONFIG.maxRetries) return false;

  // Retry on network errors
  if (error instanceof ApiError && RETRY_CONFIG.retryableErrors.includes(error.type)) {
    return true;
  }

  // Retry on specific HTTP status codes
  if (error.status && RETRY_CONFIG.retryableStatuses.includes(error.status)) {
    return true;
  }

  return false;
}

// Parse error response and create appropriate ApiError
function parseErrorResponse(data: any, status: number): ApiError {
  if (status === 401) {
    return new ApiError(data.message || "Unauthorized", ApiErrorType.UNAUTHORIZED, status);
  }

  if (status === 422) {
    return new ApiError(data.message || "Validation failed", ApiErrorType.VALIDATION_ERROR, status, data);
  }

  if (status >= 500) {
    if (data.message?.includes("database") || data.message?.includes("Database")) {
      return new ApiError("Database unavailable", ApiErrorType.DATABASE_UNAVAILABLE, status);
    }
    return new ApiError("Server error", ApiErrorType.SERVER_ERROR, status);
  }

  return new ApiError(data.message || "Request failed", ApiErrorType.UNKNOWN, status);
}

// Main API client with retry logic
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
  customRetryConfig?: Partial<typeof RETRY_CONFIG>
): Promise<Response> {
  const config = { ...RETRY_CONFIG, ...customRetryConfig };
  const url = `${BACKEND_URL}${endpoint}`;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const error = parseErrorResponse(data, response.status);
        
        if (isRetryable(error, attempt)) {
          lastError = error;
          const delay = getRetryDelay(attempt);
          console.log(`API request failed (attempt ${attempt + 1}/${config.maxRetries}), retrying in ${delay}ms...`, {
            endpoint,
            status: response.status,
            error: error.message,
          });
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw error;
      }

      return response;
    } catch (error: any) {
      if (error.name === "AbortError") {
        lastError = new ApiError("Request timeout", ApiErrorType.TIMEOUT);
      } else if (error instanceof ApiError) {
        lastError = error;
      } else {
        lastError = new ApiError("Network error - backend unreachable", ApiErrorType.NETWORK_ERROR);
      }

      if (isRetryable(lastError, attempt)) {
        const delay = getRetryDelay(attempt);
        console.log(`API request failed (attempt ${attempt + 1}/${config.maxRetries}), retrying in ${delay}ms...`, {
          endpoint,
          error: lastError.message,
        });
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw lastError;
    }
  }

  throw lastError || new ApiError("Unknown error occurred", ApiErrorType.UNKNOWN);
}

// Helper function to get user-friendly error message
export function getUserFriendlyError(error: ApiError): string {
  switch (error.type) {
    case ApiErrorType.NETWORK_ERROR:
      return "Network error - please check your connection";
    case ApiErrorType.TIMEOUT:
      return "Request timed out - please try again";
    case ApiErrorType.SERVER_ERROR:
      return "Server error - please try again later";
    case ApiErrorType.BACKEND_UNAVAILABLE:
      return "Backend is starting up - please wait a moment";
    case ApiErrorType.DATABASE_UNAVAILABLE:
      return "Database temporarily unavailable - please try again";
    case ApiErrorType.UNAUTHORIZED:
      return "Invalid credentials";
    case ApiErrorType.VALIDATION_ERROR:
      return error.message || "Invalid input";
    default:
      return error.message || "An error occurred";
  }
}

// Health check function
export async function checkBackendHealth(): Promise<{ ok: boolean; message: string; starting?: boolean }> {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000), // 5 second timeout for health check
    });

    if (response.ok) {
      const data = await response.json();
      if (data.status === "ok" && data.database === "connected") {
        return { ok: true, message: "Backend ready" };
      }
      if (data.status === "degraded" || data.database !== "connected") {
        return { ok: false, message: "Backend starting up", starting: true };
      }
    }
    return { ok: false, message: "Backend unavailable", starting: true };
  } catch (error) {
    return { ok: false, message: "Backend unreachable", starting: true };
  }
}
