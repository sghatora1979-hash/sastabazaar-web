'use client';
import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { listJobMessages, sendJobMessage, type DeliveryMessage } from '@/lib/delivery';
import { getSupabase } from '@/lib/supabase';

/** Order-specific customer ↔ biker chat. Self-contained; needs jobId. */
export function ChatBox({ jobId }: { jobId: string }) {
  const [msgs, setMsgs] = useState<DeliveryMessage[]>([]);
  const [text, setText] = useState('');
  const [uid, setUid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const m = await listJobMessages(jobId);
    setMsgs(m);
  };

  useEffect(() => {
    getSupabase()?.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null));
    load();
    const t = setInterval(load, 8000); // simple polling; realtime upgrade later
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs.length]);

  const send = async () => {
    const b = text.trim();
    if (!b || busy) return;
    setBusy(true);
    try {
      await sendJobMessage(jobId, b);
      setText('');
      await load();
    } catch {
      /* RLS will reject non-participants; stay quiet */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="max-h-64 overflow-y-auto space-y-2 p-1">
        {msgs.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">
            No messages yet. Say hello to coordinate pickup / delivery.
          </p>
        )}
        {msgs.map(m => {
          const mine = uid && m.sender_profile_id === uid;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                  mine ? 'bg-[#FB7701] text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                }`}
              >
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 mt-3">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Type a message…"
          maxLength={1000}
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FB7701]/40"
        />
        <button
          onClick={send}
          disabled={busy || !text.trim()}
          aria-label="Send message"
          className="w-11 h-11 shrink-0 rounded-xl text-white flex items-center justify-center shadow hover:brightness-110 disabled:opacity-50"
          style={{ background: '#FB7701' }}
        >
          <Send size={18} />
        </button>
      </div>
      <p className="text-[10px] text-gray-400 mt-2">
        Secure order chat — only you, your biker and support can read this.
      </p>
    </div>
  );
}
