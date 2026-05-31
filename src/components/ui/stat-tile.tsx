import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme';
import { ThemedText } from '@/components/themed-text';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

type StatTileProps = {
  label: string;
  value: string;
  icon: IconName;
  accent: string;
  accentTint: string;
};

export function StatTile({ label, value, icon, accent, accentTint }: StatTileProps) {
  const { colors, radius, resolvedTheme } = useTheme();

  const bg = resolvedTheme === 'dark' ? '#161F1B' : '#FFFFFF';
  const borderCol = resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <View
      style={[
        styles.tile,
        {
          backgroundColor: bg,
          borderColor: borderCol,
          borderRadius: radius.xl, // 16px radius
        },
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: accentTint, borderRadius: radius.sm + 2 }]}>
        <MaterialIcons name={icon} size={18} color={accent} />
      </View>
      <ThemedText type="title" style={[styles.value, { color: colors.text }]}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textMuted" numberOfLines={1}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    gap: 4,
  },
  iconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    lineHeight: 28,
  },
});
