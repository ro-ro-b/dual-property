import type {
  Wine,
  WineData,
  Action,
  ActionType,
  ActionStatus,
  Template,
  Organization,
  DashboardStats,
  WineStatus,
  Ticket,
  TicketData,
  TicketStatus,
  TicketTier,
  Property,
  PropertyData,
  PropertyStatus,
  PropertyType,
} from "@/types/dual";
import { isDualConfigured, getDualClient } from "./dual-client";
import { v4 as uuidv4 } from "uuid";

// ─── Blockscout Resolver ───
// Matches DUAL objects to on-chain token instances via integrity_hash
const DUAL_CONTRACT = '0x41Cf00E593c5623B00F812bC70Ee1A737C5aFF06';
const BLOCKSCOUT_BASE = 'https://32f.blockv.io';

interface BlockscoutLinks {
  txHash: string | null;
  tokenInstanceUrl: string | null;
  txUrl: string | null;
  tokenId: string | null;
}

let _blockscoutCache: Map<string, BlockscoutLinks> | null = null;
let _blockscoutCacheTime = 0;

async function resolveBlockscoutLinks(ownerAddress: string): Promise<Map<string, BlockscoutLinks>> {
  // Cache for 5 minutes
  if (_blockscoutCache && Date.now() - _blockscoutCacheTime < 300000) return _blockscoutCache;
  const map = new Map<string, BlockscoutLinks>();
  try {
    // Single API call: get all token instances owned by this address (includes metadata with integrity_hash)
    const instUrl = `${BLOCKSCOUT_BASE}/api/v2/tokens/${DUAL_CONTRACT}/instances?holder_address_hash=${ownerAddress}`;
    const instRes = await fetch(instUrl);
    if (!instRes.ok) return map;
    const instData = await instRes.json();
    const instances = instData?.items || [];

    // Build integrity_hash → token_id map from instances
    const tokenIdByIH = new Map<string, string>();
    for (const inst of instances) {
      const attrs = inst?.metadata?.attributes || [];
      const ihAttr = attrs.find((a: any) => a.trait_type === 'integrity_hash');
      if (ihAttr?.value) tokenIdByIH.set(ihAttr.value, inst.id);
    }

    // Single API call: get token transfers to find tx hashes
    const txUrl = `${BLOCKSCOUT_BASE}/api/v2/addresses/${ownerAddress}/token-transfers?type=ERC-721&filter=to`;
    const txRes = await fetch(txUrl);
    if (!txRes.ok) return map;
    const txData = await txRes.json();
    const transfers = txData?.items || [];

    // Build token_id → tx_hash map from transfers
    const txByTokenId = new Map<string, string>();
    for (const t of transfers) {
      const tokenId = t.total?.token_id;
      const txHash = t.transaction_hash;
      if (tokenId && txHash) txByTokenId.set(String(tokenId), txHash);
    }

    // Combine: integrity_hash → { txUrl, tokenInstanceUrl }
    for (const [ih, tokenId] of Array.from(tokenIdByIH.entries())) {
      const txHash = txByTokenId.get(tokenId) || null;
      map.set(ih, {
        txHash,
        tokenId,
        txUrl: txHash ? `${BLOCKSCOUT_BASE}/tx/${txHash}` : null,
        tokenInstanceUrl: `${BLOCKSCOUT_BASE}/token/${DUAL_CONTRACT}/instance/${tokenId}`,
      });
    }
  } catch { /* Blockscout unavailable — return empty map */ }
  _blockscoutCache = map;
  _blockscoutCacheTime = Date.now();
  return map;
}

// ─── Data Provider Interface ───

export interface DataProvider {
  // Wines
  listWines(): Promise<Wine[]>;
  getWine(id: string): Promise<Wine | null>;
  mintWine(data: WineData): Promise<Wine>;
  updateWineStatus(id: string, status: WineStatus): Promise<Wine | null>;

  // Actions
  executeAction(wineId: string, type: ActionType, params?: Record<string, unknown>): Promise<Action>;
  getAction(id: string): Promise<Action | null>;
  getWineActions(wineId: string): Promise<Action[]>;
  listActions(): Promise<Action[]>;

  // Templates
  getTemplate(id: string): Promise<Template | null>;
  listTemplates(): Promise<Template[]>;

  // Organizations
  getOrganization(id: string): Promise<Organization | null>;

  // Tickets
  listTickets(): Promise<Ticket[]>;
  getTicket(id: string): Promise<Ticket | null>;

