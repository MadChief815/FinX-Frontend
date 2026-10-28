import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

// Components
import { LoadingButton } from '../../components/LoadingButton';
import { BottomSheetModal } from '../../components/BottomSheetModal';
import { Skeleton } from '../../components/Skeleton';
import { Colors } from '../../utils/Colors';
import { ms, s, vs } from '../../utils/Responsive';
import { screenStyles } from '../../utils/screenStyles';
import { TextStyles } from '../../utils/TextStyles';
import { getApiErrorMessage } from '../../utils/apiError';
import { showErrorToast, showSuccessToast } from '../../utils/toast';

// API
import {
  EMPTY_DASHBOARD_DATA,
  getDashboard,
  updateDashboardAmounts,
} from '../../api/adapters/dashboard.adapter';
import type {
  DashboardAccountAmounts,
  DashboardData,
} from '../../api/adapters/dashboard.adapter';

// Icons
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface BreakdownItem {
  id: string;
  month: string;
  amount: number;
}

interface StatItem {
  id: string;
  label: string;
  caption: string;
  amount: number;
  icon: IoniconName;
  iconColor: string;
}

interface MoneySource {
  id: string;
  label: string;
  amount: number;
  icon: IoniconName;
}

interface SavingsItem {
  id: string;
  label: string;
  caption: string;
  icon: IoniconName;
}

const OVERLAY_LIGHT = 'rgba(255, 255, 255, 0.10)';
const SCREEN_BG = '#F7F4FC';
const PLUM_TINT = 'rgba(109, 40, 217, 0.08)';
const CARD_BORDER = 'rgba(109, 40, 217, 0.10)';

const savingsItems: SavingsItem[] = [
  {
    id: 'fixed-deposit',
    label: 'FIXED DEPOSIT',
    caption: 'Locked savings',
    icon: 'lock-closed-outline',
  },
  {
    id: 'flexible-savings',
    label: 'FLEXIBLE SAVINGS',
    caption: 'Access anytime',
    icon: 'flash-outline',
  },
];

type AccountAmountKey = keyof DashboardAccountAmounts;

const ACCOUNT_AMOUNT_FIELDS: { key: AccountAmountKey; label: string }[] = [
  { key: 'bank', label: 'Bank' },
  { key: 'cash', label: 'Cash' },
  { key: 'fixedDeposit', label: 'Fixed deposit' },
  { key: 'flexibleSavings', label: 'Flexible savings' },
];

