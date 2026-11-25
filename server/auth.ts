import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { db } from './db.ts';

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const SESSION_SECRET = process.env.SESSION_SECRET?.trim() || crypto.randomBytes(32).toString('hex');

const revokedTokens = new Map<string, number>();

function cleanupExpiredRevocations(): void {
  const now = Date.now();
  for (const [jti, exp] of revokedTokens.entries()) {
    if (exp <= now) {
      revokedTokens.delete(jti);
    }
  }
}

function getEnvPasscode(): string {
  return process.env.ADMIN_PASSCODE?.trim() || '';
}

function hashPasswordScrypt(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPasswordScrypt(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  if (!salt || !keyHex) return false;

  const derived = crypto.scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derived, storedBuf);
}

function timingSafeCompareStrings(a: string, b: string): boolean {
  const digestA = crypto.createHash('sha256').update(a).digest();
  const digestB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(digestA, digestB);
}

export function getAdminAuthStatus(): { configured: boolean; requiresSetup: boolean } {
  if (getEnvPasscode().length > 0) {
    return { configured: true, requiresSetup: false };
  }
  const row = db.prepare('SELECT id FROM admin_credentials WHERE id = 1').get();
  if (row) {
    return { configured: true, requiresSetup: false };
  }
  return { configured: false, requiresSetup: true };
}

export function claimInitialAdminPassword(password: string): boolean {
  if (getEnvPasscode().length > 0) {
    return false;
  }
  const hashed = hashPasswordScrypt(password);
  const claimTx = db.transaction(() => {
    const existing = db.prepare('SELECT id FROM admin_credentials WHERE id = 1').get();
    if (existing) {
      return false;
    }
    db.prepare('INSERT INTO admin_credentials (id, password_hash, claimed_at) VALUES (1, ?, ?)').run(
      hashed,
      new Date().toISOString()
    );
    return true;
  });
  return claimTx();
}

export function verifyAdminPassword(password: string): boolean {
  const envPass = getEnvPasscode();
  if (envPass.length > 0) {
    return timingSafeCompareStrings(password, envPass);
  }
  const row = db.prepare('SELECT password_hash FROM admin_credentials WHERE id = 1').get() as
    | { password_hash: string }
    | undefined;
  if (!row) return false;
  return verifyPasswordScrypt(password, row.password_hash);
}

interface TokenPayload {
  role: 'admin';
  jti: string;
  exp: number;
}

export function issueAdminToken(): string {
  const payload: TokenPayload = {
    role: 'admin',
    jti: crypto.randomUUID(),
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function verifyAdminToken(token: string): TokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encodedPayload, signature] = parts;
  if (!encodedPayload || !signature) return null;

  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  const sigBuf = Buffer.from(signature, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as TokenPayload;
    if (payload.role !== 'admin' || typeof payload.exp !== 'number' || payload.exp <= Date.now()) {
      return null;
    }
    cleanupExpiredRevocations();
    if (revokedTokens.has(payload.jti)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function revokeAdminToken(token: string): void {
  const payload = verifyAdminToken(token);
  if (payload) {
    revokedTokens.set(payload.jti, payload.exp);
  }
}

export function extractBearerToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice('Bearer '.length).trim() || null;
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!token || !verifyAdminToken(token)) {
    res.status(401).json({ error: 'Sessão administrativa expirada ou não autorizada.' });
    return;
  }
  next();
}
