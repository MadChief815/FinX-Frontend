import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Components
import Header from '../../components/Header';

export default function RegisterScreen(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <Header title='Sign In'/>
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
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
});