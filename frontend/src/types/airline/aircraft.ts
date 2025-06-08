export interface IAircraft {
  id: number;
  name: string;
  rows: number;
  unavailable_seats: string[];
}


export interface IAirlineAircraft {
  id: string;
  aircraft: IAircraft;
  airline_id: string;
  first_class_seats: string[];
  business_class_seats: string[];
  economy_class_seats: string[];
  tail_number: string;
}
