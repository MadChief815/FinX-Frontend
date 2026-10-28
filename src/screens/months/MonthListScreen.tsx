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
import type { MonthsStackParamList } from '../../navigation/types';

// API
import { getMonths } from '../../api/adapters/months.adapter';
import type { MonthListItem } from '../../api/adapters/months.adapter';

// Components
import Header from '../../components/Header';
import { Skeleton } from '../../components/Skeleton';

// Icons
import Ionicons from 'react-native-vector-icons/Ionicons'

// Utilities
import { Colors } from '../../utils/Colors';
import { ms, s, vs } from '../../utils/Responsive';
import { screenStyles } from '../../utils/screenStyles';
import { TextStyles } from '../../utils/TextStyles';

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
  const [loadError, setLoadError] = useState(false);
  const hasLoadedMonths = useRef(false);

  const loadMonths = useCallback(async (showLoading: boolean): Promise<void> => {
    if (showLoading) {
      setIsLoading(true);
    }
    try {
      setMonths(await getMonths());
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      hasLoadedMonths.current = true;
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadMonths(!hasLoadedMonths.current);
    }, [loadMonths]),
  );

  const refreshMonths = async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      await loadMonths(false);
    } finally {
      setIsRefreshing(false);
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
      onPress={() => navigation.navigate('MonthDetail', { month })}
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
        ) : loadError && months.length === 0 ? (
          <View style={styles.fullEmptyState}>
            <View style={styles.emptySection}>
              <MonthIcon name="calendar-outline" size={ms(40)} />
              <Text accessibilityRole="alert" style={styles.emptyMessage}>
                Unable to load months. Please pull down to refresh
              </Text>
            </View>
          </View>
        ) : months.length === 0 ? (
          <View style={styles.fullEmptyState}>
            <CreateMonthAction
              onPress={() => navigation.navigate('MonthCreate')}
              emptyState
            />
          </View>
        ) : (
          <>
            {/* Active Months */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Months</Text>
              {activeMonths.length > 0 ? (
                activeMonths.map((month) => renderMonth(month, false))
              ) : (
                <EmptySection
                  message="No active months available"
                  actionLabel="Create a month"
                  onAction={() => navigation.navigate('MonthCreate')}
                />
              )}
            </View>

            {/* Completed Months */}
            <View style={styles.completedSection}>
              <Text style={styles.sectionTitle}>Completed Months</Text>
              {completedMonths.length > 0 ? (
                completedMonths.map((month) => renderMonth(month, true))
              ) : (
                <EmptySection message="No completed months" />
              )}
            </View>
            {loadError && months.length > 0 && (
              <Text accessibilityRole="alert" style={styles.errorMessage}>
                Unable to load months. Please try again.
              </Text>
            )}
          </>
        )}
      </ScrollView>
      {!isLoading && months.length > 0 && (
        <CreateMonthAction
          onPress={() => navigation.navigate('MonthCreate')}
          floating
        />
      )}
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

function MonthIcon({
  name,
  size,
  contained = false,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  size: number;
  contained?: boolean;
}): React.JSX.Element {
  return (
    <View style={styles.iconContainer}>
      <View style={contained && styles.createMonthIcon}>
        <Ionicons
          name={name}
          size={size}
          color={contained ? Colors.neutral[10] : Colors.brand.orchid}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </View>
    </View>
  );
}

function EmptySection({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.emptySection}>
      <MonthIcon
        name="calendar-outline"
        size={ms(30)}
      />
      <Text style={styles.emptyMessage}>{message}</Text>
      {actionLabel !== undefined && onAction !== undefined && (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => pressed && styles.actionPressed}
        >
          <Text style={styles.emptyAction}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

function CreateMonthAction({
  onPress,
  emptyState = false,
  floating = false,
}: {
  onPress: () => void;
  emptyState?: boolean;
  floating?: boolean;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Create a month"
      onPress={onPress}
      style={({ pressed }) => [
        emptyState
          ? styles.createMonthEmptyState
          : floating
            ? styles.createMonthFab
            : styles.createMonthButton,
        pressed && styles.actionPressed,
      ]}
    >
      <MonthIcon
        name="add"
        size={ms(emptyState ? 30 : 24)}
        contained
      />
      {emptyState && (
        <Text style={styles.emptyAction}>Create a month</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingTop: vs(24),
    paddingBottom: vs(96),
  },
  fullEmptyState: {
    flex: 1,
    justifyContent: 'center',
  },
  loadErrorState: {
    alignItems: 'center',
    paddingHorizontal: s(24),
  },
  createMonthButton: {
    minWidth: s(44),
    minHeight: vs(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  createMonthFab: {
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
  createMonthEmptyState: {
    alignItems: 'center',
    gap: vs(12),
    alignSelf: 'center',
    padding: s(16),
  },
  createMonthIcon: {
    width: ms(44),
    height: ms(44),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ms(22),
    backgroundColor: Colors.brand.orchid,
  },
  iconContainer: {
    width: ms(64),
    height: ms(64),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(24),
  },
  emptyAction: {
    ...TextStyles.SemiBold14,
    color: Colors.brand.plum,
  },
  actionPressed: {
    opacity: 0.72,
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
    color: Colors.neutral[100],
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
    ...TextStyles.Medium14,
    color: Colors.neutral[100],
    textAlign: 'center',
  },
  errorMessage: {
    ...TextStyles.Regular14,
    color: Colors.status.error,
    marginTop: vs(16),
  },
  loadErrorMessage: {
    ...TextStyles.SemiBold14,
    color: Colors.brand.orchid,
    textAlign: 'center',
  },
});
