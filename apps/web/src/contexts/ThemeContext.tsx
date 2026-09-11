'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  ThemeConfig,
  DEFAULT_THEME_CONFIG,
  applyThemeToElement,
} from '@nextround/shared';
import { apiClient } from '@/lib/apiClient';
import { applyBrandColorToElement } from './themePalettes';
import { runThemeViewTransition } from './themeTransition';

type Mode = 'light' | 'dark';

interface ThemeContextValue {
  theme: Mode;
  themeConfig: ThemeConfig;
  toggleTheme: (event?: React.MouseEvent | MouseEvent) => void;
  setTheme: (mode: Mode) => void;
  setThemeConfig: (config: ThemeConfig) => void;
  setBrandColor: (colorName: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  themeConfig: DEFAULT_THEME_CONFIG,
  toggleTheme: () => {},
  setTheme: () => {},
  setThemeConfig: () => {},
  setBrandColor: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Mode>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'dark';
  });
  const [themeConfig, setThemeConfigState] = useState<ThemeConfig>(DEFAULT_THEME_CONFIG);

  const applyTheme = useCallback((newMode: Mode, config: ThemeConfig = themeConfig) => {
    setThemeState(newMode);
    try {
      localStorage.setItem('hireos_theme', newMode);
    } catch {
      // Ignored: non-blocking storage
    }
    const root = document.documentElement;
    if (newMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    applyThemeToElement(root, config, newMode);
  }, [themeConfig]);

  useEffect(() => {
    const root = document.documentElement;
    const isDark = root.classList.contains('dark');
    const mode: Mode = isDark ? 'dark' : 'light';
    setThemeState(mode);
    applyThemeToElement(root, DEFAULT_THEME_CONFIG, mode);
  }, []);

  useEffect(() => {
    let mounted = true;
    apiClient
      .get<{ settings?: Record<string, unknown> }>('/candidate/settings')
      .then((res) => {
        if (!mounted) return;
        const mode = res?.settings?.theme;
        if (mode !== 'light' && mode !== 'dark') return;
        applyTheme(mode);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [applyTheme]);

  const toggleTheme = (event?: React.MouseEvent | MouseEvent) => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    runThemeViewTransition(event, () => {
      applyTheme(nextTheme);
    });
  };

  const setTheme = (newMode: Mode) => {
    applyTheme(newMode);
  };

  const setThemeConfig = (newConfig: ThemeConfig) => {
    setThemeConfigState(newConfig);
    applyTheme(theme, newConfig);
  };

  const setBrandColor = (colorName: string) => {
    const root = document.documentElement;
    applyBrandColorToElement(root, colorName);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeConfig,
        toggleTheme,
        setTheme,
        setThemeConfig,
        setBrandColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
