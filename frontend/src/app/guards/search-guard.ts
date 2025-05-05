// src/app/guards/search-redirect.guard.ts
import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree,
  CanActivateChild,
} from '@angular/router';
import {
  parseSpecificFlightSearchParams,
  parseGenericFlightSearchParams,
} from '@/utils/parsers/flight-search.parse';

@Injectable({ providedIn: 'root' })
export class SearchRedirectGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    // if already on a child route, allow
    // return true;
    if (route.firstChild) return true;

    // parse & clean params, decide default child
    const {
      from_id,
      from_type,
      departure_date,
      return_date,
      date_type,
      to_type,
      to_id,
    } = parseGenericFlightSearchParams(route.queryParams);

    let next: 'country' | 'city' | 'dates' | 'flights';
    if (to_type === 'anywhere') {
      return this.router.createUrlTree([`/search/country`], {
        queryParams: {
          from_type,
          from_id,
          departure_date,
          return_date,
          date_type,
        },
      });
    } else if (to_type === 'country') {
      return this.router.createUrlTree([`/search/city`], {
        queryParams: {
          from_type,
          from_id,
          to_id,
          departure_date,
          return_date,
          date_type,
        },
      });
    } else if (date_type === 'flexible') {
      return this.router.createUrlTree([`/search/dates`], {
        queryParams: {
          from_type,
          from_id,
          to_type,
          to_id,
          departure_date,
          return_date,
        },
      });
    } else {
      return this.router.createUrlTree([`/search/flights`], {
        queryParams: {
          from_type,
          from_id,
          to_type,
          to_id,
          departure_date,
          return_date,
        },
      });
    }
  }
}

@Injectable({ providedIn: 'root' })
export class SearchParamsGuard implements CanActivateChild {
  constructor(private router: Router) {}

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    try {
      const type = childRoute.routeConfig?.path;

      parseSpecificFlightSearchParams(
        childRoute.queryParams,
        type as 'country' | 'city' | 'dates' | 'flights'
      );

      return true;
    } catch {
      return this.router.createUrlTree(['/404']);
    }
  }
}
