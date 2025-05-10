import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { AuthService } from './auth.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private refreshing = false;

  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const token = this.auth.getAccessToken();
    const authReq = token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    const isAuthEndpoint =
      req.url.endsWith('/login') ||
      req.url.endsWith('/register') ||
      req.url.endsWith('/refresh');

    return next.handle(authReq).pipe(
      catchError((err) => {
        // don't attempt refresh on auth endpoints
        if (
          isAuthEndpoint &&
          err instanceof HttpErrorResponse &&
          err.status === 401
        ) {
          return throwError(() => err);
        }
        if (
          err instanceof HttpErrorResponse &&
          err.status === 401 &&
          !this.refreshing
        ) {
          this.refreshing = true;
          return this.auth.refreshToken().pipe(
            switchMap(() => {
              this.refreshing = false;
              const newToken = this.auth.getAccessToken()!;
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` },
              });
              return next.handle(retryReq);
            }),
            catchError((refreshErr) => {
              this.refreshing = false;
              this.auth.logout(); // clears tokens
              return throwError(() => refreshErr);
            })
          );
        }
        return throwError(() => err);
      })
    );
  }
}
