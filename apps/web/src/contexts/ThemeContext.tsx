'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  ThemeConfig,
  DEFAULT_THEME_CONFIG,
  applyThemeToElement,
} from '@nextround/shared';

type Mode = 'light' | 'dark';

interface ThemeContextValue {
  theme: Mode;
  themeConfig: ThemeConfig;
  toggleTheme: () => void;
  setTheme: (mode: Mode) => void;
  setThemeConfig: (config: ThemeConfig) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  themeConfig: DEFAULT_THEME_CONFIG,
  toggleTheme: () => {},
  setTheme: () => {},
  setThemeConfig: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Mode>('dark');
  const [themeConfig, setThemeConfigState] = useState<ThemeConfig>(DEFAULT_THEME_CONFIG);

  useEffect(() => {
    const savedMode = typeof window !== 'undefined' ? (localStorage.getItem('theme') as Mode | null) : null;
    const initialMode = (savedMode === 'light' || savedMode === 'dark') ? savedMode : 'dark';
    
    const root = document.documentElement;
    if (initialMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    applyThemeToElement(root, DEFAULT_THEME_CONFIG, initialMode);

    if (savedMode === 'light' || savedMode === 'dark') {
      requestAnimationFrame(() => {
        setThemeState(savedMode);
      });
    }
  }, []);

  const applyTheme = (newMode: Mode, config: ThemeConfig = themeConfig) => {
    setThemeState(newMode);
    const root = document.documentElement;
    if (newMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    applyThemeToElement(root, config, newMode);
    try {
      localStorage.setItem('theme', newMode);
    } catch {
      // Handle private browsing quota errors gracefully
    }
  };

  const toggleTheme = () => {
    applyTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const setTheme = (newMode: Mode) => {
    applyTheme(newMode);
  };

  const setThemeConfig = (newConfig: ThemeConfig) => {
    setThemeConfigState(newConfig);
    applyTheme(theme, newConfig);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeConfig,
        toggleTheme,
        setTheme,
        setThemeConfig,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

