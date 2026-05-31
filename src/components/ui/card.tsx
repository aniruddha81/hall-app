import { Animated, Platform, Pressable, StyleSheet, View, type ViewProps } from 'react-native';
import { useRef } from 'react';
import { useTheme } from '@/theme';
import { ThemedText } from '@/components/themed-text';

type CardProps = Omit<ViewProps, 'style'> & {
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  /** soft tinted surface instead of bordered surface */
  variant?: 'plain' | 'tinted' | 'glass';
  tint?: string;
  style?: any;
  children?: React.ReactNode;
};

export function Card({
  title,
  subtitle,
  onPress,
  variant = 'plain',
  tint,
  style,
  children,
  ...rest
}: CardProps) {
  const { colors, radius, shadows, resolvedTheme } = useTheme();

  // Premium press scale animation
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.timing(scaleAnim, {
      toValue: 0.97,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (!onPress) return;
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  // Determine backgrounds, borders, highlights
  let bg: string = colors.surface;
  let borderCol: string = colors.border;
  let borderWidth = 1;
  let topHighlight = 'transparent';

  if (variant === 'tinted') {
    bg = tint || (resolvedTheme === 'dark' ? 'rgba(52, 211, 153, 0.08)' : 'rgba(5, 150, 105, 0.05)');
    borderWidth = 0;
  } else if (variant === 'glass') {
    bg = colors.surfaceGlass;
    borderCol = colors.border;
    borderWidth = 1;
  } else {
    // Plain - strict spec implementation
    if (resolvedTheme === 'dark') {
      bg = '#161F1B';
      borderCol = 'rgba(255, 255, 255, 0.07)';
      topHighlight = 'rgba(52, 211, 153, 0.08)';
    } else {
      bg = '#FFFFFF';
      borderCol = 'rgba(0, 0, 0, 0.08)';
      topHighlight = 'rgba(5, 150, 105, 0.04)';
    }
  }

  const content = (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: bg,
          borderColor: borderCol,
          borderWidth,
          borderRadius: radius.xl, // 16px radius
          transform: [{ scale: scaleAnim }],
          // Elevated shadows
          ...shadows,
        },
        style,
      ]}
      {...rest}>
      {/* Top highlight bar */}
      {topHighlight !== 'transparent' && (
        <View style={[styles.highlight, { backgroundColor: topHighlight }]} />
      )}
      
      {title ? (
        <ThemedText type="subtitle" style={styles.title}>
          {title}
        </ThemedText>
      ) : null}
      {subtitle ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
          {subtitle}
        </ThemedText>
      ) : null}
      
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: colors.ripple }}
        accessibilityRole="button">
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    padding: 20, // 20-24px padding
    overflow: 'hidden',
    position: 'relative',
    gap: 8,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  title: {
    marginBottom: 2,
  },
  subtitle: {
    marginTop: -4,
    marginBottom: 4,
  },
});
