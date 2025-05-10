import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IUser } from '@/types/user';
import { environment } from '@/app/environments/environment';

@Injectable({ providedIn: 'root' })
export class UserFetchService {
  constructor(private http: HttpClient) {}

  public getUser(): Observable<IUser> {
    return this.http.get<IUser>(`${environment.apiUrl}/user/me`);
  }
}
