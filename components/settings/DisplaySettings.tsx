'use client';
/**
 * Reduced-motion + lightweight-mode toggles (Update 13 spec §1).
 * Stored in localStorage via lib/display.
 */
import { useDisplaySettings } from '@/lib/display';
import { Zap, PauseCircle } from 'lucide-react';

export function DisplaySettings() {
  const { reduced, lightweight, toggleReduced, toggleLightweight } = useDisplaySettings();

  const row = 'flex items-center justify-between gap-4 bg-white rounded-2xl border border-gray-200 px-4 py-3 shadow-sm';

  return (
    <div className="space-y-3">
      <div className={row}>
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <PauseCircle size={18} />
          </span>
          <div>
            <p className="text-sm font-bold text-gray-900">Reduced motion · कम एनिमेशन</p>
            <p className="text-xs text-gray-500">Turns off particles, rain & 3D effects</p>
          </div>
        </div>
        <button
          onClick={toggleReduced}
          role="switch"
          aria-checked={reduced}
          aria-label="Reduced motion"
          className={`w-12 h-7 rounded-full transition ${reduced ? 'bg-emerald-500' : 'bg-gray-300'}`}
        >
          <span className={`block w-6 h-6 bg-white rounded-full shadow transition-transform mt-0.5 ${reduced ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`} />
        </button>
      </div>

      <div className={row}>
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Zap size={18} />
          </span>
          <div>
            <p className="text-sm font-bold text-gray-900">Lightweight mode · हल्का मोड</p>
            <p className="text-xs text-gray-500">For slow internet & low-end phones — fastest loading</p>
          </div>
        </div>
        <button
          onClick={toggleLightweight}
          role="switch"
          aria-checked={lightweight}
          aria-label="Lightweight mode"
          className={`w-12 h-7 rounded-full transition ${lightweight ? 'bg-emerald-500' : 'bg-gray-300'}`}
        >
          <span className={`block w-6 h-6 bg-white rounded-full shadow transition-transform mt-0.5 ${lightweight ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`} />
        </button>
      </div>
    </div>
  );
}
