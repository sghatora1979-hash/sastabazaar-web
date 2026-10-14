'use client';
/*
 * SastaBazaar AI Help Chatbot (v2) — "Sasta Sahayak AI"
 * ----------------------------------------------------
 * Upgrades over v1:
 *  - 10 languages (Hindi, English, Punjabi, Bengali, Tamil, Telugu,
 *    Marathi, Gujarati, Chinese-Simplified, Spanish). HI/EN answers are
 *    instant + free (hand-written); other languages are answered/translated
 *    by the AI server route.
 *  - Real AI answers via POST /api/sahayak (server-side AI_API_KEY, never
 *    exposed to the browser). Honest fallback to the built-in knowledge base
 *    when the key is missing or the provider fails ("basic mode").
 *  - Voice IN (mic) + voice OUT (speaker toggle) via the free Web Speech API.
 *  - Logged-in awareness: greets by email via the Supabase session (never
 *    reveals anyone else's data).
 *  - Expanded knowledge base covering every major page/section.
 * HONEST SCOPE: order tracking & rider details are DEMO until real courier
 * APIs are integrated (Phase 2). Demo data is always labelled demo.
 *
 * INSTALL (GitHub web upload):
 *  1. Upload/replace: components/sasta-chatbot/SastaChatbot.tsx  (this file)
 *  2. Upload new:     components/sasta-chatbot/sahayak-kb.ts
 *  3. Upload new:     app/api/sahayak/route.ts
 *  4. In app/layout.tsx, inside </AuthProvider> (before its closing tag):
 *       import { SastaChatbot } from '@/components/sasta-chatbot/SastaChatbot';
 *     ...and in the JSX:  <SastaChatbot />
 *  5. Commit + push. Vercel rebuilds automatically.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  LANGS, langName, speechCode, answerFor, navIntent,
  loadSizeProfile, saveSizeProfile, sizeProfileLine,
  type LangCode, type SizeProfile,
} from './sahayak-kb';
import { getSupabase } from '@/lib/supabase';

type Msg = { from: 'bot' | 'user'; html: string };

const STR: Record<'hi' | 'en', {
  name: string; tag: string; ph: string; greet: string; greetBack: (email: string) => string;
  note: string; micTitle: string; sendTitle: string; emailUs: string; typing: string;
  aiOn: string; basic: string; speakerOn: string; speakerOff: string; langLabel: string;
  quick: string[];
}> = {
  hi: {
    name: 'सस्ता सहायक', tag: 'AI हेल्पर • तुरंत जवाब',
    ph: 'अपनी परेशानी लिखो या बोलो...',
    greet: 'नमस्ते! 🙏 मैं <b>सस्ता सहायक</b> हूँ। ऑर्डर, रिफंड, सेलर, डिलीवरी — कुछ भी पूछो, लिखकर या बोलकर।',
    greetBack: (e) => `नमस्ते, <b>${e}</b>! 🙏 वापस स्वागत है। बताओ, क्या मदद करूँ?`,
    note: 'नोट: ट्रैकिंग/राइडर जानकारी अभी डेमो है — असली कोरियर जुड़ने पर लाइव होगी।',
    micTitle: 'बोलकर पूछो', sendTitle: 'भेजो',
    emailUs: '📧 हमें ईमेल करो', typing: 'लिख रहा है…',
    aiOn: '🤖 AI जुड़ा है', basic: '📖 बेसिक मोड',
    speakerOn: '🔊 आवाज़ चालू', speakerOff: '🔇 आवाज़ बंद', langLabel: 'भाषा',
    quick: ['📦 ऑर्डर ट्रैक करो', '↩️ रिफंड/रिटर्न', '🏪 सेलर बनो', '🚚 कोरियर', '👛 वॉलेट', '🛵 डिलीवरी'],
  },
  en: {
    name: 'Sasta Sahayak', tag: 'AI helper • instant answers',
    ph: 'Type or speak your question...',
    greet: 'Hello! 🙏 I am <b>Sasta Sahayak</b>. Ask anything about orders, refunds, sellers or delivery — by typing or voice.',
    greetBack: (e) => `Hello, <b>${e}</b>! 🙏 Welcome back. How can I help?`,
    emailUs: '📧 Email us', typing: 'typing…',
    note: 'Note: tracking/rider info is demo for now — goes live once real couriers connect.',
    micTitle: 'Ask by voice', sendTitle: 'Send',
    aiOn: '🤖 AI connected', basic: '📖 Basic mode',
    speakerOn: '🔊 Voice on', speakerOff: '🔇 Voice off', langLabel: 'Language',
    quick: ['📦 Track order', '↩️ Refund/Return', '🏪 Become seller', '🚚 Couriers', '👛 Wallet', '🛵 Delivery'],
  },
};

const NO_MATCH_HI = 'समझ नहीं आया';
const NO_MATCH_EN = "Didn't catch that";

/* Escape HTML, then allow **bold**, line breaks and [text](/path) links. */
function mdLite(s: string): string {
  let h = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  h = h.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  h = h.replace(/\[([^\]]+)\]\((\/[^)]+)\)/g, '<a href="$2">$1</a>');
  h = h.replace(/\n{2,}/g, '<br><br>').replace(/\n/g, '<br>');
  return h;
}
function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function SastaChatbot() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<LangCode>('hi');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [voiceOut, setVoiceOut] = useState(false);
  const [aiOn, setAiOn] = useState<boolean | null>(null);
  const [started, setStarted] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  /* v2: photo stylist + size profile */
  const [photo, setPhoto] = useState<string | null>(null);
  const [showSize, setShowSize] = useState(false);
  const [sizeForm, setSizeForm] = useState<SizeProfile>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const recogRef = useRef<{ stop: () => void } | null>(null);
  const langRef = useRef<LangCode>(lang);
  langRef.current = lang;
  const t = lang === 'hi' ? STR.hi : STR.en;

  /* Check whether the AI server route is configured (ping). */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch('/api/sahayak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ping: true }),
        });
        const j = await r.json().catch(() => ({}));
        if (alive) setAiOn(r.ok && j.ai === true);
      } catch {
        if (alive) setAiOn(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  /* First open: greet, personalised when logged in (their own session only). */
  useEffect(() => {
    if (!open || started) return;
    setStarted(true);
    (async () => {
      let email: string | null = null;
      try {
        const sb = getSupabase();
        const { data } = await sb!.auth.getSession();
        email = data?.session?.user?.email ?? null;
      } catch { /* not configured — stay anonymous */ }
      setUserEmail(email);
      const uiLang: 'hi' | 'en' = langRef.current === 'hi' ? 'hi' : 'en';
      const s = STR[uiLang];
      push('bot', email ? s.greetBack(email.replace(/</g, '&lt;')) : s.greet);
      push('bot', `<i>${s.note}</i>`);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, started]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs]);

  /* Stop any speech when the panel closes. */
  useEffect(() => {
    if (!open && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [open ]);

  function push(from: Msg['from'], html: string) {
    setMsgs((p) => [...p, { from, html }]);
  }

  const speak = useCallback((html: string, lc: LangCode) => {
    try {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      const text = stripTags(html);
      if (!text) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = speechCode(lc);
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    } catch { /* voice not available — stay silent */ }
  }, []);

  function deliver(html: string, lc: LangCode, withVoice: boolean) {
    push('bot', html);
    if (withVoice) speak(html, lc);
  }

  async function askAI(question: string, lc: LangCode, email: string | null): Promise<{ html: string; notice?: string }> {
    const hist = msgs.slice(-6).map((m) => stripTags(m.html)).filter(Boolean);
    const sp = sizeProfileLine(loadSizeProfile());
    const r = await fetch('/api/sahayak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question, lang: lc, history: hist, userEmail: email,
        sizeProfile: sp || undefined,
        image: photoRef.current || undefined, // one request only — never stored server-side
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.answer) throw new Error('ai failed');
    return { html: mdLite(String(j.answer)), notice: j.notice ? mdLite(String(j.notice)) : undefined };
  }

  const photoRef = useRef<string | null>(null);
  photoRef.current = photo;

  /** After any answer, offer a one-tap navigation button when the user asked to see/open something. */
  function maybeNavigate(userText: string, lc: LangCode) {
    const url = navIntent(userText);
    if (!url) return;
    const label = lc === 'hi' ? '👉 खोलकर देखो' : '👉 Open it';
    push('bot', `<a href="${url}" class="sasta-goto">${label}</a>`);
  }

  async function botThink(userText: string) {
    const lc = langRef.current;
    const uiLang: 'hi' | 'en' = lc === 'hi' ? 'hi' : 'en';
    const s = STR[uiLang];
    push('bot', `<span class="sasta-typing">${s.typing}</span>`);
    const clearTyping = () =>
      setMsgs((p) => p.filter((m) => !(m.from === 'bot' && m.html.includes('sasta-typing'))));

    try {
      if (lc === 'hi' || lc === 'en') {
        // Instant free answer for HI/EN when the knowledge base matches.
        const rb = answerFor(userText, lc);
        const noMatch = rb.includes(lc === 'hi' ? NO_MATCH_HI : NO_MATCH_EN);
        if (!noMatch) {
          await new Promise((r) => setTimeout(r, 400));
          clearTyping();
          deliver(rb, lc, voiceOutRef.current);
          maybeNavigate(userText, lc);
          return;
        }
      }
      // AI path: other languages, or HI/EN with no local match, or photo attached.
      if (aiOn || photoRef.current) {
        const { html, notice } = await askAI(userText, lc, userEmailRef.current);
        clearTyping();
        if (notice) push('bot', `<i>${notice}</i>`);
        deliver(html, lc, voiceOutRef.current);
        maybeNavigate(userText, lc);
        return;
      }
      // Basic mode fallback (no AI key): rule-based answer in HI/EN.
      await new Promise((r) => setTimeout(r, 400));
      clearTyping();
      const rb = answerFor(userText, uiLang);
      push('bot', `<i>${s.basic} — ${lc !== 'hi' && lc !== 'en' ? `answering in ${langName(uiLang)}` : ''}</i>`);
      deliver(rb, uiLang, voiceOutRef.current);
      maybeNavigate(userText, lc);
    } catch {
      clearTyping();
      const rb = answerFor(userText, uiLang);
      deliver(rb, uiLang, voiceOutRef.current);
      maybeNavigate(userText, lc);
    }
  }

  const voiceOutRef = useRef(voiceOut);
  voiceOutRef.current = voiceOut;
  const userEmailRef = useRef(userEmail);
  userEmailRef.current = userEmail;

  function send(text: string) {
    const v = text.trim();
    const hasPhoto = !!photoRef.current;
    if (!v && !hasPhoto) return;
    // Photo with no text → default stylist question (in current language).
    const q = v || (langRef.current === 'hi'
      ? 'Meri photo dekho aur mujhe outfit/color suggest karo'
      : 'Look at my photo and suggest outfits/colors for me');
    if (hasPhoto) push('user', `📷 <i>${langRef.current === 'hi' ? 'फोटो भेजी गई' : 'photo attached'}</i>${v ? ' — ' + v.replace(/</g, '&lt;') : ''}`);
    else push('user', v.replace(/</g, '&lt;'));
    setInput('');
    setPhoto(null); // photo is used for this one request only
    void botThink(q);
  }

  function pickPhoto() { fileRef.current?.click(); }

  function onPhotoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) return;
    if (f.size > 2_000_000) {
      push('bot', lang === 'hi'
        ? '📷 फोटो 2MB से बड़ी है — छोटी फोटो चुनो।'
        : '📷 Photo is larger than 2MB — pick a smaller one.');
      return;
    }
    const rd = new FileReader();
    rd.onload = () => setPhoto(String(rd.result));
    rd.readAsDataURL(f);
  }

  function toggleMic() {
    const SR = (window as unknown as { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any });
    const Ctor = SR.SpeechRecognition || SR.webkitSpeechRecognition;
    if (!Ctor) {
      push('bot', lang === 'hi'
        ? 'माइक इस ब्राउज़र में नहीं चलता — Chrome में खोलो। 🎤'
        : 'Mic not supported in this browser — open in Chrome. 🎤');
      return;
    }
    if (listening) { recogRef.current?.stop(); setListening(false); return; }
    const r = new Ctor();
    r.lang = speechCode(langRef.current);
    r.interimResults = false;
    r.onresult = (e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => {
      const txt = e.results[0][0].transcript;
      setListening(false);
      send(txt);
    };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    recogRef.current = r;
    setListening(true);
    try { r.start(); } catch { setListening(false); }
  }

  function toggleVoiceOut() {
    const next = !voiceOut;
    setVoiceOut(next);
    if (!next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  return (
    <>
      <button onClick={() => setOpen((o) => !o)} aria-label="Open help chat" className="sasta-fab">💬</button>
      {open && (
        <div className="sasta-panel">
          <div className="sasta-head">
            <span className="sasta-dot" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <b>{t.name}</b>
              <div style={{ fontSize: 12, opacity: 0.92 }}>
                {t.tag} {aiOn === true ? `• ${t.aiOn}` : aiOn === false ? `• ${t.basic}` : ''}
              </div>
            </div>
            <button
              onClick={toggleVoiceOut}
              title={voiceOut ? t.speakerOn : t.speakerOff}
              className={`sasta-spk ${voiceOut ? 'on' : ''}`}
            >
              {voiceOut ? '🔊' : '🔇'}
            </button>
            <select
              aria-label={t.langLabel}
              className="sasta-select"
              value={lang}
              onChange={(e) => {
                const nl = e.target.value as LangCode;
                setLang(nl);
                const s2 = nl === 'hi' ? STR.hi : STR.en;
                push('bot', nl === 'hi'
                  ? 'ठीक है, अब <b>हिंदी</b> में बात करेंगे! 🇮🇳'
                  : `OK — now in <b>${langName(nl)}</b>! ${nl === 'en' ? '🇬🇧' : '🌍'}${s2 === STR.en && nl !== 'en' ? '<br><i>AI translates answers into your language.</i>' : ''}`);
              }}
            >
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>{l.native}</option>
              ))}
            </select>
            <button onClick={() => setOpen(false)} className="sasta-x">×</button>
          </div>
          <div className="sasta-body" ref={bodyRef}>
            {msgs.map((m, i) => (
              <div key={i} className={`sasta-msg ${m.from}`} dangerouslySetInnerHTML={{ __html: m.html }} />
            ))}
            {(lang === 'hi' || lang === 'en') && (
              <div className="sasta-qr">
                {t.quick.map((q) => (
                  <button key={q} onClick={() => send(q.replace(/^[^\s]+\s/, ''))}>{q}</button>
                ))}
              </div>
            )}
          </div>
          {photo && (
            <div className="sasta-photo">
              <img src={photo} alt="attachment preview" />
              <div className="sasta-photo-note">
                {lang === 'hi'
                  ? '📷 ये फोटो सिर्फ इस एक जवाब के लिए जाएगी — सेव नहीं होगी, किसी से शेयर नहीं होगी।'
                  : '📷 This photo is used for this one answer only — never saved, never shared.'}
              </div>
              <button onClick={() => setPhoto(null)} className="sasta-photo-x">✕</button>
            </div>
          )}
          <div className="sasta-input">
            <button onClick={toggleMic} title={t.micTitle} className={`sasta-mic ${listening ? 'live' : ''}`}>🎤</button>
            <button onClick={pickPhoto} title={lang === 'hi' ? 'फोटो भेजो — स्टाइल सलाह' : 'Send photo — style advice'} className="sasta-mic">📷</button>
            <button
              onClick={() => { setSizeForm(loadSizeProfile()); setShowSize((s) => !s); }}
              title={lang === 'hi' ? 'मेरा साइज़ प्रोफाइल' : 'My size profile'}
              className="sasta-mic"
            >📏</button>
            <input
              value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send(input)}
              placeholder={t.ph}
            />
            <button onClick={() => send(input)} title={t.sendTitle} className="sasta-send">➤</button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPhotoFile} />
          </div>
          {showSize && (
            <div className="sasta-size">
              <b>{lang === 'hi' ? '📏 मेरा साइज़ प्रोफाइल' : '📏 My Size Profile'}</b>
              <div className="sasta-size-sub">
                {lang === 'hi'
                  ? 'सिर्फ तुम्हारे फोन/ब्राउज़र में सेव होगा — सर्वर पर नहीं जाएगा।'
                  : 'Saved only in your browser — never sent to any server.'}
              </div>
              <div className="sasta-size-grid">
                <label>{lang === 'hi' ? 'लंबाई (cm)' : 'Height (cm)'}<input value={sizeForm.heightCm || ''} onChange={(e) => setSizeForm({ ...sizeForm, heightCm: e.target.value })} inputMode="numeric" /></label>
                <label>{lang === 'hi' ? 'कमर (इंच)' : 'Waist (in)'}<input value={sizeForm.waistIn || ''} onChange={(e) => setSizeForm({ ...sizeForm, waistIn: e.target.value })} inputMode="numeric" /></label>
                <label>{lang === 'hi' ? 'छाती (इंच)' : 'Chest (in)'}<input value={sizeForm.chestIn || ''} onChange={(e) => setSizeForm({ ...sizeForm, chestIn: e.target.value })} inputMode="numeric" /></label>
                <label>{lang === 'hi' ? 'रंग (skin tone)' : 'Skin tone'}
                  <select value={sizeForm.skinTone || ''} onChange={(e) => setSizeForm({ ...sizeForm, skinTone: e.target.value })}>
                    <option value="">—</option>
                    <option value="fair">{lang === 'hi' ? 'गोरा' : 'Fair'}</option>
                    <option value="medium">{lang === 'hi' ? 'गेहुँआ' : 'Medium'}</option>
                    <option value="dusky">{lang === 'hi' ? 'साँवला' : 'Dusky'}</option>
                  </select>
                </label>
                <label className="sasta-size-wide">{lang === 'hi' ? 'पसंदीदा रंग' : 'Favourite colours'}<input value={sizeForm.favColors || ''} onChange={(e) => setSizeForm({ ...sizeForm, favColors: e.target.value })} placeholder={lang === 'hi' ? 'जैसे: नीला, हरा' : 'e.g. blue, green'} /></label>
              </div>
              <div className="sasta-size-btns">
                <button onClick={() => {
                  saveSizeProfile(sizeForm);
                  setShowSize(false);
                  push('bot', lang === 'hi'
                    ? '📏 <b>साइज़ प्रोफाइल सेव हो गया!</b> अब साइज़/रंग की सलाह इसी के हिसाब से दूँगा।'
                    : '📏 <b>Size profile saved!</b> I will use it for size/colour advice.');
                }}>{lang === 'hi' ? 'सेव करो' : 'Save'}</button>
                <button onClick={() => setShowSize(false)} className="ghost">{lang === 'hi' ? 'बंद करो' : 'Close'}</button>
              </div>
            </div>
          )}
        </div>
      )}
      <style>{`
.sasta-fab{position:fixed;bottom:22px;right:22px;width:62px;height:62px;border-radius:50%;border:none;font-size:28px;cursor:pointer;z-index:100;color:#fff;background:linear-gradient(135deg,#FF6B35,#FFA53C);box-shadow:0 12px 30px rgba(255,107,53,.5);transition:transform .2s}
.sasta-fab:hover{transform:scale(1.08)}
.sasta-panel{position:fixed;bottom:96px;right:22px;width:390px;max-width:calc(100vw - 44px);height:550px;max-height:calc(100vh - 130px);background:#fff;border-radius:24px;box-shadow:0 24px 60px rgba(60,20,5,.3);z-index:100;display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(255,107,53,.2);font-family:inherit}
.sasta-head{background:linear-gradient(120deg,#FF6B35,#FFA53C);color:#fff;padding:14px 16px;display:flex;align-items:center;gap:8px}
.sasta-dot{width:10px;height:10px;background:#28C840;border-radius:50%;box-shadow:0 0 0 3px rgba(255,255,255,.3);flex:0 0 10px}
.sasta-spk{border:none;background:rgba(255,255,255,.2);color:#fff;font-size:16px;border-radius:50%;width:34px;height:34px;cursor:pointer;flex:0 0 34px}
.sasta-spk.on{background:#fff}
.sasta-select{border:none;background:rgba(255,255,255,.2);color:#fff;font-size:12px;font-weight:700;border-radius:999px;padding:6px 8px;cursor:pointer;max-width:110px}
.sasta-select option{color:#333}
.sasta-x{background:none;border:none;color:#fff;font-size:24px;cursor:pointer;line-height:1}
.sasta-body{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#FFF8F1}
.sasta-msg{max-width:88%;padding:10px 14px;border-radius:16px;font-size:14.5px;line-height:1.55;word-break:break-word}
.sasta-msg.bot{background:#fff;border:1px solid rgba(255,107,53,.18);align-self:flex-start;border-bottom-left-radius:6px;color:#3A2415}
.sasta-msg.user{background:linear-gradient(120deg,#FF6B35,#FFA53C);color:#fff;align-self:flex-end;border-bottom-right-radius:6px}
.sasta-msg a{color:#FF6B35;font-weight:700}
.sasta-qr{display:flex;flex-wrap:wrap;gap:8px}
.sasta-qr button{background:#fff;border:1.5px solid #FFA53C;color:#E05A1B;border-radius:999px;padding:7px 13px;font-size:13px;font-weight:600;cursor:pointer}
.sasta-input{display:flex;gap:8px;padding:10px;border-top:1px solid rgba(255,107,53,.15);background:#fff;align-items:center}
.sasta-input input{flex:1;border:2px solid #F5DDC4;border-radius:999px;padding:10px 15px;font-size:14px;font-family:inherit;min-width:0}
.sasta-input input:focus{outline:none;border-color:#FFA53C}
.sasta-mic{border:2px solid #F5DDC4;background:#fff;border-radius:50%;width:42px;height:42px;font-size:18px;cursor:pointer;flex:0 0 42px}
.sasta-mic.live{border-color:#FF3B30;animation:sastaPulse 1s infinite}
@keyframes sastaPulse{50%{box-shadow:0 0 0 8px rgba(255,59,48,.15)}}
.sasta-send{background:linear-gradient(120deg,#FF6B35,#FFA53C);color:#fff;border:none;border-radius:50%;width:42px;height:42px;font-size:17px;cursor:pointer;flex:0 0 42px}
.sasta-typing{font-style:italic;opacity:.6}
.sasta-goto{display:inline-block;margin-top:6px;background:linear-gradient(120deg,#FF6B35,#FFA53C);color:#fff!important;font-weight:700;border-radius:999px;padding:8px 18px;text-decoration:none}
.sasta-photo{display:flex;gap:10px;align-items:center;padding:8px 12px;background:#FFF3E6;border-top:1px solid rgba(255,107,53,.15)}
.sasta-photo img{width:56px;height:56px;object-fit:cover;border-radius:12px;border:2px solid #FFA53C}
.sasta-photo-note{flex:1;font-size:12px;color:#8A5A2B;line-height:1.4}
.sasta-photo-x{border:none;background:#fff;border-radius:50%;width:30px;height:30px;cursor:pointer;font-size:14px}
.sasta-size{background:#FFF8F1;border-top:1px solid rgba(255,107,53,.15);padding:12px 14px;font-size:13px;color:#3A2415;max-height:230px;overflow-y:auto}
.sasta-size-sub{font-size:12px;opacity:.7;margin:2px 0 8px}
.sasta-size-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.sasta-size-grid label{display:flex;flex-direction:column;font-size:12px;font-weight:600;gap:3px}
.sasta-size-grid input,.sasta-size-grid select{border:2px solid #F5DDC4;border-radius:10px;padding:7px 10px;font-size:13px;font-family:inherit;background:#fff}
.sasta-size-wide{grid-column:1/-1}
.sasta-size-btns{display:flex;gap:8px;margin-top:10px}
.sasta-size-btns button{background:linear-gradient(120deg,#FF6B35,#FFA53C);color:#fff;border:none;border-radius:999px;padding:8px 20px;font-weight:700;cursor:pointer;font-size:13px}
.sasta-size-btns button.ghost{background:#fff;color:#E05A1B;border:1.5px solid #FFA53C}
`}</style>
    </>
  );
}
