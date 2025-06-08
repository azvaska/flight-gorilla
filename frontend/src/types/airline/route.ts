import { IAirport } from "../airport";

export interface IRoute {
  id: string;
  departure_airport: IAirport;
  arrival_airport: IAirport;
  airline_id: string;
  period_start: string;
  period_end: string;
  flight_number: string;
}
