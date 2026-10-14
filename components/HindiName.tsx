'use client';
/**
 * Hindi-first bilingual name: bold Hindi on top, smaller English below.
 * Used on product cards, search results, cart lines, shop cards, etc.
 */
import { cn } from '@/lib/utils';

export function HindiName({
  hi,
  en,
  size = 'card',
  className,
}: {
  hi: string;
  en: string;
  size?: 'card' | 'detail' | 'line';
  className?: string;
}) {
  if (size === 'detail') {
    return (
      <div className={className}>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">{hi}</h1>
        <p className="text-base text-gray-500 mt-1">{en}</p>
      </div>
    );
  }
  if (size === 'line') {
    return (
      <p className={cn('text-sm leading-snug', className)}>
        <span className="font-bold text-gray-900">{hi}</span>
        <span className="text-gray-400"> · </span>
        <span className="text-gray-500 text-[13px]">{en}</span>
      </p>
    );
  }
  return (
    <div className={className}>
      <h3 className="text-[13px] font-bold text-gray-900 leading-snug line-clamp-2 min-h-[2.4rem]">
        {hi}
      </h3>
      <p className="text-[11px] text-gray-500 leading-snug truncate mt-0.5">{en}</p>
    </div>
  );
}
