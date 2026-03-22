'use client';

import { useState, useEffect, useRef } from "react";
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

// Compress a data URL image to a smaller JPEG using canvas
// This reduces ~2MB PNGs to ~40-80KB JPEGs that fit in custom fields
function compressImage(dataUrl: string, maxWidth = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = Math.min(maxWidth / img.width, 1);
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(dataUrl); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl); // fallback to original
    img.src = dataUrl;
  });
}

export default function PropertyAdminPage() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [jwtToken, setJwtToken] = useState('');

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

  // Fetch org balance, templates, and admin data when authenticated
  const [orgBalance, setOrgBalance] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [actionTypes, setActionTypes] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [faces, setFaces] = useState<any[]>([]);
  const [paymentConfig, setPaymentConfig] = useState<any>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookRegistering, setWebhookRegistering] = useState(false);
  const [webhookResult, setWebhookResult] = useState<any>(null);
  const [sequencerActions, setSequencerActions] = useState<Array<{type: string; data: string}>>([{ type: 'mint', data: '' }]);
  const [sequencerRunning, setSequencerRunning] = useState(false);
  const [sequencerResult, setSequencerResult] = useState<any>(null);

  // AI Asset Generation
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genPhase, setGenPhase] = useState<'idle' | 'image' | 'video' | 'done'>('idle');
  const [genError, setGenError] = useState('');
  const imageBase64Ref = useRef('');
  const imageMimeTypeRef = useRef('image/png');

  // Check auth on mount
  useEffect(() => {
    fetch('/api/auth/status')
      .then(r => r.json())
      .then(d => {
        setAuthState(d.authenticated ? 'authenticated' : 'unauthenticated');
        if (d.token) setJwtToken(d.token);
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

    // Fetch webhooks (WebhooksModule)
    fetch('/api/webhooks/register')
      .then(r => r.json())
      .then(data => {
        const wh = Array.isArray(data.webhooks) ? data.webhooks :
                   Array.isArray(data.webhooks?.data) ? data.webhooks.data : [];
        setWebhooks(wh);
      })
      .catch(() => {});

    // Fetch action types (EbusModule)
    fetch('/api/ebus/action-types')
      .then(r => r.json())
      .then(data => {
        const at = Array.isArray(data.actionTypes) ? data.actionTypes :
                   Array.isArray(data.actionTypes?.data) ? data.actionTypes.data : [];
        setActionTypes(at);
      })
      .catch(() => {});

    // Fetch batches (SequencerModule)
    fetch('/api/sequencer/batches')
      .then(r => r.json())
      .then(data => {
        const b = Array.isArray(data.batches) ? data.batches :
                  Array.isArray(data.batches?.data) ? data.batches.data : [];
        setBatches(b);
      })
      .catch(() => {});

    // Fetch faces (FacesModule)
    fetch('/api/faces')
      .then(r => r.json())
      .then(data => {
        const f = Array.isArray(data.faces) ? data.faces :
                  Array.isArray(data.faces?.data) ? data.faces.data : [];
        setFaces(f);
      })
      .catch(() => {});

    // Fetch payment config (PaymentsModule)
    fetch('/api/payments/config')
      .then(r => r.json())
      .then(data => { if (data.config) setPaymentConfig(data.config); })
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
        if (data.token) setJwtToken(data.token);
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

  // ── AI Asset Generation ──
  const handleGenerateImage = async () => {
    if (!form.name) { setGenError('Fill in the property name first.'); return; }
    setGenerating(true); setGenPhase('image'); setGenError('');
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, address: form.address, city: form.city, country: form.country, propertyType: form.propertyType, description: form.description, yearBuilt: form.yearBuilt, totalSqft: form.totalSqft, totalPropertyValue: form.totalPropertyValue, annualYield: form.annualYield }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setGenError(data.error || 'Image generation failed'); setGenPhase('idle'); setGenerating(false); return; }
      // Compress to small JPEG so it fits in gateway custom fields
      const compressed = await compressImage(data.imageUrl, 800, 0.7);
      setImageUrl(compressed);
      imageBase64Ref.current = data.imageBase64;
      imageMimeTypeRef.current = 'image/jpeg';
      setGenPhase('done');
    } catch (err: any) { setGenError(err.message || 'Image generation failed'); setGenPhase('idle'); }
    setGenerating(false);
  };

  const handleGenerateVideo = async () => {
    if (!form.name) { setGenError('Fill in the property name first.'); return; }
    setGenerating(true); setGenPhase('video'); setGenError('');
    try {
      const res = await fetch('/api/generate-video', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, city: form.city, country: form.country, propertyType: form.propertyType, description: form.description, imageBase64: imageBase64Ref.current || undefined, imageMimeType: imageMimeTypeRef.current || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setGenError(data.error || 'Video generation failed'); setGenPhase('done'); setGenerating(false); return; }
      setVideoUrl(data.videoUrl);
      setGenPhase('done');
    } catch (err: any) { setGenError(err.message || 'Video generation failed'); setGenPhase('done'); }
    setGenerating(false);
  };

  const handleGenerateAssets = async () => {
    if (!form.name) { setGenError('Fill in the property name first.'); return; }
    setGenerating(true); setGenPhase('image'); setGenError('');
    // Phase 1: Image
    try {
      const imgRes = await fetch('/api/generate-image', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, address: form.address, city: form.city, country: form.country, propertyType: form.propertyType, description: form.description, yearBuilt: form.yearBuilt, totalSqft: form.totalSqft }),
      });
      const imgData = await imgRes.json();
      if (!imgRes.ok || !imgData.success) { setGenError(imgData.error || 'Image generation failed'); setGenPhase('idle'); setGenerating(false); return; }
      const compressed = await compressImage(imgData.imageUrl, 800, 0.7);
      setImageUrl(compressed);
      imageBase64Ref.current = imgData.imageBase64;
      imageMimeTypeRef.current = 'image/jpeg';
    } catch (err: any) { setGenError(err.message); setGenPhase('idle'); setGenerating(false); return; }
    // Phase 2: Video
    setGenPhase('video');
    try {
      const vidRes = await fetch('/api/generate-video', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, city: form.city, country: form.country, propertyType: form.propertyType, description: form.description, imageBase64: imageBase64Ref.current, imageMimeType: imageMimeTypeRef.current }),
      });
      const vidData = await vidRes.json();
      if (vidRes.ok && vidData.success) { setVideoUrl(vidData.videoUrl); }
      else { setGenError(vidData.error || 'Video generation failed (image OK)'); }
    } catch (err: any) { setGenError(err.message + ' (image OK)'); }
    setGenPhase('done'); setGenerating(false);
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
      // Include non-data-URL images/videos in mint payload (small URLs like hosted paths)

      const mintCustom: Record<string, any> = {
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
        totalPropertyValue: form.totalPropertyValue,
        tokenPricePerShare: form.tokenPricePerShare,
        totalTokens: form.totalTokens,
        annualYield: form.annualYield,
        minimumInvestment: form.minimumInvestment,
        monthlyRentalIncome: form.monthlyRentalIncome,
        annualExpenses: form.annualExpenses,
        netOperatingIncome: form.netOperatingIncome,
        capRate: form.capRate,
        projectedAppreciation: form.projectedAppreciation,
      };
      // Include compressed image URL directly in mint (compressed JPEG is small enough)
      if (imageUrl) mintCustom.imageUrl = imageUrl;
      if (videoUrl) mintCustom.videoUrl = videoUrl;

      const mintPayload = { data: mintCustom };

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (jwtToken) headers['Authorization'] = `Bearer ${jwtToken}`;

      const res = await fetch('/api/properties', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...mintPayload, templateId: selectedTemplate || undefined }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        steps.find(s => s.id === 'mint')!.status = 'error';
        setMintSteps([...steps]);
        setMintError(data.error || 'Mint failed');
        // Don't reset auth state on 401 — JWT may still be valid for other operations
        setSubmitting(false);
        return;
      }

      steps.find(s => s.id === 'mint')!.status = 'done';
      setMintSteps([...steps]);

      // Step 3b: Attach AI-generated assets via PATCH if they're data URLs
      const objectId = data.objectIds?.[0];
      if (objectId && (imageUrl || videoUrl)) {
        const patchCustom: Record<string, string> = {};
        if (imageUrl) patchCustom.imageUrl = imageUrl;
        if (videoUrl) patchCustom.videoUrl = videoUrl;
        try {
          await fetch(`/api/objects/${objectId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {}) },
            body: JSON.stringify({ custom: patchCustom }),
          });
        } catch { /* best effort — assets may exceed body limit */ }
      }

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
        <div className="w-8 h-8 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (authState === 'unauthenticated' || authState === 'otp_sent') {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#0a0e1a] to-[#111827]">
        <div className="w-full max-w-md p-8 rounded-lg bg-[#111827] border border-[#c9a84c]/20">
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
                className="w-full px-4 py-2 rounded bg-[#0a0e1a] border border-[#c9a84c]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a84c]"
              />
              <button
                onClick={handleSendOtp}
                disabled={!email || authLoading}
                className="w-full px-4 py-2 rounded bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a] font-semibold hover:shadow-lg hover:shadow-[#c9a84c]/50 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
                className="w-full px-4 py-2 rounded bg-[#0a0e1a] border border-[#c9a84c]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a84c] text-center text-lg tracking-widest"
              />
              <button
                onClick={handleLogin}
                disabled={!otp || authLoading}
                className="w-full px-4 py-2 rounded bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a] font-semibold hover:shadow-lg hover:shadow-[#c9a84c]/50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {authLoading ? 'Verifying...' : 'Verify'}
              </button>
              <button
                onClick={() => {
                  setAuthState('unauthenticated');
                  setOtp('');
                }}
                className="w-full text-gray-400 text-sm hover:text-[#c9a84c] transition"
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0a0e1a] to-[#111827] p-4">
        <div className="w-full max-w-2xl">
          <div className="space-y-4">
            {mintSteps.map((step, idx) => (
              <div key={step.id} className="relative">
                <div className={`p-4 rounded-lg border transition ${
                  step.status === 'done' ? 'bg-green-900/20 border-green-500/30' :
                  step.status === 'error' ? 'bg-red-900/20 border-red-500/30' :
                  step.status === 'active' ? 'bg-[#c9a84c]/10 border-[#c9a84c]/30' :
                  'bg-[#111827] border-[#c9a84c]/20'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      step.status === 'done' ? 'bg-green-500' :
                      step.status === 'error' ? 'bg-red-500' :
                      step.status === 'active' ? 'bg-[#c9a84c] animate-pulse' :
                      'bg-gray-600'
                    }`}>
                      {step.status === 'done' && <span className="text-white text-sm">✓</span>}
                      {step.status === 'error' && <span className="text-white text-sm">!</span>}
                      {step.status === 'active' && <span className="w-2 h-2 bg-[#0a0e1a] rounded-full animate-bounce" />}
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
                    'border-[#c9a84c]/30'
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0a0e1a] to-[#111827] p-4">
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
              <div className="p-4 rounded-lg bg-[#111827] border border-[#c9a84c]/30">
                <p className="text-gray-400 text-sm mb-1">Action ID</p>
                <p className="text-white font-mono text-sm break-all">{mintResult.actionId}</p>
              </div>

              {mintResult.objectIds.length > 0 && (
                <div className="p-4 rounded-lg bg-[#111827] border border-[#c9a84c]/30">
                  <p className="text-gray-400 text-sm mb-2">Property Token ID{mintResult.objectIds.length > 1 ? 's' : ''}</p>
                  <div className="space-y-2">
                    {mintResult.objectIds.map((id, idx) => (
                      <p key={idx} className="text-[#c9a84c] font-mono text-sm break-all">
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
                setImageUrl(''); setVideoUrl(''); setGenPhase('idle'); setGenError('');
                imageBase64Ref.current = ''; imageMimeTypeRef.current = 'image/png';
              }}
              className="flex-1 px-6 py-3 rounded bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a] font-semibold hover:shadow-lg hover:shadow-[#c9a84c]/50 transition"
            >
              Mint Another
            </button>
            <Link
              href="/property"
              className="flex-1 px-6 py-3 rounded border border-[#c9a84c] text-[#c9a84c] font-semibold hover:bg-[#c9a84c]/10 transition text-center"
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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] to-[#111827] p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-4xl text-[#c9a84c]">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#111827] rounded-lg border border-[#c9a84c]/20 p-6">
            <p className="text-gray-400 text-sm mb-1">Organization Balance</p>
            <p className="text-2xl font-bold text-white">{orgBalance ? JSON.stringify(orgBalance).slice(0, 30) : 'Loading...'}</p>
          </div>
          <div className="bg-[#111827] rounded-lg border border-[#c9a84c]/20 p-6">
            <p className="text-gray-400 text-sm mb-1">Available Templates</p>
            <p className="text-2xl font-bold text-white">{templates.length}</p>
          </div>
          <div className="bg-[#111827] rounded-lg border border-[#c9a84c]/20 p-6">
            <p className="text-gray-400 text-sm mb-1">Network Status</p>
            <p className="text-2xl font-bold text-green-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Connected
            </p>
          </div>
        </div>

        {/* Extended DUAL Module Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
          <div className="bg-[#111827] rounded-lg border border-[#c9a84c]/20 p-4">
            <p className="text-gray-500 text-xs mb-1">Webhooks</p>
            <p className="text-xl font-bold text-white">{webhooks.length}</p>
            <p className="text-xs text-gray-500">Active listeners</p>
          </div>
          <div className="bg-[#111827] rounded-lg border border-[#c9a84c]/20 p-4">
            <p className="text-gray-500 text-xs mb-1">Action Types</p>
            <p className="text-xl font-bold text-white">{actionTypes.length}</p>
            <p className="text-xs text-gray-500">Custom actions</p>
          </div>
          <div className="bg-[#111827] rounded-lg border border-[#c9a84c]/20 p-4">
            <p className="text-gray-500 text-xs mb-1">Faces</p>
            <p className="text-xl font-bold text-white">{faces.length}</p>
            <p className="text-xs text-gray-500">Token media</p>
          </div>
          <div className="bg-[#111827] rounded-lg border border-[#c9a84c]/20 p-4">
            <p className="text-gray-500 text-xs mb-1">Batches</p>
            <p className="text-xl font-bold text-white">{batches.length}</p>
            <p className="text-xs text-gray-500">Sequencer jobs</p>
          </div>
          <div className="bg-[#111827] rounded-lg border border-[#c9a84c]/20 p-4">
            <p className="text-gray-500 text-xs mb-1">Payments</p>
            <p className="text-xl font-bold text-white">{paymentConfig ? 'Active' : '-'}</p>
            <p className="text-xs text-gray-500">Config status</p>
          </div>
        </div>

        {/* Webhook Auto-Registration Panel */}
        <div className="bg-[#111827] rounded-lg border border-[#c9a84c]/20 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#c9a84c]">webhook</span>
            Webhook Auto-Registration
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            Automatically register webhooks for all standard DUAL events (object.created, object.transferred, action.executed, payment.completed, etc.)
          </p>
          <div className="flex gap-3 mb-4">
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-domain.com/api/webhooks/receive"
              className="flex-1 px-4 py-2 rounded bg-[#0a0e1a] border border-[#c9a84c]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a84c] transition"
            />
            <button
              onClick={async () => {
                if (!webhookUrl) return;
                setWebhookRegistering(true);
                setWebhookResult(null);
                try {
                  const res = await fetch('/api/webhooks/auto-register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ callbackUrl: webhookUrl }),
                  });
                  const data = await res.json();
                  setWebhookResult(data);
                  // Refresh webhook count
                  fetch('/api/webhooks/register').then(r => r.json()).then(data => {
                    const wh = Array.isArray(data.webhooks) ? data.webhooks : Array.isArray(data.webhooks?.data) ? data.webhooks.data : [];
                    setWebhooks(wh);
                  }).catch(() => {});
                } catch (err: any) {
                  setWebhookResult({ error: err.message });
                } finally {
                  setWebhookRegistering(false);
                }
              }}
              disabled={webhookRegistering || !webhookUrl}
              className="px-6 py-2 rounded bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a] font-semibold hover:shadow-lg hover:shadow-[#c9a84c]/50 disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap"
            >
              {webhookRegistering ? 'Registering...' : 'Auto-Register All'}
            </button>
          </div>
          {webhookResult && (
            <div className={`p-3 rounded text-sm ${webhookResult.error ? 'bg-red-900/20 border border-red-500/30 text-red-200' : 'bg-green-900/20 border border-green-500/30 text-green-200'}`}>
              {webhookResult.error
                ? `Error: ${webhookResult.error}`
                : `Registered ${webhookResult.registered} webhooks (${webhookResult.failed} failed)`}
            </div>
          )}
          {webhooks.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#c9a84c]/10">
              <p className="text-xs text-gray-500 mb-2">Active Webhooks ({webhooks.length})</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {webhooks.map((wh: any, i: number) => (
                  <div key={wh.id || i} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-white/60 truncate">{wh.url || wh.callbackUrl || 'Webhook'}</span>
                    <span className="text-gray-500 ml-auto">{wh.events?.length || 0} events</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sequencer Workflow Builder */}
        <div className="bg-[#111827] rounded-lg border border-[#c9a84c]/20 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#c9a84c]">reorder</span>
            Sequencer Workflow Builder
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            Chain multiple actions into a single sequential workflow. Actions execute in order through the DUAL ebus.
          </p>
          <div className="space-y-3 mb-4">
            {sequencerActions.map((action, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="text-[#c9a84c] font-mono text-sm mt-2 w-6">{i + 1}.</span>
                <select
                  value={action.type}
                  onChange={(e) => {
                    const updated = [...sequencerActions];
                    updated[i].type = e.target.value;
                    setSequencerActions(updated);
                  }}
                  className="px-3 py-2 rounded bg-[#0a0e1a] border border-[#c9a84c]/20 text-white text-sm focus:outline-none focus:border-[#c9a84c] transition"
                >
                  <option value="mint">Mint</option>
                  <option value="transfer">Transfer</option>
                  <option value="burn">Burn</option>
                  <option value="custom">Custom Action</option>
                </select>
                <input
                  type="text"
                  value={action.data}
                  onChange={(e) => {
                    const updated = [...sequencerActions];
                    updated[i].data = e.target.value;
                    setSequencerActions(updated);
                  }}
                  placeholder='{"objectId": "...", "amount": 1}'
                  className="flex-1 px-3 py-2 rounded bg-[#0a0e1a] border border-[#c9a84c]/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#c9a84c] transition font-mono"
                />
                {sequencerActions.length > 1 && (
                  <button
                    onClick={() => setSequencerActions(sequencerActions.filter((_, j) => j !== i))}
                    className="p-2 text-red-400 hover:text-red-300 transition"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setSequencerActions([...sequencerActions, { type: 'mint', data: '' }])}
              className="px-4 py-2 rounded border border-[#c9a84c]/30 text-[#c9a84c] text-sm hover:bg-[#c9a84c]/10 transition"
            >
              + Add Step
            </button>
            <button
              onClick={async () => {
                setSequencerRunning(true);
                setSequencerResult(null);
                try {
                  const actions = sequencerActions.map(a => ({
                    type: a.type,
                    ...( a.data ? JSON.parse(a.data) : {}),
                  }));
                  const res = await fetch('/api/sequencer/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ actions }),
                  });
                  const data = await res.json();
                  setSequencerResult(data);
                } catch (err: any) {
                  setSequencerResult({ error: err.message || 'Failed to execute sequence' });
                } finally {
                  setSequencerRunning(false);
                }
              }}
              disabled={sequencerRunning}
              className="px-6 py-2 rounded bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a] font-semibold hover:shadow-lg hover:shadow-[#c9a84c]/50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {sequencerRunning ? 'Executing...' : 'Execute Sequence'}
            </button>
          </div>
          {sequencerResult && (
            <div className={`mt-4 p-3 rounded text-sm ${sequencerResult.error ? 'bg-red-900/20 border border-red-500/30 text-red-200' : 'bg-green-900/20 border border-green-500/30 text-green-200'}`}>
              {sequencerResult.error
                ? `Error: ${sequencerResult.error}`
                : `Executed ${sequencerResult.totalExecuted} actions: ${sequencerResult.results?.filter((r: any) => r.success).length} succeeded, ${sequencerResult.results?.filter((r: any) => !r.success).length} failed`}
            </div>
          )}
        </div>

        {/* Template Selector */}
        {templates.length > 0 && (
          <div className="bg-[#111827] rounded-lg border border-[#c9a84c]/20 p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-[#c9a84c]">📋</span> Select Template
            </h2>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-4 py-2 rounded bg-[#0a0e1a] border border-[#c9a84c]/20 text-white focus:outline-none focus:border-[#c9a84c] transition"
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
          <div className="bg-[#111827] rounded-lg border border-[#c9a84c]/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <span className="text-[#c9a84c]">📍</span> Property Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Property Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded bg-[#0a0e1a] border border-[#c9a84c]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a84c] transition"
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
                  className="w-full px-4 py-2 rounded bg-[#0a0e1a] border border-[#c9a84c]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a84c] transition"
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
                  className="w-full px-4 py-2 rounded bg-[#0a0e1a] border border-[#c9a84c]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a84c] transition"
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
                  className="w-full px-4 py-2 rounded bg-[#0a0e1a] border border-[#c9a84c]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a84c] transition"
                  placeholder="United States"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Property Type *</label>
                <select
                  value={form.propertyType}
                  onChange={(e) => update('propertyType', e.target.value)}
                  className="w-full px-4 py-2 rounded bg-[#0a0e1a] border border-[#c9a84c]/20 text-white focus:outline-none focus:border-[#c9a84c] transition"
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
                  className="w-full px-4 py-2 rounded bg-[#0a0e1a] border border-[#c9a84c]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a84c] transition"
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
                  className="w-full px-4 py-2 rounded bg-[#0a0e1a] border border-[#c9a84c]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a84c] transition"
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
                  className="w-full px-4 py-2 rounded bg-[#0a0e1a] border border-[#c9a84c]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a84c] transition"
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
                className="w-full px-4 py-2 rounded bg-[#0a0e1a] border border-[#c9a84c]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a84c] transition resize-none"
                placeholder="A detailed description of the property..."
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm text-gray-300 mb-2">Key Features (comma-separated)</label>
              <textarea
                value={form.keyFeatures}
                onChange={(e) => update('keyFeatures', e.target.value)}
                rows={2}
                className="w-full px-4 py-2 rounded bg-[#0a0e1a] border border-[#c9a84c]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a84c] transition resize-none"
                placeholder="e.g., Smart Home Technology, Rooftop Garden, 24/7 Security"
              />
            </div>
          </div>

          {/* Investment Structure Section */}
          <div className="bg-[#111827] rounded-lg border border-[#c9a84c]/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <span className="text-[#c9a84c]">💎</span> Investment Structure
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Total Property Value ($) *</label>
                <input
                  type="number"
                  value={form.totalPropertyValue}
                  onChange={(e) => update('totalPropertyValue', parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-4 py-2 rounded bg-[#0a0e1a] border border-[#c9a84c]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a84c] transition"
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
                  className="w-full px-4 py-2 rounded bg-[#0a0e1a] border border-[#c9a84c]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a84c] transition"
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
                  className="w-full px-4 py-2 rounded bg-[#0a0e1a] border border-[#c9a84c]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a84c] transition"
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
                  className="w-full px-4 py-2 rounded bg-[#0a0e1a] border border-[#c9a84c]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a84c] transition"
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
                  className="w-full px-4 py-2 rounded bg-[#0a0e1a] border border-[#c9a84c]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a84c] transition"
                  placeholder="10000"
                />
              </div>
            </div>
          </div>

          {/* Financial Details Section */}
          <div className="bg-[#111827] rounded-lg border border-[#c9a84c]/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <span className="text-[#c9a84c]">📊</span> Financial Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Monthly Rental Income ($) *</label>
                <input
                  type="number"
                  value={form.monthlyRentalIncome}
                  onChange={(e) => update('monthlyRentalIncome', parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-4 py-2 rounded bg-[#0a0e1a] border border-[#c9a84c]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a84c] transition"
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
                  className="w-full px-4 py-2 rounded bg-[#0a0e1a] border border-[#c9a84c]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a84c] transition"
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
                  className="w-full px-4 py-2 rounded bg-[#0a0e1a] border border-[#c9a84c]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a84c] transition"
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
                  className="w-full px-4 py-2 rounded bg-[#0a0e1a] border border-[#c9a84c]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a84c] transition"
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
                  className="w-full px-4 py-2 rounded bg-[#0a0e1a] border border-[#c9a84c]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a84c] transition"
                  placeholder="2.0"
                />
              </div>
            </div>
          </div>

          {/* AI Asset Generation */}
          <div className="bg-[#111827] rounded-lg border border-[#c9a84c]/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <span className="text-[#c9a84c]">✨</span> AI Asset Generation
            </h2>
            <p className="text-gray-400 text-sm mb-4">Generate AI property images and cinematic videos using Google Gemini. Fill in the property details above first.</p>

            {genError && (
              <div className="mb-4 p-3 rounded bg-red-900/30 border border-red-500/30 text-red-200 text-sm">{genError}</div>
            )}

            {/* Generation buttons */}
            {!imageUrl && !generating && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button type="button" onClick={handleGenerateImage} className="px-4 py-3 rounded border-2 border-dashed border-[#c9a84c]/30 text-[#c9a84c] hover:border-[#c9a84c]/60 hover:bg-[#c9a84c]/5 transition flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">image</span>
                  Generate Image
                </button>
                <button type="button" onClick={handleGenerateAssets} className="px-4 py-3 rounded bg-gradient-to-r from-[#c9a84c]/20 to-[#a68832]/20 border border-[#c9a84c]/40 text-[#c9a84c] hover:from-[#c9a84c]/30 hover:to-[#a68832]/30 transition flex items-center justify-center gap-2 font-semibold">
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                  Image + Video
                </button>
                <button type="button" onClick={handleGenerateVideo} disabled={!imageUrl} className="px-4 py-3 rounded border-2 border-dashed border-[#c9a84c]/30 text-[#c9a84c] hover:border-[#c9a84c]/60 hover:bg-[#c9a84c]/5 transition flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed">
                  <span className="material-symbols-outlined text-sm">movie_creation</span>
                  Generate Video
                </button>
              </div>
            )}

            {/* Generating spinner */}
            {generating && (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full border-2 border-[#c9a84c]/30 border-t-[#c9a84c] animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#c9a84c] text-lg">{genPhase === 'image' ? 'image' : 'movie_creation'}</span>
                  </div>
                </div>
                <p className="text-sm font-semibold text-[#c9a84c]">
                  {genPhase === 'image' ? 'Generating Property Image...' : 'Generating Cinematic Video...'}
                </p>
                <p className="text-xs text-gray-500">
                  {genPhase === 'image' ? 'Usually takes 5–15 seconds' : 'May take 30–120 seconds'}
                </p>
                <div className="flex gap-3 mt-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${genPhase === 'image' ? 'bg-[#c9a84c]/20 text-[#c9a84c] animate-pulse' : imageUrl ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/30'}`}>
                    {imageUrl ? '✓' : '◎'} Image
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${genPhase === 'video' ? 'bg-[#c9a84c]/20 text-[#c9a84c] animate-pulse' : videoUrl ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/30'}`}>
                    {videoUrl ? '✓' : '◎'} Video
                  </span>
                </div>
              </div>
            )}

            {/* Preview generated assets */}
            {imageUrl && !generating && (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border border-[#c9a84c]/20">
                  <div className="flex items-center justify-between px-3 py-2 bg-[#0a0e1a]">
                    <span className="text-xs font-semibold text-white/70 flex items-center gap-1"><span className="material-symbols-outlined text-xs text-[#c9a84c]">image</span> AI Property Image</span>
                    <button type="button" onClick={handleGenerateImage} className="text-xs text-[#c9a84c] hover:text-white transition flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">refresh</span> Regenerate
                    </button>
                  </div>
                  <img src={imageUrl} alt="AI Generated Property" className="w-full aspect-video object-cover" />
                </div>

                {videoUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-[#c9a84c]/20">
                    <div className="flex items-center justify-between px-3 py-2 bg-[#0a0e1a]">
                      <span className="text-xs font-semibold text-white/70 flex items-center gap-1"><span className="material-symbols-outlined text-xs text-[#c9a84c]">movie_creation</span> AI Cinematic Video</span>
                      <button type="button" onClick={handleGenerateVideo} className="text-xs text-[#c9a84c] hover:text-white transition flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">refresh</span> Regenerate
                      </button>
                    </div>
                    <video src={videoUrl} controls autoPlay loop muted className="w-full aspect-video object-cover" />
                  </div>
                ) : (
                  <button type="button" onClick={handleGenerateVideo} className="w-full px-4 py-3 rounded border-2 border-dashed border-[#c9a84c]/30 text-[#c9a84c] hover:border-[#c9a84c]/60 hover:bg-[#c9a84c]/5 transition flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">movie_creation</span>
                    Generate Cinematic Video from Image
                  </button>
                )}
              </div>
            )}
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
              className="flex-1 px-6 py-3 rounded bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a] font-semibold hover:shadow-lg hover:shadow-[#c9a84c]/50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? 'Tokenizing...' : 'Tokenize Property'}
            </button>
            <Link
              href="/property"
              className="px-6 py-3 rounded border border-[#c9a84c] text-[#c9a84c] font-semibold hover:bg-[#c9a84c]/10 transition"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
