import { Component, Input } from '@angular/core';
import { NgClass, NgForOf, NgOptimizedImage } from '@angular/common';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { ExtraLineComponent } from './components/extra-line/extra-line.component';
import { RouterLink } from '@angular/router';
import { FlightFetchService } from '@/app/services/flight/flight-fetch.service';
import { BookingStateStore } from '@/app/stores/booking-state.store';
import { getCurrentFlight } from '@/utils/booking';
import { LoadingService } from '@/app/services/loading.service';
import { IFlightExtra } from '@/types/flight';
import {
  HlmCardDirective,
  HlmCardContentDirective,
} from '@spartan-ng/ui-card-helm';
import { BookingPhase } from '@/types/booking/booking-state';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'booking-extras',
  standalone: true,
  imports: [
    NgOptimizedImage,
    HlmButtonDirective,
    ExtraLineComponent,
    NgForOf,
    NgClass,
    HlmCardDirective,
    HlmCardContentDirective,
  ],
  templateUrl: './booking-extras.component.html',
})
export class BookingExtrasComponent {
  private _currentFlightIndex: number = 0;

  protected extras: (IFlightExtra & { quantity: number })[] | undefined =
    undefined;

  protected isInsuranceSelected = false;

  constructor(
    private flightFetchService: FlightFetchService,
    private bookingStateStore: BookingStateStore,
    private loadingService: LoadingService
  ) {
    this.fetchFlightExtras().then((extras) => {
      this.extras = extras?.map((extra) => ({ ...extra, quantity: 0 }));
    });
  }

  private async fetchFlightExtras() {
    this.loadingService.startLoadingTask();
    const extras = await firstValueFrom(this.flightFetchService
      .getFlightExtras(this.currentFlight!.id)
    );
    this.loadingService.endLoadingTask();
    console.log('Fetched new extras', extras);
    return extras;
  }

  protected get insurancePrice() {
    const state = this.bookingStateStore.getBookingState();

    let insuranceCost = state.departureFlights.reduce((sum, flight) => {
      return sum + flight.price_insurance;
    }, 0);

    if (state.returnFlights) {
      insuranceCost += state.returnFlights.reduce((sum, flight) => {
        return sum + flight.price_insurance;
      }, 0);
    }

    return insuranceCost;
  }

  protected get currentFlight() {
    const state = this.bookingStateStore.getBookingState();
    return getCurrentFlight(
      state.departureFlights,
      state.returnFlights,
      this._currentFlightIndex
    );
  }

  get totalAmount() {
    const sum =
      this.extras?.reduce((sum, extra) => {
        return sum + extra.price * extra.quantity;
      }, 0) ?? 0;

    const insurancePrice = this.isInsuranceSelected ? this.insurancePrice : 0;

    return sum + insurancePrice;
  }

  protected onContinue() {
    if (!this.extras) {
      throw new Error('Extras not found');
    }

    // Add new extras to old extras. For extras with multiple quantity, me duplicate ids
    const state = this.bookingStateStore.getBookingState();
    const oldExtraIds = state.extraIds;
    const extraIds = this.extras.reduce((acc, extra) => {
      for (let i = 0; i < extra.quantity; i++) {
        acc.push(extra.id);
      }

      return acc;
    }, oldExtraIds);

    this.bookingStateStore.updateBookingState({
      extraIds,
    });

    this._currentFlightIndex++;
    if (this.currentFlight) {
      this.fetchFlightExtras().then((extras) => {
        if (!extras) {
          throw new Error('No flight seats found');
        }

        this.extras = extras?.map((extra) => ({ ...extra, quantity: 0 }));
      });
    } else {
      console.log(
        'No more flights, going to payment with these extras',
        this.bookingStateStore.getBookingState().extraIds,
        'hasInsurance',
        this.isInsuranceSelected
      );
      this.bookingStateStore.updateBookingState({
        hasInsurance: this.isInsuranceSelected,
        phase: BookingPhase.PAYMENT,
      });
    }
  }
}
