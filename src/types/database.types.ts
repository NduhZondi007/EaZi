export type UserRole = 'client' | 'provider' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'pending_verification';
export type GenderType = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'accepted'
  | 'declined'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'reviewed';
export type BookingFor = 'self' | 'other';
export type PaymentMethod = 'card' | 'wallet' | 'eazi_cash';
export type TransactionType =
  | 'booking_payment'
  | 'wallet_topup'
  | 'withdrawal'
  | 'refund'
  | 'eazi_cash_redemption';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type MessageStatus = 'sent' | 'delivered' | 'read';
export type NotificationType =
  | 'booking'
  | 'payment'
  | 'chat'
  | 'promotion'
  | 'verification'
  | 'general';
export type DocumentType =
  | 'government_id'
  | 'proof_of_residence'
  | 'police_clearance'
  | 'drivers_license';
export type DocumentStatus = 'pending' | 'approved' | 'rejected';
export type QueryCategory =
  | 'booking'
  | 'payment'
  | 'account'
  | 'provider'
  | 'technical'
  | 'other';
export type QueryPriority = 'low' | 'medium' | 'high' | 'urgent';
export type QueryStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TripStatus = 'pending' | 'en_route' | 'arrived' | 'completed';
export type EmergencySeverity = 'low' | 'medium' | 'high' | 'critical';
export type EmergencyStatus = 'reported' | 'acknowledged' | 'resolved';
export type CancelledByType = 'client' | 'provider' | 'admin' | 'system';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: UserRole;
          status: UserStatus;
          profile_image_url: string | null;
          phone: string | null;
          is_verified: boolean;
          bio: string | null;
          gender: GenderType | null;
          date_of_birth: string | null;
          address: string | null;
          home_address: string | null;
          office_address: string | null;
          latitude: number | null;
          longitude: number | null;
          push_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          role?: UserRole;
          status?: UserStatus;
          profile_image_url?: string | null;
          phone?: string | null;
          is_verified?: boolean;
          bio?: string | null;
          gender?: GenderType | null;
          date_of_birth?: string | null;
          address?: string | null;
          home_address?: string | null;
          office_address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          push_token?: string | null;
        };
        Update: {
          name?: string;
          status?: UserStatus;
          profile_image_url?: string | null;
          phone?: string | null;
          is_verified?: boolean;
          bio?: string | null;
          gender?: GenderType | null;
          date_of_birth?: string | null;
          address?: string | null;
          home_address?: string | null;
          office_address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          push_token?: string | null;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          provider_id: string;
          business_name: string;
          title: string;
          description: string;
          service_type: string;
          operating_hours: Record<string, unknown>;
          is_available: boolean;
          base_price: number;
          gallery: string[];
          social_links: Record<string, string>;
          avg_rating: number;
          review_count: number;
          is_featured: boolean;
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          provider_id: string;
          business_name: string;
          title: string;
          description: string;
          service_type: string;
          operating_hours?: Record<string, unknown>;
          is_available?: boolean;
          base_price: number;
          gallery?: string[];
          social_links?: Record<string, string>;
        };
        Update: {
          business_name?: string;
          title?: string;
          description?: string;
          service_type?: string;
          operating_hours?: Record<string, unknown>;
          is_available?: boolean;
          base_price?: number;
          gallery?: string[];
          social_links?: Record<string, string>;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          client_id: string;
          provider_id: string;
          service_id: string;
          booking_for: BookingFor;
          recipient_name: string | null;
          recipient_phone: string | null;
          service_address: string;
          date: string;
          time: string;
          estimated_duration: number | null;
          is_quick_booking: boolean;
          status: BookingStatus;
          status_history: unknown[];
          amount: number;
          tip_amount: number;
          payment_method: PaymentMethod | null;
          is_reviewed: boolean;
          review_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          client_id: string;
          provider_id: string;
          service_id: string;
          booking_for?: BookingFor;
          recipient_name?: string | null;
          recipient_phone?: string | null;
          service_address: string;
          date: string;
          time: string;
          estimated_duration?: number | null;
          is_quick_booking?: boolean;
          amount: number;
          payment_method?: PaymentMethod | null;
        };
        Update: {
          status?: BookingStatus;
          status_history?: unknown[];
          tip_amount?: number;
          payment_method?: PaymentMethod;
          is_reviewed?: boolean;
          review_id?: string | null;
        };
        Relationships: [];
      };
      wallets: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          eazi_cash_balance: number;
          total_earnings: number;
          pending_earnings: number;
          failed_attempts: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          balance?: number;
          eazi_cash_balance?: number;
        };
        Update: {
          balance?: number;
          eazi_cash_balance?: number;
          total_earnings?: number;
          pending_earnings?: number;
          failed_attempts?: number;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          role: UserRole;
          title: string;
          message: string;
          type: NotificationType;
          read: boolean;
          delivered: boolean;
          data: Record<string, unknown>;
          read_at: string | null;
        };
        Insert: {
          user_id: string;
          role: UserRole;
          title: string;
          message: string;
          type: NotificationType;
          data?: Record<string, unknown>;
        };
        Update: {
          read?: boolean;
          delivered?: boolean;
          read_at?: string | null;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          booking_id: string;
          service_id: string;
          user_id: string;
          rating: number;
          comment: string;
          tipped: boolean;
        };
        Insert: {
          booking_id: string;
          service_id: string;
          user_id: string;
          rating: number;
          comment: string;
          tipped?: boolean;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      provider_documents: {
        Row: {
          id: string;
          provider_id: string;
          document_type: DocumentType;
          file_url: string;
          file_name: string;
          status: DocumentStatus;
          submitted_at: string;
          reviewed_at: string | null;
          reviewed_by_admin_id: string | null;
          rejection_reason: string | null;
        };
        Insert: {
          provider_id: string;
          document_type: DocumentType;
          file_url: string;
          file_name: string;
        };
        Update: {
          status?: DocumentStatus;
          reviewed_at?: string;
          reviewed_by_admin_id?: string;
          rejection_reason?: string;
        };
        Relationships: [];
      };
      queries: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          description: string;
          category: QueryCategory;
          priority: QueryPriority;
          status: QueryStatus;
          assigned_to: string | null;
          resolution: string | null;
          messages: unknown[];
        };
        Insert: {
          user_id: string;
          subject: string;
          description: string;
          category: QueryCategory;
          priority?: QueryPriority;
        };
        Update: {
          status?: QueryStatus;
          assigned_to?: string | null;
          resolution?: string;
          priority?: QueryPriority;
          messages?: unknown[];
        };
        Relationships: [];
      };
      chat_rooms: {
        Row: {
          id: string;
          participant_a_id: string;
          participant_b_id: string;
          is_admin_chat: boolean;
          booking_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          participant_a_id: string;
          participant_b_id: string;
          is_admin_chat?: boolean;
          booking_id?: string | null;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          chat_room_id: string;
          sender_id: string;
          content: string;
          status: MessageStatus;
          created_at: string;
        };
        Insert: {
          chat_room_id: string;
          sender_id: string;
          content: string;
        };
        Update: {
          status?: MessageStatus;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          wallet_id: string;
          type: TransactionType;
          amount: number;
          currency: string;
          method: PaymentMethod | null;
          status: TransactionStatus;
          booking_id: string | null;
          service_id: string | null;
          card_id: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      cards: {
        Row: {
          id: string;
          user_id: string;
          card_token: string;
          last4: string;
          brand: string;
          exp_month: number;
          exp_year: number;
          is_default: boolean;
        };
        Insert: {
          user_id: string;
          card_token: string;
          last4: string;
          brand: string;
          exp_month: number;
          exp_year: number;
          is_default?: boolean;
        };
        Update: {
          is_default?: boolean;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_admin_dashboard_stats: {
        Args: Record<string, never>;
        Returns: {
          total_users: number;
          total_providers: number;
          bookings_this_month: number;
          revenue_this_month: number;
        };
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      user_status: UserStatus;
      gender_type: GenderType;
      booking_status: BookingStatus;
      booking_for: BookingFor;
      payment_method: PaymentMethod;
      transaction_type: TransactionType;
      transaction_status: TransactionStatus;
      message_status: MessageStatus;
      notification_type: NotificationType;
      document_type: DocumentType;
      document_status: DocumentStatus;
      query_category: QueryCategory;
      query_priority: QueryPriority;
      query_status: QueryStatus;
      trip_status: TripStatus;
      emergency_severity: EmergencySeverity;
      emergency_status: EmergencyStatus;
      cancelled_by_type: CancelledByType;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type UserRow = Database['public']['Tables']['users']['Row'];
export type ServiceRow = Database['public']['Tables']['services']['Row'];
export type BookingRow = Database['public']['Tables']['bookings']['Row'];
export type WalletRow = Database['public']['Tables']['wallets']['Row'];
export type NotificationRow = Database['public']['Tables']['notifications']['Row'];
export type ReviewRow = Database['public']['Tables']['reviews']['Row'];
export type ProviderDocumentRow = Database['public']['Tables']['provider_documents']['Row'];
export type QueryRow = Database['public']['Tables']['queries']['Row'];
export type ChatRoomRow = Database['public']['Tables']['chat_rooms']['Row'];
export type MessageRow = Database['public']['Tables']['messages']['Row'];
export type TransactionRow = Database['public']['Tables']['transactions']['Row'];
export type CardRow = Database['public']['Tables']['cards']['Row'];
