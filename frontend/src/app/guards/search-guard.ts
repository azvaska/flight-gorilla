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
import { BehaviorSubject, map, Observable } from 'rxjs';

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
    try {
      const {
        from_id,
        from_type,
        to_type,
        to_id,
        departure_date,
        return_date,
        date_type,
      } = parseGenericFlightSearchParams(route.queryParams);

      if (to_type === 'anywhere') {
        return this.router.createUrlTree([`/search/nation`], {
          queryParams: {
            from_id,
            from_type,
            to_type,
            departure_date,
            return_date,
            date_type,
          },
        });
      } else if (to_type === 'nation') {
        return this.router.createUrlTree([`/search/city`], {
          queryParams: {
            from_id,
            from_type,
            to_type,
            to_id,
            departure_date,
            return_date,
            date_type,
          },
        });
      } else if (date_type === 'flexible') {
        return this.router.createUrlTree([`/search/dates`], {
          queryParams: {
            from_id,
            from_type,
            to_type,
            to_id,
            departure_date,
            return_date,
            date_type,
          },
        });
      } else {
        return this.router.createUrlTree([`/search/flights`], {
          queryParams: {
            from_id,
            from_type,
            to_type,
            to_id,
            departure_date,
            return_date,
            date_type,
          },
        });
      }
    } catch (e) {
      console.error(e);
      return this.router.createUrlTree(['/not-found']);
    }
  }
}

@Injectable({ providedIn: 'root' })
export class SearchParamsGuard implements CanActivateChild {
  private _paramsSubject = new BehaviorSubject<ReturnType<typeof parseSpecificFlightSearchParams> | null>(null);
  public readonly params$: Observable<ReturnType<typeof parseSpecificFlightSearchParams>> =
  this._paramsSubject.asObservable().pipe(
    map(value => {
      if (!value) throw new Error('Params not found');
      return value;
    })
  );
  constructor(private router: Router) {}

  canActivateChild(childRoute: ActivatedRouteSnapshot): boolean | UrlTree {
    try {
      const type = childRoute.routeConfig?.path;
      const params = parseSpecificFlightSearchParams(
        childRoute.queryParams,
        type as 'nation' | 'city' | 'dates' | 'flights'
      );

      this._paramsSubject.next(params);

      return true;
    } catch (e) {
      console.error(e);
      return this.router.createUrlTree(['/not-found']);
    }
  }

  public get params() {
    const value = this._paramsSubject.value;
    if (!value) {
      throw new Error('Params not found');
    }
    return value;
  }
}
