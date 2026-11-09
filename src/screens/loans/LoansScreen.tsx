import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { LoansStackParamList } from '../../navigation/types';

// API
import { getLoans } from '../../api/adapters/loans.adapter';
import type { Loan } from '../../api/adapters/loans.adapter';

// Components
import Header from '../../components/Header';
import { Skeleton } from '../../components/Skeleton';
import { SummaryCard, SummaryItem } from '../../components/SummaryCard';

// Icons
import Ionicons from 'react-native-vector-icons/Ionicons';

// Utilities
import { getApiErrorMessage } from '../../utils/apiError';
import { Colors } from '../../utils/Colors';
import { ms, s, vs } from '../../utils/Responsive';
import { screenStyles } from '../../utils/screenStyles';
import { TextStyles } from '../../utils/TextStyles';
import { showErrorToast } from '../../utils/toast';

type LoansScreenProps = NativeStackScreenProps<LoansStackParamList, 'Loans'>;

const formatCurrency = (value: number): string => {
  const [whole, fraction] = value.toFixed(2).split('.');
  return `Rs. ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`;
};

const amountValue = (amount: string): number => {
  const value = Number(amount);
  return Number.isFinite(value) ? value : 0;
};

export default function LoansScreen({
  navigation,
}: LoansScreenProps): React.JSX.Element {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const hasLoadedLoans = useRef(false);

  const loadLoans = useCallback(async (showLoading: boolean): Promise<void> => {
    if (showLoading) setIsLoading(true);
    try {
      setLoans(await getLoans());
      setLoadError(false);
    } catch (error) {
      setLoadError(true);
      showErrorToast(getApiErrorMessage(error, 'Unable to load loans. Please try again.'));
    } finally {
      hasLoadedLoans.current = true;
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadLoans(!hasLoadedLoans.current);
    }, [loadLoans]),
  );

  const refreshLoans = async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      await loadLoans(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  const { lentLoans, borrowedLoans, completedLoans, totals } = useMemo(() => {
    const lent = loans.filter((loan) => loan.type === 'lent' && loan.status === 'active');
    const borrowed = loans.filter(
      (loan) => loan.type === 'borrowed' && loan.status === 'active',
    );
    const completed = loans.filter((loan) => loan.status === 'paid');
    return {
      lentLoans: lent,
      borrowedLoans: borrowed,
      completedLoans: completed,
      totals: {
        lent: lent.reduce((sum, loan) => sum + amountValue(loan.amount), 0),
        borrowed: borrowed.reduce((sum, loan) => sum + amountValue(loan.amount), 0),
      },
    };
  }, [loans]);

  const renderLoan = (loan: Loan, dimmed = false): React.JSX.Element => (
    <Pressable
      key={loan.id}
      accessibilityRole="button"
      accessibilityLabel={`${loan.personName}, ${formatCurrency(amountValue(loan.amount))}, ${loan.status}`}
      accessibilityHint="Opens loan details"
      onPress={() => navigation.navigate('LoanDetail', { loanId: loan.id })}
      style={({ pressed }) => [
        styles.loanItem,
        dimmed && styles.completedLoanItem,
        pressed && styles.loanItemPressed,
      ]}
    >
      <View style={styles.loanIdentity}>
        <Text numberOfLines={1} style={styles.personName}>
          {loan.personName}
        </Text>
        <Text style={styles.loanStatus}>
          {loan.status === 'paid' ? 'Paid' : 'Active'}
        </Text>
      </View>
      <Text numberOfLines={1} style={styles.loanAmount}>
        {formatCurrency(amountValue(loan.amount))}
      </Text>
    </Pressable>
  );

  const renderSection = (
    title: string,
    items: Loan[],
    emptyMessage: string,
    completed = false,
    dimmed = false,
  ): React.JSX.Element => (
    <View style={completed ? styles.completedSection : styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.length > 0 ? (
        items.map((loan) => renderLoan(loan, dimmed))
      ) : (
        <EmptySection message={emptyMessage} />
      )}
    </View>
  );

  return (
    <SafeAreaView style={screenStyles.container}>
      {/* Header */}
      <Header title="Loans" back={false} titleColor={Colors.brand.deepPlum} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void refreshLoans()}
            tintColor={Colors.brand.plum}
            colors={[Colors.brand.plum]}
          />
        }
      >
        {/* Summary */}
        <SummaryCard>
          <View style={styles.overviewTotals}>
            <SummaryItem
              label="Lent"
              value={formatCurrency(totals.lent)}
              isLoading={isLoading}
            />
            <View style={styles.overviewDivider} />
            <SummaryItem
              label="Borrowed"
              value={formatCurrency(totals.borrowed)}
              isLoading={isLoading}
            />
          </View>
        </SummaryCard>

        {loadError && (
          <Text accessibilityRole="alert" style={styles.errorMessage}>
            Unable to refresh loans. Pull down to try again.
          </Text>
        )}

        {isLoading ? (
          <>
            <LoanSectionSkeleton title="Lent" />
            <LoanSectionSkeleton title="Borrowed" />
            <LoanSectionSkeleton title="Completed" completed />
          </>
        ) : (
          <>
            {renderSection('Lent', lentLoans, 'No active lent loans')}
            {renderSection(
              'Borrowed',
              borrowedLoans,
              'No active borrowed loans',
              true,
            )}
            {renderSection(
              'Completed',
              completedLoans,
              'No completed loans',
              true,
              true,
            )}
          </>
        )}
      </ScrollView>

      {/* Create Loan */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create a loan"
        onPress={() => navigation.navigate('LoansCreate')}
        style={({ pressed }) => [styles.createLoanFab, pressed && styles.pressed]}
      >
        <Ionicons
          name="add"
          size={ms(30)}
          color={Colors.neutral[10]}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </Pressable>
    </SafeAreaView>
  );
}

