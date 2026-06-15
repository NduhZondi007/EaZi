import { BookingRepository } from '@/repositories/booking.repository';
import { bookingStateMachine } from '@/services/booking-state-machine';
import type { BookingStatus } from '@/types/database.types';

jest.mock('@/lib/supabase', () => ({ supabase: { from: jest.fn() } }));
jest.mock('@/services/booking-state-machine', () => ({
  bookingStateMachine: {
    transition: jest.fn(),
    canTransition: jest.fn(),
    validNextStates: jest.fn(),
  },
}));

import { supabase } from '@/lib/supabase';

const mockFrom = supabase.from as jest.Mock;
const mockTransition = bookingStateMachine.transition as jest.Mock;

const makeChain = (options: {
  singleResult?: { data: unknown; error: unknown };
  listResult?: { data: unknown; error: unknown };
}) => {
  const chain: Record<string, jest.Mock> = {
    select: jest.fn(),
    eq: jest.fn(),
    in: jest.fn(),
    not: jest.fn(),
    order: jest.fn(),
    gte: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    single: jest.fn().mockResolvedValue(options.singleResult ?? { data: null, error: null }),
  };
  const listResolve = options.listResult ?? { data: [], error: null };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.in.mockReturnValue(chain);
  chain.not.mockReturnValue(chain);
  chain.gte.mockReturnValue(chain);
  chain.insert.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  chain.order.mockResolvedValue(listResolve);
  return chain;
};

const mockBookingRow = {
  id: 'booking-1',
  service_id: 'svc-1',
  client_id: 'client-1',
  provider_id: 'provider-1',
  status: 'pending' as BookingStatus,
  status_history: [{ status: 'pending', timestamp: '2024-01-01T00:00:00Z', note: 'Booking created' }],
  amount: 150,
  date: '2024-06-15',
  time: '10:00',
  address: '123 Main St',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  payment_method: 'card',
  booking_for: 'self',
  notes: null,
  cancelled_by: null,
  cancelled_reason: null,
};

