import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable } from 'rxjs';
import { ILocation } from '@/types/search/location';
import { environment } from '@/app/environments/environment';

@Injectable({ providedIn: 'root' })
export class SearchFetchService {
  constructor(private http: HttpClient) {}

  public getAllLocations(
    filter: string,
    includeNations: boolean
  ): Observable<ILocation[]> {
    const queryParams = new URLSearchParams({
      name: filter,
      include_nations: includeNations.toString(),
    });

    return this.http
      .get<
        {
          id: string;
          name: string;
          type: string;
        }[]
      >(`${environment.apiUrl}/location/all?${queryParams.toString()}`)
      .pipe(
        map((locations) =>
          locations.map((location) => {
            let fullName = location.name;

            if (location.type === 'city') {
              fullName = `${location.name} (Any)`;
            }

            return {
              id: location.id,
              name: fullName,
              type: location.type,
            } as ILocation;
          })
        )
      );
  }

  public getCity(cityId: string): Observable<{ name: string }> {
    return this.http.get<{ name: string }>(`${environment.apiUrl}/location/city/${cityId}`).pipe(
      map((city) => ({
        name: `${city.name} (Any)`,
      }))
    );
  }

  public getNation(nationId: string): Observable<{ name: string }> {
    return this.http.get<{ name: string }>(`${environment.apiUrl}/location/nation/${nationId}`);
  }

  public getAirport(airportId: string): Observable<{ name: string }> {
    return this.http.get<{ name: string, iata_code: string }>(`${environment.apiUrl}/airports/${airportId}`).pipe(
      map((airport) => ({
        name: `${airport.name} (${airport.iata_code})`,
      }))
    );
  }
}
