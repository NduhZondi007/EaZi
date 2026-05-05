import type { BookingStatus } from '@/types/database.types';

type TransitionMap = Partial<Record<BookingStatus, BookingStatus[]>>;

const TRANSITIONS: TransitionMap = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['accepted', 'declined', 'cancelled'],
  accepted: ['arrived', 'cancelled'],
  arrived: ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed: ['reviewed'],
};

export class BookingStateMachine {
  canTransition(from: BookingStatus, to: BookingStatus): boolean {
    return TRANSITIONS[from]?.includes(to) ?? false;
  }

  transition(from: BookingStatus, to: BookingStatus): BookingStatus {
    if (!this.canTransition(from, to)) {
      throw new Error(
        `BookingStateMachine: invalid transition '${from}' → '${to}'`,
      );
    }
    return to;
  }

  validNextStates(current: BookingStatus): BookingStatus[] {
    return TRANSITIONS[current] ?? [];
  }
}

export const bookingStateMachine = new BookingStateMachine();
