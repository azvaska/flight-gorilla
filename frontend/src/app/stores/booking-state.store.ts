import { IBookingState } from '@/types/booking/booking-state';
import { BehaviorSubject } from 'rxjs';

export class BookingStateStore {
  private bookingStateSubject = new BehaviorSubject<IBookingState | null>(null);

  setBookingState(state: IBookingState): void {
    this.bookingStateSubject.next(state);
  }

  getBookingState(): IBookingState {

    const state = this.bookingStateSubject.getValue();
    if (!state) {
      throw new Error('Booking state not found');
    }

    return state;
  }

  updateBookingState(partialState: Partial<IBookingState>): void {
    const currentState = this.bookingStateSubject.getValue();
    const updatedState = currentState ? { ...currentState, ...partialState } : { ...partialState } as IBookingState;
    this.bookingStateSubject.next(updatedState);
  }

  getBookingStateObservable() {
    return this.bookingStateSubject.asObservable();
  }
}
