'use client';

/*
 * Seller notifications (DEMO build)
 * ---------------------------------
 * Telegram order alerts. In demo mode (no bot token) alerts are logged
 * locally so you can see exactly what the seller would receive.
 * For REAL alerts the seller creates a free bot via @BotFather on Telegram,
 * pastes the token + their chat ID in the dashboard, and messages go out
 * instantly via api.telegram.org.
 */

export type TgSettings = {
  botToken: string;
  chatId: string;
  enabled: boolean;
};

export type AlertLogEntry = {
  sellerId: string;
  at: string;
  kind: 'order' | 'test';
  preview: string;
  status: 'demo-logged' | 'sent' | 'failed';
};

const SETTINGS_KEY = 'sb-tg-settings';
const LOG_KEY = 'sb-alert-log';

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getTgSettings(sellerId: string): TgSettings {
  const all = read<Record<string, TgSettings>>(SETTINGS_KEY, {});
  return all[sellerId] ?? { botToken: '', chatId: '', enabled: false };
}

export function saveTgSettings(sellerId: string, s: TgSettings) {
  const all = read<Record<string, TgSettings>>(SETTINGS_KEY, {});
  all[sellerId] = s;
  write(SETTINGS_KEY, all);
}

export function getAlertLog(sellerId: string): AlertLogEntry[] {
  return read<AlertLogEntry[]>(LOG_KEY, []).filter(e => e.sellerId === sellerId);
}

function logAlert(entry: AlertLogEntry) {
  const all = read<AlertLogEntry[]>(LOG_KEY, []);
  write(LOG_KEY, [entry, ...all].slice(0, 50));
}

export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    const data = await res.json();
    return data.ok ? { ok: true } : { ok: false, error: data.description || 'Telegram rejected the message' };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/** Notify a seller about a new order — real Telegram if configured, else demo log. */
export async function notifyNewOrder(
  sellerId: string,
  order: { id: string; items: { title: string; qty: number; price: number }[]; customer: { name: string; phone: string; address: string } }
): Promise<AlertLogEntry['status']> {
  const lines = order.items.map(i => `• ${i.qty}× ${i.title} — ₹${i.price * i.qty}`).join('\n');
  const text =
    `🔔 <b>New SastaBazaar order ${order.id}</b>\n\n${lines}\n\n` +
    `👤 ${order.customer.name} · ${order.customer.phone}\n` +
    `📍 ${order.customer.address}\n\n` +
    `Ship it and add the tracking ID in your seller dashboard.`;
  const s = getTgSettings(sellerId);
  let status: AlertLogEntry['status'] = 'demo-logged';
  if (s.enabled && s.botToken && s.chatId) {
    const r = await sendTelegramMessage(s.botToken, s.chatId, text);
    status = r.ok ? 'sent' : 'failed';
  }
  logAlert({ sellerId, at: new Date().toISOString(), kind: 'order', preview: text.slice(0, 120) + '…', status });
  return status;
}
