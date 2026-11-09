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
import type { IncomeStackParamList } from '../../navigation/types';

// API
import { getIncomes } from '../../api/adapters/incomes.adapter';
import type { Income } from '../../api/adapters/incomes.adapter';

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
import { formatIncomeDate } from './IncomeDatePicker';

type IncomeScreenProps = NativeStackScreenProps<IncomeStackParamList, 'Income'>;

const formatCurrency = (value: number): string => {
  const [whole, fraction] = value.toFixed(2).split('.');
  return `Rs. ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`;
};

const amountValue = (amount: string): number => {
  const value = Number(amount);
  return Number.isFinite(value) ? value : 0;
};

export default function IncomeScreen({
  navigation,
}: IncomeScreenProps): React.JSX.Element {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const hasLoadedIncomes = useRef(false);

  const loadIncomes = useCallback(async (showLoading: boolean): Promise<void> => {
    if (showLoading) setIsLoading(true);
    try {
      setIncomes(await getIncomes());
      setLoadError(false);
    } catch (error) {
      setLoadError(true);
      showErrorToast(
        getApiErrorMessage(error, 'Unable to load incomes. Please try again.'),
      );
    } finally {
      hasLoadedIncomes.current = true;
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadIncomes(!hasLoadedIncomes.current);
    }, [loadIncomes]),
  );

  const refreshIncomes = async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      await loadIncomes(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  const totals = useMemo(() => ({
    received: incomes
      .filter((income) => income.isReceived)
      .reduce((sum, income) => sum + amountValue(income.amount), 0),
    expected: incomes
      .filter((income) => !income.isReceived)
      .reduce((sum, income) => sum + amountValue(income.amount), 0),
  }), [incomes]);

  const expectedIncomes = useMemo(
    () => incomes.filter((income) => !income.isReceived),
    [incomes],
  );
  const completedIncomes = useMemo(
    () => incomes.filter((income) => income.isReceived),
    [incomes],
  );

  const renderIncome = (income: Income, completed = false): React.JSX.Element => (
    <Pressable
      key={income.id}
      accessibilityRole="button"
      accessibilityLabel={`${income.title}, ${formatCurrency(amountValue(income.amount))}, ${completed ? 'completed' : 'expected'}`}
      accessibilityHint="Opens income details"
      onPress={() => navigation.navigate('IncomeDetail', { incomeId: income.id })}
      style={({ pressed }) => [
        styles.incomeItem,
        completed && styles.completedIncomeItem,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.incomeIdentity}>
        <Text numberOfLines={1} style={styles.incomeTitle}>{income.title}</Text>
        <View style={styles.incomeMeta}>
          <Text style={styles.incomeDate}>{formatIncomeDate(income.expectedDate)}</Text>
          <View style={styles.statusPill}>
            <Text style={[styles.statusText, completed && styles.receivedText]}>
              {completed ? 'Completed' : 'Expected'}
            </Text>
          </View>
        </View>
      </View>
      <Text numberOfLines={1} style={styles.incomeAmount}>
        {formatCurrency(amountValue(income.amount))}
      </Text>
    </Pressable>
  );

  const renderSection = (
    title: string,
    items: Income[],
    emptyMessage: string,
    completed = false,
  ): React.JSX.Element => (
    <View style={completed ? styles.completedSection : styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.length > 0 ? (
        items.map((income) => renderIncome(income, completed))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons
            name="trending-up-outline"
            size={ms(30)}
            color={Colors.brand.orchid}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text style={styles.emptyMessage}>{emptyMessage}</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={screenStyles.container}>
      {/* Header */}
      <Header title="Income" back={false} titleColor={Colors.brand.deepPlum} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void refreshIncomes()}
            tintColor={Colors.brand.plum}
            colors={[Colors.brand.plum]}
          />
        }
      >
        {/* Summary */}
        <SummaryCard>
          <View style={styles.overviewTotals}>
            <SummaryItem
              label="Received"
              value={formatCurrency(totals.received)}
              isLoading={isLoading}
            />
            <View style={styles.overviewDivider} />
            <SummaryItem
              label="Expected"
              value={formatCurrency(totals.expected)}
              isLoading={isLoading}
            />
          </View>
        </SummaryCard>

        {loadError && (
          <Text accessibilityRole="alert" style={styles.errorMessage}>
            Unable to refresh incomes. Pull down to try again.
          </Text>
        )}

        {/* Income List */}
        {isLoading ? (
          <>
            <IncomeSectionSkeleton title="Expected" />
            <IncomeSectionSkeleton title="Completed" completed />
          </>
        ) : (
          <>
            {renderSection('Expected', expectedIncomes, 'No expected income')}
            {renderSection(
              'Completed',
              completedIncomes,
              'No completed income',
              true,
            )}
          </>
        )}
      </ScrollView>

      {/* Create Income */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create an income"
        onPress={() => navigation.navigate('IncomeCreate')}
        style={({ pressed }) => [styles.createFab, pressed && styles.pressed]}
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

function IncomeSectionSkeleton({
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
        <View
          key={`${title}-${index}`}
          style={[styles.incomeItem, completed && styles.completedIncomeItem]}
        >
          <View style={styles.incomeIdentity}>
            <Skeleton width="58%" height={ms(18)} />
            <Skeleton width={ms(118)} height={ms(14)} />
          </View>
          <Skeleton width={ms(92)} height={ms(18)} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingTop: vs(20),
    paddingBottom: vs(92),
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
  incomeItem: {
    minHeight: vs(72),
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
  completedIncomeItem: {
    opacity: 0.58,
  },
  incomeIdentity: {
    flex: 1,
    gap: vs(5),
  },
  incomeTitle: {
    ...TextStyles.SemiBold16,
    color: Colors.brand.deepPlum,
  },
  incomeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  incomeDate: {
    ...TextStyles.Regular12,
    color: Colors.neutral[60],
  },
  statusPill: {
    paddingHorizontal: s(8),
    paddingVertical: vs(2),
    borderRadius: ms(10),
    backgroundColor: Colors.neutral[20],
  },
  statusText: {
    ...TextStyles.Medium12,
    color: Colors.neutral[70],
  },
  receivedText: {
    color: Colors.brand.teal,
  },
  incomeAmount: {
    ...TextStyles.SemiBold14,
    color: Colors.brand.plum,
  },
  emptyState: {
    minHeight: vs(120),
    alignItems: 'center',
    justifyContent: 'center',
    gap: vs(8),
    borderWidth: 1,
    borderColor: Colors.neutral[30],
    borderRadius: ms(14),
    backgroundColor: Colors.neutral[10],
  },
  emptyMessage: {
    ...TextStyles.Medium14,
    color: Colors.neutral[70],
  },
  errorMessage: {
    ...TextStyles.Regular14,
    color: Colors.status.error,
    marginTop: -vs(16),
    marginBottom: vs(16),
  },
  createFab: {
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
