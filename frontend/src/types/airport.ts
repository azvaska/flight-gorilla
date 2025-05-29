interface ICity {
  id: number;
  name: string;
}

export interface IAirport {
  id: number;
  name: string;
  iata_code: string;
  icao_code: string;
  latitude: number;
  longitude: number;
  city: ICity;
}
