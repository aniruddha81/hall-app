import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconBadge } from '@/components/ui/icon-badge';
import { SectionHeader } from '@/components/ui/section-header';
import { useTheme } from '@/theme';
import { getApiErrorMessage } from '@/lib/api';
import { applyForSeat, getMyApplicationStatus } from '@/lib/services/student.service';
import { HALLS, type Hall, type SeatApplication } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

export default function AdmissionScreen() {
  const { user } = useAuth();
  const { colors, spacing, radius, resolvedTheme } = useTheme();
  const [application, setApplication] = useState<SeatApplication | null>(null);
  const [selectedHall, setSelectedHall] = useState<Hall>(HALLS[0]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getMyApplicationStatus()
      .then((data) => setApplication(data))
      .catch(() => setApplication(null))
      .finally(() => setLoading(false));
  }, []);

  const handleApply = async () => {
    if (!user?.academicDepartment || !user.session) {
      Alert.alert('Error', 'Profile missing academic department or session.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await applyForSeat({
        hall: selectedHall,
        academicDepartment: user.academicDepartment,
        session: user.session,
      });
      setApplication(res.data);
      Alert.alert('Submitted', 'Your seat application was submitted successfully.');
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
      label: 'Pending Approval',
    };
  };

  return (
    <Screen title="Seat Application" loading={loading} withBackButton>
      {application ? (
        <>
          {(() => {
            const meta = statusMeta(application.status);
            return (
              <Card style={[styles.statusBanner, { borderColor: meta.color, backgroundColor: colors.surfaceGlass }]}>
                {/* Vertical accent color strip matching status */}
                <View style={[styles.statusAccent, { backgroundColor: meta.color }]} />
                
                <IconBadge name={meta.icon} color={meta.color} background={meta.tint} size={42} />
                <View style={{ flex: 1, gap: 2 }}>
                  <ThemedText type="overline" style={{ color: meta.color, fontWeight: '700' }}>
                    {meta.label}
                  </ThemedText>
                  <ThemedText type="subtitle" style={{ fontSize: 16 }}>
                    {application.hall.replace(/_/g, ' ')}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textMuted">
                    Applied: {new Date(application.appliedAt).toLocaleDateString()}
                  </ThemedText>
                </View>
              </Card>
            );
          })()}
        </>
      ) : (
        <>
          <Card style={[styles.infoBanner, { backgroundColor: `${colors.tertiary}0D`, borderColor: colors.tertiary, borderWidth: 1 }]}>
            <IconBadge name="info" color={colors.tertiary} background="transparent" size={32} />
            <ThemedText type="small" style={{ flex: 1, color: colors.textSecondary }}>
              Submit an official seat allocation request for session {user?.session ?? '—'}.
            </ThemedText>
          </Card>

          <SectionHeader title="Choose Your Hall Option" />
          <View style={[styles.hallList, { gap: spacing.sm }]}>
            {HALLS.map((hall) => {
              const selected = hall === selectedHall;
              const bg = selected
                ? (resolvedTheme === 'dark' ? 'rgba(52, 211, 153, 0.08)' : 'rgba(5, 150, 105, 0.05)')
                : colors.surfaceGlass;
              const border = selected ? colors.primary : colors.border;

              return (
                <Pressable
                  key={hall}
                  onPress={() => setSelectedHall(hall)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  style={[
                    styles.hallRow,
                    {
                      backgroundColor: bg,
                      borderColor: border,
                      borderRadius: radius.md,
                    },
                  ]}>
                  <MaterialIcons
                    name={selected ? 'radio-button-checked' : 'radio-button-unchecked'}
                    size={20}
                    color={selected ? colors.primary : colors.textMuted}
                  />
                  <ThemedText type="smallBold" style={{ flex: 1, color: colors.text }}>
                    {hall.replace(/_/g, ' ')}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

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
  hallList: {},
  hallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  submit: {
    marginTop: 16,
  },
});
