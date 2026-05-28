import qrcode from "qrcode";
import speakeasy from "speakeasy";

export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

export function generateBackupCodes(count = 8): string[] {
  return Array.from({ length: count }, () =>
    Math.random().toString(36).slice(2, 10).toUpperCase(),
  );
}

export async function generateTwoFactorSecret(email: string): Promise<TwoFactorSetup> {
  const secret = speakeasy.generateSecret({
    length: 20,
    name: `ERP Cozinca (${email})`,
    issuer: "ERP Cozinca",
  });

  const otpauthUrl = secret.otpauth_url ?? "";
  const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

  return {
    secret: secret.base32,
    otpauthUrl,
    qrCodeDataUrl,
    backupCodes: generateBackupCodes(),
  };
}

export function verifyToken(secret: string, token: string): boolean {
  if (!secret || !token) return false;
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 1,
  });
}

export function verifyBackupCode(codes: string[] | undefined, code: string): { valid: boolean; index?: number } {
  if (!codes?.length) return { valid: false };
  const normalized = code.trim().toUpperCase();
  const index = codes.findIndex((item) => item === normalized);
  return index >= 0 ? { valid: true, index } : { valid: false };
}
