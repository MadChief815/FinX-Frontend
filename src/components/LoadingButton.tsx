import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

interface LoadingButtonProps {
  children: React.ReactNode;
  disabled?: boolean;
  isLoading: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function LoadingButton({
  children,
  disabled = false,
  isLoading,
  onPress,
  style,
}: LoadingButtonProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || isLoading, busy: isLoading }}
      disabled={disabled || isLoading}
      onPress={onPress}
      style={({ pressed }) => [
        style,
        pressed && !isLoading && styles.pressed,
        (disabled || isLoading) && styles.disabled,
      ]}
    >
      {isLoading && <ActivityIndicator color="#FFFFFF" />}
      <View>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.6,
  },
});
