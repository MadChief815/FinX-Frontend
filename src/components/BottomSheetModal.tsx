import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';
import { Colors } from '../utils/Colors';

type BottomSheetSize = 'compact' | 'form' | 'large';

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size: BottomSheetSize;
  keyboardAware?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export function BottomSheetModal({
  visible,
  onClose,
  children,
  size,
  keyboardAware = true,
  contentStyle,
}: BottomSheetModalProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const maxSheetHeight = height * (
    size === 'compact' ? 0.4 : size === 'form' ? 0.76 : 0.88
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close modal"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <KeyboardAvoidingView
          behavior={keyboardAware && Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <View
            style={[
              styles.sheet,
              { maxHeight: maxSheetHeight },
              contentStyle,
              { paddingBottom: insets.bottom },
            ]}
          >
            {children}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(23, 23, 23, 0.48)',
  },
  keyboardContainer: {
    justifyContent: 'flex-end',
    width: '100%',
    maxHeight: '100%',
  },
  sheet: {
    width: '100%',
    overflow: 'hidden',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: Colors.neutral[10],
  },
});
