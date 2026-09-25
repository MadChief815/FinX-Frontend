import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ms, s, vs } from '../../utils/Responsive';

export default function IncomeScreen(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Income</Text>
      <Text>Income screen placeholder</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(24),
    paddingVertical: vs(24),
  },
  title: {
    fontSize: ms(28),
    fontWeight: '700',
    marginBottom: vs(8),
  },
});