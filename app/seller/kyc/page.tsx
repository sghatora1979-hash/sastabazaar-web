'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CreditCard, Camera, CheckCircle2, Upload, ShieldCheck } from 'lucide-react';
import { getSessionSeller, saveKyc, ensureSeed } from '@/lib/seller';

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function UploadBox({ label, hint, value, onPick }: {
  label: string; hint: string; value: string; onPick: (dataUrl: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <div className="text-sm font-semibold text-gray-700 mb-1">{label}</div>
      <button
        onClick={() => ref.current?.click()}
        className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-4 flex items-center gap-4 hover:border-[var(--primary)]/50 transition text-left bg-gray-50"
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label} className="w-20 h-20 object-cover rounded-xl" />
        ) : (
          <span className="w-20 h-20 rounded-xl bg-gray-200 flex items-center justify-center text-gray-400">
            <Upload size={24} />
          </span>
        )}
        <div>
          <div className="font-semibold text-sm text-gray-800">{value ? 'Photo added ✓' : 'Tap to upload photo'}</div>
          <div className="text-xs text-gray-500 mt-0.5">{hint}</div>
        </div>
      </button>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={async e => {
          const f = e.target.files?.[0];
          if (f) onPick(await fileToDataUrl(f));
        }} />
    </div>
  );
}

export default function SellerKyc() {
  const router = useRouter();
  const [sellerId, setSellerId] = useState('');
  const [fullName, setFullName] = useState('');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [selfie, setSelfie] = useState('');
  const [saidNamaskar, setSaidNamaskar] = useState(false);
  const [spokeName, setSpokeName] = useState(false);
  const [smiled, setSmiled] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    ensureSeed();
    const s = getSessionSeller();
    if (!s) { router.replace('/seller'); return; }
    setSellerId(s.id);
    setFullName(s.name);
  }, [router]);

  const submit = () => {
    setError('');
    if (!front || !back) { setError('Please upload both sides of your Aadhaar card.'); return; }
    if (!selfie) { setError('Please upload your selfie.'); return; }
    if (!saidNamaskar || !spokeName || !smiled) {
      setError('Please complete the Namaskar greeting checklist below.');
      return;
    }
    if (fullName.trim().length < 2) { setError('Please confirm your full name.'); return; }
    saveKyc({
      sellerId,
      fullName: fullName.trim(),
      aadhaarFront: front,
      aadhaarBack: back,
      selfie,
      saidNamaskar,
      spokeName,
      smiled,
      status: 'verified', // DEMO: auto-verified. Production: set 'pending', team reviews within 24h.
      submittedAt: new Date().toISOString(),
    });
    setDone(true);
  };

  if (done) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <CheckCircle2 size={72} className="mx-auto text-green-500" />
          <h1 className="text-3xl font-extrabold text-gray-900 mt-4">KYC Verified! 🎉</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Demo mode: auto-approved. In production our team reviews your documents within 24 hours.
          </p>
          <button onClick={() => router.replace('/seller/agreement')}
            className="btn-primary mt-6 font-bold px-8 py-3.5 rounded-2xl">
            Sign Seller Agreement
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
            <ShieldCheck size={22} />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Seller KYC</h1>
            <p className="text-sm text-gray-500">One-time verification — keeps buyers safe.</p>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
              <CreditCard size={16} /> Aadhaar Card
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <UploadBox label="Front side" hint="Clear photo of the front" value={front} onPick={setFront} />
              <UploadBox label="Back side" hint="Clear photo of the back" value={back} onPick={setBack} />
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
              <Camera size={16} /> Selfie Verification
            </div>
            <UploadBox label="Your selfie" hint="Hold phone at arm's length, face clearly visible" value={selfie} onPick={setSelfie} />
            <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
              <div className="font-bold text-sm text-indigo-900">🙏 Namaskar greeting (required)</div>
              <p className="text-xs text-indigo-700 mt-1">
                While taking your selfie, please: say <b>“Namaskar”</b>, speak your <b>full name</b> clearly,
                and <b>smile</b>. Tick each step to confirm:
              </p>
              <div className="mt-2 space-y-2 text-sm">
                {[
                  { v: saidNamaskar, s: setSaidNamaskar, t: 'I said “Namaskar”' },
                  { v: spokeName, s: setSpokeName, t: 'I spoke my full name' },
                  { v: smiled, s: setSmiled, t: 'I smiled 😊' },
                ].map(({ v, s, t }) => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer text-indigo-900">
                    <input type="checkbox" checked={v} onChange={e => s(e.target.checked)}
                      className="w-4 h-4 accent-[var(--primary)]" />
                    {t}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Confirm your full name (as on Aadhaar)</span>
            <input value={fullName} onChange={e => setFullName(e.target.value)}
              className="mt-1 w-full px-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button onClick={submit} className="btn-primary w-full font-bold py-3.5 rounded-2xl">
            Submit KYC
          </button>
          <p className="text-xs text-gray-400 text-center">
            Demo: documents stay in this browser only. Real launch needs secure private storage —
            never store Aadhaar/selfies in a public place.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
