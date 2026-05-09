import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { bookingStateMachine } from '@/services/booking-state-machine';
import type { BookingRow, BookingStatus } from '@/types/database.types';
import type {
  BookingServiceSummary,
  BookingUserSummary,
  BookingWithDetails,
  CreateBookingInput,
  StatusHistoryEntry,
} from '@/types/booking.types';
import type { ProviderStats } from '@/types/service.types';

export interface IBookingRepository {
  findById(id: string): Promise<BookingWithDetails | null>;
  findByClient(clientId: string): Promise<BookingWithDetails[]>;
  findByProvider(providerId: string): Promise<BookingWithDetails[]>;
  findPendingByProvider(providerId: string): Promise<BookingWithDetails[]>;
  findTodayByProvider(providerId: string): Promise<BookingWithDetails[]>;
  create(input: CreateBookingInput): Promise<BookingRow>;
  updateStatus(
    id: string,
    currentStatus: BookingStatus,
    newStatus: BookingStatus,
    note?: string,
  ): Promise<BookingRow>;
  cancel(id: string, currentStatus: BookingStatus): Promise<BookingRow>;
  acceptBooking(id: string, currentStatus: BookingStatus): Promise<BookingRow>;
  declineBooking(id: string, currentStatus: BookingStatus): Promise<BookingRow>;
  getProviderStats(providerId: string): Promise<ProviderStats>;
}

export class BookingRepository implements IBookingRepository {
  private async attachDetails(bookings: BookingRow[]): Promise<BookingWithDetails[]> {
    if (bookings.length === 0) return [];

    const serviceIds = [...new Set(bookings.map((b) => b.service_id))];
    const providerIds = [...new Set(bookings.map((b) => b.provider_id))];
    const clientIds = [...new Set(bookings.map((b) => b.client_id))];
    const allUserIds = [...new Set([...providerIds, ...clientIds])];

    const [servicesResult, usersResult] = await Promise.all([
      supabase
        .from('services')
        .select('id, title, business_name, gallery, base_price, service_type')
        .in('id', serviceIds),
      supabase
        .from('users')
        .select('id, name, profile_image_url')
        .in('id', allUserIds),
    ]);

    if (servicesResult.error) {
      throw new Error(`BookingRepository.attachDetails services: ${servicesResult.error.message}`);
    }
    if (usersResult.error) {
      throw new Error(`BookingRepository.attachDetails users: ${usersResult.error.message}`);
    }

    const serviceMap = new Map<string, BookingServiceSummary>(
      (servicesResult.data ?? []).map((s) => [s.id, s as BookingServiceSummary]),
    );
    const userMap = new Map<string, BookingUserSummary>(
      (usersResult.data ?? []).map((u) => [u.id, u as BookingUserSummary]),
    );

    return bookings.map((booking) => ({
      ...booking,
      status_history: (booking.status_history as StatusHistoryEntry[]) ?? [],
      service: serviceMap.get(booking.service_id) ?? {
        id: booking.service_id,
        title: 'Unknown Service',
        business_name: 'Unknown Business',
        gallery: [],
        base_price: booking.amount,
        service_type: '',
      },
      provider: userMap.get(booking.provider_id) ?? {
        id: booking.provider_id,
        name: 'Unknown Provider',
        profile_image_url: null,
      },
      client: userMap.get(booking.client_id) ?? {
        id: booking.client_id,
        name: 'Unknown Client',
        profile_image_url: null,
      },
    }));
  }

