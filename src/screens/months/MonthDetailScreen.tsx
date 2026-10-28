import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import { Ionicons } from '@expo/vector-icons';
import type { MonthsScreenProps } from '../../navigation/MonthsStack';

// API
import {
  deleteSpend,
  getSpend,
  getSpends,
  updateSpend,
} from '../../api/adapters/spends.adapter';
import type { Spend } from '../../api/adapters/spends.adapter';
import { deductMonth } from '../../api/adapters/months.adapter';

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
import { showErrorToast, showSuccessToast } from '../../utils/toast';

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

const getSpendSnapshot = (spends: Spend[]): string =>
  spends
    .map((spend) =>
      `${spend.id}:${spend.title}:${spend.amount}:${spend.isCompleted}:${spend.hasSubpage}`,
    )
    .sort()
    .join('|');

export default function MonthDetailScreen({
  navigation,
  route,
}: MonthDetailScreenProps): React.JSX.Element {
  const { month } = route.params;
  const [spends, setSpends] = useState<Spend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [selectedSpend, setSelectedSpend] = useState<Spend | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSpendLoading, setIsSpendLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeducting, setIsDeducting] = useState(false);
  const [isDeductModalVisible, setIsDeductModalVisible] = useState(false);
  const [spendsNeedDeduction, setSpendsNeedDeduction] = useState(false);
  const spendSnapshot = useRef<string | null>(null);

  const loadSpends = useCallback(async (showLoading: boolean): Promise<void> => {
    if (showLoading) setIsLoading(true);
    try {
      const nextSpends = await getSpends(month.id);
      const nextSnapshot = getSpendSnapshot(nextSpends);
      if (spendSnapshot.current !== null && spendSnapshot.current !== nextSnapshot) {
        setSpendsNeedDeduction(true);
      }
      spendSnapshot.current = nextSnapshot;
      setSpends(nextSpends);
      setLoadError(false);
    } catch (error) {
      setLoadError(true);
      showErrorToast(getApiErrorMessage(error, 'Unable to load spends. Please try again.'));
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [month.id]);

  useFocusEffect(
    useCallback(() => {
      void loadSpends(true);
    }, [loadSpends]),
  );

  const refreshSpends = async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      await loadSpends(false);
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
      const updatedSpend = await updateSpend(selectedSpend.id, {
        title: trimmedTitle,
        amount: parsedAmount.toFixed(2),
        is_completed: isCompleted,
      });
      const nextSpends = spends.map((item) =>
        item.id === updatedSpend.id ? updatedSpend : item,
      );
      setSpends(nextSpends);
      spendSnapshot.current = getSpendSnapshot(nextSpends);
      setSpendsNeedDeduction(true);
      setIsEditModalVisible(false);
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
      spendSnapshot.current = getSpendSnapshot(nextSpends);
      setSpendsNeedDeduction(true);
      setIsEditModalVisible(false);
      showSuccessToast('Spend deleted.');
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, 'Unable to delete this spend.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDeleteSpend = (): void => {
    Alert.alert('Delete spend?', 'This spend will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void removeSpend() },
    ]);
  };

  const handleDeduct = async (source: 'cash' | 'bank'): Promise<void> => {
    setIsDeductModalVisible(false);
    setIsDeducting(true);
    try {
      await deductMonth(month.id, source);
      spendSnapshot.current = getSpendSnapshot(spends);
      setSpendsNeedDeduction(false);
      showSuccessToast(`Month deducted from ${source}.`);
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, 'Unable to deduct this month.'));
    } finally {
      setIsDeducting(false);
    }
  };

  const toggleCompleted = async (spend: Spend): Promise<void> => {
    try {
      const updatedSpend = await updateSpend(spend.id, {
        title: spend.title,
        amount: spend.amount,
        is_completed: !spend.isCompleted,
      });
      const nextSpends = spends.map((item) =>
        item.id === spend.id ? updatedSpend : item,
      );
      setSpends(nextSpends);
      spendSnapshot.current = getSpendSnapshot(nextSpends);
      setSpendsNeedDeduction(true);
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, 'Unable to update spend status.'));
    }
  };

  const renderSpend = ({ item }: { item: Spend }): React.JSX.Element => (
    <View style={styles.spendCard}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={`${item.title}, ${item.isCompleted ? 'completed' : 'not completed'}`}
        accessibilityState={{ checked: item.isCompleted }}
        onPress={() => void toggleCompleted(item)}
        style={styles.checkButton}
      >
        <Ionicons
          name={item.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
          size={ms(24)}
          color={item.isCompleted ? Colors.brand.teal : Colors.neutral[50]}
        />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit ${item.title}, ${formatCurrency(Number(item.amount))}`}
        onPress={() => void openSpendEditor(item)}
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
          accessibilityLabel={`Open subspends for ${item.title}`}
          onPress={() => navigation.navigate('SubPage', {
            monthId: month.id,
            subId: item.id,
          })}
          style={styles.arrowButton}
        >
          <Ionicons name="chevron-forward" size={ms(22)} color={Colors.neutral[70]} />
        </Pressable>
      )}
    </View>
  );

  return (
    <SafeAreaView style={screenStyles.container}>
      {/* Header */}
      <Header
        title={`${month.title} ${month.year}`}
        back
        onBackPress={() => navigation.goBack()}
        titleColor={Colors.brand.deepPlum}
      />

      {/* Spends */}
      <FlatList
        data={isLoading ? [] : spends}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderSpend}
        contentContainerStyle={styles.listContent}
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
          <View style={styles.summaryCard}>
            <View style={styles.summaryAmounts}>
              <SummaryItem label="Total" value={month.total} />
              <SummaryItem label="Spent" value={month.spent} />
              <SummaryItem label="To spend" value={month.toSpend} />
            </View>
            {spendsNeedDeduction && (
              <View accessibilityRole="alert" style={styles.deductionWarning}>
                <Ionicons
                  name="warning-outline"
                  size={ms(15)}
                  color={Colors.brand.orchid}
                />
                <Text style={styles.deductionWarningText}>
                  Spend changed. Deduct again to update your money.
                </Text>
              </View>
            )}
            <LoadingButton
              isLoading={isDeducting}
              onPress={() => setIsDeductModalVisible(true)}
              style={styles.deductButton}
            >
              <Text style={styles.deductButtonText}>Deduct</Text>
            </LoadingButton>
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

      {/* Deduction Source Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={isDeductModalVisible}
        onRequestClose={() => setIsDeductModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            accessibilityLabel="Close deduction source selector"
            onPress={() => setIsDeductModalVisible(false)}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select source</Text>
            <Text style={styles.sourceDescription}>
              Choose where to deduct this month's amount from.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Deduct from bank"
              disabled={isDeducting}
              onPress={() => void handleDeduct('bank')}
              style={({ pressed }) => [styles.sourceOption, pressed && styles.pressed]}
            >
              <Ionicons name="business-outline" size={ms(22)} color={Colors.brand.plum} />
              <Text style={styles.sourceOptionText}>Bank</Text>
              <Ionicons name="chevron-forward" size={ms(20)} color={Colors.neutral[60]} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Deduct from cash"
              disabled={isDeducting}
              onPress={() => void handleDeduct('cash')}
              style={({ pressed }) => [styles.sourceOption, pressed && styles.pressed]}
            >
              <Ionicons name="cash-outline" size={ms(22)} color={Colors.brand.plum} />
              <Text style={styles.sourceOptionText}>Cash</Text>
              <Ionicons name="chevron-forward" size={ms(20)} color={Colors.neutral[60]} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsDeductModalVisible(false)}
              style={({ pressed }) => [styles.cancelOption, pressed && styles.pressed]}
            >
              <Text style={styles.cancelOptionText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Edit Spend Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={isEditModalVisible}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <Pressable
            accessibilityLabel="Close spend editor"
            onPress={() => setIsEditModalVisible(false)}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Update spend</Text>
            {isSpendLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator color={Colors.brand.plum} />
                <Text style={styles.modalLoadingText}>Loading spend...</Text>
              </View>
            ) : (
              <>
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
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={Colors.neutral[60]}
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
                <View style={styles.completedRow}>
                  <Text style={styles.inputLabel}>Completed</Text>
                  <Switch
                    accessibilityLabel="Completed"
                    value={isCompleted}
                    onValueChange={setIsCompleted}
                    trackColor={{ false: Colors.neutral[40], true: Colors.brand.teal }}
                    thumbColor={Colors.neutral[10]}
                  />
                </View>
                <LoadingButton
                  isLoading={isSaving}
                  onPress={() => void saveSpend()}
                  style={styles.saveButton}
                >
                  <Text style={styles.saveButtonText}>Save changes</Text>
                </LoadingButton>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    if (!selectedSpend) return;
                    setIsEditModalVisible(false);
                    navigation.navigate('SubSpendCreate', {
                      monthId: month.id,
                      subId: selectedSpend.id,
                    });
                  }}
                  style={({ pressed }) => [
                    styles.modalAction,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons name="add-circle-outline" size={ms(20)} color={Colors.brand.plum} />
                  <Text style={styles.modalActionText}>Add Subspends</Text>
                </Pressable>
                <LoadingButton
                  isLoading={isDeleting}
                  onPress={confirmDeleteSpend}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </LoadingButton>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  listContent: {
    flexGrow: 1,
    paddingTop: vs(20),
    paddingBottom: vs(100),
  },
  summaryCard: {
    padding: s(16),
    marginBottom: vs(20),
    borderRadius: ms(16),
    borderWidth: 1,
    borderColor: Colors.neutral[30],
    backgroundColor: Colors.neutral[10],
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
  deductButton: {
    minHeight: vs(44),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(16),
    borderRadius: ms(12),
    backgroundColor: Colors.brand.plum,
  },
  deductButtonText: {
    ...TextStyles.SemiBold14,
    color: Colors.neutral[10],
  },
  deductionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
    marginBottom: vs(12),
  },
  deductionWarningText: {
    ...TextStyles.Regular12,
    flex: 1,
    color: Colors.brand.orchid,
  },
  listSeparator: {
    height: vs(10),
  },
  spendCard: {
    minHeight: vs(70),
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    paddingHorizontal: s(14),
    paddingVertical: vs(12),
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
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: s(24),
    backgroundColor: 'rgba(23, 23, 23, 0.48)',
  },
  modalCard: {
    padding: s(20),
    borderRadius: ms(18),
    backgroundColor: Colors.neutral[10],
    gap: vs(10),
  },
  modalTitle: {
    ...TextStyles.SemiBold20,
    color: Colors.brand.deepPlum,
    marginBottom: vs(4),
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
  deleteButton: {
    minHeight: vs(44),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.status.error,
    borderRadius: ms(12),
  },
  deleteButtonText: {
    ...TextStyles.SemiBold14,
    color: Colors.status.error,
  },
  pressed: {
    opacity: 0.72,
  },
});
