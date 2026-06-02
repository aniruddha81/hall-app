import { router } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { setUnauthorizedHandler } from '@/lib/api';
import {
  clearAuthStorage,
  getSessionId,
  getStoredUser,
  saveUser,
} from '@/lib/auth-storage';
import { resolveRemoteImageUrl } from '@/lib/media';
import { queryClient } from '@/lib/query-client';
import { getMyProfile, logout as logoutApi, studentLogin } from '@/lib/services/auth.service';
import type { StudentData } from '@/lib/types';

function withNormalizedAvatar(user: StudentData): StudentData {
  return { ...user, avatarUrl: resolveRemoteImageUrl(user.avatarUrl) };
}

type AuthContextValue = {
  user: StudentData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setUser: (user: StudentData | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setUser = useCallback((next: StudentData | null) => {
    const normalized = next ? withNormalizedAvatar(next) : null;
    setUserState(normalized);
    if (normalized) {
      void saveUser(normalized);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Clear local state even if backend fails
    }
    await clearAuthStorage();
    queryClient.clear();
    setUserState(null);
    router.replace('/login');
  }, []);

  const refreshProfile = useCallback(async () => {
    const res = await getMyProfile();
    if (res.data.profile) {
      setUser(res.data.profile);
    }
  }, [setUser]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUserState(null);
      router.replace('/login');
    });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [sessionId, storedUser] = await Promise.all([getSessionId(), getStoredUser()]);
        if (!sessionId && !storedUser) return;

        if (storedUser) {
          setUserState(withNormalizedAvatar(storedUser));
        }

        const profileRes = await getMyProfile().catch(() => null);
        if (profileRes?.data.profile) {
          setUser(profileRes.data.profile);
        } else if (sessionId) {
          await clearAuthStorage();
          setUserState(null);
        }
      } catch {
        await clearAuthStorage();
        setUserState(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [setUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await studentLogin({ email, password });
      queryClient.clear();
      setUser(res.data.student_data);
      router.replace('/(app)/(tabs)');
    },
    [setUser],
  );

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshProfile,
      setUser,
    }),
    [user, isLoading, login, logout, refreshProfile, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
