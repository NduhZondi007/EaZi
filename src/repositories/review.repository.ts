import { supabase } from '@/lib/supabase';
import type { ReviewRow } from '@/types/database.types';

export interface CreateReviewInput {
  bookingId: string;
  serviceId: string;
  userId: string;
  rating: number;
  comment: string;
}

export interface IReviewRepository {
  create(input: CreateReviewInput): Promise<ReviewRow>;
  findByServiceId(serviceId: string, limit?: number): Promise<ReviewRow[]>;
  findByBookingId(bookingId: string): Promise<ReviewRow | null>;
  markBookingReviewed(bookingId: string, reviewId: string): Promise<void>;
}

export class ReviewRepository implements IReviewRepository {
  async create(input: CreateReviewInput): Promise<ReviewRow> {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        booking_id: input.bookingId,
        service_id: input.serviceId,
        user_id: input.userId,
        rating: input.rating,
        comment: input.comment,
      })
      .select()
      .single();

    if (error) throw new Error(`ReviewRepository.create: ${error.message}`);

    const review = data as ReviewRow;
    await this.markBookingReviewed(input.bookingId, review.id);
    return review;
  }

  async findByServiceId(serviceId: string, limit = 20): Promise<ReviewRow[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('service_id', serviceId)
      .order('id', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`ReviewRepository.findByServiceId: ${error.message}`);
    return (data ?? []) as ReviewRow[];
  }

  async findByBookingId(bookingId: string): Promise<ReviewRow | null> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('booking_id', bookingId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`ReviewRepository.findByBookingId: ${error.message}`);
    }
    return data as ReviewRow;
  }

  async markBookingReviewed(bookingId: string, reviewId: string): Promise<void> {
    const { error } = await supabase
      .from('bookings')
      .update({ is_reviewed: true, review_id: reviewId })
      .eq('id', bookingId);

    if (error) throw new Error(`ReviewRepository.markBookingReviewed: ${error.message}`);
  }
}

export const reviewRepository = new ReviewRepository();
