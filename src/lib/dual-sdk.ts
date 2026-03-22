/**
 * DUAL Platform SDK v1.0.0
 * Official TypeScript client library for the DUAL API
 * Source: https://github.com/ro-ro-b/dual-sdk
 */

export interface DualConfig {
  token?: string;
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  fetch?: typeof fetch;
  retry?: { maxAttempts?: number; backoffMs?: number };
}

export class DualError extends Error {
  constructor(public status: number, public code: string, public body: any) {
    super(code);
    this.name = 'DualError';
  }
}

class HttpClient {
  private baseUrl: string;
  private token?: string;
  private apiKey?: string;
  private timeout: number;
  private fetchImpl: typeof fetch;
  private maxRetries: number;
  private backoffMs: number;
  constructor(config: DualConfig = {}) {
    this.baseUrl = config.baseUrl || 'https://gateway-48587430648.europe-west6.run.app';
    this.token = config.token;
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000;
    this.fetchImpl = config.fetch || fetch;
    this.maxRetries = config.retry?.maxAttempts || 3;
    this.backoffMs = config.retry?.backoffMs || 1000;
  }
  setToken(token: string) { this.token = token; }
  getToken(): string | undefined { return this.token; }
  async request(method: string, path: string, options?: { body?: any; query?: Record<string, any>; headers?: Record<string, string> }): Promise<any> {
    let attempt = 0;
    while (attempt < this.maxRetries) {
      try { return await this.attemptRequest(method, path, options); }
      catch (error: any) { attempt++; if (attempt >= this.maxRetries) throw error; await new Promise(r => setTimeout(r, this.backoffMs * Math.pow(2, attempt - 1))); }
    }
  }
  private async attemptRequest(method: string, path: string, options?: { body?: any; query?: Record<string, any>; headers?: Record<string, string> }): Promise<any> {
    let url = this.baseUrl + path;
    if (options?.query) { const p = new URLSearchParams(); Object.entries(options.query).forEach(([k, v]) => { if (v !== undefined && v !== null) p.append(k, String(v)); }); const qs = p.toString(); if (qs) url += '?' + qs; }
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...options?.headers };
    if (this.token) headers.Authorization = 'Bearer ' + this.token;
    if (this.apiKey) headers['X-Api-Key'] = this.apiKey;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), this.timeout);
    try {
      const res = await this.fetchImpl(url, { method, headers, body: options?.body ? JSON.stringify(options.body) : undefined, signal: controller.signal });
      clearTimeout(t);
      const ct = res.headers.get('content-type');
      const data = ct && ct.includes('application/json') ? await res.json() : await res.text();
      if (!res.ok) throw new DualError(res.status, data?.code || 'ERROR', data);
      return data;
    } catch (e: any) { clearTimeout(t); if (e instanceof DualError) throw e; throw new DualError(500, 'REQUEST_FAILED', { message: e.message }); }
  }
}

class PaymentsModule { constructor(private http: HttpClient) {} async getPaymentConfig(q?: Record<string, any>) { return this.http.request('GET', '/payments/config', { query: q }); } async listDeposits(q?: Record<string, any>) { return this.http.request('GET', '/payments/deposits', { query: q }); } }
class SupportModule { constructor(private http: HttpClient) {} async requestAccess(b?: any, q?: Record<string, any>) { return this.http.request('POST', '/support/request-access', { body: b, query: q }); } async listSupportMessages(q?: Record<string, any>) { return this.http.request('GET', '/support', { query: q }); } async sendSupportMessage(b?: any, q?: Record<string, any>) { return this.http.request('POST', '/support', { body: b, query: q }); } async getSupportMessage(id: string, q?: Record<string, any>) { return this.http.request('GET', '/support/' + id, { query: q }); } }

