import React, { useCallback, useMemo, useRef, useState } from 'react';
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

// API Services
import {
  deleteSubPage,
  deleteSubSpend,
  getSubPage,
  getSubPages,
  getSubSpend,
  getSubSpends,
  updateSubPage,
  updateSubSpend,
} from '../../api/adapters/subpages.adapter';
import type { SubSpend } from '../../api/adapters/subpages.adapter';
import { adjustDashboardBalance } from '../../api/adapters/dashboard.adapter';
import { getSpend, updateSpend } from '../../api/adapters/spends.adapter';

// Components
import Header from '../../components/Header';
import { BottomSheetModal } from '../../components/BottomSheetModal';
import { LoadingButton } from '../../components/LoadingButton';
import { Skeleton } from '../../components/Skeleton';
import { Colors } from '../../utils/Colors';
import { getApiErrorMessage } from '../../utils/apiError';
import { ms, s, vs } from '../../utils/Responsive';
import { screenStyles } from '../../utils/screenStyles';
import { TextStyles } from '../../utils/TextStyles';
import { sanitizeNumericInput } from '../../utils/numericInput';
import { showErrorToast, showSuccessToast } from '../../utils/toast';

// Icons
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

type SubPageScreenProps = MonthsScreenProps<'SubPage'>;
type DeleteConfirmation = 'subSpend' | 'subPage' | null;

interface PendingSubSpendChange {
  spendId: number;
  amount: number;
  completes: boolean;
  payload: {
    title: string;
    amount: string;
    is_completed: boolean;
  };
}

const formatCurrency = (value: number): string => {
  const [whole, fraction] = value.toFixed(2).split('.');
  return `Rs. ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`;
};

const parseAmount = (value: string): number | null => {
  if (!/^\d+(\.\d{0,2})?$/.test(value.trim())) return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
};

