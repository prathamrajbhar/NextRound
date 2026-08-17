'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  ThemeConfig,
  DEFAULT_THEME_CONFIG,
  applyThemeToElement,
} from '@nextround/shared';
import { apiClient } from '@/lib/apiClient';

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
  }, []);

  const applyTheme = (newMode: Mode, config: ThemeConfig = themeConfig) => {
    setThemeState(newMode);
    try {
      localStorage.setItem('hireos_theme', newMode);
    } catch (e) {}
    const root = document.documentElement;
    if (newMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    applyThemeToElement(root, config, newMode);
  };

  const toggleTheme = (event?: React.MouseEvent | MouseEvent) => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';

    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    document.documentElement.classList.add('view-transitioning');

    const transition = document.startViewTransition(() => {
      applyTheme(nextTheme);
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      document.documentElement.animate(
        {
          clipPath: clipPath,
        },
        {
          duration: 450,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });

    transition.finished.finally(() => {
      document.documentElement.classList.remove('view-transitioning');
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
    const palettes: Record<string, Record<string, string>> = {
      emerald: {
        '--brand-50': '#ecfdf5',
        '--brand-100': '#d1fae5',
        '--brand-200': '#a7f3d0',
        '--brand-300': '#6ee7b7',
        '--brand-400': '#34d399',
        '--brand-500': '#10b981',
        '--brand-600': '#059669',
        '--brand-700': '#047857',
        '--brand-800': '#065f46',
        '--brand-900': '#064e3b',
        '--brand-950': '#022c22',
        '--primary': '#059669',
      },
      indigo: {
        '--brand-50': '#eef2ff',
        '--brand-100': '#e0e7ff',
        '--brand-200': '#c7d2fe',
        '--brand-300': '#a5b4fc',
        '--brand-400': '#818cf8',
        '--brand-500': '#6366f1',
        '--brand-600': '#4f46e5',
        '--brand-700': '#4338ca',
        '--brand-800': '#3730a3',
        '--brand-900': '#312e81',
        '--brand-950': '#1e1b4b',
        '--primary': '#4f46e5',
      },
      purple: {
        '--brand-50': '#faf5ff',
        '--brand-100': '#f3e8ff',
        '--brand-200': '#e9d5ff',
        '--brand-300': '#d8b4fe',
        '--brand-400': '#c084fc',
        '--brand-500': '#a855f7',
        '--brand-600': '#9333ea',
        '--brand-700': '#7e22ce',
        '--brand-800': '#6b21a8',
        '--brand-900': '#581c87',
        '--brand-950': '#3b0764',
        '--primary': '#9333ea',
      },
      orange: {
        '--brand-50': '#fff7ed',
        '--brand-100': '#ffedd5',
        '--brand-200': '#fed7aa',
        '--brand-300': '#fdbb74',
        '--brand-400': '#fb923c',
        '--brand-500': '#f97316',
        '--brand-600': '#ea580c',
        '--brand-700': '#c2410c',
        '--brand-800': '#9a3412',
        '--brand-900': '#7c2d12',
        '--brand-950': '#431407',
        '--primary': '#ea580c',
      },
    };

    const targetPalette = palettes[colorName] || palettes.orange;
    Object.entries(targetPalette).forEach(([varName, value]) => {
      root.style.setProperty(varName, value);
    });
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