class OrganizationsModule {
  constructor(private http: HttpClient) {}
  async listOrganizations(q?: Record<string, any>) { return this.http.request('GET', '/organizations', { query: q }); }
  async createOrganization(b?: any, q?: Record<string, any>) { return this.http.request('POST', '/organizations', { body: b, query: q }); }
  /** Switch org context. Body: { id: orgId }. Returns { access_token, organization } */
  async switchOrganization(b?: any, q?: Record<string, any>) { return this.http.request('POST', '/organizations/switch', { body: b, query: q }); }
  async getOrganization(id: string, q?: Record<string, any>) { return this.http.request('GET', '/organizations/' + id, { query: q }); }
  async updateOrganization(id: string, b?: any, q?: Record<string, any>) { return this.http.request('PUT', '/organizations/' + id, { body: b, query: q }); }
  async getOrganizationBalance(id: string, q?: Record<string, any>) { return this.http.request('GET', '/organizations/' + id + '/balance', { query: q }); }
  async getBalanceHistory(id: string, q?: Record<string, any>) { return this.http.request('GET', '/organizations/' + id + '/balance/history', { query: q }); }
  async listMembers(id: string, q?: Record<string, any>) { return this.http.request('GET', '/organizations/' + id + '/members', { query: q }); }
  async addMember(id: string, b?: any, q?: Record<string, any>) { return this.http.request('POST', '/organizations/' + id + '/members', { body: b, query: q }); }
  async removeMember(id: string, mid: string, q?: Record<string, any>) { return this.http.request('DELETE', '/organizations/' + id + '/members/' + mid, { query: q }); }
  async updateMemberRole(id: string, mid: string, b?: any, q?: Record<string, any>) { return this.http.request('PATCH', '/organizations/' + id + '/members/' + mid, { body: b, query: q }); }
  async listRoles(id: string, q?: Record<string, any>) { return this.http.request('GET', '/organizations/' + id + '/roles', { query: q }); }
  async createRole(id: string, b?: any, q?: Record<string, any>) { return this.http.request('POST', '/organizations/' + id + '/roles', { body: b, query: q }); }
  async updateRole(id: string, rid: string, b?: any, q?: Record<string, any>) { return this.http.request('PATCH', '/organizations/' + id + '/roles/' + rid, { body: b, query: q }); }
  async deleteRole(id: string, rid: string, q?: Record<string, any>) { return this.http.request('DELETE', '/organizations/' + id + '/roles/' + rid, { query: q }); }
  async createInvitation(id: string, b?: any, q?: Record<string, any>) { return this.http.request('POST', '/organizations/' + id + '/invitations', { body: b, query: q }); }
  async listInvitations(id: string, q?: Record<string, any>) { return this.http.request('GET', '/organizations/' + id + '/invitations', { query: q }); }
  async deleteInvitation(id: string, iid: string, q?: Record<string, any>) { return this.http.request('DELETE', '/organizations/' + id + '/invitations/' + iid, { query: q }); }
  async acceptInvitation(iid: string, b?: any, q?: Record<string, any>) { return this.http.request('POST', '/organizations/invitations/' + iid + '/accept', { body: b, query: q }); }
}

class EbusModule {
  constructor(private http: HttpClient) {}
  /** Execute an action (mint, transfer, burn, etc.) via /ebus/execute — requires JWT auth */
  async execute(b?: any, q?: Record<string, any>) { return this.http.request('POST', '/ebus/execute', { body: b, query: q }); }
  /** @deprecated alias — use execute() instead */
  async executeAction(b?: any, q?: Record<string, any>) { return this.execute(b, q); }
  async listActionLogs(q?: Record<string, any>) { return this.http.request('GET', '/ebus/action-logs', { query: q }); }
  /** @deprecated alias */
  async listActions(q?: Record<string, any>) { return this.listActionLogs(q); }
  async getAction(id: string, q?: Record<string, any>) { return this.http.request('GET', '/ebus/action-logs/' + id, { query: q }); }
  async executeBatchActions(b?: any, q?: Record<string, any>) { return this.http.request('POST', '/ebus/actions/batch', { body: b, query: q }); }
  async listActionTypes(q?: Record<string, any>) { return this.http.request('GET', '/ebus/action-types', { query: q }); }
  async createActionType(b?: any, q?: Record<string, any>) { return this.http.request('POST', '/ebus/action-types', { body: b, query: q }); }
  async getActionType(id: string, q?: Record<string, any>) { return this.http.request('GET', '/ebus/action-types/' + id, { query: q }); }
  async updateActionType(id: string, b?: any, q?: Record<string, any>) { return this.http.request('PUT', '/ebus/action-types/' + id, { body: b, query: q }); }
}

