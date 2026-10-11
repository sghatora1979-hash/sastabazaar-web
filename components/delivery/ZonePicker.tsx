'use client';
import { useEffect, useState } from 'react';
import { STATES } from '@/lib/festivals';
import { listServiceZones, type ServiceZone } from '@/lib/delivery';
import { fieldCls, labelCls } from './DeliveryBadges';

export type ZoneValue = {
  state: string; city: string; district: string; pins: string[];
};

/** State → city/district/PIN picker backed by service_zones + free entry. */
export function ZonePicker({
  value, onChange,
}: {
  value: ZoneValue;
  onChange: (v: ZoneValue) => void;
}) {
  const [zones, setZones] = useState<ServiceZone[]>([]);
  const [pinInput, setPinInput] = useState('');

  useEffect(() => {
    listServiceZones().then(setZones).catch(() => {});
  }, []);

  const cities = [...new Set(zones.filter(z => !value.state || z.state === value.state).map(z => z.city))];
  const districts = [...new Set(zones.filter(z => (!value.state || z.state === value.state) && (!value.city || z.city === value.city) && z.district).map(z => z.district as string))];

  const addPin = () => {
    const p = pinInput.replace(/\D/g, '').slice(0, 6);
    if (p.length === 6 && !value.pins.includes(p)) {
      onChange({ ...value, pins: [...value.pins, p] });
    }
    setPinInput('');
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>State *</label>
          <select
            className={fieldCls}
            value={value.state}
            onChange={e => onChange({ ...value, state: e.target.value, city: '', district: '' })}
          >
            <option value="">Select state…</option>
            {STATES.map(s => <option key={s.code} value={s.name}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>City *</label>
          <input
            className={fieldCls}
            list="delivery-cities"
            placeholder="e.g. Bengaluru"
            value={value.city}
            onChange={e => onChange({ ...value, city: e.target.value })}
          />
          <datalist id="delivery-cities">
            {cities.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div>
          <label className={labelCls}>District</label>
          <input
            className={fieldCls}
            list="delivery-districts"
            placeholder="e.g. Bengaluru Urban"
            value={value.district}
            onChange={e => onChange({ ...value, district: e.target.value })}
          />
          <datalist id="delivery-districts">
            {districts.map(d => <option key={d} value={d} />)}
          </datalist>
        </div>
        <div>
          <label className={labelCls}>Service PIN codes *</label>
          <div className="flex gap-2">
            <input
              className={fieldCls}
              inputMode="numeric"
              placeholder="6-digit PIN"
              value={pinInput}
              onChange={e => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPin())}
            />
            <button
              type="button"
              onClick={addPin}
              className="px-4 rounded-xl text-white font-bold text-sm shrink-0 hover:brightness-110"
              style={{ background: '#FB7701' }}
            >
              Add
            </button>
          </div>
        </div>
      </div>
      {value.pins.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.pins.map(p => (
            <span key={p} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-xs font-bold text-gray-800">
              📍 {p}
              <button
                type="button"
                aria-label={`Remove ${p}`}
                onClick={() => onChange({ ...value, pins: value.pins.filter(x => x !== p) })}
                className="text-gray-400 hover:text-red-600 font-black"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
