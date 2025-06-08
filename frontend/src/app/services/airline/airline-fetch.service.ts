import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IAirline } from '@/types/airline/airline';
import { environment } from '@/app/environments/environment';
import { IAircraft } from '@/types/airline/aircraft';
import { IAirlineAircraft } from '@/types/airline/aircraft';
import { IExtra } from '@/types/airline/extra';
import { IRoute } from '@/types/airline/route';

@Injectable({ providedIn: 'root' })
export class AirlineFetchService {
  constructor(private http: HttpClient) {}

  public getAirline(): Observable<IAirline> {
    return this.http.get<IAirline>(`${environment.apiUrl}/airline`);
  }

  public getAircrafts(): Observable<IAirlineAircraft[]> {
    return this.http.get<IAirlineAircraft[]>(`${environment.apiUrl}/airline/aircrafts`);
  }

  public addAircraft(aircraft: {
    aircraft_id: string;
    first_class_seats: number;
    business_class_seats: number;
    economy_class_seats: number;
    tail_number: string;
  }): Observable<IAircraft> {
    return this.http.post<IAircraft>(`${environment.apiUrl}/airline/aircrafts`, aircraft);
  }

  public getAircraft(aircraftId: string): Observable<IAircraft> {
    return this.http.get<IAircraft>(`${environment.apiUrl}/airline/aircraft/${aircraftId}`);
  }

  public updateAircraft(aircraftId: string, aircraft: Partial<{
    aircraft_id: string;
    first_class_seats: number;
    business_class_seats: number;
    economy_class_seats: number;
    tail_number: string;
  }>): Observable<IAircraft> {
    return this.http.put<IAircraft>(`${environment.apiUrl}/airline/aircraft/${aircraftId}`, aircraft);
  }

  public deleteAircraft(aircraftId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/airline/aircraft/${aircraftId}`);
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
    return this.http.post<IExtra>(`${environment.apiUrl}/airline/extras`, extra);
  }

  public updateExtra(extraId: string, extra: Partial<
    {
      name: string;
      description: string;
      required_on_all_segments: boolean;
      stackable: boolean;
    }>): Observable<IExtra> {
    return this.http.put<IExtra>(`${environment.apiUrl}/airline/extras/${extraId}`, extra);
  }

  public deleteExtra(extraId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/airline/extras/${extraId}`);
  }

  public getExtra(extraId: string): Observable<IExtra> {
    return this.http.get<IExtra>(`${environment.apiUrl}/airline/extras/${extraId}`);
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
    return this.http.post<IRoute>(`${environment.apiUrl}/airline/routes`, route);
  }

  public updateRoute(routeId: string, route: Partial<{
    departure_airport_id: string;
    arrival_airport_id: string;
    period_start: string;
    period_end: string;
    flight_number: string;
  }>): Observable<IRoute> {
    return this.http.put<IRoute>(`${environment.apiUrl}/airline/routes/${routeId}`, route);
  } 

  public getRoute(routeId: string): Observable<IRoute> {
    return this.http.get<IRoute>(`${environment.apiUrl}/airline/routes/${routeId}`);
  }




  public getAirlineById(airlineId: string): Observable<IAirline> {
    return this.http.get<IAirline>(`${environment.apiUrl}/airline/${airlineId}`);
  }

  public deleteAirline(airlineId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/airline/${airlineId}`);
  }

  public updateAirline(airlineId: string, airline: Partial<IAirline>): Observable<IAirline> {
    return this.http.put<IAirline>(`${environment.apiUrl}/airline/${airlineId}`, airline);
  }







}
