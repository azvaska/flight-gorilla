import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable } from 'rxjs';
import { ICity, ILocation, INation } from '@/types/search/location';
import { environment } from '@/app/environments/environment';
import { IFlightSearchParams } from '@/types/search/params';
import { IFlight, IFlightSeats } from '@/types/flight';

@Injectable({ providedIn: 'root' })
export class FlightFetchService {
  constructor(private http: HttpClient) {}

  public getFlight(flightId: string): Observable<IFlight> {
    return this.http.get<IFlight>(`${environment.apiUrl}/flight/${flightId}`);
  }

  public getFlightSeats(flightId: string): Observable<IFlightSeats> {
    return this.http.get<IFlightSeats>(`${environment.apiUrl}/flight/seats/${flightId}`);
  }
}
