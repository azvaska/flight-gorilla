import { Injectable } from '@angular/core';
import { CanMatch, Route, UrlSegment, Router, UrlTree } from '@angular/router';
import { AuthService, AuthUser } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanMatch {
  constructor(private authService: AuthService, private router: Router) {}

  canMatch(route: Route, segments: UrlSegment[]): boolean | UrlTree {

    console.log("segments", segments.join('/'))

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

    if(user.type === 'airline-admin' && user.active === false && segments.join('/') !== 'airline'){
      this.router.navigate(['/airline']);
      return false;
    }


    // If the user is logged in, we let it through if the page allows the user's role otherwise we redirect to not found
    if (user && allowedRoles.includes(user.type)) {
      return true;
    }


    return false
  }
}

@Injectable({ providedIn: 'root' })
export class MultipleMatchingRoleGuard implements CanMatch {
  constructor(private authService: AuthService, private router: Router) {}

  private canAccess(user: AuthUser | null, allowedRoles: string[], segments: UrlSegment[], currentState: any): boolean {

    if (!user) {
      if (allowedRoles.includes('guest')) return true;

      this.router.navigate(['/auth/login'], {
        state: {
          redirectUrl: segments.map((s) => s.path).join('/'),
          originalState: currentState,
        },
        replaceUrl: true,
      });
      return false;
    }

    // Airline-specific access redirect
    if (
      user.type === 'airline-admin' &&
      user.active === false &&
      segments.map((s) => s.path).join('/') !== 'airline'
    ) {
      this.router.navigate(['/airline']);
      return false;
    }

    // Authorized
    if (allowedRoles.includes(user.type)) return true;

    // Not authorized for this route
    return false;
  }

  canMatch(route: Route, segments: UrlSegment[]): boolean | UrlTree {
    
    const neededPath = segments.join('/');

    const user = this.authService.getUser();
    const parentPath = route.path ?? '';
    const currentState = this.router.getCurrentNavigation()?.extras.state;

    const allowedRoles: string[] = route.data?.['roles'] ?? [];

    if (!route.children || route.children.length === 0) {
      return parentPath === neededPath && this.canAccess(user, allowedRoles, segments, currentState);
    }

    for (const child of route.children ?? []) {
      const childPath = parentPath === '' ? child.path : child.path === '' ?  parentPath:  parentPath + '/' + child.path

      if (childPath !== neededPath) continue;

      return this.canAccess(user, allowedRoles, segments, currentState);
    }

    return false;
  }
}

