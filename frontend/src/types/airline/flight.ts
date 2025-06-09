import { IAirport } from "../airport";
import { IAirlineAircraft } from "./aircraft";

export interface IAirlineFlight {
  id: string;
  flight_number: string;
  departure_airport: IAirport;
  arrival_airport: IAirport;
  departure_time: string;
  arrival_time: string;
  price_economy_class: number;
  price_business_class: number;
  price_first_class: number;
  price_insurance: number;
  aircraft: IAirlineAircraft;
  route_id: string;
  gate?: string;
  terminal?: string;
  checkin_start_time: string;
  checkin_end_time: string;
  boarding_start_time: string;
  boarding_end_time: string;
  booked_seats: string[];
}
