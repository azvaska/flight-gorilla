import { IFlight } from "@/types/flight";

export enum BookingPhase {
  OVERVIEW = 'overview',
  SEATS = 'seats',
  EXTRAS = 'extras',
  PAYMENT = 'payment',
  CONFIRMED = 'confirmed',
  ERROR = 'error',
}

export interface IBookingState {
  departureFlights: IFlight[];
  returnFlights?: IFlight[];
  phase: BookingPhase;
  seatSessionId?: string
  extraIds: string[];
  hasInsurance: boolean;
}
