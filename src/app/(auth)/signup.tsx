import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionHeader } from '@/components/ui/section-header';
import { useTheme } from '@/theme';
import { getApiErrorMessage } from '@/lib/api';
import { getAcademicSessions, studentRegister } from '@/lib/services/auth.service';
import { ACADEMIC_DEPARTMENTS, type AcademicDepartment, type AcademicSession } from '@/lib/types';

export default function SignupScreen() {
  const { colors, spacing, radius } = useTheme();
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    rollNumber: '',
    academicDepartment: '' as AcademicDepartment | '',
    session: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const [showSessionPicker, setShowSessionPicker] = useState(false);

  useEffect(() => {
    getAcademicSessions()
      .then((res) => setSessions(res.data.sessions ?? []))
      .catch(() => setSessions([]));
  }, []);

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSignup = async () => {
    setError(null);
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!form.academicDepartment || !form.session) {
      setError('Select department and session');
      return;
    }

    setLoading(true);
    try {
      await studentRegister({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        rollNumber: parseInt(form.rollNumber, 10),
        academicDepartment: form.academicDepartment,
        session: form.session,
        phone: form.phone.trim(),
      });
      router.replace('/login');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const renderPicker = (value: string, placeholder: string, open: boolean, toggle: () => void) => (
    <Pressable
      onPress={toggle}
      accessibilityRole="button"
      style={[
        styles.picker,
        {
          borderColor: open ? colors.primary : colors.border,
          backgroundColor: colors.surfaceGlass,
          borderWidth: 1,
          borderRadius: radius.md,
        },
      ]}>
      <ThemedText style={{ color: value ? colors.text : colors.textMuted }}>
        {value || placeholder}
      </ThemedText>
      <MaterialIcons name={open ? 'expand-less' : 'expand-more'} size={20} color={colors.textMuted} />
    </Pressable>
  );

  return (
    <Screen title="Create account" subtitle="Register as a RUET student">
      {error ? (
        <View style={[styles.errorBox, { backgroundColor: `${colors.error}14`, borderColor: `${colors.error}40` }]}>
          <ThemedText type="small" style={{ color: colors.error }}>
            {error}
          </ThemedText>
        </View>
      ) : null}

      <SectionHeader title="Account" />
      <View style={[styles.form, { gap: spacing.md }]}>
        <Input label="Full name" icon="person" value={form.name} onChangeText={(v) => update('name', v)} />
        <Input
          label="Email"
          icon="mail"
          autoCapitalize="none"
          keyboardType="email-address"
          value={form.email}
          onChangeText={(v) => update('email', v)}
          placeholder="student@ruet.ac.bd"
        />
        <Input
          label="Phone"
          icon="call"
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={(v) => update('phone', v)}
          placeholder="01xxxxxxxxx"
        />
        <Input
          label="Roll number"
          icon="badge"
          keyboardType="number-pad"
          value={form.rollNumber}
          onChangeText={(v) => update('rollNumber', v)}
          placeholder="e.g. 1903001"
        />
      </View>

      <SectionHeader title="Academics" />
      <View style={[styles.form, { gap: spacing.md }]}>
        <View style={{ gap: 4 }}>
          <ThemedText type="overline">Department</ThemedText>
          {renderPicker(form.academicDepartment, 'Select department', showDeptPicker, () => setShowDeptPicker((v) => !v))}
          {showDeptPicker ? (
            <View style={[styles.pickerList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {ACADEMIC_DEPARTMENTS.map((dept) => (
                <Pressable
                  key={dept}
                  onPress={() => {
                    update('academicDepartment', dept);
                    setShowDeptPicker(false);
                  }}
                  style={[styles.pickerItem, { borderBottomColor: colors.border }]}>
                  <ThemedText style={{ color: colors.text }}>{dept}</ThemedText>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <View style={{ gap: 4 }}>
          <ThemedText type="overline">Session</ThemedText>
          {renderPicker(form.session, 'Select session', showSessionPicker, () => setShowSessionPicker((v) => !v))}
          {showSessionPicker ? (
            <View style={[styles.pickerList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {sessions.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => {
                    update('session', s.label);
                    setShowSessionPicker(false);
                  }}
                  style={[styles.pickerItem, { borderBottomColor: colors.border }]}>
                  <ThemedText style={{ color: colors.text }}>{s.label}</ThemedText>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      <SectionHeader title="Security" />
      <View style={[styles.form, { gap: spacing.md }]}>
        <Input label="Password" icon="lock" secureTextEntry value={form.password} onChangeText={(v) => update('password', v)} placeholder="Min 6 characters" />
        <Input
          label="Confirm password"
          icon="lock-reset"
          secureTextEntry
          value={form.confirmPassword}
          onChangeText={(v) => update('confirmPassword', v)}
          placeholder="Repeat password"
        />
      </View>

      <Button title="Create account" loading={loading} onPress={handleSignup} style={styles.submit} />

      <ThemedText type="small" themeColor="textMuted" style={[styles.footer, { marginTop: spacing.md }]}>
        Already registered?{' '}
        <Link href="/login">
          <ThemedText type="link" themeColor="primary">
            Sign in
          </ThemedText>
        </Link>
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  form: {
    marginBottom: 8,
  },
  picker: {
    height: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerList: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  submit: {
    marginTop: 16,
  },
  footer: { textAlign: 'center' },
});