  // Properties
  listProperties(): Promise<Property[]>;
  getProperty(id: string): Promise<Property | null>;

  // Stats
  getDashboardStats(): Promise<DashboardStats>;
}

// ─── DUAL API Provider ───

// Extract year from ISO timestamp
function extractYear(timestamp: string): number {
  try {
    return parseInt(timestamp.split('-')[0], 10);
  } catch {
    return new Date().getFullYear();
  }
}

// Map DUAL gateway object to Wine (REAL data only)
// Reads from obj.metadata (template defaults) + obj.custom (mint-time overrides)
function mapGatewayToWine(obj: any): Wine {
  const m = obj.metadata || {};
  const c = obj.custom || {};
  const year = c.vintage ? parseInt(c.vintage, 10) : extractYear(obj.when_created || new Date().toISOString());

  // Determine wine type from custom.type or metadata.category
  let wineType: any = c.type || 'red';
  if (!c.type) {
    const category = (m.category || '').toLowerCase();
    if (category.includes('white')) wineType = 'white';
    else if (category.includes('sparkling') || category.includes('champagne')) wineType = 'sparkling';
    else if (category.includes('rosé') || category.includes('rose')) wineType = 'rosé';
    else if (category.includes('dessert')) wineType = 'dessert';
    else if (category.includes('fortified') || category.includes('port')) wineType = 'fortified';
  }

  // Parse drinking window from custom data
  const dw = c.drinkingWindow || {};

  return {
    id: obj.id || '',
    templateId: obj.template_id,
    objectId: obj.id,
    contentHash: obj.content_hash,
    wineData: {
      name: c.name || m.name || 'Token',
      producer: c.producer || 'DUAL Network',
      region: c.region || 'On-Chain',
      country: c.country || 'Decentralized',
      vintage: year,
      varietal: c.varietal || m.category || 'Token',
      type: wineType,
      abv: c.abv ? parseFloat(c.abv) : 0,
      volume: c.volume || '1 unit',
      quantity: c.quantity ? parseInt(c.quantity, 10) : 1,
      condition: (c.condition || 'excellent') as any,
      storage: (c.storage || 'professional') as any,
      drinkingWindow: {
        from: dw.from || year,
        to: dw.to || year + 10,
      },
      ratings: c.ratings || [],
      certifications: c.certifications || [],
      currentValue: c.currentValue ? parseFloat(c.currentValue) : 0,
      purchasePrice: c.purchasePrice ? parseFloat(c.purchasePrice) : 0,
      description: c.description || m.description || 'DUAL network token',
      tastingNotes: c.tastingNotes || { nose: '', palate: '', finish: '' },
      imageUrl: c.imageUrl || m.image?.url || undefined,
      videoUrl: c.videoUrl || undefined,
    },
    provenance: [{
      id: obj.id + '-anchor',
      timestamp: obj.when_created || new Date().toISOString(),
      type: 'TOKENIZED',
      description: 'Anchored on DUAL network',
      actor: obj.owner || 'DUAL Protocol',
      verified: !!obj.content_hash,
      txHash: obj.content_hash,
    }],
    faces: [],
    status: obj.content_hash ? 'anchored' : 'minted',
    ownerId: obj.owner || '',
    createdAt: obj.when_created || new Date().toISOString(),
    updatedAt: obj.when_modified || new Date().toISOString(),
    blockchainTxHash: obj.integrity_hash,
    explorerLinks: {
      owner: obj.owner ? `https://32f.blockv.io/address/${obj.owner}` : null,
      contentHash: null,
      integrityHash: null,
      org: obj.org_id ? `https://32f.blockv.io/address/0xed75538AeDD6E45FfadF30B9EEC68A3959654bF9` : null,
    },
  };
}

// Map DUAL gateway object to Ticket
function mapGatewayToTicket(obj: any): Ticket {
  const m = obj.metadata || {};
  const c = obj.custom || {};

  return {
    id: obj.id || '',
    templateId: obj.template_id,
    objectId: obj.id,
    contentHash: obj.content_hash,
    ticketData: {
      name: c.name || m.name || 'Event Ticket',
      eventName: c.eventName || 'Event',
      eventDate: c.eventDate || '',
      eventTime: c.eventTime || '',
      venue: c.venue || '',
      venueAddress: c.venueAddress || '',
      category: c.category || 'concert',
      tier: (c.tier || 'general') as TicketTier,
      section: c.section || '',
      seat: c.seat || '',
      price: c.price ? parseFloat(c.price) : 0,
      originalPrice: c.originalPrice ? parseFloat(c.originalPrice) : 0,
      maxResalePrice: c.maxResalePrice ? parseFloat(c.maxResalePrice) : 0,
      description: c.description || m.description || '',
      imageUrl: c.imageUrl || m.image?.url || undefined,
      perks: c.perks || [],
    },
    status: (c.ticketStatus || 'valid') as TicketStatus,
    ownerId: obj.owner || '',
    createdAt: obj.when_created || new Date().toISOString(),
    updatedAt: obj.when_modified || new Date().toISOString(),
    blockchainTxHash: obj.integrity_hash || undefined,
    explorerLinks: undefined,
  };
}

