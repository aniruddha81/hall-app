import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { IconBadge } from '@/components/ui/icon-badge';
import { SectionHeader } from '@/components/ui/section-header';
import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { getApiErrorMessage } from '@/lib/api';
import {
  bookMealTokens,
  cancelMealToken,
  getMyActiveTokens,
  getTomorrowMenus,
} from '@/lib/services/dining.service';
import { PAYMENT_METHODS, type MealMenu, type MealToken, type PaymentMethod } from '@/lib/types';

export default function DiningScreen() {
  const { colors } = useAppTheme();
  const [menus, setMenus] = useState<{ lunch: MealMenu[]; dinner: MealMenu[] }>({ lunch: [], dinner: [] });
  const [tokens, setTokens] = useState<MealToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingMenuId, setBookingMenuId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BKASH');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [menusRes, tokensRes] = await Promise.all([getTomorrowMenus(), getMyActiveTokens()]);
      setMenus(menusRes.menus);
      setTokens(tokensRes.tokens);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const pickReceipt = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setReceiptUri(result.assets[0].uri);
  };

  const openBooking = (menuId: string) => {
    setBookingMenuId((prev) => (prev === menuId ? null : menuId));
    setQuantity(1);
    setReceiptUri(null);
  };

  const handleBook = async (menuId: string) => {
    setSubmitting(true);
    setError(null);
    try {
      await bookMealTokens({
        menuId,
        quantity,
        paymentMethod,
        receiptUri: paymentMethod === 'BANK' ? receiptUri : null,
      });
      Alert.alert('Success', 'Meal token booked successfully');
      setBookingMenuId(null);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (tokenId: string) => {
    try {
      await cancelMealToken(tokenId);
      await load();
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err));
    }
  };

  const renderMenu = (menu: MealMenu, isDinner: boolean) => {
    const accent = isDinner ? colors.accentAdmission : colors.accentDining;
    const tint = isDinner ? colors.accentAdmissionTint : colors.accentDiningTint;
    const open = bookingMenuId === menu.id;
    const soldOut = menu.availableTokens <= 0;

    return (
      <View key={menu.id} style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
        <View style={styles.menuHead}>
          <IconBadge name={isDinner ? 'dinner-dining' : 'lunch-dining'} color={accent} background={tint} size={46} />
          <View style={{ flex: 1 }}>
            <ThemedText type="smallBold">{menu.mealType}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
              {menu.menuDescription}
            </ThemedText>
          </View>
          <View style={[styles.priceTag, { backgroundColor: tint }]}>
            <ThemedText type="smallBold" style={{ color: accent }}>
              ৳{menu.price}
            </ThemedText>
          </View>
        </View>

        <View style={styles.availRow}>
          <ThemedText type="small" themeColor="textMuted">
            {soldOut ? 'Sold out' : `${menu.availableTokens} of ${menu.totalTokens} available`}
          </ThemedText>
        </View>

        {open ? (
          <View style={styles.bookForm}>
            <ThemedText type="smallBold">Quantity</ThemedText>
            <View style={styles.qtyRow}>
              <Button title="−" variant="secondary" size="sm" style={styles.qtyBtn} onPress={() => setQuantity((q) => Math.max(1, q - 1))} />
              <ThemedText type="subtitle">{quantity}</ThemedText>
              <Button title="+" variant="secondary" size="sm" style={styles.qtyBtn} onPress={() => setQuantity((q) => q + 1)} />
            </View>

            <ThemedText type="smallBold">Payment method</ThemedText>
            <View style={styles.chips}>
              {PAYMENT_METHODS.map((m) => (
                <Chip key={m} label={m} selected={paymentMethod === m} onPress={() => setPaymentMethod(m)} color={accent} />
              ))}
            </View>

            {paymentMethod === 'BANK' ? (
              <Button title={receiptUri ? 'Receipt attached ✓' : 'Upload receipt'} variant="outline" onPress={pickReceipt} />
            ) : null}

            <View style={styles.actions}>
              <Button title="Cancel" variant="ghost" style={styles.flex} onPress={() => setBookingMenuId(null)} />
              <Button title="Confirm booking" loading={submitting} style={styles.flex} onPress={() => handleBook(menu.id)} />
            </View>
          </View>
        ) : (
          <Button title={soldOut ? 'Sold out' : 'Book token'} disabled={soldOut} onPress={() => openBooking(menu.id)} />
        )}
      </View>
    );
  };

  return (
    <Screen title="Dining" subtitle="Book tomorrow's meal tokens" loading={loading}>
      {error ? (
        <ThemedText type="small" style={{ color: colors.error }}>
          {error}
        </ThemedText>
      ) : null}

      <SectionHeader title="Tomorrow's menus" />
      {menus.lunch.length === 0 && menus.dinner.length === 0 ? (
        <ThemedText type="small" themeColor="textMuted">
          No menus posted yet.
        </ThemedText>
      ) : (
        <View style={styles.list}>
          {menus.lunch.map((m) => renderMenu(m, false))}
          {menus.dinner.map((m) => renderMenu(m, true))}
        </View>
      )}

      <SectionHeader title="Your active tokens" />
      {tokens.length === 0 ? (
        <ThemedText type="small" themeColor="textMuted">
          No active tokens.
        </ThemedText>
      ) : (
        <View style={styles.list}>
          {tokens.map((t) => (
            <View key={t.id} style={[styles.tokenRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconBadge name="confirmation-number" color={colors.accentPay} background={colors.accentPayTint} size={42} />
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold">
                  {t.mealType} · {t.mealDate}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Quantity {t.quantity} · ৳{t.totalAmount}
                </ThemedText>
              </View>
              <Button title="Cancel" variant="ghost" size="sm" textStyle={{ color: colors.error }} onPress={() => handleCancel(t.id)} />
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.sm },
  menu: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.sm,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 1,
  },
  menuHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  priceTag: { borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  availRow: { flexDirection: 'row', alignItems: 'center' },
  bookForm: { gap: Spacing.sm, marginTop: 4 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  qtyBtn: { width: 48 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
  flex: { flex: 1 },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm + 2,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
