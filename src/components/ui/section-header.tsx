import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';

type SectionHeaderProps = {
  title: string;
  caption?: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function SectionHeader({ title, caption, actionLabel, onActionPress }: SectionHeaderProps) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.row}>
      <View style={styles.titleWrap}>
        <View style={[styles.accent, { backgroundColor: colors.primary }]} />
        <View>
          <ThemedText type="subtitle">{title}</ThemedText>
          {caption ? (
            <ThemedText type="small" themeColor="textSecondary">
              {caption}
            </ThemedText>
          ) : null}
        </View>
      </View>
      {actionLabel && onActionPress ? (
        <Pressable onPress={onActionPress} hitSlop={8}>
          <ThemedText type="smallBold" style={{ color: colors.primary }}>
            {actionLabel}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  accent: {
    width: 4,
    height: 22,
    borderRadius: 2,
  },
});
