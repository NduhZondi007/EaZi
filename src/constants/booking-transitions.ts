import type { BookingStatus } from '@/types/database.types';

export const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['accepted', 'declined', 'cancelled'],
  accepted: ['arrived', 'cancelled'],
  arrived: ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed: ['reviewed'],
  reviewed: [],
  declined: [],
  cancelled: [],
};

export const CLIENT_CANCELLABLE: BookingStatus[] = [
  'pending',
  'confirmed',
];

export const PROVIDER_CANCELLABLE: BookingStatus[] = [
  'confirmed',
  'accepted',
];

export const ACTIVE_STATUSES: BookingStatus[] = [
  'pending',
  'confirmed',
  'accepted',
  'arrived',
  'in_progress',
];

export const TERMINAL_STATUSES: BookingStatus[] = [
  'completed',
  'cancelled',
  'declined',
  'reviewed',
];
