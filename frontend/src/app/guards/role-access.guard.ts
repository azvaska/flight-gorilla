import { Injectable } from '@angular/core';
import { CanMatch, Route, UrlSegment, Router, UrlTree } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanMatch {
  constructor(private authService: AuthService, private router: Router) {}

  canMatch(route: Route, segments: UrlSegment[]): boolean | UrlTree {

    if(!route.data) {
      return true;
    }

    const allowedRoles: string[] = route.data['roles'];
    const user = this.authService.getUser();

    // If the user is not logged in, we let it through if the page allows guests otherwise we redirect to login
    if(!user) {
      if(allowedRoles.includes('guest')) {
        return true;
      }

      const currentState = this.router.getCurrentNavigation()?.extras.state;
    
      this.router.navigate(['/auth/login'], {
        state: {
          redirectUrl: segments.join('/'),
          originalState: currentState,
        },
        replaceUrl: true,
      });

      return false;
    }

    // If the user is logged in, we let it through if the page allows the user's role otherwise we redirect to not found
    if (user && allowedRoles.includes(user.type)) {
      return true;
    }


    return false
  }
}
