import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SearchFetchService {
  constructor(private http: HttpClient) {}

  public getCity(cityId: string): Observable<{ name: string }> {
    // Mock with timeout and mock response that still allows me to do .subscribe
    return new Observable((observer) => {
      setTimeout(() => {
        observer.next({ name: 'Rome' });
        observer.complete();
      }, 1000);
    });
  }

  public getCountry(countryId: string): Observable<{ name: string }> {
    return new Observable((observer) => {
      setTimeout(() => {
        observer.next({ name: 'Italy' });
        observer.complete();
      }, 1000);
    });
  }

  public getAirport(airportId: string): Observable<{ name: string }> {
    return new Observable((observer) => {
      setTimeout(() => {
        observer.next({ name: 'Rome' });
        observer.complete();
      }, 1000);
    });
  }
}
