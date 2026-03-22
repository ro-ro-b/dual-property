// ─── DUAL Protocol Core Types ───

export interface Organization {
  id: string;
  name: string;
  description?: string;
  members: OrgMember[];
  createdAt: string;
}

export interface OrgMember {
  userId: string;
  role: "owner" | "admin" | "member";
  joinedAt: string;
}

export interface Wallet {
  id: string;
  address: string;
  balance: number;
  tokens: string[];
}

export type FaceType = "image" | "document" | "certificate" | "label";

export interface Face {
  id: string;
  objectId: string;
  type: FaceType;
  url: string;
  name: string;
  mimeType: string;
  createdAt: string;
}

// ─── Wine Domain Types ───

export type WineType = "red" | "white" | "sparkling" | "rosé" | "dessert" | "fortified";

export type WineCondition = "pristine" | "excellent" | "very_good" | "good" | "fair" | "poor";

export type StorageType = "professional" | "home_cellar" | "bonded_warehouse" | "in_transit";

export interface TastingNotes {
  nose: string;
  palate: string;
  finish: string;
}

export interface CriticRating {
  critic: string;
  score: number;
  year: number;
}

export interface DrinkingWindow {
  from: number;
  to: number;
}

export interface WineData {
  name: string;
  producer: string;
  region: string;
  country: string;
  vintage: number;
  varietal: string;
  type: WineType;
  abv: number;
  volume: string;
  quantity: number;
  condition: WineCondition;
  storage: StorageType;
  drinkingWindow: DrinkingWindow;
  ratings: CriticRating[];
  certifications: string[];
  currentValue: number;
  purchasePrice: number;
  description: string;
  tastingNotes: TastingNotes;
  imageUrl?: string;
  videoUrl?: string;
}

export interface ProvenanceEvent {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  actor: string;
  location?: string;
  verified: boolean;
  txHash?: string;
}

export interface ExplorerLinks {
  owner: string | null;
  contentHash: string | null;
  integrityHash: string | null;
  org: string | null;
}

export interface Wine {
  id: string;
  templateId?: string;
  objectId?: string;
  contentHash?: string;
  wineData: WineData;
  provenance: ProvenanceEvent[];
  faces: Face[];
  status: WineStatus;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  anchoredAt?: string;
  blockchainTxHash?: string;
  explorerLinks?: ExplorerLinks;
}

export type WineStatus =
  | "draft"
  | "minted"
  | "anchoring"
  | "anchored"
  | "listed"
  | "sold"
  | "transferred"
  | "redeemed"
  | "burned";

// ─── Action Types ───

export type ActionType =
  | "MINT"
  | "LIST"
  | "PURCHASE"
  | "TRANSFER"
  | "REDEEM"
  | "VERIFY"
  | "STORE"
  | "UPDATE_VALUATION"
  | "BURN";

export type ActionStatus = "pending" | "processing" | "completed" | "failed";

export interface Action {
  id: string;
  wineId: string;
  type: ActionType;
  status: ActionStatus;
  params: Record<string, unknown>;
  result?: Record<string, unknown>;
  initiatedBy: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

// ─── Template Types ───

export interface TemplateProperty {
  key: string;
  type: "string" | "number" | "boolean" | "date" | "enum";
  required: boolean;
  description?: string;
  enumValues?: string[];
}

export interface TemplateAction {
  type: ActionType;
  label: string;
  description: string;
  requiredParams: string[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  properties: TemplateProperty[];
  actions: TemplateAction[];
  organizationId: string;
  createdAt: string;
}

// ─── Webhook Types ───

export type WebhookEventType =
  | "wine.minted"
  | "wine.anchored"
  | "wine.anchoring_failed"
  | "wine.listed"
  | "wine.sold"
  | "wine.transferred"
  | "wine.redeemed"
  | "wine.burned"
  | "action.completed"
  | "action.failed"
  | "valuation.updated";

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  payload: Record<string, unknown>;
  timestamp: string;
  signature: string;
}

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEventType[];
  secret: string;
  active: boolean;
  createdAt: string;
}

// ─── Dashboard Stats ───

export interface DashboardStats {
  totalWines: number;
  totalValue: number;
  totalActions: number;
  mintedThisMonth: number;
  activeListings: number;
  recentSales: number;
  topRegions: { region: string; count: number }[];
  valueByType: { type: WineType; value: number }[];
}

// ─── Auth ───

export interface AuthSession {
  userId: string;
  role: "consumer" | "admin";
  walletAddress?: string;
  organizationId?: string;
}

// ─── Ticket Types ───

export type TicketStatus = 'valid' | 'scanned' | 'expired' | 'collectible' | 'listed' | 'transferred';
export type TicketTier = 'general' | 'vip' | 'backstage' | 'premium';

export interface TicketData {
  name: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  venueAddress: string;
  category: string;
  tier: TicketTier;
  section: string;
  seat: string;
  price: number;
  originalPrice: number;
  maxResalePrice: number;
  description: string;
  imageUrl?: string;
  perks: string[];
}

export interface Ticket {
  id: string;
  templateId?: string;
  objectId?: string;
  contentHash?: string;
  ticketData: TicketData;
  status: TicketStatus;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  blockchainTxHash?: string;
  explorerLinks?: ExplorerLinks;
}

// ─── Property Types ───

export type PropertyStatus = 'active' | 'funded' | 'closed' | 'distributing';
export type PropertyType = 'residential' | 'commercial' | 'mixed-use' | 'hospitality';

export interface PropertyFinancials {
  monthlyRentalIncome: number;
  annualExpenses: number;
  netOperatingIncome: number;
  capRate: number;
  projectedAppreciation: number;
}

export interface PropertyData {
  name: string;
  address: string;
  city: string;
  country: string;
  propertyType: PropertyType;
  yearBuilt: number;
  totalSqft: number;
  units: number;
  totalValue: number;
  tokenPrice: number;
  totalTokens: number;
  tokensSold: number;
  annualYield: number;
  minimumInvestment: number;
  description: string;
  features: string[];
  financials: PropertyFinancials;
  imageUrl?: string;
}

export interface Property {
  id: string;
  templateId?: string;
  objectId?: string;
  contentHash?: string;
  propertyData: PropertyData;
  status: PropertyStatus;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  blockchainTxHash?: string;
  explorerLinks?: ExplorerLinks;
}
