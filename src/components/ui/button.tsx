import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { Radius, Spacing, gradientStops } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

type ButtonProps = PressableProps & {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost';
  size?: 'md' | 'sm';
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  style,
  textStyle,
  ...rest
}: ButtonProps) {
  const { colors } = useAppTheme();
  const isDisabled = disabled || loading;

  const sizeStyle = size === 'sm' ? styles.sm : styles.md;
  const fontSize = size === 'sm' ? 14 : 16;

  const textColor =
    variant === 'primary' || variant === 'destructive'
      ? colors.onPrimary
      : variant === 'outline'
        ? colors.primary
        : variant === 'ghost'
          ? colors.primary
          : colors.text;

  const inner = loading ? (
    <ActivityIndicator size="small" color={textColor} />
  ) : (
    <Text style={[styles.label, { color: textColor, fontSize }, textStyle]}>{title}</Text>
  );

  if (variant === 'primary') {
    return (
      <Pressable accessibilityRole="button" disabled={isDisabled} style={style} {...rest}>
        {({ pressed }) => (
          <LinearGradient
            colors={gradientStops(colors)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.base, sizeStyle, { opacity: pressed || isDisabled ? 0.75 : 1 }]}>
            {inner}
          </LinearGradient>
        )}
      </Pressable>
    );
  }

  const bg =
    variant === 'destructive'
      ? colors.error
      : variant === 'secondary'
        ? colors.surfaceVariant
        : 'transparent';
  const borderColor = variant === 'outline' ? colors.primary : 'transparent';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyle,
        { backgroundColor: bg, borderColor, borderWidth: variant === 'outline' ? 1.5 : 0 },
        { opacity: pressed || isDisabled ? 0.7 : 1 },
        style,
      ]}
      {...rest}>
      <View style={styles.center}>{inner}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  md: { minHeight: 52 },
  sm: { minHeight: 40, paddingHorizontal: Spacing.sm },
  center: { alignItems: 'center', justifyContent: 'center' },
  label: {
    fontWeight: '700',
  },
});
