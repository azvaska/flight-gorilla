import { IAirline } from "./airline";
import { IAirport } from "./airport";

export interface IFlightExtra {
  id: string;
  name: string;
  description: string;
  extra_id: string;
  price: number;
  limit: number;
  stackable: boolean;
  required_on_all_segments: boolean;
}

export interface IFlightSeats {
  flight_id: string;
  seats_info: {
    economy_class_seats: string[];
    business_class_seats: string[];
    first_class_seats: string[];
    booked_seats: string[];
  };
  rows: number;
}


export interface IFlight {
  id: string;
  airline: IAirline;
  flight_number: string;
  departure_airport: IAirport;
  arrival_airport: IAirport;
  departure_time: string;
  arrival_time: string;
  price_economy_class: number;
  price_business_class: number;
  price_first_class: number;
  price_insurance: number;
}