export default function SubPageScreen({
  navigation,
  route,
}: SubPageScreenProps): React.JSX.Element {
  const spendId = route.params.subId;
  const [subPageId, setSubPageId] = useState<number>();
  const [subSpends, setSubSpends] = useState<SubSpend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [pageTitle, setPageTitle] = useState('');
  const [isPageCompleted, setIsPageCompleted] = useState(false);
  const [isPageEditorVisible, setIsPageEditorVisible] = useState(false);
  const [pageTitleInput, setPageTitleInput] = useState('');
  const [isSavingPage, setIsSavingPage] = useState(false);
  const [isUpdatingPageCompletion, setIsUpdatingPageCompletion] = useState(false);
  const isUpdatingPageCompletionRef = useRef(false);
  const [selectedSpend, setSelectedSpend] = useState<SubSpend | null>(null);
  const [isSpendEditorVisible, setIsSpendEditorVisible] = useState(false);
  const [isSpendLoading, setIsSpendLoading] = useState(false);
  const [isSavingSpend, setIsSavingSpend] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingSpendId, setUpdatingSpendId] = useState<number | null>(null);
  const [pendingSubSpendChange, setPendingSubSpendChange] =
    useState<PendingSubSpendChange | null>(null);
  const [isBalanceChangeVisible, setIsBalanceChangeVisible] = useState(false);
  const [isAdjustingBalance, setIsAdjustingBalance] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] =
    useState<DeleteConfirmation>(null);
  const [spendTitle, setSpendTitle] = useState('');
  const [spendAmount, setSpendAmount] = useState('');
  const [spendCompleted, setSpendCompleted] = useState(false);
  const hasLoaded = useRef(false);
  const sortedSubSpends = useMemo(
    () => [...subSpends].sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted)),
    [subSpends],
  );
  const totalAmount = useMemo(
    () => subSpends.reduce((total, spend) => total + Number(spend.amount), 0),
    [subSpends],
  );
  const completedAmount = useMemo(
    () => subSpends.reduce(
      (total, spend) => total + (spend.isCompleted ? Number(spend.amount) : 0),
      0,
    ),
    [subSpends],
  );

  const loadSubSpends = useCallback(async (showLoading: boolean): Promise<void> => {
    if (showLoading) setIsLoading(true);
    if (spendId === undefined) {
      setLoadError(true);
      setIsLoading(false);
      hasLoaded.current = true;
      showErrorToast('This subpage is unavailable. Please open it again from Month Details.');
      return;
    }

    try {
      const pages = await getSubPages(spendId);
      const firstPage = pages[0];
      if (!firstPage) {
        setSubPageId(undefined);
        setSubSpends([]);
        setLoadError(true);
        showErrorToast('No subpage was found for this spend.');
        return;
      }

      const [page, spends] = await Promise.all([
        getSubPage(firstPage.id),
        getSubSpends(firstPage.id),
      ]);
      setSubPageId(page.id);
      setPageTitle(page.title);
      setIsPageCompleted(page.isCompleted);
      setSubSpends(spends);
      setLoadError(false);
    } catch (error) {
      setLoadError(true);
      showErrorToast(getApiErrorMessage(error, 'Unable to load this subpage. Please try again.'));
    } finally {
      hasLoaded.current = true;
      if (showLoading) setIsLoading(false);
    }
  }, [spendId]);

  useFocusEffect(
    useCallback(() => {
      void loadSubSpends(!hasLoaded.current);
    }, [loadSubSpends]),
  );

  const refreshSubSpends = async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      await loadSubSpends(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  const openPageEditor = (): void => {
    setPageTitleInput(pageTitle);
    setIsPageEditorVisible(true);
  };

  const savePage = async (): Promise<void> => {
    if (subPageId === undefined) return;
    const trimmedTitle = pageTitleInput.trim();
    if (!trimmedTitle) {
      showErrorToast('Enter a title for this subpage.');
      return;
    }

    setIsSavingPage(true);
    try {
      await updateSubPage(subPageId, {
        title: trimmedTitle,
        is_completed: isPageCompleted,
      });
      setPageTitle(trimmedTitle);
      setIsPageEditorVisible(false);
      showSuccessToast('Subpage updated.');
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, 'Unable to update this subpage.'));
    } finally {
      setIsSavingPage(false);
    }
  };

  const updatePageCompletion = async (nextIsCompleted: boolean): Promise<void> => {
    if (
      subPageId === undefined ||
      spendId === undefined ||
      isUpdatingPageCompletionRef.current ||
      nextIsCompleted === isPageCompleted
    ) return;
    const previousIsCompleted = isPageCompleted;
    isUpdatingPageCompletionRef.current = true;
    setIsUpdatingPageCompletion(true);
    setIsPageCompleted(nextIsCompleted);
    try {
      const parentSpend = await getSpend(spendId);
      const [subPageResult, spendResult] = await Promise.allSettled([
        updateSubPage(subPageId, {
          title: pageTitle,
          is_completed: nextIsCompleted,
        }),
        updateSpend(spendId, { is_completed: nextIsCompleted }),
      ]);

      if (subPageResult.status === 'rejected' || spendResult.status === 'rejected') {
        const rollbackResults = await Promise.allSettled([
          ...(subPageResult.status === 'fulfilled'
            ? [updateSubPage(subPageId, {
                title: pageTitle,
                is_completed: previousIsCompleted,
              })]
            : []),
          ...(spendResult.status === 'fulfilled'
            ? [updateSpend(spendId, { is_completed: parentSpend.isCompleted })]
            : []),
        ]);
        if (rollbackResults.some((result) => result.status === 'rejected')) {
          throw new Error('Status rollback failed. Refresh to verify both statuses.');
        }
        throw subPageResult.status === 'rejected'
          ? subPageResult.reason
          : spendResult.status === 'rejected'
            ? spendResult.reason
            : new Error('Unable to update completion status.');
      }

      showSuccessToast(
        nextIsCompleted
          ? 'Subpage and spend marked completed.'
          : 'Subpage and spend marked incomplete.',
      );
    } catch (error) {
      setIsPageCompleted(previousIsCompleted);
      showErrorToast(
        getApiErrorMessage(error, 'Unable to update subpage and spend status.'),
      );
    } finally {
      isUpdatingPageCompletionRef.current = false;
      setIsUpdatingPageCompletion(false);
    }
  };

  const openSpendEditor = async (spend: SubSpend): Promise<void> => {
    setSelectedSpend(spend);
    setSpendTitle(spend.title);
    setSpendAmount(spend.amount);
    setSpendCompleted(spend.isCompleted);
    setIsSpendEditorVisible(true);
    setIsSpendLoading(true);
    try {
      const currentSpend = await getSubSpend(spend.id);
      setSelectedSpend(currentSpend);
      setSpendTitle(currentSpend.title);
      setSpendAmount(currentSpend.amount);
      setSpendCompleted(currentSpend.isCompleted);
    } catch (error) {
      setIsSpendEditorVisible(false);
      setSelectedSpend(null);
      showErrorToast(getApiErrorMessage(error, 'Unable to load this subspend.'));
    } finally {
      setIsSpendLoading(false);
    }
  };

  const saveSpend = async (): Promise<void> => {
    if (!selectedSpend) return;
    const trimmedTitle = spendTitle.trim();
    const parsedAmount = parseAmount(spendAmount);
    if (!trimmedTitle) {
      showErrorToast('Enter a title for this subspend.');
      return;
    }
    if (parsedAmount === null) {
      showErrorToast('Enter a valid amount with up to two decimal places.');
      return;
    }

    setIsSavingSpend(true);
    try {
      if (spendCompleted !== selectedSpend.isCompleted) {
        const amountValue = parsedAmount.toFixed(2);
        const currentSpend = await updateSubSpend(selectedSpend.id, {
          title: trimmedTitle,
          amount: amountValue,
          is_completed: selectedSpend.isCompleted,
        });
        setSubSpends((current) =>
          current.map((item) => item.id === currentSpend.id ? currentSpend : item),
        );
        setIsSpendEditorVisible(false);
        setPendingSubSpendChange({
          spendId: currentSpend.id,
          amount: parsedAmount,
          completes: spendCompleted,
          payload: {
            title: trimmedTitle,
            amount: amountValue,
            is_completed: spendCompleted,
          },
        });
        setIsBalanceChangeVisible(true);
        return;
      }

      const updatedSpend = await updateSubSpend(selectedSpend.id, {
        title: trimmedTitle,
        amount: parsedAmount.toFixed(2),
        is_completed: spendCompleted,
      });
      setSubSpends((current) =>
        current.map((item) => item.id === updatedSpend.id ? updatedSpend : item),
      );
      setIsSpendEditorVisible(false);
      showSuccessToast('Subspend updated.');
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, 'Unable to update this subspend.'));
    } finally {
      setIsSavingSpend(false);
    }
  };

  const removeSpend = async (): Promise<void> => {
    if (!selectedSpend) return;
    setIsDeleting(true);
    try {
      await deleteSubSpend(selectedSpend.id);
      setSubSpends((current) => current.filter((item) => item.id !== selectedSpend.id));
      setIsSpendEditorVisible(false);
      setDeleteConfirmation(null);
      setSelectedSpend(null);
      showSuccessToast('Subspend deleted.');
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, 'Unable to delete this subspend.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const removePage = async (): Promise<void> => {
    if (subPageId === undefined) return;
    setIsDeleting(true);
    try {
      await deleteSubPage(subPageId);
      setDeleteConfirmation(null);
      showSuccessToast('Subpage deleted.');
      navigation.goBack();
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, 'Unable to delete this subpage.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelPendingSubSpendChange = (): void => {
    setPendingSubSpendChange(null);
    setIsBalanceChangeVisible(false);
  };

  const handleSubSpendBalanceChange = async (
    source: 'cash' | 'bank',
  ): Promise<void> => {
    if (!pendingSubSpendChange) return;
    setIsAdjustingBalance(true);
    setUpdatingSpendId(pendingSubSpendChange.spendId);
    let balanceAdjusted = false;
    try {
      await adjustDashboardBalance(
        source,
        pendingSubSpendChange.completes
          ? -pendingSubSpendChange.amount
          : pendingSubSpendChange.amount,
      );
      balanceAdjusted = true;
      const updatedSpend = await updateSubSpend(
        pendingSubSpendChange.spendId,
        pendingSubSpendChange.payload,
      );
      setSubSpends((current) =>
        current.map((item) => item.id === updatedSpend.id ? updatedSpend : item),
      );
      setPendingSubSpendChange(null);
      setIsBalanceChangeVisible(false);
      showSuccessToast(
        pendingSubSpendChange.completes
          ? `Subspend deducted from ${source}.`
          : `Subspend restored to ${source}.`,
      );
    } catch (error) {
      if (balanceAdjusted) {
        try {
          await adjustDashboardBalance(
            source,
            pendingSubSpendChange.completes
              ? pendingSubSpendChange.amount
              : -pendingSubSpendChange.amount,
          );
        } catch (rollbackError) {
          setPendingSubSpendChange(null);
          setIsBalanceChangeVisible(false);
          showErrorToast(
            `Subspend status was not changed and balance rollback failed: ${getApiErrorMessage(rollbackError, 'Please check your account balance.')}`,
          );
          return;
        }
      }
      showErrorToast(
        getApiErrorMessage(error, 'Unable to update subspend and account balance.'),
      );
    } finally {
      setUpdatingSpendId(null);
      setIsAdjustingBalance(false);
    }
  };

  const toggleSpendCompleted = (spend: SubSpend): void => {
    if (updatingSpendId !== null || pendingSubSpendChange !== null) return;
    setPendingSubSpendChange({
      spendId: spend.id,
      amount: Number(spend.amount),
      completes: !spend.isCompleted,
      payload: {
        title: spend.title,
        amount: spend.amount,
        is_completed: !spend.isCompleted,
      },
    });
    setIsBalanceChangeVisible(true);
  };

  const renderSubSpend = ({ item }: { item: SubSpend }): React.JSX.Element => (
    <View style={styles.spendCard}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={`${item.title}, ${item.isCompleted ? 'completed' : 'not completed'}`}
        accessibilityState={{
          checked: item.isCompleted,
          disabled: updatingSpendId !== null || pendingSubSpendChange !== null,
          busy: updatingSpendId === item.id,
        }}
        disabled={updatingSpendId !== null || pendingSubSpendChange !== null}
        onPress={() => void toggleSpendCompleted(item)}
        style={styles.checkButton}
      >
        {updatingSpendId === item.id ? (
          <ActivityIndicator color={Colors.brand.orchid} size={ms(20)} />
        ) : (
          <Ionicons
            name={item.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
            size={ms(24)}
            color={Colors.brand.orchid}
          />
        )}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit ${item.title}, ${formatCurrency(Number(item.amount))}`}
        onPress={() => void openSpendEditor(item)}
        style={({ pressed }) => [styles.spendDetails, pressed && styles.pressed]}
      >
        <Text
          numberOfLines={1}
          style={[styles.spendTitle, item.isCompleted && styles.completedText]}
        >
          {item.title}
        </Text>
        <Text style={styles.spendAmount}>{formatCurrency(Number(item.amount))}</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={screenStyles.container}>
      <View style={styles.headerContainer}>
        <Header
          title={pageTitle || 'Subpage'}
          back
          onBackPress={() => navigation.goBack()}
          titleColor={Colors.brand.deepPlum}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit subpage"
          disabled={subPageId === undefined}
          onPress={openPageEditor}
          style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
        >
          <MaterialDesignIcons name="pencil" size={ms(20)} color={Colors.brand.plum} />
        </Pressable>
      </View>

      <FlatList
        data={isLoading ? [] : sortedSubSpends}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderSubSpend}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void refreshSubSpends()}
            tintColor={Colors.brand.plum}
            colors={[Colors.brand.plum]}
          />
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.sectionHeading}>Summary</Text>
            <View style={styles.summaryCard}>
              {isLoading ? (
                <View style={styles.summarySkeletons}>
                  {[0, 1, 2].map((index) => (
                    <View key={index} style={styles.summaryItem}>
                      <Skeleton width="72%" height={ms(12)} />
                      <Skeleton width="88%" height={ms(16)} style={styles.summarySkeletonValue} />
                    </View>
                  ))}
                </View>
              ) : (
                <>
                  <SummaryItem label="Total" value={totalAmount} />
                  <SummaryItem label="Completed" value={completedAmount} />
                  <SummaryItem label="Remaining" value={totalAmount - completedAmount} />
                </>
              )}
            </View>
            <View style={styles.completedRow}>
              <Text style={styles.inputLabel}>Subpage completed</Text>
              <Switch
                accessibilityLabel="Subpage completed"
                accessibilityState={{
                  checked: isPageCompleted,
                  disabled: subPageId === undefined || isUpdatingPageCompletion,
                  busy: isUpdatingPageCompletion,
                }}
                disabled={subPageId === undefined || isUpdatingPageCompletion}
                value={isPageCompleted}
                onValueChange={(value) => void updatePageCompletion(value)}
                trackColor={{ false: Colors.neutral[40], true: Colors.brand.orchid }}
                thumbColor={Colors.neutral[10]}
              />
            </View>
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionHeading}>Subspends</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingList}>
              {[0, 1, 2].map((index) => <SubSpendSkeleton key={index} />)}
            </View>
          ) : loadError ? (
            <EmptyState
              message="Unable to load subspends. Pull down to try again."
              icon="alert-circle-outline"
            />
          ) : (
            <EmptyState message="No subspends added yet" icon="receipt-outline" />
          )
        }
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create subspend"
        disabled={subPageId === undefined}
        onPress={() => {
          if (subPageId !== undefined) {
            navigation.navigate('SubSpendCreate', { subPageId });
          }
        }}
        style={({ pressed }) => [
          styles.createButton,
          pressed && styles.pressed,
          subPageId === undefined && styles.disabledControl,
        ]}
      >
        <Ionicons name="add" size={ms(30)} color={Colors.neutral[10]} />
      </Pressable>

      <BottomSheetModal
        visible={isPageEditorVisible || isSpendEditorVisible || deleteConfirmation !== null}
        onClose={() => {
          if (isSavingPage || isSavingSpend || isDeleting) return;
          setIsPageEditorVisible(false);
          setIsSpendEditorVisible(false);
          setDeleteConfirmation(null);
        }}
        size="form"
      >
        <View style={styles.modalCard}>
          {deleteConfirmation === 'subPage' ? (
            <DeleteConfirmationContent
              title="Delete subpage?"
              message="This subpage and its subspends will be permanently deleted."
              isDeleting={isDeleting}
              onCancel={() => setDeleteConfirmation(null)}
              onDelete={() => void removePage()}
            />
          ) : deleteConfirmation === 'subSpend' ? (
            <DeleteConfirmationContent
              title="Delete subspend?"
              message="This subspend will be permanently deleted."
              isDeleting={isDeleting}
              onCancel={() => setDeleteConfirmation(null)}
              onDelete={() => void removeSpend()}
            />
          ) : isPageEditorVisible ? (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Update Subpage</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Delete subpage"
                  disabled={isSavingPage}
                  onPress={() => setDeleteConfirmation('subPage')}
                  style={styles.modalIconButton}
                >
                  <Ionicons name="trash-outline" size={ms(22)} color={Colors.status.error} />
                </Pressable>
              </View>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                accessibilityLabel="Subpage title"
                autoCapitalize="sentences"
                autoCorrect
                maxLength={100}
                onChangeText={setPageTitleInput}
                placeholder="Subpage title"
                placeholderTextColor={Colors.neutral[60]}
                returnKeyType="done"
                style={styles.input}
                value={pageTitleInput}
              />
              <LoadingButton
                isLoading={isSavingPage}
                onPress={savePage}
                style={[styles.saveButton, {marginTop: vs(16)}]}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </LoadingButton>
            </>
          ) : isSpendLoading ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator color={Colors.brand.plum} size={ms(36)} />
              <Text style={styles.modalLoadingText}>Loading subspend...</Text>
            </View>
          ) : selectedSpend ? (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Update Subspend</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Delete subspend"
                  disabled={isSavingSpend || isDeleting}
                  onPress={() => setDeleteConfirmation('subSpend')}
                  style={styles.modalIconButton}
                >
                  <Ionicons name="trash-outline" size={ms(22)} color={Colors.status.error} />
                </Pressable>
              </View>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                accessibilityLabel="Subspend title"
                autoCapitalize="sentences"
                autoCorrect
                maxLength={100}
                onChangeText={setSpendTitle}
                placeholder="Subspend title"
                placeholderTextColor={Colors.neutral[60]}
                style={styles.input}
                value={spendTitle}
              />
              <Text style={styles.inputLabel}>Amount</Text>
              <TextInput
                accessibilityLabel="Subspend amount"
                keyboardType="decimal-pad"
                onChangeText={(value) => setSpendAmount(sanitizeNumericInput(value, 2))}
                placeholder="0.00"
                placeholderTextColor={Colors.neutral[60]}
                style={styles.input}
                value={spendAmount}
              />
              <View style={styles.completedRow}>
                <Text style={styles.inputLabel}>Completed</Text>
                <Switch
                  accessibilityLabel="Subspend completed"
                  value={spendCompleted}
                  onValueChange={setSpendCompleted}
                  trackColor={{ false: Colors.neutral[40], true: Colors.brand.orchid }}
                  thumbColor={Colors.neutral[10]}
                />
              </View>
              <LoadingButton
                disabled={isDeleting}
                isLoading={isSavingSpend}
                onPress={saveSpend}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>Save changes</Text>
              </LoadingButton>
            </>
          ) : null}
        </View>
      </BottomSheetModal>

      <BottomSheetModal
        visible={isBalanceChangeVisible}
        onClose={() => {
          if (!isAdjustingBalance) cancelPendingSubSpendChange();
        }}
        size="compact"
      >
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>
            {pendingSubSpendChange?.completes ? 'Deduct subspend' : 'Restore subspend'}
          </Text>
          <Text style={styles.modalDescription}>
            {pendingSubSpendChange
              ? `Choose where to ${pendingSubSpendChange.completes ? 'deduct' : 'restore'} ${formatCurrency(pendingSubSpendChange.amount)} ${pendingSubSpendChange.completes ? 'from' : 'to'}.`
              : 'Choose an account.'}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${pendingSubSpendChange?.completes ? 'Deduct from' : 'Restore to'} bank`}
            disabled={isAdjustingBalance}
            onPress={() => void handleSubSpendBalanceChange('bank')}
            style={({ pressed }) => [styles.sourceOption, pressed && styles.pressed]}
          >
            <Ionicons name="business-outline" size={ms(22)} color={Colors.brand.plum} />
            <Text style={styles.sourceOptionText}>Bank</Text>
            <Ionicons name="chevron-forward" size={ms(20)} color={Colors.neutral[60]} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${pendingSubSpendChange?.completes ? 'Deduct from' : 'Restore to'} cash`}
            disabled={isAdjustingBalance}
            onPress={() => void handleSubSpendBalanceChange('cash')}
            style={({ pressed }) => [styles.sourceOption, pressed && styles.pressed]}
          >
            <Ionicons name="cash-outline" size={ms(22)} color={Colors.brand.plum} />
            <Text style={styles.sourceOptionText}>Cash</Text>
            <Ionicons name="chevron-forward" size={ms(20)} color={Colors.neutral[60]} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={isAdjustingBalance}
            onPress={cancelPendingSubSpendChange}
            style={({ pressed }) => [
              styles.cancelButton,
              pressed && styles.pressed,
              isAdjustingBalance && styles.disabledControl,
            ]}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </BottomSheetModal>
    </SafeAreaView>
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

function SubSpendSkeleton(): React.JSX.Element {
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
      <Text style={styles.modalDescription}>{message}</Text>
      <LoadingButton
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
          styles.cancelButton,
          pressed && styles.pressed,
          isDeleting && styles.disabledControl,
        ]}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'relative',
  },
  headerButton: {
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
    paddingBottom: vs(90),
  },
  sectionHeading: {
    ...TextStyles.Medium16,
    color: Colors.neutral[70],
    marginBottom: vs(10),
  },
  summaryCard: {
    flexDirection: 'row',
    gap: s(8),
    padding: s(16),
    marginBottom: vs(18),
    borderRadius: ms(16),
    borderWidth: 1,
    borderColor: Colors.neutral[30],
    backgroundColor: Colors.neutral[10],
  },
  summaryItem: {
    flex: 1,
  },
  summarySkeletons: {
    flex: 1,
    flexDirection: 'row',
    gap: s(8),
  },
  summarySkeletonValue: {
    marginTop: vs(8),
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
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(8),
  },
  deletePageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
    padding: s(6),
  },
  deletePageText: {
    ...TextStyles.Medium12,
    color: Colors.status.error,
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
  pressed: {
    opacity: 0.78,
  },
  disabledControl: {
    opacity: 0.55,
  },
  modalCard: {
    width: '100%',
    padding: s(20),
    backgroundColor: Colors.neutral[10],
    gap: vs(10),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(4),
  },
  modalTitle: {
    ...TextStyles.SemiBold20,
    color: Colors.brand.deepPlum,
    marginBottom: vs(4),
  },
  modalIconButton: {
    width: ms(40),
    height: ms(40),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -vs(8),
    marginRight: -s(8),
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
  modalDescription: {
    ...TextStyles.Regular14,
    color: Colors.neutral[70],
    marginBottom: vs(4),
  },
  sourceOption: {
    minHeight: vs(48),
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    paddingHorizontal: s(12),
    borderWidth: 1,
    borderColor: Colors.neutral[30],
    borderRadius: ms(12),
  },
  sourceOptionText: {
    ...TextStyles.Medium14,
    color: Colors.brand.deepPlum,
    flex: 1,
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
  cancelButton: {
    minHeight: vs(42),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[30],
    borderRadius: ms(12),
  },
  cancelButtonText: {
    ...TextStyles.SemiBold14,
    color: Colors.neutral[70],
  },
});
