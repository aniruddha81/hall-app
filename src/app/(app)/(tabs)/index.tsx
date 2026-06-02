import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { GradientHeader } from '@/components/gradient-header';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { FeatureTile } from '@/components/ui/feature-tile';
import { ListRow } from '@/components/ui/list-row';
import { SectionHeader } from '@/components/ui/section-header';
import { StatTile } from '@/components/ui/stat-tile';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/theme';
import { getMyActiveTokens, getTomorrowMenus } from '@/lib/services/dining.service';
import type { MealMenu, MealToken } from '@/lib/types';
import { useScreenLoad } from '@/hooks/use-screen-load';

function formatHall(hall: string | null) {
  return hall?.replace(/_/g, ' ') ?? 'Not assigned';
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { colors, spacing, radius } = useTheme();
  const [menus, setMenus] = useState<{ lunch: MealMenu[]; dinner: MealMenu[] }>({ lunch: [], dinner: [] });
  const [tokens, setTokens] = useState<MealToken[]>([]);
  const { loading, error } = useScreenLoad(
    useCallback(async () => {
      const [menusRes, tokensRes] = await Promise.allSettled([
        getTomorrowMenus(),
        getMyActiveTokens(),
      ]);
      if (menusRes.status === 'fulfilled') setMenus(menusRes.value.menus);
      if (tokensRes.status === 'fulfilled') setTokens(tokensRes.value.tokens);
    }, []),
    [],
  );

  const allMenus = [...menus.lunch, ...menus.dinner];

  const header = (
    <GradientHeader extraBottom={40}>
      <View style={styles.headerTop}>
        <View style={{ flex: 1 }}>
          <ThemedText type="overline" style={styles.headerOverline}>
            RUET Hall Student Portal
          </ThemedText>
          <ThemedText type="title" style={styles.headerTitle}>
            Hi, {user?.name?.split(' ')[0] ?? 'Student'}
          </ThemedText>
        </View>
        <Avatar
          name={user?.name}
          uri={user?.avatarUrl}
          size={48}
          onPress={() => router.push('/(app)/(tabs)/profile')}
        />
      </View>

      {/* Glassmorphism Hall Allocation Badge */}
      <View style={[styles.allocation, { borderRadius: radius.xl }]}>
        <View style={styles.allocationItem}>
          <ThemedText type="overline" style={styles.allocationLabel}>
            My Assigned Hall
          </ThemedText>
          <ThemedText type="smallBold" style={styles.allocationValue} numberOfLines={1}>
            {formatHall(user?.hall ?? null)}
          </ThemedText>
        </View>
        <View style={styles.allocationDivider} />
        <View style={styles.allocationItem}>
          <ThemedText type="overline" style={styles.allocationLabel}>
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
        <View style={[styles.errorBox, { backgroundColor: `${colors.error}14`, borderColor: `${colors.error}30` }]}>
          <ThemedText type="small" style={{ color: colors.error }}>
            {error}
          </ThemedText>
        </View>
      ) : null}

      {/* Stats Section */}
      <View style={[styles.statRow, { gap: spacing.md }]}>
        <StatTile
          label="Active Tokens"
          value={String(tokens.length)}
          icon="confirmation-number"
          accent={colors.primary}
          accentTint={`${colors.primary}1A`}
        />
        <StatTile
          label="Tomorrow's Meals"
          value={String(allMenus.length)}
          icon="restaurant"
          accent={colors.secondary}
          accentTint={`${colors.secondary}1A`}
        />
      </View>

      {/* Quick Actions Grid */}
      <SectionHeader title="Quick Actions" />
      <View style={[styles.grid, { gap: spacing.sm }]}>
        <FeatureTile
          icon="restaurant-menu"
          label="Dining"
          caption="Book meal tokens"
          accent={colors.primary}
          accentTint={`${colors.primary}12`}
          onPress={() => router.push('/(app)/(tabs)/dining')}
        />
        <FeatureTile
          icon="payments"
          label="Payments"
          caption="Clear outstanding dues"
          accent={colors.secondary}
          accentTint={`${colors.secondary}12`}
          onPress={() => router.push('/(app)/(tabs)/payments')}
        />
        <FeatureTile
          icon="assignment"
          label="Admission"
          caption="Apply to DSW for a seat"
          accent={colors.tertiary}
          accentTint={`${colors.tertiary}12`}
          onPress={() => router.push('/(app)/admission')}
        />
        <FeatureTile
          icon="report-problem"
          label="Report Damage"
          caption="Inventory complaints"
          accent={colors.error}
          accentTint={`${colors.error}12`}
          onPress={() => router.push('/(app)/report-damage')}
        />
      </View>

      {/* Tomorrow's Dining List */}
      <SectionHeader
        title="Tomorrow's Dining Menu"
        actionLabel="Book Token"
        onActionPress={() => router.push('/(app)/(tabs)/dining')}
      />
      {allMenus.length > 0 ? (
        <View style={styles.list}>
          {menus.lunch.map((m) => (
            <ListRow
              key={m.id}
              icon="lunch-dining"
              accent={colors.primary}
              title={`Lunch · ${m.menuDescription}`}
              subtitle={`${m.availableTokens} tokens left`}
              trailingText={`৳${m.price}`}
            />
          ))}
          {menus.dinner.map((m) => (
            <ListRow
              key={m.id}
              icon="dinner-dining"
              accent={colors.secondary}
              title={`Dinner · ${m.menuDescription}`}
              subtitle={`${m.availableTokens} tokens left`}
              trailingText={`৳${m.price}`}
            />
          ))}
        </View>
      ) : (
        /* Premium Empty State */
        <View style={[styles.emptyContainer, { borderColor: colors.border, backgroundColor: colors.surfaceGlass, borderRadius: radius.xl }]}>
          <MaterialIcons name="restaurant-menu" size={28} color={colors.textMuted} />
          <ThemedText type="smallBold" style={{ color: colors.text }}>No Menu Posted Yet</ThemedText>
          <ThemedText type="small" themeColor="textMuted" style={{ textAlign: 'center' }}>
            Hall kitchen administration has not uploaded tomorrow's meal menu.
          </ThemedText>
        </View>
      )}

      {/* Active Tokens List */}
      <SectionHeader title="Active Meal Tokens" />
      {tokens.length > 0 ? (
        <View style={styles.list}>
          {tokens.map((t) => (
            <ListRow
              key={t.id}
              icon="confirmation-number"
              accent={colors.primary}
              title={`${t.mealType} · ${t.mealDate}`}
              subtitle={`Quantity: ${t.quantity}`}
              trailingText={`৳${t.totalAmount}`}
            />
          ))}
        </View>
      ) : (
        /* Premium Empty State */
        <View style={[styles.emptyContainer, { borderColor: colors.border, backgroundColor: colors.surfaceGlass, borderRadius: radius.xl }]}>
          <MaterialIcons name="confirmation-number" size={28} color={colors.textMuted} />
          <ThemedText type="smallBold" style={{ color: colors.text }}>No Active Tokens</ThemedText>
          <ThemedText type="small" themeColor="textMuted" style={{ textAlign: 'center', marginBottom: 8 }}>
            You don't have any booked meal tokens active for tomorrow.
          </ThemedText>
          <Button
            title="Book Meal Token"
            size="sm"
            variant="ghost"
            onPress={() => router.push('/(app)/(tabs)/dining')}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerOverline: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  headerTitle: {
    color: '#FFFFFF',
    marginTop: -2,
  },
  allocation: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  allocationItem: {
    flex: 1,
    gap: 2,
  },
  allocationLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  allocationValue: {
    color: '#FFFFFF',
  },
  allocationDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginHorizontal: 16,
  },
  statRow: {
    flexDirection: 'row',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  list: {},
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 6,
  },
  errorBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
});
