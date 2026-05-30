import { Platform } from 'react-native';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

/**
 * Matches web/app/globals.css (shadcn zinc + lime primary).
 * oklch values converted to hex via the same tokens as the student web portal.
 */
export const Colors = {
  light: {
    text: '#09090B',
    textSecondary: '#71717B',
    textMuted: '#9F9FA9',

    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceVariant: '#F4F4F5',
    surfaceElevated: '#FFFFFF',
    border: '#E4E4E7',

    primary: '#5EA500',
    primaryAlt: '#7CCF00',
    primaryContainer: '#EDF6DF',
    onPrimary: '#F7FEE7',

    success: '#00C950',
    successTint: 'rgba(0,201,80,0.12)',
    warning: '#F59E0B',
    warningTint: 'rgba(245,158,11,0.14)',
    error: '#E7000B',
    errorContainer: '#FEE2E2',

    accentDining: '#F59E0B',
    accentDiningTint: 'rgba(245,158,11,0.14)',
    accentPay: '#00C950',
    accentPayTint: 'rgba(0,201,80,0.14)',
    accentAdmission: '#00A63E',
    accentAdmissionTint: 'rgba(0,166,62,0.14)',
    accentDamage: '#E7000B',
    accentDamageTint: 'rgba(231,0,11,0.12)',
    accentSettings: '#5EA500',
    accentSettingsTint: 'rgba(94,165,0,0.14)',

    gradientStart: '#5EA500',
    gradientMid: '#7CCF00',
    gradientEnd: '#00C950',

    tabBar: '#F4F4F5',
    tabBarBorder: '#D4D4D8',
    shadow: '#09090B',

    statusBar: 'dark' as const,
    navBar: 'dark' as const,
  },
  dark: {
    text: '#FAFAFA',
    textSecondary: '#9F9FA9',
    textMuted: '#71717B',

    background: '#09090B',
    surface: '#18181B',
    surfaceVariant: '#27272A',
    surfaceElevated: '#18181B',
    border: '#27272A',

    primary: '#5EA500',
    primaryAlt: '#7CCF00',
    primaryContainer: '#1A2E0A',
    onPrimary: '#F7FEE7',

    success: '#00C950',
    successTint: 'rgba(0,201,80,0.16)',
    warning: '#FBBF24',
    warningTint: 'rgba(251,191,36,0.16)',
    error: '#FF6467',
    errorContainer: '#3A1214',

    accentDining: '#FBBF24',
    accentDiningTint: 'rgba(251,191,36,0.16)',
    accentPay: '#00C950',
    accentPayTint: 'rgba(0,201,80,0.16)',
    accentAdmission: '#7BF1A8',
    accentAdmissionTint: 'rgba(123,241,168,0.16)',
    accentDamage: '#FF6467',
    accentDamageTint: 'rgba(255,100,103,0.16)',
    accentSettings: '#7CCF00',
    accentSettingsTint: 'rgba(124,207,0,0.16)',

    gradientStart: '#35530E',
    gradientMid: '#5EA500',
    gradientEnd: '#7CCF00',

    tabBar: '#18181B',
    tabBarBorder: '#27272A',
    shadow: '#000000',

    statusBar: 'light' as const,
    navBar: 'light' as const,
  },
} as const;

export type AppColors = (typeof Colors)[ResolvedTheme];

/** Convenience: ordered gradient stops for the active theme. */
export function gradientStops(colors: AppColors): [string, string, string] {
  return [colors.gradientStart, colors.gradientMid, colors.gradientEnd];
}

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    mono: 'Menlo',
  },
  android: {
    sans: 'Roboto',
    mono: 'monospace',
  },
  default: {
    sans: 'System',
    mono: 'monospace',
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  full: 999,
} as const;
