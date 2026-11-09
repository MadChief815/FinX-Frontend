import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// Components
import { BottomSheetModal } from '../../components/BottomSheetModal';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Utilities
import { Colors } from '../../utils/Colors';
import { ms, s, vs } from '../../utils/Responsive';
import { TextStyles } from '../../utils/TextStyles';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatIncomeDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

interface IncomeDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function IncomeDatePicker({
  value,
  onChange,
  disabled = false,
}: IncomeDatePickerProps): React.JSX.Element {
  const [visible, setVisible] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const [year, month] = value.split('-').map(Number);
    return new Date(year, month - 1, 1);
  });

  useEffect(() => {
    const [year, month] = value.split('-').map(Number);
    if (year && month) setCalendarMonth(new Date(year, month - 1, 1));
  }, [value]);

  const days = useMemo(() => {
    const offset = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      1,
    ).getDay();
    const count = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth() + 1,
      0,
    ).getDate();
    return [
      ...Array<number>(offset).fill(0),
      ...Array.from({ length: count }, (_, index) => index + 1),
    ];
  }, [calendarMonth]);

  const selectDate = (day: number): void => {
    const year = calendarMonth.getFullYear();
    const month = String(calendarMonth.getMonth() + 1).padStart(2, '0');
    onChange(`${year}-${month}-${String(day).padStart(2, '0')}`);
    setVisible(false);
  };

  const changeMonth = (amount: number): void => {
    setCalendarMonth((current) =>
      new Date(current.getFullYear(), current.getMonth() + amount, 1),
    );
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Expected date, ${formatIncomeDate(value)}`}
        disabled={disabled}
        onPress={() => setVisible(true)}
        style={({ pressed }) => [styles.dateButton, pressed && styles.pressed]}
      >
        <Text style={styles.dateText}>{formatIncomeDate(value)}</Text>
        <Ionicons name="calendar-outline" size={ms(20)} color={Colors.brand.plum} />
      </Pressable>
      <BottomSheetModal
        visible={visible}
        onClose={() => setVisible(false)}
        size="large"
        keyboardAware={false}
      >
        <View style={styles.calendar}>
          <View style={styles.monthHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              onPress={() => changeMonth(-1)}
              style={styles.monthArrow}
            >
              <Ionicons name="chevron-back" size={ms(20)} color={Colors.brand.plum} />
            </Pressable>
            <Text style={styles.monthTitle}>
              {MONTHS[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next month"
              onPress={() => changeMonth(1)}
              style={styles.monthArrow}
            >
              <Ionicons name="chevron-forward" size={ms(20)} color={Colors.brand.plum} />
            </Pressable>
          </View>
          <View style={styles.grid}>
            {WEEKDAYS.map((day, index) => (
              <Text key={`${day}-${index}`} style={styles.weekday}>
                {day}
              </Text>
            ))}
            {days.map((day, index) => {
              const isSelected =
                day > 0 &&
                value === `${calendarMonth.getFullYear()}-${String(
                  calendarMonth.getMonth() + 1,
                ).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              return day ? (
                <Pressable
                  key={`${calendarMonth.getFullYear()}-${calendarMonth.getMonth()}-${day}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${MONTHS[calendarMonth.getMonth()]} ${day}`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => selectDate(day)}
                  style={[styles.dayButton, isSelected && styles.selectedDay]}
                >
                  <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>
                    {day}
                  </Text>
                </Pressable>
              ) : (
                <View key={`empty-${index}`} style={styles.dayButton} />
              );
            })}
          </View>
        </View>
      </BottomSheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  dateButton: {
    minHeight: vs(48),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(14),
    borderWidth: 1,
    borderColor: Colors.neutral[40],
    borderRadius: ms(10),
    backgroundColor: Colors.neutral[10],
  },
  dateText: {
    ...TextStyles.Regular16,
    color: Colors.neutral[100],
  },
  calendar: {
    padding: s(20),
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(18),
  },
  monthTitle: {
    ...TextStyles.SemiBold18,
    color: Colors.brand.deepPlum,
  },
  monthArrow: {
    width: ms(40),
    height: ms(40),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ms(20),
    backgroundColor: Colors.neutral[20],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weekday: {
    ...TextStyles.Medium12,
    width: '14.2857%',
    height: vs(38),
    color: Colors.neutral[60],
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  dayButton: {
    width: '14.2857%',
    height: vs(42),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ms(21),
  },
  selectedDay: {
    backgroundColor: Colors.brand.plum,
  },
  dayText: {
    ...TextStyles.Medium14,
    color: Colors.neutral[80],
  },
  selectedDayText: {
    color: Colors.neutral[10],
  },
  pressed: {
    opacity: 0.72,
  },
});
