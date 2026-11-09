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

// Components
import Header from '../../components/Header';
import { LoadingButton } from '../../components/LoadingButton';

// Icons
import Ionicons from 'react-native-vector-icons/Ionicons';

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
  /^\d+(\.\d{1,2})?$/.test(value.trim()) && Number(value) > 0;

export default function LoansCreateScreen({
  navigation,
}: LoansCreateScreenProps): React.JSX.Element {
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<LoanType>('lent');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitLoan = async (): Promise<void> => {
    const trimmedName = personName.trim();
    if (!trimmedName) {
      showErrorToast("Enter the person's name.");
      return;
    }
    if (!isValidAmount(amount)) {
      showErrorToast('Enter a valid amount greater than zero with up to two decimal places.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createLoan({
        person_name: trimmedName,
        amount: Number(amount).toFixed(2),
        type,
        status: 'active',
      });
      showSuccessToast('Loan created.');
      navigation.goBack();
    } catch (error) {
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
              keyboardType="decimal-pad"
              onChangeText={(value) => {
                if (/^\d*\.?\d{0,2}$/.test(value)) setAmount(value);
              }}
              placeholder="0.00"
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
          <Ionicons
            name="checkmark"
            size={ms(14)}
            color={Colors.neutral[10]}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
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
    borderWidth: 1,
    borderColor: Colors.neutral[30],
    borderRadius: ms(12),
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
  pressed: {
    opacity: 0.72,
  },
});
