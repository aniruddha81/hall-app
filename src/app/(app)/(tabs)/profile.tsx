import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { GradientHeader } from '@/components/gradient-header';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ListRow } from '@/components/ui/list-row';
import { SectionHeader } from '@/components/ui/section-header';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import { getApiErrorMessage } from '@/lib/api';
import { changePassword, updateProfile } from '@/lib/services/auth.service';

export default function ProfileScreen() {
  const { user, logout, refreshProfile } = useAuth();
  const { colors } = useAppTheme();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveProfile = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ name: name.trim(), phone: phone.trim() });
      await refreshProfile();
      Alert.alert('Saved', 'Profile updated');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    setSaving(true);
    setError(null);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      Alert.alert('Saved', 'Password changed');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const metaChips = [
    `Roll ${user?.rollNumber ?? '—'}`,
    user?.academicDepartment,
    user?.session ? `Session ${user.session}` : null,
  ].filter(Boolean) as string[];

  const header = (
    <GradientHeader extraBottom={28}>
      <View style={styles.identity}>
        <Avatar name={user?.name} size={64} />
        <View style={{ flex: 1 }}>
          <ThemedText type="subtitle" style={styles.name} numberOfLines={1}>
            {user?.name ?? 'Student'}
          </ThemedText>
          <ThemedText type="small" style={styles.email} numberOfLines={1}>
            {user?.email ?? ''}
          </ThemedText>
        </View>
      </View>
      <View style={styles.chipsRow}>
        {metaChips.map((c) => (
          <View key={c} style={styles.metaChip}>
            <ThemedText type="small" style={styles.metaChipText}>
              {c}
            </ThemedText>
          </View>
        ))}
      </View>
    </GradientHeader>
  );

  return (
    <Screen header={header} overlap={20}>
      {error ? (
        <ThemedText type="small" style={{ color: colors.error }}>
          {error}
        </ThemedText>
      ) : null}

      <SectionHeader title="Personal details" />
      <View style={styles.formGroup}>
        <Input label="Name" icon="person" value={name} onChangeText={setName} />
        <Input label="Phone" icon="call" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        <Button title="Save profile" loading={saving} onPress={saveProfile} />
      </View>

      <SectionHeader title="Security" />
      <View style={styles.formGroup}>
        <Input label="Current password" icon="lock" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} />
        <Input label="New password" icon="lock-reset" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
        <Button title="Update password" variant="outline" loading={saving} onPress={savePassword} />
      </View>

      <SectionHeader title="More" />
      <ListRow
        icon="tune"
        accent={colors.accentSettings}
        accentTint={colors.accentSettingsTint}
        title="Settings & theme"
        subtitle="System, light, dark and sessions"
        showChevron
        onPress={() => router.push('/(app)/settings')}
      />
      <ListRow
        icon="logout"
        accent={colors.error}
        accentTint={colors.errorContainer}
        title="Sign out"
        subtitle="End this session"
        onPress={logout}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  name: { color: '#FFFFFF' },
  email: { color: 'rgba(255,255,255,0.8)' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  metaChip: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  metaChipText: { color: '#FFFFFF', fontWeight: '600' },
  formGroup: { gap: Spacing.sm },
});
