/**
 * DUAL Auth Helper — Server-side JWT management
 *
 * Flow: OTP → login → org switch → org-scoped JWT
 * The org-scoped JWT is cached in memory and auto-refreshed.
 *
 * For server-side API routes that need write access (mint, transfer, burn),
 * call getAuthenticatedClient() to get a DualClient with a valid org-scoped JWT.
 */
import { DualClient } from './dual-sdk';

const BASE_URL = process.env.NEXT_PUBLIC_DUAL_API_URL || 'https://gateway-48587430648.europe-west6.run.app';
const ORG_ID = process.env.DUAL_ORG_ID || '';
const API_KEY = process.env.DUAL_API_KEY || '';

// ─── JWT Token Cache ───
interface TokenCache {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // ms timestamp
}

let _tokenCache: TokenCache | null = null;

function isTokenValid(): boolean {
  if (!_tokenCache) return false;
  // Refresh 5 minutes before expiry
  return Date.now() < _tokenCache.expiresAt - 300_000;
}

function parseJwtExp(token: string): number {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return (payload.exp || 0) * 1000;
  } catch {
    return Date.now() + 3600_000; // fallback: 1 hour
  }
}

// ─── Auth Flow ───

/**
 * Step 1: Send OTP to the admin email.
 * This must be called first — the user then provides the OTP code.
 */
export async function sendOtp(email: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `OTP send failed: ${res.status}`);
  }
}

/**
 * Step 2: Login with email + OTP code.
 * Returns system-scoped JWT. Then switches to org context.
 */
export async function loginWithOtp(email: string, otp: string): Promise<TokenCache> {
  // Login → system-scoped JWT
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  if (!loginRes.ok) {
    const err = await loginRes.json().catch(() => ({}));
    throw new Error(err.message || `Login failed: ${loginRes.status}`);
  }
  const loginData = await loginRes.json();
  const systemToken = loginData.access_token;

  if (!ORG_ID) {
    // No org configured — use system token directly
    _tokenCache = {
      accessToken: systemToken,
      refreshToken: loginData.refresh_token,
      expiresAt: parseJwtExp(systemToken),
    };
    return _tokenCache;
  }

  // Switch to org context → org-scoped JWT
  const switchRes = await fetch(`${BASE_URL}/organizations/switch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${systemToken}`,
    },
    body: JSON.stringify({ id: ORG_ID }),
  });
  if (!switchRes.ok) {
    const err = await switchRes.json().catch(() => ({}));
    throw new Error(err.message || `Org switch failed: ${switchRes.status}`);
  }
  const switchData = await switchRes.json();
  const orgToken = switchData.access_token;

  _tokenCache = {
    accessToken: orgToken,
    refreshToken: loginData.refresh_token,
    expiresAt: parseJwtExp(orgToken),
  };
  return _tokenCache;
}

/**
 * Try to refresh the JWT using the refresh token.
 */
async function refreshJwt(): Promise<boolean> {
  if (!_tokenCache?.refreshToken) return false;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: _tokenCache.refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    const newToken = data.access_token;

    // If we have an org, switch again
    if (ORG_ID) {
      const switchRes = await fetch(`${BASE_URL}/organizations/switch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${newToken}`,
        },
        body: JSON.stringify({ id: ORG_ID }),
      });
      if (switchRes.ok) {
        const switchData = await switchRes.json();
        _tokenCache = {
          accessToken: switchData.access_token,
          refreshToken: data.refresh_token || _tokenCache.refreshToken,
          expiresAt: parseJwtExp(switchData.access_token),
        };
        return true;
      }
    }

    _tokenCache = {
      accessToken: newToken,
      refreshToken: data.refresh_token || _tokenCache.refreshToken,
      expiresAt: parseJwtExp(newToken),
    };
    return true;
  } catch {
    return false;
  }
}

/**
 * Get an authenticated DualClient with a valid org-scoped JWT.
 * Returns null if no JWT is cached (user needs to login via OTP first).
 */
export async function getAuthenticatedClient(): Promise<DualClient | null> {
  // Try refresh if expired
  if (_tokenCache && !isTokenValid()) {
    const refreshed = await refreshJwt();
    if (!refreshed) {
      _tokenCache = null;
      return null;
    }
  }

  if (!_tokenCache) return null;

  const client = new DualClient({
    baseUrl: BASE_URL,
    token: _tokenCache.accessToken,
    apiKey: API_KEY,
    timeout: 30000,
    retry: { maxAttempts: 2, backoffMs: 500 },
  });
  return client;
}

/**
 * Check if we have a valid JWT cached (user is authenticated).
 */
export function isAuthenticated(): boolean {
  return isTokenValid();
}

/**
 * Get the raw JWT token string (for direct HTTP calls).
 */
export function getJwtToken(): string | null {
  if (!_tokenCache || !isTokenValid()) return null;
  return _tokenCache.accessToken;
}

/**
 * Clear the cached JWT (logout).
 */
export function clearAuth(): void {
  _tokenCache = null;
}
