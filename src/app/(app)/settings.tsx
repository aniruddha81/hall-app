import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Alert, Pressable, StyleSheet, View, Animated } from 'react-native';
import { useRef, useState } from 'react';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionHeader } from '@/components/ui/section-header';
import { useTheme } from '@/theme';
import type { ThemePreference } from '@/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getApiErrorMessage } from '@/lib/api';
import { deleteStudentAccount, logoutAll } from '@/lib/services/auth.service';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: IconName; caption: string }[] = [
  { value: 'system', label: 'System', icon: 'brightness-auto', caption: 'Match Device' },
  { value: 'light', label: 'Light', icon: 'light-mode', caption: 'Always Bright' },
  { value: 'dark', label: 'Dark', icon: 'dark-mode', caption: 'Always Dim' },
];

function ThemeOptionCard({
  opt,
  selected,
  onPress,
}: {
  opt: typeof THEME_OPTIONS[number];
  selected: boolean;
  onPress: () => void;
}) {
  const { colors, radius, resolvedTheme } = useTheme();

  // Premium press scale animation
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.96,
      duration: 120,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();
  };

  const bg = selected
    ? (resolvedTheme === 'dark' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(5, 150, 105, 0.12)')
    : colors.surfaceGlass;
  const border = selected ? colors.primary : colors.border;
  const iconBg = selected ? colors.primary : colors.border;
  const iconCol = selected
    ? (resolvedTheme === 'dark' ? '#052E16' : '#FFFFFF')
    : colors.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      style={styles.pressableOpt}>
      <Animated.View
        style={[
          styles.themeOption,
          {
            borderColor: border,
            backgroundColor: bg,
            borderRadius: radius.xl, // 16px radius
            transform: [{ scale: scaleAnim }],
          },
        ]}>
        <View style={[styles.themeIcon, { backgroundColor: iconBg, borderRadius: radius.md }]}>
          <MaterialIcons name={opt.icon} size={20} color={iconCol} />
        </View>
        <ThemedText type="smallBold" style={{ color: selected ? colors.primary : colors.text }}>
          {opt.label}
        </ThemedText>
        <ThemedText type="small" themeColor="textMuted">
          {opt.caption}
        </ThemedText>
      </Animated.View>
    </Pressable>
  );
}

const DELETE_CONFIRM_PHRASE = 'DELETE';

export default function SettingsScreen() {
  const { logout } = useAuth();
  const { preference, setPreference, colors, spacing } = useTheme();
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const canDeleteAccount =
    deletePassword.length > 0 && deleteConfirmText === DELETE_CONFIRM_PHRASE;

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== DELETE_CONFIRM_PHRASE) {
      Alert.alert(
        'Confirmation required',
        `Type ${DELETE_CONFIRM_PHRASE} in the confirmation field to delete your account.`,
      );
      return;
    }
    if (!deletePassword) {
      Alert.alert('Password required', 'Enter your password to delete your account.');
      return;
    }

    setDeletingAccount(true);
    try {
      await deleteStudentAccount({ password: deletePassword });
      Alert.alert('Account deleted', 'Your account and data have been removed.');
      await logout();
    } catch (err) {
      Alert.alert('Could not delete account', getApiErrorMessage(err));
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleLogoutAll = async () => {
    try {
      await logoutAll();
      Alert.alert('Success', 'You have been logged out from all devices.');
      await logout();
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err));
    }
  };

  return (
    <Screen title="Settings" withBackButton>
      <SectionHeader title="Appearance" caption="Pick how the application looks" />
      <View style={[styles.themeRow, { gap: spacing.sm }]}>
        {THEME_OPTIONS.map((opt) => (
          <ThemeOptionCard
            key={opt.value}
            opt={opt}
            selected={preference === opt.value}
            onPress={() => setPreference(opt.value)}
          />
        ))}
      </View>

      <SectionHeader title="Session Management" caption="Manage where you're signed in" />
      <View style={[styles.group, { gap: spacing.md }]}>
        <Button title="Sign Out from Device" variant="outline" onPress={logout} />
        <Button title="Sign Out from All Devices" variant="destructive" onPress={handleLogoutAll} />
      </View>

      <SectionHeader title="Delete Account" caption="Permanently remove your student account" />
      <View style={[styles.group, { gap: spacing.md }]}>
        <ThemedText type="small" themeColor="textMuted">
          Enter your password and type {DELETE_CONFIRM_PHRASE} to confirm. All related
          hall data will be erased and cannot be recovered.
        </ThemedText>
        <Input
          label="Password"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
          value={deletePassword}
          onChangeText={setDeletePassword}
          editable={!deletingAccount}
        />
        <Input
          label={`Type ${DELETE_CONFIRM_PHRASE} to confirm`}
          autoCapitalize="characters"
          autoCorrect={false}
          value={deleteConfirmText}
          onChangeText={setDeleteConfirmText}
          placeholder={DELETE_CONFIRM_PHRASE}
          editable={!deletingAccount}
        />
        <Button
          title={deletingAccount ? 'Deleting…' : 'Delete My Account'}
          variant="destructive"
          disabled={deletingAccount || !canDeleteAccount}
          onPress={handleDeleteAccount}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  themeRow: {
    flexDirection: 'row',
  },
  pressableOpt: {
    flex: 1,
  },
  themeOption: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderWidth: 1.5,
  },
  themeIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  group: {
    marginTop: 4,
  },
});