// Map DUAL gateway object to Property
function mapGatewayToProperty(obj: any): Property {
  const m = obj.metadata || {};
  const c = obj.custom || {};
  const fin = c.financials || {};

  return {
    id: obj.id || '',
    templateId: obj.template_id,
    objectId: obj.id,
    contentHash: obj.content_hash,
    propertyData: {
      name: c.name || m.name || 'Property',
      address: c.address || '',
      city: c.city || '',
      country: c.country || '',
      propertyType: (c.propertyType || 'residential') as PropertyType,
      yearBuilt: c.yearBuilt ? parseInt(c.yearBuilt, 10) : 2020,
      totalSqft: c.totalSqft ? parseInt(c.totalSqft, 10) : 0,
      units: c.units ? parseInt(c.units, 10) : 1,
      totalValue: c.totalValue ? parseFloat(c.totalValue) : 0,
      tokenPrice: c.tokenPrice ? parseFloat(c.tokenPrice) : 0,
      totalTokens: c.totalTokens ? parseInt(c.totalTokens, 10) : 0,
      tokensSold: c.tokensSold ? parseInt(c.tokensSold, 10) : 0,
      annualYield: c.annualYield ? parseFloat(c.annualYield) : 0,
      minimumInvestment: c.minimumInvestment ? parseFloat(c.minimumInvestment) : 0,
      description: c.description || m.description || '',
      features: c.features || [],
      financials: {
        monthlyRentalIncome: fin.monthlyRentalIncome ? parseFloat(fin.monthlyRentalIncome) : 0,
        annualExpenses: fin.annualExpenses ? parseFloat(fin.annualExpenses) : 0,
        netOperatingIncome: fin.netOperatingIncome ? parseFloat(fin.netOperatingIncome) : 0,
        capRate: fin.capRate ? parseFloat(fin.capRate) : 0,
        projectedAppreciation: fin.projectedAppreciation ? parseFloat(fin.projectedAppreciation) : 0,
      },
      imageUrl: c.imageUrl || m.image?.url || undefined,
    },
    status: (c.propertyStatus || 'active') as PropertyStatus,
    ownerId: obj.owner || '',
    createdAt: obj.when_created || new Date().toISOString(),
    updatedAt: obj.when_modified || new Date().toISOString(),
    blockchainTxHash: obj.integrity_hash || undefined,
    explorerLinks: undefined,
  };
}

class DualDataProvider implements DataProvider {
  async listWines(): Promise<Wine[]> {
    const client = getDualClient();
    const result = await client.objects.listObjects({ limit: 100, template_id: process.env.DUAL_TEMPLATE_ID || undefined });
    const objects = result?.objects || result?.data || [];
    // Filter out orphaned/empty tokens: must have custom.name and a real owner (not null address or padded wallet)
    const validObjects = (objects as any[]).filter((obj: any) => {
      const hasName = obj.custom && obj.custom.name;
      const owner = obj.owner || '';
      const isNullOwner = owner === '0x0000000000000000000000000000000000000000';
      const isPaddedWallet = owner.startsWith('0x00000000000000');
      return hasName && !isNullOwner && !isPaddedWallet;
    });
    const wines = validObjects.map((obj: any) => mapGatewayToWine(obj));

    // Sort: wines with video first, then by value descending
    wines.sort((a, b) => {
      const aHasVideo = a.wineData.videoUrl ? 1 : 0;
      const bHasVideo = b.wineData.videoUrl ? 1 : 0;
      if (bHasVideo !== aHasVideo) return bHasVideo - aHasVideo;
      return (b.wineData.currentValue || 0) - (a.wineData.currentValue || 0);
    });

    // Resolve real Blockscout links by matching integrity_hash
    try {
      const ownerAddr = wines[0]?.ownerId;
      if (ownerAddr) {
        const bsMap = await resolveBlockscoutLinks(ownerAddr);
        for (const wine of wines) {
          const ih = wine.blockchainTxHash;
          if (ih && bsMap.has(ih)) {
            const bs = bsMap.get(ih)!;
            wine.explorerLinks = {
              owner: wine.explorerLinks?.owner || null,
              org: wine.explorerLinks?.org || null,
              contentHash: bs.txUrl,
              integrityHash: bs.tokenInstanceUrl,
            };
          }
        }
      }
    } catch { /* Blockscout enrichment failed — links stay as-is */ }

    return wines;
  }

