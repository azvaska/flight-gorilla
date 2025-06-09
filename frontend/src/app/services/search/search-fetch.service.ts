import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { filter, forkJoin, map, Observable } from 'rxjs';
import { ICity, ILocation, INation } from '@/types/search/location';
import { environment } from '@/app/environments/environment';
import { IFlightSearchParams } from '@/types/search/params';
import { IJourney } from '@/types/search/journey';
import { IAirport } from '@/types/airport';

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

  public getCity(cityId: string): Observable<ICity> {
    return this.http
      .get<ICity>(`${environment.apiUrl}/location/city/${cityId}`)
      .pipe(
        map((city) => ({
          id: city.id,
          name: `${city.name} (Any)`,
          type: 'city',
          nation: city.nation,
        }))
      );
  }

  public getCitiesByNation(nationId: string): Observable<ICity[]> {
    const queryParams = new URLSearchParams({
      nation_id: nationId,
    });
    return this.http.get<ICity[]>(
      `${environment.apiUrl}/location/city?${queryParams.toString()}`
    );
  }

  public getNation(nationId: string): Observable<INation> {
    return this.http.get<INation>(
      `${environment.apiUrl}/location/nation/${nationId}`
    );
  }

  public getNations(): Observable<INation[]> {
    return this.http.get<INation[]>(`${environment.apiUrl}/location/nations`);
  }

  public getAirport(airportId: string): Observable<IAirport> {
    return this.http
      .get<IAirport>(`${environment.apiUrl}/airports/${airportId}`)
      .pipe(
        map((airport) => ({
          ...airport,
          name: `${airport.name} (${airport.iata_code})`,
        }))
      );
  }

  public getAirports(params?: {
    name?: string;
    city_name?: string;
    nation_name?: string;}): Observable<IAirport[]> {
    const queryParams = new URLSearchParams({
      name: params?.name ?? '',
      city_name: params?.city_name ?? '',
      nation_name: params?.nation_name ?? '',
    });
    return this.http
      .get<IAirport[]>(
        `${environment.apiUrl}/airports/?${queryParams.toString()}`
      )
      .pipe(
        map((airports) =>
          airports.map((airport) => ({
            ...airport,
            name: `${airport.name} (${airport.iata_code})`,
          }))
        )
      );
  }

  public getFlights(params: IFlightSearchParams): Observable<{
    journeys: IJourney[];
    total_pages: number;
  }> {
    const queryParams = new URLSearchParams({
      departure_id: params.departureId,
      departure_type: params.departureType,
      arrival_id: params.arrivalId,
      arrival_type: params.arrivalType,
      departure_date: params.departureDate,
      page_number: params.page?.toString() ?? '1',
      limit: params.limit?.toString() ?? '3',
      order_by: params.sortBy,
      order_by_desc: params.sortDirection === 'desc' ? 'true' : 'false',
      price_max: params.maxPrice.toString(),
      departure_time_min: params.minDepartureTime,
      departure_time_max: params.maxDepartureTime,
    });

    if (params.airlineId) queryParams.set('airline_id', params.airlineId);

    return this.http.get<{
      journeys: IJourney[];
      total_pages: number;
    }>(`${environment.apiUrl}/search/flights?${queryParams.toString()}`);
  }

  public getFlexibleDates({
    departureId,
    departureType,
    arrivalId,
    arrivalType,
    departureDate,
  }: {
    departureId: string;
    departureType: 'airport' | 'city';
    arrivalId: string;
    arrivalType: 'airport' | 'city';
    departureDate: string;
  }): Observable<(number | null)[]> {
    const queryParams = new URLSearchParams({
      departure_id: departureId,
      departure_type: departureType,
      arrival_id: arrivalId,
      arrival_type: arrivalType,
      departure_date: departureDate,
    });

    return this.http
      .get<(number | null)[]>(
        `${environment.apiUrl}/search/flexible-dates?${queryParams.toString()}`
      )
      .pipe(map((dates) => dates));
  }
}
