import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, View, type ViewStyle } from 'react-native';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

type IconBadgeProps = {
  name: IconName;
  color: string;
  background: string;
  size?: number;
  iconSize?: number;
  rounded?: boolean;
  style?: ViewStyle;
};

export function IconBadge({
  name,
  color,
  background,
  size = 44,
  iconSize,
  rounded = false,
  style,
}: IconBadgeProps) {
  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: rounded ? size / 2 : size * 0.32,
          backgroundColor: background,
        },
        style,
      ]}>
      <MaterialIcons name={name} size={iconSize ?? size * 0.5} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
