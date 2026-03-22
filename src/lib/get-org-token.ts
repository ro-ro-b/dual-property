/**
 * Shared utility: extract a JWT from the request and ensure it has org scope.
 *
 * On Vercel serverless the in-memory auth cache is lost between invocations,
 * so we read the JWT from the cookie / Authorization header and, if it's a
 * system-scoped token, perform an automatic org switch against the DUAL gateway.
 *
 * If the JWT has expired, attempts auto-refresh using the refresh token cookie.
 */

import { NextRequest } from 'next/server';

const FALLBACK_ORG_ID = '69b935b4187e903f826bbe71';
const BASE_URL = () =>
  process.env.NEXT_PUBLIC_DUAL_API_URL || 'https://gateway-48587430648.europe-west6.run.app';

/**
 * Parse JWT payload and check if expired.
 */
function parseJwt(token: string): { payload: any; expired: boolean } {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const exp = (payload.exp || 0) * 1000;
    // Consider expired if less than 60 seconds remaining
    const expired = exp > 0 && Date.now() > exp - 60_000;
    return { payload, expired };
  } catch {
    return { payload: {}, expired: false };
  }
}

/**
 * Attempt to refresh an expired JWT using the refresh token.
 */
async function refreshToken(refreshJwt: string): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL()}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshJwt }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Switch a JWT to org scope if it's system-scoped.
 */
async function switchToOrg(token: string, orgId: string): Promise<string> {
  try {
    const { payload } = parseJwt(token);
    if (payload.fqdn === 'system' && orgId) {
      const switchRes = await fetch(`${BASE_URL()}/organizations/switch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id: orgId }),
      });
      if (switchRes.ok) {
        const data = await switchRes.json();
        return data.access_token || token;
      }
    }
  } catch {
    // Org switch failed — use token as-is
  }
  return token;
}

/**
 * Returns an org-scoped JWT string (or empty string if none available).
 * Sources checked in order: Authorization header → cookie → env var.
 * Auto-refreshes expired JWTs using the refresh token cookie.
 */
export async function getOrgToken(req: NextRequest): Promise<string> {
  const authHeader = req.headers.get('authorization');
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const cookieToken = req.cookies.get('dual_jwt')?.value;
  const refreshCookie = req.cookies.get('dual_refresh')?.value;
  let token = headerToken || cookieToken || process.env.DUAL_API_TOKEN || '';

  if (!token) return '';

  const orgId = process.env.DUAL_ORG_ID || FALLBACK_ORG_ID;

  // Check if JWT is expired and try to refresh
  const { expired } = parseJwt(token);
  if (expired && refreshCookie) {
    const refreshed = await refreshToken(refreshCookie);
    if (refreshed) {
      token = refreshed;
    } else {
      // Refresh failed — token is expired and unusable
      return '';
    }
  }

  // Switch to org scope if needed
  token = await switchToOrg(token, orgId);

  return token;
}

/**
 * Convenience: make an authenticated request to the DUAL gateway.
 */
export async function dualFetch(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<Response> {
  const url = `${BASE_URL()}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };
  return fetch(url, { ...options, headers, cache: 'no-store' });
}
