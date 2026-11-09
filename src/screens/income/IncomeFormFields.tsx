import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

// Components
import { IncomeDatePicker } from './IncomeDatePicker';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Utilities
import { Colors } from '../../utils/Colors';
import { ms, s, vs } from '../../utils/Responsive';
import { TextStyles } from '../../utils/TextStyles';

interface IncomeFormFieldsProps {
  title: string;
  amount: string;
  expectedDate: string;
  isReceived: boolean;
  disabled?: boolean;
  receivedWillBeReversed?: boolean;
  onTitleChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onReceivedChange: (value: boolean) => void;
}

export function IncomeFormFields({
  title,
  amount,
  expectedDate,
  isReceived,
  disabled = false,
  receivedWillBeReversed = false,
  onTitleChange,
  onAmountChange,
  onDateChange,
  onReceivedChange,
}: IncomeFormFieldsProps): React.JSX.Element {
  return (
    <View style={styles.form}>
      {/* Title */}
      <Text style={styles.label}>Title</Text>
      <TextInput
        accessibilityLabel="Income title"
        autoCapitalize="sentences"
        maxLength={100}
        editable={!disabled}
        onChangeText={onTitleChange}
        placeholder="Income title"
        placeholderTextColor={Colors.neutral[50]}
        returnKeyType="next"
        style={styles.input}
        value={title}
      />

      {/* Amount */}
      <Text style={styles.label}>Amount</Text>
      <TextInput
        accessibilityLabel="Income amount"
        keyboardType="decimal-pad"
        editable={!disabled}
        onChangeText={(value) => {
          if (/^\d*\.?\d{0,2}$/.test(value)) onAmountChange(value);
        }}
        placeholder="0.00"
        placeholderTextColor={Colors.neutral[50]}
        returnKeyType="done"
        style={styles.input}
        value={amount}
      />

      {/* Expected Date */}
      <Text style={styles.label}>Expected date</Text>
      <IncomeDatePicker
        value={expectedDate}
        onChange={onDateChange}
        disabled={disabled}
      />

      {/* Received */}
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isReceived }}
        accessibilityLabel="Income received"
        disabled={disabled}
        onPress={() => onReceivedChange(!isReceived)}
        style={({ pressed }) => [styles.receivedRow, pressed && styles.pressed]}
      >
        <View style={[styles.checkbox, isReceived && styles.checkboxSelected]}>
          {isReceived && (
            <Ionicons name="checkmark" size={ms(16)} color={Colors.neutral[10]} />
          )}
        </View>
        <View style={styles.receivedCopy}>
          <Text style={styles.receivedTitle}>Received</Text>
          <Text style={styles.receivedDescription}>
            {receivedWillBeReversed
              ? 'This received income will be deducted from the selected source.'
              : 'This income will be added to the selected source.'}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
  receivedRow: {
    minHeight: vs(64),
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    paddingHorizontal: s(4),
    marginTop: vs(4),
  },
  checkbox: {
    width: ms(24),
    height: ms(24),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.neutral[50],
    borderRadius: ms(6),
  },
  checkboxSelected: {
    borderColor: Colors.brand.orchid,
    backgroundColor: Colors.brand.orchid,
  },
  receivedCopy: {
    flex: 1,
    gap: vs(2),
  },
  receivedTitle: {
    ...TextStyles.Medium14,
    color: Colors.brand.deepPlum,
  },
  receivedDescription: {
    ...TextStyles.Regular12,
    color: Colors.neutral[60],
  },
  pressed: {
    opacity: 0.72,
  },
});