  async getWine(id: string): Promise<Wine | null> {
    try {
      const client = getDualClient();
      const obj = await client.objects.getObject(id);
      if (!obj) return null;
      const wine = mapGatewayToWine(obj as any);
      // Resolve Blockscout links for this single wine
      try {
        if (wine.ownerId) {
          const bsMap = await resolveBlockscoutLinks(wine.ownerId);
          const ih = wine.blockchainTxHash;
          if (ih && bsMap.has(ih)) {
            const bs = bsMap.get(ih)!;
            wine.explorerLinks = {
              owner: wine.explorerLinks?.owner || null,
              org: wine.explorerLinks?.org || null,
              contentHash: bs.txUrl,
              integrityHash: bs.tokenInstanceUrl,
            };
          }
        }
      } catch { /* Blockscout enrichment failed */ }
      return wine;
    } catch {
      return null;
    }
  }

  async mintWine(data: WineData): Promise<Wine> {
    const client = getDualClient();
    const templateId = process.env.DUAL_TEMPLATE_ID || '';
    const result = await client.ebus.executeAction({
      actionType: 'MINT',
      templateId,
      properties: data as unknown as Record<string, unknown>,
    });
    return result;
  }

  async updateWineStatus(): Promise<Wine | null> {
    // Handled via DUAL actions
    return null;
  }

  async executeAction(wineId: string, type: ActionType, params?: Record<string, unknown>): Promise<Action> {
    const client = getDualClient();
    return client.ebus.executeAction({ objectId: wineId, actionType: type, ...params });
  }

  async getAction(id: string): Promise<Action | null> {
    try {
      const client = getDualClient();
      return await client.ebus.getAction(id);
    } catch {
      return null;
    }
  }

  async getWineActions(wineId: string): Promise<Action[]> {
    const client = getDualClient();
    const result = await client.objects.getObjectActivity(wineId);
    return result?.objects || result?.actions || result?.activity || result?.data || [];
  }

  async listActions(): Promise<Action[]> {
    const client = getDualClient();
    const result = await client.ebus.listActions({ limit: 100 });
    return (result?.objects || result?.actions || result?.activity || result?.data || []).sort(
      (a: Action, b: Action) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getTemplate(id: string): Promise<Template | null> {
    try {
      const client = getDualClient();
      return await client.templates.getTemplate(id);
    } catch {
      return null;
    }
  }

  async listTemplates(): Promise<Template[]> {
    const client = getDualClient();
    const result = await client.templates.listTemplates({ limit: 100 });
    const templates = result?.templates || result?.data || [];
    return (templates as any[]).map((t: any) => ({
      id: t.id || '',
      name: t.name || t.object?.metadata?.name || 'Untitled',
      description: t.object?.metadata?.description || '',
      properties: [],
      actions: t.actions || [],
      organizationId: t.org_id || '',
      createdAt: t.when_created || new Date().toISOString(),
    }));
  }

  async getOrganization(id: string): Promise<Organization | null> {
    try {
      const client = getDualClient();
      return await client.organizations.getOrganization(id);
    } catch {
      return null;
    }
  }

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const client = getDualClient();
      const wines = await this.listWines();

      // Calculate stats from live DUAL data
      const stats: DashboardStats = {
        totalWines: wines.length,
        totalValue: wines.reduce((sum: number, w: Wine) => sum + (w.wineData.currentValue || 0), 0),
        totalActions: 0,
        mintedThisMonth: wines.filter((w: Wine) => {
          const created = new Date(w.createdAt);
          const now = new Date();
          return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
        }).length,
        activeListings: wines.filter((w: Wine) => w.status === 'listed').length,
        recentSales: wines.filter((w: Wine) => w.status === 'sold').length,
        topRegions: [],
        valueByType: [],
      };

      return stats;
    } catch {
      throw new Error('Failed to fetch DUAL network stats');
    }
  }

