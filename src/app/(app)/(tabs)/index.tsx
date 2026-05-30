import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { GradientHeader } from '@/components/gradient-header';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { FeatureTile } from '@/components/ui/feature-tile';
import { ListRow } from '@/components/ui/list-row';
import { SectionHeader } from '@/components/ui/section-header';
import { StatTile } from '@/components/ui/stat-tile';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import { getApiErrorMessage } from '@/lib/api';
import { getMyActiveTokens, getTomorrowMenus } from '@/lib/services/dining.service';
import { getMyApplicationStatus } from '@/lib/services/student.service';
import type { MealMenu, MealToken } from '@/lib/types';

function formatHall(hall: string | null) {
  return hall?.replace(/_/g, ' ') ?? 'Not assigned';
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const [menus, setMenus] = useState<{ lunch: MealMenu[]; dinner: MealMenu[] }>({ lunch: [], dinner: [] });
  const [tokens, setTokens] = useState<MealToken[]>([]);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [menusRes, tokensRes] = await Promise.allSettled([getTomorrowMenus(), getMyActiveTokens()]);
        if (menusRes.status === 'fulfilled') setMenus(menusRes.value.menus);
        if (tokensRes.status === 'fulfilled') setTokens(tokensRes.value.tokens);
        try {
          const appRes = await getMyApplicationStatus();
          setApplicationStatus(appRes?.status ?? null);
        } catch {
          setApplicationStatus(null);
        }
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const allMenus = [...menus.lunch, ...menus.dinner];

  const header = (
    <GradientHeader extraBottom={40}>
      <View style={styles.headerTop}>
        <View style={{ flex: 1 }}>
          <ThemedText type="overline" style={styles.headerOverline}>
            RUET Hall Portal
          </ThemedText>
          <ThemedText type="title" style={styles.headerTitle}>
            Hi, {user?.name?.split(' ')[0] ?? 'Student'}
          </ThemedText>
        </View>
        <Avatar name={user?.name} size={52} />
      </View>

      <View style={styles.allocation}>
        <View style={styles.allocationItem}>
          <ThemedText type="small" style={styles.allocationLabel}>
            Hall
          </ThemedText>
          <ThemedText type="smallBold" style={styles.allocationValue} numberOfLines={1}>
            {formatHall(user?.hall ?? null)}
          </ThemedText>
        </View>
        <View style={styles.allocationDivider} />
        <View style={styles.allocationItem}>
          <ThemedText type="small" style={styles.allocationLabel}>
            Status
          </ThemedText>
          <ThemedText type="smallBold" style={styles.allocationValue}>
            {user?.isAllocated ? 'Allocated' : (user?.status ?? 'Pending')}
          </ThemedText>
        </View>
      </View>
    </GradientHeader>
  );

  return (
    <Screen header={header} overlap={28} loading={loading}>
      {error ? (
        <ThemedText type="small" style={{ color: colors.error }}>
          {error}
        </ThemedText>
      ) : null}

      <View style={styles.statRow}>
        <StatTile
          label="Active tokens"
          value={String(tokens.length)}
          icon="confirmation-number"
          accent={colors.accentDining}
          accentTint={colors.accentDiningTint}
        />
        <StatTile
          label="Tomorrow's meals"
          value={String(allMenus.length)}
          icon="restaurant"
          accent={colors.accentPay}
          accentTint={colors.accentPayTint}
        />
      </View>

      <SectionHeader title="Quick actions" />
      <View style={styles.grid}>
        <FeatureTile
          icon="restaurant-menu"
          label="Dining"
          caption="Book meal tokens"
          accent={colors.accentDining}
          accentTint={colors.accentDiningTint}
          onPress={() => router.push('/(app)/(tabs)/dining')}
        />
        <FeatureTile
          icon="payments"
          label="Payments"
          caption="Clear your dues"
          accent={colors.accentPay}
          accentTint={colors.accentPayTint}
          onPress={() => router.push('/(app)/(tabs)/payments')}
        />
        <FeatureTile
          icon="assignment"
          label="Admission"
          caption="Seat application"
          accent={colors.accentAdmission}
          accentTint={colors.accentAdmissionTint}
          onPress={() => router.push('/(app)/admission')}
        />
        <FeatureTile
          icon="report-problem"
          label="Report"
          caption="Damage complaint"
          accent={colors.accentDamage}
          accentTint={colors.accentDamageTint}
          onPress={() => router.push('/(app)/report-damage')}
        />
      </View>

      <SectionHeader
        title="Tomorrow's dining"
        actionLabel="Book"
        onActionPress={() => router.push('/(app)/(tabs)/dining')}
      />
      {allMenus.length > 0 ? (
        <View style={styles.list}>
          {menus.lunch.map((m) => (
            <ListRow
              key={m.id}
              icon="lunch-dining"
              accent={colors.accentDining}
              accentTint={colors.accentDiningTint}
              title={`Lunch · ${m.menuDescription}`}
              subtitle={`${m.availableTokens} tokens available`}
              trailingText={`৳${m.price}`}
            />
          ))}
          {menus.dinner.map((m) => (
            <ListRow
              key={m.id}
              icon="dinner-dining"
              accent={colors.accentAdmission}
              accentTint={colors.accentAdmissionTint}
              title={`Dinner · ${m.menuDescription}`}
              subtitle={`${m.availableTokens} tokens available`}
              trailingText={`৳${m.price}`}
            />
          ))}
        </View>
      ) : (
        <ThemedText type="small" themeColor="textMuted">
          No menus posted yet.
        </ThemedText>
      )}

      <SectionHeader title="Active tokens" />
      {tokens.length > 0 ? (
        <View style={styles.list}>
          {tokens.map((t) => (
            <ListRow
              key={t.id}
              icon="confirmation-number"
              accent={colors.accentPay}
              accentTint={colors.accentPayTint}
              title={`${t.mealType} · ${t.mealDate}`}
              subtitle={`Quantity ${t.quantity}`}
              trailingText={`৳${t.totalAmount}`}
            />
          ))}
        </View>
      ) : (
        <ThemedText type="small" themeColor="textMuted">
          No active tokens.
        </ThemedText>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerOverline: {
    color: 'rgba(255,255,255,0.75)',
  },
  headerTitle: {
    color: '#FFFFFF',
  },
  allocation: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 16,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
  },
  allocationItem: {
    flex: 1,
    gap: 2,
  },
  allocationLabel: {
    color: 'rgba(255,255,255,0.7)',
  },
  allocationValue: {
    color: '#FFFFFF',
  },
  allocationDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: Spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  list: {
    gap: Spacing.sm,
  },
});
