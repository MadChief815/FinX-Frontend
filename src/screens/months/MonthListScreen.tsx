import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MonthsStackParamList } from '../../navigation/types';

// API
import { getMonths } from '../../api/adapters/months.adapter';
import type { MonthListItem } from '../../api/adapters/months.adapter';

// Components
import Header from '../../components/Header';
import { LoadingButton } from '../../components/LoadingButton';
import { Skeleton } from '../../components/Skeleton';

// Utilities
import { Colors } from '../../utils/Colors';
import { getApiErrorMessage } from '../../utils/apiError';
import { ms, s, vs } from '../../utils/Responsive';
import { screenStyles } from '../../utils/screenStyles';
import { TextStyles } from '../../utils/TextStyles';
import { showErrorToast } from '../../utils/toast';

type MonthListScreenProps = NativeStackScreenProps<
  MonthsStackParamList,
  'MonthList'
>;

const formatCurrency = (value: number): string => {
  const sign = value < 0 ? '-' : '';
  const [whole, fraction] = Math.abs(value).toFixed(2).split('.');
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}Rs. ${withCommas}.${fraction}`;
};

export default function MonthListScreen({
  navigation,
}: MonthListScreenProps): React.JSX.Element {
  const [months, setMonths] = useState<MonthListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadMonths = useCallback(async (showLoading: boolean): Promise<void> => {
    if (showLoading) {
      setIsLoading(true);
    }
    try {
      setMonths(await getMonths());
      setLoadError(null);
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'Unable to load months. Please try again.',
      );
      setLoadError(message);
      showErrorToast(message);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadMonths(true);
  }, [loadMonths]);

  const refreshMonths = async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      await loadMonths(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  const retryMonths = async (): Promise<void> => {
    setIsRetrying(true);
    try {
      await loadMonths(false);
    } finally {
      setIsRetrying(false);
    }
  };

  const { activeMonths, completedMonths } = useMemo(() => {
    return {
      activeMonths: months.filter((month) => !month.isCompleted),
      completedMonths: months.filter((month) => month.isCompleted),
    };
  }, [months]);

  const renderMonth = (
    month: MonthListItem,
    isCompleted: boolean,
  ): React.JSX.Element => (
    <Pressable
      key={month.id}
      accessibilityRole="button"
      accessibilityLabel={`${month.title} ${month.year}, ${formatCurrency(month.total)}`}
      accessibilityHint="Opens month details"
      onPress={() => navigation.navigate('MonthDetail', { monthId: month.id })}
      style={({ pressed }) => [
        styles.monthItem,
        isCompleted && styles.completedMonthItem,
        pressed && styles.monthItemPressed,
      ]}
    >
      <Text numberOfLines={1} style={styles.monthName}>
        {month.title} {month.year}
      </Text>
      <Text numberOfLines={1} style={styles.monthAmount}>
        {formatCurrency(month.total)}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={screenStyles.container}>
      {/* Header */}
      <Header title="Months" back={false} titleColor={Colors.brand.deepPlum} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void refreshMonths()}
            tintColor={Colors.brand.plum}
            colors={[Colors.brand.plum]}
          />
        }
      >
        {isLoading ? (
          <>
            {/* Active Months */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Months</Text>
              {[0, 1, 2].map((index) => (
                <MonthSkeleton key={`active-skeleton-${index}`} />
              ))}
            </View>

            {/* Completed Months */}
            <View style={styles.completedSection}>
              <Text style={styles.sectionTitle}>Completed Months</Text>
              {[0, 1, 2].map((index) => (
                <MonthSkeleton key={`completed-skeleton-${index}`} />
              ))}
            </View>
          </>
        ) : (
          <>
            {/* Active Months */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Months</Text>
              {loadError !== null && months.length === 0 ? (
                <LoadError
                  message={loadError}
                  isLoading={isRetrying}
                  onRetry={() => void retryMonths()}
                />
              ) : activeMonths.length > 0 ? (
                activeMonths.map((month) => renderMonth(month, false))
              ) : (
                <Text style={styles.emptyMessage}>
                  No active months yet.
                </Text>
              )}
            </View>

            {/* Completed Months */}
            <View style={styles.completedSection}>
              <Text style={styles.sectionTitle}>Completed Months</Text>
              {loadError !== null && months.length === 0 ? null : completedMonths.length > 0 ? (
                completedMonths.map((month) => renderMonth(month, true))
              ) : (
                <Text style={styles.emptyMessage}>
                  No completed months yet.
                </Text>
              )}
            </View>
            {loadError !== null && months.length > 0 && (
              <Text accessibilityRole="alert" style={styles.errorMessage}>
                {loadError}
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MonthSkeleton(): React.JSX.Element {
  return (
    <View style={styles.monthItem}>
      <Skeleton width="46%" height={ms(18)} />
      <Skeleton width={ms(92)} height={ms(18)} />
    </View>
  );
}

function LoadError({
  message,
  isLoading,
  onRetry,
}: {
  message: string;
  isLoading: boolean;
  onRetry: () => void;
}): React.JSX.Element {
  return (
    <View>
      <Text accessibilityRole="alert" style={styles.errorMessage}>
        {message}
      </Text>
      <LoadingButton
        isLoading={isLoading}
        onPress={onRetry}
        style={styles.retryButton}
      >
        <Text style={styles.retryText}>Try again</Text>
      </LoadingButton>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: vs(24),
    paddingBottom: vs(24),
  },
  section: {
    gap: vs(12),
  },
  completedSection: {
    gap: vs(12),
    marginTop: vs(32),
  },
  sectionTitle: {
    ...TextStyles.SemiBold18,
    color: Colors.brand.deepPlum,
    marginBottom: vs(2),
  },
  monthItem: {
    minHeight: vs(68),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: s(12),
    paddingHorizontal: s(16),
    paddingVertical: vs(14),
    borderWidth: 1,
    borderColor: Colors.neutral[30],
    borderLeftWidth: s(3),
    borderLeftColor: Colors.brand.plum,
    borderRadius: ms(14),
    backgroundColor: Colors.neutral[10],
  },
  completedMonthItem: {
    opacity: 0.58,
  },
  monthItemPressed: {
    backgroundColor: Colors.neutral[20],
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: vs(12),
    paddingHorizontal: s(14),
    paddingVertical: vs(8),
    borderRadius: ms(10),
    backgroundColor: Colors.brand.plum,
  },
  retryText: {
    ...TextStyles.SemiBold14,
    color: Colors.neutral[10],
  },
  monthName: {
    ...TextStyles.SemiBold16,
    flex: 1,
    color: Colors.brand.deepPlum,
  },
  monthAmount: {
    ...TextStyles.SemiBold14,
    color: Colors.brand.plum,
  },
  emptyMessage: {
    ...TextStyles.Regular14,
    color: Colors.neutral[60],
    paddingVertical: vs(8),
  },
  errorMessage: {
    ...TextStyles.Regular14,
    color: Colors.status.error,
    marginTop: vs(16),
  },
});
