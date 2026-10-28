import React, { useRef } from 'react';
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
  onPress: () => void | Promise<void>;
  style?: StyleProp<ViewStyle>;
}

export function LoadingButton({
  children,
  disabled = false,
  isLoading,
  onPress,
  style,
}: LoadingButtonProps): React.JSX.Element {
  const isPressing = useRef(false);

  const handlePress = (): void => {
    if (disabled || isLoading || isPressing.current) return;
    isPressing.current = true;
    const result = onPress();
    if (result instanceof Promise) {
      void result.then(
        () => {
          isPressing.current = false;
        },
        () => {
          isPressing.current = false;
        },
      );
    } else {
      isPressing.current = false;
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || isLoading, busy: isLoading }}
      disabled={disabled || isLoading}
      onPress={handlePress}
      style={({ pressed }) => [
        style,
        pressed && !isLoading && styles.pressed,
        (disabled || isLoading) && styles.disabled,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <View>{children}</View>
      )}
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
