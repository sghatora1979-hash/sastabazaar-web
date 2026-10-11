'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import {
  getMyBiker, saveBikerProfile, addBikerDocument, saveVehicle,
  maskAadhaar, maskPan, maskBank, maskUpiId,
  type BikerProfile, type DocType,
} from '@/lib/delivery';
import { OtpInput } from '@/components/delivery/OtpInput';
import { DocUpload } from '@/components/delivery/DocUpload';
import { ZonePicker, type ZoneValue } from '@/components/delivery/ZonePicker';
import { DemoBadge, SoonBadge, BikerStatusBadge, fieldCls, labelCls, cardCls, primaryBtnCls, PageHero } from '@/components/delivery/DeliveryBadges';
import { BRAND } from '@/components/store/ProductCard';

const STEP_TITLES = ['About you', 'Licence & vehicle', 'KYC (private)', 'Service area', 'Payout & terms'];

function ageFromDob(dob: string): number | null {
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function LoginPrompt() {
  return (
    <div className="max-w-2xl mx-auto px-4">
      <PageHero emoji="🛵" title="Biker registration" sub="Apply to become a SastaBazaar delivery partner." />
      <div className={`${cardCls} text-center`}>
        <p className="text-sm font-bold text-gray-800 mb-1">Please log in first</p>
        <p className="text-xs text-gray-500 mb-4">Bikers use their normal SastaBazaar account (email OTP).</p>
        <Link href="/account" className={`${primaryBtnCls} inline-block`} style={{ background: BRAND }}>
          Login with email OTP
        </Link>
      </div>
    </div>
  );
}

export default function BikerRegisterPage() {
  const { ready, user, configured } = useAuth();
  const realMode = !!(ready && user && configured);
  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState<BikerProfile | null>(null);
  const [reapply, setReapply] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const sb = getSupabase();
    if (!sb || !user) { setLoading(false); return; }
    getMyBiker().then(b => { setExisting(b); setLoading(false); }).catch(() => setLoading(false));
  }, [ready, user]);

  if (!ready || loading) {
    return <div className="min-h-screen bg-[#FFF9EC] flex items-center justify-center text-sm text-gray-500">Loading…</div>;
  }
  if (!realMode) return <div className="min-h-screen bg-[#FFF9EC] pb-24 pt-2"><LoginPrompt /></div>;
  if (!getSupabase()) {
    return (
      <div className="min-h-screen bg-[#FFF9EC] pb-24 pt-2">
        <div className="max-w-2xl mx-auto px-4">
          <PageHero emoji="🛵" title="Biker registration" sub="" />
          <div className={`${cardCls} text-center text-sm text-gray-600`}>Backend not configured — registration is unavailable right now.</div>
        </div>
      </div>
    );
  }

  if (existing && !reapply && (existing.status === 'pending_verification' || existing.status === 'approved')) {
    return (
      <div className="min-h-screen bg-[#FFF9EC] pb-24 pt-2">
        <div className="max-w-2xl mx-auto px-4">
          <PageHero emoji="🛵" title="Your application" sub="Here's where things stand." />
          <div className={`${cardCls} text-center`}>
            <div className="flex justify-center mb-3"><BikerStatusBadge status={existing.status} /></div>
            {existing.status === 'approved' ? (
              <>
                <p className="text-sm text-gray-600 mb-4">You're approved! Open your dashboard to go online and accept deliveries.</p>
                <Link href="/biker/dashboard" className={`${primaryBtnCls} inline-block`} style={{ background: BRAND }}>Open dashboard</Link>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-2">Thanks, <b>{existing.full_name}</b>! Our team will verify your documents (manual review).</p>
                <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500"><ShieldCheck size={14} /> <SoonBadge label="Instant verification — Coming soon" /></div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (existing && !reapply && existing.status === 'rejected') {
    return (
      <div className="min-h-screen bg-[#FFF9EC] pb-24 pt-2">
        <div className="max-w-2xl mx-auto px-4">
          <PageHero emoji="🛵" title="Application not approved" sub="You can fix the issues and apply again." />
          <div className={`${cardCls}`}>
            <div className="flex justify-center mb-3"><BikerStatusBadge status="rejected" /></div>
            {existing.rejection_reason && (
              <p className="text-sm text-gray-700 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <span className="font-bold">Reason:</span> {existing.rejection_reason}
              </p>
            )}
            <button onClick={() => setReapply(true)} className={primaryBtnCls} style={{ background: BRAND }}>Apply again</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9EC] pb-24 pt-2">
      <RegisterForm prefill={reapply ? existing : null} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Multi-step form                                                     */
/* ------------------------------------------------------------------ */
function RegisterForm({ prefill }: { prefill: BikerProfile | null }) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  // Step 1 — About you
  const [fullName, setFullName] = useState(prefill?.full_name ?? '');
  const [phone, setPhone] = useState(prefill?.phone ?? '');
  const [email, setEmail] = useState(prefill?.email ?? '');
  const [dob, setDob] = useState(prefill?.dob ?? '');
  const [photoPath, setPhotoPath] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [demoCode, setDemoCode] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Step 2 — Licence & vehicle
  const [dlNumber, setDlNumber] = useState('');
  const [dlDoc, setDlDoc] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [regNo, setRegNo] = useState('');
  const [makeModel, setMakeModel] = useState('');
  const [rcDoc, setRcDoc] = useState('');
  const [insuranceDoc, setInsuranceDoc] = useState('');
  const [pucDoc, setPucDoc] = useState('');

  // Step 3 — KYC
  const [kycConsent, setKycConsent] = useState(false);
  const [aadhaar, setAadhaar] = useState('');
  const [aadhaarDoc, setAadhaarDoc] = useState('');
  const [pan, setPan] = useState('');
  const [panDoc, setPanDoc] = useState('');

  // Step 4 — Service area
  const [zone, setZone] = useState<ZoneValue>({
    state: prefill?.service_state ?? '', city: prefill?.service_city ?? '',
    district: prefill?.service_district ?? '', pins: prefill?.service_pins ?? [],
  });
  const [radius, setRadius] = useState(prefill?.delivery_radius_km ?? 10);

  // Step 5 — Payout & terms
  const [payoutKind, setPayoutKind] = useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = useState('');
  const [acctNo, setAcctNo] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [emName, setEmName] = useState(prefill?.emergency_name ?? '');
  const [emPhone, setEmPhone] = useState(prefill?.emergency_phone ?? '');
  const [terms, setTerms] = useState(false);

  const sendDemoCode = () => {
    if (phone.replace(/\D/g, '').length !== 10) { setOtpError('Enter a valid 10-digit phone number first.'); return; }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setDemoCode(code);
    setOtpSent(true);
    setOtpValue('');
    setOtpError('');
  };

  const verifyDemoCode = () => {
    if (otpValue === demoCode) { setPhoneVerified(true); setOtpError(''); }
    else setOtpError('Wrong code — try again.');
  };

  const stepErrors = (s: number): string => {
    if (s === 0) {
      if (!fullName.trim()) return 'Please enter your full name.';
      if (phone.replace(/\D/g, '').length !== 10) return 'Phone must be exactly 10 digits.';
      if (!phoneVerified) return 'Please verify your phone with the demo code.';
      if (dob) {
        const age = ageFromDob(dob);
        if (age === null) return 'Enter a valid date of birth.';
        if (age < 18) return `You must be 18 or older to ride with us (your age: ${age}).`;
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Email address looks invalid.';
      return '';
    }
    if (s === 1) {
      if (!dlNumber.trim()) return 'Driving licence number is required.';
      if (!dlDoc) return 'Please upload your driving licence document.';
      if (!vehicleType) return 'Please choose a vehicle type.';
      if (!regNo.trim()) return 'Vehicle registration number is required.';
      if (!rcDoc) return 'Please upload your vehicle RC.';
      if (!insuranceDoc) return 'Please upload your insurance document.';
      return '';
    }
    if (s === 2) {
      if (!kycConsent) return 'KYC consent is required to store your ID documents.';
      if (aadhaar.replace(/\D/g, '').length !== 12) return 'Aadhaar number must be 12 digits.';
      if (!aadhaarDoc) return 'Please upload your Aadhaar document.';
      if (!/^[A-Za-z]{5}[0-9]{4}[A-Za-z]$/.test(pan.trim())) return 'PAN must be 10 characters (e.g. ABCDE1234F).';
      if (!panDoc) return 'Please upload your PAN document.';
      return '';
    }
    if (s === 3) {
      if (!zone.state) return 'Please select your state.';
      if (!zone.city.trim()) return 'Please enter your city.';
      if (zone.pins.length < 1) return 'Add at least one service PIN code.';
      return '';
    }
    if (s === 4) {
      if (payoutKind === 'upi' && !upiId.trim()) return 'Enter your UPI ID.';
      if (payoutKind === 'bank') {
        if (acctNo.replace(/\D/g, '').length < 8) return 'Enter a valid bank account number.';
        if (!/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(ifsc.trim())) return 'Enter a valid IFSC (e.g. HDFC0001234).';
      }
      if (!emName.trim()) return 'Emergency contact name is required.';
      if (emPhone.replace(/\D/g, '').length !== 10) return 'Emergency phone must be 10 digits.';
      if (!terms) return 'Please accept the Delivery Partner Terms.';
      return '';
    }
    return '';
  };

  const next = () => {
    const e = stepErrors(step);
    if (e) { setError(e); return; }
    setError('');
    setStep(s => Math.min(s + 1, 4));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const back = () => { setError(''); setStep(s => Math.max(s - 1, 0)); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const submit = async () => {
    const e = stepErrors(4);
    if (e) { setError(e); return; }
    setError(''); setSubmitting(true);
    try {
      const digits = (v: string) => v.replace(/\D/g, '');
      const biker = await saveBikerProfile({
        full_name: fullName.trim(),
        phone: digits(phone),
        email: email.trim() || null,
        dob: dob || null,
        photo_url: null,
        service_state: zone.state,
        service_city: zone.city.trim(),
        service_district: zone.district.trim() || null,
        service_pins: zone.pins,
        delivery_radius_km: radius,
        emergency_name: emName.trim(),
        emergency_phone: digits(emPhone),
        status: 'pending_verification',
        terms_accepted: true,
        // Payout (masked note only — raw numbers never leave this form)
        payout_note: payoutKind === 'upi'
          ? `UPI ${maskUpiId(upiId)}`
          : `Bank A/c ${maskBank(acctNo)}, IFSC ${ifsc.trim().toUpperCase()}`,
        terms_accepted_at: new Date().toISOString(),
      } as Partial<BikerProfile> & { full_name: string; phone: string; payout_note?: string; terms_accepted_at?: string });

      const docs: Array<[DocType, string, string | undefined]> = [
        ['driving_licence', dlDoc, undefined],
        ['vehicle_rc', rcDoc, undefined],
        ['insurance', insuranceDoc, undefined],
      ];
      if (pucDoc) docs.push(['puc', pucDoc, undefined]);
      docs.push(['aadhaar', aadhaarDoc, maskAadhaar(aadhaar)]);
      docs.push(['pan', panDoc, maskPan(pan)]);
      if (photoPath) docs.push(['profile_photo', photoPath, undefined]);
      for (const [t, p, m] of docs) await addBikerDocument(biker.id, t, p, m);
      await saveVehicle(biker.id, vehicleType, regNo.trim().toUpperCase(), makeModel.trim());
      setDone(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className={`${cardCls} text-center py-10`}>
          <CheckCircle2 size={52} className="mx-auto text-green-600 mb-4" />
          <h2 className="text-xl font-black text-gray-900 mb-2">Application submitted!</h2>
          <div className="flex justify-center mb-3"><BikerStatusBadge status="pending_verification" /></div>
          <p className="text-sm text-gray-600 max-w-md mx-auto mb-2">
            Our team will verify your documents (manual review). We'll notify you once you're approved.
          </p>
          <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500">
            <ShieldCheck size={14} /> <SoonBadge label="Instant verification — Coming soon" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      <PageHero emoji="🛵" title="Become a delivery partner" sub="Fill in your details — it takes a few minutes. Everything marked * is required." />

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          {STEP_TITLES.map((t, i) => (
            <div key={t} className={`flex-1 text-center ${i === step ? 'text-gray-900' : 'text-gray-400'}`}>
              <div
                className="mx-auto w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-white mb-1"
                style={{ background: i < step ? '#16a34a' : i === step ? BRAND : '#d1d5db' }}
              >
                {i < step ? '✓' : i + 1}
              </div>
              <span className="hidden sm:block text-[10px] font-bold leading-tight">{t}</span>
            </div>
          ))}
        </div>
        <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${((step + 1) / 5) * 100}%`, background: BRAND }} />
        </div>
        <p className="sm:hidden text-[11px] font-bold text-gray-700 mt-1 text-center">Step {step + 1} of 5 — {STEP_TITLES[step]}</p>
      </div>

      <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} className={cardCls}>
        <h3 className="text-base font-black text-gray-900 mb-4">{STEP_TITLES[step]}</h3>

        {step === 0 && (
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Full name *</label>
              <input className={fieldCls} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="As on your licence" />
            </div>
            <div>
              <label className={labelCls}>Phone (10 digits) *</label>
              <div className="flex gap-2">
                <input className={fieldCls} inputMode="numeric" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="98765 43210" disabled={phoneVerified} />
                {!phoneVerified && <button type="button" onClick={sendDemoCode} className="px-4 rounded-xl text-white text-sm font-bold shrink-0" style={{ background: BRAND }}>Send code</button>}
              </div>
              {phoneVerified && <p className="text-xs text-green-700 font-bold mt-1">✓ Phone verified</p>}
            </div>
            {otpSent && !phoneVerified && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 flex-wrap">
                  <DemoBadge />
                  <span className="text-xs font-bold text-gray-800">Demo code: <span className="text-base tracking-widest">{demoCode}</span></span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">Demo code — no real SMS is sent (SMS provider not configured).</p>
                <div className="mt-2"><OtpInput value={otpValue} onChange={setOtpValue} /></div>
                <button type="button" onClick={verifyDemoCode} className="mt-2 px-4 py-2 rounded-xl text-white text-sm font-bold" style={{ background: BRAND }}>Verify</button>
                {otpError && <p className="text-xs text-red-600 font-bold mt-1">{otpError}</p>}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Email</label>
                <input className={fieldCls} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div>
                <label className={labelCls}>Date of birth (must be 18+)</label>
                <input className={fieldCls} type="date" value={dob} onChange={e => setDob(e.target.value)} />
              </div>
            </div>
            <DocUpload label="Profile photo" hint="A clear photo of your face" kind="photo" onUploaded={setPhotoPath} />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Driving licence number *</label>
              <input className={fieldCls} value={dlNumber} onChange={e => setDlNumber(e.target.value.toUpperCase())} placeholder="e.g. KA05 20230012345" />
            </div>
            <DocUpload label="Driving licence document" hint="Photo/scan of front & back" kind="doc" onUploaded={setDlDoc} required />
            <div>
              <label className={labelCls}>Vehicle type *</label>
              <select className={fieldCls} value={vehicleType} onChange={e => setVehicleType(e.target.value)}>
                <option value="">Select…</option>
                <option value="bike">Bike (petrol)</option>
                <option value="scooter">Scooter</option>
                <option value="ev_bike">EV bike / scooter</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Registration number *</label>
                <input className={fieldCls} value={regNo} onChange={e => setRegNo(e.target.value.toUpperCase())} placeholder="KA-05-AB-1234" />
              </div>
              <div>
                <label className={labelCls}>Make & model</label>
                <input className={fieldCls} value={makeModel} onChange={e => setMakeModel(e.target.value)} placeholder="e.g. Honda Activa 6G" />
              </div>
            </div>
            <DocUpload label="Vehicle RC" hint="Registration certificate" kind="doc" onUploaded={setRcDoc} required />
            <DocUpload label="Insurance" hint="Valid motor insurance policy" kind="doc" onUploaded={setInsuranceDoc} required />
            <DocUpload label="PUC certificate" hint="Pollution certificate — not required for EVs" kind="doc" onUploaded={setPucDoc} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex gap-2">
              <span className="text-base">🔒</span>
              <span><b>Private — never shown publicly.</b> Your ID documents are stored securely and checked manually by our team. Only masked values (e.g. XXXX-XXXX-1234) are ever recorded.</span>
            </div>
            <label className="flex gap-2 items-start text-xs text-gray-700 cursor-pointer">
              <input type="checkbox" checked={kycConsent} onChange={e => setKycConsent(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#FB7701]" />
              <span><b>I consent</b> to SastaBazaar storing my ID documents securely for verification. *</span>
            </label>
            <div>
              <label className={labelCls}>Aadhaar number (12 digits) *</label>
              <input className={fieldCls} inputMode="numeric" value={aadhaar} onChange={e => setAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="12-digit Aadhaar" />
              {aadhaar.length === 12 && <p className="text-[11px] text-gray-500 mt-1">Stored as: <b>{maskAadhaar(aadhaar)}</b> (raw number never saved)</p>}
            </div>
            <DocUpload label="Aadhaar document" hint="Photo/scan — stored privately" kind="doc" onUploaded={setAadhaarDoc} required />
            <div>
              <label className={labelCls}>PAN (10 characters) *</label>
              <input className={fieldCls} value={pan} onChange={e => setPan(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))} placeholder="ABCDE1234F" />
              {pan.length >= 5 && <p className="text-[11px] text-gray-500 mt-1">Stored as: <b>{maskPan(pan)}</b> (raw number never saved)</p>}
            </div>
            <DocUpload label="PAN document" hint="Photo/scan — stored privately" kind="doc" onUploaded={setPanDoc} required />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <ZonePicker value={zone} onChange={setZone} />
            <div>
              <label className={labelCls}>Delivery radius: <b>{radius} km</b></label>
              <input type="range" min={1} max={50} value={radius} onChange={e => setRadius(Number(e.target.value))} className="w-full accent-[#FB7701]" />
              <div className="flex justify-between text-[10px] text-gray-400"><span>1 km</span><span>50 km</span></div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Payout method *</label>
              <div className="grid grid-cols-2 gap-2">
                {(['upi', 'bank'] as const).map(k => (
                  <button key={k} type="button" onClick={() => setPayoutKind(k)}
                    className={`py-2.5 rounded-xl text-sm font-bold border-2 transition ${payoutKind === k ? 'border-[#FB7701] bg-orange-50 text-gray-900' : 'border-gray-200 bg-white text-gray-500'}`}>
                    {k === 'upi' ? 'UPI ID' : 'Bank account'}
                  </button>
                ))}
              </div>
            </div>
            {payoutKind === 'upi' ? (
              <div>
                <label className={labelCls}>UPI ID *</label>
                <input className={fieldCls} value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="name@upi" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Account number *</label>
                  <input className={fieldCls} inputMode="numeric" value={acctNo} onChange={e => setAcctNo(e.target.value.replace(/\D/g, '').slice(0, 18))} placeholder="Account number" />
                  {acctNo.length >= 8 && <p className="text-[11px] text-gray-500 mt-1">Stored masked: <b>{maskBank(acctNo)}</b></p>}
                </div>
                <div>
                  <label className={labelCls}>IFSC *</label>
                  <input className={fieldCls} value={ifsc} onChange={e => setIfsc(e.target.value.toUpperCase())} placeholder="HDFC0001234" />
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Emergency contact name *</label>
                <input className={fieldCls} value={emName} onChange={e => setEmName(e.target.value)} placeholder="Name" />
              </div>
              <div>
                <label className={labelCls}>Emergency contact phone *</label>
                <input className={fieldCls} inputMode="numeric" value={emPhone} onChange={e => setEmPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10 digits" />
              </div>
            </div>
            <label className="flex gap-2 items-start text-xs text-gray-700 cursor-pointer p-3 rounded-xl bg-gray-50 border border-gray-200">
              <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#FB7701]" />
              <span>I accept the <b>Delivery Partner Terms</b> (demo agreement — lawyer review pending). *</span>
            </label>
          </div>
        )}

        {error && <p className="text-xs text-red-600 font-bold mt-4">{error}</p>}

        <div className="flex gap-3 mt-5">
          {step > 0 && (
            <button onClick={back} className="flex items-center gap-1 px-5 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700">
              <ArrowLeft size={16} /> Back
            </button>
          )}
          {step < 4 ? (
            <button onClick={next} className={`${primaryBtnCls} flex-1 flex items-center justify-center gap-1`} style={{ background: BRAND }}>
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={submit} disabled={submitting} className={`${primaryBtnCls} flex-1`} style={{ background: BRAND }}>
              {submitting ? 'Submitting…' : 'Submit application'}
            </button>
          )}
        </div>
      </motion.div>

      <p className="text-center text-[11px] text-gray-400 mt-4">
        Your data is stored securely. Raw ID numbers are never saved — only masked values.
      </p>
    </div>
  );
}
