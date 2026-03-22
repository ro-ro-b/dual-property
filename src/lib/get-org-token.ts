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
  const envToken = process.env.DUAL_API_TOKEN || '';
  let token = headerToken || cookieToken || envToken;

  if (!token) return '';

  const orgId = process.env.DUAL_ORG_ID || FALLBACK_ORG_ID;
  const isEnvToken = !headerToken && !cookieToken && token === envToken;

  // If the token isn't a JWT (e.g. it's an API key), return it as-is
  // — dualFetch will send it as X-Api-Key instead of Bearer
  if (!isJwt(token)) {
    return token;
  }

  // Check if JWT is expired and try to refresh
  const { expired } = parseJwt(token);
  if (expired) {
    if (refreshCookie) {
      const refreshed = await refreshToken(refreshCookie);
      if (refreshed) {
        token = refreshed;
      } else if (!isEnvToken) {
        // Refresh failed for a user token — unusable
        return '';
      }
    } else if (!isEnvToken) {
      // User token expired with no refresh — unusable
      return '';
    }
    // env token: always try it even if expired — let the gateway decide
  }

  // Switch to org scope if needed
  token = await switchToOrg(token, orgId);

  return token;
}

/**
 * Check if a string looks like a JWT (three dot-separated base64 segments).
 */
function isJwt(token: string): boolean {
  return token.split('.').length === 3;
}

/**
 * Convenience: make an authenticated request to the DUAL gateway.
 * Supports both JWT bearer tokens and API keys.
 */
export async function dualFetch(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<Response> {
  const url = `${BASE_URL()}${path}`;
  const apiKey = process.env.DUAL_API_KEY || process.env.DUAL_API_TOKEN || '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Use JWT as Bearer if it's a proper JWT, otherwise try API key header
  if (token && isJwt(token)) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // Always include API key if available (gateway may accept either)
  if (apiKey) {
    headers['X-Api-Key'] = apiKey;
  }

  return fetch(url, { ...options, headers, cache: 'no-store' });
}
