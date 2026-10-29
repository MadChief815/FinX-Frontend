import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import type { MonthsScreenProps } from '../../navigation/MonthsStack';

// Icons
import Ionicons from 'react-native-vector-icons/Ionicons'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

// API
import {
  deleteSpend,
  getSpend,
  getSpends,
  updateSpend,
} from '../../api/adapters/spends.adapter';
import type { Spend } from '../../api/adapters/spends.adapter';
import { createSubPage } from '../../api/adapters/subpages.adapter';
import {
  deleteMonth,
  getMonths,
  updateMonth,
} from '../../api/adapters/months.adapter';
import type { MonthListItem } from '../../api/adapters/months.adapter';
import { adjustDashboardBalance } from '../../api/adapters/dashboard.adapter';

// Components
import Header from '../../components/Header';
import { BottomSheetModal } from '../../components/BottomSheetModal';
import { LoadingButton } from '../../components/LoadingButton';
import { Skeleton } from '../../components/Skeleton';

// Utilities
import { Colors } from '../../utils/Colors';
import { getApiErrorMessage } from '../../utils/apiError';
import { ms, s, vs } from '../../utils/Responsive';
import { screenStyles } from '../../utils/screenStyles';
import { TextStyles } from '../../utils/TextStyles';
import { sanitizeNumericInput } from '../../utils/numericInput';
import { showErrorToast, showSuccessToast } from '../../utils/toast';

interface PendingSpendChange {
  spendId: number;
  amount: number;
  completes: boolean;
  payload: {
    title: string;
    amount: string;
    is_completed: boolean;
  };
}

type MonthDetailScreenProps = MonthsScreenProps<'MonthDetail'>;

const formatCurrency = (value: number): string => {
  const [whole, fraction] = value.toFixed(2).split('.');
  return `Rs. ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`;
};

const parseAmount = (value: string): number | null => {
  if (!/^\d+(\.\d{0,2})?$/.test(value.trim())) return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
};

