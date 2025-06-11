import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, of, tap } from 'rxjs';
import { environment } from '@/app/environments/environment';
import { Role, IUser } from '@/types/user/user';

interface AuthResp {
  access_token: string;
  user: AuthUser;
}

export interface AuthUser {
  type: Role;
  id: string;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private authUrl = environment.apiUrl + '/auth';
  private accessTokenKey = 'access_token';
  private userKey = 'current_user';
  public loggedIn$ = new BehaviorSubject<boolean>(!!this.getAccessToken());
  public user$ = new BehaviorSubject<AuthUser | null>(this.getUser());

  constructor(private http: HttpClient, private router: Router) {}

  register(creds: {
    email: string;
    password: string;
    name: string;
    surname: string;
    address: string;
    zip: string;
    nation_id: number;
  }) {
    return this.http
      .post<AuthResp>(`${this.authUrl}/register`, creds)
      .pipe(tap((res) => this.storeTokens(res)));
  }

  login(creds: { email: string; password: string }) {
    return this.http
      .post<AuthResp>(`${this.authUrl}/login`, creds)
      .pipe(tap((res) => this.storeTokens(res)));
  }

  refreshToken() {
    return this.http
      .post<AuthResp>(`${this.authUrl}/refresh`, {})
      .pipe(tap((res) => this.storeTokens(res, false)));
  }

  logout() {
    return this.http.post(`${this.authUrl}/logout`, {}).pipe(
      catchError(err => {
        // We ignore the error and continue in the tap()
        return of(null);
      }),
      tap(() => {
        localStorage.removeItem(this.accessTokenKey);
        localStorage.removeItem(this.userKey);
        this.loggedIn$.next(false);
        this.user$.next(null);

        this.router.navigate(['/']).then(() => {
          window.location.reload();
        });
      })
    );
  }

  get isLoggedIn() {
    return this.loggedIn$.value;
  }

  getAccessToken() {
    return localStorage.getItem(this.accessTokenKey);
  }

  getUser() {
    const userJson = localStorage.getItem(this.userKey);
    return userJson ? (JSON.parse(userJson) as AuthUser) : null;
  }

  updateUser(user: IUser): void {
    const authUser: AuthUser = {
      id: user.id,
      type: user.type,
      active: user.active
    };
    localStorage.setItem(this.userKey, JSON.stringify(authUser));
    this.user$.next(user);
  }

  private storeTokens = (res: AuthResp, includesUser: boolean = true): void => {
    localStorage.setItem(this.accessTokenKey, res.access_token);
    if (includesUser) {
      localStorage.setItem(this.userKey, JSON.stringify(res.user));
      this.user$.next(res.user);
    }
    // Emetti solo se il valore è cambiato
    if (!this.loggedIn$.value) {
      this.loggedIn$.next(true);
    }
  };
}
