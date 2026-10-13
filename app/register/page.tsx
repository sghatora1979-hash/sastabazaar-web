'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { startOtp, verifyOtp, registerUser, userExists, ID_TYPES } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [idType, setIdType] = useState<string>(ID_TYPES[0]);
  const [idNumber, setIdNumber] = useState('');
  const [code, setCode] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [error, setError] = useState('');

  const validEmail = /.+@.+\..+/.test(email.trim());
  const validPhone = phone.replace(/\D/g, '').length >= 7;

  function sendCode() {
    setError('');
    if (!name.trim()) return setError('Please enter your name.');
    if (!validEmail) return setError('Please enter a valid email.');
    if (!validPhone) return setError('Please enter a valid phone number.');
    if (!idNumber.trim()) return setError('Please enter your ID number.');
    if (userExists(email)) {
      router.push('/login');
      return;
    }
    const c = startOtp(email);
    setDemoCode(c);
    setStep('otp');
  }

  function confirm() {
    setError('');
    if (!verifyOtp(email, code)) return setError('Wrong or expired code. Try again.');
    registerUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      idType,
      idNumber: idNumber.trim(),
      createdAt: Date.now(),
    });
    router.push('/trade/BTCUSD');
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-extrabold">Create your Quasar account</h1>
      <p className="text-sm text-gray-500 mt-1">
        Email + phone + ID. One demo OTP — then start paper trading.
      </p>
      <p className="text-xs mt-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
        Demo only: accounts live in this browser. No real money, no real KYC — a real
        exchange needs licensed identity verification.
      </p>

      {step === 'form' ? (
        <div className="mt-6 space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
            className="w-full border rounded-xl px-4 py-2.5" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
            type="email" className="w-full border rounded-xl px-4 py-2.5" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (e.g. +1 604 555 1234)"
            type="tel" className="w-full border rounded-xl px-4 py-2.5" />
          <div className="flex gap-2">
            <select value={idType} onChange={(e) => setIdType(e.target.value)}
              className="border rounded-xl px-3 py-2.5 bg-white">
              {ID_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <input value={idNumber} onChange={(e) => setIdNumber(e.target.value)}
              placeholder="ID number" className="flex-1 border rounded-xl px-4 py-2.5" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button onClick={sendCode}
            className="w-full bg-violet-600 text-white font-bold rounded-xl py-3 hover:bg-violet-700">
            Send OTP
          </button>
          <p className="text-sm text-center text-gray-500">
            Already have an account? <Link href="/login" className="text-violet-600 font-bold">Log in</Link>
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-gray-600">
            Demo OTP for <b>{email}</b>:
          </p>
          <p className="text-3xl font-mono font-extrabold tracking-widest text-center py-3 bg-violet-50 border border-violet-200 rounded-xl">
            {demoCode}
          </p>
          <p className="text-xs text-gray-500 text-center">
            In a real exchange this arrives by SMS/email. Here it is shown on screen because this is a demo.
          </p>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter 6-digit code"
            inputMode="numeric" maxLength={6}
            className="w-full border rounded-xl px-4 py-2.5 text-center text-xl tracking-widest" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button onClick={confirm}
            className="w-full bg-violet-600 text-white font-bold rounded-xl py-3 hover:bg-violet-700">
            Verify & start trading
          </button>
          <button onClick={() => setStep('form')} className="w-full text-sm text-gray-500">
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}
