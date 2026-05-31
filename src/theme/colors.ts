export const colors = {
  dark: {
    background: '#090E0C',          // Background primary
    backgroundSecondary: '#0F1612', // Background secondary
    surface: '#161F1B',             // Surface elevated
    surfaceGlass: 'rgba(255, 255, 255, 0.03)',
    border: 'rgba(255, 255, 255, 0.07)', // Border subtle
    borderAccent: 'rgba(52, 211, 153, 0.25)',
    primary: '#34D399',             // Primary accent (emerald green)
    secondary: '#10B981',           // Secondary accent (deeper emerald)
    tertiary: '#6EE7B7',            // Tertiary accent (light mint)
    success: '#00FF94',
    warning: '#F59E0B',
    error: '#F87171',
    text: '#ECFDF5',                // Text primary
    textSecondary: '#6EE7B7',
    textMuted: '#374151',
    tabBarInactive: '#9CA3AF',

    // Supporting functional/navigation items
    tabBar: '#090E0C',
    tabBarBorder: 'rgba(52, 211, 153, 0.15)',
    ripple: 'rgba(52, 211, 153, 0.12)',
    statusBar: 'light' as const,
    navBar: 'light' as const,
  },
  light: {
    background: '#F0FDF4',          // Background primary
    backgroundSecondary: '#FFFFFF', // Background secondary
    surface: '#FFFFFF',             // Surface elevated
    surfaceGlass: 'rgba(0, 0, 0, 0.02)',
    border: 'rgba(0, 0, 0, 0.08)',       // Border subtle
    borderAccent: 'rgba(16, 185, 129, 0.3)',
    primary: '#059669',             // Primary accent (rich emerald)
    secondary: '#10B981',           // Secondary accent
    tertiary: '#34D399',            // Tertiary accent
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    text: '#052E16',                // Text primary
    textSecondary: '#065F46',
    textMuted: '#9CA3AF',
    tabBarInactive: '#6B7280',

    // Supporting functional/navigation items
    tabBar: '#FFFFFF',
    tabBarBorder: 'rgba(0, 0, 0, 0.08)',
    ripple: 'rgba(5, 150, 105, 0.08)',
    statusBar: 'dark' as const,
    navBar: 'dark' as const,
  },
} as const;

export type ThemeColors = typeof colors.light;
