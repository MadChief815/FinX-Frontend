import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
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
import {
  deleteIncome,
  getIncome,
  updateIncome,
} from '../../api/adapters/incomes.adapter';
import type { Income } from '../../api/adapters/incomes.adapter';
import type { IncomePayload } from '../../api/adapters/incomes.adapter';
import { adjustDashboardBalance } from '../../api/adapters/dashboard.adapter';

// Components
import { BottomSheetModal } from '../../components/BottomSheetModal';
import Header from '../../components/Header';
import { LoadingButton } from '../../components/LoadingButton';
import { Skeleton } from '../../components/Skeleton';
import { IncomeFormFields } from './IncomeFormFields';
import { formatIncomeDate } from './IncomeDatePicker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

// Utilities
import { getApiErrorMessage } from '../../utils/apiError';
import { Colors } from '../../utils/Colors';
import { ms, s, vs } from '../../utils/Responsive';
import { screenStyles } from '../../utils/screenStyles';
import { TextStyles } from '../../utils/TextStyles';
import { showErrorToast, showSuccessToast } from '../../utils/toast';

type IncomeDetailScreenProps = NativeStackScreenProps<
  IncomeStackParamList,
  'IncomeDetail'
>;

const formatCurrency = (value: string): string => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `Rs. ${value}`;
  const [whole, fraction] = amount.toFixed(2).split('.');
  return `Rs. ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`;
};

const formatDateTime = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const parseAmount = (value: string): number => {
  const amount = Number(value.trim());
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
};

