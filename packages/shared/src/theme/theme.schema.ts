import { z } from 'zod';

/**
 * 11-shade color palette schema (50 - 950)
 */
export const ColorPaletteSchema = z.object({
  50: z.string(),
  100: z.string(),
  200: z.string(),
  300: z.string(),
  400: z.string(),
  500: z.string(),
  600: z.string(),
  700: z.string(),
  800: z.string(),
  900: z.string(),
  950: z.string(),
});

export type ColorPalette = z.infer<typeof ColorPaletteSchema>;

/**
 * 6-shade status palette schema
 */
export const StatusPaletteSchema = z.object({
  50: z.string(),
  100: z.string(),
  200: z.string(),
  500: z.string(),
  600: z.string(),
  700: z.string(),
});

export type StatusPalette = z.infer<typeof StatusPaletteSchema>;

/**
 * Semantic mode tokens for Light and Dark themes
 */
export const SemanticTokensSchema = z.object({
  background: z.string(),
  foreground: z.string(),
  textBody: z.string(),
  textMuted: z.string(),
  borderColor: z.string(),
  primary: z.string(),
  successColor: z.string(),
  warningColor: z.string(),
  dangerColor: z.string(),
  infoColor: z.string(),
  glassBackground: z.string(),
  glassBorder: z.string(),
  glassShadow: z.string(),
});

export type SemanticTokens = z.infer<typeof SemanticTokensSchema>;

/**
 * Complete Centralized Theme Schema
 */
export const ThemeConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  brand: ColorPaletteSchema,
  success: StatusPaletteSchema,
  warning: StatusPaletteSchema,
  danger: StatusPaletteSchema,
  info: StatusPaletteSchema,
  slate: ColorPaletteSchema,
  light: SemanticTokensSchema,
  dark: SemanticTokensSchema,
});

export type ThemeConfig = z.infer<typeof ThemeConfigSchema>;

/**
 * Default NextRound Brand Palettes
 */
export const DEFAULT_BRAND_PALETTE: ColorPalette = {
  50: '#fff7ed',
  100: '#ffedd5',
  200: '#fed7aa',
  300: '#fdbb74',
  400: '#fb923c',
  500: '#f97316',
  600: '#ea580c',
  700: '#c2410c',
  800: '#9a3412',
  900: '#7c2d12',
  950: '#431407',
};

export const DEFAULT_SUCCESS_PALETTE: StatusPalette = {
  50: '#f0fdf4',
  100: '#dcfce7',
  200: '#bbf7d0',
  500: '#22c55e',
  600: '#16a34a',
  700: '#15803d',
};

export const DEFAULT_WARNING_PALETTE: StatusPalette = {
  50: '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  500: '#eab308',
  600: '#ca8a04',
  700: '#a16207',
};

export const DEFAULT_DANGER_PALETTE: StatusPalette = {
  50: '#fff5f5',
  100: '#ffe3e3',
  200: '#ffc9c9',
  500: '#e03131',
  600: '#c92a2a',
  700: '#b02a37',
};

export const DEFAULT_INFO_PALETTE: StatusPalette = {
  50: '#f0fdfa',
  100: '#ccfbf1',
  200: '#99f6e4',
  500: '#14b8a6',
  600: '#0d9488',
  700: '#0f766e',
};

export const DEFAULT_SLATE_PALETTE: ColorPalette = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
  950: '#020617',
};

export const DEFAULT_LIGHT_SEMANTIC_TOKENS: SemanticTokens = {
  background: '#ffffff',
  foreground: '#0f172a',
  textBody: '#334155',
  textMuted: '#64748b',
  borderColor: 'rgba(0, 0, 0, 0.08)',
  primary: DEFAULT_BRAND_PALETTE[600],
  successColor: DEFAULT_SUCCESS_PALETTE[600],
  warningColor: DEFAULT_WARNING_PALETTE[600],
  dangerColor: DEFAULT_DANGER_PALETTE[600],
  infoColor: DEFAULT_INFO_PALETTE[600],
  glassBackground: 'rgba(255, 255, 255, 0.75)',
  glassBorder: 'rgba(0, 0, 0, 0.06)',
  glassShadow: '0 4px 30px rgba(0, 0, 0, 0.02)',
};

export const DEFAULT_DARK_SEMANTIC_TOKENS: SemanticTokens = {
  background: '#0d1117',
  foreground: '#f1f5f9',
  textBody: '#cbd5e1',
  textMuted: '#94a3b8',
  borderColor: 'rgba(255, 255, 255, 0.08)',
  primary: DEFAULT_BRAND_PALETTE[500],
  successColor: DEFAULT_SUCCESS_PALETTE[500],
  warningColor: DEFAULT_WARNING_PALETTE[500],
  dangerColor: DEFAULT_DANGER_PALETTE[500],
  infoColor: DEFAULT_INFO_PALETTE[500],
  glassBackground: 'rgba(30, 41, 59, 0.6)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
};
