import { Request, Response, NextFunction } from "express";
import { SESSION_COOKIE_NAME, SessionPayload, verifySessionToken } from "../lib/auth";

export interface AuthenticatedRequest extends Request {
  session?: SessionPayload;
}

function extractSessionToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;

  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  return match?.[1];
}

export async function requireSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractSessionToken(req);
  if (!token) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }

  const session = await verifySessionToken(token);
  if (!session) {
    res.status(401).json({ success: false, message: "Invalid or expired session" });
    return;
  }

  req.session = session;
  next();
}
