/**
 * Color constants matching the CSS variables
 * These are the only colors used throughout the app
 */
export const Colors = {
  alpha: '#ffc801',      // --color-alpha
  beta: '#212529',       // --color-beta
  error: '#ef4444',      // --color-error
  good: '#51b04f',       // --color-good
  dark_gray: '#1f2326',  // --color-dark_gray
  light: '#fafafa',      // --color-light
  dark: '#171717',       // --color-dark
  card: '#ffffff',       // home feed / post cards (light)
  card_dark: '#1c1c1c',  // home feed / post cards (dark)
  card_border_dark: '#2e2e2e',
} as const;

// Light mode uses beta/light; dark mode keeps alpha accents.
export function getAccentIconColor(isDark: boolean) {
  return isDark ? Colors.alpha : Colors.beta;
}

export function getAccentFillColor(isDark: boolean) {
  return isDark ? Colors.alpha : Colors.beta;
}

export function getOnAccentTextColor(isDark: boolean) {
  return isDark ? Colors.beta : Colors.light;
}

/** Muted icon / placeholder color for inputs (maps to beta/35 or light/35). */
export function getMutedIconColor(isDark: boolean) {
  return isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';
}

export function getPlaceholderTextColor(isDark: boolean) {
  return getMutedIconColor(isDark);
}

/** Inactive tab bar icon color. */
export function getInactiveTabIconColor(isDark: boolean) {
  return isDark ? 'rgba(255,255,255,0.4)' : 'rgba(128,128,128,0.7)';
}

/** Semi-transparent overlays derived from design tokens. */
export const Overlays = {
  backdrop: 'rgba(33, 37, 41, 0.72)',
  borderLight: 'rgba(255, 255, 255, 0.12)',
  textMuted: 'rgba(33, 37, 41, 0.65)',
  textDim: 'rgba(33, 37, 41, 0.4)',
  textMutedOnDark: 'rgba(250, 250, 250, 0.65)',
  textSubtleOnDark: 'rgba(250, 250, 250, 0.6)',
  textShadow: 'rgba(0, 0, 0, 0.75)',
  modalScrim: 'rgba(0, 0, 0, 0.45)',
  disabledIcon: 'rgba(255,255,255,0.35)',
  disabledIconLight: 'rgba(0,0,0,0.3)',
} as const;