describe('BookingRepository', () => {
  let repo: BookingRepository;

  beforeEach(() => {
    repo = new BookingRepository();
    jest.clearAllMocks();
  });

  // ── findById ──────────────────────────────────────────────────────────────
  describe('findById', () => {
    it('returns null when booking does not exist (PGRST116)', async () => {
      mockFrom.mockReturnValue(
        makeChain({
          singleResult: { data: null, error: { code: 'PGRST116', message: 'Not found' } },
        }),
      );
      const result = await repo.findById('nonexistent');
      expect(result).toBeNull();
    });

    it('throws on unexpected database error', async () => {
      mockFrom.mockReturnValue(
        makeChain({
          singleResult: {
            data: null,
            error: { code: 'PGRST500', message: 'Internal server error' },
          },
        }),
      );
      await expect(repo.findById('booking-1')).rejects.toThrow('BookingRepository.findById');
    });

    it('fetches booking and resolves attachDetails on success', async () => {
      const servicesChain = makeChain({ listResult: { data: [], error: null } });
      servicesChain.in.mockResolvedValue({ data: [], error: null });
      const usersChain = makeChain({ listResult: { data: [], error: null } });
      usersChain.in.mockResolvedValue({ data: [], error: null });

      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'bookings' && callCount === 0) {
          callCount++;
          return makeChain({ singleResult: { data: mockBookingRow, error: null } });
        }
        if (table === 'services') return servicesChain;
        if (table === 'users') return usersChain;
        return makeChain({ singleResult: { data: null, error: null } });
      });

      const result = await repo.findById('booking-1');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('booking-1');
    });
  });

  // ── findByClient ──────────────────────────────────────────────────────────
  describe('findByClient', () => {
    it('returns empty array when no bookings', async () => {
      const servicesChain = makeChain({});
      servicesChain.in.mockResolvedValue({ data: [], error: null });
      const usersChain = makeChain({});
      usersChain.in.mockResolvedValue({ data: [], error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'bookings') {
          return makeChain({ listResult: { data: [], error: null } });
        }
        return makeChain({});
      });

      const result = await repo.findByClient('client-1');
      expect(result).toEqual([]);
    });

    it('throws when database returns error', async () => {
      const chain = makeChain({});
      chain.order.mockResolvedValue({ data: null, error: { message: 'DB error' } });
      mockFrom.mockReturnValue(chain);

      await expect(repo.findByClient('client-1')).rejects.toThrow('BookingRepository.findByClient');
    });
  });

  // ── create ────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('inserts with pending status and initial history entry', async () => {
      const chain = makeChain({ singleResult: { data: mockBookingRow, error: null } });
      mockFrom.mockReturnValue(chain);

      const input = {
        service_id: 'svc-1',
        client_id: 'client-1',
        provider_id: 'provider-1',
        amount: 150,
        date: '2024-06-15',
        time: '10:00',
        address: '123 Main St',
        payment_method: 'card' as const,
        booking_for: 'self' as const,
      };

      const result = await repo.create(input);

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending',
          status_history: expect.arrayContaining([
            expect.objectContaining({ status: 'pending', note: 'Booking created' }),
          ]),
        }),
      );
      expect(result.id).toBe('booking-1');
    });

    it('throws when insert fails', async () => {
      const chain = makeChain({ singleResult: { data: null, error: { message: 'Constraint violation' } } });
      mockFrom.mockReturnValue(chain);

      await expect(
        repo.create({
          service_id: 'svc-1',
          client_id: 'client-1',
          provider_id: 'provider-1',
          amount: 150,
          date: '2024-06-15',
          time: '10:00',
          address: '123 Main St',
          payment_method: 'card',
          booking_for: 'self',
        }),
      ).rejects.toThrow('BookingRepository.create');
    });
  });

  // ── updateStatus ──────────────────────────────────────────────────────────
  describe('updateStatus', () => {
    it('calls BookingStateMachine.transition before updating', async () => {
      mockTransition.mockReturnValue('confirmed');

      const existingChain = makeChain({
        singleResult: {
          data: { status_history: [{ status: 'pending', timestamp: '2024-01-01T00:00:00Z' }] },
          error: null,
        },
      });
      const updateChain = makeChain({
        singleResult: { data: { ...mockBookingRow, status: 'confirmed' }, error: null },
      });

      let selectCallCount = 0;
      mockFrom.mockImplementation(() => {
        selectCallCount++;
        return selectCallCount === 1 ? existingChain : updateChain;
      });

      await repo.updateStatus('booking-1', 'pending', 'confirmed');

      expect(mockTransition).toHaveBeenCalledWith('pending', 'confirmed');
    });

    it('throws and does not call supabase when transition is invalid', async () => {
      mockTransition.mockImplementation(() => {
        throw new Error("BookingStateMachine: invalid transition 'pending' → 'completed'");
      });

      await expect(
        repo.updateStatus('booking-1', 'pending', 'completed'),
      ).rejects.toThrow('invalid transition');

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('appends new entry to status_history', async () => {
      mockTransition.mockReturnValue('confirmed');

      const existingHistory = [{ status: 'pending', timestamp: '2024-01-01T00:00:00Z' }];
      const existingChain = makeChain({
        singleResult: { data: { status_history: existingHistory }, error: null },
      });
      const updateChain = makeChain({
        singleResult: { data: { ...mockBookingRow, status: 'confirmed' }, error: null },
      });

      let callIdx = 0;
      mockFrom.mockImplementation(() => (callIdx++ === 0 ? existingChain : updateChain));

      await repo.updateStatus('booking-1', 'pending', 'confirmed', 'Auto-confirmed');

      expect(updateChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'confirmed',
          status_history: expect.arrayContaining([
            expect.objectContaining({ status: 'confirmed', note: 'Auto-confirmed' }),
          ]),
        }),
      );
    });
  });

  // ── cancel / acceptBooking / declineBooking ───────────────────────────────
  describe('convenience status-change methods', () => {
    const setupUpdateMock = (toStatus: BookingStatus) => {
      mockTransition.mockReturnValue(toStatus);
      const existingChain = makeChain({
        singleResult: { data: { status_history: [] }, error: null },
      });
      const updateChain = makeChain({
        singleResult: { data: { ...mockBookingRow, status: toStatus }, error: null },
      });
      let idx = 0;
      mockFrom.mockImplementation(() => (idx++ === 0 ? existingChain : updateChain));
    };

    it('cancel calls updateStatus with cancelled status', async () => {
      setupUpdateMock('cancelled');
      const result = await repo.cancel('booking-1', 'pending');
      expect(mockTransition).toHaveBeenCalledWith('pending', 'cancelled');
      expect(result.status).toBe('cancelled');
    });

    it('acceptBooking calls updateStatus with accepted status', async () => {
      setupUpdateMock('accepted');
      const result = await repo.acceptBooking('booking-1', 'confirmed');
      expect(mockTransition).toHaveBeenCalledWith('confirmed', 'accepted');
      expect(result.status).toBe('accepted');
    });

    it('declineBooking calls updateStatus with declined status', async () => {
      setupUpdateMock('declined');
      const result = await repo.declineBooking('booking-1', 'confirmed');
      expect(mockTransition).toHaveBeenCalledWith('confirmed', 'declined');
      expect(result.status).toBe('declined');
    });
  });
});
