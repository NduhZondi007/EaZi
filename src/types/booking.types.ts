import type { BookingFor, BookingStatus } from './database.types';
import type { UserRow, ServiceRow, BookingRow } from './database.types';

export interface StatusHistoryEntry {
  status: BookingStatus;
  timestamp: string;
  note?: string;
}

export type BookingServiceSummary = Pick<
  ServiceRow,
  'id' | 'title' | 'business_name' | 'gallery' | 'base_price' | 'service_type'
>;

export type BookingUserSummary = Pick<
  UserRow,
  'id' | 'name' | 'profile_image_url'
>;

export type BookingWithDetails = Omit<BookingRow, 'status_history'> & {
  service: BookingServiceSummary;
  provider: BookingUserSummary;
  client: BookingUserSummary;
  status_history: StatusHistoryEntry[];
};

export interface CreateBookingInput {
  client_id: string;
  provider_id: string;
  service_id: string;
  service_address: string;
  date: string;
  time: string;
  amount: number;
  booking_for?: BookingFor;
  recipient_name?: string | null;
  recipient_phone?: string | null;
  estimated_duration?: number | null;
}
