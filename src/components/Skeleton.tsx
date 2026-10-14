import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';

interface SkeletonProps {
  width: number | `${number}%`;
  height: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width, height, style }: SkeletonProps): React.JSX.Element {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[styles.skeleton, { width, height, opacity }, style]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    borderRadius: 6,
    backgroundColor: 'rgba(85, 64, 93, 0.22)',
  },
});
