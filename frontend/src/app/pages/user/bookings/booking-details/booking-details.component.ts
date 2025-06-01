import { BookingFetchService } from '@/app/services/booking/booking-fetch.service';
import { LoadingService } from '@/app/services/loading.service';
import { IBooking } from '@/types/booking/booking';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-booking-details',
  imports: [],
  templateUrl: './booking-details.component.html',
})
export class BookingDetailsComponent {
  protected booking: IBooking | undefined = undefined;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private loadingService: LoadingService,
    private bookingFetchService: BookingFetchService
  ) {
    const id = this.route.snapshot.paramMap.get('bookingId');

    if (!id) {
      this.router.navigate(['/not-found']);
      return;
    }

    this.fetchBooking(id);
  }

  private async fetchBooking(id: string) {
    try {
      const booking = await firstValueFrom(
        this.bookingFetchService.getBookingById(id)
      );
      this.booking = booking;
    } catch (error) {
      this.router.navigate(['/not-found'], { skipLocationChange: true });
    } finally {
      this.loadingService.endLoadingTask();
    }
  }
}
