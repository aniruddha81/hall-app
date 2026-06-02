import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { GradientHeader } from "@/components/gradient-header";
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
import { getMyDues, payMyDue } from "@/lib/services/student.service";
import {
  FINANCE_PAYMENT_METHODS,
  type FinancePaymentMethod,
  type StudentDue,
} from "@/lib/types";
import { useTheme } from "@/theme";

type PaymentNotice = { type: "success" | "error"; message: string };

export default function PaymentsScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const searchParams = useLocalSearchParams<{
    payment?: string;
    tran_id?: string;
  }>();
  const [dues, setDues] = useState<StudentDue[]>([]);
  const [totalUnpaid, setTotalUnpaid] = useState(0);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [method, setMethod] = useState<FinancePaymentMethod>("ONLINE");
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [paymentNotice, setPaymentNotice] = useState<PaymentNotice | null>(null);

  const { loading, error, setError, reload } = useScreenLoad(
    useCallback(async () => {
      const res = await getMyDues();
      setDues(res.dues.filter((d) => d.dueStatus === "UNPAID"));
      setTotalUnpaid(res.totalUnpaid);
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

  const handlePay = async (dueId: string) => {
    setPayingId(dueId);
    setError(null);
    setPaymentNotice(null);
    try {
      const result = await payMyDue(dueId, {
        method,
        receiptUri: method === "BANK" ? receiptUri : null,
      });
      if (result.kind === "gateway") {
        setPaymentNotice({
          type: result.outcome === "success" ? "success" : "error",
          message: paymentOutcomeMessage(result.outcome),
        });
      } else if (method === "BANK") {
        Alert.alert("Success", "Bank deposit submitted for verification");
      }
      setPayingId(null);
      setReceiptUri(null);
      await reload();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPayingId(null);
    }
  };

  const header = (
    <GradientHeader extraBottom={36}>
      <ThemedText type="overline" style={styles.headerOverline}>
        Outstanding Balance
      </ThemedText>
      <View style={styles.balanceRow}>
        <ThemedText
          style={[styles.balance, { fontFamily: typography.fonts.mono }]}
        >
          ৳{totalUnpaid}
        </ThemedText>
        <View style={[styles.balanceBadge, { borderRadius: radius.full }]}>
          <ThemedText
            type="smallBold"
            style={{ color: "#FFFFFF", fontSize: 12 }}
          >
            {dues.length} Outstanding Due{dues.length === 1 ? "" : "s"}
          </ThemedText>
        </View>
      </View>
      <ThemedText type="small" style={styles.headerCaption}>
        {totalUnpaid > 0
          ? "Clear outstanding semester or dining dues to stay in good standing."
          : "All clear. You have no outstanding bills."}
      </ThemedText>
    </GradientHeader>
  );

  return (
    <Screen header={header} overlap={24} loading={loading}>
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

      <View style={[styles.sectionLead, { marginTop: spacing.md }]}>
        <SectionHeader title="Unpaid Dues" />
      </View>

      {dues.length === 0 ? (
        /* Premium Centered Empty State */
        <View
          style={[
            styles.emptyContainer,
            {
              borderColor: colors.primary,
              backgroundColor: `${colors.primary}0D`,
              borderRadius: radius.xl,
            },
          ]}
        >
          <IconBadge
            name="check-circle"
            color={colors.primary}
            background="transparent"
            size={44}
          />
          <ThemedText type="subtitle" style={{ color: colors.text }}>
            No Unpaid Dues
          </ThemedText>
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={{ textAlign: "center" }}
          >
            Excellent work! You are all paid up and do not have any pending
            receipts to settle.
          </ThemedText>
        </View>
      ) : (
        <View style={[styles.list, { gap: spacing.md }]}>
          {dues.map((due) => {
            const open = payingId === due.id;
            return (
              <Card key={due.id} style={styles.dueCard}>
                <View style={styles.dueHead}>
                  <IconBadge
                    name="receipt-long"
                    color={colors.secondary}
                    background={`${colors.secondary}1A`}
                    size={44}
                  />
                  <View style={{ flex: 1 }}>
                    <ThemedText type="subtitle" style={{ fontSize: 16 }}>
                      {due.dueType}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textMuted">
                      {due.hall.replace(/_/g, " ")}
                    </ThemedText>
                  </View>
                  <ThemedText
                    type="subtitle"
                    style={[
                      styles.amountText,
                      {
                        color: colors.secondary,
                        fontFamily: typography.fonts.mono,
                      },
                    ]}
                  >
                    ৳{due.amount}
                  </ThemedText>
                </View>

                {open ? (
                  <View
                    style={[
                      styles.payForm,
                      { gap: spacing.sm, marginTop: spacing.sm },
                    ]}
                  >
                    <ThemedText type="overline">Select Payment Mode</ThemedText>
                    <View style={styles.chips}>
                      {FINANCE_PAYMENT_METHODS.map((m) => (
                        <Chip
                          key={m}
                          label={
                            m === "ONLINE" ? "ONLINE/MOBILE" : "BANK DEPOSIT"
                          }
                          selected={method === m}
                          onPress={() => setMethod(m)}
                          color={colors.secondary}
                        />
                      ))}
                    </View>

                    {method === "BANK" ? (
                      <Button
                        title={
                          receiptUri
                            ? "Receipt attached ✓"
                            : "Upload deposit slip photo"
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
                        onPress={() => setPayingId(null)}
                      />
                      <Button
                        title="Complete Payment"
                        style={styles.flex}
                        onPress={() => handlePay(due.id)}
                      />
                    </View>
                  </View>
                ) : (
                  <Button
                    title="Pay Outstanding Due"
                    onPress={() => setPayingId(due.id)}
                  />
                )}
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerOverline: { color: "rgba(255,255,255,0.7)", fontWeight: "600" },
  headerCaption: { color: "rgba(255,255,255,0.85)", marginTop: 4 },
  balanceRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  balance: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "800",
    lineHeight: 42,
    letterSpacing: -1,
  },
  balanceBadge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  sectionLead: {},
  list: {},
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 8,
  },
  dueCard: {
    paddingVertical: 18,
  },
  dueHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  amountText: {
    fontSize: 18,
    fontWeight: "700",
  },
  payForm: {},
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 4 },
  uploadBtn: { marginVertical: 6 },
  actions: { flexDirection: "row", gap: 12, marginTop: 8 },
  flex: { flex: 1 },
  errorBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
});
