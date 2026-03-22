import { NextRequest, NextResponse } from "next/server";
import { getDataProvider } from "@/lib/data-provider";
import { getOrgToken, dualFetch } from "@/lib/get-org-token";
import { getAuthenticatedClient } from "@/lib/dual-auth";

export const dynamic = "force-dynamic";

// Helper: get an org-scoped JWT trying all available sources
async function getOrgScopedToken(req: NextRequest): Promise<string> {
  // 1. Try shared getOrgToken (cookie/header/env with auto-refresh)
  let token = await getOrgToken(req);
  if (token) return token;

  // 2. Try server-side cached auth client
  try {
    const client = await getAuthenticatedClient();
    if (client) {
      const clientToken = (client as any).http?.token || (client as any).config?.token || '';
      if (clientToken) return clientToken;
    }
  } catch { /* no cached client */ }

  // 3. Last resort: raw env token
  return process.env.DUAL_API_TOKEN || '';
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
    imageUrl: custom.imageUrl || '',
    videoUrl: custom.videoUrl || '',
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
    const jwtToken = await getOrgScopedToken(req);

    if (jwtToken) {
      // Direct HTTP call to DUAL gateway (dualFetch handles JWT vs API key)
      const res = await dualFetch(`/objects/${params.propertyId}`, jwtToken);

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
