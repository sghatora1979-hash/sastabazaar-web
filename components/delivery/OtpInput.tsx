'use client';
import { useRef } from 'react';

/** 6-digit OTP input. Props: value, onChange. */
export function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const setDigit = (i: number, d: string) => {
    const clean = d.replace(/\D/g, '').slice(-1);
    const arr = value.split('');
    arr[i] = clean;
    const next = arr.join('').slice(0, 6);
    onChange(next);
    if (clean && i < 5) refs.current[i + 1]?.focus();
  };

  const onKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) refs.current[i - 1]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center" dir="ltr">
      {[0, 1, 2, 3, 4, 5].map(i => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={e => setDigit(i, e.target.value)}
          onKeyDown={e => onKey(i, e)}
          aria-label={`Digit ${i + 1}`}
          className="w-11 h-13 py-3 text-center text-xl font-black rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#FB7701]/50 focus:border-[#FB7701]"
        />
      ))}
    </div>
  );
}
