import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from '@/app/environments/environment';
import { Role } from '@/types/user/user';

interface AuthResp {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

interface AuthUser {
  type: Role;
  id: string;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private authUrl = environment.apiUrl + '/auth';
  private accessTokenKey = 'access_token';
  private refreshTokenKey = 'refresh_token';
  private userKey = 'current_user';
  public loggedIn$ = new BehaviorSubject<boolean>(!!this.getAccessToken());

  constructor(private http: HttpClient, private router: Router) {}

  register(creds: {email: string; password: string}) {
    return this.http.post<AuthResp>(`${this.authUrl}/register`, creds)
      .pipe(tap(res => this.storeTokens(res)));
  }

  login(creds: {email: string; password: string}) {
    return this.http.post<AuthResp>(`${this.authUrl}/login`, creds)
      .pipe(tap(res => this.storeTokens(res)));
  }

  refreshToken() {
    const rt = localStorage.getItem(this.refreshTokenKey);
    return this.http.post<AuthResp>(`${this.authUrl}/refresh`, { refreshToken: rt })
      .pipe(tap(res => this.storeTokens(res, false)));
  }

  logout() {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    this.loggedIn$.next(false);

    // We need this to fully reload the page if we logout
    this.router.navigate(['/']).then(() => {
      window.location.reload();
    });
  }

  get isLoggedIn() {
    return this.loggedIn$.value;
  }

  getAccessToken() {
    return localStorage.getItem(this.accessTokenKey);
  }

  getUser() {
    const userJson = localStorage.getItem(this.userKey);
    return userJson ? JSON.parse(userJson) as AuthUser : null;
  }

  private storeTokens = (res: AuthResp, includesUser: boolean = true): void => {
    localStorage.setItem(this.accessTokenKey, res.access_token);
    localStorage.setItem(this.refreshTokenKey, res.refresh_token);
    if (includesUser) {
      localStorage.setItem(this.userKey, JSON.stringify(res.user));
    }
    this.loggedIn$.next(true);
  }
}
