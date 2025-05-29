interface IFlight {
  id: string;
  flight_number: string;
  airline_name: string;
  airline_id: string;
  departure_airport: string;
  arrival_airport: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  price_economy: number;
  price_business: number;
  price_first: number;
  aircraft_name: string;
  gate: string | null;
  terminal: string | null;
}

export interface ILayover {
  airport: string;
  duration_minutes: number;
}

export interface IJourney {
  departure_airport: string;
  arrival_airport: string;
  duration_minutes: number;
  price_economy: number;
  price_business: number;
  price_first: number;
  is_direct: boolean;
  stops: number;
  segments: IFlight[];
  layovers: ILayover[];
}
