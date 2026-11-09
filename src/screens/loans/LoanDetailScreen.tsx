import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { LoansStackParamList } from '../../navigation/types';

// API
import {
  deleteLoan,
  getLoan,
  updateLoan,
} from '../../api/adapters/loans.adapter';
import type {
  Loan,
  LoanStatus,
  LoanType,
  LoanUpdatePayload,
} from '../../api/adapters/loans.adapter';
import { adjustDashboardBalance } from '../../api/adapters/dashboard.adapter';

// Components
import Header from '../../components/Header';
import { BottomSheetModal } from '../../components/BottomSheetModal';
import { LoadingButton } from '../../components/LoadingButton';
import { Skeleton } from '../../components/Skeleton';

// Icons
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

// Utilities
import { getApiErrorMessage } from '../../utils/apiError';
import { Colors } from '../../utils/Colors';
import { ms, s, vs } from '../../utils/Responsive';
import { screenStyles } from '../../utils/screenStyles';
import { TextStyles } from '../../utils/TextStyles';
import { showErrorToast, showSuccessToast } from '../../utils/toast';

type LoanDetailScreenProps = NativeStackScreenProps<
  LoansStackParamList,
  'LoanDetail'
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

const isValidAmount = (value: string): boolean =>
  /^\d+$/.test(value.trim()) && Number(value) > 0;

const getLoanBalanceDelta = (
  loan: Loan,
  payload: LoanUpdatePayload,
): number => {
  const previousAmount = Number(loan.amount);
  const nextAmount = Number(payload.amount);
  if (loan.status === 'active' && payload.status === 'paid') {
    return payload.type === 'lent' ? nextAmount : -nextAmount;
  }
  if (loan.status === 'paid' && payload.status === 'active') {
    return nextAmount;
  }
  if (loan.status === 'paid' && payload.status === 'paid') {
    const previousImpact = loan.type === 'lent' ? previousAmount : -previousAmount;
    const nextImpact = payload.type === 'lent' ? nextAmount : -nextAmount;
    return nextImpact - previousImpact;
  }
  return 0;
};