const formatCurrency = (value: number, decimals = 2): string => {
  const sign = value < 0 ? '-' : '';
  const [whole, fraction] = Math.abs(value).toFixed(decimals).split('.');
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}Rs. ${withCommas}${fraction ? `.${fraction}` : ''}`;
};

export default function DashboardScreen(): React.JSX.Element {
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData>(EMPTY_DASHBOARD_DATA);
  const [amountsAtModalOpen, setAmountsAtModalOpen] =
    useState<DashboardAccountAmounts>(EMPTY_DASHBOARD_DATA);
  const [amountDraft, setAmountDraft] = useState<Record<AccountAmountKey, string>>({
    bank: '0',
    cash: '0',
    fixedDeposit: '0',
    flexibleSavings: '0',
  });
  const [isAmountModalVisible, setIsAmountModalVisible] = useState(false);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingAmounts, setIsSavingAmounts] = useState(false);
  const hasLoadedDashboard = useRef(false);

  const loadDashboard = useCallback(async (showLoading = true): Promise<void> => {
    if (showLoading) {
      setIsDashboardLoading(true);
    }

    try {
      const data = await getDashboard();
      setDashboard(data);
    } catch (error) {
      showErrorToast(
        getApiErrorMessage(error, 'Unable to load dashboard data. Please try again.'),
      );
    } finally {
      hasLoadedDashboard.current = true;
      if (showLoading) {
        setIsDashboardLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard(!hasLoadedDashboard.current);
    }, [loadDashboard]),
  );

  const refreshDashboard = async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      await loadDashboard(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  const currentSavingsItems = savingsItems.map((item) => ({
    ...item,
    amount:
      item.id === 'fixed-deposit'
        ? dashboard.fixedDeposit
        : dashboard.flexibleSavings,
  }));
  const currentMoneySources: MoneySource[] = [
    { id: 'bank', label: 'BANK', amount: dashboard.bank, icon: 'business-outline' },
    { id: 'cash', label: 'CASH', amount: dashboard.cash, icon: 'cash-outline' },
    { id: 'loans', label: 'LOANS', amount: dashboard.loanTotal, icon: 'swap-horizontal-outline' },
    { id: 'income', label: 'INCOME', amount: dashboard.incomeTotal, icon: 'trending-up-outline' },
  ];
  const breakdownItems: BreakdownItem[] = dashboard.months.map((month) => ({
    id: month.month,
    month: month.month,
    amount: month.toSpend,
  }));
  const statItems: StatItem[] = [
    {
      id: 'income',
      label: 'INCOME',
      caption: 'This month',
      amount: dashboard.incomeTotal,
      icon: 'arrow-down',
      iconColor: Colors.brand.deepPlum,
    },
    {
      id: 'loans',
      label: 'LOANS',
      caption: 'This month',
      amount: dashboard.loanTotal,
      icon: 'arrow-up',
      iconColor: Colors.status.error,
    },
  ];

  const openAmountModal = (): void => {
    const currentAmounts: DashboardAccountAmounts = {
      bank: dashboard.bank,
      cash: dashboard.cash,
      fixedDeposit: dashboard.fixedDeposit,
      flexibleSavings: dashboard.flexibleSavings,
    };
    setAmountsAtModalOpen(currentAmounts);
    setAmountDraft({
      bank: String(currentAmounts.bank),
      cash: String(currentAmounts.cash),
      fixedDeposit: String(currentAmounts.fixedDeposit),
      flexibleSavings: String(currentAmounts.flexibleSavings),
    });
    setIsAmountModalVisible(true);
  };

  const updateAmountDraft = (key: AccountAmountKey, value: string): void => {
    setAmountDraft((current) => ({
      ...current,
      [key]: value.replace(/[^0-9]/g, ''),
    }));
  };

  const saveAccountAmounts = async (): Promise<void> => {
    const hasInvalidAmount = ACCOUNT_AMOUNT_FIELDS.some(
      ({ key }) =>
        amountDraft[key].length === 0 ||
        !Number.isSafeInteger(Number(amountDraft[key])),
    );

    if (hasInvalidAmount) {
      showErrorToast('Enter a valid whole-number amount in every field');
      return;
    }

    const updatedAmounts: DashboardAccountAmounts = {
      bank: Number(amountDraft.bank),
      cash: Number(amountDraft.cash),
      fixedDeposit: Number(amountDraft.fixedDeposit),
      flexibleSavings: Number(amountDraft.flexibleSavings),
    };
    const changedAmounts = ACCOUNT_AMOUNT_FIELDS.reduce<Partial<DashboardAccountAmounts>>(
      (changed, { key }) => {
        if (updatedAmounts[key] !== amountsAtModalOpen[key]) {
          changed[key] = updatedAmounts[key];
        }
        return changed;
      },
      {},
    );

    if (Object.keys(changedAmounts).length === 0) {
      setIsAmountModalVisible(false);
      showSuccessToast('Nothing to Save');
      return;
    }

    setIsSavingAmounts(true);
    try {
      await updateDashboardAmounts(changedAmounts);
      setDashboard((current) => {
        const nextAmounts = { ...current, ...changedAmounts };
        return {
          ...nextAmounts,
          totalAvailable:
            changedAmounts.bank !== undefined || changedAmounts.cash !== undefined
              ? nextAmounts.bank + nextAmounts.cash
              : current.totalAvailable,
        };
      });
      setIsAmountModalVisible(false);
      showSuccessToast('Dashboard amounts updated.');
    } catch (error) {
      showErrorToast(
        getApiErrorMessage(error, 'Unable to save dashboard amounts. Please try again.'),
      );
    } finally {
      setIsSavingAmounts(false);
    }
  };

  const toggleMonth = (monthId: string): void => {
    setSelectedMonths((current) =>
      current.includes(monthId)
        ? current.filter((id) => id !== monthId)
        : [...current, monthId],
    );
  };

  const toggleSource = (sourceId: string): void => {
    const isSelected = selectedSources.includes(sourceId);

    // Block selecting a source until at least one month is chosen
    if (!isSelected && selectedMonths.length === 0) {
      showErrorToast('Please select a month first');
      return;
    }

    setSelectedSources((current) =>
      isSelected
        ? current.filter((id) => id !== sourceId)
        : [...current, sourceId],
    );
  };

  const { sourcesTotal, monthsTotal, calculatedBalance } = useMemo(() => {
    const sources = currentMoneySources
      .filter((item) => selectedSources.includes(item.id))
      .reduce((sum, item) => sum + item.amount, 0);
    const months = breakdownItems
      .filter((item) => selectedMonths.includes(item.id))
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      sourcesTotal: sources,
      monthsTotal: months,
      calculatedBalance: sources - months,
    };
  }, [currentMoneySources, selectedSources, selectedMonths]);

  const totalSavings = useMemo(
    () => currentSavingsItems.reduce((sum, item) => sum + item.amount, 0),
    [currentSavingsItems],
  );

  const hasSelection = selectedSources.length > 0 || selectedMonths.length > 0;
  const isNegative = calculatedBalance < 0;

  const handleNotDeveloped = (): void => {
    showErrorToast('Not developed yet');
  };

  return (
    <SafeAreaView style={[screenStyles.container, styles.screen]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshDashboard}
            tintColor="#804E89"
            colors={['#804E89']}
            progressBackgroundColor="#FFFFFF"
          />
        }
      >
        {/* Overview + Savings (single card) */}
        <View style={styles.heroCard}>
          <View style={styles.heroCircleLarge} />
          <View style={styles.heroCircleSmall} />

          <View style={styles.heroContent}>
            <View style={styles.heroTitleRow}>
              <Text style={styles.heroTitle}>Overview</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit account and savings amounts"
                disabled={isDashboardLoading || isSavingAmounts}
                onPress={openAmountModal}
                style={({ pressed }) => [
                  styles.heroIconChip,
                  pressed && styles.cardPressed,
                  (isDashboardLoading || isSavingAmounts) && styles.disabled,
                ]}
              >
                <Ionicons
                  name="wallet-outline"
                  size={ms(24)}
                  color={Colors.neutral[10]}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
              </Pressable>
            </View>

            {isDashboardLoading ? (
              <Skeleton width={ms(132)} height={ms(12)} />
            ) : (
              <Text style={styles.heroLabel}>TOTAL AVAILABLE</Text>
            )}
            {isDashboardLoading ? (
              <Skeleton width={ms(190)} height={ms(38)} style={styles.heroAmountSkeleton} />
            ) : (
              <Text style={styles.heroAmount}>
                {formatCurrency(dashboard.totalAvailable)}
              </Text>
            )}

            <View style={styles.heroTotals}>
              <View style={styles.heroTotalColumn}>
                {isDashboardLoading ? (
                  <Skeleton width={ms(64)} height={ms(12)} />
                ) : (
                  <View style={styles.heroTotalLabelRow}>
                    <Ionicons
                      name="business-outline"
                      size={ms(13)}
                      color={Colors.neutral[30]}
                      accessibilityElementsHidden
                      importantForAccessibility="no"
                    />
                    <Text style={styles.heroTotalLabel}>BANK</Text>
                  </View>
                )}
                {isDashboardLoading ? (
                  <Skeleton width={ms(76)} height={ms(18)} style={styles.valueSkeleton} />
                ) : (
                  <Text style={styles.heroTotalAmount}>{formatCurrency(dashboard.bank)}</Text>
                )}
              </View>
              <View style={styles.heroTotalDivider} />
              <View style={styles.heroTotalColumn}>
                {isDashboardLoading ? (
                  <Skeleton width={ms(64)} height={ms(12)} />
                ) : (
                  <View style={styles.heroTotalLabelRow}>
                    <Ionicons
                      name="cash-outline"
                      size={ms(13)}
                      color={Colors.neutral[30]}
                      accessibilityElementsHidden
                      importantForAccessibility="no"
                    />
                    <Text style={styles.heroTotalLabel}>CASH</Text>
                  </View>
                )}
                {isDashboardLoading ? (
                  <Skeleton width={ms(76)} height={ms(18)} style={styles.valueSkeleton} />
                ) : (
                  <Text style={styles.heroTotalAmount}>{formatCurrency(dashboard.cash)}</Text>
                )}
              </View>
            </View>

            {/* Savings */}
            <View style={styles.savingsSection}>
              <View style={styles.savingsHeader}>
                <View style={styles.savingsHeaderText}>
                  {isDashboardLoading ? (
                    <Skeleton width={ms(132)} height={ms(12)} />
                  ) : (
                    <Text style={styles.savingsTitle}>Savings</Text>
                  )}
                  {isDashboardLoading ? (
                    <Skeleton
                      width={ms(190)}
                      height={ms(38)}
                      style={styles.heroAmountSkeleton}
                    />
                  ) : (
                    <Text style={styles.savingsTotal}>{formatCurrency(totalSavings)}</Text>
                  )}
                </View>
                {isDashboardLoading ? (
                  <Skeleton
                    width={ms(60)}
                    height={ms(60)}
                    style={styles.roundSkeleton}
                  />
                ) : (
                  <View style={styles.heroIconChip}>
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={ms(18)}
                      color={Colors.neutral[10]}
                      accessibilityElementsHidden
                      importantForAccessibility="no"
                    />
                  </View>
                )}
              </View>

              {isDashboardLoading ? (
                <View style={styles.savingsRow}>
                  {[0, 1, 2].map((item, index) => (
                    <React.Fragment key={`savings-skeleton-${item}`}>
                      {index > 0 && <View style={styles.savingsDivider} />}
                      <View style={styles.savingsItem}>
                        <Skeleton width={ms(30)} height={ms(30)} style={styles.roundSkeleton} />
                        <Skeleton width="82%" height={ms(12)} style={styles.savingsSkeletonLabel} />
                        <Skeleton width={ms(80)} height={ms(18)} style={styles.valueSkeleton} />
                        <Skeleton width="64%" height={ms(12)} style={styles.captionSkeleton} />
                      </View>
                    </React.Fragment>
                  ))}
                </View>
              ) : (
                <View style={styles.savingsRow}>
                  {currentSavingsItems.map((item, index) => (
                    <React.Fragment key={item.id}>
                      {index > 0 && <View style={styles.savingsDivider} />}
                      <View
                        style={styles.savingsItem}
                        accessible
                        accessibilityLabel={`${item.label}, ${formatCurrency(item.amount)}`}
                      >
                        <View style={styles.savingsItemIcon}>
                          <Ionicons
                            name={item.icon}
                            size={ms(16)}
                            color={Colors.neutral[10]}
                            accessibilityElementsHidden
                            importantForAccessibility="no"
                          />
                        </View>
                        <Text style={styles.savingsItemLabel}>{item.label}</Text>
                        <Text style={styles.savingsItemAmount}>
                          {formatCurrency(item.amount)}
                        </Text>
                        <Text style={styles.savingsItemCaption}>{item.caption}</Text>
                      </View>
                    </React.Fragment>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statRow}>
          {statItems.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`${item.label}, ${formatCurrency(item.amount)}, ${item.caption}`}
              onPress={handleNotDeveloped}
              style={({ pressed }) => [
                styles.statCard,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.statTop}>
                {isDashboardLoading ? (
                  <Skeleton
                    width={ms(34)}
                    height={ms(34)}
                    style={styles.roundSkeleton}
                  />
                ) : (
                  <View style={styles.statBadge}>
                    <Ionicons
                      name={item.icon}
                      size={ms(16)}
                      color={item.iconColor}
                      accessibilityElementsHidden
                      importantForAccessibility="no"
                    />
                  </View>
                )}
                {isDashboardLoading ? (
                  <Skeleton width={ms(18)} height={ms(18)} style={styles.roundSkeleton} />
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={ms(18)}
                    color={Colors.neutral[50]}
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                  />
                )}
              </View>
              {isDashboardLoading ? (
                <Skeleton width={ms(68)} height={ms(12)} />
              ) : (
                <Text style={styles.statLabel}>{item.label}</Text>
              )}
              {isDashboardLoading ? (
                <Skeleton width={ms(100)} height={ms(23)} style={styles.valueSkeleton} />
              ) : (
                <Text style={styles.statAmount}>{formatCurrency(item.amount)}</Text>
              )}
              {isDashboardLoading ? (
                <Skeleton
                  width={ms(76)}
                  height={ms(12)}
                  style={styles.captionSkeleton}
                />
              ) : (
                <Text style={styles.statCaption}>{item.caption}</Text>
              )}
            </Pressable>
          ))}
        </View>

        {/* Financial Breakdown */}
        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            {isDashboardLoading ? (
              <>
                <Skeleton width={ms(76)} height={ms(22)} />
                <Skeleton
                  width={ms(110)}
                  height={ms(28)}
                  style={styles.pillSkeleton}
                />
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Months</Text>
                <View style={styles.sectionPill}>
                  <Text style={styles.sectionPillText}>
                    {selectedMonths.length} SELECTED
                  </Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.breakdownList}>
            {isDashboardLoading
              ? [0, 1, 2].map((index) => (
                <View
                  key={`month-skeleton-${index}`}
                  style={[
                    styles.breakdownRow,
                    index < 2 && styles.breakdownRowDivider,
                  ]}
                >
                  <Skeleton width={ms(22)} height={ms(22)} />
                  <Skeleton width="42%" height={ms(18)} />
                  <Skeleton width={ms(84)} height={ms(18)} />
                </View>
              ))
              : breakdownItems.map((item, index) => {
                const isChecked = selectedMonths.includes(item.id);

                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="checkbox"
                    accessibilityLabel={`${item.month}, ${formatCurrency(item.amount)}`}
                    accessibilityState={{ checked: isChecked }}
                    onPress={() => toggleMonth(item.id)}
                    style={({ pressed }) => [
                      styles.breakdownRow,
                      index < breakdownItems.length - 1 && styles.breakdownRowDivider,
                      pressed && styles.cardPressed,
                    ]}
                  >
                    <View
                      style={[styles.checkbox, isChecked && styles.checkboxChecked]}
                    >
                      {isChecked && (
                        <Ionicons
                          name="checkmark"
                          size={ms(15)}
                          color={Colors.neutral[10]}
                          accessibilityElementsHidden
                          importantForAccessibility="no"
                        />
                      )}
                    </View>
                    <Text style={styles.breakdownMonth}>{item.month}</Text>
                    <Text
                      style={[
                        styles.breakdownAmount,
                        isChecked && styles.breakdownAmountChecked,
                      ]}
                    >
                      {isChecked ? '-' : ''}
                      {formatCurrency(item.amount)}
                    </Text>
                  </Pressable>
                );
              })}
          </View>
        </View>

        {/* Money Sources */}
        <View style={styles.section}>
          <View style={styles.moneySourcesHeading}>
            {isDashboardLoading ? (
              <Skeleton width={ms(142)} height={ms(22)} />
            ) : (
              <Text style={styles.sectionTitle}>Money Source</Text>
            )}
          </View>
          <View style={styles.moneySourceGrid}>
            {currentMoneySources.map((source) => {
              const isSelected = selectedSources.includes(source.id);

              return (
                <Pressable
                  key={source.id}
                  accessibilityRole="checkbox"
                  accessibilityLabel={`${source.label}, ${formatCurrency(source.amount)}`}
                  accessibilityState={{ checked: isSelected }}
                  onPress={() => toggleSource(source.id)}
                  style={({ pressed }) => [
                    styles.moneySourceCard,
                    isSelected && !isDashboardLoading && styles.moneySourceCardSelected,
                    pressed && styles.cardPressed,
                  ]}
                >
                  <View style={styles.moneySourceTop}>
                    {isDashboardLoading ? (
                      <Skeleton
                        width={ms(34)}
                        height={ms(34)}
                        style={styles.roundSkeleton}
                      />
                    ) : (
                      <View
                        style={[
                          styles.moneySourceIcon,
                          isSelected && styles.moneySourceIconSelected,
                        ]}
                      >
                        <Ionicons
                          name={source.icon}
                          size={ms(18)}
                          color={isSelected ? Colors.neutral[10] : Colors.brand.deepPlum}
                          accessibilityElementsHidden
                          importantForAccessibility="no"
                        />
                      </View>
                    )}
                    {isDashboardLoading && isSelected && (
                      <Skeleton
                        width={ms(20)}
                        height={ms(20)}
                        style={styles.roundSkeleton}
                      />
                    )}
                    {!isDashboardLoading && isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={ms(20)}
                        color={Colors.neutral[10]}
                        accessibilityElementsHidden
                        importantForAccessibility="no"
                      />
                    )}
                  </View>
                  {isDashboardLoading ? (
                    <Skeleton width={ms(76)} height={ms(12)} />
                  ) : (
                    <Text
                      style={[
                        styles.moneySourceLabel,
                        isSelected && styles.moneySourceLabelSelected,
                      ]}
                    >
                      {source.label}
                    </Text>
                  )}
                  {isDashboardLoading ? (
                    <Skeleton
                      width={ms(100)}
                      height={ms(24)}
                      style={styles.valueSkeleton}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.moneySourceAmount,
                        isSelected && styles.moneySourceAmountSelected,
                      ]}
                    >
                      {formatCurrency(source.amount)}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Calculated Balance */}
        <View style={styles.balanceCard}>
          <View style={[styles.heroCircleLarge, { width: ms(180), height: ms(180), borderRadius: ms(90) }]} />

          <View style={styles.heroHeader}>
            <Text style={[styles.heroLabel, { ...TextStyles.SemiBold14 }]}>CALCULATED BALANCE</Text>
            <View style={[styles.heroIconChip, { backgroundColor: "trasnparent" }]}>
              <MaterialDesignIcons
                name="calculator-variant-outline"
                size={ms(40)}
                color={Colors.neutral[30]}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
            </View>
          </View>

          {isDashboardLoading ? (
            <Skeleton
              width={ms(220)}
              height={ms(38)}
              style={styles.balanceAmountSkeleton}
            />
          ) : (
            <Text
              style={[styles.balanceAmount, isNegative && styles.balanceAmountNegative]}
              accessibilityLiveRegion="polite"
            >
              {formatCurrency(calculatedBalance)}
            </Text>
          )}

          <View style={styles.balanceSummary}>
            {isDashboardLoading ? (
              <View style={styles.balanceSummaryLoading}>
                <View style={styles.balanceSummaryColumn}>
                  <Skeleton width={ms(64)} height={ms(12)} />
                  <Skeleton
                    width={ms(84)}
                    height={ms(18)}
                    style={styles.balanceSummarySkeleton}
                  />
                </View>
                <View style={styles.heroTotalDivider} />
                <View style={styles.balanceSummaryColumn}>
                  <Skeleton width={ms(58)} height={ms(12)} />
                  <Skeleton
                    width={ms(84)}
                    height={ms(18)}
                    style={styles.balanceSummarySkeleton}
                  />
                </View>
              </View>
            ) : hasSelection ? (
              <>
                <View style={styles.balanceSummaryColumn}>
                  <Text style={styles.heroTotalLabel}>SOURCES</Text>
                  {isDashboardLoading ? (
                    <Skeleton
                      width={ms(84)}
                      height={ms(18)}
                      style={styles.balanceSummarySkeleton}
                    />
                  ) : (
                    <Text style={styles.balanceSummaryValue}>
                      {formatCurrency(sourcesTotal)}
                    </Text>
                  )}
                </View>
                <View style={styles.heroTotalDivider} />
                <View style={styles.balanceSummaryColumn}>
                  <Text style={styles.heroTotalLabel}>MONTHS</Text>
                  {isDashboardLoading ? (
                    <Skeleton
                      width={ms(84)}
                      height={ms(18)}
                      style={styles.balanceSummarySkeleton}
                    />
                  ) : (
                    <Text style={styles.balanceSummaryValue}>
                      -{formatCurrency(monthsTotal)}
                    </Text>
                  )}
                </View>
              </>
            ) : (
              <Text style={styles.balanceHint}>
                Select months first, then money sources to calculate your balance
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      <BottomSheetModal
        visible={isAmountModalVisible}
        onClose={() => setIsAmountModalVisible(false)}
        size="large"
        contentStyle={styles.amountModalCard}
      >
        <View style={styles.amountModalContent}>
          <View style={styles.amountModalHeader}>
            <View style={styles.amountModalHeading}>
              <Text style={styles.amountModalTitle}>Edit amounts</Text>
              <Text style={styles.amountModalSubtitle}>
                Enter whole amounts in rupees
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close amount editor"
              onPress={() => setIsAmountModalVisible(false)}
              style={({ pressed }) => [
                styles.amountModalClose,
                pressed && styles.cardPressed,
              ]}
            >
              <Ionicons
                name="close"
                size={ms(22)}
                color={Colors.brand.deepPlum}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
            </Pressable>
          </View>

          {ACCOUNT_AMOUNT_FIELDS.map(({ key, label }) => (
            <View key={key} style={styles.amountField}>
              <Text style={styles.amountFieldLabel}>{label}</Text>
              <View style={styles.amountInputContainer}>
                <Text style={styles.amountInputPrefix}>Rs.</Text>
                <TextInput
                  accessibilityLabel={`${label} amount`}
                  value={amountDraft[key]}
                  onChangeText={(value) => updateAmountDraft(key, value)}
                  keyboardType="number-pad"
                  maxLength={16}
                  selectTextOnFocus
                  style={styles.amountInput}
                />
              </View>
            </View>
          ))}

          <LoadingButton
            isLoading={isSavingAmounts}
            onPress={saveAccountAmounts}
            style={styles.amountSaveButton}
          >
            <Text style={styles.amountSaveButtonText}>Save amounts</Text>
          </LoadingButton>
        </View>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

const cardShadow = {
  shadowColor: Colors.brand.deepPlum,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.06,
  shadowRadius: 12,
  elevation: 2,
} as const;

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    backgroundColor: SCREEN_BG,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: s(20),
    paddingTop: 0,
    // paddingBottom: vs(24),
  },

  // Hero
  heroCard: {
    marginHorizontal: -s(20),
    padding: 0,
    borderRadius: 0,
    backgroundColor: Colors.brand.deepPlum,
    overflow: 'hidden',
    shadowColor: Colors.brand.deepPlum,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 10,
  },
  heroTitle: {
    ...TextStyles.SemiBold24,
    color: Colors.neutral[10],
  },
  heroTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(16),
  },
  heroContent: {
    padding: s(22),
  },
  heroCircleLarge: {
    position: 'absolute',
    top: -ms(60),
    right: -ms(40),
    width: ms(200),
    height: ms(200),
    borderRadius: ms(100),
    backgroundColor: OVERLAY_LIGHT,
  },
  heroCircleSmall: {
    position: 'absolute',
    bottom: -ms(70),
    left: -ms(50),
    width: ms(200),
    height: ms(200),
    borderRadius: ms(100),
    backgroundColor: OVERLAY_LIGHT,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    ...TextStyles.SemiBold12,
    color: Colors.neutral[30],
    letterSpacing: 1.4,
  },
  heroIconChip: {
    width: ms(60),
    height: ms(60),
    borderRadius: ms(30),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: OVERLAY_LIGHT,
  },
  heroAmount: {
    ...TextStyles.Bold32,
    color: Colors.neutral[10],
    marginTop: vs(6),
    marginBottom: vs(18),
  },
  heroTotals: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(12),
    paddingHorizontal: s(16),
    borderRadius: ms(18),
    backgroundColor: OVERLAY_LIGHT,
  },
  heroTotalColumn: {
    flex: 1,
  },
  heroTotalLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
  },
  heroTotalDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginHorizontal: s(16),
    backgroundColor: Colors.neutral[50],
  },
  heroTotalLabel: {
    ...TextStyles.SemiBold12,
    color: Colors.neutral[30],
    letterSpacing: 0.8,
  },
  heroTotalAmount: {
    ...TextStyles.Bold16,
    color: Colors.neutral[10],
    marginTop: vs(4),
  },

  // Savings (inside hero card)
  savingsSection: {
    marginTop: vs(20),
    paddingTop: vs(18),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.neutral[50],
  },
  savingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(14),
  },
  savingsHeaderText: {
    flex: 1,
  },
  savingsTitle: {
    ...TextStyles.SemiBold12,
    color: Colors.neutral[20],
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  savingsTotal: {
    ...TextStyles.Bold24,
    color: Colors.neutral[10],
    marginTop: vs(4),
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  savingsItem: {
    flex: 1,
  },
  savingsDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginHorizontal: s(14),
    backgroundColor: Colors.neutral[50],
  },
  savingsItemIcon: {
    width: ms(30),
    height: ms(30),
    borderRadius: ms(15),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(8),
    backgroundColor: OVERLAY_LIGHT,
  },
  savingsItemLabel: {
    ...TextStyles.SemiBold12,
    color: Colors.neutral[30],
    letterSpacing: 0.8,
  },
  savingsSkeletonLabel: {
    marginTop: vs(8),
    marginBottom: vs(4),
  },
  savingsItemAmount: {
    ...TextStyles.Bold16,
    color: Colors.neutral[10],
    marginTop: vs(4),
  },
  savingsItemCaption: {
    ...TextStyles.SemiBold12,
    color: Colors.neutral[30],
    marginTop: vs(2),
  },

  // Stats
  statRow: {
    flexDirection: 'row',
    gap: s(12),
    marginTop: vs(16),
  },
  statCard: {
    flex: 1,
    padding: s(16),
    borderRadius: ms(22),
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: Colors.neutral[10],
    ...cardShadow,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.6,
  },
  statTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(14),
  },
  statBadge: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(17),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PLUM_TINT,
  },
  statLabel: {
    ...TextStyles.SemiBold12,
    color: Colors.neutral[60],
    letterSpacing: 0.8,
  },
  statAmount: {
    ...TextStyles.Bold20,
    color: Colors.neutral[100],
    marginTop: vs(4),
  },
  valueSkeleton: {
    marginTop: vs(4),
  },
  roundSkeleton: {
    borderRadius: ms(100),
  },
  captionSkeleton: {
    marginTop: vs(2),
  },
  pillSkeleton: {
    borderRadius: ms(20),
  },
  heroAmountSkeleton: {
    marginTop: vs(6),
    marginBottom: vs(18),
  },
  statCaption: {
    ...TextStyles.SemiBold12,
    color: Colors.neutral[60],
    marginTop: vs(2),
  },

  // Sections
  section: {
    marginTop: vs(28),
  },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: vs(12),
  },
  sectionTitle: {
    ...TextStyles.SemiBold18,
    color: Colors.neutral[100],
  },
  sectionPill: {
    paddingHorizontal: s(12),
    paddingVertical: vs(5),
    borderRadius: ms(20),
    backgroundColor: PLUM_TINT,
  },
  sectionPillText: {
    ...TextStyles.SemiBold12,
    color: Colors.brand.deepPlum,
    letterSpacing: 0.8,
  },

  // Breakdown
  breakdownList: {
    paddingHorizontal: s(14),
    borderRadius: ms(18),
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: Colors.neutral[10],
    ...cardShadow,
  },
  breakdownRow: {
    minHeight: vs(58),
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(8),
  },
  breakdownRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: CARD_BORDER,
  },
  checkbox: {
    width: ms(24),
    height: ms(24),
    borderRadius: ms(12),
    borderWidth: 1.5,
    borderColor: Colors.neutral[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(12),
    backgroundColor: Colors.neutral[10],
  },
  checkboxChecked: {
    borderColor: Colors.brand.deepPlum,
    backgroundColor: Colors.brand.deepPlum,
  },
  breakdownMonth: {
    ...TextStyles.SemiBold14,
    color: Colors.neutral[90],
    flex: 1,
  },
  breakdownAmount: {
    ...TextStyles.SemiBold14,
    color: Colors.neutral[90],
  },
  breakdownAmountChecked: {
    color: Colors.status.error,
  },

  // Money sources
  moneySourcesHeading: {
    marginBottom: vs(12),
  },
  moneySourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(12),
  },
  moneySourceCard: {
    width: '48%',
    flexGrow: 1,
    minHeight: vs(112),
    padding: s(14),
    borderRadius: ms(22),
    borderWidth: 1.5,
    borderColor: CARD_BORDER,
    backgroundColor: Colors.neutral[10],
    ...cardShadow,
  },
  moneySourceCardSelected: {
    backgroundColor: Colors.brand.deepPlum,
    borderColor: Colors.brand.deepPlum,
  },
  moneySourceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(12),
  },
  moneySourceIcon: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(17),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PLUM_TINT,
  },
  moneySourceIconSelected: {
    backgroundColor: OVERLAY_LIGHT,
  },
  moneySourceLabel: {
    ...TextStyles.SemiBold12,
    color: Colors.neutral[60],
    letterSpacing: 0.8,
  },
  moneySourceLabelSelected: {
    color: Colors.neutral[30],
  },
  moneySourceAmount: {
    ...TextStyles.Bold18,
    color: Colors.neutral[100],
    marginTop: vs(4),
  },
  moneySourceAmountSelected: {
    color: Colors.neutral[10],
  },

  // Calculated balance
  balanceCard: {
    marginHorizontal: -(22),
    padding: s(22),
    marginTop: vs(28),
    // borderRadius: ms(28),
    backgroundColor: Colors.brand.deepPlum,
    overflow: 'hidden',
    shadowColor: Colors.brand.deepPlum,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 10,
  },
  balanceAmount: {
    ...TextStyles.Bold32,
    color: Colors.neutral[10],
    marginTop: vs(10),
    marginBottom: vs(18),
  },
  balanceAmountNegative: {
    color: Colors.status.error,
  },
  balanceAmountSkeleton: {
    marginTop: vs(10),
    marginBottom: vs(18),
  },
  balanceSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(12),
    paddingHorizontal: s(16),
    borderRadius: ms(18),
    backgroundColor: OVERLAY_LIGHT,
  },
  balanceSummaryLoading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceSummaryColumn: {
    flex: 1,
  },
  balanceSummaryValue: {
    ...TextStyles.Bold16,
    color: Colors.neutral[10],
    marginTop: vs(4),
  },
  balanceSummarySkeleton: {
    marginTop: vs(4),
  },
  balanceHint: {
    ...TextStyles.SemiBold12,
    color: Colors.neutral[30],
    flex: 1,
  },
  amountModalCard: {
    width: '100%',
    maxHeight: '92%',
    borderTopLeftRadius: ms(26),
    borderTopRightRadius: ms(26),
    backgroundColor: '#E8DDF3',
    overflow: 'hidden',
  },
  amountModalContent: {
    padding: s(22),
  },
  amountModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(20),
  },
  amountModalHeading: {
    flex: 1,
  },
  amountModalTitle: {
    ...TextStyles.Bold20,
    color: Colors.neutral[100],
  },
  amountModalSubtitle: {
    ...TextStyles.SemiBold12,
    color: Colors.neutral[60],
    marginTop: vs(4),
  },
  amountModalClose: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PLUM_TINT,
  },
  amountField: {
    marginBottom: vs(14),
  },
  amountFieldLabel: {
    ...TextStyles.SemiBold12,
    color: Colors.neutral[70],
    marginBottom: vs(6),
  },
  amountInputContainer: {
    height: vs(50),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(14),
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: 'rgba(109, 40, 217, 0.22)',
    backgroundColor: '#E2D5F0',
  },
  amountInputPrefix: {
    ...TextStyles.SemiBold14,
    color: Colors.neutral[60],
    marginRight: s(8),
  },
  amountInput: {
    ...TextStyles.SemiBold16,
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    color: Colors.neutral[100],
  },
  amountSaveButton: {
    minHeight: vs(50),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(6),
    borderRadius: ms(14),
    backgroundColor: Colors.brand.deepPlum,
  },
  amountSaveButtonText: {
    ...TextStyles.SemiBold16,
    color: Colors.neutral[10],
  },
});