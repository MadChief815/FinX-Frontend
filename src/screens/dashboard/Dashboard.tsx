import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Components
import Header from '../../components/Header';
import { Colors } from '../../utils/Colors';
import { ms, s, vs } from '../../utils/Responsive';
import { screenStyles } from '../../utils/screenStyles';
import { TextStyles } from '../../utils/TextStyles';
import { showErrorToast } from '../../utils/toast';


// Icons
import Ionicons from 'react-native-vector-icons/Ionicons';

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
  amount: number;
  icon: IoniconName;
}

const OVERLAY_LIGHT = 'rgba(255, 255, 255, 0.10)';
const SCREEN_BG = '#F7F4FC';
const PLUM_TINT = 'rgba(109, 40, 217, 0.08)';
const CARD_BORDER = 'rgba(109, 40, 217, 0.10)';
const SAVINGS_BG = '#37018f34';
const SAVINGS_BORDER = 'rgba(109, 40, 217, 0.18)';
const SAVINGS_INNER = '#efe4ffa4';
const SAVINGS_ICON_BG = '#f6f1fd';

const BANK_MONEY = 12450;
const CASH_MONEY = 1750;

const savingsItems: SavingsItem[] = [
  {
    id: 'fixed-deposit',
    label: 'FIXED DEPOSIT',
    caption: 'Locked savings',
    amount: 25000,
    icon: 'lock-closed-outline',
  },
  {
    id: 'flexible-savings',
    label: 'FLEXIBLE SAVINGS',
    caption: 'Access anytime',
    amount: 8200,
    icon: 'flash-outline',
  },
];

const breakdownItems: BreakdownItem[] = [
  { id: 'june-2024', month: 'June 2024', amount: 3200 },
  { id: 'may-2024', month: 'May 2024', amount: 2850 },
  { id: 'april-2024', month: 'April 2024', amount: 3100 },
  { id: 'march-2024', month: 'March 2024', amount: 2900 },
];

const statItems: StatItem[] = [
  {
    id: 'income',
    label: 'INCOME',
    caption: 'This month',
    amount: 5400,
    icon: 'arrow-down',
    iconColor: Colors.brand.deepPlum,
  },
  {
    id: 'loans',
    label: 'LOANS',
    caption: 'This month',
    amount: 2100,
    icon: 'arrow-up',
    iconColor: Colors.status.error,
  },
];

const moneySources: MoneySource[] = [
  { id: 'bank', label: 'BANK', amount: 12450, icon: 'business-outline' },
  { id: 'cash', label: 'CASH', amount: 1750, icon: 'cash-outline' },
  { id: 'loans', label: 'LOANS', amount: 2100, icon: 'swap-horizontal-outline' },
  { id: 'income', label: 'INCOME', amount: 5400, icon: 'trending-up-outline' },
];

