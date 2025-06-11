import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IUser } from '@/types/user/user';
import { environment } from '@/app/environments/environment';
import { IAdminAirline } from '@/types/admin/airline';

@Injectable({ providedIn: 'root' })
export class AdminFetchService {
  constructor(private http: HttpClient) {}

  public getUsers(): Observable<IUser[]> {
    return this.http.get<IUser[]>(`${environment.apiUrl}/admin/users`);
  }

  public deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/admin/users/${userId}`
    );
  }

  public getAirlines(): Observable<IAdminAirline[]> {
    return this.http.get<IAdminAirline[]>(
      `${environment.apiUrl}/admin/airlines`
    );
  }

  public updateAirline(
    airlineId: string,
    airline: Partial<{
      name: string;
      address: string;
      zip: string;
      nation_id: number;
      email: string;
      website: string;
      first_class_description: string;
      business_class_description: string;
      economy_class_description: string;
    }>
  ): Observable<IAdminAirline> {
    return this.http.put<IAdminAirline>(
      `${environment.apiUrl}/admin/airlines/${airlineId}`,
      airline
    );
  }

  public deleteAirline(airlineId: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/admin/airlines/${airlineId}`
    );
  }

  public registerAirline(airline: {
    email: string;
    name: string;
    surname: string;
    airline_name: string;
  }): Observable<{
    message: string;
    credentials: {
      email: string;
      password: string;
    };
  }> {
    return this.http.post<{
      message: string;
      credentials: {
        email: string;
        password: string;
      };
    }>(`${environment.apiUrl}/auth/register_airline`, airline);
  }
}
