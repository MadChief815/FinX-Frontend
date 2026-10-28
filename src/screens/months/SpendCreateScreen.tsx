import React, { useState } from 'react';
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

// API
import { addSpend, updateSpend } from '../../api/adapters/spends.adapter';
import type { Spend } from '../../api/adapters/spends.adapter';
import { adjustDashboardBalance } from '../../api/adapters/dashboard.adapter';

// Components
import Header from '../../components/Header';
import { BottomSheetModal } from '../../components/BottomSheetModal';
import { LoadingButton } from '../../components/LoadingButton';

// Utilities
import { Colors } from '../../utils/Colors';
import { getApiErrorMessage } from '../../utils/apiError';
import { ms, s, vs } from '../../utils/Responsive';
import { screenStyles } from '../../utils/screenStyles';
import { TextStyles } from '../../utils/TextStyles';
import { sanitizeNumericInput } from '../../utils/numericInput';
import { showErrorToast, showSuccessToast } from '../../utils/toast';

type SpendCreateScreenProps = MonthsScreenProps<'SpendCreate'>;

const isValidAmount = (value: string): boolean =>
  /^\d+(\.\d{0,2})?$/.test(value.trim()) && Number.isFinite(Number(value));

export default function SpendCreateScreen({
  navigation,
  route,
}: SpendCreateScreenProps): React.JSX.Element {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSpend, setCreatedSpend] = useState<Spend | null>(null);
  const [isDeductModalVisible, setIsDeductModalVisible] = useState(false);
  const [isDeducting, setIsDeducting] = useState(false);

  const createSpend = async (): Promise<void> => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      showErrorToast('Enter a title for this spend.');
      return;
    }
    if (!isValidAmount(amount)) {
      showErrorToast('Enter a valid amount with up to two decimal places.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await addSpend({
        month_page: route.params.monthId,
        title: trimmedTitle,
        amount: Number(amount).toFixed(2),
        is_completed: false,
      });
      if (isCompleted) {
        setCreatedSpend(created);
        setIsDeductModalVisible(true);
        return;
      }
      showSuccessToast('Spend created.');
      navigation.goBack();
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, 'Unable to create spend. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelDeduction = (): void => {
    setIsDeductModalVisible(false);
    setCreatedSpend(null);
    showSuccessToast('Spend created.');
    navigation.goBack();
  };

  const deductCreatedSpend = async (source: 'bank' | 'cash'): Promise<void> => {
    if (!createdSpend) return;
    setIsDeducting(true);
    let balanceAdjusted = false;
    try {
      await adjustDashboardBalance(source, -Number(createdSpend.amount));
      balanceAdjusted = true;
      await updateSpend(createdSpend.id, {
        title: createdSpend.title,
        amount: createdSpend.amount,
        is_completed: true,
      });
      setIsDeductModalVisible(false);
      showSuccessToast(`Spend deducted from ${source}.`);
      navigation.goBack();
    } catch (error) {
      if (balanceAdjusted) {
        try {
          await adjustDashboardBalance(source, Number(createdSpend.amount));
        } catch (rollbackError) {
          showErrorToast(
            `Spend remains incomplete, but balance rollback failed: ${getApiErrorMessage(rollbackError, 'Please check your account balance.')}`,
          );
          setIsDeductModalVisible(false);
          navigation.goBack();
          return;
        }
      }
      showErrorToast(
        getApiErrorMessage(error, 'Unable to deduct and complete this spend.'),
      );
    } finally {
      setIsDeducting(false);
    }
  };

  return (
    <SafeAreaView style={[screenStyles.container, styles.root]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          {/* Header */}
          <Header
            title="Create Spend"
            back
            onBackPress={() => navigation.goBack()}
            titleColor={Colors.brand.deepPlum}
          />

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              accessibilityLabel="Spend title"
              autoCapitalize="sentences"
              autoCorrect
              maxLength={100}
              onChangeText={setTitle}
              placeholder="e.g. Groceries"
              placeholderTextColor={Colors.neutral[60]}
              returnKeyType="next"
              style={styles.input}
              value={title}
            />

            <Text style={styles.label}>Amount</Text>
            <TextInput
              accessibilityLabel="Spend amount"
              keyboardType="decimal-pad"
              onChangeText={(value) => setAmount(sanitizeNumericInput(value, 2))}
              placeholder="0.00"
              placeholderTextColor={Colors.neutral[60]}
              style={styles.input}
              value={amount}
            />

            <View style={styles.completedRow}>
              <Text style={styles.label}>Completed</Text>
              <Switch
                accessibilityLabel="Completed"
                value={isCompleted}
                onValueChange={setIsCompleted}
                trackColor={{ false: Colors.neutral[40], true: Colors.brand.teal }}
                thumbColor={Colors.neutral[10]}
              />
            </View>

            <LoadingButton
              isLoading={isSubmitting}
              onPress={createSpend}
              style={styles.submitButton}
            >
              <Text style={styles.submitButtonText}>Create spend</Text>
            </LoadingButton>
          </View>
        </View>
      </KeyboardAvoidingView>
      <BottomSheetModal
        visible={isDeductModalVisible}
        onClose={() => {
          if (!isDeducting) cancelDeduction();
        }}
        size="compact"
      >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Deduct spend</Text>
            <Text style={styles.modalDescription}>
              Choose where to deduct {createdSpend?.amount ?? amount} from.
            </Text>
            {(['bank', 'cash'] as const).map((source) => (
              <Pressable
                key={source}
                accessibilityRole="button"
                accessibilityLabel={`Deduct from ${source}`}
                disabled={isDeducting}
                onPress={() => void deductCreatedSpend(source)}
                style={({ pressed }) => [
                  styles.sourceOption,
                  pressed && styles.pressed,
                  isDeducting && styles.disabledControl,
                ]}
              >
                {isDeducting ? (
                  <ActivityIndicator color={Colors.brand.plum} />
                ) : (
                  <Text style={styles.sourceOptionText}>
                    {source === 'bank' ? 'Bank' : 'Cash'}
                  </Text>
                )}
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              disabled={isDeducting}
              onPress={cancelDeduction}
              style={({ pressed }) => [
                styles.cancelOption,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.cancelText}>Create without completing</Text>
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
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: s(20),
    paddingBottom: vs(24),
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
    marginTop: vs(4),
  },
  submitButton: {
    minHeight: vs(50),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(12),
    borderRadius: ms(12),
    backgroundColor: Colors.brand.plum,
  },
  submitButtonText: {
    ...TextStyles.SemiBold16,
    color: Colors.neutral[10],
  },
  modalCard: {
    width: '100%',
    padding: s(20),
    backgroundColor: Colors.neutral[10],
    gap: vs(10),
  },
  modalTitle: {
    ...TextStyles.SemiBold20,
    color: Colors.brand.deepPlum,
  },
  modalDescription: {
    ...TextStyles.Regular14,
    color: Colors.neutral[70],
    marginBottom: vs(4),
  },
  sourceOption: {
    minHeight: vs(52),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[30],
    borderRadius: ms(12),
    backgroundColor: Colors.neutral[10],
  },
  sourceOptionText: {
    ...TextStyles.SemiBold16,
    color: Colors.brand.deepPlum,
  },
  cancelOption: {
    minHeight: vs(42),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(2),
  },
  cancelText: {
    ...TextStyles.SemiBold14,
    color: Colors.neutral[70],
  },
  disabledControl: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.72,
  },
});