function LoanSectionSkeleton({
  title,
  completed = false,
}: {
  title: string;
  completed?: boolean;
}): React.JSX.Element {
  return (
    <View style={completed ? styles.completedSection : styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {[0, 1].map((index) => (
        <View key={`${title}-${index}`} style={styles.loanItem}>
          <View style={styles.loanIdentity}>
            <Skeleton width="52%" height={ms(18)} />
            <Skeleton width={ms(42)} height={ms(14)} style={styles.statusSkeleton} />
          </View>
          <Skeleton width={ms(96)} height={ms(18)} />
        </View>
      ))}
    </View>
  );
}

function EmptySection({ message }: { message: string }): React.JSX.Element {
  return (
    <View style={styles.emptySection}>
      <Ionicons
        name="wallet-outline"
        size={ms(28)}
        color={Colors.brand.orchid}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingTop: vs(20),
    // paddingBottom: vs(100),
  },
  overviewTotals: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(16),
  },
  overviewDivider: {
    width: 1,
    height: vs(34),
    marginHorizontal: s(8),
    backgroundColor: Colors.neutral[30],
  },
  section: {
    gap: vs(12),
  },
  completedSection: {
    gap: vs(12),
    marginTop: vs(30),
  },
  sectionTitle: {
    ...TextStyles.SemiBold18,
    color: Colors.neutral[100],
    marginBottom: vs(2),
  },
  loanItem: {
    minHeight: vs(68),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: s(12),
    paddingHorizontal: s(16),
    paddingVertical: vs(12),
    borderWidth: 1,
    borderColor: Colors.neutral[30],
    borderLeftWidth: s(3),
    borderLeftColor: Colors.brand.plum,
    borderRadius: ms(14),
    backgroundColor: Colors.neutral[10],
  },
  loanItemPressed: {
    backgroundColor: Colors.neutral[20],
  },
  completedLoanItem: {
    opacity: 0.58,
  },
  loanIdentity: {
    flex: 1,
    gap: vs(4),
  },
  personName: {
    ...TextStyles.SemiBold16,
    color: Colors.brand.deepPlum,
  },
  loanStatus: {
    ...TextStyles.Regular12,
    color: Colors.neutral[60],
  },
  loanAmount: {
    ...TextStyles.SemiBold14,
    color: Colors.brand.plum,
  },
  emptySection: {
    minHeight: vs(84),
    alignItems: 'center',
    justifyContent: 'center',
    gap: vs(6),
    padding: s(12),
    borderWidth: 1,
    borderColor: Colors.neutral[30],
    borderRadius: ms(14),
    backgroundColor: Colors.neutral[10],
  },
  emptyMessage: {
    ...TextStyles.Medium14,
    color: Colors.neutral[70],
    textAlign: 'center',
  },
  statusSkeleton: {
    borderRadius: ms(7),
  },
  errorMessage: {
    ...TextStyles.Regular14,
    color: Colors.status.error,
    marginTop: -vs(16),
    marginBottom: vs(16),
  },
  createLoanFab: {
    position: 'absolute',
    right: s(20),
    bottom: vs(20),
    width: ms(56),
    height: ms(56),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ms(28),
    backgroundColor: Colors.brand.orchid,
    elevation: 5,
    shadowColor: Colors.brand.deepPlum,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.24,
    shadowRadius: 5,
  },
  pressed: {
    opacity: 0.72,
  },
});
