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
import { catchError, map, startWith } from 'rxjs/operators';
import { SearchFetchService } from '@/app/services/search/search-fetch.service';
import { stringToDate, formatDate } from '@/utils/date';
import { HlmSpinnerComponent } from '@spartan-ng/ui-spinner-helm';

interface FetchState<T> {
  loading: boolean;
  data: T | null;
  error: string | null;
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
    HlmSpinnerComponent,
  ],
  templateUrl: './search.component.html',
  host: {
    class: 'block w-full h-full',
  },
})
export class SearchComponent {
  protected params!: ReturnType<typeof parseSpecificFlightSearchParams>;

  protected state$!: Observable<FetchState<any>>;

  protected formatDate = formatDate;

  constructor(
    private searchParamsGuard: SearchParamsGuard,
    private flightSearchService: SearchFetchService,
    private router: Router
  ) {
    this.searchParamsGuard.params$.subscribe((params) => {
      this.params = params;
      console.log(this.params);
      this.state$ = forkJoin({
        departure: this.getDepartureInfo(this.params),
        arrival: this.getArrivalInfo(this.params),
      }).pipe(
        map(({ departure, arrival }) => ({
          loading: false,
          data: {
            departureLocation: departure.name,
            arrivalLocation: arrival.name,
            departureDate: stringToDate(this.params.departure_date),
            returnDate: stringToDate(this.params.return_date),
            dateType: this.getDateType(this.params),
          },
          error: null,
        })),
        startWith({ loading: true, data: null, error: null }),
        catchError(() => {
          this.router.navigate(['/404']);
          return of({
            loading: false,
            data: null,
            error: 'Failed to load data',
          });
        })
      );
    });
  }

  private getDateType(params: any) {
    return params.date_type ?? 'specific';
  }

  private getDepartureInfo(params: any): Observable<{ name: string }> {
    if (params.from_type === 'city') {
      return this.flightSearchService.getCity(params.from_id);
    } else if (params.from_type === 'airport') {
      return this.flightSearchService.getAirport(params.from_id);
    }

    throw new Error('Invalid from_type');
  }

  private getArrivalInfo(params: any): Observable<{ name: string }> {
    if (params.to_type === undefined) {
      return of({ name: 'Anywhere' });
    }

    if (params.to_id === undefined) {
      throw new Error('No to_id provided');
    }

    if (params.to_type === 'city') {
      return this.flightSearchService.getCity(params.to_id);
    } else if (params.to_type === 'airport') {
      return this.flightSearchService.getAirport(params.to_id);
    } else if (params.to_type === 'country') {
      return this.flightSearchService.getCountry(params.to_id);
    }

    throw new Error('Invalid to_type');
  }
}
