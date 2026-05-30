import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

type FeatureTileProps = {
  icon: IconName;
  label: string;
  caption?: string;
  accent: string;
  accentTint: string;
  onPress: () => void;
};

export function FeatureTile({ icon, label, caption, accent, accentTint, onPress }: FeatureTileProps) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.88 : 1,
        },
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: accentTint }]}>
        <MaterialIcons name={icon} size={24} color={accent} />
      </View>
      <ThemedText type="smallBold" numberOfLines={1}>
        {label}
      </ThemedText>
      {caption ? (
        <ThemedText type="small" themeColor="textMuted" numberOfLines={1}>
          {caption}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: 6,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
});
