import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../utils/Colors';
import { ms, s, vs } from '../utils/Responsive';
import { TextStyles } from '../utils/TextStyles';

interface SummaryCardProps {
  children: React.ReactNode;
}

export function SummaryCard({ children }: SummaryCardProps): React.JSX.Element {
  return (
    <View>
      <Text style={styles.heading}>Summary</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    ...TextStyles.Medium16,
    color: Colors.neutral[70],
    marginBottom: vs(10),
  },
  card: {
    padding: s(16),
    marginBottom: vs(16),
    borderRadius: ms(16),
    borderWidth: 1,
    borderColor: Colors.neutral[30],
    backgroundColor: Colors.neutral[10],
  },
});
