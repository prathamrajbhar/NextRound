export const BRAND_PALETTES: Record<string, Record<string, string>> = {
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

export function applyBrandColorToElement(root: HTMLElement, colorName: string): void {
  const targetPalette = BRAND_PALETTES[colorName] || BRAND_PALETTES.orange;
  Object.entries(targetPalette).forEach(([varName, value]) => {
    root.style.setProperty(varName, value);
  });
}
