'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');

  // Hydrate the persisted theme after mount. Server HTML renders with the
  // default 'dark' and the first client render matches it, so hydration never
  // sees mismatched attributes. The <html> class is already applied by
  // themeInitScript in layout.tsx before hydration, so there is no flash; this
  // effect only syncs React state to it (and toggles only happen via
  // applyTheme, which sets the class directly).
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === 'light') setThemeState('light');
  }, []);

  const applyTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('theme', newTheme);
    } catch {
      // Handle private browsing quota errors gracefully
    }
  };

  const toggleTheme = () => {
    applyTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const setTheme = (newTheme: Theme) => {
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
