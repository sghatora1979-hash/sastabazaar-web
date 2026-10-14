'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Truck, UserPlus, ListChecks, Info, ChevronLeft } from 'lucide-react';
import {
  PageHero, DemoBadge, cardCls, fieldCls, labelCls, primaryBtnCls,
} from '@/components/delivery/DeliveryBadges';
import { BRAND } from '@/components/store/ProductCard';
import {
  VEHICLE_TYPE_LABELS, getDeliveryVehicles, getDeliveryDrivers,
  saveDeliveryVehicle, saveDeliveryDriver, maskIdNumber, maskPhone,
  type DeliveryVehicle, type DeliveryDriver, type DeliveryVehicleType,
} from '@/lib/deliveryVehicles';

const VEHICLE_TYPES = (Object.keys(VEHICLE_TYPE_LABELS) as DeliveryVehicleType[]);
const ID_PROOF_TYPES = ['Aadhaar', 'PAN', 'Voter ID', 'Passport'];

type Tab = 'vehicle' | 'driver' | 'list';

const digits = (v: string) => v.replace(/\D/g, '');

export default function DeliveryVehiclesPage() {
  const [tab, setTab] = useState<Tab>('vehicle');
  const [vehicles, setVehicles] = useState<DeliveryVehicle[]>([]);
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  // Vehicle form
  const [ownerName, setOwnerName] = useState('');
  const [vPhone, setVPhone] = useState('');
  const [vCity, setVCity] = useState('');
  const [vType, setVType] = useState<DeliveryVehicleType | ''>('');
  const [vNumber, setVNumber] = useState('');
  // Vehicle legal documents — ALL REQUIRED (RC + Insurance + Permit)
  const [rcNumber, setRcNumber] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [permitType, setPermitType] = useState('');
  const [permitNumber, setPermitNumber] = useState('');

  // Driver form — ID + licence ONLY (user's rule)
  const [dName, setDName] = useState('');
  const [dPhone, setDPhone] = useState('');
  const [dType, setDType] = useState<DeliveryVehicleType | ''>('');
  const [idType, setIdType] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [licence, setLicence] = useState('');

  useEffect(() => {
    setVehicles(getDeliveryVehicles());
    setDrivers(getDeliveryDrivers());
  }, []);

  const submitVehicle = () => {
    if (!ownerName.trim()) return setError('Owner name is required.');
    if (digits(vPhone).length !== 10) return setError('Phone must be exactly 10 digits.');
    if (!vCity.trim()) return setError('City / area is required.');
    if (!vType) return setError('Please choose a vehicle type.');
    if (!vNumber.trim()) return setError('Vehicle number is required.');
    if (!rcNumber.trim()) return setError('RC number is required.');
    if (!insuranceProvider.trim()) return setError('Insurance provider is required.');
    if (!insuranceExpiry) return setError('Insurance expiry date is required.');
    if (!permitType) return setError('Please choose a permit type.');
    if (!permitNumber.trim()) return setError('Permit number is required.');
    setError('');
    saveDeliveryVehicle({
      ownerName: ownerName.trim(),
      phone: digits(vPhone),
      city: vCity.trim(),
      vehicleType: vType,
      vehicleNumber: vNumber.trim().toUpperCase(),
      rcNumber: rcNumber.trim().toUpperCase(),
      insuranceProvider: insuranceProvider.trim(),
      insuranceExpiry,
      permitType,
      permitNumber: permitNumber.trim().toUpperCase(),
    });
    setVehicles(getDeliveryVehicles());
    setOwnerName(''); setVPhone(''); setVCity(''); setVType(''); setVNumber('');
    setRcNumber(''); setInsuranceProvider(''); setInsuranceExpiry(''); setPermitType(''); setPermitNumber('');
    setDone('Vehicle registered — pending verification.');
    setTab('list');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitDriver = () => {
    if (!dName.trim()) return setError('Driver name is required.');
    if (digits(dPhone).length !== 10) return setError('Phone must be exactly 10 digits.');
    if (!dType) return setError('Please choose the vehicle type you drive.');
    if (!idType) return setError('Please choose an ID proof type.');
    if (idNumber.trim().length < 4) return setError('ID proof number is required.');
    if (licence.trim().length < 4) return setError('Driving licence number is required.');
    setError('');
    saveDeliveryDriver({
      name: dName.trim(),
      phone: digits(dPhone),
      vehicleType: dType,
      idProofType: idType,
      idProofMasked: maskIdNumber(idNumber.trim()),
      licenceMasked: maskIdNumber(licence.trim()),
    });
    setDrivers(getDeliveryDrivers());
    setDName(''); setDPhone(''); setDType(''); setIdType(''); setIdNumber(''); setLicence('');
    setDone('Driver registered — pending verification.');
    setTab('list');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tabs: { key: Tab; label: string; icon: typeof Truck }[] = [
    { key: 'vehicle', label: 'Register Vehicle', icon: Truck },
    { key: 'driver', label: 'Register Driver', icon: UserPlus },
    { key: 'list', label: `Registered (${vehicles.length + drivers.length})`, icon: ListChecks },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 pb-24">
      <PageHero
        emoji="🚚"
        title="Trucks, Tempos & Drivers"
        sub="Register your vehicle or yourself as a driver. Big Truck, Small Truck or Tempo — all welcome."
      />

      <Link href="/delivery" className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-800 mb-4">
        <ChevronLeft size={14} /> Back to Delivery
      </Link>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setError(''); setDone(''); }}
            className={`flex-1 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 ${
              tab === t.key ? 'text-white' : 'bg-white border border-gray-200 text-gray-600'
            }`}
            style={tab === t.key ? { background: BRAND } : undefined}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {done && (
        <p className="flex items-center gap-2 text-sm font-bold text-green-700 bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
          <CheckCircle2 size={17} /> {done}
        </p>
      )}
      {error && <p className="text-xs text-red-600 font-bold bg-red-50 border border-red-200 rounded-xl p-3 mb-4">{error}</p>}

      {tab === 'vehicle' && (
        <div className={cardCls}>
          <h2 className="text-base font-extrabold text-gray-900 mb-1">Register a vehicle</h2>
          <p className="text-xs text-gray-500 mb-4">Owner details + vehicle. Stored in this browser as a local record.</p>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Owner name *</label>
              <input className={fieldCls} value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Phone (10 digits) *</label>
                <input className={fieldCls} inputMode="numeric" value={vPhone} onChange={e => setVPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="98765 43210" />
              </div>
              <div>
                <label className={labelCls}>City / area *</label>
                <input className={fieldCls} value={vCity} onChange={e => setVCity(e.target.value)} placeholder="e.g. Bangalore, Whitefield" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Vehicle type *</label>
              <div className="grid grid-cols-3 gap-2">
                {VEHICLE_TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setVType(t)}
                    className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold border-2 transition ${vType === t ? 'border-[#FB7701] bg-orange-50 text-gray-900' : 'border-gray-200 bg-white text-gray-500'}`}
                  >
                    {VEHICLE_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Vehicle number *</label>
              <input className={fieldCls} value={vNumber} onChange={e => setVNumber(e.target.value.toUpperCase())} placeholder="e.g. KA-05-AB-1234" />
            </div>
            <div>
              <label className={labelCls}>RC number *</label>
              <input className={fieldCls} value={rcNumber} onChange={e => setRcNumber(e.target.value.toUpperCase())} placeholder="Registration certificate number" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Insurance provider *</label>
                <input className={fieldCls} value={insuranceProvider} onChange={e => setInsuranceProvider(e.target.value)} placeholder="e.g. HDFC Ergo, ICICI Lombard" />
              </div>
              <div>
                <label className={labelCls}>Insurance expiry date *</label>
                <input className={fieldCls} type="date" value={insuranceExpiry} onChange={e => setInsuranceExpiry(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Permit type *</label>
                <select className={fieldCls} value={permitType} onChange={e => setPermitType(e.target.value)}>
                  <option value="">Select…</option>
                  <option value="National Permit">National Permit</option>
                  <option value="State Permit">State Permit</option>
                  <option value="Goods Carriage Permit">Goods Carriage Permit</option>
                  <option value="Contract Carriage Permit">Contract Carriage Permit</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Permit number *</label>
                <input className={fieldCls} value={permitNumber} onChange={e => setPermitNumber(e.target.value.toUpperCase())} placeholder="Permit number" />
              </div>
            </div>
            <button onClick={submitVehicle} className={primaryBtnCls} style={{ background: BRAND }}>Register vehicle</button>
          </div>
        </div>
      )}

      {tab === 'driver' && (
        <div className={cardCls}>
          <h2 className="text-base font-extrabold text-gray-900 mb-1">Register as a driver</h2>
          <p className="text-xs text-gray-500 mb-4">
            Only <b>ID proof + driving licence</b> needed — nothing else is mandatory.
          </p>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Driver name *</label>
              <input className={fieldCls} value={dName} onChange={e => setDName(e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <label className={labelCls}>Phone (10 digits) *</label>
              <input className={fieldCls} inputMode="numeric" value={dPhone} onChange={e => setDPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="98765 43210" />
            </div>
            <div>
              <label className={labelCls}>Vehicle type you drive *</label>
              <div className="grid grid-cols-3 gap-2">
                {VEHICLE_TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDType(t)}
                    className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold border-2 transition ${dType === t ? 'border-[#FB7701] bg-orange-50 text-gray-900' : 'border-gray-200 bg-white text-gray-500'}`}
                  >
                    {VEHICLE_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>ID proof type *</label>
                <select className={fieldCls} value={idType} onChange={e => setIdType(e.target.value)}>
                  <option value="">Select…</option>
                  {ID_PROOF_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>ID proof number *</label>
                <input className={fieldCls} value={idNumber} onChange={e => setIdNumber(e.target.value)} placeholder="ID number" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Driving licence number *</label>
              <input className={fieldCls} value={licence} onChange={e => setLicence(e.target.value.toUpperCase())} placeholder="e.g. KA05 20230012345" />
            </div>
            <p className="text-[11px] text-gray-500">
              🔒 Privacy: only masked values (e.g. XXXX-XXXX-1234) are stored — raw ID / licence numbers are never saved.
            </p>
            <button onClick={submitDriver} className={primaryBtnCls} style={{ background: BRAND }}>Register driver</button>
          </div>
        </div>
      )}

      {tab === 'list' && (
        <div className="space-y-5">
          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">Registered vehicles ({vehicles.length})</h2>
            {vehicles.length === 0 ? (
              <p className="text-sm text-gray-500 bg-white rounded-2xl border border-orange-100 p-4">No vehicles registered yet.</p>
            ) : (
              <div className="space-y-3">
                {vehicles.map(v => (
                  <div key={v.id} className={`${cardCls} flex items-start justify-between gap-3`}>
                    <div>
                      <p className="font-extrabold text-sm text-gray-900">{v.vehicleNumber} — {VEHICLE_TYPE_LABELS[v.vehicleType]}</p>
                      <p className="text-xs text-gray-600 mt-0.5">Owner: {v.ownerName} · {v.city} · 📞 {maskPhone(v.phone)}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        RC: {v.rcNumber ?? '—'} · Insurance: {v.insuranceProvider ?? '—'} (expires {v.insuranceExpiry ?? '—'}) · Permit: {v.permitType ?? '—'} — {v.permitNumber ?? '—'}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Registered {new Date(v.at).toLocaleDateString('en-IN')}</p>
                    </div>
                    <span className="shrink-0 inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-amber-100 text-amber-800 border-amber-300">
                      Pending verification
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">Registered drivers ({drivers.length})</h2>
            {drivers.length === 0 ? (
              <p className="text-sm text-gray-500 bg-white rounded-2xl border border-orange-100 p-4">No drivers registered yet.</p>
            ) : (
              <div className="space-y-3">
                {drivers.map(d => (
                  <div key={d.id} className={`${cardCls} flex items-start justify-between gap-3`}>
                    <div>
                      <p className="font-extrabold text-sm text-gray-900">{d.name} — drives {VEHICLE_TYPE_LABELS[d.vehicleType]}</p>
                      <p className="text-xs text-gray-600 mt-0.5">📞 {maskPhone(d.phone)} · {d.idProofType}: {d.idProofMasked} · Licence: {d.licenceMasked}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Registered {new Date(d.at).toLocaleDateString('en-IN')}</p>
                    </div>
                    <span className="shrink-0 inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-amber-100 text-amber-800 border-amber-300">
                      Pending verification
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Honest note */}
      <section className={`${cardCls} mt-6 bg-amber-50/60`}>
        <div className="flex items-start gap-2">
          <Info size={18} className="shrink-0 mt-0.5 text-amber-700" />
          <p className="text-xs text-gray-700 leading-relaxed">
            <DemoBadge /> <span className="font-bold">Registration only:</span> this
            records your details in this browser — it is <b>not</b> a background check,
            job offer, or payment promise. Verification is manual at launch; real
            deliveries need a payout provider.
          </p>
        </div>
      </section>
    </div>
  );
}