export default function IncomeDetailScreen({
  navigation,
  route,
}: IncomeDetailScreenProps): React.JSX.Element {
  const [income, setIncome] = useState<Income | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleteConfirmationVisible, setIsDeleteConfirmationVisible] =
    useState(false);
  const [isBalanceModalVisible, setIsBalanceModalVisible] = useState(false);
  const [balanceSource, setBalanceSource] = useState<'cash' | 'bank' | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [isReceived, setIsReceived] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const hasLoadedIncome = useRef(false);

  const loadIncome = useCallback(async (showLoading: boolean): Promise<void> => {
    if (showLoading) setIsLoading(true);
    try {
      setIncome(await getIncome(route.params.incomeId));
      setLoadError(false);
    } catch (error) {
      setLoadError(true);
      showErrorToast(
        getApiErrorMessage(error, 'Unable to load this income. Please try again.'),
      );
    } finally {
      hasLoadedIncome.current = true;
      if (showLoading) setIsLoading(false);
    }
  }, [route.params.incomeId]);

  useFocusEffect(
    useCallback(() => {
      void loadIncome(!hasLoadedIncome.current);
    }, [loadIncome]),
  );

  const openEditor = (): void => {
    if (!income) return;
    setTitle(income.title);
    setAmount(String(income.amount));
    setExpectedDate(income.expectedDate);
    setIsReceived(income.isReceived);
    setBalanceSource(null);
    setIsBalanceModalVisible(false);
    setIsDeleteConfirmationVisible(false);
    setIsEditModalVisible(true);
  };

  const refreshIncome = async (): Promise<void> => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await loadIncome(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  const payload = (): IncomePayload => ({
    title: title.trim(),
    amount: parseAmount(amount).toFixed(2),
    expected_date: expectedDate,
    is_received: isReceived,
  });

  const getBalanceDelta = (nextAmount: number): number => {
    if (!income) return 0;
    if (income.isReceived && !isReceived) return -Number(income.amount);
    return nextAmount - Number(income.amount);
  };
  const isUncheckingReceivedIncome = Boolean(income?.isReceived && !isReceived);
  const draftBalanceDelta = getBalanceDelta(parseAmount(amount));

  const saveIncome = async (): Promise<void> => {
    if (!income) return;
    if (!title.trim()) {
      showErrorToast('Enter an income title.');
      return;
    }
    const nextAmount = parseAmount(amount);
    if (!nextAmount) {
      showErrorToast('Enter an amount greater than zero.');
      return;
    }

    const nextPayload = payload();
    if (
      nextPayload.title === income.title &&
      Number(nextPayload.amount) === Number(income.amount) &&
      nextPayload.expected_date === income.expectedDate &&
      nextPayload.is_received === income.isReceived
    ) {
      setIsEditModalVisible(false);
      return;
    }

    const balanceDelta = getBalanceDelta(nextAmount);
    if (balanceDelta !== 0 && !balanceSource) {
      setIsBalanceModalVisible(true);
      return;
    }

    setIsSaving(true);
    let balanceAdjusted = false;
    try {
      if (balanceDelta !== 0 && balanceSource) {
        await adjustDashboardBalance(balanceSource, balanceDelta);
        balanceAdjusted = true;
      }
      await updateIncome(income.id, nextPayload);
      showSuccessToast(
        balanceDelta === 0
          ? 'Income updated.'
          : isUncheckingReceivedIncome
            ? `Income updated and deducted from ${balanceSource}.`
            : balanceDelta > 0
              ? `Income updated and added to ${balanceSource}.`
              : 'Income updated.',
      );
      navigation.goBack();
    } catch (error) {
      if (balanceAdjusted && balanceSource) {
        try {
          await adjustDashboardBalance(balanceSource, -balanceDelta);
        } catch (rollbackError) {
          showErrorToast(
            `Income was not updated and balance rollback failed: ${getApiErrorMessage(rollbackError, 'Please check your account balance.')}`,
          );
          navigation.goBack();
          return;
        }
      }
      showErrorToast(
        getApiErrorMessage(error, 'Unable to update this income. Please try again.'),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const removeIncome = async (): Promise<void> => {
    if (!income || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteIncome(income.id);
      setIsEditModalVisible(false);
      setIsDeleteConfirmationVisible(false);
      showSuccessToast('Income deleted.');
      navigation.goBack();
    } catch (error) {
      showErrorToast(
        getApiErrorMessage(error, 'Unable to delete this income. Please try again.'),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const resetBalanceSource = <T,>(setValue: (value: T) => void, value: T): void => {
    setBalanceSource(null);
    setValue(value);
  };

  const closeBalanceModal = (): void => {
    setIsBalanceModalVisible(false);
    setBalanceSource(null);
  };

  return (
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      style={[screenStyles.container, styles.root]}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Header
            title="Income Details"
            back
            onBackPress={() => navigation.goBack()}
            titleColor={Colors.brand.deepPlum}
          />
          {income && !isLoading && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit income"
              onPress={openEditor}
              style={({ pressed }) => [styles.headerEditButton, pressed && styles.pressed]}
            >
              <MaterialDesignIcons
                name="pencil"
                size={ms(20)}
                color={Colors.brand.plum}
              />
            </Pressable>
          )}
        </View>

        {/* Income Details */}
        {isLoading ? (
          <IncomeDetailsSkeleton />
        ) : income ? (
          <View style={styles.summaryCard}>
            <View style={styles.summaryContent}>
              <Text style={styles.incomeTitle}>{income.title}</Text>
              <Text style={styles.amount}>{formatCurrency(income.amount)}</Text>
              <View style={[styles.statusPill, income.isReceived && styles.receivedPill]}>
                <Text style={[styles.statusText, income.isReceived && styles.receivedText]}>
                  {income.isReceived ? 'Received' : 'Expected'}
                </Text>
              </View>
            </View>
            <View style={styles.detailsSection}>
              <DetailRow label="Expected date" value={formatIncomeDate(income.expectedDate)} />
              <DetailRow label="Created" value={formatDateTime(income.createdAt)} />
              <DetailRow label="Last updated" value={formatDateTime(income.updatedAt)} />
            </View>
            {loadError && (
              <Pressable
                accessibilityRole="button"
                disabled={isRefreshing}
                onPress={() => void refreshIncome()}
                style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
              >
                {isRefreshing ? (
                  <ActivityIndicator color={Colors.brand.plum} />
                ) : (
                  <Text style={styles.retryButtonText}>Unable to refresh. Try again</Text>
                )}
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.loadErrorState}>
            <Ionicons
              name="alert-circle-outline"
              size={ms(38)}
              color={Colors.status.error}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text accessibilityRole="alert" style={styles.errorMessage}>
              {loadError ? 'Unable to load this income.' : 'Income details are unavailable.'}
            </Text>
            {loadError && (
              <Pressable
                accessibilityRole="button"
                onPress={() => void loadIncome(true)}
                style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
              >
                <Text style={styles.retryButtonText}>Try again</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Edit Income Modal */}
      <BottomSheetModal
        visible={isEditModalVisible}
        onClose={() => {
          if (isSaving || isDeleting) return;
          setIsEditModalVisible(false);
          setIsDeleteConfirmationVisible(false);
        }}
        size="form"
      >
        <ScrollView
          style={styles.modalScroll}
          contentContainerStyle={styles.modalCard}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isDeleteConfirmationVisible ? (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Delete Income?</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cancel delete"
                  disabled={isDeleting}
                  onPress={() => setIsDeleteConfirmationVisible(false)}
                  style={styles.iconButton}
                >
                  <Ionicons name="close" size={ms(22)} color={Colors.neutral[70]} />
                </Pressable>
              </View>
              <Text style={styles.deleteMessage}>
                This income will be permanently deleted.
              </Text>
              <LoadingButton
                isLoading={isDeleting}
                onPress={removeIncome}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>Delete Income</Text>
              </LoadingButton>
              <Pressable
                accessibilityRole="button"
                disabled={isDeleting}
                onPress={() => setIsDeleteConfirmationVisible(false)}
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.pressed,
                  isDeleting && styles.disabled,
                ]}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
            </>
          ) : (
            <>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Income</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Delete income"
                  disabled={isSaving || isDeleting}
                  onPress={() => setIsDeleteConfirmationVisible(true)}
                  style={styles.iconButton}
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

              {/* Form */}
              <IncomeFormFields
                title={title}
                amount={amount}
                expectedDate={expectedDate}
                isReceived={isReceived}
                disabled={isSaving || isDeleting}
                receivedWillBeReversed={Boolean(income?.isReceived && !isReceived)}
                onTitleChange={(value) => resetBalanceSource(setTitle, value)}
                onAmountChange={(value) => resetBalanceSource(setAmount, value)}
                onDateChange={(value) => resetBalanceSource(setExpectedDate, value)}
                onReceivedChange={(value) => resetBalanceSource(setIsReceived, value)}
              />
              {balanceSource && (
                <Text style={styles.sourceDescription}>
                  Method: {balanceSource === 'bank' ? 'Bank' : 'Cash'}
                </Text>
              )}

              {/* Actions */}
              <LoadingButton
                disabled={isDeleting}
                isLoading={isSaving}
                onPress={saveIncome}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </LoadingButton>
              <Pressable
                accessibilityRole="button"
                disabled={isSaving || isDeleting}
                onPress={() => setIsEditModalVisible(false)}
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.pressed,
                  (isSaving || isDeleting) && styles.disabled,
                ]}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </BottomSheetModal>

      {/* Balance Source */}
      <BottomSheetModal
        visible={isBalanceModalVisible}
        onClose={closeBalanceModal}
        size="compact"
      >
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>
            {isUncheckingReceivedIncome
              ? 'Deduct received income'
              : draftBalanceDelta < 0
                ? 'Update income amount'
                : 'Add income'}
          </Text>
          <Text style={styles.sourceDescription}>
            {isUncheckingReceivedIncome
              ? `Choose where to deduct ${formatCurrency(String(Math.abs(draftBalanceDelta)))} from.`
              : draftBalanceDelta < 0
                ? `Choose where to apply the ${formatCurrency(String(Math.abs(draftBalanceDelta)))} amount change.`
                : `Choose where to add ${formatCurrency(String(Math.abs(draftBalanceDelta)))} to.`}
          </Text>
          {(['bank', 'cash'] as const).map((source) => (
            <Pressable
              key={source}
              accessibilityRole="button"
              accessibilityLabel={`Select ${source}`}
              onPress={() => {
                setBalanceSource(source);
                setIsBalanceModalVisible(false);
              }}
              style={({ pressed }) => [
                styles.sourceOption,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name={source === 'bank' ? 'business-outline' : 'cash-outline'}
                size={ms(22)}
                color={Colors.brand.plum}
              />
              <Text style={styles.sourceOptionText}>
                {source === 'bank' ? 'Bank' : 'Cash'}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={ms(20)}
                color={Colors.neutral[60]}
              />
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            onPress={closeBalanceModal}
            style={({ pressed }) => [styles.cancelOption, pressed && styles.pressed]}
          >
            <Text style={styles.cancelOptionText}>Cancel</Text>
          </Pressable>
        </View>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

function IncomeDetailsSkeleton(): React.JSX.Element {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryContent}>
        <Skeleton width="58%" height={ms(22)} />
        <Skeleton width="42%" height={ms(28)} style={styles.skeletonGap} />
        <Skeleton width={ms(82)} height={ms(24)} style={styles.skeletonGap} />
      </View>
      <View style={styles.detailsSection}>
        {[0, 1, 2].map((index) => (
          <View key={index} style={styles.detailRow}>
            <Skeleton width={ms(88)} height={ms(16)} />
            <Skeleton width="55%" height={ms(16)} />
          </View>
        ))}
      </View>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 0,
    paddingTop: vs(18),
  },
  content: {
    flex: 1,
    paddingHorizontal: s(20),
  },
  headerContainer: {
    position: 'relative',
  },
  headerEditButton: {
    position: 'absolute',
    right: s(4),
    top: vs(10),
    width: ms(42),
    height: ms(42),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ms(21),
    backgroundColor: Colors.neutral[20],
  },
  summaryCard: {
    marginTop: vs(20),
    padding: s(16),
    borderWidth: 1,
    borderColor: Colors.neutral[30],
    borderRadius: ms(16),
    backgroundColor: Colors.neutral[10],
  },
  summaryContent: {
    alignItems: 'center',
    gap: vs(8),
    paddingVertical: vs(8),
  },
  incomeTitle: {
    ...TextStyles.SemiBold18,
    color: Colors.brand.deepPlum,
    textAlign: 'center',
  },
  amount: {
    ...TextStyles.Bold24,
    color: Colors.brand.plum,
  },
  statusPill: {
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: ms(12),
    backgroundColor: Colors.neutral[20],
  },
  receivedPill: {
    backgroundColor: Colors.neutral[20],
  },
  statusText: {
    ...TextStyles.Medium12,
    color: Colors.neutral[70],
  },
  receivedText: {
    color: Colors.brand.teal,
  },
  detailsSection: {
    gap: vs(14),
    marginTop: vs(18),
    paddingTop: vs(16),
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[30],
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: s(12),
  },
  detailLabel: {
    ...TextStyles.Regular14,
    color: Colors.neutral[60],
  },
  detailValue: {
    flex: 1,
    ...TextStyles.Medium14,
    color: Colors.neutral[90],
    textAlign: 'right',
  },
  skeletonGap: {
    marginTop: vs(4),
  },
  loadErrorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: vs(12),
  },
  errorMessage: {
    ...TextStyles.Medium14,
    color: Colors.status.error,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: vs(42),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(12),
  },
  retryButtonText: {
    ...TextStyles.SemiBold14,
    color: Colors.brand.orchid,
  },
  modalCard: {
    gap: vs(10),
    paddingHorizontal: s(20),
    paddingVertical: vs(18),
  },
  modalScroll: {
    flexGrow: 0,
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    ...TextStyles.SemiBold20,
    color: Colors.brand.deepPlum,
  },
  iconButton: {
    width: ms(40),
    height: ms(40),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ms(20),
    backgroundColor: Colors.neutral[20],
  },
  deleteMessage: {
    ...TextStyles.Regular14,
    color: Colors.neutral[70],
    marginVertical: vs(8),
  },
  deleteButton: {
    minHeight: vs(48),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ms(12),
    backgroundColor: Colors.status.error,
  },
  deleteButtonText: {
    ...TextStyles.SemiBold16,
    color: Colors.neutral[10],
  },
  cancelButton: {
    minHeight: vs(42),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    ...TextStyles.SemiBold14,
    color: Colors.neutral[70],
  },
  saveButton: {
    minHeight: vs(48),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(6),
    borderRadius: ms(12),
    backgroundColor: Colors.brand.plum,
  },
  saveButtonText: {
    ...TextStyles.SemiBold16,
    color: Colors.neutral[10],
  },
  sourceDescription: {
    ...TextStyles.Regular14,
    color: Colors.neutral[70],
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
    flex: 1,
    ...TextStyles.SemiBold16,
    color: Colors.brand.deepPlum,
  },
  cancelOption: {
    minHeight: vs(42),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelOptionText: {
    ...TextStyles.SemiBold14,
    color: Colors.neutral[70],
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.72,
  },
});
