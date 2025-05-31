import { IFlight } from "@/types/flight";

export interface IBooking {
  id: string;
  departure_flights: IFlight[];
  return_flights: IFlight[];
  total_price: number;
  is_insurance_purchased: boolean;
}
