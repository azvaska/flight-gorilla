import { Component, NgZone } from '@angular/core';
import { FlightCardComponent } from './components/flight-card/flight-card.component';
import {
  HlmCardDirective,
  HlmCardContentDirective,
} from '@spartan-ng/ui-card-helm';
import { IJourney } from '@/types/search/flight';
import { Router } from '@angular/router';
import { SearchParamsGuard } from '@/app/guards/search-guard';
import { SearchFetchService } from '@/app/services/search/search-fetch.service';
import { LoadingService } from '@/app/services/loading.service';
import { provideIcons } from '@ng-icons/core';
import { lucideLoaderCircle } from '@ng-icons/lucide';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { CommonModule } from '@angular/common';

enum SearchPhase {
  DEPARTURE = 'departure',
  RETURN = 'return',
}

@Component({
  selector: 'app-search-flights',
  imports: [FlightCardComponent, HlmCardDirective, HlmCardContentDirective, NgIcon, HlmButtonDirective, CommonModule],
  templateUrl: './search-flights.component.html',
  providers: [provideIcons({ lucideLoaderCircle })],
})
export class SearchFlightsComponent {
  protected journeys: IJourney[] = [];

  protected searchPhase: SearchPhase = SearchPhase.DEPARTURE;
  protected SearchPhase = SearchPhase;

  private _page: number = 1;
  protected morePagesLoading: boolean = false;
  protected lastPage: boolean = false;

  protected selectedDepartureJourney: IJourney | null = null;
  protected selectedReturnJourney: IJourney | null = null;

  constructor(
    private router: Router,
    private searchParamsGuard: SearchParamsGuard,
    private searchFetchService: SearchFetchService,
    private loadingService: LoadingService
  ) {
    this.loadingService.startLoadingTask();
    this.fetchFlights(SearchPhase.DEPARTURE, 1).then((flights) => {
      this.journeys = flights;
      this.loadingService.endLoadingTask();
    });
  }

  private async fetchFlights(type: SearchPhase, page: number) {
    let fetch;

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
      });
    }

    return new Promise<IJourney[]>((resolve) => {
      fetch.subscribe((flights) => {
        resolve(flights);
      });
    });
  }

  protected loadMoreFlights() {
    this._page++;
    this.morePagesLoading = true;
    this.fetchFlights(this.searchPhase, this._page).then((flights) => {
      if (flights.length > 0) {
        this.journeys = [...this.journeys, ...flights];
      } else {
        this.lastPage = true;
      }
      this.morePagesLoading = false;
    });
  }

  protected onFlightCardClick(journey: IJourney) {
    console.log('onFlightCardClick', journey);
    if (this.searchPhase === SearchPhase.DEPARTURE) {
      if (this.searchParamsGuard.params.return_date) {

        this.searchPhase = SearchPhase.RETURN;
        this.selectedDepartureJourney = journey;
        this._page = 1;

        this.loadingService.startLoadingTask();
        this.fetchFlights(this.searchPhase, this._page).then((flights) => {
          this.journeys = flights;
          this.loadingService.endLoadingTask();
        });
        return;
      }
    } else {
      this.selectedReturnJourney = journey;
    }
    //TODO: Navigate to booking
    console.log(this.selectedDepartureJourney, this.selectedReturnJourney);
  }
}
