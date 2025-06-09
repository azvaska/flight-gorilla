import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IAirline } from '@/types/airline/airline';
import { environment } from '@/app/environments/environment';
import { IAirlineAircraft } from '@/types/airline/aircraft';
import { IExtra } from '@/types/airline/extra';
import { IRoute } from '@/types/airline/route';
import { IAirlineFlight } from '@/types/airline/flight';

@Injectable({ providedIn: 'root' })
export class AirlineFetchService {
  constructor(private http: HttpClient) {}

  public getAirline(): Observable<IAirline> {
    return this.http.get<IAirline>(`${environment.apiUrl}/airline`);
  }

  public getAircrafts(): Observable<IAirlineAircraft[]> {
    return this.http.get<IAirlineAircraft[]>(
      `${environment.apiUrl}/airline/aircrafts`
    );
  }

  public addAircraft(aircraft: {
    aircraft_id: number;
    first_class_seats: string[];
    business_class_seats: string[];
    economy_class_seats: string[];
    tail_number: string;
  }): Observable<IAirlineAircraft> {
    return this.http.post<IAirlineAircraft>(
      `${environment.apiUrl}/airline/aircrafts`,
      aircraft
    );
  }

  public getAircraft(aircraftId: string): Observable<IAirlineAircraft> {
    return this.http.get<IAirlineAircraft>(
      `${environment.apiUrl}/airline/aircrafts/${aircraftId}`
    );
  }
 
  public updateAircraft(
    aircraftId: string,
    aircraft: Partial<{
      aircraft_id: string;
      first_class_seats: string[];
      business_class_seats: string[];
      economy_class_seats: string[];
      tail_number: string;
    }>
  ): Observable<IAirlineAircraft> {
    return this.http.put<IAirlineAircraft>(
      `${environment.apiUrl}/airline/aircrafts/${aircraftId}`,
      aircraft
    );
  }

  public deleteAircraft(aircraftId: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/airline/aircrafts/${aircraftId}`
    );
  }

  public getAirlines(): Observable<IAirline[]> {
    return this.http.get<IAirline[]>(`${environment.apiUrl}/airline/all`);
  }

  public getExtras(): Observable<IExtra[]> {
    return this.http.get<IExtra[]>(`${environment.apiUrl}/airline/extras`);
  }

  public addExtra(extra: {
    name: string;
    description: string;
    required_on_all_segments: boolean;
    stackable: boolean;
  }): Observable<IExtra> {
    return this.http.post<IExtra>(
      `${environment.apiUrl}/airline/extras`,
      extra
    );
  }

  public updateExtra(
    extraId: string,
    extra: Partial<{
      name: string;
      description: string;
      required_on_all_segments: boolean;
      stackable: boolean;
    }>
  ): Observable<IExtra> {
    return this.http.put<IExtra>(
      `${environment.apiUrl}/airline/extras/${extraId}`,
      extra
    );
  }

  public deleteExtra(extraId: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/airline/extras/${extraId}`
    );
  }

  public getExtra(extraId: string): Observable<IExtra> {
    return this.http.get<IExtra>(
      `${environment.apiUrl}/airline/extras/${extraId}`
    );
  }

  public getFlights(): Observable<IAirlineFlight[]> {
    return this.http.get<IAirlineFlight[]>(`${environment.apiUrl}/airline/flights`);
  }

  public addFlight(flight: {
    route_id: string;
    aircraft_id: string;
    departure_time: string;
    arrival_time: string;
    price_economy_class: number;
    price_business_class: number;
    price_first_class: number;
    price_insurance: number;
  }): Observable<IAirlineFlight> {
    return this.http.post<IAirlineFlight>(
      `${environment.apiUrl}/airline/flights`,
      flight
    );
  }

  public addExtraToFlight(
    flightId: string,
    extras: {
      extra_id: string;
      price: number;
      limit: number;
    }[]
  ): Observable<void> {
    return this.http.post<void>(
      `${environment.apiUrl}/airline/flights/extra/${flightId}`,
      extras
    );
  }

  public deleteExtraFromFlight(
    flightId: string,
    extraId: string
  ): Observable<void> {
    throw new Error('Not implemented');
    // return this.http.delete<void>(
    //   `${environment.apiUrl}/airline/flights/extra/${flightId}/${extraId}`
    // );
  }

  public updateFlight(
    flightId: string,
    flight: Partial<{
      route_id: string;
      aircraft_id: string;
      departure_time: string;
      arrival_time: string;
      price_economy_class: number;
      price_business_class: number;
      price_first_class: number;
      price_insurance: number;
    }>
  ): Observable<IAirlineFlight> {
    return this.http.put<IAirlineFlight>(
      `${environment.apiUrl}/airline/flights/${flightId}`,
      flight
    );
  }

  public deleteFlight(flightId: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/airline/flights/${flightId}`
    );
  }

  public getFlight(flightId: string): Observable<IAirlineFlight> {
    return this.http.get<IAirlineFlight>(
      `${environment.apiUrl}/airline/flights/${flightId}`
    );
  }

  public getRoutes(): Observable<IRoute[]> {
    return this.http.get<IRoute[]>(`${environment.apiUrl}/airline/routes`);
  }

  public addRoute(route: {
    departure_airport_id: string;
    arrival_airport_id: string;
    period_start: string;
    period_end: string;
    flight_number: string;
  }): Observable<IRoute> {
    return this.http.post<IRoute>(
      `${environment.apiUrl}/airline/routes`,
      route
    );
  }

  public updateRoute(
    routeId: string,
    route: Partial<{
      departure_airport_id: string;
      arrival_airport_id: string;
      period_start: string;
      period_end: string;
      flight_number: string;
    }>
  ): Observable<IRoute> {
    return this.http.put<IRoute>(
      `${environment.apiUrl}/airline/routes/${routeId}`,
      route
    );
  }

  public getRoute(routeId: string): Observable<IRoute> {
    return this.http.get<IRoute>(
      `${environment.apiUrl}/airline/routes/${routeId}`
    );
  }

  public getAirlineById(airlineId: string): Observable<IAirline> {
    return this.http.get<IAirline>(
      `${environment.apiUrl}/airline/${airlineId}`
    );
  }

  public deleteAirline(airlineId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/airline/${airlineId}`);
  }

  public updateAirline(
    airlineId: string,
    airline: Partial<IAirline>
  ): Observable<IAirline> {
    return this.http.put<IAirline>(
      `${environment.apiUrl}/airline/${airlineId}`,
      airline
    );
  }
}
