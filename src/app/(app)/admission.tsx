import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconBadge } from '@/components/ui/icon-badge';
import { SectionHeader } from '@/components/ui/section-header';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import { getApiErrorMessage } from '@/lib/api';
import { applyForSeat, getMyApplicationStatus } from '@/lib/services/student.service';
import { HALLS, type Hall, type SeatApplication } from '@/lib/types';

export default function AdmissionScreen() {
  const { user } = useAuth();
  const { colors } = useAppTheme();
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
      Alert.alert('Error', 'Profile missing department or session');
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
      Alert.alert('Submitted', 'Your seat application was submitted');
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const statusMeta = (status: SeatApplication['status']) => {
    if (status === 'APPROVED') return { color: colors.success, tint: colors.successTint, icon: 'check-circle' as const };
    if (status === 'REJECTED') return { color: colors.error, tint: colors.errorContainer, icon: 'cancel' as const };
    return { color: colors.warning, tint: colors.warningTint, icon: 'hourglass-top' as const };
  };

  return (
    <Screen title="Seat application" loading={loading} withBackButton>
      {application ? (
        <>
          {(() => {
            const meta = statusMeta(application.status);
            return (
              <View style={[styles.statusBanner, { backgroundColor: meta.tint }]}>
                <IconBadge name={meta.icon} color={meta.color} background="rgba(255,255,255,0.5)" size={48} />
                <View style={{ flex: 1 }}>
                  <ThemedText type="overline" style={{ color: meta.color }}>
                    Application {application.status}
                  </ThemedText>
                  <ThemedText type="subtitle">{application.hall.replace(/_/g, ' ')}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Applied {new Date(application.appliedAt).toLocaleDateString()}
                  </ThemedText>
                </View>
              </View>
            );
          })()}
        </>
      ) : (
        <>
          <View style={[styles.infoBanner, { backgroundColor: colors.accentAdmissionTint }]}>
            <IconBadge name="info" color={colors.accentAdmission} background="transparent" size={36} />
            <ThemedText type="small" style={{ flex: 1, color: colors.text }}>
              Apply for hall seat allocation for session {user?.session ?? '—'}.
            </ThemedText>
          </View>

          <SectionHeader title="Choose your hall" />
          <View style={styles.hallList}>
            {HALLS.map((hall) => {
              const selected = hall === selectedHall;
              return (
                <Pressable
                  key={hall}
                  onPress={() => setSelectedHall(hall)}
                  style={[
                    styles.hallRow,
                    {
                      backgroundColor: selected ? colors.accentAdmissionTint : colors.surface,
                      borderColor: selected ? colors.accentAdmission : colors.border,
                    },
                  ]}>
                  <MaterialIcons
                    name={selected ? 'radio-button-checked' : 'radio-button-unchecked'}
                    size={22}
                    color={selected ? colors.accentAdmission : colors.textMuted}
                  />
                  <ThemedText type="smallBold" style={{ flex: 1 }}>
                    {hall.replace(/_/g, ' ')}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <Button title="Submit application" loading={submitting} onPress={handleApply} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm + 2,
    borderRadius: Radius.lg,
  },
  hallList: { gap: Spacing.sm },
  hallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
});
