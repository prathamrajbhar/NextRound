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

