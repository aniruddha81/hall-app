import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BlurView } from 'expo-blur';
import { NavigationBar } from 'expo-navigation-bar';
import { Tabs } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/contexts/ThemeContext';

function TabBarBackground({ resolvedTheme, tabBarColor }: { resolvedTheme: 'light' | 'dark'; tabBarColor: string }) {
  if (Platform.OS === 'ios') {
    return (
      <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
        <BlurView
          tint={resolvedTheme === 'dark' ? 'dark' : 'light'}
          intensity={75}
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: tabBarColor }]} />
      </View>
    );
  }

  return <View style={[StyleSheet.absoluteFill, { backgroundColor: tabBarColor }]} />;
}

export default function TabLayout() {
  const { colors, resolvedTheme } = useAppTheme();

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    void SystemUI.setBackgroundColorAsync(colors.tabBar);

    return () => {
      void SystemUI.setBackgroundColorAsync(colors.background);
    };
  }, [colors.background, colors.tabBar]);

  return (
    <>
      {Platform.OS === 'android' ? <NavigationBar style={colors.navBar} hidden={false} /> : null}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            borderTopColor: colors.tabBarBorder,
            borderTopWidth: StyleSheet.hairlineWidth,
            elevation: 0,
          },
          tabBarBackground: () => (
            <TabBarBackground resolvedTheme={resolvedTheme} tabBarColor={colors.tabBar} />
          ),
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dining"
        options={{
          title: 'Dining',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="restaurant" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Pay',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="payments" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={size} color={color} />,
        }}
      />
      </Tabs>
    </>
  );
}
