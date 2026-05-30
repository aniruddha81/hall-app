import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  icon?: IconName;
  containerStyle?: ViewStyle;
};

export function Input({
  label,
  error,
  icon,
  containerStyle,
  style,
  secureTextEntry,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const { colors } = useAppTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secureTextEntry);

  const borderColor = error ? colors.error : focused ? colors.primary : colors.border;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <ThemedText type="smallBold" themeColor="textSecondary">
          {label}
        </ThemedText>
      ) : null}
      <View
        style={[
          styles.field,
          { backgroundColor: colors.surface, borderColor, borderWidth: focused ? 1.5 : 1 },
        ]}>
        {icon ? <MaterialIcons name={icon} size={20} color={colors.textMuted} /> : null}
        <TextInput
          placeholderTextColor={colors.textMuted}
          secureTextEntry={hidden}
          style={[styles.input, { color: colors.text }, style]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {secureTextEntry ? (
          <Pressable onPress={() => setHidden((v) => !v)} hitSlop={8}>
            <MaterialIcons
              name={hidden ? 'visibility-off' : 'visibility'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <ThemedText type="small" style={{ color: colors.error }}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  field: {
    minHeight: 52,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.sm,
  },
});
