export const Colors = {
  // Primary palette — deep indigo & electric accent
  primary: '#5B5BD6',
  primaryDark: '#4747B8',
  primaryLight: '#7B7BE8',
  accent: '#FF6B6B',
  accentGreen: '#22C55E',

  // Backgrounds
  bg: '#0A0A14',
  bgCard: '#13131F',
  bgElevated: '#1A1A2E',
  bgInput: '#1E1E30',

  // Text
  textPrimary: '#F0F0FF',
  textSecondary: '#9898B8',
  textMuted: '#5A5A78',
  textOnPrimary: '#FFFFFF',

  // Borders
  border: '#2A2A40',
  borderFocus: '#5B5BD6',

  // Status
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',

  // Gradients (used as array stops)
  gradientPrimary: ['#5B5BD6', '#8B5CF6'],
  gradientDark: ['#0A0A14', '#13131F'],
  gradientAccent: ['#FF6B6B', '#F59E0B'],
};

export const Fonts = {
  // We'll use system fonts but apply letter-spacing and weights creatively
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    '2xl': 28,
    '3xl': 36,
    '4xl': 48,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
