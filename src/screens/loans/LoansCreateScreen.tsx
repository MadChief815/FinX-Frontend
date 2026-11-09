import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { LoansStackParamList } from '../../navigation/types';

// API
import { createLoan } from '../../api/adapters/loans.adapter';
import type { LoanType } from '../../api/adapters/loans.adapter';
import { adjustDashboardBalance } from '../../api/adapters/dashboard.adapter';

// Components
import { BottomSheetModal } from '../../components/BottomSheetModal';
import Header from '../../components/Header';
import { LoadingButton } from '../../components/LoadingButton';

// Utilities
import { getApiErrorMessage } from '../../utils/apiError';
import { Colors } from '../../utils/Colors';
import { ms, s, vs } from '../../utils/Responsive';
import { screenStyles } from '../../utils/screenStyles';
import { TextStyles } from '../../utils/TextStyles';
import { showErrorToast, showSuccessToast } from '../../utils/toast';

type LoansCreateScreenProps = NativeStackScreenProps<
  LoansStackParamList,
  'LoansCreate'
>;

const isValidAmount = (value: string): boolean =>
  /^\d+$/.test(value.trim()) && Number(value) > 0;

export default function LoansCreateScreen({
  navigation,
}: LoansCreateScreenProps): React.JSX.Element {
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<LoanType>('lent');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMethodModalVisible, setIsMethodModalVisible] = useState(false);

  const submitLoan = async (): Promise<void> => {
    const trimmedName = personName.trim();
    if (!trimmedName) {
      showErrorToast("Enter the person's name.");
      return;
    }
    if (!isValidAmount(amount)) {
      showErrorToast('Enter a whole amount greater than zero.');
      return;
    }

    setIsMethodModalVisible(true);
  };

  const createLoanWithSource = async (source: 'bank' | 'cash'): Promise<void> => {
    const trimmedName = personName.trim();
    const amountValue = Number(amount);
    if (!trimmedName || !isValidAmount(amount)) return;

    setIsSubmitting(true);
    setIsMethodModalVisible(false);
    let balanceAdjusted = false;
    try {
      await adjustDashboardBalance(
        source,
        type === 'lent' ? -amountValue : amountValue,
      );
      balanceAdjusted = true;
      await createLoan({
        person_name: trimmedName,
        amount: String(amountValue),
        type,
        status: 'active',
      });
      showSuccessToast('Loan created.');
      navigation.goBack();
    } catch (error) {
      if (balanceAdjusted) {
        try {
          await adjustDashboardBalance(
            source,
            type === 'lent' ? amountValue : -amountValue,
          );
        } catch (rollbackError) {
          setIsMethodModalVisible(false);
          showErrorToast(
            `Loan was not created and balance rollback failed: ${getApiErrorMessage(rollbackError, 'Please check your account balance.')}`,
          );
          return;
        }
      }
      showErrorToast(getApiErrorMessage(error, 'Unable to create this loan. Please try again.'));
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
          {/* Header */}
          <Header
            title="Create a Loan"
            back
            onBackPress={() => navigation.goBack()}
            titleColor={Colors.brand.deepPlum}
          />

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Person</Text>
            <TextInput
              accessibilityLabel="Person name"
              autoCapitalize="words"
              autoCorrect
              maxLength={80}
              onChangeText={setPersonName}
              placeholder="Person's name"
              placeholderTextColor={Colors.neutral[50]}
              returnKeyType="next"
              style={styles.input}
              value={personName}
            />

            <Text style={styles.label}>Amount</Text>
            <TextInput
              accessibilityLabel="Loan amount"
              keyboardType="number-pad"
              onChangeText={(value) => {
                if (/^\d*$/.test(value)) setAmount(value);
              }}
              placeholder="0"
              placeholderTextColor={Colors.neutral[50]}
              returnKeyType="done"
              style={styles.input}
              value={amount}
            />

            {/* Loan Type */}
            <Text style={styles.label}>Loan type</Text>
            <View style={styles.optionRow}>
              <TypeOption
                label="Lent"
                selected={type === 'lent'}
                onPress={() => setType('lent')}
              />
              <TypeOption
                label="Borrowed"
                selected={type === 'borrowed'}
                onPress={() => setType('borrowed')}
              />
            </View>
            <Text style={styles.activeNote}>New loans are created as active.</Text>
          </View>

          {/* Actions */}
          <LoadingButton
            isLoading={isSubmitting}
            onPress={submitLoan}
            style={styles.submitButton}
          >
            <Text style={styles.submitButtonText}>Create Loan</Text>
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
            {type === 'lent' ? 'Deduct loan' : 'Increase account'}
          </Text>
          <Text style={styles.modalDescription}>
            {type === 'lent'
              ? `Choose where to deduct Rs. ${Number(amount).toLocaleString()} from.`
              : `Choose where to add Rs. ${Number(amount).toLocaleString()} to.`}
          </Text>
          {(['bank', 'cash'] as const).map((source) => (
            <Pressable
              key={source}
              accessibilityRole="button"
              accessibilityLabel={`${type === 'lent' ? 'Deduct from' : 'Add to'} ${source}`}
              disabled={isSubmitting}
              onPress={() => void createLoanWithSource(source)}
              style={({ pressed }) => [
                styles.sourceOption,
                pressed && styles.pressed,
                isSubmitting && styles.disabled,
              ]}
            >
              <Text style={styles.sourceOptionText}>
                {source === 'bank' ? 'Bank' : 'Cash'}
              </Text>
            </Pressable>
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

function TypeOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.typeOption, pressed && styles.pressed]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && (
          <View style={styles.radioDot} />
        )}
      </View>
      <Text style={styles.typeOptionText}>{label}</Text>
    </Pressable>
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
    gap: vs(10),
    paddingTop: vs(24),
  },
  label: {
    ...TextStyles.Medium14,
    color: Colors.neutral[80],
  },
  input: {
    minHeight: vs(48),
    paddingHorizontal: s(14),
    borderWidth: 1,
    borderColor: Colors.neutral[40],
    borderRadius: ms(10),
    color: Colors.neutral[100],
    ...TextStyles.Regular16,
  },
  optionRow: {
    flexDirection: 'row',
    gap: s(12),
  },
  typeOption: {
    minHeight: vs(46),
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    paddingHorizontal: s(12),
  },
  radio: {
    width: ms(22),
    height: ms(22),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.neutral[50],
    borderRadius: ms(11),
  },
  radioSelected: {
    borderColor: Colors.brand.orchid,
    backgroundColor: Colors.brand.orchid,
  },
  radioDot: {
    width: ms(6),
    height: ms(6),
    borderRadius: ms(3),
    backgroundColor: Colors.neutral[10],
  },
  typeOptionText: {
    ...TextStyles.Medium14,
    color: Colors.brand.deepPlum,
  },
  activeNote: {
    ...TextStyles.Regular12,
    color: Colors.neutral[60],
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(14),
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
