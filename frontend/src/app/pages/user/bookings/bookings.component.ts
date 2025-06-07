import { Component } from '@angular/core';
import { NgForOf } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IBooking } from '@/types/booking/booking';
import { BookingFetchService } from '@/app/services/booking/booking-fetch.service';
import { LoadingService } from '@/app/services/loading.service';
import { firstValueFrom } from 'rxjs';
import { BookingCardComponent } from './components/booking-card/booking-card.component';

@Component({
  selector: 'bookings',
  imports: [NgForOf, BookingCardComponent],
  host: {
    class: 'block w-full h-full',
  },
  templateUrl: './bookings.component.html',
})
export class BookingsComponent {
  protected bookings: IBooking[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private bookingFetchService: BookingFetchService,
    private loadingService: LoadingService
  ) {
    this.loadingService.startLoadingTask();
    firstValueFrom(this.bookingFetchService.getBookings()).then((bookings) => {
      this.bookings = bookings;
      console.log(this.bookings);
      this.loadingService.endLoadingTask();
    });
  }

  protected navigateToBooking(bookingId: string) {
    this.router.navigate(['/user/bookings', bookingId]);
  }
}