const formatCurrency = (value: number, decimals = 0): string => {
  const sign = value < 0 ? '-' : '';
  const [whole, fraction] = Math.abs(value).toFixed(decimals).split('.');
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}Rs. ${withCommas}${fraction ? `.${fraction}` : ''}`;
};

export default function DashboardScreen(): React.JSX.Element {
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

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
    const sources = moneySources
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
  }, [selectedSources, selectedMonths]);

  const totalSavings = useMemo(
    () => savingsItems.reduce((sum, item) => sum + item.amount, 0),
    [],
  );

  const hasSelection = selectedSources.length > 0 || selectedMonths.length > 0;
  const isNegative = calculatedBalance < 0;

  const handleNotDeveloped = (): void => {
    showErrorToast('Not developed yet');
  };

  return (
    <SafeAreaView style={[screenStyles.container, styles.screen]}>
      {/* Header */}
      <Header title="Overview" back={false} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroCircleLarge} />
          <View style={styles.heroCircleSmall} />

          <View style={styles.heroHeader}>
            <Text style={styles.heroLabel}>TOTAL AVAILABLE</Text>
            <View style={styles.heroIconChip}>
              <Ionicons
                name="wallet-outline"
                size={ms(18)}
                color={Colors.neutral[10]}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
            </View>
          </View>
          <Text style={styles.heroAmount}>
            {formatCurrency(BANK_MONEY + CASH_MONEY, 2)}
          </Text>

          <View style={styles.heroTotals}>
            <View style={styles.heroTotalColumn}>
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
              <Text style={styles.heroTotalAmount}>{formatCurrency(BANK_MONEY)}</Text>
            </View>
            <View style={styles.heroTotalDivider} />
            <View style={styles.heroTotalColumn}>
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
              <Text style={styles.heroTotalAmount}>{formatCurrency(CASH_MONEY)}</Text>
            </View>
          </View>
        </View>

        {/* Savings */}
        <View style={styles.savingsCard}>
          <View style={styles.savingsHeader}>
            <View style={styles.savingsHeaderText}>
              <Text style={styles.savingsTitle}>Savings</Text>
              <Text style={styles.savingsTotal}>{formatCurrency(totalSavings)}</Text>
            </View>
            <View style={styles.savingsHeaderChip}>
              <Ionicons
                name="shield-checkmark-outline"
                size={ms(18)}
                color={Colors.brand.deepPlum}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
            </View>
          </View>

          <View style={styles.savingsRow}>
            {savingsItems.map((item, index) => (
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
                      color={Colors.brand.deepPlum}
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
                <View style={styles.statBadge}>
                  <Ionicons
                    name={item.icon}
                    size={ms(16)}
                    color={item.iconColor}
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                  />
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={ms(18)}
                  color={Colors.neutral[50]}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
              </View>
              <Text style={styles.statLabel}>{item.label}</Text>
              <Text style={styles.statAmount}>{formatCurrency(item.amount)}</Text>
              <Text style={styles.statCaption}>{item.caption}</Text>
            </Pressable>
          ))}
        </View>

        {/* Financial Breakdown */}
        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Months</Text>
            <View style={styles.sectionPill}>
              <Text style={styles.sectionPillText}>
                {selectedMonths.length} SELECTED
              </Text>
            </View>
          </View>

          <View style={styles.breakdownList}>
            {breakdownItems.map((item, index) => {
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
            <Text style={styles.sectionTitle}>Money Source</Text>
          </View>
          <View style={styles.moneySourceGrid}>
            {moneySources.map((source) => {
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
                    isSelected && styles.moneySourceCardSelected,
                    pressed && styles.cardPressed,
                  ]}
                >
                  <View style={styles.moneySourceTop}>
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
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={ms(20)}
                        color={Colors.neutral[10]}
                        accessibilityElementsHidden
                        importantForAccessibility="no"
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.moneySourceLabel,
                      isSelected && styles.moneySourceLabelSelected,
                    ]}
                  >
                    {source.label}
                  </Text>
                  <Text
                    style={[
                      styles.moneySourceAmount,
                      isSelected && styles.moneySourceAmountSelected,
                    ]}
                  >
                    {formatCurrency(source.amount)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Calculated Balance */}
        <View style={styles.balanceCard}>
          <View style={styles.heroCircleLarge} />
          <View style={styles.heroCircleSmall} />

          <View style={styles.heroHeader}>
            <Text style={styles.heroLabel}>CALCULATED BALANCE</Text>
            <View style={styles.heroIconChip}>
              <Ionicons
                name="calculator-outline"
                size={ms(18)}
                color={Colors.neutral[10]}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
            </View>
          </View>

          <Text
            style={[styles.balanceAmount, isNegative && styles.balanceAmountNegative]}
            accessibilityLiveRegion="polite"
          >
            {formatCurrency(calculatedBalance, 2)}
          </Text>

          <View style={styles.balanceSummary}>
            {hasSelection ? (
              <>
                <View style={styles.balanceSummaryColumn}>
                  <Text style={styles.heroTotalLabel}>SOURCES</Text>
                  <Text style={styles.balanceSummaryValue}>
                    {formatCurrency(sourcesTotal)}
                  </Text>
                </View>
                <View style={styles.heroTotalDivider} />
                <View style={styles.balanceSummaryColumn}>
                  <Text style={styles.heroTotalLabel}>MONTHS</Text>
                  <Text style={styles.balanceSummaryValue}>
                    -{formatCurrency(monthsTotal)}
                  </Text>
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
    paddingTop: vs(16),
    paddingBottom: vs(24),
  },

  // Hero
  heroCard: {
    padding: s(22),
    borderRadius: ms(28),
    backgroundColor: Colors.brand.deepPlum,
    overflow: 'hidden',
    shadowColor: Colors.brand.deepPlum,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 10,
  },
  heroCircleLarge: {
    position: 'absolute',
    top: -ms(60),
    right: -ms(40),
    width: ms(180),
    height: ms(180),
    borderRadius: ms(90),
    backgroundColor: OVERLAY_LIGHT,
  },
  heroCircleSmall: {
    position: 'absolute',
    bottom: -ms(50),
    left: -ms(30),
    width: ms(120),
    height: ms(120),
    borderRadius: ms(60),
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
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: OVERLAY_LIGHT,
  },
  heroAmount: {
    ...TextStyles.Bold32,
    color: Colors.neutral[10],
    marginTop: vs(10),
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

  // Savings
  savingsCard: {
    marginTop: vs(16),
    padding: s(18),
    borderRadius: ms(22),
    borderWidth: 1,
    borderColor: SAVINGS_BORDER,
    backgroundColor: SAVINGS_BG,
    overflow: 'hidden',
    shadowColor: Colors.brand.deepPlum,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 0,
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
    color: Colors.brand.deepPlum,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  savingsTotal: {
    ...TextStyles.Bold24,
    color: Colors.neutral[100],
    marginTop: vs(4),
  },
  savingsHeaderChip: {
    width: ms(36),
    height: ms(36),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: "#f8f5fd",
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: vs(12),
    paddingHorizontal: s(14),
    borderRadius: ms(22),
    overflow: 'hidden',
    backgroundColor: SAVINGS_INNER,
  },
  savingsItem: {
    flex: 1,
  },
  savingsDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginHorizontal: s(14),
    backgroundColor: SAVINGS_BORDER,
  },
  savingsItemIcon: {
    width: ms(30),
    height: ms(30),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(8),
    overflow: 'hidden',
    backgroundColor: SAVINGS_ICON_BG,
  },
  savingsItemLabel: {
    ...TextStyles.SemiBold12,
    color: Colors.neutral[60],
    letterSpacing: 0.8,
  },
  savingsItemAmount: {
    ...TextStyles.Bold16,
    color: Colors.neutral[100],
    marginTop: vs(4),
  },
  savingsItemCaption: {
    ...TextStyles.SemiBold12,
    color: Colors.neutral[60],
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
    padding: s(22),
    marginTop: vs(28),
    borderRadius: ms(28),
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
  balanceSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(12),
    paddingHorizontal: s(16),
    borderRadius: ms(18),
    backgroundColor: OVERLAY_LIGHT,
  },
  balanceSummaryColumn: {
    flex: 1,
  },
  balanceSummaryValue: {
    ...TextStyles.Bold16,
    color: Colors.neutral[10],
    marginTop: vs(4),
  },
  balanceHint: {
    ...TextStyles.SemiBold12,
    color: Colors.neutral[30],
    flex: 1,
  },
});