export default function LoanDetailScreen({
  navigation,
  route,
}: LoanDetailScreenProps): React.JSX.Element {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleteConfirmationVisible, setIsDeleteConfirmationVisible] =
    useState(false);
  const [isBalanceModalVisible, setIsBalanceModalVisible] = useState(false);
  const [balanceSource, setBalanceSource] = useState<'cash' | 'bank' | null>(null);
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<LoanType>('lent');
  const [status, setStatus] = useState<LoanStatus>('active');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdjustingBalance, setIsAdjustingBalance] = useState(false);
  const hasLoadedLoan = useRef(false);

  const loadLoan = useCallback(async (showLoading: boolean): Promise<void> => {
    if (showLoading) setIsLoading(true);
    try {
      setLoan(await getLoan(route.params.loanId));
      setLoadError(false);
    } catch (error) {
      setLoadError(true);
      showErrorToast(getApiErrorMessage(error, 'Unable to load this loan. Please try again.'));
    } finally {
      hasLoadedLoan.current = true;
      if (showLoading) setIsLoading(false);
    }
  }, [route.params.loanId]);

  useFocusEffect(
    useCallback(() => {
      void loadLoan(!hasLoadedLoan.current);
    }, [loadLoan]),
  );

  const refreshLoan = async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      await loadLoan(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  const openEditor = (): void => {
    if (!loan) return;
    setPersonName(loan.personName);
    setAmount(String(Math.trunc(Number(loan.amount))));
    setType(loan.type);
    setStatus(loan.status);
    setBalanceSource(null);
    setIsBalanceModalVisible(false);
    setIsDeleteConfirmationVisible(false);
    setIsEditModalVisible(true);
  };

  const saveLoan = async (): Promise<void> => {
    if (!loan) return;
    const trimmedName = personName.trim();
    if (!trimmedName) {
      showErrorToast("Enter the person's name.");
      return;
    }
    if (!isValidAmount(amount)) {
      showErrorToast('Enter a whole amount greater than zero.');
      return;
    }

    const payload = {
      person_name: trimmedName,
      amount: String(Number(amount)),
      type,
      status,
    };
    if (
      payload.person_name === loan.personName &&
      Number(payload.amount) === Number(loan.amount) &&
      payload.type === loan.type &&
      payload.status === loan.status
    ) {
      setIsEditModalVisible(false);
      return;
    }

    const balanceDelta = getLoanBalanceDelta(loan, payload);
    if (balanceDelta !== 0 && !balanceSource) {
      setIsBalanceModalVisible(true);
      return;
    }

    setIsSaving(true);
    let balanceAdjusted = false;
    try {
      if (balanceDelta !== 0 && balanceSource) {
        setIsAdjustingBalance(true);
        await adjustDashboardBalance(balanceSource, balanceDelta);
        balanceAdjusted = true;
      }
      await updateLoan(loan.id, payload);
      showSuccessToast(
        balanceDelta === 0
          ? 'Loan updated.'
          : balanceDelta > 0
            ? `Loan updated and money restored to ${balanceSource}.`
            : `Loan updated and money deducted from ${balanceSource}.`,
      );
      navigation.goBack();
    } catch (error) {
      if (balanceAdjusted && balanceSource) {
        try {
          await adjustDashboardBalance(balanceSource, -balanceDelta);
        } catch (rollbackError) {
          showErrorToast(
            `Loan was not updated and balance rollback failed: ${getApiErrorMessage(rollbackError, 'Please check your account balance.')}`,
          );
          navigation.goBack();
          return;
        }
      }
      showErrorToast(getApiErrorMessage(error, 'Unable to update this loan. Please try again.'));
    } finally {
      setIsAdjustingBalance(false);
      setIsSaving(false);
    }
  };

  const selectBalanceSource = (source: 'cash' | 'bank'): void => {
    setBalanceSource(source);
    setIsBalanceModalVisible(false);
  };

  const closeBalanceSourceModal = (): void => {
    if (isAdjustingBalance) return;
    setBalanceSource(null);
    setIsBalanceModalVisible(false);
  };

  const removeLoan = async (): Promise<void> => {
    if (!loan) return;
    setIsDeleting(true);
    try {
      await deleteLoan(loan.id);
      setIsEditModalVisible(false);
      setIsDeleteConfirmationVisible(false);
      showSuccessToast('Loan deleted.');
      navigation.goBack();
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, 'Unable to delete this loan. Please try again.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const draftBalanceDelta = loan
    ? getLoanBalanceDelta(loan, {
      person_name: personName.trim(),
      amount: String(Number(amount)),
      type,
      status,
    })
    : 0;

  return (
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      style={[screenStyles.container, styles.root]}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Header
            title="Loan Details"
            back
            onBackPress={() => navigation.goBack()}
            titleColor={Colors.brand.deepPlum}
          />
          {loan && !isLoading && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit loan"
              onPress={openEditor}
              style={({ pressed }) => [
                styles.headerEditButton,
                pressed && styles.pressed,
              ]}
            >
              <MaterialDesignIcons
                name="pencil"
                size={ms(20)}
                color={Colors.brand.plum}
              />
            </Pressable>
          )}
        </View>

        <View style={styles.detailsContent}>
          {isLoading ? (
            <LoanDetailsSkeleton />
          ) : loan ? (
            <>
              {/* Loan Summary */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryContent}>
                  <Text style={styles.personName}>{loan.personName}</Text>
                  <Text style={styles.amount}>{formatCurrency(loan.amount)}</Text>
                  <View
                    style={[
                      styles.statusPill,
                      loan.status === 'paid' && styles.paidStatus,
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {loan.status === 'paid' ? 'Completed' : 'Active'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <DetailRow label="Type" value={loan.type === 'lent' ? 'Lent' : 'Borrowed'} />
                  <DetailRow label="Created" value={formatDateTime(loan.createdAt)} />
                  <DetailRow label="Last updated" value={formatDateTime(loan.updatedAt)} />
                </View>
              </View>

              {loadError && (
                <View style={styles.retryContainer}>
                  <Text accessibilityRole="alert" style={styles.errorMessage}>
                    Unable to refresh this loan.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isRefreshing}
                    onPress={() => void refreshLoan()}
                    style={({ pressed }) => [
                      styles.retryButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    {isRefreshing ? (
                      <ActivityIndicator color={Colors.brand.plum} />
                    ) : (
                      <Text style={styles.retryButtonText}>Try again</Text>
                    )}
                  </Pressable>
                </View>
              )}

            </>
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
                {loadError ? 'Unable to load this loan.' : 'Loan details are unavailable.'}
              </Text>
              {loadError && (
                <Pressable
                  accessibilityRole="button"
                  disabled={isRefreshing}
                  onPress={() => void refreshLoan()}
                  style={({ pressed }) => [
                    styles.retryButton,
                    pressed && styles.pressed,
                  ]}
                >
                  {isRefreshing ? (
                    <ActivityIndicator color={Colors.brand.plum} />
                  ) : (
                    <Text style={styles.retryButtonText}>Try again</Text>
                  )}
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Edit Loan Modal */}
      <BottomSheetModal
        visible={isEditModalVisible}
        onClose={() => {
          if (isSaving || isDeleting) return;
          setIsEditModalVisible(false);
          setIsDeleteConfirmationVisible(false);
        }}
        size="form"
      >
        <View style={styles.modalCard}>
          {isDeleteConfirmationVisible ? (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Delete Loan?</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cancel delete"
                  disabled={isDeleting}
                  onPress={() => setIsDeleteConfirmationVisible(false)}
                  style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                >
                  <Ionicons name="close" size={ms(22)} color={Colors.neutral[70]} />
                </Pressable>
              </View>
              <Text style={styles.deleteMessage}>
                This loan will be permanently deleted.
              </Text>
              <LoadingButton
                isLoading={isDeleting}
                onPress={removeLoan}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>Delete Loan</Text>
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
                <Text style={styles.modalTitle}>Edit Loan</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Delete loan"
                  disabled={isSaving || isDeleting}
                  onPress={() => setIsDeleteConfirmationVisible(true)}
                  style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
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
              <Text style={styles.inputLabel}>Person</Text>
              <TextInput
                accessibilityLabel="Person name"
                autoCapitalize="words"
                maxLength={80}
                onChangeText={setPersonName}
                placeholder="Person's name"
                placeholderTextColor={Colors.neutral[50]}
                style={styles.input}
                value={personName}
              />
              <Text style={styles.inputLabel}>Amount</Text>
              <TextInput
                accessibilityLabel="Loan amount"
                keyboardType="number-pad"
                onChangeText={(value) => {
                  if (/^\d*$/.test(value)) setAmount(value);
                }}
                placeholder="0"
                placeholderTextColor={Colors.neutral[50]}
                style={styles.input}
                value={amount}
              />

              {/* Type */}
              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.optionRow}>
                <LoanOption
                  label="Lent"
                  selected={type === 'lent'}
                  onPress={() => setType('lent')}
                />
                <LoanOption
                  label="Borrowed"
                  selected={type === 'borrowed'}
                  onPress={() => setType('borrowed')}
                />
              </View>

              {/* Status */}
              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.optionRow}>
                <LoanOption
                  label="Active"
                  selected={status === 'active'}
                  onPress={() => {
                    setStatus('active');
                    setBalanceSource(null);
                    setIsBalanceModalVisible(loan?.status === 'paid');
                  }}
                />
                <LoanOption
                  label="Paid"
                  selected={status === 'paid'}
                  onPress={() => {
                    setStatus('paid');
                    setBalanceSource(null);
                    setIsBalanceModalVisible(loan?.status === 'active');
                  }}
                />
              </View>
              {balanceSource && (
                <Text style={styles.sourceDescription}>
                  Method: {balanceSource === 'bank' ? 'Bank' : 'Cash'}
                </Text>
              )}

              {/* Actions */}
              <LoadingButton
                disabled={isDeleting}
                isLoading={isSaving}
                onPress={saveLoan}
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
        </View>
      </BottomSheetModal>

      <BottomSheetModal
        visible={isBalanceModalVisible}
        onClose={closeBalanceSourceModal}
        size="compact"
      >
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>
            {draftBalanceDelta > 0 ? 'Restore loan' : 'Deduct loan'}
          </Text>
          <Text style={styles.sourceDescription}>
            {`Choose where to ${draftBalanceDelta > 0 ? 'restore' : 'deduct'} ${formatCurrency(String(Math.abs(draftBalanceDelta)))} ${draftBalanceDelta > 0 ? 'to' : 'from'}.`}
          </Text>
          {(['bank', 'cash'] as const).map((source) => {
            const restores = draftBalanceDelta > 0;
            return (
              <Pressable
                key={source}
                accessibilityRole="button"
                accessibilityLabel={`Select ${source} to ${restores ? 'restore' : 'deduct'}`}
                disabled={isAdjustingBalance}
                onPress={() => selectBalanceSource(source)}
                style={({ pressed }) => [
                  styles.sourceOption,
                  pressed && styles.pressed,
                  isAdjustingBalance && styles.disabled,
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
                {isAdjustingBalance ? (
                  <ActivityIndicator color={Colors.brand.plum} />
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={ms(20)}
                    color={Colors.neutral[60]}
                  />
                )}
              </Pressable>
            );
          })}
          <Pressable
            accessibilityRole="button"
            disabled={isAdjustingBalance}
            onPress={closeBalanceSourceModal}
            style={({ pressed }) => [
              styles.cancelOption,
              pressed && styles.pressed,
              isAdjustingBalance && styles.disabled,
            ]}
          >
            <Text style={styles.cancelOptionText}>Cancel</Text>
          </Pressable>
        </View>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text selectable style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function LoanOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.option, pressed && styles.pressed]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && (
          <View style={styles.radioDot} />
        )}
      </View>
      <Text style={styles.optionText}>{label}</Text>
    </Pressable>
  );
}

function LoanDetailsSkeleton(): React.JSX.Element {
  return (
    <>
      <Text style={styles.summaryHeading}>Summary</Text>
      <View style={styles.summaryCard}>
        <View style={styles.summaryContent}>
          <Skeleton width={ms(48)} height={ms(48)} style={styles.skeletonCircle} />
          <Skeleton width="48%" height={ms(20)} />
          <Skeleton width="62%" height={ms(28)} />
          <Skeleton width={ms(74)} height={ms(24)} style={styles.skeletonPill} />
        </View>
        <View style={styles.detailsSection}>
          {[0, 1, 2].map((index) => (
            <View key={index} style={styles.detailRow}>
              <Skeleton width="28%" height={ms(16)} />
              <Skeleton width="54%" height={ms(16)} />
            </View>
          ))}
        </View>
      </View>
    </>
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
    paddingBottom: vs(12),
  },
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
  detailsContent: {
    flex: 1,
    paddingTop: vs(24),
    paddingBottom: vs(32),
  },
  summaryHeading: {
    ...TextStyles.Medium16,
    color: Colors.neutral[70],
    marginBottom: vs(10),
  },
  summaryCard: {
    paddingVertical: vs(24),
    paddingHorizontal: s(16),
    marginBottom: vs(16),
  },
  summaryContent: {
    alignItems: 'center',
    gap: vs(12),
  },
  summaryIcon: {
    width: ms(48),
    height: ms(48),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(12),
    borderRadius: ms(24),
    backgroundColor: Colors.brand.orchid,
  },
  personName: {
    ...TextStyles.SemiBold18,
    color: Colors.brand.deepPlum,
    textAlign: 'center',
  },
  amount: {
    ...TextStyles.Bold24,
    color: Colors.brand.plum,
  },
  statusPill: {
    minHeight: vs(28),
    justifyContent: 'center',
    paddingHorizontal: s(12),
    borderRadius: ms(14),
    backgroundColor: Colors.brand.orchid,
  },
  paidStatus: {
    backgroundColor: Colors.brand.deepPlum,
  },
  statusText: {
    ...TextStyles.SemiBold12,
    color: Colors.neutral[10],
  },
  detailsSection: {
    gap: vs(32),
    marginTop: vs(48),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: s(12),
  },
  detailLabel: {
    ...TextStyles.Medium14,
    flex: 0.8,
    color: Colors.neutral[60],
  },
  detailValue: {
    ...TextStyles.Medium14,
    flex: 1.5,
    color: Colors.neutral[90],
    textAlign: 'right',
  },
  loadErrorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: vs(12),
  },
  retryContainer: {
    alignItems: 'center',
    gap: vs(8),
  },
  retryButton: {
    minHeight: vs(40),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(16),
    borderRadius: ms(10),
  },
  retryButtonText: {
    ...TextStyles.SemiBold14,
    color: Colors.brand.plum,
  },
  errorMessage: {
    ...TextStyles.Regular14,
    color: Colors.status.error,
    textAlign: 'center',
  },
  modalCard: {
    gap: vs(10),
    padding: s(20),
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
  cancelOptionText: {
    ...TextStyles.SemiBold14,
    color: Colors.neutral[70],
  },
  iconButton: {
    width: ms(40),
    height: ms(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    ...TextStyles.Medium14,
    color: Colors.neutral[80],
  },
  input: {
    minHeight: vs(46),
    paddingHorizontal: s(14),
    borderWidth: 1,
    borderColor: Colors.neutral[40],
    borderRadius: ms(10),
    color: Colors.neutral[100],
    ...TextStyles.Regular16,
  },
  optionRow: {
    flexDirection: 'row',
    gap: s(10),
  },
  option: {
    minHeight: vs(44),
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    paddingHorizontal: s(10),
  },
  radio: {
    width: ms(22),
    height: ms(22),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.neutral[50],
    borderRadius: ms(11),
  },
  radioSelected: {
    borderColor: Colors.brand.orchid,
    backgroundColor: Colors.brand.orchid,
  },
  radioDot: {
    width: ms(6),
    height: ms(6),
    borderRadius: ms(3),
    backgroundColor: Colors.neutral[10],
  },
  optionText: {
    ...TextStyles.Medium14,
    color: Colors.brand.deepPlum,
  },
  saveButton: {
    minHeight: vs(46),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(6),
    borderRadius: ms(12),
    backgroundColor: Colors.brand.plum,
  },
  saveButtonText: {
    ...TextStyles.SemiBold14,
    color: Colors.neutral[10],
  },
  deleteMessage: {
    ...TextStyles.Regular14,
    color: Colors.neutral[70],
    marginBottom: vs(8),
  },
  cancelButton: {
    minHeight: vs(44),
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
  deleteButton: {
    minHeight: vs(46),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ms(12),
    backgroundColor: Colors.brand.plum,
  },
  deleteButtonText: {
    ...TextStyles.SemiBold14,
    color: Colors.neutral[10],
  },
  disabled: {
    opacity: 0.6,
  },
  skeletonCircle: {
    borderRadius: ms(24),
  },
  skeletonPill: {
    borderRadius: ms(14),
  },
  pressed: {
    opacity: 0.72,
  },
});
