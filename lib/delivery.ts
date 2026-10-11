// SastaBazaar Bikers & Home Delivery — client helpers (Update 21).
// All data access goes through Supabase with RLS; sensitive writes use
// SECURITY DEFINER RPCs (see supabase/migrations/004_bikers_delivery.sql).
// Honest demo notes: OTP codes are shown on screen (no SMS provider yet),
// KYC stays "pending verification" (no verification provider), payouts are
// a demo ledger until a payout provider is configured.
import { getSupabase } from './supabase';

export type BikerStatus =
  | 'draft' | 'pending_verification' | 'approved'
  | 'rejected' | 'suspended' | 'deactivated';

export type JobStatus =
  | 'created' | 'offered' | 'assigned' | 'picked_up'
  | 'in_transit' | 'delivered' | 'cancelled' | 'disputed';

export type DocType =
  | 'profile_photo' | 'driving_licence' | 'vehicle_rc'
  | 'insurance' | 'puc' | 'aadhaar' | 'pan';

export type BikerProfile = {
  id: string;
  profile_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  dob: string | null;
  photo_url: string | null;
  status: BikerStatus;
  service_state: string | null;
  service_city: string | null;
  service_district: string | null;
  service_pins: string[];
  delivery_radius_km: number;
  online: boolean;
  emergency_name: string | null;
  emergency_phone: string | null;
  payout_note: string | null;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
  rejection_reason: string | null;
  created_at: string;
};

export type BikerPublic = {
  id: string; full_name: string; photo_url: string | null;
  service_city: string | null; online: boolean;
};

export type DeliveryJob = {
  id: string;
  order_id: string | null;
  shop_id: string | null;
  customer_profile_id: string;
  biker_profile_id: string | null;
  pickup_label: string | null;
  pickup_address: string | null;
  delivery_address_id: string | null;
  status: JobStatus;
  delivery_fee: number;
  distance_km: number | null;
  eta_minutes: number | null;
  created_at: string;
};

export type JobOffer = {
  id: string;
  job_id: string;
  biker_profile_id: string;
  status: 'offered' | 'accepted' | 'rejected' | 'expired';
  offered_at: string;
  expires_at: string;
  job?: DeliveryJob;
};

export type DeliveryEvent = {
  id: string; job_id: string; event_type: string;
  actor_profile_id: string | null; meta: Record<string, unknown> | null;
  created_at: string;
};

export type DeliveryMessage = {
  id: string; job_id: string; sender_profile_id: string;
  body: string; created_at: string;
};

export type BikerEarning = {
  id: string; biker_profile_id: string; job_id: string | null;
  amount: number; kind: string; payout_status: 'pending' | 'paid';
  payout_ref: string | null; created_at: string;
};

export type DeliveryDispute = {
  id: string; job_id: string; raised_by: string; reason: string;
  status: 'open' | 'in_review' | 'resolved' | 'rejected';
  resolution: string | null; created_at: string;
};

export type ServiceZone = {
  id: string; country: string; state: string; city: string;
  district: string | null; pin: string | null;
  zone_name: string | null; active: boolean;
};

export type BikerDoc = {
  id: string; biker_id: string; doc_type: DocType;
  file_path: string; masked_value: string | null;
  status: 'pending' | 'verified' | 'rejected';
  reviewer_note: string | null; created_at: string;
};

export type AppNotification = {
  id: string; title: string; body: string | null; kind: string;
  read_at: string | null; created_at: string;
};

// ---------------------------------------------------------------------------
// Masking — raw ID numbers are NEVER stored; only masked display values.
// ---------------------------------------------------------------------------
export function maskAadhaar(v: string): string {
  const d = v.replace(/\D/g, '');
  return d.length >= 4 ? `XXXX-XXXX-${d.slice(-4)}` : 'XXXX-XXXX-XXXX';
}
export function maskPan(v: string): string {
  const c = v.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return c.length >= 5 ? `${c.slice(0, 5)}XXXX${c.slice(-1)}` : 'XXXXX0000X';
}
export function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '');
  return d.length >= 4 ? `XXXXXX${d.slice(-4)}` : 'XXXXXXXXXX';
}
export function maskBank(v: string): string {
  const d = v.replace(/\D/g, '');
  return d.length >= 4 ? `XXXXXX${d.slice(-4)}` : 'XXXXXXXXXX';
}
export function maskUpiId(v: string): string {
  const c = v.trim();
  return c.length > 4 ? `${c.slice(0, 2)}${'•'.repeat(Math.min(c.length - 4, 12))}${c.slice(-2)}` : '••••';
}

// ---------------------------------------------------------------------------
// Biker profile
// ---------------------------------------------------------------------------
export async function getMyBiker(): Promise<BikerProfile | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from('biker_profiles')
    .select('*').eq('profile_id', user.id).maybeSingle();
  return (data as BikerProfile | null) ?? null;
}