  async listTickets(): Promise<Ticket[]> {
    try {
      const client = getDualClient();
      const templateId = process.env.DUAL_TICKETS_TEMPLATE_ID;
      const params: any = { limit: 100 };
      if (templateId) params.template_id = templateId;
      const response = await client.objects.listObjects(params);
      const objects = response?.items || response?.objects || (Array.isArray(response) ? response : []);
      const tickets = objects.map(mapGatewayToTicket);

      // Resolve Blockscout links for tickets
      try {
        const ownerAddr = tickets[0]?.ownerId;
        if (ownerAddr) {
          const bsMap = await resolveBlockscoutLinks(ownerAddr);
          for (const ticket of tickets) {
            const ih = ticket.blockchainTxHash;
            if (ih && bsMap.has(ih)) {
              const bs = bsMap.get(ih)!;
              ticket.explorerLinks = {
                owner: ticket.ownerId ? `${BLOCKSCOUT_BASE}/address/${ticket.ownerId}` : null,
                org: null,
                contentHash: bs.txUrl,
                integrityHash: bs.tokenInstanceUrl,
              };
            }
          }
        }
      } catch { /* Blockscout enrichment failed */ }

      return tickets;
    } catch (err) {
      console.error('Failed to list tickets:', err);
      return [];
    }
  }

  async getTicket(id: string): Promise<Ticket | null> {
    try {
      const client = getDualClient();
      const obj = await client.objects.getObject(id);
      if (!obj) return null;
      const ticket = mapGatewayToTicket(obj);
      // Resolve Blockscout links
      try {
        if (ticket.ownerId) {
          const bsMap = await resolveBlockscoutLinks(ticket.ownerId);
          const ih = ticket.blockchainTxHash;
          if (ih && bsMap.has(ih)) {
            const bs = bsMap.get(ih)!;
            ticket.explorerLinks = {
              owner: `${BLOCKSCOUT_BASE}/address/${ticket.ownerId}`,
              org: null,
              contentHash: bs.txUrl,
              integrityHash: bs.tokenInstanceUrl,
            };
          }
        }
      } catch { /* Blockscout enrichment failed */ }
      return ticket;
    } catch {
      return null;
    }
  }

  async listProperties(): Promise<Property[]> {
    try {
      const client = getDualClient();
      const templateId = process.env.DUAL_PROPERTIES_TEMPLATE_ID;
      const params: any = { limit: 100 };
      if (templateId) params.template_id = templateId;
      const response = await client.objects.listObjects(params);
      const objects = response?.items || response?.objects || (Array.isArray(response) ? response : []);
      const properties = objects.map(mapGatewayToProperty);

      // Resolve Blockscout links for properties
      try {
        const ownerAddr = properties[0]?.ownerId;
        if (ownerAddr) {
          const bsMap = await resolveBlockscoutLinks(ownerAddr);
          for (const prop of properties) {
            const ih = prop.blockchainTxHash;
            if (ih && bsMap.has(ih)) {
              const bs = bsMap.get(ih)!;
              prop.explorerLinks = {
                owner: prop.ownerId ? `${BLOCKSCOUT_BASE}/address/${prop.ownerId}` : null,
                org: null,
                contentHash: bs.txUrl,
                integrityHash: bs.tokenInstanceUrl,
              };
            }
          }
        }
      } catch { /* Blockscout enrichment failed */ }

      return properties;
    } catch (err) {
      console.error('Failed to list properties:', err);
      return [];
    }
  }

  async getProperty(id: string): Promise<Property | null> {
    try {
      const client = getDualClient();
      const obj = await client.objects.getObject(id);
      if (!obj) return null;
      const property = mapGatewayToProperty(obj);
      // Resolve Blockscout links
      try {
        if (property.ownerId) {
          const bsMap = await resolveBlockscoutLinks(property.ownerId);
          const ih = property.blockchainTxHash;
          if (ih && bsMap.has(ih)) {
            const bs = bsMap.get(ih)!;
            property.explorerLinks = {
              owner: `${BLOCKSCOUT_BASE}/address/${property.ownerId}`,
              org: null,
              contentHash: bs.txUrl,
              integrityHash: bs.tokenInstanceUrl,
            };
          }
        }
      } catch { /* Blockscout enrichment failed */ }
      return property;
    } catch {
      return null;
    }
  }
}

// ─── Factory ───

let provider: DataProvider | null = null;

export function getDataProvider(): DataProvider {
  if (!provider) {
    provider = new DualDataProvider();
  }
  return provider;
}
