import {Component, Input} from '@angular/core';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import {Router, ActivatedRoute, RouterLink} from '@angular/router';
import { BookingStateStore } from '@/app/stores/booking-state.store';
import { FlightCardComponent } from './components/flight-card/flight-card.component';
import { CommonModule } from '@angular/common';
import { BookingPhase } from '@/types/booking/booking-state';
import { IFlight } from '@/types/flight';

@Component({
  selector: 'app-booking-overview',
  imports: [HlmButtonDirective, FlightCardComponent, CommonModule],
  templateUrl: './booking-overview.component.html'
})
export class BookingOverviewComponent {

  protected departureFlights!: IFlight[];
  protected returnFlights: IFlight[] | undefined;

  constructor(private router: Router, private route: ActivatedRoute, private bookingStateStore: BookingStateStore) {
    const state = this.bookingStateStore.getBookingState()!;

    this.departureFlights = state.departureFlights;
    this.returnFlights = state.returnFlights;
  }

  protected onContinue() {
    this.bookingStateStore.updateBookingState({
      phase: BookingPhase.SEATS,
    });
  }

  get mappedDepartureFlights() {
    return this.departureFlights?.map(flight => ({
      details: flight,
      airlineName: flight.airline?.name
    }));
  }

  get mappedReturnFlights() {
    return this.returnFlights?.map(flight => ({
      details: flight,
      airlineName: flight.airline?.name
    }));
  }
}

