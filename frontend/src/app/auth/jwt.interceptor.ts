import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { AuthService } from './auth.service';
import { catchError, switchMap, throwError, filter, take, Observable, BehaviorSubject, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private refreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.getAccessToken();

    const isRefreshEndpoint = req.url.endsWith('/refresh');
    const isAuthEndpoint =
      req.url.endsWith('/login') ||
      req.url.endsWith('/register') ||
      req.url.endsWith('/logout') ||
      isRefreshEndpoint;

    if (isRefreshEndpoint) {
      const csrfToken = this.getCookie('csrf_refresh_token');
      req = req.clone({
        withCredentials: true,
        headers: req.headers.set('X-CSRF-TOKEN', csrfToken || ''),
      });
    }

    if (token && !isAuthEndpoint) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
    }

    return next.handle(req).pipe(
      catchError((err) => {
        // If the endpoint with error wasn't an auth endpoint
        if (
          !isAuthEndpoint &&
          err instanceof HttpErrorResponse &&
          err.status === 401
        ) {
          return this.handle401Error(req, next);
        }
        return throwError(() => err);
      })
    );
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.refreshing) {
      this.refreshing = true;
      this.refreshTokenSubject.next(null);

      return this.auth.refreshToken().pipe(
        switchMap(() => {
          this.refreshing = false;
          const newToken = this.auth.getAccessToken()!;
          this.refreshTokenSubject.next(newToken);
          
          return next.handle(this.addTokenHeader(request, newToken));
        }),
        catchError((refreshErr) => {
          this.refreshing = false;
          this.refreshTokenSubject.next(null);
          firstValueFrom(this.auth.logout());
          return throwError(() => refreshErr);
        })
      );
    }

    // Se il refresh è già in corso, aspetta che finisca
    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap((token) => next.handle(this.addTokenHeader(request, token)))
    );
  }

  private addTokenHeader(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  private getCookie(name: string): string | null {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let c of ca) {
      c = c.trim();
      if (c.startsWith(nameEQ)) {
        return decodeURIComponent(c.substring(nameEQ.length));
      }
    }
    return null;
  }
}
