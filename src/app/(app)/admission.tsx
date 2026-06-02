import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconBadge } from '@/components/ui/icon-badge';
import { SectionHeader } from '@/components/ui/section-header';
import { useTheme } from '@/theme';
import {
  useInvalidateStudentQueries,
  useMyApplicationQuery,
} from '@/hooks/queries/student';
import { getApiErrorMessage } from '@/lib/api';
import { applyForSeat } from '@/lib/services/student.service';
import type { SeatApplication } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';

export default function AdmissionScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const applicationQuery = useMyApplicationQuery();
  const invalidateStudent = useInvalidateStudentQueries();
  const application = applicationQuery.data ?? null;
  const loading = applicationQuery.isLoading && applicationQuery.data === undefined;
  const { onRefresh, refreshing } = usePullToRefresh(() => applicationQuery.refetch());
  const [submitting, setSubmitting] = useState(false);

  const handleApply = async () => {
    if (!user?.academicDepartment || !user.session) {
      Alert.alert('Error', 'Profile missing academic department or session.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await applyForSeat({
        academicDepartment: user.academicDepartment,
        session: user.session,
      });
      await invalidateStudent();
      Alert.alert(
        'Submitted',
        'Your seat application was sent to DSW for review.',
      );
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const statusMeta = (status: SeatApplication['status']) => {
    if (status === 'APPROVED') {
      return {
        color: colors.success,
        tint: `${colors.success}1A`,
        icon: 'check-circle' as const,
        label: 'Approved',
      };
    }
    if (status === 'REJECTED') {
      return {
        color: colors.error,
        tint: `${colors.error}1A`,
        icon: 'cancel' as const,
        label: 'Rejected',
      };
    }
    return {
      color: colors.warning,
      tint: `${colors.warning}1A`,
      icon: 'hourglass-top' as const,
      label: 'Pending DSW Review',
    };
  };

  const appliedDate =
    application?.createdAt ?? application?.appliedAt ?? null;

  return (
    <Screen
      title="Seat Application"
      loading={loading}
      withBackButton
      onRefresh={onRefresh}
      refreshing={refreshing}
    >
      {application ? (
        <>
          {(() => {
            const meta = statusMeta(application.status);
            return (
              <Card
                style={[
                  styles.statusBanner,
                  { borderColor: meta.color, backgroundColor: colors.surfaceGlass },
                ]}>
                <View style={[styles.statusAccent, { backgroundColor: meta.color }]} />
                <IconBadge
                  name={meta.icon}
                  color={meta.color}
                  background={meta.tint}
                  size={42}
                />
                <View style={{ flex: 1, gap: 2 }}>
                  <ThemedText
                    type="overline"
                    style={{ color: meta.color, fontWeight: '700' }}>
                    {meta.label}
                  </ThemedText>
                  {application.hall ? (
                    <ThemedText type="subtitle" style={{ fontSize: 16 }}>
                      {application.hall.replace(/_/g, ' ')}
                    </ThemedText>
                  ) : (
                    <ThemedText type="small" themeColor="textMuted">
                      Hall will be assigned by DSW
                    </ThemedText>
                  )}
                  {appliedDate ? (
                    <ThemedText type="small" themeColor="textMuted">
                      Applied: {new Date(appliedDate).toLocaleDateString()}
                    </ThemedText>
                  ) : null}
                </View>
              </Card>
            );
          })()}
        </>
      ) : (
        <>
          <Card
            style={[
              styles.infoBanner,
              {
                backgroundColor: `${colors.tertiary}0D`,
                borderColor: colors.tertiary,
                borderWidth: 1,
              },
            ]}>
            <IconBadge
              name="info"
              color={colors.tertiary}
              background="transparent"
              size={32}
            />
            <ThemedText type="small" style={{ flex: 1, color: colors.textSecondary }}>
              Submit a seat request for session {user?.session ?? '—'}. You do not
              choose a hall — DSW assigns a seat based on availability after review.
            </ThemedText>
          </Card>

          <SectionHeader title="Your Details" />
          <Card style={{ gap: 8, padding: 16 }}>
            <ThemedText type="small" themeColor="textMuted">
              Department: {user?.academicDepartment ?? '—'}
            </ThemedText>
            <ThemedText type="small" themeColor="textMuted">
              Session: {user?.session ?? '—'}
            </ThemedText>
            <ThemedText type="small" themeColor="textMuted">
              Roll: {user?.rollNumber ?? '—'}
            </ThemedText>
          </Card>

          <Button
            title="Submit Application"
            loading={submitting}
            onPress={handleApply}
            style={styles.submit}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingLeft: 20,
    paddingVertical: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  statusAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  submit: {
    marginTop: 16,
  },
});
