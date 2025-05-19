import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { PopoverComponent } from '@/app/components/popover/popover.component';
import { PopoverTriggerDirective } from '@/app/components/popover/popover-trigger.directive';
import { FlightSearchBarComponent } from '@/app/components/flight-search/search-bar/search-bar.component';
import { SearchParamsGuard } from '@/app/guards/search-guard';
import { parseSpecificFlightSearchParams } from '@/utils/parsers/flight-search.parse';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, finalize, map, startWith } from 'rxjs/operators';
import { SearchFetchService } from '@/app/services/search/search-fetch.service';
import { stringToDate, formatDate } from '@/utils/date';
import { ILocation } from '@/types/search/location';
import { LoadingService } from '@/app/services/loading.service';
interface FetchState<T> {
  data: T | null;
  error: string | null;
}

interface SearchState {
  departureLocation: ILocation;
  arrivalLocation: ILocation;
  departureDate: Date;
  returnDate: Date | undefined;
  dateType: 'specific' | 'flexible';
}

@Component({
  selector: 'search',
  imports: [
    CommonModule,
    RouterModule,
    HlmCardDirective,
    PopoverComponent,
    PopoverTriggerDirective,
    FlightSearchBarComponent,
  ],
  templateUrl: './search.component.html',
  host: {
    class: 'block w-full h-full',
  },
})
export class SearchComponent {
  protected params!: ReturnType<typeof parseSpecificFlightSearchParams>;

  protected state$!: Observable<FetchState<SearchState>>;

  protected formatDate = formatDate;

  constructor(
    private searchParamsGuard: SearchParamsGuard,
    private flightSearchService: SearchFetchService,
    private router: Router,
    private loadingService: LoadingService
  ) {
    this.searchParamsGuard.params$.subscribe((params) => {
      this.params = params;
      console.log('refined params', this.params);
      this.loadingService.startLoadingTask();
      this.state$ = forkJoin({
        departure: this.getDepartureInfo(this.params),
        arrival: this.getArrivalInfo(this.params),
      }).pipe(
        map(({ departure, arrival }) => ({
          data: {
            departureLocation: departure,
            arrivalLocation: arrival,
            departureDate: stringToDate(this.params.departure_date),
            returnDate: this.params.return_date
              ? stringToDate(this.params.return_date)
              : undefined,
            dateType: this.getDateType(this.params),
          },
          error: null,
        })),
        startWith({ data: null, error: null }),
        catchError(() => {
          this.router.navigate(['/not-found']);
          return of({
            data: null,
            error: 'Failed to load data',
          });
        }),
        finalize(() => {
          this.loadingService.endLoadingTask();
        })
      );
    });
  }

  private getDateType(params: any) {
    return params.date_type ?? 'specific';
  }

  private getDepartureInfo(params: any): Observable<ILocation> {
    if (params.from_type === 'city') {
      return this.flightSearchService
        .getCity(params.from_id)
        .pipe(
          map((city) => ({ id: params.from_id, name: city.name, type: 'city' }))
        );
    } else if (params.from_type === 'airport') {
      return this.flightSearchService.getAirport(params.from_id).pipe(
        map((airport) => ({
          id: params.from_id,
          name: airport.name,
          type: 'airport',
        }))
      );
    }

    throw new Error('Invalid from_type');
  }

  private getArrivalInfo(params: any): Observable<ILocation> {
    if (params.to_type === 'anywhere') {
      return of({ id: undefined, name: 'Anywhere', type: 'anywhere' });
    }

    if (params.to_id === undefined) {
      throw new Error('No to_id provided');
    }

    if (params.to_type === 'city') {
      return this.flightSearchService
        .getCity(params.to_id)
        .pipe(
          map((city) => ({ id: params.to_id, name: city.name, type: 'city' }))
        );
    } else if (params.to_type === 'airport') {
      return this.flightSearchService.getAirport(params.to_id).pipe(
        map((airport) => ({
          id: params.to_id,
          name: airport.name,
          type: 'airport',
        }))
      );
    } else if (params.to_type === 'nation') {
      return this.flightSearchService.getNation(params.to_id).pipe(
        map((nation) => ({
          id: params.to_id,
          name: nation.name,
          type: 'nation',
        }))
      );
    }

    throw new Error('Invalid to_type');
  }
}
