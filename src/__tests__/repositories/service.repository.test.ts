import { ServiceRepository } from '@/repositories/service.repository';

jest.mock('@/lib/supabase', () => ({ supabase: { from: jest.fn(), storage: { from: jest.fn() } } }));

import { supabase } from '@/lib/supabase';

const mockFrom = supabase.from as jest.Mock;

const makeChain = (options: {
  singleResult?: { data: unknown; error: unknown };
  listResult?: { data: unknown; error: unknown; count?: number | null };
}) => {
  const chain: Record<string, jest.Mock> = {
    select: jest.fn(),
    eq: jest.fn(),
    in: jest.fn(),
    not: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    single: jest.fn().mockResolvedValue(options.singleResult ?? { data: null, error: null }),
  };
  const listResolve = options.listResult ?? { data: [], error: null, count: null };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.in.mockReturnValue(chain);
  chain.not.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  chain.insert.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  chain.delete.mockReturnValue(chain);
  chain.order.mockResolvedValue(listResolve);
  return chain;
};

const mockServiceRow = {
  id: 'svc-1',
  provider_id: 'provider-1',
  title: 'Test Service',
  description: 'A test service',
  service_type: 'cleaning',
  base_price: 200,
  is_available: true,
  gallery: [],
  avg_rating: 4.5,
  review_count: 10,
  business_name: 'Test Business',
  latitude: null,
  longitude: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('ServiceRepository', () => {
  let repo: ServiceRepository;

  beforeEach(() => {
    repo = new ServiceRepository();
    jest.clearAllMocks();
  });

  // ── findById ──────────────────────────────────────────────────────────────
  describe('findById', () => {
    it('returns null when service does not exist (PGRST116)', async () => {
      mockFrom.mockReturnValue(
        makeChain({
          singleResult: { data: null, error: { code: 'PGRST116', message: 'Not found' } },
        }),
      );
      const result = await repo.findById('nonexistent');
      expect(result).toBeNull();
    });

    it('throws on unexpected error', async () => {
      mockFrom.mockReturnValue(
        makeChain({
          singleResult: {
            data: null,
            error: { code: 'PGRST500', message: 'Server error' },
          },
        }),
      );
      await expect(repo.findById('svc-1')).rejects.toThrow('ServiceRepository.findById');
    });

    it('fetches service with provider and reviews on success', async () => {
      const providerChain = makeChain({
        singleResult: {
          data: {
            id: 'provider-1',
            name: 'Provider Name',
            profile_image_url: null,
            is_verified: true,
            phone: null,
            bio: null,
            address: null,
          },
          error: null,
        },
      });
      const reviewsChain = makeChain({
        listResult: { data: [], error: null },
      });
      reviewsChain.eq.mockResolvedValue({ data: [], error: null });

      let callIdx = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'services' && callIdx === 0) {
          callIdx++;
          return makeChain({ singleResult: { data: mockServiceRow, error: null } });
        }
        if (table === 'users') return providerChain;
        if (table === 'reviews') return reviewsChain;
        return makeChain({});
      });

      const result = await repo.findById('svc-1');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('svc-1');
    });
  });

  // ── findByProvider ────────────────────────────────────────────────────────
  describe('findByProvider', () => {
    it('returns empty array when provider has no services', async () => {
      const chain = makeChain({ listResult: { data: [], error: null } });
      mockFrom.mockReturnValue(chain);

      const result = await repo.findByProvider('provider-1');
      expect(result).toEqual([]);
      expect(mockFrom).toHaveBeenCalledWith('services');
    });

    it('returns services for the given provider', async () => {
      const chain = makeChain({ listResult: { data: [mockServiceRow], error: null } });
      mockFrom.mockReturnValue(chain);

      const result = await repo.findByProvider('provider-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('svc-1');
    });

    it('throws when database returns error', async () => {
      const chain = makeChain({});
      chain.order.mockResolvedValue({ data: null, error: { message: 'Permission denied' } });
      mockFrom.mockReturnValue(chain);

      await expect(repo.findByProvider('provider-1')).rejects.toThrow('ServiceRepository.findByProvider');
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('resolves without error on successful delete', async () => {
      const chain = makeChain({});
      chain.eq.mockResolvedValue({ error: null });
      mockFrom.mockReturnValue(chain);

      await expect(repo.remove('svc-1')).resolves.toBeUndefined();
    });

    it('throws when delete fails', async () => {
      const chain = makeChain({});
      chain.eq.mockResolvedValue({ error: { message: 'Cannot delete' } });
      mockFrom.mockReturnValue(chain);

      await expect(repo.remove('svc-1')).rejects.toThrow('ServiceRepository.remove');
    });
  });

  // ── toggleAvailability ────────────────────────────────────────────────────
  describe('toggleAvailability', () => {
    it('updates is_available flag and returns updated service', async () => {
      const updatedService = { ...mockServiceRow, is_available: false };
      const chain = makeChain({ singleResult: { data: updatedService, error: null } });
      mockFrom.mockReturnValue(chain);

      const result = await repo.toggleAvailability('svc-1', false);
      expect(chain.update).toHaveBeenCalledWith({ is_available: false });
      expect(result.is_available).toBe(false);
    });
  });
});
