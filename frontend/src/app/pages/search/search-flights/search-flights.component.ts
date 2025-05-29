import { Component, NgZone } from '@angular/core';
import { FlightCardComponent } from './components/flight-card/flight-card.component';
import {
  HlmCardDirective,
  HlmCardContentDirective,
} from '@spartan-ng/ui-card-helm';
import { IJourney } from '@/types/search/journey';
import { Router } from '@angular/router';
import { SearchParamsGuard } from '@/app/guards/search-guard';
import { SearchFetchService } from '@/app/services/search/search-fetch.service';
import { LoadingService } from '@/app/services/loading.service';
import { provideIcons } from '@ng-icons/core';
import { lucideLoaderCircle } from '@ng-icons/lucide';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { CommonModule } from '@angular/common';
import { HlmIconDirective } from '@spartan-ng/ui-icon-helm';
import { HlmSliderComponent } from '@spartan-ng/ui-slider-helm';


enum SearchPhase {
  DEPARTURE = 'departure',
  RETURN = 'return',
}

@Component({
  selector: 'app-search-flights',
  imports: [
    FlightCardComponent,
    HlmCardDirective,
    HlmCardContentDirective,
    NgIcon,
    HlmButtonDirective,
    CommonModule,
    HlmIconDirective,
    HlmSliderComponent,
  ],
  templateUrl: './search-flights.component.html',
  providers: [provideIcons({ lucideLoaderCircle })],
})
export class SearchFlightsComponent {
  protected journeys: IJourney[] = [];
  protected totalPages: number = 0;

  protected searchPhase: SearchPhase = SearchPhase.DEPARTURE;
  protected SearchPhase = SearchPhase;

  private _page: number = 1;
  protected morePagesLoading: boolean = false;
  protected lastPage: boolean = false;
  protected selectedDepartureJourney: IJourney | null = null;
  protected selectedReturnJourney: IJourney | null = null;

  protected sortBy: string = 'price-asc';
  protected maxPrice: number = 1000;
  protected minDepartureTime: string = '00:00';
  protected maxDepartureTime: string = '23:00';

  constructor(
    private router: Router,
    private searchParamsGuard: SearchParamsGuard,
    private searchFetchService: SearchFetchService,
    private loadingService: LoadingService
  ) {
    this.loadingService.startLoadingTask();
    this.fetchFlights(SearchPhase.DEPARTURE, 1).then((flights) => {
      this.journeys = flights.journeys;
      this.loadingService.endLoadingTask();
    });
  }

  private async fetchFlights(type: SearchPhase, page: number) {
    let fetch;
    this._page = page;

    const sortParamters = this.sortBy.split('-')

    if (type === SearchPhase.DEPARTURE) {
      fetch = this.searchFetchService.getFlights({
        departureId: this.searchParamsGuard.params.from_id,
        departureType: this.searchParamsGuard.params.from_type,
        arrivalId: this.searchParamsGuard.params.to_id as string,
        arrivalType: this.searchParamsGuard.params.to_type as
          | 'airport'
          | 'city',
        departureDate: this.searchParamsGuard.params.departure_date,
        page: page,
        sortBy: sortParamters[0] as 'price' | 'duration' | 'stops',
        sortDirection: sortParamters[1] as 'asc' | 'desc',
        maxPrice: this.maxPrice,
        minDepartureTime: this.minDepartureTime,
        maxDepartureTime: this.maxDepartureTime,
      });
    } else {
      fetch = this.searchFetchService.getFlights({
        departureId: this.searchParamsGuard.params.to_id as string,
        departureType: this.searchParamsGuard.params.to_type as
          | 'airport'
          | 'city',
        arrivalId: this.searchParamsGuard.params.from_id,
        arrivalType: this.searchParamsGuard.params.from_type as
          | 'airport'
          | 'city',
        departureDate: this.searchParamsGuard.params.return_date!,
        page: page,
        sortBy: sortParamters[0] as 'price' | 'duration' | 'stops',
        sortDirection: sortParamters[1] as 'asc' | 'desc',
        maxPrice: this.maxPrice,
        minDepartureTime: this.minDepartureTime,
        maxDepartureTime: this.maxDepartureTime,
      });
    }

    return new Promise<{
      journeys: IJourney[];
      total_pages: number;
    }>((resolve) => {
      fetch.subscribe((flights) => {
        this.totalPages = flights.total_pages;
        this.lastPage = this._page >= this.totalPages;
        resolve(flights);
      });
    });
  }

  protected loadMoreFlights() {
    this.morePagesLoading = true;
    this.fetchFlights(this.searchPhase, this._page + 1).then((flights) => {
      if (flights.journeys.length > 0) {
        this.journeys = [...this.journeys, ...flights.journeys];
      }
      this.morePagesLoading = false;
    });
  }

  protected onFlightCardClick(journey: IJourney) {
    if (this.searchPhase === SearchPhase.DEPARTURE) {
      this.selectedDepartureJourney = journey;
      if (this.searchParamsGuard.params.return_date) {
        this.searchPhase = SearchPhase.RETURN;

        this.loadingService.startLoadingTask();
        this.fetchFlights(this.searchPhase, 1).then((flights) => {
          this.journeys = flights.journeys;
          this.loadingService.endLoadingTask();
        });
        return;
      }
    } else {
      this.selectedReturnJourney = journey;
    }
    console.log(this.selectedDepartureJourney, this.selectedReturnJourney);
    this.router.navigateByUrl('/booking', {
      state: {
        departureJourney: this.selectedDepartureJourney,
        returnJourney: this.selectedReturnJourney,
      },
    });
  }

  protected onSortChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.sortBy = target.value;
    this.loadingService.startLoadingTask();
    this.fetchFlights(this.searchPhase, 1).then((flights) => {
      this.journeys = flights.journeys;
      this.loadingService.endLoadingTask();
    });
  }

  protected onMinDepartureTimeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.minDepartureTime = target.value;
    this.loadingService.startLoadingTask();
    this.fetchFlights(this.searchPhase, 1).then((flights) => {
      this.journeys = flights.journeys;
      this.loadingService.endLoadingTask();
    });
  }

  protected onMaxDepartureTimeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.maxDepartureTime = target.value;
    this.loadingService.startLoadingTask();
    this.fetchFlights(this.searchPhase, 1).then((flights) => {
      this.journeys = flights.journeys;
      this.loadingService.endLoadingTask();
    });
  }

  protected onPriceChange() {
    console.log('onPriceChange');
    this.loadingService.startLoadingTask();
    this.fetchFlights(this.searchPhase, 1).then((flights) => {
      this.journeys = flights.journeys;
      this.loadingService.endLoadingTask();
    });
  }

  protected capture(event: PointerEvent) {
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }
}
