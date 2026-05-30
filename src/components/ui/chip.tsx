import { Pressable, StyleSheet } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
};

export function Chip({ label, selected, onPress, color }: ChipProps) {
  const { colors } = useAppTheme();
  const accent = color ?? colors.primary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? accent : colors.surfaceVariant,
          borderColor: selected ? accent : colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <ThemedText
        type="smallBold"
        style={{ color: selected ? colors.onPrimary : colors.textSecondary }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 38,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
