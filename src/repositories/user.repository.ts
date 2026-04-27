import { supabase } from '@/lib/supabase';
import type { Database, UserRow } from '@/types/database.types';

type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

export interface IUserRepository {
  findById(id: string): Promise<UserRow | null>;
  findByEmail(email: string): Promise<UserRow | null>;
  create(data: UserInsert): Promise<UserRow>;
  update(id: string, data: UserUpdate): Promise<UserRow>;
  updatePushToken(id: string, token: string): Promise<void>;
}

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<UserRow | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`UserRepository.findById: ${error.message}`);
    }
    return data;
  }

  async findByEmail(email: string): Promise<UserRow | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`UserRepository.findByEmail: ${error.message}`);
    }
    return data;
  }

  async create(data: UserInsert): Promise<UserRow> {
    const { data: created, error } = await supabase
      .from('users')
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(`UserRepository.create: ${error.message}`);
    return created;
  }

  async update(id: string, data: UserUpdate): Promise<UserRow> {
    const { data: updated, error } = await supabase
      .from('users')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`UserRepository.update: ${error.message}`);
    return updated;
  }

  async updatePushToken(id: string, token: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ push_token: token })
      .eq('id', id);

    if (error) throw new Error(`UserRepository.updatePushToken: ${error.message}`);
  }
}

export const userRepository = new UserRepository();