  async findById(id: string): Promise<BookingWithDetails | null> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`BookingRepository.findById: ${error.message}`);
    }

    const results = await this.attachDetails([data as BookingRow]);
    return results[0] ?? null;
  }

  async findByClient(clientId: string): Promise<BookingWithDetails[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`BookingRepository.findByClient: ${error.message}`);
    return this.attachDetails((data ?? []) as BookingRow[]);
  }

  async findByProvider(providerId: string): Promise<BookingWithDetails[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`BookingRepository.findByProvider: ${error.message}`);
    return this.attachDetails((data ?? []) as BookingRow[]);
  }

  async findPendingByProvider(providerId: string): Promise<BookingWithDetails[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('provider_id', providerId)
      .eq('status', 'confirmed')
      .order('date', { ascending: true });

    if (error) throw new Error(`BookingRepository.findPendingByProvider: ${error.message}`);
    return this.attachDetails((data ?? []) as BookingRow[]);
  }

  async findTodayByProvider(providerId: string): Promise<BookingWithDetails[]> {
    const today = format(new Date(), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('provider_id', providerId)
      .eq('date', today)
      .not('status', 'in', '(declined,cancelled)')
      .order('time', { ascending: true });

    if (error) throw new Error(`BookingRepository.findTodayByProvider: ${error.message}`);
    return this.attachDetails((data ?? []) as BookingRow[]);
  }

  async create(input: CreateBookingInput): Promise<BookingRow> {
    const initialEntry: StatusHistoryEntry = {
      status: 'pending',
      timestamp: new Date().toISOString(),
      note: 'Booking created',
    };

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        ...input,
        status: 'pending',
        status_history: [initialEntry],
      })
      .select()
      .single();

    if (error) throw new Error(`BookingRepository.create: ${error.message}`);
    return data as BookingRow;
  }

  async updateStatus(
    id: string,
    currentStatus: BookingStatus,
    newStatus: BookingStatus,
    note?: string,
  ): Promise<BookingRow> {
    bookingStateMachine.transition(currentStatus, newStatus);

    const { data: existing, error: fetchError } = await supabase
      .from('bookings')
      .select('status_history')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(`BookingRepository.updateStatus fetch: ${fetchError.message}`);
    }

    const history = ((existing?.status_history as StatusHistoryEntry[]) ?? []);
    const newEntry: StatusHistoryEntry = {
      status: newStatus,
      timestamp: new Date().toISOString(),
      ...(note ? { note } : {}),
    };

    const { data, error } = await supabase
      .from('bookings')
      .update({
        status: newStatus,
        status_history: [...history, newEntry],
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`BookingRepository.updateStatus: ${error.message}`);
    return data as BookingRow;
  }

  async cancel(id: string, currentStatus: BookingStatus): Promise<BookingRow> {
    return this.updateStatus(id, currentStatus, 'cancelled', 'Cancelled by client');
  }

  async acceptBooking(id: string, currentStatus: BookingStatus): Promise<BookingRow> {
    return this.updateStatus(id, currentStatus, 'accepted', 'Provider accepted the booking');
  }

  async declineBooking(id: string, currentStatus: BookingStatus): Promise<BookingRow> {
    return this.updateStatus(id, currentStatus, 'declined', 'Provider declined the booking');
  }

  async getProviderStats(providerId: string): Promise<ProviderStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const today = format(now, 'yyyy-MM-dd');

    const [
      monthlyResult,
      pendingResult,
      todayResult,
      totalResult,
      completedResult,
      servicesResult,
    ] = await Promise.all([
      supabase
        .from('bookings')
        .select('amount')
        .eq('provider_id', providerId)
        .eq('status', 'completed')
        .gte('created_at', startOfMonth),
      supabase
        .from('bookings')
        .select('amount')
        .eq('provider_id', providerId)
        .in('status', ['confirmed', 'accepted']),
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('provider_id', providerId)
        .eq('date', today),
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('provider_id', providerId)
        .not('status', 'in', '(pending,declined,cancelled)'),
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('provider_id', providerId)
        .in('status', ['completed', 'reviewed']),
      supabase
        .from('services')
        .select('avg_rating, review_count')
        .eq('provider_id', providerId),
    ]);

    const monthlyEarnings = (monthlyResult.data ?? []).reduce(
      (sum, b) => sum + (b.amount as number),
      0,
    );
    const pendingEarnings = (pendingResult.data ?? []).reduce(
      (sum, b) => sum + (b.amount as number),
      0,
    );
    const bookingsToday = todayResult.count ?? 0;
    const total = totalResult.count ?? 0;
    const completed = completedResult.count ?? 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const services = servicesResult.data ?? [];
    const totalReviews = services.reduce((sum, s) => sum + (s.review_count as number), 0);
    const weightedSum = services.reduce(
      (sum, s) => sum + (s.avg_rating as number) * (s.review_count as number),
      0,
    );
    const avgRating =
      totalReviews > 0 ? Math.round((weightedSum / totalReviews) * 10) / 10 : 0;

    return {
      monthlyEarnings,
      pendingEarnings,
      availableBalance: 0,
      bookingsToday,
      completionRate,
      avgRating,
    };
  }
}

export const bookingRepository = new BookingRepository();
