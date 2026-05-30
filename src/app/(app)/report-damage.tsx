import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconBadge } from '@/components/ui/icon-badge';
import { Input } from '@/components/ui/input';
import { SectionHeader } from '@/components/ui/section-header';
import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { getApiErrorMessage } from '@/lib/api';
import { reportDamage } from '@/lib/services/student.service';

export default function ReportDamageScreen() {
  const { colors } = useAppTheme();
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
      setError('Photo is required');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await reportDamage({ locationDescription, assetDetails, imageUri });
      Alert.alert('Submitted', 'Damage report submitted successfully');
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
    <Screen title="Report damage" subtitle="Submit an inventory complaint" withBackButton>
      <View style={[styles.banner, { backgroundColor: colors.accentDamageTint }]}>
        <IconBadge name="report-problem" color={colors.accentDamage} background="transparent" size={36} />
        <ThemedText type="small" style={{ flex: 1, color: colors.text }}>
          Help us fix it faster — add a clear photo and location.
        </ThemedText>
      </View>

      {error ? (
        <ThemedText type="small" style={{ color: colors.error }}>
          {error}
        </ThemedText>
      ) : null}

      <SectionHeader title="Details" />
      <View style={styles.form}>
        <Input
          label="Location"
          icon="place"
          placeholder="Room 201, corridor near dining..."
          value={locationDescription}
          onChangeText={setLocationDescription}
        />
        <Input
          label="Asset details"
          icon="chair"
          placeholder="Broken chair, damaged window..."
          value={assetDetails}
          onChangeText={setAssetDetails}
          multiline
        />
      </View>

      <SectionHeader title="Photo" />
      <Pressable
        onPress={pickImage}
        style={[styles.upload, { borderColor: imageUri ? colors.accentDamage : colors.border, backgroundColor: colors.surface }]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} contentFit="cover" />
        ) : (
          <>
            <MaterialIcons name="add-a-photo" size={28} color={colors.textMuted} />
            <ThemedText type="small" themeColor="textMuted">
              Tap to attach a photo
            </ThemedText>
          </>
        )}
      </Pressable>
      {imageUri ? (
        <Button title="Change photo" variant="ghost" size="sm" onPress={pickImage} />
      ) : null}

      <Button title="Submit report" loading={submitting} onPress={handleSubmit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm + 2,
    borderRadius: Radius.lg,
  },
  form: { gap: Spacing.sm },
  upload: {
    minHeight: 160,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    height: 200,
  },
});
