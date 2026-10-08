import { Section } from '@/lib/products';

const CONFIG: Record<Section, { label: string; labelHi: string; bg: string; text: string }> = {
  naya:      { label: 'NAYA',      labelHi: 'नया',     bg: '#0B3D91', text: 'white' },
  purana:    { label: 'PURANA',    labelHi: 'पुराना',   bg: '#22C55E', text: 'white' },
  clearance: { label: 'CLEARANCE', labelHi: 'क्लीयरेंस', bg: '#DC2626', text: 'white' },
  local:     { label: 'LOCAL',     labelHi: 'लोकल',    bg: '#FF6B35', text: 'white' }
};

export function SectionBadge({ section, small }: { section: Section; small?: boolean }) {
  const c = CONFIG[section];
  return (
    <span
      className={`inline-flex items-center font-bold rounded-full ${
        small ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1'
      }`}
      style={{ background: c.bg, color: c.text }}
    >
      {c.label}
    </span>
  );
}
