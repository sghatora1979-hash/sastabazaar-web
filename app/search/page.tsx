'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { searchProducts, Product } from '@/lib/products';
import { getRecentlyViewed } from '@/lib/recent';
import { ProductCard3D } from '@/components/3d/ProductCard3D';
import { Search as SearchIcon, Mic } from 'lucide-react';
import { Suspense } from 'react';

function SearchResults() {
  const params = useSearchParams();
  const q = params.get('q') ?? '';
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState<Product[]>(() => searchProducts(q, 30));
  const [listening, setListening] = useState(false);
  const [voiceNote, setVoiceNote] = useState('');
  const [recent] = useState<Product[]>(() => getRecentlyViewed());

  useEffect(() => {
    setQuery(q);
    setResults(searchProducts(q, 30));
  }, [q]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setResults(searchProducts(query, 30));
  };

  /** Voice search (Web Speech API) — graceful fallback when unsupported. */
  const voiceSearch = () => {
    const SR = (window as unknown as { webkitSpeechRecognition?: new () => any; SpeechRecognition?: new () => any }).webkitSpeechRecognition
      ?? (window as unknown as { SpeechRecognition?: new () => any }).SpeechRecognition;
    if (!SR) {
      setVoiceNote('Voice search is not supported in this browser — please type instead.');
      return;
    }
    const rec = new SR();
    rec.lang = 'hi-IN';
    setListening(true);
    setVoiceNote('Listening… बोलिए (Hindi/English)');
    rec.onresult = (ev: any) => {
      const text = ev.results[0][0].transcript as string;
      setQuery(text);
      setResults(searchProducts(text, 30));
      setListening(false);
      setVoiceNote('');
    };
    rec.onerror = () => {
      setListening(false);
      setVoiceNote('Could not hear you — please try again or type.');
    };
    rec.onend = () => setListening(false);
    rec.start();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <form onSubmit={submit} className="relative max-w-2xl mx-auto mb-2">
        <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search products, brands… हिंदी में भी खोजें"
          className="w-full pl-11 pr-12 py-3.5 bg-white border border-gray-200 rounded-full text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
        />
        <button
          type="button"
          onClick={voiceSearch}
          aria-label="Voice search"
          title="Voice search (Hindi/English)"
          className={`absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition ${listening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          <Mic size={16} />
        </button>
      </form>
      {voiceNote && <p className="text-center text-xs text-gray-500 mb-4">{voiceNote}</p>}
      {!voiceNote && <div className="mb-4" />}

      <h1 className="text-2xl font-extrabold text-gray-900 mb-1">
        {q ? `Results for "${q}"` : 'Search the bazaar'}
      </h1>
      <p className="text-sm text-gray-500 mb-6">{results.length} products found</p>

      {results.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-6xl mb-4">🔍</div>
          <p className="font-semibold text-gray-700">No products found</p>
          <p className="text-sm mt-1">Try a different keyword, e.g. “saree”, “laptop”, “cricket”.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {results.map((p, i) => (
            <ProductCard3D key={p.id} product={p} index={i} />
          ))}
        </div>
      )}

      {!q && recent.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-extrabold text-gray-900 mb-4">
            हाल में देखे गए <span className="text-sm font-medium text-gray-400">· Recently viewed</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {recent.map((p, i) => (
              <ProductCard3D key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-500">Loading…</div>}>
      <SearchResults />
    </Suspense>
  );
}
