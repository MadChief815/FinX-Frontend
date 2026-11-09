import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { IncomeStackParamList } from '../../navigation/types';

// API
import { createIncome } from '../../api/adapters/incomes.adapter';
import type { IncomePayload } from '../../api/adapters/incomes.adapter';
import { adjustDashboardBalance } from '../../api/adapters/dashboard.adapter';

// Components
import { BottomSheetModal } from '../../components/BottomSheetModal';
import Header from '../../components/Header';
import { LoadingButton } from '../../components/LoadingButton';
import { IncomeFormFields } from './IncomeFormFields';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Utilities
import { getApiErrorMessage } from '../../utils/apiError';
import { Colors } from '../../utils/Colors';
import { ms, s, vs } from '../../utils/Responsive';
import { screenStyles } from '../../utils/screenStyles';
import { TextStyles } from '../../utils/TextStyles';
import { showErrorToast, showSuccessToast } from '../../utils/toast';

type IncomeCreateScreenProps = NativeStackScreenProps<
  IncomeStackParamList,
  'IncomeCreate'
>;

const today = (): string => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
};

const parseAmount = (value: string): number => {
  const amount = Number(value.trim());
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
};

const toPayload = (
  title: string,
  amount: number,
  expectedDate: string,
  isReceived: boolean,
): IncomePayload => ({
  title: title.trim(),
  amount: amount.toFixed(2),
  expected_date: expectedDate,
  is_received: isReceived,
});

export default function IncomeCreateScreen({
  navigation,
}: IncomeCreateScreenProps): React.JSX.Element {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [expectedDate, setExpectedDate] = useState(today);
  const [isReceived, setIsReceived] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMethodModalVisible, setIsMethodModalVisible] = useState(false);
  const submissionLock = useRef(false);

  const submitIncome = async (): Promise<void> => {
    if (!title.trim()) {
      showErrorToast('Enter an income title.');
      return;
    }
    if (!parseAmount(amount)) {
      showErrorToast('Enter an amount greater than zero.');
      return;
    }
    setIsMethodModalVisible(true);
  };

  const createIncomeWithSource = async (
    source: 'bank' | 'cash',
  ): Promise<void> => {
    const amountNumber = parseAmount(amount);
    if (!title.trim() || !amountNumber || submissionLock.current) return;

    submissionLock.current = true;
    setIsSubmitting(true);
    let balanceAdjusted = false;
    const balanceDelta = amountNumber;
    try {
      await adjustDashboardBalance(source, balanceDelta);
      balanceAdjusted = true;
      await createIncome(toPayload(title, amountNumber, expectedDate, isReceived));
      setIsMethodModalVisible(false);
      showSuccessToast('Income created.');
      navigation.goBack();
    } catch (error) {
      if (balanceAdjusted) {
        try {
          await adjustDashboardBalance(source, -balanceDelta);
        } catch (rollbackError) {
          setIsMethodModalVisible(false);
          showErrorToast(
            `Income was not created and balance rollback failed: ${getApiErrorMessage(rollbackError, 'Please check your account balance.')}`,
          );
          return;
        }
      }
      showErrorToast(
        getApiErrorMessage(error, 'Unable to create this income. Please try again.'),
      );
    } finally {
      submissionLock.current = false;
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
          {/* Header */}
          <Header
            title="Create Income"
            back
            onBackPress={() => navigation.goBack()}
            titleColor={Colors.brand.deepPlum}
          />

          {/* Form */}
          <ScrollView
            style={styles.formScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <IncomeFormFields
              title={title}
              amount={amount}
              expectedDate={expectedDate}
              isReceived={isReceived}
              disabled={isSubmitting}
              onTitleChange={setTitle}
              onAmountChange={setAmount}
              onDateChange={setExpectedDate}
              onReceivedChange={setIsReceived}
            />
          </ScrollView>

          {/* Actions */}
          <LoadingButton
            isLoading={isSubmitting}
            onPress={submitIncome}
            style={styles.submitButton}
          >
            <Text style={styles.submitButtonText}>Create Income</Text>
          </LoadingButton>
        </View>
      </KeyboardAvoidingView>

      <BottomSheetModal
        visible={isMethodModalVisible}
        onClose={() => {
          if (!isSubmitting) setIsMethodModalVisible(false);
        }}
        size="compact"
      >
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>
            Add income
          </Text>
          <Text style={styles.modalDescription}>
            Choose where to add Rs. {parseAmount(amount).toFixed(2)} to.
          </Text>
          {(['bank', 'cash'] as const).map((source) => (
            <LoadingButton
              key={source}
              isLoading={isSubmitting}
              onPress={() => createIncomeWithSource(source)}
              style={styles.sourceOption}
            >
              <View style={styles.sourceContent}>
                <Ionicons
                  name={source === 'bank' ? 'business-outline' : 'cash-outline'}
                  size={ms(22)}
                  color={Colors.brand.plum}
                />
                <Text style={styles.sourceOptionText}>
                  {source === 'bank' ? 'Bank' : 'Cash'}
                </Text>
              </View>
            </LoadingButton>
          ))}
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => setIsMethodModalVisible(false)}
            style={({ pressed }) => [
              styles.cancelOption,
              pressed && styles.pressed,
              isSubmitting && styles.disabled,
            ]}
          >
            <Text style={styles.cancelOptionText}>Cancel</Text>
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
  formScroll: {
    flex: 1,
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
  modalCard: {
    gap: vs(10),
    padding: s(20),
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
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: s(14),
    borderWidth: 1,
    borderColor: Colors.neutral[30],
    borderRadius: ms(12),
    backgroundColor: Colors.neutral[10],
  },
  sourceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
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
  cancelOptionText: {
    ...TextStyles.SemiBold14,
    color: Colors.neutral[70],
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.72,
  },
});
