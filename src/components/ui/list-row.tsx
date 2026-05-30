import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { IconBadge } from '@/components/ui/icon-badge';
import { ThemedText } from '@/components/themed-text';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

type ListRowProps = {
  icon: IconName;
  accent: string;
  accentTint: string;
  title: string;
  subtitle?: string;
  trailingText?: string;
  showChevron?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

export function ListRow({
  icon,
  accent,
  accentTint,
  title,
  subtitle,
  trailingText,
  showChevron,
  onPress,
  style,
}: ListRowProps) {
  const { colors } = useAppTheme();

  const body = (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      <IconBadge name={icon} color={accent} background={accentTint} size={42} />
      <View style={styles.texts}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {trailingText ? (
        <ThemedText type="smallBold" style={{ color: accent }}>
          {trailingText}
        </ThemedText>
      ) : null}
      {showChevron ? (
        <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
        {body}
      </Pressable>
    );
  }
  return body;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm + 2,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
});
