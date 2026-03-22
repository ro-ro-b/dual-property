/**
 * Shared utility: extract a JWT from the request and ensure it has org scope.
 *
 * On Vercel serverless the in-memory auth cache is lost between invocations,
 * so we read the JWT from the cookie / Authorization header and, if it's a
 * system-scoped token, perform an automatic org switch against the DUAL gateway.
 */

import { NextRequest } from 'next/server';

const FALLBACK_ORG_ID = '69b935b4187e903f826bbe71';
const BASE_URL = () =>
  process.env.NEXT_PUBLIC_DUAL_API_URL || 'https://gateway-48587430648.europe-west6.run.app';

/**
 * Returns an org-scoped JWT string (or empty string if none available).
 * Sources checked in order: Authorization header → cookie → env var.
 */
export async function getOrgToken(req: NextRequest): Promise<string> {
  const authHeader = req.headers.get('authorization');
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const cookieToken = req.cookies.get('dual_jwt')?.value;
  let token = headerToken || cookieToken || process.env.DUAL_API_TOKEN || '';

  if (!token) return '';

  const orgId = process.env.DUAL_ORG_ID || FALLBACK_ORG_ID;

  // Check if this is a system-scoped JWT that needs org switching
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
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
        token = data.access_token || token;
      }
    }
  } catch {
    // JWT parse error — use as-is
  }

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
