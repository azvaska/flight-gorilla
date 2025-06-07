import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IAirline } from '@/types/airline/airline';
import { environment } from '@/app/environments/environment';

@Injectable({ providedIn: 'root' })
export class AirlineFetchService {
  constructor(private http: HttpClient) {}

  public getAirline(): Observable<IAirline> {
    return this.http.get<IAirline>(`${environment.apiUrl}/airline/me`);
  }

  public updateAirline(airlineId: string, airline: Partial<IAirline>): Observable<IAirline> {
    return this.http.put<IAirline>(`${environment.apiUrl}/airline/${airlineId}`, airline);
  }
}
