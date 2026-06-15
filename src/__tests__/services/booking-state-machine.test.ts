import {
  BookingStateMachine,
  bookingStateMachine,
} from '@/services/booking-state-machine';
import type { BookingStatus } from '@/types/database.types';

describe('BookingStateMachine', () => {
  let machine: BookingStateMachine;

  beforeEach(() => {
    machine = new BookingStateMachine();
  });

  // ── canTransition — valid transitions ────────────────────────────────────
  describe('canTransition — valid paths', () => {
    const valid: Array<[BookingStatus, BookingStatus]> = [
      ['pending', 'confirmed'],
      ['pending', 'cancelled'],
      ['confirmed', 'accepted'],
      ['confirmed', 'declined'],
      ['confirmed', 'cancelled'],
      ['accepted', 'arrived'],
      ['accepted', 'cancelled'],
      ['arrived', 'in_progress'],
      ['arrived', 'cancelled'],
      ['in_progress', 'completed'],
      ['completed', 'reviewed'],
    ];

    test.each(valid)('%s → %s returns true', (from, to) => {
      expect(machine.canTransition(from, to)).toBe(true);
    });
  });

  // ── canTransition — invalid transitions ──────────────────────────────────
  describe('canTransition — invalid paths', () => {
    const invalid: Array<[BookingStatus, BookingStatus]> = [
      // Skipping stages
      ['pending', 'accepted'],
      ['pending', 'arrived'],
      ['pending', 'in_progress'],
      ['pending', 'completed'],
      ['pending', 'reviewed'],
      ['confirmed', 'arrived'],
      ['confirmed', 'in_progress'],
      ['confirmed', 'completed'],
      ['confirmed', 'reviewed'],
      ['accepted', 'in_progress'],
      ['accepted', 'completed'],
      ['accepted', 'reviewed'],
      ['arrived', 'completed'],
      ['arrived', 'reviewed'],
      // In-progress cannot be cancelled
      ['in_progress', 'cancelled'],
      ['in_progress', 'pending'],
      ['in_progress', 'confirmed'],
      // Terminal states — nothing follows
      ['declined', 'pending'],
      ['declined', 'confirmed'],
      ['declined', 'accepted'],
      ['declined', 'arrived'],
      ['declined', 'in_progress'],
      ['declined', 'completed'],
      ['declined', 'reviewed'],
      ['declined', 'cancelled'],
      ['cancelled', 'pending'],
      ['cancelled', 'confirmed'],
      ['cancelled', 'accepted'],
      ['cancelled', 'arrived'],
      ['cancelled', 'in_progress'],
      ['cancelled', 'completed'],
      ['cancelled', 'reviewed'],
      ['cancelled', 'declined'],
      ['reviewed', 'pending'],
      ['reviewed', 'confirmed'],
      ['reviewed', 'accepted'],
      ['reviewed', 'arrived'],
      ['reviewed', 'in_progress'],
      ['reviewed', 'completed'],
      ['reviewed', 'cancelled'],
      ['reviewed', 'declined'],
      // Self-transitions
      ['pending', 'pending'],
      ['completed', 'completed'],
    ];

    test.each(invalid)('%s → %s returns false', (from, to) => {
      expect(machine.canTransition(from, to)).toBe(false);
    });
  });

  // ── transition — succeeds on valid paths ─────────────────────────────────
  describe('transition — success cases', () => {
    it('returns the target status on a valid transition', () => {
      expect(machine.transition('pending', 'confirmed')).toBe('confirmed');
      expect(machine.transition('confirmed', 'accepted')).toBe('accepted');
      expect(machine.transition('accepted', 'arrived')).toBe('arrived');
      expect(machine.transition('arrived', 'in_progress')).toBe('in_progress');
      expect(machine.transition('in_progress', 'completed')).toBe('completed');
      expect(machine.transition('completed', 'reviewed')).toBe('reviewed');
    });

    it('allows cancellation from allowed states', () => {
      expect(machine.transition('pending', 'cancelled')).toBe('cancelled');
      expect(machine.transition('confirmed', 'cancelled')).toBe('cancelled');
      expect(machine.transition('accepted', 'cancelled')).toBe('cancelled');
      expect(machine.transition('arrived', 'cancelled')).toBe('cancelled');
    });

    it('allows provider to decline from confirmed', () => {
      expect(machine.transition('confirmed', 'declined')).toBe('declined');
    });
  });

  // ── transition — throws on invalid paths ─────────────────────────────────
  describe('transition — error cases', () => {
    it('throws on a skipped-step transition', () => {
      expect(() => machine.transition('pending', 'accepted')).toThrow(
        "BookingStateMachine: invalid transition 'pending' → 'accepted'",
      );
    });

    it('throws when trying to cancel an in-progress booking', () => {
      expect(() => machine.transition('in_progress', 'cancelled')).toThrow(
        "BookingStateMachine: invalid transition 'in_progress' → 'cancelled'",
      );
    });

    it('throws when transitioning from a terminal state', () => {
      expect(() => machine.transition('declined', 'pending')).toThrow(
        "BookingStateMachine: invalid transition 'declined' → 'pending'",
      );
      expect(() => machine.transition('cancelled', 'confirmed')).toThrow(
        "BookingStateMachine: invalid transition 'cancelled' → 'confirmed'",
      );
      expect(() => machine.transition('reviewed', 'completed')).toThrow(
        "BookingStateMachine: invalid transition 'reviewed' → 'completed'",
      );
    });

    it('throws on a self-transition', () => {
      expect(() => machine.transition('pending', 'pending')).toThrow();
    });
  });

  // ── validNextStates ───────────────────────────────────────────────────────
  describe('validNextStates', () => {
    it('returns correct next states for pending', () => {
      expect(machine.validNextStates('pending')).toEqual(['confirmed', 'cancelled']);
    });

    it('returns correct next states for confirmed', () => {
      expect(machine.validNextStates('confirmed')).toEqual(['accepted', 'declined', 'cancelled']);
    });

    it('returns correct next states for accepted', () => {
      expect(machine.validNextStates('accepted')).toEqual(['arrived', 'cancelled']);
    });

    it('returns correct next states for arrived', () => {
      expect(machine.validNextStates('arrived')).toEqual(['in_progress', 'cancelled']);
    });

    it('returns correct next states for in_progress', () => {
      expect(machine.validNextStates('in_progress')).toEqual(['completed']);
    });

    it('returns correct next states for completed', () => {
      expect(machine.validNextStates('completed')).toEqual(['reviewed']);
    });

    it('returns empty array for terminal states', () => {
      expect(machine.validNextStates('declined')).toEqual([]);
      expect(machine.validNextStates('cancelled')).toEqual([]);
      expect(machine.validNextStates('reviewed')).toEqual([]);
    });
  });

  // ── singleton export ──────────────────────────────────────────────────────
  describe('singleton', () => {
    it('exports a shared instance', () => {
      expect(bookingStateMachine).toBeInstanceOf(BookingStateMachine);
    });

    it('singleton behaves identically to a new instance', () => {
      expect(bookingStateMachine.transition('pending', 'confirmed')).toBe('confirmed');
      expect(bookingStateMachine.canTransition('in_progress', 'cancelled')).toBe(false);
    });
  });
});
