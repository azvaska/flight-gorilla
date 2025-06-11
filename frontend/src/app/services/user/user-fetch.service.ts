import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { IUser } from '@/types/user/user';
import { environment } from '@/app/environments/environment';
import { IPayementCard } from '@/types/user/payement-card';
import { AuthService } from '@/app/auth/auth.service';

@Injectable({ providedIn: 'root' })
export class UserFetchService {
  constructor(private http: HttpClient, private authService: AuthService) {}

  public getUser(): Observable<IUser> {
    return this.http.get<IUser>(`${environment.apiUrl}/user/me`).pipe(
      tap(user => this.authService.updateUser(user))
    );
  }

  public updateUser(userId: string, user: Partial<{
    name: string;
    surname: string;
    email: string;
    nation_id: number;
    address: string;
    zip: string;
    
  }>): Observable<IUser> {
    return this.http.put<IUser>(`${environment.apiUrl}/user/${userId}`, user);
  }

  public updatePassword(oldPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/user/update_password`, { old_password: oldPassword, new_password: newPassword });
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
