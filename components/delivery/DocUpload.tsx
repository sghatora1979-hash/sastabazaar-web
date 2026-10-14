'use client';
import { useRef, useState } from 'react';
import { UploadCloud, CheckCircle2, Loader2 } from 'lucide-react';
import { uploadBikerFile } from '@/lib/delivery';

/**
 * Document uploader → PRIVATE 'biker-docs' bucket (or public for photos).
 * Props: label, hint, kind ('doc' | 'photo'), onUploaded(path), required.
 */
export function DocUpload({
  label, hint, kind = 'doc', onUploaded, required = false,
}: {
  label: string;
  hint?: string;
  kind?: 'doc' | 'photo';
  onUploaded: (path: string) => void;
  required?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  const pick = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true); setError('');
    try {
      const path = await uploadBikerFile(f, kind);
      setDone(true);
      onUploaded(path);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
        className={`w-full border-2 border-dashed rounded-2xl p-4 flex items-center gap-3 text-left transition hover:border-[#FB7701]/60 hover:bg-orange-50/50 disabled:opacity-60 ${
          done ? 'border-green-300 bg-green-50/50' : 'border-gray-200 bg-white'
        }`}
      >
        {busy ? <Loader2 size={22} className="animate-spin text-gray-400 shrink-0" />
          : done ? <CheckCircle2 size={22} className="text-green-600 shrink-0" />
          : <UploadCloud size={22} className="text-gray-400 shrink-0" />}
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-bold text-gray-900">
            {label} {required && <span className="text-red-500">*</span>}
          </span>
          {hint && <span className="block text-[11px] text-gray-500 mt-0.5">{hint}</span>}
          {done && <span className="block text-[11px] text-green-700 font-bold mt-0.5">Uploaded ✓</span>}
        </span>
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={e => pick(e.target.files?.[0])}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {kind === 'doc' && (
        <p className="text-[10px] text-gray-400 mt-1">🔒 Stored privately — never shown publicly.</p>
      )}
    </div>
  );
}
