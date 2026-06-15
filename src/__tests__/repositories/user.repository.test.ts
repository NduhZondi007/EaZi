import { UserRepository } from '@/repositories/user.repository';
import type { Database } from '@/types/database.types';

jest.mock('@/lib/supabase', () => ({ supabase: { from: jest.fn() } }));

import { supabase } from '@/lib/supabase';

type UserInsert = Database['public']['Tables']['users']['Insert'];

const mockFrom = supabase.from as jest.Mock;

const makeChain = (singleResult: { data: unknown; error: unknown }) => {
  const chain: Record<string, jest.Mock> = {
    select: jest.fn(),
    eq: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    single: jest.fn().mockResolvedValue(singleResult),
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.insert.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  return chain;
};

const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'client' as const,
  status: 'active' as const,
  profile_image_url: null,
  phone: null,
  is_verified: false,
  bio: null,
  gender: null,
  date_of_birth: null,
  address: null,
  home_address: null,
  office_address: null,
  latitude: null,
  longitude: null,
  push_token: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('UserRepository', () => {
  let repo: UserRepository;

  beforeEach(() => {
    repo = new UserRepository();
    jest.clearAllMocks();
  });

  // ── findById ──────────────────────────────────────────────────────────────
  describe('findById', () => {
    it('returns a user when found', async () => {
      mockFrom.mockReturnValue(makeChain({ data: mockUser, error: null }));
      const result = await repo.findById('user-1');
      expect(result).toEqual(mockUser);
      expect(mockFrom).toHaveBeenCalledWith('users');
    });

    it('returns null when user does not exist (PGRST116)', async () => {
      mockFrom.mockReturnValue(
        makeChain({ data: null, error: { code: 'PGRST116', message: 'Row not found' } }),
      );
      const result = await repo.findById('nonexistent');
      expect(result).toBeNull();
    });

    it('throws on unexpected supabase error', async () => {
      mockFrom.mockReturnValue(
        makeChain({ data: null, error: { code: 'PGRST301', message: 'Connection refused' } }),
      );
      await expect(repo.findById('user-1')).rejects.toThrow('UserRepository.findById');
    });
  });

  // ── findByEmail ───────────────────────────────────────────────────────────
  describe('findByEmail', () => {
    it('returns a user when found by email', async () => {
      mockFrom.mockReturnValue(makeChain({ data: mockUser, error: null }));
      const result = await repo.findByEmail('test@example.com');
      expect(result).toEqual(mockUser);
    });

    it('returns null when email does not exist', async () => {
      mockFrom.mockReturnValue(
        makeChain({ data: null, error: { code: 'PGRST116', message: 'Not found' } }),
      );
      const result = await repo.findByEmail('missing@example.com');
      expect(result).toBeNull();
    });

    it('throws on unexpected error', async () => {
      mockFrom.mockReturnValue(
        makeChain({ data: null, error: { code: 'PGRST500', message: 'Server error' } }),
      );
      await expect(repo.findByEmail('test@example.com')).rejects.toThrow(
        'UserRepository.findByEmail',
      );
    });
  });

  // ── create ────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('creates and returns the new user', async () => {
      mockFrom.mockReturnValue(makeChain({ data: mockUser, error: null }));
      const insertData: UserInsert = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'client',
      };
      const result = await repo.create(insertData);
      expect(result).toEqual(mockUser);
    });

    it('throws when insert fails', async () => {
      mockFrom.mockReturnValue(
        makeChain({ data: null, error: { code: 'PGRST301', message: 'Unique violation' } }),
      );
      await expect(
        repo.create({ id: 'u', name: 'X', email: 'x@example.com' }),
      ).rejects.toThrow('UserRepository.create');
    });
  });

  // ── update ────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('updates and returns the updated user', async () => {
      const updated = { ...mockUser, name: 'Updated Name' };
      mockFrom.mockReturnValue(makeChain({ data: updated, error: null }));
      const result = await repo.update('user-1', { name: 'Updated Name' });
      expect(result.name).toBe('Updated Name');
    });

    it('throws when update fails', async () => {
      mockFrom.mockReturnValue(
        makeChain({ data: null, error: { code: 'PGRST301', message: 'RLS violation' } }),
      );
      await expect(repo.update('user-1', { name: 'Fail' })).rejects.toThrow(
        'UserRepository.update',
      );
    });
  });

  // ── updatePushToken ───────────────────────────────────────────────────────
  describe('updatePushToken', () => {
    it('resolves without error on success', async () => {
      const chain = makeChain({ data: null, error: null });
      chain.eq.mockResolvedValue({ error: null });
      mockFrom.mockReturnValue(chain);
      await expect(repo.updatePushToken('user-1', 'ExponentPushToken[abc]')).resolves.toBeUndefined();
    });

    it('throws when token update fails', async () => {
      const chain = makeChain({ data: null, error: null });
      chain.eq.mockResolvedValue({ error: { code: 'PGRST301', message: 'Permission denied' } });
      mockFrom.mockReturnValue(chain);
      await expect(repo.updatePushToken('user-1', 'bad-token')).rejects.toThrow(
        'UserRepository.updatePushToken',
      );
    });
  });
});
