import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { Screen } from "@/components/screen";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { IconBadge } from "@/components/ui/icon-badge";
import { SectionHeader } from "@/components/ui/section-header";
import { useScreenLoad } from "@/hooks/use-screen-load";
import { getApiErrorMessage } from "@/lib/api";
import { paymentOutcomeMessage } from "@/lib/payment-gateway";
import {
  bookMealTokens,
  cancelMealToken,
  getMyActiveTokens,
  getTomorrowMenus,
} from "@/lib/services/dining.service";
import {
  PAYMENT_METHODS,
  type MealMenu,
  type MealToken,
  type PaymentMethod,
} from "@/lib/types";
import { useTheme } from "@/theme";

type PaymentNotice = { type: "success" | "error"; message: string };

export default function DiningScreen() {
  const { colors, spacing, radius, resolvedTheme } = useTheme();
  const searchParams = useLocalSearchParams<{
    payment?: string;
    tran_id?: string;
  }>();
  const [menus, setMenus] = useState<{ lunch: MealMenu[]; dinner: MealMenu[] }>(
    { lunch: [], dinner: [] },
  );
  const [tokens, setTokens] = useState<MealToken[]>([]);
  const [bookingMenuId, setBookingMenuId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("BKASH");
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<PaymentNotice | null>(null);

  const { loading, error, setError, reload } = useScreenLoad(
    useCallback(async () => {
      const [menusRes, tokensRes] = await Promise.all([
        getTomorrowMenus(),
        getMyActiveTokens(),
      ]);
      setMenus(menusRes.menus);
      setTokens(tokensRes.tokens);
    }, []),
    [],
  );

  useEffect(() => {
    const payment = searchParams.payment;
    if (
      payment !== "success" &&
      payment !== "failed" &&
      payment !== "cancelled"
    ) {
      return;
    }
    setPaymentNotice({
      type: payment === "success" ? "success" : "error",
      message: paymentOutcomeMessage(payment),
    });
    router.setParams({ payment: undefined, tran_id: undefined });
    void reload();
  }, [searchParams.payment, reload]);

  const pickReceipt = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0])
      setReceiptUri(result.assets[0].uri);
  };

  const openBooking = (menuId: string) => {
    setBookingMenuId((prev) => (prev === menuId ? null : menuId));
    setQuantity(1);
    setReceiptUri(null);
  };

  const handleBook = async (menuId: string) => {
    setSubmitting(true);
    setError(null);
    setPaymentNotice(null);
    try {
      const result = await bookMealTokens({
        menuId,
        quantity,
        paymentMethod,
        receiptUri: paymentMethod === "BANK" ? receiptUri : null,
      });
      if (result.kind === "gateway") {
        setPaymentNotice({
          type: result.outcome === "success" ? "success" : "error",
          message: paymentOutcomeMessage(result.outcome),
        });
      } else {
        Alert.alert("Success", "Meal token booked successfully");
      }
      setBookingMenuId(null);
      await reload();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (tokenId: string) => {
    try {
      await cancelMealToken(tokenId);
      await reload();
    } catch (err) {
      Alert.alert("Error", getApiErrorMessage(err));
    }
  };

  const renderMenu = (menu: MealMenu, isDinner: boolean) => {
    const accent = isDinner ? colors.secondary : colors.primary;
    const tint = `${accent}1A`;
    const open = bookingMenuId === menu.id;
    const soldOut = menu.availableTokens <= 0;

    return (
      <Card key={menu.id} style={styles.menuCard}>
        <View style={styles.menuHead}>
          <IconBadge
            name={isDinner ? "dinner-dining" : "lunch-dining"}
            color={accent}
            background={tint}
            size={44}
          />
          <View style={{ flex: 1 }}>
            <ThemedText type="subtitle" style={{ fontSize: 16 }}>
              {menu.mealType}
            </ThemedText>
            <ThemedText type="small" themeColor="textMuted" numberOfLines={2}>
              {menu.menuDescription}
            </ThemedText>
          </View>
          <View
            style={[
              styles.priceTag,
              { backgroundColor: tint, borderRadius: radius.full },
            ]}
          >
            <ThemedText type="smallBold" style={{ color: accent }}>
              ৳{menu.price}
            </ThemedText>
          </View>
        </View>

        <View style={styles.availRow}>
          <ThemedText type="small" themeColor="textMuted">
            {soldOut
              ? "Sold out"
              : `${menu.availableTokens} of ${menu.totalTokens} tokens available`}
          </ThemedText>
        </View>

        {open ? (
          <View style={[styles.bookForm, { gap: spacing.sm }]}>
            <ThemedText type="overline">Select Quantity</ThemedText>
            <View style={styles.qtyRow}>
              <Button
                title="−"
                variant="outline"
                size="sm"
                style={styles.qtyBtn}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              />
              <ThemedText type="subtitle" style={{ paddingHorizontal: 12 }}>
                {quantity}
              </ThemedText>
              <Button
                title="+"
                variant="outline"
                size="sm"
                style={styles.qtyBtn}
                onPress={() => setQuantity((q) => q + 1)}
              />
            </View>

            <ThemedText type="overline">Payment Method</ThemedText>
            <View style={styles.chips}>
              {PAYMENT_METHODS.map((m) => (
                <Chip
                  key={m}
                  label={m}
                  selected={paymentMethod === m}
                  onPress={() => setPaymentMethod(m)}
                  color={accent}
                />
              ))}
            </View>

            {paymentMethod === "BANK" ? (
              <Button
                title={
                  receiptUri ? "Receipt attached ✓" : "Upload bank receipt"
                }
                variant="outline"
                onPress={pickReceipt}
                style={styles.uploadBtn}
              />
            ) : null}

            <View style={styles.actions}>
              <Button
                title="Cancel"
                variant="ghost"
                style={styles.flex}
                onPress={() => setBookingMenuId(null)}
              />
              <Button
                title="Confirm Booking"
                loading={submitting}
                style={styles.flex}
                onPress={() => handleBook(menu.id)}
              />
            </View>
          </View>
        ) : (
          <Button
            title={soldOut ? "Sold Out" : "Book Meal Token"}
            disabled={soldOut}
            onPress={() => openBooking(menu.id)}
          />
        )}
      </Card>
    );
  };

  return (
    <Screen
      title="Dining Panel"
      subtitle="Book tomorrow's meal tokens"
      loading={loading}
    >
      {paymentNotice ? (
        <View
          style={[
            styles.errorBox,
            {
              backgroundColor:
                paymentNotice.type === "success"
                  ? `${colors.success}14`
                  : `${colors.error}14`,
              borderColor:
                paymentNotice.type === "success"
                  ? `${colors.success}30`
                  : `${colors.error}30`,
            },
          ]}
        >
          <ThemedText
            type="small"
            style={{
              color:
                paymentNotice.type === "success"
                  ? colors.success
                  : colors.error,
            }}
          >
            {paymentNotice.message}
          </ThemedText>
        </View>
      ) : null}

      {error ? (
        <View
          style={[
            styles.errorBox,
            {
              backgroundColor: `${colors.error}14`,
              borderColor: `${colors.error}30`,
            },
          ]}
        >
          <ThemedText type="small" style={{ color: colors.error }}>
            {error}
          </ThemedText>
        </View>
      ) : null}

      <SectionHeader title="Available Menus" />
      {menus.lunch.length === 0 && menus.dinner.length === 0 ? (
        /* Centered empty state */
        <View
          style={[
            styles.emptyContainer,
            {
              borderColor: colors.border,
              backgroundColor: colors.surfaceGlass,
              borderRadius: radius.xl,
            },
          ]}
        >
          <MaterialIcons
            name="restaurant-menu"
            size={32}
            color={colors.textMuted}
          />
          <ThemedText type="smallBold" style={{ color: colors.text }}>
            No Menus Posted
          </ThemedText>
          <ThemedText
            type="small"
            themeColor="textMuted"
            style={{ textAlign: "center" }}
          >
            No menus are currently posted for tomorrow's dining schedule.
          </ThemedText>
        </View>
      ) : (
        <View style={[styles.list, { gap: spacing.md }]}>
          {menus.lunch.map((m) => renderMenu(m, false))}
          {menus.dinner.map((m) => renderMenu(m, true))}
        </View>
      )}

      <SectionHeader title="Your Active Bookings" />
      {tokens.length === 0 ? (
        /* Centered empty state */
        <View
          style={[
            styles.emptyContainer,
            {
              borderColor: colors.border,
              backgroundColor: colors.surfaceGlass,
              borderRadius: radius.xl,
            },
          ]}
        >
          <MaterialIcons
            name="confirmation-number"
            size={32}
            color={colors.textMuted}
          />
          <ThemedText type="smallBold" style={{ color: colors.text }}>
            No Active Bookings
          </ThemedText>
          <ThemedText
            type="small"
            themeColor="textMuted"
            style={{ textAlign: "center" }}
          >
            You haven't booked any meal tokens yet.
          </ThemedText>
        </View>
      ) : (
        <View style={[styles.list, { gap: spacing.md }]}>
          {tokens.map((t) => (
            <Card key={t.id} style={styles.tokenCard}>
              <View style={styles.tokenRow}>
                <IconBadge
                  name="confirmation-number"
                  color={colors.primary}
                  background={`${colors.primary}1A`}
                  size={40}
                />
                <View style={{ flex: 1 }}>
                  <ThemedText type="subtitle" style={{ fontSize: 15 }}>
                    {t.mealType} · {t.mealDate}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textMuted">
                    Quantity: {t.quantity} · Total: ৳{t.totalAmount}
                  </ThemedText>
                </View>
                <Button
                  title="Cancel"
                  variant="ghost"
                  size="sm"
                  textStyle={{ color: colors.error }}
                  onPress={() => handleCancel(t.id)}
                />
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {},
  menuCard: {
    paddingVertical: 18,
  },
  menuHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  priceTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  availRow: {
    marginVertical: 4,
  },
  bookForm: {
    marginTop: 8,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 4,
  },
  qtyBtn: {
    width: 40,
    height: 40,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 4,
  },
  uploadBtn: {
    marginVertical: 6,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  flex: {
    flex: 1,
  },
  tokenCard: {
    padding: 12,
  },
  tokenRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 6,
  },
  errorBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
});
