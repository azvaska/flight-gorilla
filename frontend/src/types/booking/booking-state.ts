import { IJourney } from "../search/flight";

export enum BookingPhase {
  OVERVIEW = 'overview',
  SEATS = 'seats',
  EXTRAS = 'extras',
  PAYMENT = 'payment',
}

export interface IBookingState {
  departureJourney: IJourney;
  returnJourney?: IJourney;
  phase: BookingPhase;
}
