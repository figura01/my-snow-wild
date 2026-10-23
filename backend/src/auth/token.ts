import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { UserRole } from "../entities/User";

export const AUTH_COOKIE = "snow_token";
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

// Le jeton ne contient que l'identifiant et le rôle : son contenu est lisible
// par quiconque le possède, on n'y met donc jamais de donnée sensible.
export type TokenPayload = { sub: string; role: UserRole };

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    algorithm: "HS256",
    expiresIn: MAX_AGE_SECONDS,
  });
}

export function verifyToken(token: string | undefined): TokenPayload | null {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] });
    if (typeof decoded === "string" || !decoded.sub || !decoded.role) return null;
    return { sub: String(decoded.sub), role: decoded.role as UserRole };
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.isProd,
  path: "/",
  maxAge: MAX_AGE_SECONDS * 1000,
};
