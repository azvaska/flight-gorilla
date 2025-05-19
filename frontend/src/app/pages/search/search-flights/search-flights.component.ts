import { Component } from '@angular/core';
import { FlightCardComponent } from './components/flight-card/flight-card.component';
import {
  HlmCardDirective,
  HlmCardContentDirective,
} from '@spartan-ng/ui-card-helm';
import { IJourney } from '@/types/search/flight';
import { Router } from '@angular/router';
import { SearchParamsGuard } from '@/app/guards/search-guard';
import { SearchFetchService } from '@/app/services/search/search-fetch.service';

enum SearchPhase {
  DEPARTURE = 'departure',
  RETURN = 'return',
}

@Component({
  selector: 'app-search-flights',
  imports: [FlightCardComponent, HlmCardDirective, HlmCardContentDirective],
  templateUrl: './search-flights.component.html',
})
export class SearchFlightsComponent {

  protected departureJourneys: IJourney[] = [];
  protected arrivalJourneys: IJourney[] = [];

  protected searchPhase: SearchPhase = SearchPhase.DEPARTURE;
  protected SearchPhase = SearchPhase;

  constructor(
    private router: Router,
    private searchParamsGuard: SearchParamsGuard,
    private searchFetchService: SearchFetchService
  ) {
      this.searchFetchService.getFlights({
        departureId: this.searchParamsGuard.params.from_id,
        departureType: this.searchParamsGuard.params.from_type,
        arrivalId: this.searchParamsGuard.params.to_id as string,
        arrivalType: this.searchParamsGuard.params.to_type as "airport" | "city",
        departureDate: this.searchParamsGuard.params.departure_date,
        returnDate: this.searchParamsGuard.params.return_date as string, 
      }).subscribe((flights) => {
        this.departureJourneys = flights.departure;
        this.arrivalJourneys = flights.arrival;
      });
  }

  protected onFlightCardClick(journey: IJourney) {
    if(this.searchPhase === SearchPhase.DEPARTURE) {
      this.searchPhase = SearchPhase.RETURN;
    } else {
      // TODO: Handle booking
    }
  }
}
