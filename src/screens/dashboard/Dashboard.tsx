import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { getApiErrorMessage } from '../../utils/apiError';
import { showErrorToast, showSuccessToast } from '../../utils/toast';
import { Colors } from '../../utils/Colors';
import { ms, s, vs } from '../../utils/Responsive';

export default function DashboardScreen(): React.JSX.Element {
  const logout = useAuthStore((state) => state.logout);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async (): Promise<void> => {
    setIsLoggingOut(true);
    try {
      await logout();
      showSuccessToast('You have been signed out.');
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, 'Unable to sign out. Please try again.'));
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text>Dashboard screen placeholder</Text>
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.8}
        disabled={isLoggingOut}
        onPress={() => void handleLogout()}
        style={styles.logoutButton}
      >
        {isLoggingOut ? (
          <ActivityIndicator color={Colors.neutral[10]} />
        ) : (
          <Text style={styles.logoutButtonText}>Log Out</Text>
        )}
      </TouchableOpacity>
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
  logoutButton: {
    marginTop: vs(24),
    paddingHorizontal: s(24),
    paddingVertical: vs(12),
    borderRadius: ms(12),
    backgroundColor: Colors.brand.deepPlum,
  },
  logoutButtonText: {
    color: Colors.neutral[10],
    fontWeight: '600',
  },
});