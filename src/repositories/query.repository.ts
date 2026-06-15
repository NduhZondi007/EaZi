import { supabase } from '@/lib/supabase';
import type { QueryCategory, QueryPriority, QueryStatus } from '@/types/database.types';

export interface QueryRow {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  category: QueryCategory;
  priority: QueryPriority;
  status: QueryStatus;
  assigned_to: string | null;
  resolution: string | null;
  messages: QueryMessage[];
  created_at: string;
  updated_at: string;
}

export interface QueryMessage {
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

export interface CreateQueryInput {
  subject: string;
  description: string;
  category: QueryCategory;
  priority?: QueryPriority;
}

export interface IQueryRepository {
  findByUser(userId: string): Promise<QueryRow[]>;
  findById(id: string): Promise<QueryRow | null>;
  create(userId: string, input: CreateQueryInput): Promise<QueryRow>;
  addMessage(queryId: string, message: QueryMessage): Promise<QueryRow>;
}

export class QueryRepository implements IQueryRepository {
  async findByUser(userId: string): Promise<QueryRow[]> {
    const { data, error } = await supabase
      .from('queries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`QueryRepository.findByUser: ${error.message}`);
    return (data as QueryRow[]) ?? [];
  }

  async findById(id: string): Promise<QueryRow | null> {
    const { data, error } = await supabase
      .from('queries')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`QueryRepository.findById: ${error.message}`);
    }
    return data as QueryRow;
  }

  async create(userId: string, input: CreateQueryInput): Promise<QueryRow> {
    const { data, error } = await supabase
      .from('queries')
      .insert({
        user_id: userId,
        subject: input.subject,
        description: input.description,
        category: input.category,
        priority: input.priority ?? 'medium',
        status: 'open',
        messages: [],
      })
      .select()
      .single();

    if (error) throw new Error(`QueryRepository.create: ${error.message}`);
    return data as QueryRow;
  }

  async addMessage(queryId: string, message: QueryMessage): Promise<QueryRow> {
    const existing = await this.findById(queryId);
    if (!existing) throw new Error('Query not found');

    const updatedMessages = [...(existing.messages ?? []), message];

    const { data, error } = await supabase
      .from('queries')
      .update({ messages: updatedMessages })
      .eq('id', queryId)
      .select()
      .single();

    if (error) throw new Error(`QueryRepository.addMessage: ${error.message}`);
    return data as QueryRow;
  }
}

export const queryRepository = new QueryRepository();
