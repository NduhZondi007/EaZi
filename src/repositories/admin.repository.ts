import { supabase } from '@/lib/supabase';
import type {
  UserRow,
  ProviderDocumentRow,
  QueryRow,
  QueryStatus,
  QueryPriority,
  UserRole,
  UserStatus,
  DocumentStatus,
} from '@/types/database.types';

export interface AdminDashboardStats {
  total_users: number;
  total_providers: number;
  bookings_this_month: number;
  revenue_this_month: number;
}

export interface ProviderVerification {
  user: UserRow;
  documents: ProviderDocumentRow[];
}

export interface QueryWithUser extends QueryRow {
  user: Pick<UserRow, 'id' | 'name' | 'email' | 'profile_image_url'>;
}

export interface QueryMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

export interface AdminAnalytics {
  monthlyRevenue: { month: string; revenue: number }[];
  userGrowth: { month: string; count: number }[];
  bookingsByStatus: { status: string; count: number }[];
  topServices: { title: string; business_name: string; bookingCount: number; revenue: number }[];
}

export interface IAdminRepository {
  getDashboardStats(): Promise<AdminDashboardStats>;
  listUsers(filters?: { role?: UserRole; status?: UserStatus; search?: string }): Promise<UserRow[]>;
  getUserDetail(userId: string): Promise<UserRow | null>;
  updateUserStatus(userId: string, status: UserStatus): Promise<UserRow>;
  listPendingVerifications(): Promise<ProviderVerification[]>;
  getVerificationDetail(providerId: string): Promise<ProviderVerification | null>;
  approveVerification(providerId: string, adminId: string): Promise<void>;
  rejectVerification(providerId: string, adminId: string, reason: string): Promise<void>;
  listQueries(status?: QueryStatus): Promise<QueryWithUser[]>;
  getQueryDetail(queryId: string): Promise<QueryWithUser | null>;
  updateQueryStatus(queryId: string, status: QueryStatus, resolution?: string): Promise<QueryRow>;
  addQueryMessage(queryId: string, message: QueryMessage, currentMessages: QueryMessage[]): Promise<QueryRow>;
  getAnalytics(): Promise<AdminAnalytics>;
}

export class AdminRepository implements IAdminRepository {
  async getDashboardStats(): Promise<AdminDashboardStats> {
    const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
    if (error) throw new Error(`AdminRepository.getDashboardStats: ${error.message}`);
    const row = Array.isArray(data) ? (data[0] ?? {}) : (data ?? {});
    return {
      total_users: (row as AdminDashboardStats).total_users ?? 0,
      total_providers: (row as AdminDashboardStats).total_providers ?? 0,
      bookings_this_month: (row as AdminDashboardStats).bookings_this_month ?? 0,
      revenue_this_month: (row as AdminDashboardStats).revenue_this_month ?? 0,
    };
  }

