import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import { Screen } from "@/components/screen";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { IconBadge } from "@/components/ui/icon-badge";
import { SectionHeader } from "@/components/ui/section-header";
import {
  refetchDiningAfterPayment,
  useActiveMealTokensQuery,
  useTomorrowMenusQuery,
} from "@/hooks/queries/dining";
import { refetchQueries, usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { getApiErrorMessage } from "@/lib/api";
import {
  formatHallLabel,
  getHallsWithTomorrowMenus,
  getMealTypesForHall,
  getMenuForHallAndMeal,
  type MealBookingStep,
} from "@/lib/dining-booking";
import { paymentOutcomeMessage } from "@/lib/payment-gateway";
import { bookMealTokens, cancelMealToken } from "@/lib/services/dining.service";
import {
  PAYMENT_METHODS,
  type Hall,
  type MealType,
  type PaymentMethod,
} from "@/lib/types";
import { useTheme } from "@/theme";

type PaymentNotice = { type: "success" | "error"; message: string };

type MenuBookingOptions = {
  quantity: number;
  paymentMethod: PaymentMethod;
  receiptUri: string | null;
};

const DEFAULT_BOOKING: MenuBookingOptions = {
  quantity: 1,
  paymentMethod: "BKASH",
  receiptUri: null,
};

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  LUNCH: "Lunch",
  DINNER: "Dinner",
};

