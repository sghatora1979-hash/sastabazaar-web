export type Theme = {
  name: string;
  primary: string;
  accent: string;
  primaryRgb: string;
  accentRgb: string;
};

export const DAILY_THEMES: Record<number, Theme> = {
  0: { name: 'teal',    primary: '#14B8A6', accent: '#5EEAD4', primaryRgb: '20, 184, 166',  accentRgb: '94, 234, 212' },
  1: { name: 'saffron', primary: '#FF6B35', accent: '#FFD23F', primaryRgb: '255, 107, 53',  accentRgb: '255, 210, 63' },
  2: { name: 'royal',   primary: '#0B3D91', accent: '#4A90E2', primaryRgb: '11, 61, 145',   accentRgb: '74, 144, 226' },
  3: { name: 'emerald', primary: '#22C55E', accent: '#86EFAC', primaryRgb: '34, 197, 94',   accentRgb: '134, 239, 172' },
  4: { name: 'magenta', primary: '#E91E63', accent: '#F8BBD0', primaryRgb: '233, 30, 99',   accentRgb: '248, 187, 208' },
  5: { name: 'purple',  primary: '#7C3AED', accent: '#C4B5FD', primaryRgb: '124, 58, 237',  accentRgb: '196, 181, 253' },
  6: { name: 'orange',  primary: '#F97316', accent: '#FDBA74', primaryRgb: '249, 115, 22',  accentRgb: '253, 186, 116' }
};

export function getTodayTheme(date = new Date()): Theme {
  return DAILY_THEMES[date.getDay()];
}

export function getTomorrowTheme(date = new Date()): Theme {
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return DAILY_THEMES[tomorrow.getDay()];
}
