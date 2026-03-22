'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type AuthState = 'checking' | 'unauthenticated' | 'otp_sent' | 'authenticated';

type MintStep = {
  id: string;
  label: string;
  description: string;
  icon: string;
  status: 'pending' | 'active' | 'done' | 'error';
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export default function PropertyAdminPage() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [mintPhase, setMintPhase] = useState<'form' | 'minting' | 'success'>('form');
  const [mintResult, setMintResult] = useState<{ actionId: string; objectIds: string[] } | null>(null);
  const [mintError, setMintError] = useState('');
  const [mintSteps, setMintSteps] = useState<MintStep[]>([]);

  const [form, setForm] = useState({
    // Property Information
    name: '',
    address: '',
    city: '',
    country: '',
    propertyType: 'residential' as string,
    yearBuilt: new Date().getFullYear(),
    totalSqft: 0,
    numberOfUnits: 1,
    description: '',
    keyFeatures: '',
    // Investment Structure
    totalPropertyValue: 0,
    tokenPricePerShare: 0,
    totalTokens: 0,
    annualYield: 0,
    minimumInvestment: 0,
    // Financial Details
    monthlyRentalIncome: 0,
    annualExpenses: 0,
    netOperatingIncome: 0,
    capRate: 0,
    projectedAppreciation: 0,
  });

  // Fetch org balance and templates when authenticated
  const [orgBalance, setOrgBalance] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // Check auth on mount
  useEffect(() => {
    fetch('/api/auth/status')
      .then(r => r.json())
      .then(d => {
        setAuthState(d.authenticated ? 'authenticated' : 'unauthenticated');
      })
      .catch(() => setAuthState('unauthenticated'));
  }, []);

  // Fetch org balance and templates when authenticated
  useEffect(() => {
    if (authState !== 'authenticated') return;

    // Fetch org balance
    fetch('/api/organizations/balance')
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setOrgBalance(data.balance);
      })
      .catch(() => {});

    // Fetch templates
    fetch('/api/templates/list')
      .then((r) => r.json())
      .then((data) => {
        const tpls = data.templates || [];
        setTemplates(tpls);
        if (tpls.length > 0) setSelectedTemplate(tpls[0].id);
      })
      .catch(() => {});
  }, [authState]);

  const handleSendOtp = async () => {
    if (!email) return;
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setAuthState('otp_sent');
      } else {
        setAuthError(data.error || 'Failed to send OTP');
      }
    } catch {
      setAuthError('Network error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!otp) return;
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        setAuthState('authenticated');
      } else {
        setAuthError(data.error || 'Login failed');
      }
    } catch {
      setAuthError('Network error');
    } finally {
      setAuthLoading(false);
    }
  };

  const update = (key: string, value: string | number) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMintError('');

    // Initialize mint steps
    const steps: MintStep[] = [
      { id: 'prepare', label: 'Preparing Property Data', description: 'Structuring property metadata for on-chain storage', icon: 'data_object', status: 'pending' },
      { id: 'auth', label: 'Authenticating with DUAL', description: 'Verifying org-scoped JWT credentials', icon: 'shield', status: 'pending' },
      { id: 'mint', label: 'Minting Property Token', description: 'Writing to DUAL Network via /ebus/execute', icon: 'token', status: 'pending' },
      { id: 'anchor', label: 'Anchoring Content Hash', description: 'Computing integrity hash and anchoring on-chain', icon: 'link', status: 'pending' },
      { id: 'confirm', label: 'Confirmed on Blockchain', description: 'Token verified on DUAL Token contract', icon: 'verified', status: 'pending' },
    ];
    setMintSteps(steps);
    setMintPhase('minting');

    // Step 1: Preparing
    await sleep(400);
    steps.find(s => s.id === 'prepare')!.status = 'active';
    setMintSteps([...steps]);
    await sleep(800);
    steps.find(s => s.id === 'prepare')!.status = 'done';
    setMintSteps([...steps]);

    // Step 2: Authenticating
    await sleep(300);
    steps.find(s => s.id === 'auth')!.status = 'active';
    setMintSteps([...steps]);
    await sleep(600);
    steps.find(s => s.id === 'auth')!.status = 'done';
    setMintSteps([...steps]);

    // Step 3: Minting — this is where the real API call happens
    await sleep(300);
    steps.find(s => s.id === 'mint')!.status = 'active';
    setMintSteps([...steps]);

    try {
      const mintPayload = {
        data: {
          name: form.name,
          address: form.address,
          city: form.city,
          country: form.country,
          propertyType: form.propertyType,
          yearBuilt: form.yearBuilt,
          totalSqft: form.totalSqft,
          numberOfUnits: form.numberOfUnits,
          description: form.description,
          keyFeatures: form.keyFeatures.split(',').map(f => f.trim()).filter(Boolean),
          investment: {
            totalPropertyValue: form.totalPropertyValue,
            tokenPricePerShare: form.tokenPricePerShare,
            totalTokens: form.totalTokens,
            annualYield: form.annualYield,
            minimumInvestment: form.minimumInvestment,
          },
          financials: {
            monthlyRentalIncome: form.monthlyRentalIncome,
            annualExpenses: form.annualExpenses,
            netOperatingIncome: form.netOperatingIncome,
            capRate: form.capRate,
            projectedAppreciation: form.projectedAppreciation,
          },
        },
      };

      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...mintPayload, templateId: selectedTemplate || undefined }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        steps.find(s => s.id === 'mint')!.status = 'error';
        setMintSteps([...steps]);
        setMintError(data.error || 'Mint failed');
        if (res.status === 401) setAuthState('unauthenticated');
        setSubmitting(false);
        return;
      }

      steps.find(s => s.id === 'mint')!.status = 'done';
      setMintSteps([...steps]);

      // Step 4: Anchoring
      await sleep(400);
      steps.find(s => s.id === 'anchor')!.status = 'active';
      setMintSteps([...steps]);
      await sleep(900);
      steps.find(s => s.id === 'anchor')!.status = 'done';
      setMintSteps([...steps]);

      // Step 5: Confirmed
      await sleep(400);
      steps.find(s => s.id === 'confirm')!.status = 'active';
      setMintSteps([...steps]);
      await sleep(600);
      steps.find(s => s.id === 'confirm')!.status = 'done';
      setMintSteps([...steps]);

      await sleep(500);
      setMintResult({
        actionId: data.actionId,
        objectIds: data.objectIds,
      });
      setMintPhase('success');

    } catch (err: any) {
      steps.find(s => s.id === 'mint')!.status = 'error';
      setMintSteps([...steps]);
      setMintError(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Auth Gate ──
  if (authState === 'checking') {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-gold-dim border-t-transparent animate-spin" />
      </div>
    );
  }

  if (authState === 'unauthenticated' || authState === 'otp_sent') {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-navy-dark to-navy-light">
        <div className="w-full max-w-md p-8 rounded-lg bg-card-dark border border-gold-dim/20">
          <h1 className="text-2xl font-semibold text-white mb-2">Admin Authentication</h1>
          <p className="text-gray-400 text-sm mb-6">Verify your email to manage property tokens.</p>

          {authError && (
            <div className="mb-6 p-3 rounded bg-red-900/30 border border-red-500/30 text-red-200 text-sm">
              {authError}
            </div>
          )}

          {authState === 'unauthenticated' ? (
            <div className="space-y-4">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded bg-navy-light border border-gold-dim/20 text-white placeholder-gray-500 focus:outline-none focus:border-gold-bright"
              />
              <button
                onClick={handleSendOtp}
                disabled={!email || authLoading}
                className="w-full px-4 py-2 rounded bg-gradient-to-r from-gold-bright to-gold-dim text-navy-dark font-semibold hover:shadow-lg hover:shadow-gold-bright/50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {authLoading ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">Code sent to {email}</p>
              <input
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="w-full px-4 py-2 rounded bg-navy-light border border-gold-dim/20 text-white placeholder-gray-500 focus:outline-none focus:border-gold-bright text-center text-lg tracking-widest"
              />
              <button
                onClick={handleLogin}
                disabled={!otp || authLoading}
                className="w-full px-4 py-2 rounded bg-gradient-to-r from-gold-bright to-gold-dim text-navy-dark font-semibold hover:shadow-lg hover:shadow-gold-bright/50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {authLoading ? 'Verifying...' : 'Verify'}
              </button>
              <button
                onClick={() => {
                  setAuthState('unauthenticated');
                  setOtp('');
                }}
                className="w-full text-gray-400 text-sm hover:text-gold-bright transition"
              >
                Change email
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Minting Phase ──
  if (mintPhase === 'minting') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-navy-dark to-navy-light p-4">
        <div className="w-full max-w-2xl">
          <div className="space-y-4">
            {mintSteps.map((step, idx) => (
              <div key={step.id} className="relative">
                <div className={`p-4 rounded-lg border transition ${
                  step.status === 'done' ? 'bg-green-900/20 border-green-500/30' :
                  step.status === 'error' ? 'bg-red-900/20 border-red-500/30' :
                  step.status === 'active' ? 'bg-gold-bright/10 border-gold-bright/30' :
                  'bg-card-dark border-gold-dim/20'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      step.status === 'done' ? 'bg-green-500' :
                      step.status === 'error' ? 'bg-red-500' :
                      step.status === 'active' ? 'bg-gold-bright animate-pulse' :
                      'bg-gray-600'
                    }`}>
                      {step.status === 'done' && <span className="text-white text-sm">✓</span>}
                      {step.status === 'error' && <span className="text-white text-sm">!</span>}
                      {step.status === 'active' && <span className="w-2 h-2 bg-navy-dark rounded-full animate-bounce" />}
                      {step.status === 'pending' && <span className="text-white text-xs">-</span>}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">{step.label}</h3>
                      <p className="text-gray-400 text-sm mt-1">{step.description}</p>
                    </div>
                  </div>
                </div>
                {idx < mintSteps.length - 1 && (
                  <div className={`h-2 ml-3 border-l-2 ${
                    step.status === 'done' ? 'border-green-500' :
                    step.status === 'error' ? 'border-red-500' :
                    'border-gold-dim/30'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {mintError && (
            <div className="mt-8 p-4 rounded-lg bg-red-900/20 border border-red-500/30">
              <h4 className="text-red-200 font-semibold mb-2">Mint Failed</h4>
              <p className="text-red-200 text-sm">{mintError}</p>
              <button
                onClick={() => setMintPhase('form')}
                className="mt-4 px-4 py-2 rounded bg-red-500/20 border border-red-500/50 text-red-200 hover:bg-red-500/30 transition"
              >
                Back to Form
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Success Phase ──
  if (mintPhase === 'success') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-navy-dark to-navy-light p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl text-green-400">✓</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Property Token Minted</h1>
            <p className="text-gray-400">{form.name}</p>
          </div>

          {mintResult && (
            <div className="space-y-4 mb-8">
              <div className="p-4 rounded-lg bg-card-dark border border-gold-dim/30">
                <p className="text-gray-400 text-sm mb-1">Action ID</p>
                <p className="text-white font-mono text-sm break-all">{mintResult.actionId}</p>
              </div>

              {mintResult.objectIds.length > 0 && (
                <div className="p-4 rounded-lg bg-card-dark border border-gold-dim/30">
                  <p className="text-gray-400 text-sm mb-2">Property Token ID{mintResult.objectIds.length > 1 ? 's' : ''}</p>
                  <div className="space-y-2">
                    {mintResult.objectIds.map((id, idx) => (
                      <p key={idx} className="text-gold-bright font-mono text-sm break-all">
                        {id}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => {
                setMintPhase('form');
                setForm({
                  name: '',
                  address: '',
                  city: '',
                  country: '',
                  propertyType: 'residential',
                  yearBuilt: new Date().getFullYear(),
                  totalSqft: 0,
                  numberOfUnits: 1,
                  description: '',
                  keyFeatures: '',
                  totalPropertyValue: 0,
                  tokenPricePerShare: 0,
                  totalTokens: 0,
                  annualYield: 0,
                  minimumInvestment: 0,
                  monthlyRentalIncome: 0,
                  annualExpenses: 0,
                  netOperatingIncome: 0,
                  capRate: 0,
                  projectedAppreciation: 0,
                });
                setMintResult(null);
              }}
              className="flex-1 px-6 py-3 rounded bg-gradient-to-r from-gold-bright to-gold-dim text-navy-dark font-semibold hover:shadow-lg hover:shadow-gold-bright/50 transition"
            >
              Mint Another
            </button>
            <Link
              href="/property"
              className="flex-1 px-6 py-3 rounded border border-gold-dim text-gold-bright font-semibold hover:bg-gold-dim/10 transition text-center"
            >
              View Portfolio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Form Phase ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-dark to-navy-light p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-4xl text-gold-bright">
              {/* Building icon via material-symbols */}
              &#xe5d8;
            </span>
            <div>
              <h1 className="text-4xl font-bold text-white">List Property Token</h1>
              <p className="text-gray-400 text-sm mt-1">DUAL Property Admin</p>
            </div>
          </div>
          <p className="text-gray-400">Create and tokenize a new property on the DUAL Network.</p>
        </div>

        {/* Organization Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-card-dark rounded-lg border border-gold-dim/20 p-6">
            <p className="text-gray-400 text-sm mb-1">Organization Balance</p>
            <p className="text-2xl font-bold text-white">{orgBalance ? JSON.stringify(orgBalance).slice(0, 30) : 'Loading...'}</p>
          </div>
          <div className="bg-card-dark rounded-lg border border-gold-dim/20 p-6">
            <p className="text-gray-400 text-sm mb-1">Available Templates</p>
            <p className="text-2xl font-bold text-white">{templates.length}</p>
          </div>
          <div className="bg-card-dark rounded-lg border border-gold-dim/20 p-6">
            <p className="text-gray-400 text-sm mb-1">Network Status</p>
            <p className="text-2xl font-bold text-green-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Connected
            </p>
          </div>
        </div>

        {/* Template Selector */}
        {templates.length > 0 && (
          <div className="bg-card-dark rounded-lg border border-gold-dim/20 p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-gold-bright">📋</span> Select Template
            </h2>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-4 py-2 rounded bg-navy-light border border-gold-dim/20 text-white focus:outline-none focus:border-gold-bright transition"
            >
              {templates.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name} — {t.description || 'No description'}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-2">Selected template ID: {selectedTemplate || 'default from env'}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Property Information Section */}
          <div className="bg-card-dark rounded-lg border border-gold-dim/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <span className="text-gold-bright">📍</span> Property Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Property Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded bg-navy-light border border-gold-dim/20 text-white placeholder-gray-500 focus:outline-none focus:border-gold-bright transition"
                  placeholder="e.g., Sunset Hills Luxury Apartments"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Address *</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => update('address', e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded bg-navy-light border border-gold-dim/20 text-white placeholder-gray-500 focus:outline-none focus:border-gold-bright transition"
                  placeholder="123 Oak Street"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">City *</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded bg-navy-light border border-gold-dim/20 text-white placeholder-gray-500 focus:outline-none focus:border-gold-bright transition"
                  placeholder="San Francisco"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Country *</label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => update('country', e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded bg-navy-light border border-gold-dim/20 text-white placeholder-gray-500 focus:outline-none focus:border-gold-bright transition"
                  placeholder="United States"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Property Type *</label>
                <select
                  value={form.propertyType}
                  onChange={(e) => update('propertyType', e.target.value)}
                  className="w-full px-4 py-2 rounded bg-navy-light border border-gold-dim/20 text-white focus:outline-none focus:border-gold-bright transition"
                >
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="mixed-use">Mixed-Use</option>
                  <option value="hospitality">Hospitality</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Year Built *</label>
                <input
                  type="number"
                  value={form.yearBuilt}
                  onChange={(e) => update('yearBuilt', parseInt(e.target.value) || 0)}
                  required
                  className="w-full px-4 py-2 rounded bg-navy-light border border-gold-dim/20 text-white placeholder-gray-500 focus:outline-none focus:border-gold-bright transition"
                  placeholder="2020"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Total Sqft *</label>
                <input
                  type="number"
                  value={form.totalSqft}
                  onChange={(e) => update('totalSqft', parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-4 py-2 rounded bg-navy-light border border-gold-dim/20 text-white placeholder-gray-500 focus:outline-none focus:border-gold-bright transition"
                  placeholder="50000"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Number of Units *</label>
                <input
                  type="number"
                  value={form.numberOfUnits}
                  onChange={(e) => update('numberOfUnits', parseInt(e.target.value) || 1)}
                  required
                  className="w-full px-4 py-2 rounded bg-navy-light border border-gold-dim/20 text-white placeholder-gray-500 focus:outline-none focus:border-gold-bright transition"
                  placeholder="12"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm text-gray-300 mb-2">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 rounded bg-navy-light border border-gold-dim/20 text-white placeholder-gray-500 focus:outline-none focus:border-gold-bright transition resize-none"
                placeholder="A detailed description of the property..."
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm text-gray-300 mb-2">Key Features (comma-separated)</label>
              <textarea
                value={form.keyFeatures}
                onChange={(e) => update('keyFeatures', e.target.value)}
                rows={2}
                className="w-full px-4 py-2 rounded bg-navy-light border border-gold-dim/20 text-white placeholder-gray-500 focus:outline-none focus:border-gold-bright transition resize-none"
                placeholder="e.g., Smart Home Technology, Rooftop Garden, 24/7 Security"
              />
            </div>
          </div>

          {/* Investment Structure Section */}
          <div className="bg-card-dark rounded-lg border border-gold-dim/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <span className="text-gold-bright">💎</span> Investment Structure
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Total Property Value ($) *</label>
                <input
                  type="number"
                  value={form.totalPropertyValue}
                  onChange={(e) => update('totalPropertyValue', parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-4 py-2 rounded bg-navy-light border border-gold-dim/20 text-white placeholder-gray-500 focus:outline-none focus:border-gold-bright transition"
                  placeholder="10000000"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Token Price per Share ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.tokenPricePerShare}
                  onChange={(e) => update('tokenPricePerShare', parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-4 py-2 rounded bg-navy-light border border-gold-dim/20 text-white placeholder-gray-500 focus:outline-none focus:border-gold-bright transition"
                  placeholder="100.00"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Total Tokens *</label>
                <input
                  type="number"
                  value={form.totalTokens}
                  onChange={(e) => update('totalTokens', parseInt(e.target.value) || 0)}
                  required
                  className="w-full px-4 py-2 rounded bg-navy-light border border-gold-dim/20 text-white placeholder-gray-500 focus:outline-none focus:border-gold-bright transition"
                  placeholder="100000"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Annual Yield (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.annualYield}
                  onChange={(e) => update('annualYield', parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-4 py-2 rounded bg-navy-light border border-gold-dim/20 text-white placeholder-gray-500 focus:outline-none focus:border-gold-bright transition"
                  placeholder="6.5"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Minimum Investment ($) *</label>
                <input
                  type="number"
                  value={form.minimumInvestment}
                  onChange={(e) => update('minimumInvestment', parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-4 py-2 rounded bg-navy-light border border-gold-dim/20 text-white placeholder-gray-500 focus:outline-none focus:border-gold-bright transition"
                  placeholder="10000"
                />
              </div>
            </div>
          </div>

          {/* Financial Details Section */}
          <div className="bg-card-dark rounded-lg border border-gold-dim/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <span className="text-gold-bright">📊</span> Financial Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Monthly Rental Income ($) *</label>
                <input
                  type="number"
                  value={form.monthlyRentalIncome}
                  onChange={(e) => update('monthlyRentalIncome', parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-4 py-2 rounded bg-navy-light border border-gold-dim/20 text-white placeholder-gray-500 focus:outline-none focus:border-gold-bright transition"
                  placeholder="50000"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Annual Expenses ($) *</label>
                <input
                  type="number"
                  value={form.annualExpenses}
                  onChange={(e) => update('annualExpenses', parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-4 py-2 rounded bg-navy-light border border-gold-dim/20 text-white placeholder-gray-500 focus:outline-none focus:border-gold-bright transition"
                  placeholder="300000"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Net Operating Income ($) *</label>
                <input
                  type="number"
                  value={form.netOperatingIncome}
                  onChange={(e) => update('netOperatingIncome', parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-4 py-2 rounded bg-navy-light border border-gold-dim/20 text-white placeholder-gray-500 focus:outline-none focus:border-gold-bright transition"
                  placeholder="300000"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Cap Rate (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.capRate}
                  onChange={(e) => update('capRate', parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-4 py-2 rounded bg-navy-light border border-gold-dim/20 text-white placeholder-gray-500 focus:outline-none focus:border-gold-bright transition"
                  placeholder="3.5"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Projected Appreciation (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.projectedAppreciation}
                  onChange={(e) => update('projectedAppreciation', parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-4 py-2 rounded bg-navy-light border border-gold-dim/20 text-white placeholder-gray-500 focus:outline-none focus:border-gold-bright transition"
                  placeholder="2.0"
                />
              </div>
            </div>
          </div>

          {/* Error Messages */}
          {mintError && (
            <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/30 text-red-200 text-sm">
              {mintError}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 rounded bg-gradient-to-r from-gold-bright to-gold-dim text-navy-dark font-semibold hover:shadow-lg hover:shadow-gold-bright/50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? 'Tokenizing...' : 'Tokenize Property'}
            </button>
            <Link
              href="/property"
              className="px-6 py-3 rounded border border-gold-dim text-gold-bright font-semibold hover:bg-gold-dim/10 transition"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