  async listUsers(filters?: {
    role?: UserRole;
    status?: UserStatus;
    search?: string;
  }): Promise<UserRow[]> {
    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.role) query = query.eq('role', filters.role);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(`AdminRepository.listUsers: ${error.message}`);
    return (data ?? []) as UserRow[];
  }

  async getUserDetail(userId: string): Promise<UserRow | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`AdminRepository.getUserDetail: ${error.message}`);
    }
    return data as UserRow;
  }

  async updateUserStatus(userId: string, status: UserStatus): Promise<UserRow> {
    const { data, error } = await supabase
      .from('users')
      .update({ status })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(`AdminRepository.updateUserStatus: ${error.message}`);
    return data as UserRow;
  }

  async listPendingVerifications(): Promise<ProviderVerification[]> {
    const { data: docs, error: docsError } = await supabase
      .from('provider_documents')
      .select('*')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true });

    if (docsError) throw new Error(`AdminRepository.listPendingVerifications: ${docsError.message}`);
    if (!docs || docs.length === 0) return [];

    const providerIds = [...new Set((docs as ProviderDocumentRow[]).map((d) => d.provider_id))];

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .in('id', providerIds);

    if (usersError) throw new Error(`AdminRepository.listPendingVerifications users: ${usersError.message}`);

    const userMap = new Map<string, UserRow>(
      ((users ?? []) as UserRow[]).map((u) => [u.id, u]),
    );

    const grouped = new Map<string, ProviderDocumentRow[]>();
    for (const doc of docs as ProviderDocumentRow[]) {
      const existing = grouped.get(doc.provider_id) ?? [];
      grouped.set(doc.provider_id, [...existing, doc]);
    }

    return providerIds
      .filter((id) => userMap.has(id))
      .map((id) => ({
        user: userMap.get(id)!,
        documents: grouped.get(id) ?? [],
      }));
  }

  async getVerificationDetail(providerId: string): Promise<ProviderVerification | null> {
    const [userResult, docsResult] = await Promise.all([
      supabase.from('users').select('*').eq('id', providerId).single(),
      supabase
        .from('provider_documents')
        .select('*')
        .eq('provider_id', providerId)
        .order('submitted_at', { ascending: true }),
    ]);

    if (userResult.error) {
      if (userResult.error.code === 'PGRST116') return null;
      throw new Error(`AdminRepository.getVerificationDetail: ${userResult.error.message}`);
    }
    if (docsResult.error) {
      throw new Error(`AdminRepository.getVerificationDetail docs: ${docsResult.error.message}`);
    }

    return {
      user: userResult.data as UserRow,
      documents: (docsResult.data ?? []) as ProviderDocumentRow[],
    };
  }

  async approveVerification(providerId: string, adminId: string): Promise<void> {
    const now = new Date().toISOString();

    const { error: userError } = await supabase
      .from('users')
      .update({ status: 'active', is_verified: true })
      .eq('id', providerId);

    if (userError) throw new Error(`AdminRepository.approveVerification user: ${userError.message}`);

    const { error: docsError } = await supabase
      .from('provider_documents')
      .update({
        status: 'approved' as DocumentStatus,
        reviewed_at: now,
        reviewed_by_admin_id: adminId,
      })
      .eq('provider_id', providerId)
      .eq('status', 'pending');

    if (docsError) throw new Error(`AdminRepository.approveVerification docs: ${docsError.message}`);

    await supabase.from('notifications').insert({
      user_id: providerId,
      role: 'provider',
      title: 'Verification Approved',
      message: 'Congratulations! Your provider account has been verified. You can now offer services.',
      type: 'verification',
      data: { type: 'verification', status: 'approved' },
    });
  }

  async rejectVerification(providerId: string, adminId: string, reason: string): Promise<void> {
    const now = new Date().toISOString();

    const { error: docsError } = await supabase
      .from('provider_documents')
      .update({
        status: 'rejected' as DocumentStatus,
        reviewed_at: now,
        reviewed_by_admin_id: adminId,
        rejection_reason: reason,
      })
      .eq('provider_id', providerId)
      .eq('status', 'pending');

    if (docsError) throw new Error(`AdminRepository.rejectVerification docs: ${docsError.message}`);

    await supabase.from('notifications').insert({
      user_id: providerId,
      role: 'provider',
      title: 'Verification Rejected',
      message: `Your verification was not approved. Reason: ${reason}`,
      type: 'verification',
      data: { type: 'verification', status: 'rejected', reason },
    });
  }

  async listQueries(status?: QueryStatus): Promise<QueryWithUser[]> {
    let query = supabase
      .from('queries')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw new Error(`AdminRepository.listQueries: ${error.message}`);
    if (!data || data.length === 0) return [];

    const rows = data as QueryRow[];
    const userIds = [...new Set(rows.map((q) => q.user_id))];

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, profile_image_url')
      .in('id', userIds);

    if (usersError) throw new Error(`AdminRepository.listQueries users: ${usersError.message}`);

    type UserSummary = Pick<UserRow, 'id' | 'name' | 'email' | 'profile_image_url'>;
    const userMap = new Map<string, UserSummary>(
      ((users ?? []) as UserSummary[]).map((u) => [u.id, u]),
    );

    return rows.map((q) => ({
      ...q,
      user: userMap.get(q.user_id) ?? {
        id: q.user_id,
        name: 'Unknown User',
        email: '',
        profile_image_url: null,
      },
    }));
  }

  async getQueryDetail(queryId: string): Promise<QueryWithUser | null> {
    const { data, error } = await supabase
      .from('queries')
      .select('*')
      .eq('id', queryId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`AdminRepository.getQueryDetail: ${error.message}`);
    }

    const row = data as QueryRow;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email, profile_image_url')
      .eq('id', row.user_id)
      .single();

    if (userError) throw new Error(`AdminRepository.getQueryDetail user: ${userError.message}`);

    type UserSummary = Pick<UserRow, 'id' | 'name' | 'email' | 'profile_image_url'>;
    return {
      ...row,
      user: (user as UserSummary) ?? {
        id: row.user_id,
        name: 'Unknown User',
        email: '',
        profile_image_url: null,
      },
    };
  }

  async updateQueryStatus(
    queryId: string,
    status: QueryStatus,
    resolution?: string,
  ): Promise<QueryRow> {
    const { data, error } = await supabase
      .from('queries')
      .update(
        resolution
          ? { status, resolution }
          : { status },
      )
      .eq('id', queryId)
      .select()
      .single();

    if (error) throw new Error(`AdminRepository.updateQueryStatus: ${error.message}`);
    return data as QueryRow;
  }

  async addQueryMessage(
    queryId: string,
    message: QueryMessage,
    currentMessages: QueryMessage[],
  ): Promise<QueryRow> {
    const { data, error } = await supabase
      .from('queries')
      .update({ messages: [...currentMessages, message] })
      .eq('id', queryId)
      .select()
      .single();

    if (error) throw new Error(`AdminRepository.addQueryMessage: ${error.message}`);
    return data as QueryRow;
  }

  async getAnalytics(): Promise<AdminAnalytics> {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();

    const [bookingsResult, usersResult] = await Promise.all([
      supabase
        .from('bookings')
        .select('status, amount, created_at, service_id')
        .gte('created_at', sixMonthsAgo),
      supabase
        .from('users')
        .select('created_at')
        .gte('created_at', sixMonthsAgo),
    ]);

    if (bookingsResult.error) {
      throw new Error(`AdminRepository.getAnalytics bookings: ${bookingsResult.error.message}`);
    }
    if (usersResult.error) {
      throw new Error(`AdminRepository.getAnalytics users: ${usersResult.error.message}`);
    }

    const bookings = bookingsResult.data ?? [];
    const users = usersResult.data ?? [];

    // Monthly revenue (last 6 months)
    const revenueByMonth = new Map<string, number>();
    const growthByMonth = new Map<string, number>();
    const statusCount = new Map<string, number>();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      revenueByMonth.set(key, 0);
      growthByMonth.set(key, 0);
    }

    for (const b of bookings as { status: string; amount: number; created_at: string; service_id: string }[]) {
      const d = new Date(b.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      if (b.status === 'completed' || b.status === 'reviewed') {
        revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + (b.amount ?? 0));
      }

      statusCount.set(b.status, (statusCount.get(b.status) ?? 0) + 1);
    }

    for (const u of users as { created_at: string }[]) {
      const d = new Date(u.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      growthByMonth.set(key, (growthByMonth.get(key) ?? 0) + 1);
    }

    // Top services by booking count
    const serviceBookings = new Map<string, { count: number; revenue: number }>();
    for (const b of bookings as { status: string; amount: number; service_id: string }[]) {
      const entry = serviceBookings.get(b.service_id) ?? { count: 0, revenue: 0 };
      entry.count += 1;
      if (b.status === 'completed' || b.status === 'reviewed') {
        entry.revenue += b.amount ?? 0;
      }
      serviceBookings.set(b.service_id, entry);
    }

    const topServiceIds = [...serviceBookings.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([id]) => id);

    let topServices: AdminAnalytics['topServices'] = [];
    if (topServiceIds.length > 0) {
      const { data: services } = await supabase
        .from('services')
        .select('id, title, business_name')
        .in('id', topServiceIds);

      topServices = ((services ?? []) as { id: string; title: string; business_name: string }[]).map(
        (s) => ({
          title: s.title,
          business_name: s.business_name,
          bookingCount: serviceBookings.get(s.id)?.count ?? 0,
          revenue: serviceBookings.get(s.id)?.revenue ?? 0,
        }),
      );
    }

    const monthLabels: { [key: string]: string } = {
      '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
      '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
      '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
    };

    const monthlyRevenue = [...revenueByMonth.entries()].map(([key, revenue]) => ({
      month: monthLabels[key.split('-')[1]] ?? key,
      revenue,
    }));

    const userGrowth = [...growthByMonth.entries()].map(([key, count]) => ({
      month: monthLabels[key.split('-')[1]] ?? key,
      count,
    }));

    const bookingsByStatus = [...statusCount.entries()].map(([status, count]) => ({
      status,
      count,
    }));

    return { monthlyRevenue, userGrowth, bookingsByStatus, topServices };
  }
}

export const adminRepository = new AdminRepository();
