import { Text, View } from 'react-native';
import { format } from 'date-fns';
import { Colors } from '@/constants/colors';
import type { BookingStatus } from '@/types/database.types';
import type { StatusHistoryEntry } from '@/types/booking.types';

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Booking Created',
  confirmed: 'Payment Confirmed',
  accepted: 'Provider Accepted',
  declined: 'Provider Declined',
  arrived: 'Provider Arrived',
  in_progress: 'Service In Progress',
  completed: 'Service Completed',
  cancelled: 'Booking Cancelled',
  reviewed: 'Review Submitted',
};

interface Props {
  history: StatusHistoryEntry[];
}

export function BookingTimeline({ history }: Props) {
  if (history.length === 0) return null;

  return (
    <View>
      {history.map((entry, index) => {
        const color = Colors.status[entry.status];
        const isLast = index === history.length - 1;

        return (
          <View key={`${entry.status}-${index}`} style={{ flexDirection: 'row' }}>
            <View style={{ width: 24, marginRight: 12, alignItems: 'center' }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: color,
                  marginTop: 3,
                }}
              />
              {!isLast && (
                <View
                  style={{
                    width: 2,
                    flex: 1,
                    backgroundColor: Colors.gray200,
                    marginTop: 4,
                    minHeight: 20,
                  }}
                />
              )}
            </View>

            <View style={{ flex: 1, paddingBottom: isLast ? 0 : 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.gray800 }}>
                {STATUS_LABELS[entry.status]}
              </Text>
              {entry.note ? (
                <Text style={{ fontSize: 12, color: Colors.gray500, marginTop: 2 }}>
                  {entry.note}
                </Text>
              ) : null}
              <Text style={{ fontSize: 12, color: Colors.gray400, marginTop: 2 }}>
                {format(new Date(entry.timestamp), 'MMM d, yyyy • h:mm a')}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
