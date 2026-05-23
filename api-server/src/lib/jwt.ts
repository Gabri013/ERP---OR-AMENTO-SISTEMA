import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || "sistema-os-jwt-secret-change-me";
const JWT_ISSUER = "sistema-os";
const JWT_AUDIENCE = "sistema-os-web";

const secret = new TextEncoder().encode(JWT_SECRET);

export interface UserClaims {
  sub: number;
  nome: string;
  email: string;
  tipo: string;
}

/**
 * Signs a short-lived JWT for the authenticated user.
 * Used after successful login to replace the old express-session.
 */
export async function signUserToken(user: UserClaims, expiresIn: string = "7d"): Promise<string> {
  return await new SignJWT({ ...user, sub: String(user.sub) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(expiresIn)
    .sign(secret);
}

/**
 * Verifies a Bearer token (or cookie value) and returns the claims if valid.
 * Returns null on any error (expired, tampered, etc.).
 */
export async function verifyUserToken(token: string): Promise<UserClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    const subNum = typeof payload.sub === "string" ? parseInt(payload.sub, 10) : (typeof payload.sub === "number" ? payload.sub : NaN);
    if (!Number.isFinite(subNum) || !payload.nome || !payload.email || !payload.tipo) {
      return null;
    }

    return {
      sub: subNum,
      nome: payload.nome as string,
      email: payload.email as string,
      tipo: payload.tipo as string,
    };
  } catch {
    return null;
  }
}

export type { JWTPayload };
