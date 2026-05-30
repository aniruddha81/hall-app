import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { GradientHeader } from '@/components/gradient-header';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { IconBadge } from '@/components/ui/icon-badge';
import { SectionHeader } from '@/components/ui/section-header';
import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { getApiErrorMessage } from '@/lib/api';
import { getMyDues, payMyDue } from '@/lib/services/student.service';
import { FINANCE_PAYMENT_METHODS, type FinancePaymentMethod, type StudentDue } from '@/lib/types';

export default function PaymentsScreen() {
  const { colors } = useAppTheme();
  const [dues, setDues] = useState<StudentDue[]>([]);
  const [totalUnpaid, setTotalUnpaid] = useState(0);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [method, setMethod] = useState<FinancePaymentMethod>('ONLINE');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getMyDues();
      setDues(res.dues.filter((d) => d.dueStatus === 'UNPAID'));
      setTotalUnpaid(res.totalUnpaid);
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

  const handlePay = async (dueId: string) => {
    setPayingId(dueId);
    setError(null);
    try {
      await payMyDue(dueId, { method, receiptUri: method === 'BANK' ? receiptUri : null });
      Alert.alert('Success', method === 'ONLINE' ? 'Complete payment in browser' : 'Payment submitted');
      setPayingId(null);
      setReceiptUri(null);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPayingId(null);
    }
  };

  const header = (
    <GradientHeader extraBottom={36}>
      <ThemedText type="overline" style={styles.headerOverline}>
        Outstanding balance
      </ThemedText>
      <View style={styles.balanceRow}>
        <ThemedText style={styles.balance}>৳{totalUnpaid}</ThemedText>
        <View style={styles.balanceBadge}>
          <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
            {dues.length} due{dues.length === 1 ? '' : 's'}
          </ThemedText>
        </View>
      </View>
      <ThemedText type="small" style={styles.headerCaption}>
        {totalUnpaid > 0 ? 'Clear your dues to stay in good standing.' : 'You are all paid up.'}
      </ThemedText>
    </GradientHeader>
  );

  return (
    <Screen header={header} overlap={24} loading={loading}>
      {error ? (
        <ThemedText type="small" style={{ color: colors.error }}>
          {error}
        </ThemedText>
      ) : null}

      <SectionHeader title="Unpaid dues" />
      {dues.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.successTint }]}>
          <IconBadge name="verified" color={colors.success} background="transparent" size={40} />
          <ThemedText type="smallBold" style={{ color: colors.success }}>
            No unpaid dues — great job!
          </ThemedText>
        </View>
      ) : (
        <View style={styles.list}>
          {dues.map((due) => {
            const open = payingId === due.id;
            return (
              <View key={due.id} style={[styles.due, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
                <View style={styles.dueHead}>
                  <IconBadge name="receipt-long" color={colors.accentPay} background={colors.accentPayTint} size={46} />
                  <View style={{ flex: 1 }}>
                    <ThemedText type="smallBold">{due.dueType}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {due.hall.replace(/_/g, ' ')}
                    </ThemedText>
                  </View>
                  <ThemedText type="subtitle" style={{ color: colors.accentPay }}>
                    ৳{due.amount}
                  </ThemedText>
                </View>

                {open ? (
                  <View style={styles.payForm}>
                    <ThemedText type="smallBold">Payment method</ThemedText>
                    <View style={styles.chips}>
                      {FINANCE_PAYMENT_METHODS.map((m) => (
                        <Chip key={m} label={m} selected={method === m} onPress={() => setMethod(m)} color={colors.accentPay} />
                      ))}
                    </View>
                    {method === 'BANK' ? (
                      <Button title={receiptUri ? 'Receipt attached ✓' : 'Upload receipt'} variant="outline" onPress={pickReceipt} />
                    ) : null}
                    <View style={styles.actions}>
                      <Button title="Cancel" variant="ghost" style={styles.flex} onPress={() => setPayingId(null)} />
                      <Button title="Pay now" style={styles.flex} onPress={() => handlePay(due.id)} />
                    </View>
                  </View>
                ) : (
                  <Button title="Pay due" onPress={() => setPayingId(due.id)} />
                )}
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerOverline: { color: 'rgba(255,255,255,0.75)' },
  headerCaption: { color: 'rgba(255,255,255,0.85)' },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  balance: { color: '#FFFFFF', fontSize: 40, fontWeight: '800', lineHeight: 46 },
  balanceBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  list: { gap: Spacing.sm },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  due: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.sm,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 1,
  },
  dueHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  payForm: { gap: Spacing.sm, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
  flex: { flex: 1 },
});
