import { NextRequest, NextResponse } from "next/server";
import { getOrgToken, dualFetch } from "@/lib/get-org-token";
import { getAuthenticatedClient } from "@/lib/dual-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const envToken = process.env.DUAL_API_TOKEN || '';
  const orgId = process.env.DUAL_ORG_ID || '69b935b4187e903f826bbe71';
  const templateId = process.env.DUAL_PROPERTIES_TEMPLATE_ID || '69c057ffee7cf8d3342efec4';

  // Parse env token JWT
  let envTokenInfo: any = { present: !!envToken, length: envToken.length };
  if (envToken) {
    try {
      const payload = JSON.parse(Buffer.from(envToken.split('.')[1], 'base64').toString());
      const exp = (payload.exp || 0) * 1000;
      envTokenInfo = {
        ...envTokenInfo,
        fqdn: payload.fqdn,
        org_id: payload.org_id,
        exp: new Date(exp).toISOString(),
        expired: Date.now() > exp - 60_000,
        sub: payload.sub,
      };
    } catch (e: any) {
      envTokenInfo.parseError = e.message;
    }
  }

  // Try getOrgToken
  let orgTokenResult = '';
  try {
    orgTokenResult = await getOrgToken(req);
  } catch (e: any) {
    orgTokenResult = `ERROR: ${e.message}`;
  }

  let orgTokenInfo: any = { present: !!orgTokenResult, length: orgTokenResult.length };
  if (orgTokenResult && !orgTokenResult.startsWith('ERROR')) {
    try {
      const payload = JSON.parse(Buffer.from(orgTokenResult.split('.')[1], 'base64').toString());
      const exp = (payload.exp || 0) * 1000;
      orgTokenInfo = {
        ...orgTokenInfo,
        fqdn: payload.fqdn,
        org_id: payload.org_id,
        exp: new Date(exp).toISOString(),
        expired: Date.now() > exp - 60_000,
      };
    } catch {}
  }

  // Try direct gateway call with env token
  let directResult: any = {};
  if (envToken) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_DUAL_API_URL || 'https://gateway-48587430648.europe-west6.run.app'}/objects?template_id=${templateId}&limit=2`,
        {
          headers: {
            'Authorization': `Bearer ${envToken}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        }
      );
      const text = await res.text();
      directResult = {
        status: res.status,
        body: text.slice(0, 500),
      };
    } catch (e: any) {
      directResult = { error: e.message };
    }
  }

  // Try with orgToken
  let orgTokenFetchResult: any = {};
  if (orgTokenResult && !orgTokenResult.startsWith('ERROR')) {
    try {
      const res = await dualFetch(`/objects?template_id=${templateId}&limit=2`, orgTokenResult);
      const text = await res.text();
      orgTokenFetchResult = {
        status: res.status,
        body: text.slice(0, 500),
      };
    } catch (e: any) {
      orgTokenFetchResult = { error: e.message };
    }
  }

  return NextResponse.json({
    now: new Date().toISOString(),
    orgId,
    templateId,
    envToken: envTokenInfo,
    orgToken: orgTokenInfo,
    directFetchWithEnvToken: directResult,
    fetchWithOrgToken: orgTokenFetchResult,
  }, { status: 200 });
}
