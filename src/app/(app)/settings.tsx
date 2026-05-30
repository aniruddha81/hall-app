import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { Radius, Spacing } from '@/constants/theme';
import type { ThemePreference } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import { getApiErrorMessage } from '@/lib/api';
import { logoutAll } from '@/lib/services/auth.service';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: IconName; caption: string }[] = [
  { value: 'system', label: 'System', icon: 'brightness-auto', caption: 'Match device' },
  { value: 'light', label: 'Light', icon: 'light-mode', caption: 'Always bright' },
  { value: 'dark', label: 'Dark', icon: 'dark-mode', caption: 'Always dim' },
];

export default function SettingsScreen() {
  const { logout } = useAuth();
  const { preference, setPreference, colors } = useAppTheme();

  const handleLogoutAll = async () => {
    try {
      await logoutAll();
      Alert.alert('Done', 'Logged out from all devices');
      await logout();
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err));
    }
  };

  return (
    <Screen title="Settings" withBackButton>
      <SectionHeader title="Appearance" caption="Pick how the app looks" />
      <View style={styles.themeRow}>
        {THEME_OPTIONS.map((opt) => {
          const selected = preference === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setPreference(opt.value)}
              style={[
                styles.themeOption,
                {
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primaryContainer : colors.surface,
                },
              ]}>
              <View
                style={[
                  styles.themeIcon,
                  { backgroundColor: selected ? colors.primary : colors.surfaceVariant },
                ]}>
                <MaterialIcons
                  name={opt.icon}
                  size={22}
                  color={selected ? colors.onPrimary : colors.textSecondary}
                />
              </View>
              <ThemedText type="smallBold" style={{ color: selected ? colors.primary : colors.text }}>
                {opt.label}
              </ThemedText>
              <ThemedText type="small" themeColor="textMuted">
                {opt.caption}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <SectionHeader title="Sessions" caption="Manage where you're signed in" />
      <View style={styles.group}>
        <Button title="Sign out" variant="outline" onPress={logout} />
        <Button title="Sign out all devices" variant="destructive" onPress={handleLogoutAll} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  themeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  themeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  group: { gap: Spacing.sm },
});