class AuthModule {
  constructor(private http: HttpClient) {}
  /** Send OTP to email */
  async sendOtp(b?: any, q?: Record<string, any>) { return this.http.request('POST', '/auth/otp', { body: b, query: q }); }
  /** Login with email + otp (or password). Returns { access_token, refresh_token, wallet } */
  async login(b?: any, q?: Record<string, any>) { return this.http.request('POST', '/auth/login', { body: b, query: q }); }
  /** Verify account with code */
  async verify(b?: any, q?: Record<string, any>) { return this.http.request('POST', '/auth/verify', { body: b, query: q }); }
  /** Set password */
  async setPassword(b?: any, q?: Record<string, any>) { return this.http.request('POST', '/auth/set-password', { body: b, query: q }); }
  /** Refresh access token */
  async refreshToken(b?: any, q?: Record<string, any>) { return this.http.request('POST', '/auth/refresh-token', { body: b, query: q }); }
}

class WalletsModule {
  constructor(private http: HttpClient) {}
  /** @deprecated Use auth.login() instead */
  async login(b?: any, q?: Record<string, any>) { return this.http.request('POST', '/auth/login', { body: b, query: q }); }
  async getCurrentWallet(q?: Record<string, any>) { return this.http.request('GET', '/wallets/me', { query: q }); }
  async updateCurrentWallet(b?: any, q?: Record<string, any>) { return this.http.request('PATCH', '/wallets/me', { body: b, query: q }); }
  async getWalletById(id: string, q?: Record<string, any>) { return this.http.request('GET', '/wallets/' + id, { query: q }); }
  async refreshToken(b?: any, q?: Record<string, any>) { return this.http.request('POST', '/auth/refresh-token', { body: b, query: q }); }
}

class ApiKeysModule { constructor(private http: HttpClient) {} async listApiKeys(q?: Record<string, any>) { return this.http.request('GET', '/api-keys', { query: q }); } async createApiKey(b?: any, q?: Record<string, any>) { return this.http.request('POST', '/api-keys', { body: b, query: q }); } async deleteApiKey(id: string, q?: Record<string, any>) { return this.http.request('DELETE', '/api-keys/' + id, { query: q }); } }

class TemplatesModule {
  constructor(private http: HttpClient) {}
  async listTemplates(q?: Record<string, any>) { return this.http.request('GET', '/templates', { query: q }); }
  async createTemplate(b?: any, q?: Record<string, any>) { return this.http.request('POST', '/templates', { body: b, query: q }); }
  async getTemplate(id: string, q?: Record<string, any>) { return this.http.request('GET', '/templates/' + id, { query: q }); }
  async updateTemplate(id: string, b?: any, q?: Record<string, any>) { return this.http.request('PATCH', '/templates/' + id, { body: b, query: q }); }
  async deleteTemplate(id: string, q?: Record<string, any>) { return this.http.request('DELETE', '/templates/' + id, { query: q }); }
  async listVariations(id: string, q?: Record<string, any>) { return this.http.request('GET', '/templates/' + id + '/variations', { query: q }); }
  async createVariation(id: string, b?: any, q?: Record<string, any>) { return this.http.request('POST', '/templates/' + id + '/variations', { body: b, query: q }); }
}

