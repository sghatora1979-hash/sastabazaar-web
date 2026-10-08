'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getTodayTheme, DAILY_THEMES, Theme } from '@/lib/theme-engine';

type Ctx = {
  theme: Theme;
  setOverride: (name: string | null) => void;
  override: string | null;
};

const ThemeContext = createContext<Ctx>(null!);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getTodayTheme());
  const [override, setOverrideState] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('sastabazaar-theme');
    if (saved && DAILY_THEMES[Number(saved)]) setOverrideState(saved);
  }, []);

  useEffect(() => {
    const active: Theme = override != null && DAILY_THEMES[Number(override)]
      ? DAILY_THEMES[Number(override)]
      : theme;

    const root = document.documentElement;
    root.style.setProperty('--primary', active.primary);
    root.style.setProperty('--accent', active.accent);
    root.style.setProperty('--primary-rgb', active.primaryRgb);
    root.style.setProperty('--accent-rgb', active.accentRgb);
    root.style.setProperty('--shadow-color', `rgba(${active.primaryRgb}, 0.3)`);
  }, [theme, override]);

  // Rotate at midnight
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const ms = midnight.getTime() - now.getTime();
    const t = setTimeout(() => setTheme(getTodayTheme()), ms);
    return () => clearTimeout(t);
  }, []);

  const setOverride = (name: string | null) => {
    if (name == null) {
      localStorage.removeItem('sastabazaar-theme');
      setOverrideState(null);
    } else {
      localStorage.setItem('sastabazaar-theme', name);
      setOverrideState(name);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setOverride, override }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
