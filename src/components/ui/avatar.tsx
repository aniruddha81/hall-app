import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text } from 'react-native';

import { gradientStops } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

function initials(name?: string | null) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

export function Avatar({ name, size = 56 }: { name?: string | null; size?: number }) {
  const { colors } = useAppTheme();
  return (
    <LinearGradient
      colors={gradientStops(colors)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.base, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.label, { fontSize: size * 0.36 }]}>{initials(name)}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
