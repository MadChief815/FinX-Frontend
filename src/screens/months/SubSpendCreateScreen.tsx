import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { MonthsScreenProps } from '../../navigation/MonthsStack';

// Components
import { BottomSheetModal } from '../../components/BottomSheetModal';
import Header from '../../components/Header';
import { LoadingButton } from '../../components/LoadingButton';
import { Colors } from '../../utils/Colors';
import { getApiErrorMessage } from '../../utils/apiError';
import { ms, s, vs } from '../../utils/Responsive';
import { screenStyles } from '../../utils/screenStyles';
import { TextStyles } from '../../utils/TextStyles';
import { sanitizeNumericInput } from '../../utils/numericInput';
import { showErrorToast, showSuccessToast } from '../../utils/toast';

// API Services
import { createSubSpend } from '../../api/adapters/subpages.adapter';
import { adjustDashboardBalance } from '../../api/adapters/dashboard.adapter';
import Ionicons from 'react-native-vector-icons/Ionicons';

type SubSpendCreateScreenProps = MonthsScreenProps<'SubSpendCreate'>;

const isValidAmount = (value: string): boolean =>
  /^\d+(\.\d{0,2})?$/.test(value.trim()) && Number.isFinite(Number(value));

export default function SubSpendCreateScreen({
  navigation,
  route,
}: SubSpendCreateScreenProps): React.JSX.Element {
  const subPageId = route.params?.subPageId;
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSourceModalVisible, setIsSourceModalVisible] = useState(false);

  useEffect(() => {
    if (subPageId === undefined) {
      showErrorToast('Unable to create a subspend without a subpage.');
    }
  }, [subPageId]);

  const submitSubSpend = async (): Promise<void> => {
    const trimmedTitle = title.trim();
    if (subPageId === undefined) {
      showErrorToast('Unable to create a subspend without a subpage.');
      return;
    }
    if (!trimmedTitle) {
      showErrorToast('Enter a title for this subspend.');
      return;
    }
    if (!isValidAmount(amount)) {
      showErrorToast('Enter a valid amount with up to two decimal places.');
      return;
    }

    if (isCompleted) {
      setIsSourceModalVisible(true);
      return;
    }

    await submitCreatedSubSpend();
  };

  const submitCreatedSubSpend = async (source?: 'cash' | 'bank'): Promise<void> => {
    if (subPageId === undefined) return;
    const trimmedTitle = title.trim();
    const spendAmount = Number(amount).toFixed(2);
    setIsSubmitting(true);
    let balanceAdjusted = false;
    try {
      if (source) {
        await adjustDashboardBalance(source, -Number(spendAmount));
        balanceAdjusted = true;
      }
      await createSubSpend({
        sub_page: subPageId,
        title: trimmedTitle,
        amount: spendAmount,
        is_completed: isCompleted,
      });
      setIsSourceModalVisible(false);
      showSuccessToast('Subspend created.');
      navigation.goBack();
    } catch (error) {
      if (balanceAdjusted && source) {
        try {
          await adjustDashboardBalance(source, Number(spendAmount));
        } catch (rollbackError) {
          setIsSourceModalVisible(false);
          showErrorToast(
            `Subspend was not created and balance rollback failed: ${getApiErrorMessage(rollbackError, 'Please check your account balance.')}`,
          );
          return;
        }
      }
      showErrorToast(
        getApiErrorMessage(error, 'Unable to create this subspend. Please try again.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      style={[screenStyles.container, styles.root]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <Header
            title="Create Subspend"
            back
            onBackPress={() => navigation.goBack()}
            titleColor={Colors.brand.deepPlum}
          />

          <View style={styles.form}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              accessibilityLabel="Subspend title"
              autoCapitalize="sentences"
              autoCorrect
              maxLength={100}
              onChangeText={setTitle}
              placeholder="Subspend name"
              placeholderTextColor={Colors.neutral[60]}
              returnKeyType="next"
              style={styles.input}
              value={title}
            />

            <Text style={styles.label}>Amount</Text>
            <TextInput
              accessibilityLabel="Subspend amount"
              keyboardType="decimal-pad"
              onChangeText={(value) => setAmount(sanitizeNumericInput(value, 2))}
              placeholder="0.00"
              placeholderTextColor={Colors.neutral[60]}
              returnKeyType="done"
              style={styles.input}
              value={amount}
            />

            <View style={styles.completedRow}>
              <Text style={styles.label}>Completed</Text>
              <Switch
                accessibilityLabel="Subspend completed"
                value={isCompleted}
                onValueChange={setIsCompleted}
                trackColor={{ false: Colors.neutral[40], true: Colors.brand.orchid }}
                thumbColor={Colors.neutral[10]}
              />
            </View>
          </View>

          <LoadingButton
            disabled={subPageId === undefined}
            isLoading={isSubmitting}
            onPress={submitSubSpend}
            style={styles.submitButton}
          >
            <Text style={styles.submitButtonText}>Create subspend</Text>
          </LoadingButton>
        </View>
      </KeyboardAvoidingView>

      <BottomSheetModal
        visible={isSourceModalVisible}
        onClose={() => {
          if (!isSubmitting) setIsSourceModalVisible(false);
        }}
        size="compact"
      >
        <View style={styles.sourceModal}>
          <Text style={styles.sourceModalTitle}>Deduct subspend</Text>
          <Text style={styles.sourceDescription}>
            Choose where to deduct Rs. {Number(amount).toFixed(2)} from.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Deduct from bank"
            disabled={isSubmitting}
            onPress={() => void submitCreatedSubSpend('bank')}
            style={({ pressed }) => [styles.sourceOption, pressed && styles.pressed]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.brand.plum} />
            ) : (
              <Ionicons name="business-outline" size={ms(22)} color={Colors.brand.plum} />
            )}
            <Text style={styles.sourceOptionText}>Bank</Text>
            <Ionicons name="chevron-forward" size={ms(20)} color={Colors.neutral[60]} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Deduct from cash"
            disabled={isSubmitting}
            onPress={() => void submitCreatedSubSpend('cash')}
            style={({ pressed }) => [styles.sourceOption, pressed && styles.pressed]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.brand.plum} />
            ) : (
              <Ionicons name="cash-outline" size={ms(22)} color={Colors.brand.plum} />
            )}
            <Text style={styles.sourceOptionText}>Cash</Text>
            <Ionicons name="chevron-forward" size={ms(20)} color={Colors.neutral[60]} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => setIsSourceModalVisible(false)}
            style={({ pressed }) => [
              styles.cancelButton,
              pressed && styles.pressed,
              isSubmitting && styles.disabledControl,
            ]}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  root: {
    paddingHorizontal: 0,
    paddingTop: vs(18),
  },
  content: {
    flex: 1,
    paddingHorizontal: s(20),
    paddingBottom: vs(12),
  },
  form: {
    gap: vs(12),
    paddingTop: vs(28),
  },
  label: {
    ...TextStyles.Medium14,
    color: Colors.neutral[80],
  },
  input: {
    minHeight: vs(50),
    paddingHorizontal: s(14),
    borderWidth: 1,
    borderColor: Colors.neutral[40],
    borderRadius: ms(10),
    color: Colors.neutral[100],
    ...TextStyles.Regular16,
  },
  completedRow: {
    minHeight: vs(48),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  submitButton: {
    minHeight: vs(50),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    borderRadius: ms(12),
    backgroundColor: Colors.brand.plum,
  },
  submitButtonText: {
    ...TextStyles.SemiBold16,
    color: Colors.neutral[10],
  },
  sourceModal: {
    width: '100%',
    padding: s(20),
    backgroundColor: Colors.neutral[10],
    gap: vs(10),
  },
  sourceModalTitle: {
    ...TextStyles.SemiBold20,
    color: Colors.brand.deepPlum,
    marginBottom: vs(4),
  },
  sourceDescription: {
    ...TextStyles.Regular14,
    color: Colors.neutral[70],
    marginBottom: vs(4),
  },
  sourceOption: {
    minHeight: vs(48),
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    paddingHorizontal: s(12),
    borderWidth: 1,
    borderColor: Colors.neutral[30],
    borderRadius: ms(12),
  },
  sourceOptionText: {
    ...TextStyles.Medium14,
    color: Colors.brand.deepPlum,
    flex: 1,
  },
  cancelButton: {
    minHeight: vs(42),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[30],
    borderRadius: ms(12),
  },
  cancelButtonText: {
    ...TextStyles.SemiBold14,
    color: Colors.neutral[70],
  },
  pressed: {
    opacity: 0.78,
  },
  disabledControl: {
    opacity: 0.55,
  },
});
