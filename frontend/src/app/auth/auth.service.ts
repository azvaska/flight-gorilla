import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from '@/app/environments/environment';
interface AuthResp { access_token: string; refresh_token: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private authUrl = environment.apiUrl + '/auth';
  private accessTokenKey = 'access_token';
  private refreshTokenKey = 'refresh_token';
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
    return this.http.post<AuthResp>(`${this.authUrl}/refresh/`, { refreshToken: rt })
      .pipe(tap(res => this.storeTokens(res)));
  }

  logout() {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    this.loggedIn$.next(false);
    this.router.navigate(['/']);
  }

  get isLoggedIn() {
    return this.loggedIn$.value;
  }

  getAccessToken() {
    return localStorage.getItem(this.accessTokenKey);
  }

  private storeTokens = (res: AuthResp): void => {
    localStorage.setItem(this.accessTokenKey, res.access_token);
    localStorage.setItem(this.refreshTokenKey, res.refresh_token);
    this.loggedIn$.next(true);
  }
}
