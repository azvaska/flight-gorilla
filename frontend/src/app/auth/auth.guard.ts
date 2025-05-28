import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (this.auth.getAccessToken()) return true;

    const currentState = this.router.getCurrentNavigation()?.extras.state;
    
    this.router.navigate(['/auth/login'], {
      state: {
        redirectUrl: state.url,
        originalState: currentState,
      },
    });


    return false;
  }
}

@Injectable({ providedIn: 'root' })
export class GuestGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}
  canActivate() {
    if (this.auth.getAccessToken()) {
      this.router.navigate(['/']);
      return false;
    }
    return true;
  }
}
