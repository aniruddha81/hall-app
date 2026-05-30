import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'code' | 'overline';
  themeColor?: 'text' | 'textSecondary' | 'textMuted' | 'primary' | 'error' | 'success' | 'warning';
};

export function ThemedText({ style, type = 'default', themeColor = 'text', ...rest }: ThemedTextProps) {
  const { colors } = useAppTheme();

  return (
    <Text
      style={[
        { color: colors[themeColor] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'code' && styles.code,
        type === 'overline' && styles.overline,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
  },
  link: {
    fontSize: 16,
    fontWeight: '600',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: '700', default: '500' }),
    fontSize: 13,
  },
  overline: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
