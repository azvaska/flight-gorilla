import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IAircraft } from '@/types/airline/aircraft';
import { environment } from '@/app/environments/environment';

@Injectable({ providedIn: 'root' })
export class AircraftFetchService {
  constructor(private http: HttpClient) {}

  public getAircrafts(): Observable<IAircraft[]> {
    return this.http.get<IAircraft[]>(
      `${environment.apiUrl}/aircraft/`
    );
  }

  public getAircraft(aircraftId: string): Observable<IAircraft> {
    return this.http.get<IAircraft>(
      `${environment.apiUrl}/aircraft/${aircraftId}`
    );
  }

}