class ObjectsModule {
  constructor(private http: HttpClient) {}
  async listObjects(q?: Record<string, any>) { return this.http.request('GET', '/objects', { query: q }); }
  async getObject(id: string, q?: Record<string, any>) { return this.http.request('GET', '/objects/' + id, { query: q }); }
  async updateObject(id: string, b?: any, q?: Record<string, any>) { return this.http.request('PATCH', '/objects/' + id, { body: b, query: q }); }
  async getObjectChildren(id: string, q?: Record<string, any>) { return this.http.request('GET', '/objects/' + id + '/children', { query: q }); }
  async getObjectParents(id: string, q?: Record<string, any>) { return this.http.request('GET', '/objects/' + id + '/parents', { query: q }); }
  async getObjectActivity(id: string, q?: Record<string, any>) { return this.http.request('GET', '/objects/' + id + '/activity', { query: q }); }
  async getObjectsByGeo(id: string, q?: Record<string, any>) { return this.http.request('GET', '/objects/' + id + '/geo', { query: q }); }
  async searchObjects(b?: any, q?: Record<string, any>) { return this.http.request('POST', '/objects/search', { body: b, query: q }); }
  async countObjects(b?: any, q?: Record<string, any>) { return this.http.request('POST', '/objects/count', { body: b, query: q }); }
}

class FacesModule {
  constructor(private http: HttpClient) {}
  async listFaces(q?: Record<string, any>) { return this.http.request('GET', '/faces', { query: q }); }
  async createFace(b?: any, q?: Record<string, any>) { return this.http.request('POST', '/faces', { body: b, query: q }); }
  async getFace(id: string, q?: Record<string, any>) { return this.http.request('GET', '/faces/' + id, { query: q }); }
  async updateFace(id: string, b?: any, q?: Record<string, any>) { return this.http.request('PATCH', '/faces/' + id, { body: b, query: q }); }
  async deleteFace(id: string, q?: Record<string, any>) { return this.http.request('DELETE', '/faces/' + id, { query: q }); }
  async getFacesByTemplate(tid: string, q?: Record<string, any>) { return this.http.request('GET', '/faces/template/' + tid, { query: q }); }
}

class StorageModule {
  constructor(private http: HttpClient) {}
  async uploadFile(b?: any, q?: Record<string, any>) { return this.http.request('POST', '/storage/upload', { body: b, query: q }); }
  async getFile(id: string, q?: Record<string, any>) { return this.http.request('GET', '/storage/' + id, { query: q }); }
  async deleteFile(id: string, q?: Record<string, any>) { return this.http.request('DELETE', '/storage/' + id, { query: q }); }
  async getTemplateAssets(tid: string, q?: Record<string, any>) { return this.http.request('GET', '/storage/template/' + tid, { query: q }); }
  async uploadTemplateAsset(tid: string, b?: any, q?: Record<string, any>) { return this.http.request('POST', '/storage/template/' + tid, { body: b, query: q }); }
}

class NotificationsModule {
  constructor(private http: HttpClient) {}
  async listMessages(q?: Record<string, any>) { return this.http.request('GET', '/messages', { query: q }); }
  async sendMessage(b?: any, q?: Record<string, any>) { return this.http.request('POST', '/messages/send', { body: b, query: q }); }
  async listMessageTemplates(q?: Record<string, any>) { return this.http.request('GET', '/messages/templates', { query: q }); }
  async getMessageTemplate(id: string, q?: Record<string, any>) { return this.http.request('GET', '/messages/templates/' + id, { query: q }); }
  async createMessageTemplate(b?: any, q?: Record<string, any>) { return this.http.request('POST', '/messages/templates', { body: b, query: q }); }
  async updateMessageTemplate(id: string, b?: any, q?: Record<string, any>) { return this.http.request('PATCH', '/messages/templates/' + id, { body: b, query: q }); }
  async deleteMessageTemplate(id: string, q?: Record<string, any>) { return this.http.request('DELETE', '/messages/templates/' + id, { query: q }); }
}

