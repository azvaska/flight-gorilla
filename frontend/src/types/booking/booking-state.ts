import { IFlight } from "@/types/flight";

export enum BookingPhase {
  OVERVIEW = 'overview',
  SEATS = 'seats',
  EXTRAS = 'extras',
  PAYMENT = 'payment',
}

export interface IBookingState {
  departureFlights: IFlight[];
  returnFlights?: IFlight[];
  phase: BookingPhase;
}
