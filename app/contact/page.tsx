'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, MessageCircle, Send, PackageSearch, RotateCcw, Store, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState('Order help');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = () => {
    setError('');
    if (name.trim().length < 2) { setError('Please enter your name.'); return; }
    if (phone.trim().replace(/\D/g, '').length < 10) { setError('Please enter a valid phone number.'); return; }
    if (message.trim().length < 5) { setError('Please write your message.'); return; }
    // DEMO: stored locally. Real launch -> ticket system / email to care team.
    const tickets = JSON.parse(localStorage.getItem('sb-care-tickets') || '[]');
    tickets.unshift({ name: name.trim(), phone: phone.trim(), topic, message: message.trim(), at: new Date().toISOString() });
    localStorage.setItem('sb-care-tickets', JSON.stringify(tickets.slice(0, 50)));
    setSent(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900">Customer Care 🇮🇳</h1>
        <p className="text-gray-500 mt-2">Hum aapki seva mein — our India team is here to help.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        {/* contact info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 sm:p-8">
          <h2 className="font-extrabold text-xl text-gray-900">Reach us</h2>
          <div className="mt-5 space-y-4">
            <div className="flex gap-4">
              <span className="w-11 h-11 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0">
                <MapPin size={20} />
              </span>
              <div>
                <div className="font-bold text-gray-900 text-sm">Head Office</div>
                <div className="text-sm text-gray-600">
                  SastaBazaar Customer Care<br />
                  Bangalore, Karnataka, India 🇮🇳
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="w-11 h-11 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                <Phone size={20} />
              </span>
              <div>
                <div className="font-bold text-gray-900 text-sm">Phone</div>
                <div className="text-sm text-gray-600">
                  <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">Coming soon</span>
                  <div className="text-xs text-gray-400 mt-1">For now, message us on WhatsApp below.</div>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Mail size={20} />
              </span>
              <div>
                <div className="font-bold text-gray-900 text-sm">Email</div>
                <div className="text-sm text-gray-600">care@sastabazaar.in</div>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Clock size={20} />
              </span>
              <div>
                <div className="font-bold text-gray-900 text-sm">Hours</div>
                <div className="text-sm text-gray-600">Monday – Saturday, 10 AM – 7 PM IST</div>
              </div>
            </div>
          </div>

          <a href="https://wa.me/919000000000?text=Namaskar%2C%20I%20need%20help%20with%20SastaBazaar"
            target="_blank" rel="noopener noreferrer"
            className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3.5 rounded-2xl hover:brightness-95">
            <MessageCircle size={19} /> Chat on WhatsApp
          </a>
          <p className="text-xs text-gray-400 text-center mt-2">Coming soon — connect your real WhatsApp Business number at launch.</p>

          {/* quick links */}
          <div className="grid grid-cols-3 gap-2 mt-6">
            {[
              { href: '/track', icon: PackageSearch, label: 'Track order' },
              { href: '/return-policy', icon: RotateCcw, label: 'Returns' },
              { href: '/seller', icon: Store, label: 'Become seller' },
            ].map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href}
                className="flex flex-col items-center gap-1 bg-gray-50 hover:bg-gray-100 rounded-2xl py-4 text-xs font-bold text-gray-700 transition">
                <Icon size={20} className="text-[var(--primary)]" /> {label}
              </Link>
            ))}
          </div>
        </motion.div>

        {/* message form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 sm:p-8">
          {sent ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-10">
              <CheckCircle2 size={64} className="text-green-500" />
              <h2 className="text-2xl font-extrabold text-gray-900 mt-4">Dhanyavaad, {name.split(' ')[0]}! 🙏</h2>
              <p className="text-sm text-gray-500 mt-2 max-w-xs">
                Your message is received. Our Bangalore team will call you back within 24 hours (Mon–Sat).
              </p>
              <button onClick={() => { setSent(false); setMessage(''); }}
                className="mt-6 text-sm font-bold text-[var(--primary)]">Send another message</button>
            </div>
          ) : (
            <>
              <h2 className="font-extrabold text-xl text-gray-900">Send us a message</h2>
              <p className="text-sm text-gray-500 mt-1">We usually reply within 24 hours.</p>
              <div className="mt-5 space-y-3">
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                  className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" inputMode="tel"
                  className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
                <select value={topic} onChange={e => setTopic(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40">
                  {['Order help', 'Return / refund', 'Seller question', 'Payment issue', 'Something else'].map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="How can we help?" rows={4}
                  className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button onClick={submit}
                  className="btn-primary w-full font-bold py-3.5 rounded-2xl inline-flex items-center justify-center gap-2">
                  <Send size={17} /> Send Message
                </button>
                <p className="text-xs text-gray-400 text-center">Demo form — messages are saved in this browser. Real launch connects to your care inbox.</p>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* map */}
      <div className="mt-6 bg-white rounded-3xl border border-gray-100 shadow-md overflow-hidden">
        <div className="px-6 pt-5 pb-3 flex items-center gap-2">
          <MapPin size={18} className="text-[var(--primary)]" />
          <h2 className="font-extrabold text-gray-900">Find us — Bangalore, India</h2>
        </div>
        <iframe
          title="SastaBazaar — Bangalore, India"
          src="https://www.openstreetmap.org/export/embed.html?bbox=77.50%2C12.90%2C77.70%2C13.05&layer=mapnik&marker=12.9716%2C77.5946"
          className="w-full h-72 border-0"
          loading="lazy"
        />
      </div>
    </div>
  );
}
