import { IFlight } from "@/types/flight";

export interface IBookingExtra {
  extra_id: string;
  name: string;
  description: string;
  extra_price: number;
}

export interface IBookingSegment {
  class_type: string;
  extras: IBookingExtra[];
  flight: IFlight;
  price: number;
  seat_number: string;
}

export interface IBooking {
  id: string;
  booking_number: string;
  departure_flights: IBookingSegment[];
  return_flights: IBookingSegment[];
  total_price: number;
  is_insurance_purchased: boolean;
}
