import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';

type CardProps = ViewProps & {
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  /** soft tinted surface instead of bordered surface */
  variant?: 'plain' | 'tinted';
  tint?: string;
};

export function Card({ title, subtitle, onPress, variant = 'plain', tint, style, children, ...rest }: CardProps) {
  const { colors } = useAppTheme();
  const background = variant === 'tinted' && tint ? tint : colors.surface;

  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: background,
          borderColor: variant === 'tinted' ? 'transparent' : colors.border,
          shadowColor: colors.shadow,
        },
        style,
      ]}
      {...rest}>
      {title ? <ThemedText type="subtitle">{title}</ThemedText> : null}
      {subtitle ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
          {subtitle}
        </ThemedText>
      ) : null}
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.sm,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 1,
  },
  subtitle: {
    marginTop: -Spacing.xs,
  },
});
