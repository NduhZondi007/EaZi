import { Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import type { BookingStatus } from '@/types/database.types';

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  accepted: 'Accepted',
  declined: 'Declined',
  arrived: 'Arrived',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  reviewed: 'Reviewed',
};

interface Props {
  status: BookingStatus;
  size?: 'sm' | 'md';
}

export function BookingStatusBadge({ status, size = 'md' }: Props) {
  const color = Colors.status[status];
  const label = STATUS_LABELS[status];

  return (
    <View
      style={{
        backgroundColor: `${color}22`,
        borderRadius: 9999,
        paddingHorizontal: size === 'sm' ? 8 : 12,
        paddingVertical: size === 'sm' ? 2 : 4,
      }}
    >
      <Text
        style={{
          color,
          fontSize: size === 'sm' ? 10 : 12,
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
    </View>
  );
}
