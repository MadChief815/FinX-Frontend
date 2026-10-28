import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { MonthsScreenProps } from '../../navigation/MonthsStack';

// API
import { createMonth } from '../../api/adapters/months.adapter';

// Components
import Header from '../../components/Header';
import { LoadingButton } from '../../components/LoadingButton';
import { Colors } from '../../utils/Colors';
import { getApiErrorMessage } from '../../utils/apiError';
import { ms, s, vs } from '../../utils/Responsive';
import { screenStyles } from '../../utils/screenStyles';
import { TextStyles } from '../../utils/TextStyles';
import { sanitizeNumericInput } from '../../utils/numericInput';
import { showErrorToast, showSuccessToast } from '../../utils/toast';

type MonthCreateScreenProps = MonthsScreenProps<'MonthCreate'>;

export default function MonthCreateScreen({
  navigation,
}: MonthCreateScreenProps): React.JSX.Element {
  const [title, setTitle] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitMonth = async (): Promise<void> => {
    const trimmedTitle = title.trim();
    const numericMonth = Number(month);
    const numericYear = Number(year);

    if (!trimmedTitle) {
      showErrorToast('Enter a title for this month.');
      return;
    }
    if (!Number.isInteger(numericMonth) || numericMonth < 1 || numericMonth > 12) {
      showErrorToast('Enter a month number between 1 and 12.');
      return;
    }
    if (!Number.isInteger(numericYear) || numericYear < 1 || numericYear > 9999) {
      showErrorToast('Enter a valid year between 1 and 9999.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createMonth({
        title: trimmedTitle,
        month: numericMonth,
        year: numericYear,
      });
      showSuccessToast('Month created.');
      navigation.goBack();
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, 'Unable to create this month. Please try again.'));
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
            title="Create a Month"
            onBackPress={() => navigation.goBack()}
            titleColor={Colors.brand.deepPlum}
          />

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              accessibilityLabel="Month title"
              autoCapitalize="sentences"
              autoCorrect
              maxLength={40}
              onChangeText={setTitle}
              placeholder="Month name"
              placeholderTextColor={Colors.neutral[50]}
              returnKeyType="next"
              style={styles.input}
              value={title}
            />

            <View style={styles.dateFields}>
              <View style={styles.dateField}>
                <Text style={styles.label}>Month number</Text>
                <TextInput
                  accessibilityLabel="Month number"
                  keyboardType="number-pad"
                  maxLength={2}
                  onChangeText={(value) =>
                    setMonth(sanitizeNumericInput(value).slice(0, 2))
                  }
                  placeholder="1 - 12"
                  placeholderTextColor={Colors.neutral[50]}
                  returnKeyType="next"
                  style={styles.input}
                  value={month}
                />
              </View>
              <View style={styles.dateField}>
                <Text style={styles.label}>Year</Text>
                <TextInput
                  accessibilityLabel="Month year"
                  keyboardType="number-pad"
                  maxLength={4}
                  onChangeText={(value) =>
                    setYear(sanitizeNumericInput(value).slice(0, 4))
                  }
                  placeholder="e.g. 2026"
                  placeholderTextColor={Colors.neutral[50]}
                  returnKeyType="done"
                  style={styles.input}
                  value={year}
                />
              </View>
            </View>
          </View>
          {/* Actions */}
          <LoadingButton
            isLoading={isSubmitting}
            onPress={submitMonth}
            style={styles.submitButton}
          >
            <Text style={styles.submitButtonText}>Create</Text>
          </LoadingButton>
        </View>
      </KeyboardAvoidingView>
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
  dateFields: {
    flexDirection: 'row',
    gap: s(12),
  },
  dateField: {
    flex: 1,
    gap: vs(12),
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
});
