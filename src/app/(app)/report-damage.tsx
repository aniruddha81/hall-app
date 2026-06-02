import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconBadge } from '@/components/ui/icon-badge';
import { Input } from '@/components/ui/input';
import { SectionHeader } from '@/components/ui/section-header';
import { useTheme } from '@/theme';
import { useAuth } from '@/contexts/AuthContext';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { getApiErrorMessage } from '@/lib/api';
import { reportDamage } from '@/lib/services/student.service';

export default function ReportDamageScreen() {
  const { refreshProfile } = useAuth();
  const { onRefresh, refreshing } = usePullToRefresh(refreshProfile);
  const { colors, spacing, radius } = useTheme();
  const [locationDescription, setLocationDescription] = useState('');
  const [assetDetails, setAssetDetails] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!imageUri) {
      setError('Photo attachment is required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await reportDamage({ locationDescription, assetDetails, imageUri });
      Alert.alert('Success', 'Your inventory damage report has been submitted successfully.');
      setLocationDescription('');
      setAssetDetails('');
      setImageUri(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      title="Report Damage"
      subtitle="Submit an inventory complaint"
      withBackButton
      onRefresh={onRefresh}
      refreshing={refreshing}
    >
      <Card style={[styles.banner, { backgroundColor: `${colors.error}0D`, borderColor: colors.error, borderWidth: 1 }]}>
        <IconBadge name="report-problem" color={colors.error} background="transparent" size={32} />
        <ThemedText type="small" style={{ flex: 1, color: colors.textSecondary }}>
          Help us identify and repair damages faster — attach a clear photo and precise location.
        </ThemedText>
      </Card>

      {error ? (
        <View style={[styles.errorBox, { backgroundColor: `${colors.error}14`, borderColor: `${colors.error}30` }]}>
          <ThemedText type="small" style={{ color: colors.error }}>
            {error}
          </ThemedText>
        </View>
      ) : null}

      <SectionHeader title="Complaint Details" />
      <View style={[styles.form, { gap: spacing.md }]}>
        <Input
          label="Location"
          icon="place"
          placeholder="e.g. Room 204, East Wing corridor..."
          value={locationDescription}
          onChangeText={setLocationDescription}
        />
        <Input
          label="Asset Details"
          icon="chair"
          placeholder="e.g. Broken reading table, leaking water tap..."
          value={assetDetails}
          onChangeText={setAssetDetails}
          multiline
          style={styles.multilineInput}
        />
      </View>

      <SectionHeader title="Photo Attachment" />
      <Pressable
        onPress={pickImage}
        accessibilityRole="button"
        style={[
          styles.upload,
          {
            borderColor: imageUri ? colors.primary : colors.border,
            backgroundColor: colors.surfaceGlass,
            borderRadius: radius.xl,
          },
        ]}>
        {imageUri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={[styles.preview, { borderRadius: radius.xl }]} contentFit="cover" />
            <View style={styles.previewOverlay}>
              <IconBadge name="check-circle" color="#FFFFFF" background="rgba(0,0,0,0.4)" size={36} />
            </View>
          </View>
        ) : (
          <View style={styles.uploadPlaceholder}>
            <MaterialIcons name="add-a-photo" size={26} color={colors.textMuted} />
            <ThemedText type="smallBold" style={{ color: colors.text }}>
              Tap to Attach Photo
            </ThemedText>
            <ThemedText type="small" themeColor="textMuted">
              Support formats: PNG, JPG, JPEG
            </ThemedText>
          </View>
        )}
      </Pressable>
      
      {imageUri ? (
        <Button title="Choose Different Photo" variant="ghost" size="sm" onPress={pickImage} style={styles.changeBtn} />
      ) : null}

      <Button title="Submit Damage Report" loading={submitting} onPress={handleSubmit} style={styles.submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  form: {
    marginBottom: 8,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  upload: {
    minHeight: 160,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 6,
  },
  previewContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeBtn: {
    marginTop: 4,
  },
  submit: {
    marginTop: 16,
  },
  errorBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
});
