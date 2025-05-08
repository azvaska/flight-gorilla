import { Component } from '@angular/core';
import { FlightCardComponent } from './components/flight-card/flight-card.component';
import {
  HlmCardDirective,
  HlmCardContentDirective,
} from '@spartan-ng/ui-card-helm';
import { BookingComponent } from "../../booking/booking.component";
@Component({
  selector: 'app-search-flights',
  imports: [FlightCardComponent, HlmCardDirective, HlmCardContentDirective, BookingComponent],
  templateUrl: './search-flights.component.html'
})
export class SearchFlightsComponent {

}
