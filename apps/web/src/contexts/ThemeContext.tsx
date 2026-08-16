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
    const root = document.documentElement;
    root.classList.add('dark');
    applyThemeToElement(root, DEFAULT_THEME_CONFIG, 'dark');
  }, []);

  useEffect(() => {
    let mounted = true;
    apiClient
      .get<{ settings?: Record<string, unknown> }>('/candidate/settings')
      .then((res) => {
        if (!mounted) return;
        const mode = res?.settings?.theme;
        if (mode !== 'light' && mode !== 'dark') return;
        const root = document.documentElement;
        if (mode === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        applyThemeToElement(root, DEFAULT_THEME_CONFIG, mode);
        setThemeState(mode);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
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

