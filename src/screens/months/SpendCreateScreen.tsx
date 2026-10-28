import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { MonthsScreenProps } from '../../navigation/MonthsStack';

// API
import { addSpend } from '../../api/adapters/spends.adapter';

// Components
import Header from '../../components/Header';
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
      await addSpend({
        month_page: route.params.monthId,
        title: trimmedTitle,
        amount: Number(amount).toFixed(2),
        is_completed: isCompleted,
      });
      showSuccessToast('Spend created.');
      navigation.goBack();
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, 'Unable to create spend. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={screenStyles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
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
});
