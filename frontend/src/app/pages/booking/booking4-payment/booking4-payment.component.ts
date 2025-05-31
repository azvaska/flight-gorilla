import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLoaderCircle } from '@ng-icons/lucide';
import { CreditCardListComponent } from '@/app/components/user/credit-card-list/credit-card-list.component';
import { IPayementCard } from '@/types/user/payement-card';
import { LoadingService } from '@/app/services/loading.service';
import { UserFetchService } from '@/app/services/user/user-fetch.service';
import { BookingFetchService } from '@/app/services/booking/booking-fetch.service';
import { BookingStateStore } from '@/app/stores/booking-state.store';
import { firstValueFrom } from 'rxjs';
import { BookingPhase } from '@/types/booking/booking-state';

@Component({
  selector: 'app-booking4-payment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HlmButtonDirective,
    CreditCardListComponent,
  ],
  templateUrl: './booking4-payment.component.html',
  providers: [provideIcons({ lucideLoaderCircle })],
})
export class Booking4PaymentComponent {
  selectedCardId: number | 'new' = 1;

  protected cards: IPayementCard[] | undefined;

  constructor(
    private router: Router,
    private loadingService: LoadingService,
    private userFetchService: UserFetchService,
    private bookingFetchService: BookingFetchService,
    private bookingStateStore: BookingStateStore
  ) {
    this.fetchCards().then((cards) => {
      this.cards = cards;
    });
  }

  private async fetchCards() {
    this.loadingService.startLoadingTask();
    const cards = await firstValueFrom(
      this.userFetchService.getPayementCards()
    );
    this.loadingService.endLoadingTask();
    return cards;
  }

  private async createBooking() {
    this.loadingService.startLoadingTask();

    const state = this.bookingStateStore.getBookingState();

    const booking = await firstValueFrom(
      this.bookingFetchService.createBooking({
        sessionId: state.seatSessionId!,
        departureFlightIds: state.departureFlights.map((flight) => flight.id),
        returnFlightIds: state.returnFlights?.map((flight) => flight.id) ?? [],
        extraIds: state.extraIds ?? [],
        hasInsurance: state.hasInsurance,
      })
    );

    this.loadingService.endLoadingTask();

    return booking;
  }

  protected onContinue() {
    try {
      this.createBooking().then((booking) => {
        console.log('Successfully created booking', booking);
        this.bookingStateStore.updateBookingState({
          phase: BookingPhase.CONFIRMED,
        });
      });
    } catch (error) {
      console.error('Error creating booking', error);
      this.bookingStateStore.updateBookingState({
        phase: BookingPhase.ERROR,
      });
    }
  }
}