export async function saveBikerProfile(
  patch: Partial<BikerProfile> & { full_name: string; phone: string }
): Promise<BikerProfile> {
  const sb = getSupabase();
  if (!sb) throw new Error('Backend not configured.');
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Please login first.');
  const { data, error } = await sb.from('biker_profiles')
    .upsert({ ...patch, profile_id: user.id }, { onConflict: 'profile_id' })
    .select().single();
  if (error) throw new Error(error.message);
  return data as BikerProfile;
}

export async function setBikerOnline(online: boolean): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error('Backend not configured.');
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Please login first.');
  const { error } = await sb.from('biker_profiles')
    .update({ online }).eq('profile_id', user.id);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Storage uploads — KYC docs go to the PRIVATE 'biker-docs' bucket,
// namespaced by uid (see migration 004). Profile photos use the public
// 'shop-photos' bucket (existing).
// ---------------------------------------------------------------------------
export async function uploadBikerFile(
  file: File, kind: 'doc' | 'photo'
): Promise<string> {
  const sb = getSupabase();
  if (!sb) throw new Error('Backend not configured.');
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Please login first.');
  const bucket = kind === 'doc' ? 'biker-docs' : 'shop-photos';
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${user.id}/${kind}-${Date.now()}.${ext}`;
  const { error } = await sb.storage.from(bucket).upload(path, file, {
    contentType: file.type || 'image/jpeg',
  });
  if (error) throw new Error(error.message);
  return path;
}

/** Signed URL for a private doc (owner/admin only, 1-hour expiry). */
export async function getPrivateDocUrl(path: string): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.storage.from('biker-docs')
    .createSignedUrl(path, 3600);
  return error ? null : data.signedUrl;
}

export function getPublicPhotoUrl(path: string): string | null {
  const sb = getSupabase();
  if (!sb || !path) return null;
  if (path.startsWith('http')) return path;
  return sb.storage.from('shop-photos').getPublicUrl(path).data.publicUrl;
}

export async function addBikerDocument(
  bikerId: string, docType: DocType, filePath: string, maskedValue?: string
): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error('Backend not configured.');
  const { error } = await sb.from('biker_documents').upsert(
    { biker_id: bikerId, doc_type: docType, file_path: filePath, masked_value: maskedValue ?? null },
    { onConflict: 'biker_id,doc_type' }
  );
  if (error) throw new Error(error.message);
}

export async function saveVehicle(
  bikerId: string, vehicleType: string, regNo: string, makeModel: string
): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error('Backend not configured.');
  const { error } = await sb.from('vehicles').upsert(
    { biker_id: bikerId, vehicle_type: vehicleType, registration_number: regNo, make_model: makeModel },
    { onConflict: 'biker_id' }
  );
  if (error) throw new Error(error.message);
}

export async function myDocuments(bikerId: string): Promise<BikerDoc[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb.from('biker_documents')
    .select('*').eq('biker_id', bikerId).order('created_at');
  return (data as BikerDoc[]) ?? [];
}

// ---------------------------------------------------------------------------
// Jobs & offers (writes go through atomic RPCs)
// ---------------------------------------------------------------------------
export async function myOffers(): Promise<JobOffer[]> {
  const sb = getSupabase();
  if (!sb) return [];
  try { await sb.rpc('expire_stale_offers'); } catch { /* non-fatal */ }
  const { data } = await sb.from('job_offers')
    .select('*, job:delivery_jobs(*)')
    .eq('status', 'offered')
    .order('offered_at', { ascending: false });
  return (data as JobOffer[]) ?? [];
}

export async function claimJob(jobId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error('Backend not configured.');
  const { error } = await sb.rpc('claim_delivery_job', { p_job_id: jobId });
  if (error) throw new Error(error.message);
}

export async function rejectOffer(offerId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error('Backend not configured.');
  const { error } = await sb.rpc('reject_job_offer', { p_offer_id: offerId });
  if (error) throw new Error(error.message);
}

export async function myJobs(): Promise<DeliveryJob[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const biker = await getMyBiker();
  if (!biker) return [];
  const { data } = await sb.from('delivery_jobs')
    .select('*').eq('biker_profile_id', biker.id)
    .order('created_at', { ascending: false }).limit(50);
  return (data as DeliveryJob[]) ?? [];
}

export async function customerJobs(): Promise<DeliveryJob[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return [];
  const { data } = await sb.from('delivery_jobs')
    .select('*').eq('customer_profile_id', user.id)
    .order('created_at', { ascending: false }).limit(20);
  return (data as DeliveryJob[]) ?? [];
}

export type JobDetail = {
  job: DeliveryJob;
  biker: BikerPublic | null;
  events: DeliveryEvent[];
  customerName: string | null;
};

export async function getJobDetail(jobId: string): Promise<JobDetail | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data: job } = await sb.from('delivery_jobs')
    .select('*').eq('id', jobId).maybeSingle();
  if (!job) return null;
  const j = job as DeliveryJob;
  let biker: BikerPublic | null = null;
  if (j.biker_profile_id) {
    const { data } = await sb.rpc('biker_public_profile', {
      p_biker_id: j.biker_profile_id,
    });
    const row = (data as BikerPublic[] | null)?.[0] ?? null;
    biker = row;
  }
  const { data: events } = await sb.from('delivery_events')
    .select('*').eq('job_id', jobId).order('created_at');
  const { data: prof } = await sb.from('profiles')
    .select('name').eq('id', j.customer_profile_id).maybeSingle();
  return {
    job: j, biker,
    events: (events as DeliveryEvent[]) ?? [],
    customerName: (prof as { name: string | null } | null)?.name ?? null,
  };
}

export async function markInTransit(jobId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error('Backend not configured.');
  const { error } = await sb.rpc('mark_in_transit', { p_job_id: jobId });
  if (error) throw new Error(error.message);
}

export async function createJobFromOrder(orderId: string): Promise<string> {
  const sb = getSupabase();
  if (!sb) throw new Error('Backend not configured.');
  const { data, error } = await sb.rpc('create_delivery_job_from_order', {
    p_order_id: orderId,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

// ---------------------------------------------------------------------------
// OTP — DEMO: codes are returned and shown on screen because no SMS
// provider is configured. Never treat as production-secure.
// ---------------------------------------------------------------------------
export async function requestJobOtp(
  jobId: string, purpose: 'pickup' | 'delivery' | 'phone_verify'
): Promise<string> {
  const sb = getSupabase();
  if (!sb) throw new Error('Backend not configured.');
  const { data, error } = await sb.rpc('request_delivery_otp', {
    p_job_id: jobId, p_purpose: purpose,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function verifyJobOtp(
  jobId: string, purpose: 'pickup' | 'delivery' | 'phone_verify', code: string
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) throw new Error('Backend not configured.');
  const { error } = await sb.rpc('verify_delivery_otp', {
    p_job_id: jobId, p_purpose: purpose, p_code: code.trim(),
  });
  if (error) throw new Error(error.message);
  return true;
}

// ---------------------------------------------------------------------------
// Chat, notifications, earnings, disputes, zones
// ---------------------------------------------------------------------------
export async function listJobMessages(jobId: string): Promise<DeliveryMessage[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb.from('delivery_messages')
    .select('*').eq('job_id', jobId).order('created_at').limit(100);
  return (data as DeliveryMessage[]) ?? [];
}

export async function sendJobMessage(jobId: string, body: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error('Backend not configured.');
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Please login first.');
  const { error } = await sb.from('delivery_messages').insert({
    job_id: jobId, sender_profile_id: user.id, body: body.trim().slice(0, 1000),
  });
  if (error) throw new Error(error.message);
}

export async function myNotifications(): Promise<AppNotification[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return [];
  const { data } = await sb.from('notifications')
    .select('*').eq('profile_id', user.id)
    .order('created_at', { ascending: false }).limit(15);
  return (data as AppNotification[]) ?? [];
}

export async function myEarnings(): Promise<BikerEarning[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const biker = await getMyBiker();
  if (!biker) return [];
  const { data } = await sb.from('biker_earnings')
    .select('*').eq('biker_profile_id', biker.id)
    .order('created_at', { ascending: false }).limit(100);
  return (data as BikerEarning[]) ?? [];
}

export async function raiseDispute(jobId: string, reason: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error('Backend not configured.');
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Please login first.');
  const { error } = await sb.from('delivery_disputes').insert({
    job_id: jobId, raised_by: user.id, reason: reason.trim().slice(0, 2000),
  });
  if (error) throw new Error(error.message);
}

export async function listServiceZones(): Promise<ServiceZone[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb.from('service_zones')
    .select('*').eq('active', true).order('state').order('city').limit(200);
  return (data as ServiceZone[]) ?? [];
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
export async function adminBikers(): Promise<BikerProfile[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb.from('biker_profiles')
    .select('*').order('created_at', { ascending: false }).limit(200);
  return (data as BikerProfile[]) ?? [];
}

export async function adminSetBikerStatus(
  bikerId: string, status: BikerStatus, reason?: string
): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error('Backend not configured.');
  const { error } = await sb.from('biker_profiles')
    .update({ status, rejection_reason: reason ?? null })
    .eq('id', bikerId);
  if (error) throw new Error(error.message);
}

export async function adminDisputes(): Promise<DeliveryDispute[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb.from('delivery_disputes')
    .select('*').order('created_at', { ascending: false }).limit(100);
  return (data as DeliveryDispute[]) ?? [];
}

export async function adminResolveDispute(
  disputeId: string, status: 'resolved' | 'rejected', resolution: string
): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error('Backend not configured.');
  const { error } = await sb.from('delivery_disputes')
    .update({ status, resolution }).eq('id', disputeId);
  if (error) throw new Error(error.message);
}

export async function adminMarkPayoutPaid(earningId: string, ref: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error('Backend not configured.');
  const { error } = await sb.from('biker_earnings')
    .update({ payout_status: 'paid', payout_ref: ref }).eq('id', earningId);
  if (error) throw new Error(error.message);
}
