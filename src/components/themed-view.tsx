import { View, type ViewProps } from 'react-native';

import { useAppTheme } from '@/contexts/ThemeContext';

export type ThemedViewProps = ViewProps & {
  variant?: 'background' | 'surface' | 'surfaceVariant';
};

export function ThemedView({ style, variant = 'background', ...otherProps }: ThemedViewProps) {
  const { colors } = useAppTheme();
  return <View style={[{ backgroundColor: colors[variant] }, style]} {...otherProps} />;
}
