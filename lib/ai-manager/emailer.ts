// AI Marketplace Manager — email provider switch (Update 24).
// Providers: 'resend' (needs EMAIL_API_KEY) | 'demo' (default — logs only).
// Demo mode NEVER sends real email: rows are stored with status 'demo_logged'
// and shown in the admin email log. Honest by design.
export type EmailProvider = 'resend' | 'demo';

export function emailProvider(): EmailProvider {
  const p = (process.env.EMAIL_PROVIDER || 'demo').toLowerCase();
  if (p === 'resend' && process.env.EMAIL_API_KEY) return 'resend';
  return 'demo';
}

export type EmailResult =
  | { ok: true; status: 'sent'; providerMsgId: string }
  | { ok: true; status: 'demo_logged' }
  | { ok: false; status: 'error'; error: string };

export async function sendSellerEmail(input: {
  to: string | null;
  subject: string;
  body: string;
}): Promise<EmailResult> {
  const provider = emailProvider();
  const fromName = process.env.EMAIL_FROM_NAME || 'SastaBazaar AI Manager';
  const fromAddr = process.env.EMAIL_FROM_ADDR || 'ai-manager@sastabazaar.in';

  if (provider === 'demo') {
    return { ok: true, status: 'demo_logged' };
  }

  // --- resend ---
  if (!input.to) {
    return { ok: false, status: 'error', error: 'No recipient email on file for this seller (demo-safe stop).' };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${fromName} <${fromAddr}>`,
        to: [input.to],
        subject: input.subject,
        text: input.body,
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, status: 'error', error: `Resend HTTP ${res.status}: ${String(j?.message ?? 'unknown')}` };
    }
    return { ok: true, status: 'sent', providerMsgId: String(j?.id ?? '') };
  } catch (e) {
    return { ok: false, status: 'error', error: e instanceof Error ? e.message : 'Email send failed' };
  }
}