export default function DiningScreen() {
  const { colors, spacing, radius, resolvedTheme } = useTheme();
  const searchParams = useLocalSearchParams<{
    payment?: string;
    tran_id?: string;
  }>();
  const [bookingStep, setBookingStep] = useState<MealBookingStep>("hall");
  const [selectedHall, setSelectedHall] = useState<Hall | null>(null);
  const [bookingState, setBookingState] = useState<
    Record<string, MenuBookingOptions>
  >({});
  const [bookingMenuId, setBookingMenuId] = useState<string | null>(null);
  const [paymentNotice, setPaymentNotice] = useState<PaymentNotice | null>(null);

  const menusQuery = useTomorrowMenusQuery();
  const tokensQuery = useActiveMealTokensQuery();
  const menus = menusQuery.data?.menus ?? { lunch: [], dinner: [] };
  const hallsWithMenus = getHallsWithTomorrowMenus(menus);
  const tokens = tokensQuery.data?.tokens ?? [];

  const getBookingOptions = (menuId: string): MenuBookingOptions =>
    bookingState[menuId] ?? DEFAULT_BOOKING;

  const updateBookingOptions = (
    menuId: string,
    patch: Partial<MenuBookingOptions>,
  ) => {
    setBookingState((prev) => ({
      ...prev,
      [menuId]: { ...getBookingOptions(menuId), ...patch },
    }));
  };
  const loading =
    (menusQuery.isLoading && !menusQuery.data) ||
    (tokensQuery.isLoading && !tokensQuery.data);
  const [error, setError] = useState<string | null>(null);
  const queryError = menusQuery.error || tokensQuery.error;

  const reload = async () => {
    await refetchQueries(menusQuery.refetch, tokensQuery.refetch);
  };

  const reloadAfterPayment = useCallback(async () => {
    await refetchDiningAfterPayment(menusQuery.refetch, tokensQuery.refetch);
  }, [menusQuery.refetch, tokensQuery.refetch]);

  const { onRefresh, refreshing } = usePullToRefresh(reload);

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
    void reloadAfterPayment();
  }, [searchParams.payment, reloadAfterPayment]);

  const pickReceipt = async (menuId: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      updateBookingOptions(menuId, { receiptUri: result.assets[0].uri });
    }
  };

  const resetBookingWizard = () => {
    setBookingStep("hall");
    setSelectedHall(null);
    setBookingState({});
  };

  const selectHall = (hall: Hall) => {
    setSelectedHall(hall);
    setBookingState({});
    setBookingStep("meal");
  };

  const handleBook = async (menuId: string) => {
    const options = getBookingOptions(menuId);
    setBookingMenuId(menuId);
    setError(null);
    setPaymentNotice(null);
    try {
      const result = await bookMealTokens({
        menuId,
        quantity: options.quantity,
        paymentMethod: options.paymentMethod,
        receiptUri:
          options.paymentMethod === "BANK" ? options.receiptUri : null,
      });
      if (result.kind === "gateway") {
        setPaymentNotice({
          type: result.outcome === "success" ? "success" : "error",
          message: paymentOutcomeMessage(result.outcome),
        });
        if (result.outcome === "success") {
          await reloadAfterPayment();
        } else {
          await reload();
        }
      } else {
        Alert.alert("Success", "Meal token booked successfully");
        await reloadAfterPayment();
      }
      resetBookingWizard();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBookingMenuId(null);
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

  const renderStepIndicator = () => (
    <View style={[styles.stepRow, { gap: spacing.xs }]}>
      <ThemedText
        type="small"
        style={{
          color: bookingStep === "hall" ? colors.text : colors.textMuted,
          fontWeight: bookingStep === "hall" ? "700" : "400",
        }}
      >
        1. Hall
      </ThemedText>
      <ThemedText type="small" themeColor="textMuted">
        →
      </ThemedText>
      <ThemedText
        type="small"
        style={{
          color: bookingStep === "meal" ? colors.text : colors.textMuted,
          fontWeight: bookingStep === "meal" ? "700" : "400",
        }}
      >
        2. Meal & pay
      </ThemedText>
    </View>
  );

  const renderHallStep = () => (
    <View style={[styles.list, { gap: spacing.md }]}>
      {hallsWithMenus.map((hall) => {
        const mealTypes = getMealTypesForHall(menus, hall);
        return (
          <Pressable key={hall} onPress={() => selectHall(hall)}>
            <Card style={styles.menuCard}>
              <View style={styles.menuHead}>
                <IconBadge
                  name="apartment"
                  color={colors.primary}
                  background={`${colors.primary}1A`}
                  size={44}
                />
                <View style={{ flex: 1 }}>
                  <ThemedText type="subtitle" style={{ fontSize: 16 }}>
                    {formatHallLabel(hall)}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textMuted">
                    {mealTypes.map((t) => MEAL_TYPE_LABELS[t]).join(" & ")}{" "}
                    available
                  </ThemedText>
                </View>
                <MaterialIcons
                  name="chevron-right"
                  size={24}
                  color={colors.textMuted}
                />
              </View>
            </Card>
          </Pressable>
        );
      })}
    </View>
  );

  const renderMealStep = () => {
    if (!selectedHall) return null;
    return (
      <View style={[styles.list, { gap: spacing.md }]}>
        <Button
          title="Change hall"
          variant="ghost"
          size="sm"
          onPress={resetBookingWizard}
          style={styles.backBtn}
        />
        <ThemedText type="small" themeColor="textMuted">
          Hall: {formatHallLabel(selectedHall)}
        </ThemedText>
        {getMealTypesForHall(menus, selectedHall).map((mealType) => {
          const menu = getMenuForHallAndMeal(menus, selectedHall, mealType);
          if (!menu) return null;
          const options = getBookingOptions(menu.id);
          const isDinner = mealType === "DINNER";
          const accent = isDinner ? colors.secondary : colors.primary;
          const tint = `${accent}1A`;
          const soldOut = menu.availableTokens <= 0;
          const maxQty = Math.min(menu.availableTokens, 20);
          const isBooking = bookingMenuId === menu.id;

          return (
            <Card key={mealType} style={styles.menuCard}>
              <View style={styles.menuHead}>
                <IconBadge
                  name={isDinner ? "dinner-dining" : "lunch-dining"}
                  color={accent}
                  background={tint}
                  size={44}
                />
                <View style={{ flex: 1 }}>
                  <ThemedText type="subtitle" style={{ fontSize: 16 }}>
                    {MEAL_TYPE_LABELS[mealType]}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    themeColor="textMuted"
                    numberOfLines={2}
                  >
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

              <View style={[styles.bookForm, { gap: spacing.sm }]}>
                <ThemedText type="overline">Quantity</ThemedText>
                <View style={styles.qtyRow}>
                  <Button
                    title="−"
                    variant="outline"
                    size="sm"
                    style={styles.qtyBtn}
                    onPress={() =>
                      updateBookingOptions(menu.id, {
                        quantity: Math.max(1, options.quantity - 1),
                      })
                    }
                    disabled={options.quantity <= 1 || soldOut}
                  />
                  <ThemedText type="subtitle" style={{ paddingHorizontal: 12 }}>
                    {options.quantity}
                  </ThemedText>
                  <Button
                    title="+"
                    variant="outline"
                    size="sm"
                    style={styles.qtyBtn}
                    onPress={() =>
                      updateBookingOptions(menu.id, {
                        quantity: Math.min(maxQty, options.quantity + 1),
                      })
                    }
                    disabled={options.quantity >= maxQty || soldOut}
                  />
                </View>

                <ThemedText type="overline">Payment Method</ThemedText>
                <View style={styles.chips}>
                  {PAYMENT_METHODS.map((m) => (
                    <Chip
                      key={m}
                      label={m}
                      selected={options.paymentMethod === m}
                      onPress={() =>
                        updateBookingOptions(menu.id, {
                          paymentMethod: m,
                          receiptUri: null,
                        })
                      }
                      color={accent}
                    />
                  ))}
                </View>

                {options.paymentMethod === "BANK" ? (
                  <Button
                    title={
                      options.receiptUri
                        ? "Receipt attached ✓"
                        : "Upload bank receipt"
                    }
                    variant="outline"
                    onPress={() => pickReceipt(menu.id)}
                    style={styles.uploadBtn}
                  />
                ) : null}

                <ThemedText type="smallBold" style={{ marginTop: 4 }}>
                  Total: ৳{menu.price * options.quantity}
                </ThemedText>

                <Button
                  title={soldOut ? "Sold Out" : "Pay & Book"}
                  loading={isBooking}
                  disabled={
                    soldOut ||
                    (options.paymentMethod === "BANK" && !options.receiptUri)
                  }
                  onPress={() => handleBook(menu.id)}
                />
              </View>
            </Card>
          );
        })}
      </View>
    );
  };

  const renderBookingFlow = () => (
    <View style={{ gap: spacing.md }}>
      {renderStepIndicator()}
      {bookingStep === "hall" ? renderHallStep() : renderMealStep()}
    </View>
  );

  return (
    <Screen
      title="Dining Panel"
      subtitle="Choose hall, then pay and book lunch or dinner"
      loading={loading}
      onRefresh={onRefresh}
      refreshing={refreshing}
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

      {(error || queryError) ? (
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
            {error || queryError}
          </ThemedText>
        </View>
      ) : null}

      <SectionHeader title="Book Meal Token" />
      {hallsWithMenus.length === 0 ? (
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
        renderBookingFlow()
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
                    {formatHallLabel(t.hall)} · {t.mealType}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textMuted">
                    {t.mealDate} · Qty {t.quantity} · ৳{t.totalAmount}
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
  stepRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  backBtn: {
    alignSelf: "flex-start",
  },
});
