import { Stack } from 'expo-router';

import { AuthChrome } from '@/components/system-chrome';

export default function AuthLayout() {
  return (
    <>
      <AuthChrome />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
      </Stack>
    </>
  );
}
