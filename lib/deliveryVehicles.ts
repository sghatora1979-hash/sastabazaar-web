'use client';
/**
 * Delivery vehicle + driver registration (local record).
 * Demo storage in localStorage — same pattern as FeedbackForm / contact tickets.
 * Honest labelling: registration only. No real background check, no real
 * jobs, no real payments. Verification is manual at launch.
 * Privacy: raw ID / licence numbers are NEVER saved — only masked values
 * (last 4 characters), following the site's existing masking convention.
 */

export type DeliveryVehicleType = 'big_truck' | 'small_truck' | 'tempo';

export const VEHICLE_TYPE_LABELS: Record<DeliveryVehicleType, string> = {
  big_truck: 'Big Truck',
  small_truck: 'Small Truck',
  tempo: 'Tempo (small)',
};

export type DeliveryVehicle = {
  id: string;
  ownerName: string;
  phone: string;
  city: string;
  vehicleType: DeliveryVehicleType;
  vehicleNumber: string;
  /** RC (registration certificate) number — REQUIRED. */
  rcNumber: string;
  /** Insurance provider name — REQUIRED. */
  insuranceProvider: string;
  /** Insurance expiry date (YYYY-MM-DD) — REQUIRED. */
  insuranceExpiry: string;
  /** Permit type, e.g. National / State / Goods carriage — REQUIRED. */
  permitType: string;
  /** Permit number — REQUIRED. */
  permitNumber: string;
  status: 'pending_verification';
  at: string;
};

export type DeliveryDriver = {
  id: string;
  name: string;
  phone: string;
  vehicleType: DeliveryVehicleType;
  idProofType: string;
  /** Masked only — raw ID number never saved. */
  idProofMasked: string;
  /** Masked only — raw licence number never saved. */
  licenceMasked: string;
  status: 'pending_verification';
  at: string;
};

const VEHICLES_KEY = 'sb_delivery_vehicles_v1';
const DRIVERS_KEY = 'sb_delivery_drivers_v1';

function readList<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(raw) ? (raw as T[]) : [];
  } catch {
    return [];
  }
}

export function getDeliveryVehicles(): DeliveryVehicle[] {
  return readList<DeliveryVehicle>(VEHICLES_KEY);
}

export function getDeliveryDrivers(): DeliveryDriver[] {
  return readList<DeliveryDriver>(DRIVERS_KEY);
}

export function saveDeliveryVehicle(v: Omit<DeliveryVehicle, 'id' | 'status' | 'at'>): DeliveryVehicle {
  const entry: DeliveryVehicle = {
    ...v,
    id: `veh-${Date.now()}`,
    status: 'pending_verification',
    at: new Date().toISOString(),
  };
  localStorage.setItem(VEHICLES_KEY, JSON.stringify([entry, ...getDeliveryVehicles()]));
  return entry;
}

export function saveDeliveryDriver(d: Omit<DeliveryDriver, 'id' | 'status' | 'at'>): DeliveryDriver {
  const entry: DeliveryDriver = {
    ...d,
    id: `drv-${Date.now()}`,
    status: 'pending_verification',
    at: new Date().toISOString(),
  };
  localStorage.setItem(DRIVERS_KEY, JSON.stringify([entry, ...getDeliveryDrivers()]));
  return entry;
}

/** Keep only the last 4 characters visible, e.g. XXXX-XXXX-1234. */
export function maskIdNumber(v: string): string {
  const clean = v.replace(/\s/g, '');
  if (clean.length <= 4) return `XXXX-${clean}`;
  return `XXXX-XXXX-${clean.slice(-4)}`;
}

/** Mask a phone number, e.g. 98765XXXXX. */
export function maskPhone(v: string): string {
  const digits = v.replace(/\D/g, '');
  if (digits.length !== 10) return v;
  return `${digits.slice(0, 5)}XXXXX`;
}
