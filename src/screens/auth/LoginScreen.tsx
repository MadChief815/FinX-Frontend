import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Components
import Header from '../../components/Header';
import { ms, s, vs } from '../../utils/Responsive';
import { screenStyles } from '../../utils/screenStyles';
import { TextStyleIOS } from 'react-native';
import { Colors } from '../../utils/Colors';

export default function LoginScreen(): React.JSX.Element {
  return (
    <SafeAreaView style={screenStyles.container}>
      {/* Header */}
      <Header title='Sign In' back={false} />

      <Text style={styles.title}>Register</Text>
      <Text>Register screen placeholder</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: ms(28),
    fontWeight: '700',
    marginBottom: vs(8),
  },
});