class WebhooksModule {
  constructor(private http: HttpClient) {}
  async listWebhooks(q?: Record<string, any>) { return this.http.request('GET', '/webhooks', { query: q }); }
  async createWebhook(b?: any, q?: Record<string, any>) { return this.http.request('POST', '/webhooks', { body: b, query: q }); }
  async getWebhook(id: string, q?: Record<string, any>) { return this.http.request('GET', '/webhooks/' + id, { query: q }); }
  async updateWebhook(id: string, b?: any, q?: Record<string, any>) { return this.http.request('PATCH', '/webhooks/' + id, { body: b, query: q }); }
  async deleteWebhook(id: string, q?: Record<string, any>) { return this.http.request('DELETE', '/webhooks/' + id, { query: q }); }
  async testWebhook(id: string, q?: Record<string, any>) { return this.http.request('POST', '/webhooks/' + id + '/test', { query: q }); }
}

class SequencerModule {
  constructor(private http: HttpClient) {}
  async listBatches(q?: Record<string, any>) { return this.http.request('GET', '/batches', { query: q }); }
  async getBatch(id: string, q?: Record<string, any>) { return this.http.request('GET', '/batches/' + id, { query: q }); }
  async listCheckpoints(q?: Record<string, any>) { return this.http.request('GET', '/checkpoints', { query: q }); }
  async getCheckpoint(id: string, q?: Record<string, any>) { return this.http.request('GET', '/checkpoints/' + id, { query: q }); }
}

class IndexerModule {
  constructor(private http: HttpClient) {}
  async listPublicTemplates(q?: Record<string, any>) { return this.http.request('GET', '/public/templates', { query: q }); }
  async getPublicTemplate(id: string, q?: Record<string, any>) { return this.http.request('GET', '/public/templates/' + id, { query: q }); }
  async getPublicObject(id: string, q?: Record<string, any>) { return this.http.request('GET', '/public/objects/' + id, { query: q }); }
  async searchPublicObjects(b?: any, q?: Record<string, any>) { return this.http.request('POST', '/public/objects/search', { body: b, query: q }); }
  async getPublicFacesByTemplate(id: string, q?: Record<string, any>) { return this.http.request('GET', '/public/faces/template/' + id, { query: q }); }
  async getPublicOrganization(id: string, q?: Record<string, any>) { return this.http.request('GET', '/public/organizations/' + id, { query: q }); }
  async getPublicStats(q?: Record<string, any>) { return this.http.request('GET', '/public/stats', { query: q }); }
}

export class DualClient {
  private http: HttpClient;
  auth: AuthModule;
  payments: PaymentsModule; support: SupportModule; organizations: OrganizationsModule;
  ebus: EbusModule; wallets: WalletsModule; apikeys: ApiKeysModule;
  templates: TemplatesModule; objects: ObjectsModule; faces: FacesModule;
  storage: StorageModule; notifications: NotificationsModule; webhooks: WebhooksModule;
  sequencer: SequencerModule; indexer: IndexerModule;
  constructor(config?: DualConfig) {
    this.http = new HttpClient(config);
    this.auth = new AuthModule(this.http);
    this.payments = new PaymentsModule(this.http); this.support = new SupportModule(this.http);
    this.organizations = new OrganizationsModule(this.http); this.ebus = new EbusModule(this.http);
    this.wallets = new WalletsModule(this.http); this.apikeys = new ApiKeysModule(this.http);
    this.templates = new TemplatesModule(this.http); this.objects = new ObjectsModule(this.http);
    this.faces = new FacesModule(this.http); this.storage = new StorageModule(this.http);
    this.notifications = new NotificationsModule(this.http); this.webhooks = new WebhooksModule(this.http);
    this.sequencer = new SequencerModule(this.http); this.indexer = new IndexerModule(this.http);
  }
  setToken(token: string): void { this.http.setToken(token); }
  getToken(): string | undefined { return this.http.getToken(); }
}
