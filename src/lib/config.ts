import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Backend API base URL for the mobile app.
 * Set EXPO_PUBLIC_API_URL in root .env (e.g. http://192.168.1.5:8000/api).
 * Android emulator: use http://10.0.2.2:8000/api
 */
function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }

  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8000/api';
    }
    return 'http://localhost:8000/api';
  }

  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  return extra?.apiUrl ?? 'https://api.example.com/api';
}

export const API_BASE_URL = resolveApiBaseUrl();