export default function MonthDetailScreen({
  navigation,
  route,
}: MonthDetailScreenProps): React.JSX.Element {
  const [month, setMonth] = useState<MonthListItem>(route.params.month);
  const [spends, setSpends] = useState<Spend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [selectedSpend, setSelectedSpend] = useState<Spend | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSpendLoading, setIsSpendLoading] = useState(false);
  const [isSubPageCreateVisible, setIsSubPageCreateVisible] = useState(false);
  const [subPageTitle, setSubPageTitle] = useState('');
  const [isCreatingSubPage, setIsCreatingSubPage] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeducting, setIsDeducting] = useState(false);
  const [isDeductModalVisible, setIsDeductModalVisible] = useState(false);
  const [pendingSpendChange, setPendingSpendChange] =
    useState<PendingSpendChange | null>(null);
  const [isSubspendWarningVisible, setIsSubspendWarningVisible] = useState(false);
  const [subspendWarningType, setSubspendWarningType] =
    useState<'pending' | 'already-created'>('pending');
  const [isMonthModalVisible, setIsMonthModalVisible] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] =
    useState<'spend' | 'month' | null>(null);
  const [monthTitle, setMonthTitle] = useState(month.title);
  const [monthNumber, setMonthNumber] = useState(String(month.month));
  const [monthYear, setMonthYear] = useState(String(month.year));
  const [isMonthCompleted, setIsMonthCompleted] = useState(month.isCompleted);
  const [isUpdatingMonth, setIsUpdatingMonth] = useState(false);
  const [isDeletingMonth, setIsDeletingMonth] = useState(false);
  const hasLoadedMonthData = useRef(false);
  const hasMonthChanges =
    monthTitle.trim() !== month.title ||
    Number(monthNumber) !== month.month ||
    Number(monthYear) !== month.year ||
    isMonthCompleted !== month.isCompleted;
  const sortedSpends = useMemo(
    () => [...spends].sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted)),
    [spends],
  );

  useEffect(() => {
    if (!isSubspendWarningVisible) return undefined;
    const timeout = setTimeout(() => setIsSubspendWarningVisible(false), 2000);
    return () => clearTimeout(timeout);
  }, [isSubspendWarningVisible]);

  const loadMonthData = useCallback(async (showLoading: boolean): Promise<void> => {
    if (showLoading) setIsLoading(true);
    try {
      const [spendsResult, monthsResult] = await Promise.allSettled([
        getSpends(month.id),
        getMonths(),
      ]);
      if (spendsResult.status === 'fulfilled') {
        setSpends(spendsResult.value);
        setLoadError(false);
      } else {
        setLoadError(true);
      }
      if (monthsResult.status === 'fulfilled') {
        const updatedMonth = monthsResult.value.find((item) => item.id === month.id);
        if (updatedMonth) setMonth(updatedMonth);
      }
      const refreshError =
        spendsResult.status === 'rejected'
          ? spendsResult.reason
          : monthsResult.status === 'rejected'
            ? monthsResult.reason
            : null;
      if (refreshError !== null) {
        showErrorToast(
          getApiErrorMessage(refreshError, 'Unable to refresh month data. Please try again.'),
        );
      }
    } finally {
      hasLoadedMonthData.current = true;
      if (showLoading) setIsLoading(false);
    }
  }, [month.id]);

  useFocusEffect(
    useCallback(() => {
      void loadMonthData(!hasLoadedMonthData.current);
    }, [loadMonthData]),
  );

  const refreshSpends = async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      await loadMonthData(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  const openSpendEditor = async (spend: Spend): Promise<void> => {
    setSelectedSpend(spend);
    setTitle(spend.title);
    setAmount(spend.amount);
    setIsCompleted(spend.isCompleted);
    setIsEditModalVisible(true);
    setIsSpendLoading(true);
    try {
      const currentSpend = await getSpend(spend.id);
      setSelectedSpend(currentSpend);
      setTitle(currentSpend.title);
      setAmount(currentSpend.amount);
      setIsCompleted(currentSpend.isCompleted);
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, 'Unable to load this spend.'));
    } finally {
      setIsSpendLoading(false);
    }
  };

  const saveSpend = async (): Promise<void> => {
    if (!selectedSpend) return;
    const trimmedTitle = title.trim();
    const parsedAmount = parseAmount(amount);
    if (
      trimmedTitle === selectedSpend.title.trim() &&
      parsedAmount !== null &&
      parsedAmount === Number(selectedSpend.amount) &&
      isCompleted === selectedSpend.isCompleted
    ) {
      setIsEditModalVisible(false);
      showSuccessToast('Nothing to Save');
      return;
    }
    if (!trimmedTitle) {
      showErrorToast('Enter a title for this spend.');
      return;
    }
    if (parsedAmount === null) {
      showErrorToast('Enter a valid amount with up to two decimal places.');
      return;
    }

    setIsSaving(true);
    try {
      if (isCompleted !== selectedSpend.isCompleted) {
        const amountValue = parsedAmount.toFixed(2);
        const currentSpend = await updateSpend(selectedSpend.id, {
          title: trimmedTitle,
          amount: amountValue,
          is_completed: selectedSpend.isCompleted,
        });
        setSpends((current) =>
          current.map((item) => item.id === currentSpend.id ? currentSpend : item),
        );
        setIsEditModalVisible(false);
        await loadMonthData(false);
        setPendingSpendChange({
          spendId: currentSpend.id,
          amount: parsedAmount,
          completes: isCompleted,
          payload: {
            title: trimmedTitle,
            amount: amountValue,
            is_completed: isCompleted,
          },
        });
        setIsDeductModalVisible(true);
        return;
      }

      const updatedSpend = await updateSpend(selectedSpend.id, {
        title: trimmedTitle,
        amount: parsedAmount.toFixed(2),
        is_completed: isCompleted,
      });
      const nextSpends = spends.map((item) =>
        item.id === updatedSpend.id ? updatedSpend : item,
      );
      setSpends(nextSpends);
      setIsEditModalVisible(false);
      await loadMonthData(false);
      showSuccessToast('Spend updated.');
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, 'Unable to update this spend.'));
    } finally {
      setIsSaving(false);
    }
  };

  const removeSpend = async (): Promise<void> => {
    if (!selectedSpend) return;
    setIsDeleting(true);
    try {
      await deleteSpend(selectedSpend.id);
      const nextSpends = spends.filter((item) => item.id !== selectedSpend.id);
      setSpends(nextSpends);
      setIsEditModalVisible(false);
      setDeleteConfirmation(null);
      await loadMonthData(false);
      showSuccessToast('Spend deleted.');
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, 'Unable to delete this spend.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteConfirmation = (confirmation: 'spend' | 'month'): void => {
    setDeleteConfirmation(confirmation);
    if (confirmation === 'spend') {
      setIsEditModalVisible(false);
    } else {
      setIsMonthModalVisible(false);
    }
  };

  const confirmDeleteSpend = (): void => {
    openDeleteConfirmation('spend');
  };

  const cancelPendingSpendChange = (): void => {
    setPendingSpendChange(null);
    setIsDeductModalVisible(false);
  };

  const handleBalanceChange = async (source: 'cash' | 'bank'): Promise<void> => {
    if (!pendingSpendChange) return;
    setIsDeducting(true);
    let balanceAdjusted = false;
    try {
      await adjustDashboardBalance(
        source,
        pendingSpendChange.completes
          ? -pendingSpendChange.amount
          : pendingSpendChange.amount,
      );
      balanceAdjusted = true;
      const updatedSpend = await updateSpend(
        pendingSpendChange.spendId,
        pendingSpendChange.payload,
      );
      setSpends((current) =>
        current.map((item) => item.id === updatedSpend.id ? updatedSpend : item),
      );
      setPendingSpendChange(null);
      setIsDeductModalVisible(false);
      await loadMonthData(false);
      showSuccessToast(
        pendingSpendChange.completes
          ? `Spend deducted from ${source}.`
          : `Spend restored to ${source}.`,
      );
    } catch (error) {
      if (balanceAdjusted) {
        try {
          await adjustDashboardBalance(
            source,
            pendingSpendChange.completes
              ? pendingSpendChange.amount
              : -pendingSpendChange.amount,
          );
        } catch (rollbackError) {
          setPendingSpendChange(null);
          setIsDeductModalVisible(false);
          showErrorToast(
            `Spend status was not changed and balance rollback failed: ${getApiErrorMessage(rollbackError, 'Please check your account balance.')}`,
          );
          return;
        }
      }
      showErrorToast(
        getApiErrorMessage(error, 'Unable to update spend and account balance.'),
      );
    } finally {
      setIsDeducting(false);
    }
  };

  const openMonthEditor = (): void => {
    setMonthTitle(month.title);
    setMonthNumber(String(month.month));
    setMonthYear(String(month.year));
    setIsMonthCompleted(month.isCompleted);
    setIsMonthModalVisible(true);
  };

  const saveMonth = async (): Promise<void> => {
    if (!hasMonthChanges) {
      setIsMonthModalVisible(false);
      showSuccessToast('Nothing to Save');
      return;
    }

    const trimmedTitle = monthTitle.trim();
    const numericMonth = Number(monthNumber);
    const numericYear = Number(monthYear);
    if (!trimmedTitle) {
      showErrorToast('Enter a month name.');
      return;
    }
    if (!Number.isInteger(numericMonth) || numericMonth < 1 || numericMonth > 12) {
      showErrorToast('Enter a month number between 1 and 12.');
      return;
    }
    if (!Number.isInteger(numericYear) || numericYear < 1) {
      showErrorToast('Enter a valid year.');
      return;
    }

    setIsUpdatingMonth(true);
    try {
      await updateMonth(month.id, {
        title: trimmedTitle,
        month: numericMonth,
        year: numericYear,
        is_completed: isMonthCompleted,
      });
      setMonth((current) => ({
        ...current,
        title: trimmedTitle,
        month: numericMonth,
        year: numericYear,
        isCompleted: isMonthCompleted,
      }));
      setIsMonthModalVisible(false);
      showSuccessToast('Month updated.');
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, 'Unable to update this month.'));
    } finally {
      setIsUpdatingMonth(false);
    }
  };

  const removeMonth = async (): Promise<void> => {
    setIsDeletingMonth(true);
    try {
      await deleteMonth(month.id);
      setIsMonthModalVisible(false);
      setDeleteConfirmation(null);
      showSuccessToast('Month deleted.');
      navigation.goBack();
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, 'Unable to delete this month.'));
    } finally {
      setIsDeletingMonth(false);
    }
  };

  const submitSubPage = async (): Promise<void> => {
    if (!selectedSpend || selectedSpend.hasSubpage) return;
    const trimmedTitle = subPageTitle.trim();
    if (!trimmedTitle) {
      showErrorToast('Enter a title for this subpage.');
      return;
    }

    setIsCreatingSubPage(true);
    try {
      await createSubPage({
        spend: selectedSpend.id,
        title: trimmedTitle,
      });
      setSelectedSpend((current) =>
        current ? { ...current, hasSubpage: true } : current,
      );
      setSpends((current) =>
        current.map((spend) =>
          spend.id === selectedSpend.id ? { ...spend, hasSubpage: true } : spend,
        ),
      );
      setSubPageTitle('');
      setIsSubPageCreateVisible(false);
      setIsEditModalVisible(false);
      showSuccessToast('Subpage created.');
      navigation.navigate('SubPage', {
        monthId: month.id,
        subId: selectedSpend.id,
      });
    } catch (error) {
      showErrorToast(
        getApiErrorMessage(error, 'Unable to create this subpage. Please try again.'),
      );
    } finally {
      setIsCreatingSubPage(false);
    }
  };

  const confirmDeleteMonth = (): void => {
    openDeleteConfirmation('month');
  };

  const toggleCompleted = (spend: Spend): void => {
    if (spend.hasSubpage) {
      setSubspendWarningType('pending');
      setIsSubspendWarningVisible(true);
      return;
    }
    setPendingSpendChange({
      spendId: spend.id,
      amount: Number(spend.amount),
      completes: !spend.isCompleted,
      payload: {
        title: spend.title,
        amount: spend.amount,
        is_completed: !spend.isCompleted,
      },
    });
    setIsDeductModalVisible(true);
  };

  const renderSpend = ({ item }: { item: Spend }): React.JSX.Element => (
    <View style={styles.spendCard}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={`${item.title}, ${item.isCompleted ? 'completed' : 'not completed'}`}
        accessibilityState={{ checked: item.isCompleted }}
        disabled={isDeducting}
        onPress={() => void toggleCompleted(item)}
        style={[
          styles.checkButton,
          isDeducting && styles.disabledControl,
        ]}
      >
        <Ionicons
          name={item.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
          size={ms(24)}
          color={item.isCompleted ? Colors.brand.orchid : Colors.brand.orchid}
        />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.hasSubpage
          ? `Open subpage for ${item.title}`
          : `Edit ${item.title}, ${formatCurrency(Number(item.amount))}`}
        onPress={() => {
          if (item.hasSubpage) {
            navigation.navigate('SubPage', {
              monthId: month.id,
              subId: item.id,
            });
          } else {
            void openSpendEditor(item);
          }
        }}
        style={({ pressed }) => [styles.spendDetails, pressed && styles.pressed]}
      >
        <Text numberOfLines={1} style={[styles.spendTitle, item.isCompleted && styles.completedText]}>
          {item.title}
        </Text>
        <Text style={styles.spendAmount}>{formatCurrency(Number(item.amount))}</Text>
      </Pressable>
      {item.hasSubpage && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${item.title}, ${formatCurrency(Number(item.amount))}`}
          onPress={() => void openSpendEditor(item)}
          style={styles.arrowButton}
        >
          <Ionicons name="receipt-outline" size={ms(22)} color={Colors.brand.plum} />
        </Pressable>
      )}
    </View>
  );

  return (
    <SafeAreaView style={screenStyles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Header
          title={`${month.title} ${month.year}`}
          back
          onBackPress={() => navigation.goBack()}
          titleColor={Colors.brand.deepPlum}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit month"
          onPress={openMonthEditor}
          style={({ pressed }) => [styles.headerEditButton, pressed && styles.pressed]}
        >
          <MaterialDesignIcons name="pencil" size={ms(20)} color={Colors.brand.plum} />
        </Pressable>
      </View>

      {/* Spends */}
      <FlatList
        data={isLoading ? [] : sortedSpends}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderSpend}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void refreshSpends()}
            tintColor={Colors.brand.plum}
            colors={[Colors.brand.plum]}
          />
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.listheader}>Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryAmounts}>
                <SummaryItem label="Total" value={month.total} />
                <SummaryItem label="Spent" value={month.spent} />
                <SummaryItem label="To spend" value={month.toSpend} />
              </View>
            </View>
            <Text style={styles.listheader}>Spends</Text>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingList}>
              {[0, 1, 2].map((index) => <SpendSkeleton key={index} />)}
            </View>
          ) : loadError ? (
            <EmptyState
              message="Unable to load spends. Pull down to try again."
              icon="alert-circle-outline"
            />
          ) : (
            <EmptyState message="No spends added yet" icon="receipt-outline" />
          )
        }
        ListFooterComponent={
          loadError && !isLoading && spends.length > 0 ? (
            <Text accessibilityRole="alert" style={styles.errorMessage}>
              Unable to refresh spends. Pull down to try again.
            </Text>
          ) : null
        }
      />

      {/* Create Spend */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create spend"
        onPress={() => navigation.navigate('SpendCreate', { monthId: month.id })}
        style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}
      >
        <Ionicons name="add" size={ms(30)} color={Colors.neutral[10]} />
      </Pressable>

      {/* Subspend Completion Warning */}
      <BottomSheetModal
        visible={isSubspendWarningVisible}
        onClose={() => setIsSubspendWarningVisible(false)}
        size="compact"
        keyboardAware={false}
      >
        <View accessibilityRole="alert" style={styles.warningCard}>
          <Ionicons
            name="warning"
            size={ms(28)}
            color={Colors.brand.orchid}
          />
          <Text style={styles.warningTitle}>
            {subspendWarningType === 'already-created'
              ? 'Subpage already created'
              : 'Subspends pending'}
          </Text>
          <Text style={styles.warningMessage}>
            {subspendWarningType === 'already-created'
              ? 'A subpage has already been created for this spend.'
              : 'This spend will be completed automatically when all subspends are completed.'}
          </Text>
        </View>
      </BottomSheetModal>

      {/* Edit Month Modal */}
      <BottomSheetModal
        visible={isMonthModalVisible || deleteConfirmation === 'month'}
        onClose={() => {
          if (isDeletingMonth) return;
          setIsMonthModalVisible(false);
          setDeleteConfirmation(null);
        }}
        size="form"
      >
        <View style={styles.modalCard}>
          {deleteConfirmation === 'month' ? (
            <DeleteConfirmationContent
              title="Delete Month?"
              message="This month will be permanently deleted."
              isDeleting={isDeletingMonth}
              onCancel={() => setDeleteConfirmation(null)}
              onDelete={() => void removeMonth()}
            />
          ) : (
            <>
              <View style={styles.monthModalHeader}>
                <Text style={styles.modalTitle}>Update Month</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Delete month"
                  disabled={isDeletingMonth}
                  onPress={confirmDeleteMonth}
                  style={({ pressed }) => [
                    styles.deleteMonthButton,
                    pressed && styles.pressed,
                  ]}
                >
                  {isDeletingMonth ? (
                    <ActivityIndicator color={Colors.status.error} />
                  ) : (
                    <Ionicons
                      name="trash-outline"
                      size={ms(24)}
                      color={Colors.status.error}
                    />
                  )}
                </Pressable>
              </View>
              <Text style={styles.inputLabel}>Month name</Text>
              <TextInput
                accessibilityLabel="Month name"
                autoCapitalize="words"
                maxLength={40}
                onChangeText={setMonthTitle}
                placeholder="Month name"
                placeholderTextColor={Colors.neutral[60]}
                style={styles.input}
                value={monthTitle}
              />
              <View style={styles.monthDateFields}>
                <View style={styles.monthDateField}>
                  <Text style={styles.inputLabel}>Month number</Text>
                  <TextInput
                    accessibilityLabel="Month number"
                    keyboardType="number-pad"
                    maxLength={2}
                    onChangeText={(value) => setMonthNumber(sanitizeNumericInput(value))}
                    placeholder="1-12"
                    placeholderTextColor={Colors.neutral[60]}
                    style={styles.input}
                    value={monthNumber}
                  />
                </View>
                <View style={styles.monthDateField}>
                  <Text style={styles.inputLabel}>Year</Text>
                  <TextInput
                    accessibilityLabel="Month year"
                    keyboardType="number-pad"
                    maxLength={4}
                    onChangeText={(value) => setMonthYear(sanitizeNumericInput(value))}
                    placeholder="Year"
                    placeholderTextColor={Colors.neutral[60]}
                    style={styles.input}
                    value={monthYear}
                  />
                </View>
              </View>
              <View style={styles.completedRow}>
                <Text style={styles.inputLabel}>Completed</Text>
                <Switch
                  accessibilityLabel="Month completed"
                  value={isMonthCompleted}
                  onValueChange={setIsMonthCompleted}
                  trackColor={{ false: Colors.neutral[40], true: Colors.brand.orchid }}
                  thumbColor={Colors.neutral[10]}
                />
              </View>
              <LoadingButton
                disabled={isUpdatingMonth || isDeletingMonth}
                isLoading={isUpdatingMonth}
                onPress={saveMonth}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </LoadingButton>
            </>
          )}
        </View>
      </BottomSheetModal>

      {/* Deduction Source Modal */}
      <BottomSheetModal
        visible={isDeductModalVisible}
        onClose={() => {
          if (!isDeducting) cancelPendingSpendChange();
        }}
        size="compact"
      >
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>
            {pendingSpendChange?.completes ? 'Deduct spend' : 'Restore spend'}
          </Text>
          <Text style={styles.sourceDescription}>
            {pendingSpendChange
              ? `Choose where to ${pendingSpendChange.completes ? 'deduct' : 'restore'} ${formatCurrency(pendingSpendChange.amount)} ${pendingSpendChange.completes ? 'from' : 'to'}.`
              : 'Choose an account.'}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${pendingSpendChange?.completes ? 'Deduct from' : 'Restore to'} bank`}
            disabled={isDeducting}
            onPress={() => void handleBalanceChange('bank')}
            style={({ pressed }) => [styles.sourceOption, pressed && styles.pressed]}
          >
            <Ionicons name="business-outline" size={ms(22)} color={Colors.brand.plum} />
            <Text style={styles.sourceOptionText}>Bank</Text>
            <Ionicons name="chevron-forward" size={ms(20)} color={Colors.neutral[60]} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${pendingSpendChange?.completes ? 'Deduct from' : 'Restore to'} cash`}
            disabled={isDeducting}
            onPress={() => void handleBalanceChange('cash')}
            style={({ pressed }) => [styles.sourceOption, pressed && styles.pressed]}
          >
            <Ionicons name="cash-outline" size={ms(22)} color={Colors.brand.plum} />
            <Text style={styles.sourceOptionText}>Cash</Text>
            <Ionicons name="chevron-forward" size={ms(20)} color={Colors.neutral[60]} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={isDeducting}
            onPress={cancelPendingSpendChange}
            style={({ pressed }) => [styles.cancelOption, pressed && styles.pressed]}
          >
            <Text style={styles.cancelOptionText}>Cancel</Text>
          </Pressable>
        </View>
      </BottomSheetModal>

      {/* Edit Spend Modal */}
      <BottomSheetModal
        visible={isEditModalVisible || deleteConfirmation === 'spend'}
        onClose={() => {
          if (isDeleting || isCreatingSubPage) return;
          setIsEditModalVisible(false);
          setDeleteConfirmation(null);
          setIsSubPageCreateVisible(false);
        }}
        size="form"
      >
        <View style={styles.modalCard}>
          {deleteConfirmation === 'spend' ? (
            <DeleteConfirmationContent
              title="Delete Spend?"
              message="This spend will be permanently deleted."
              isDeleting={isDeleting}
              onCancel={() => setDeleteConfirmation(null)}
              onDelete={() => void removeSpend()}
            />
          ) : isSubPageCreateVisible ? (
            <>
              <View style={styles.monthModalHeader}>
                <Text style={styles.modalTitle}>Create Sub Page</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cancel creating subpage"
                  disabled={isCreatingSubPage}
                  onPress={() => {
                    setSubPageTitle('');
                    setIsSubPageCreateVisible(false);
                  }}
                  style={({ pressed }) => [
                    styles.deleteMonthButton,
                    pressed && styles.pressed,
                    isCreatingSubPage && styles.disabledControl,
                  ]}
                >
                  <Ionicons
                    name="close"
                    size={ms(22)}
                    color={Colors.neutral[70]}
                  />
                </Pressable>
              </View>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                accessibilityLabel="Subpage title"
                autoCapitalize="sentences"
                autoCorrect
                maxLength={100}
                onChangeText={setSubPageTitle}
                placeholder="Subpage title"
                placeholderTextColor={Colors.neutral[60]}
                returnKeyType="done"
                style={[styles.input, {marginBottom: vs(28)}]}
                value={subPageTitle}
              />
              <LoadingButton
                isLoading={isCreatingSubPage}
                onPress={submitSubPage}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>Create</Text>
              </LoadingButton>
            </>
          ) : isSpendLoading ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator color={Colors.brand.plum} size={ms(36)} />
              <Text style={styles.modalLoadingText}>Loading spend...</Text>
            </View>
          ) : (
            <>
              <View style={styles.monthModalHeader}>
                <Text style={styles.modalTitle}>Update Spend</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Delete spend"
                  disabled={isDeleting || isSaving}
                  onPress={confirmDeleteSpend}
                  style={({ pressed }) => [
                    styles.deleteMonthButton,
                    pressed && styles.pressed,
                  ]}
                >
                  {isDeleting ? (
                    <ActivityIndicator color={Colors.status.error} />
                  ) : (
                    <Ionicons
                      name="trash-outline"
                      size={ms(22)}
                      color={Colors.status.error}
                    />
                  )}
                </Pressable>
              </View>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                accessibilityLabel="Spend title"
                value={title}
                onChangeText={setTitle}
                placeholder="Spend title"
                placeholderTextColor={Colors.neutral[60]}
                style={styles.input}
                maxLength={100}
              />
              <Text style={styles.inputLabel}>Amount</Text>
              <TextInput
                accessibilityLabel="Spend amount"
                value={amount}
                placeholder="0.00"
                placeholderTextColor={Colors.neutral[60]}
                keyboardType="decimal-pad"
                onChangeText={(value) => setAmount(sanitizeNumericInput(value, 2))}
                style={styles.input}
              />
              {selectedSpend && !selectedSpend.hasSubpage && (
                <View style={styles.completedRow}>
                  <Text style={styles.inputLabel}>Completed</Text>
                  <Switch
                    accessibilityLabel="Completed"
                    value={isCompleted}
                    onValueChange={setIsCompleted}
                    trackColor={{ false: Colors.neutral[40], true: Colors.brand.orchid }}
                    thumbColor={Colors.neutral[10]}
                  />
                </View>
              )}
              {selectedSpend && (
                <Pressable
                  accessibilityRole="button"
                  disabled={isSaving || isDeleting}
                  onPress={() => {
                    if (selectedSpend.hasSubpage) {
                      setSubspendWarningType('already-created');
                      setIsSubspendWarningVisible(true);
                      return;
                    }
                    setSubPageTitle('');
                    setIsSubPageCreateVisible(true);
                  }}
                  style={({ pressed }) => [
                    styles.modalAction,
                    (isSaving || isDeleting) && styles.disabledControl,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons name="add-circle-outline" size={ms(20)} color={Colors.brand.plum} />
                  <Text style={styles.modalActionText}>Add Sub Page</Text>
                </Pressable>
              )}
              <LoadingButton
                disabled={isDeleting}
                isLoading={isSaving}
                onPress={saveSpend}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </LoadingButton>
            </>
          )}
        </View>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

function DeleteConfirmationContent({
  title,
  message,
  isDeleting,
  onCancel,
  onDelete,
}: {
  title: string;
  message: string;
  isDeleting: boolean;
  onCancel: () => void;
  onDelete: () => void;
}): React.JSX.Element {
  return (
    <>
      <Text style={styles.modalTitle}>{title}</Text>
      <Text style={styles.sourceDescription}>{message}</Text>
      <LoadingButton
        disabled={isDeleting}
        isLoading={isDeleting}
        onPress={onDelete}
        style={styles.confirmDeleteButton}
      >
        <Text style={styles.confirmDeleteText}>Delete</Text>
      </LoadingButton>
      <Pressable
        accessibilityRole="button"
        disabled={isDeleting}
        onPress={onCancel}
        style={({ pressed }) => [
          styles.cancelOption,
          styles.deleteCancelOption,
          pressed && styles.pressed,
          isDeleting && styles.disabledControl,
        ]}
      >
        <Text style={styles.cancelOptionText}>Cancel</Text>
      </Pressable>
    </>
  );
}

function SummaryItem({ label, value }: { label: string; value: number }): React.JSX.Element {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.summaryValue}>{formatCurrency(value)}</Text>
    </View>
  );
}

function SpendSkeleton(): React.JSX.Element {
  return (
    <View style={styles.spendCard}>
      <Skeleton width={ms(24)} height={ms(24)} style={styles.skeletonCircle} />
      <View style={styles.skeletonText}>
        <Skeleton width="58%" height={ms(16)} />
        <Skeleton width={ms(92)} height={ms(14)} />
      </View>
      <Skeleton width={ms(20)} height={ms(20)} style={styles.skeletonCircle} />
    </View>
  );
}

function EmptyState({
  message,
  icon,
}: {
  message: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}): React.JSX.Element {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={ms(42)} color={Colors.brand.orchid} />
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'relative',
  },
  headerEditButton: {
    position: 'absolute',
    top: vs(10),
    right: s(4),
    width: ms(44),
    height: ms(44),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingTop: vs(20),
    paddingBottom: vs(12),
  },
  summaryCard: {
    padding: s(16),
    marginBottom: vs(16),
    borderRadius: ms(16),
    borderWidth: 1,
    borderColor: Colors.neutral[30],
    backgroundColor: Colors.neutral[10],
  },
  listheader: {
    ...TextStyles.Medium16,
    color: Colors.neutral[70],
    marginBottom: vs(10),
  },
  summaryAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: s(8),
    marginBottom: vs(16),
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    ...TextStyles.Regular12,
    color: Colors.neutral[60],
  },
  summaryValue: {
    ...TextStyles.SemiBold14,
    color: Colors.brand.deepPlum,
    marginTop: vs(4),
  },
  listSeparator: {
    height: vs(10),
  },
  spendCard: {
    minHeight: vs(62),
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    paddingHorizontal: s(12),
    paddingVertical: vs(9),
    borderWidth: 1,
    borderColor: Colors.neutral[30],
    borderRadius: ms(14),
    backgroundColor: Colors.neutral[10],
  },
  checkButton: {
    width: ms(32),
    height: ms(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledControl: {
    opacity: 0.55,
  },
  spendDetails: {
    flex: 1,
    gap: vs(4),
  },
  spendTitle: {
    ...TextStyles.SemiBold16,
    color: Colors.brand.deepPlum,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: Colors.neutral[60],
  },
  spendAmount: {
    ...TextStyles.Regular14,
    color: Colors.neutral[70],
  },
  arrowButton: {
    width: ms(36),
    height: ms(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingList: {
    gap: vs(10),
  },
  skeletonCircle: {
    borderRadius: ms(16),
  },
  skeletonText: {
    flex: 1,
    gap: vs(8),
  },
  emptyState: {
    flex: 1,
    minHeight: vs(220),
    alignItems: 'center',
    justifyContent: 'center',
    gap: vs(12),
    paddingHorizontal: s(24),
  },
  emptyMessage: {
    ...TextStyles.Medium14,
    color: Colors.neutral[100],
    textAlign: 'center',
  },
  errorMessage: {
    ...TextStyles.Regular14,
    color: Colors.status.error,
    marginTop: vs(18),
    textAlign: 'center',
  },
  createButton: {
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
  warningCard: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: s(22),
    paddingVertical: vs(22),
    backgroundColor: Colors.neutral[10],
  },
  warningTitle: {
    ...TextStyles.SemiBold16,
    color: Colors.brand.deepPlum,
    marginTop: vs(8),
    textAlign: 'center',
  },
  warningMessage: {
    ...TextStyles.Regular14,
    color: Colors.neutral[70],
    marginTop: vs(6),
    textAlign: 'center',
  },
  modalCard: {
    width: '100%',
    padding: s(20),
    backgroundColor: Colors.neutral[10],
    gap: vs(10),
  },
  modalTitle: {
    ...TextStyles.SemiBold20,
    color: Colors.brand.deepPlum,
    marginBottom: vs(4),
  },
  monthModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(4)
  },
  deleteMonthButton: {
    width: ms(40),
    height: ms(40),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -vs(8),
    marginRight: -s(8),
  },
  monthDateFields: {
    flexDirection: 'row',
    gap: s(12),
    paddingTop: vs(8),
    // paddingBottom: vs(20)
  },
  monthDateField: {
    flex: 1,
    gap: vs(8),
  },
  sourceDescription: {
    ...TextStyles.Regular14,
    color: Colors.neutral[70],
    marginBottom: vs(4),
  },
  sourceOption: {
    minHeight: vs(52),
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    paddingHorizontal: s(14),
    borderWidth: 1,
    borderColor: Colors.neutral[30],
    borderRadius: ms(12),
    backgroundColor: Colors.neutral[10],
  },
  sourceOptionText: {
    ...TextStyles.SemiBold16,
    flex: 1,
    color: Colors.brand.deepPlum,
  },
  cancelOption: {
    minHeight: vs(42),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(2),
  },
  deleteCancelOption: {
    borderWidth: 1,
    borderColor: Colors.neutral[30],
    borderRadius: ms(12),
  },
  cancelOptionText: {
    ...TextStyles.SemiBold14,
    color: Colors.neutral[70],
  },
  confirmDeleteButton: {
    minHeight: vs(46),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ms(12),
    backgroundColor: Colors.brand.plum,
  },
  confirmDeleteText: {
    ...TextStyles.SemiBold14,
    color: Colors.neutral[10],
  },
  modalLoading: {
    minHeight: vs(180),
    alignItems: 'center',
    justifyContent: 'center',
    gap: vs(12),
  },
  modalLoadingText: {
    ...TextStyles.Regular14,
    color: Colors.neutral[70],
  },
  inputLabel: {
    ...TextStyles.Medium14,
    color: Colors.neutral[80],
  },
  input: {
    minHeight: vs(48),
    paddingHorizontal: s(14),
    borderWidth: 1,
    borderColor: Colors.neutral[40],
    borderRadius: ms(10),
    color: Colors.neutral[100],
    ...TextStyles.Regular16,
  },
  completedRow: {
    minHeight: vs(48),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saveButton: {
    minHeight: vs(46),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ms(12),
    backgroundColor: Colors.brand.plum,
  },
  saveButtonText: {
    ...TextStyles.SemiBold14,
    color: Colors.neutral[10],
  },
  modalAction: {
    minHeight: vs(44),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(8),
  },
  modalActionText: {
    ...TextStyles.SemiBold14,
    color: Colors.brand.plum,
  },
  pressed: {
    opacity: 0.72,
  }
});
