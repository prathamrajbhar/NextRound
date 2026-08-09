import {
  ThemeConfig,
  DEFAULT_BRAND_PALETTE,
  DEFAULT_SUCCESS_PALETTE,
  DEFAULT_WARNING_PALETTE,
  DEFAULT_DANGER_PALETTE,
  DEFAULT_INFO_PALETTE,
  DEFAULT_SLATE_PALETTE,
  DEFAULT_LIGHT_SEMANTIC_TOKENS,
  DEFAULT_DARK_SEMANTIC_TOKENS,
} from './theme.schema';

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  id: 'default-orange',
  name: 'NextRound Modern Orange & Slate',
  brand: DEFAULT_BRAND_PALETTE,
  success: DEFAULT_SUCCESS_PALETTE,
  warning: DEFAULT_WARNING_PALETTE,
  danger: DEFAULT_DANGER_PALETTE,
  info: DEFAULT_INFO_PALETTE,
  slate: DEFAULT_SLATE_PALETTE,
  light: DEFAULT_LIGHT_SEMANTIC_TOKENS,
  dark: DEFAULT_DARK_SEMANTIC_TOKENS,
};

export const ALTERNATE_EMERALD_THEME_CONFIG: ThemeConfig = {
  ...DEFAULT_THEME_CONFIG,
  id: 'emerald-corporate',
  name: 'Emerald Corporate',
  brand: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22',
  },
};

/**
 * Generates runtime record of CSS custom properties for light or dark mode
 * based on a ThemeConfig instance.
 */
export function generateThemeCssVariables(
  theme: ThemeConfig,
  mode: 'light' | 'dark' = 'light'
): Record<string, string> {
  const semantic = mode === 'dark' ? theme.dark : theme.light;

  const vars: Record<string, string> = {
    '--background': semantic.background,
    '--foreground': semantic.foreground,
    '--text-body': semantic.textBody,
    '--text-muted': semantic.textMuted,
    '--border-color': semantic.borderColor,
    '--primary': semantic.primary,
    '--success-color': semantic.successColor,
    '--warning-color': semantic.warningColor,
    '--danger-color': semantic.dangerColor,
    '--info-color': semantic.infoColor,
    '--glass-background': semantic.glassBackground,
    '--glass-border': semantic.glassBorder,
    '--glass-shadow': semantic.glassShadow,
  };

  // Map 11-shade brand palette to --brand-*
  Object.entries(theme.brand).forEach(([shade, value]) => {
    vars[`--brand-${shade}`] = value;
  });

  // Map status palettes
  Object.entries(theme.success).forEach(([shade, value]) => {
    vars[`--success-${shade}`] = value;
  });
  Object.entries(theme.warning).forEach(([shade, value]) => {
    vars[`--warning-${shade}`] = value;
  });
  Object.entries(theme.danger).forEach(([shade, value]) => {
    vars[`--danger-${shade}`] = value;
  });
  Object.entries(theme.info).forEach(([shade, value]) => {
    vars[`--info-${shade}`] = value;
  });

  return vars;
}

/**
 * Applies a theme's CSS variables directly to an HTML element (e.g. document.documentElement)
 */
export function applyThemeToElement(
  element: HTMLElement,
  theme: ThemeConfig,
  mode: 'light' | 'dark'
): void {
  const variables = generateThemeCssVariables(theme, mode);
  Object.entries(variables).forEach(([propertyName, value]) => {
    element.style.setProperty(propertyName, value);
  });
}
