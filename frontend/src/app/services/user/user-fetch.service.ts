import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IUser } from '@/types/user/user';
import { environment } from '@/app/environments/environment';
import { IPayementCard } from '@/types/user/payement-card';

@Injectable({ providedIn: 'root' })
export class UserFetchService {
  constructor(private http: HttpClient) {}

  public getUser(): Observable<IUser> {
    return this.http.get<IUser>(`${environment.apiUrl}/user/me`);
  }

  public getPayementCards(): Observable<IPayementCard[]> {
    return this.http.get<IPayementCard[]>(`${environment.apiUrl}/user/cards`);
  }
  public addPayementCard(card: Omit<IPayementCard, 'id'>): Observable<IPayementCard> {
    return this.http.post<IPayementCard>(`${environment.apiUrl}/user/cards`, card);
  }
  public deletePayementCard(cardId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/user/cards/${cardId}`);
  }

  public getPayementCard(cardId: number): Observable<IPayementCard> {
    return this.http.get<IPayementCard>(`${environment.apiUrl}/user/cards/${cardId}`);
  }
}
