import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing, gradientStops } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

type GradientHeaderProps = {
  children: React.ReactNode;
  /** extra bottom padding so overlapping content can pull up into the curve */
  extraBottom?: number;
  style?: ViewStyle;
};

/** Full-bleed gradient banner that sits under the status bar with a rounded base. */
export function GradientHeader({ children, extraBottom = 0, style }: GradientHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  return (
    <LinearGradient
      colors={gradientStops(colors)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.header,
        {
          paddingTop: insets.top + Spacing.md,
          paddingBottom: Spacing.lg + extraBottom,
        },
        style,
      ]}>
      <View style={styles.inner}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.md,
    borderBottomLeftRadius: Radius.xl + 6,
    borderBottomRightRadius: Radius.xl + 6,
  },
  inner: {
    gap: Spacing.md,
  },
});
