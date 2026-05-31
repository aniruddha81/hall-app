import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/theme';
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
  const { colors, radius, resolvedTheme } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secureTextEntry);

  // Focus glow animation
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = (e: any) => {
    setFocused(true);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setFocused(false);
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onBlur?.(e);
  };

  // Premium specs:
  // - Dark: #0F1612 bg, border rgba(255,255,255,0.1), focus border #34D399
  // - Light: #F9FAFB bg, border rgba(0,0,0,0.12), focus border #059669
  // - Both: 52px height, 10px radius (radius.md is 10px)
  const bg = resolvedTheme === 'dark' ? '#0F1612' : '#F9FAFB';
  const defaultBorder = resolvedTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)';
  const activeBorder = resolvedTheme === 'dark' ? '#34D399' : '#059669';

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? colors.error : defaultBorder, error ? colors.error : activeBorder],
  });

  const leftBarWidth = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 3],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <ThemedText type="overline" style={styles.label}>
          {label}
        </ThemedText>
      ) : null}
      <Animated.View
        style={[
          styles.field,
          {
            backgroundColor: bg,
            borderColor: borderColor,
            borderWidth: 1,
            borderRadius: radius.md, // 10px radius
          },
        ]}>
        {/* Left Focus Glow Accent Bar */}
        <Animated.View
          style={[
            styles.focusIndicator,
            {
              width: leftBarWidth,
              backgroundColor: activeBorder,
              borderTopLeftRadius: radius.md,
              borderBottomLeftRadius: radius.md,
            },
          ]}
        />

        {icon ? (
          <MaterialIcons
            name={icon}
            size={20}
            color={focused ? activeBorder : colors.textMuted}
            style={styles.icon}
          />
        ) : null}
        
        <TextInput
          placeholderTextColor={colors.textMuted}
          secureTextEntry={hidden}
          style={[
            styles.input,
            {
              color: colors.text,
              fontSize: 15,
            },
            style,
          ]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
        
        {secureTextEntry ? (
          <Pressable onPress={() => setHidden((v) => !v)} hitSlop={8} style={styles.eyeBtn}>
            <MaterialIcons
              name={hidden ? 'visibility-off' : 'visibility'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </Animated.View>
      
      {error ? (
        <ThemedText type="small" style={[styles.error, { color: colors.error }]}>
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
  label: {
    marginBottom: 2,
  },
  field: {
    height: 52, // Strict 52px height
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  focusIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: 0, // Avoid system vertical paddings stretching height
  },
  eyeBtn: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    marginTop: 2,
    fontWeight: '500',
  },
});
