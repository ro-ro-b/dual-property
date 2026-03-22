import { NextRequest, NextResponse } from "next/server";
import { getDataProvider } from "@/lib/data-provider";

export const dynamic = "force-dynamic";

const FALLBACK_ORG_ID = '69b935b4187e903f826bbe71';

// Helper: get an org-scoped JWT from a cookie (switching from system if needed)
async function getOrgScopedToken(req: NextRequest): Promise<string> {
  const BASE = process.env.NEXT_PUBLIC_DUAL_API_URL || 'https://gateway-48587430648.europe-west6.run.app';
  let jwtToken = req.cookies.get('dual_jwt')?.value || process.env.DUAL_API_TOKEN || '';
  const orgId = process.env.DUAL_ORG_ID || FALLBACK_ORG_ID;

  if (jwtToken) {
    try {
      const payload = JSON.parse(Buffer.from(jwtToken.split('.')[1], 'base64').toString());
      if (payload.fqdn === 'system' && orgId) {
        const switchRes = await fetch(`${BASE}/organizations/switch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` },
          body: JSON.stringify({ id: orgId }),
        });
        if (switchRes.ok) {
          const switchData = await switchRes.json();
          jwtToken = switchData.access_token || jwtToken;
        }
      }
    } catch { /* use as-is */ }
  }
  return jwtToken;
}

// Map a raw DUAL gateway object to the property format the detail page expects
function mapObjectToProperty(obj: any, id: string) {
  const custom = obj.custom || {};
  const meta = obj.metadata || {};
  const inv = custom.investment || {};
  const fin = custom.financials || {};

  const city = custom.city || '';
  const country = custom.country || '';
  const address = custom.address || '';
  const locationStr = [address, city, country].filter(Boolean).join(', ') || 'DUAL Network';

  return {
    id: obj.id || obj._id || id,
    name: custom.name || meta.name || `Property ${(id || '').slice(-6)}`,
    description: custom.description || meta.description || 'A tokenized real estate property on the DUAL network.',
    location: locationStr,
    type: custom.propertyType || 'Property',
    totalValue: inv.totalPropertyValue || 0,
    tokenPrice: inv.tokenPricePerShare || 0,
    yieldPercent: inv.annualYield || 0,
    fundedPercent: 100,
    sqft: custom.totalSqft || 0,
    yearBuilt: custom.yearBuilt,
    units: custom.numberOfUnits,
    features: Array.isArray(custom.keyFeatures) ? custom.keyFeatures : [],
    rentalIncome: fin.monthlyRentalIncome,
    expenses: fin.annualExpenses,
    capRate: fin.capRate,
    projectedReturn: fin.projectedAppreciation,
    contractAddress: '0x41Cf00E593c5623B00F812bC70Ee1A737C5aFF06',
    integrityHash: obj.integrity_hash,
    ownerAddress: obj.owner_id || obj.owner,
    tokenCount: inv.totalTokens || 1,
    metadata: { ...custom, ...meta },
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const BASE = process.env.NEXT_PUBLIC_DUAL_API_URL || 'https://gateway-48587430648.europe-west6.run.app';
    const jwtToken = await getOrgScopedToken(req);

    if (jwtToken) {
      // Direct HTTP call to DUAL gateway
      const res = await fetch(`${BASE}/objects/${params.propertyId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`,
        },
        cache: 'no-store',
      });

      if (res.ok) {
        const obj = await res.json();
        return NextResponse.json({ property: mapObjectToProperty(obj, params.propertyId) });
      }
    }

    // Fallback to data provider
    const provider = getDataProvider();
    const property = await provider.getProperty(params.propertyId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    return NextResponse.json({ property });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
