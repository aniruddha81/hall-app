import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Link, Redirect } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Radius, Spacing, gradientStops } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import { getApiErrorMessage } from '@/lib/api';

export default function LoginScreen() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { colors } = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authLoading) return null;
  if (isAuthenticated) return <Redirect href="/(app)/(tabs)" />;

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <LinearGradient
          colors={gradientStops(colors)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.badge}>
          <MaterialIcons name="school" size={36} color="#FFFFFF" />
        </LinearGradient>
        <ThemedText type="title" style={styles.heroTitle}>
          Welcome back
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.heroSub}>
          Sign in to your RUET hall student portal
        </ThemedText>
      </View>

      {error ? (
        <View style={[styles.errorBox, { backgroundColor: colors.errorContainer }]}>
          <ThemedText type="small" style={{ color: colors.error }}>
            {error}
          </ThemedText>
        </View>
      ) : null}

      <View style={styles.form}>
        <Input
          label="Email"
          icon="mail"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          placeholder="student@ruet.ac.bd"
        />
        <Input
          label="Password"
          icon="lock"
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
          placeholder="Enter password"
        />
        <Button title="Sign in" loading={loading} onPress={handleLogin} />
      </View>

      <ThemedText type="small" themeColor="textSecondary" style={styles.footer}>
        Don&apos;t have an account?{' '}
        <Link href="/signup">
          <ThemedText type="link" themeColor="primary">
            Sign up
          </ThemedText>
        </Link>
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: 6,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  badge: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  heroTitle: { textAlign: 'center' },
  heroSub: { textAlign: 'center' },
  errorBox: { padding: Spacing.md, borderRadius: Radius.md },
  form: { gap: Spacing.sm },
  footer: { textAlign: 'center', marginTop: Spacing.sm },
});
