import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Skeleton } from './Skeleton';
import { Colors } from '../utils/Colors';
import { ms, s, vs } from '../utils/Responsive';
import { TextStyles } from '../utils/TextStyles';

type SummarySkeletonWidth = number | `${number}%`;

interface SummaryCardProps {
  children: React.ReactNode;
}

interface SummaryItemProps {
  label: string;
  value: string;
  isLoading?: boolean;
  skeletonWidth?: SummarySkeletonWidth;
}

export function SummaryCard({ children }: SummaryCardProps): React.JSX.Element {
  return (
    <View>
      <Text style={styles.heading}>Summary</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

export function SummaryItem({
  label,
  value,
  isLoading = false,
  skeletonWidth = '84%',
}: SummaryItemProps): React.JSX.Element {
  return (
    <View style={styles.item}>
      <Text style={styles.label}>{label}</Text>
      {isLoading ? (
        <Skeleton
          width={skeletonWidth}
          height={ms(16)}
          style={styles.skeleton}
        />
      ) : (
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={styles.value}
        >
          {value}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    ...TextStyles.Medium16,
    color: Colors.neutral[70],
    marginBottom: vs(10),
  },
  card: {
    padding: s(16),
    paddingBottom: s(2),
    marginBottom: vs(16),
    borderRadius: ms(16),
    borderWidth: 1,
    borderColor: Colors.neutral[30],
    backgroundColor: Colors.neutral[10],
  },
  item: {
    flex: 1,
  },
  label: {
    ...TextStyles.Regular12,
    color: Colors.neutral[60],
  },
  value: {
    ...TextStyles.SemiBold14,
    color: Colors.brand.deepPlum,
    marginTop: vs(4),
  },
  skeleton: {
    marginTop: vs(4),
    borderRadius: ms(6),
  },
});
