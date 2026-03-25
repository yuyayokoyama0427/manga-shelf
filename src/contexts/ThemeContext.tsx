import { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'dark' | 'light' | 'custom';

interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  customAccent: string;
  setCustomAccent: (c: string) => void;
}

const Ctx = createContext<ThemeCtx>({ theme: 'dark', setTheme: () => {}, customAccent: '#7c3aed', setCustomAccent: () => {} });
export const useTheme = () => useContext(Ctx);

const THEMES = {
  dark: {
    '--bg':        '#0d0d1a',
    '--bg-card':   '#1a1a2e',
    '--bg-nav':    'rgba(26,26,46,0.95)',
    '--text':      '#f1f5f9',
    '--text-sub':  '#94a3b8',
    '--text-muted':'#64748b',
    '--border':    'rgba(255,255,255,0.06)',
    '--input-bg':  'rgba(255,255,255,0.06)',
  },
  light: {
    '--bg':        '#f1f5f9',
    '--bg-card':   '#ffffff',
    '--bg-nav':    'rgba(255,255,255,0.95)',
    '--text':      '#0f172a',
    '--text-sub':  '#475569',
    '--text-muted':'#94a3b8',
    '--border':    'rgba(0,0,0,0.08)',
    '--input-bg':  'rgba(0,0,0,0.04)',
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme]             = useState<Theme>(() => (localStorage.getItem('theme') as Theme) ?? 'dark');
  const [customAccent, setCustomAccent] = useState(() => localStorage.getItem('accent') ?? '#7c3aed');

  useEffect(() => {
    localStorage.setItem('theme', theme);
    const vars = THEMES[theme === 'custom' ? 'dark' : theme];
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    root.style.setProperty('--accent', customAccent);
    root.style.setProperty('--accent2', theme === 'light' ? '#db2777' : '#ec4899');
    document.body.style.background = vars['--bg'];
    document.body.style.color      = vars['--text'];
  }, [theme, customAccent]);

  useEffect(() => { localStorage.setItem('accent', customAccent); }, [customAccent]);

  return <Ctx.Provider value={{ theme, setTheme, customAccent, setCustomAccent }}>{children}</Ctx.Provider>;
}
