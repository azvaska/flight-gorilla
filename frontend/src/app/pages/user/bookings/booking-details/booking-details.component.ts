import { BookingFetchService } from '@/app/services/booking/booking-fetch.service';
import { LoadingService } from '@/app/services/loading.service';
import { IBooking } from '@/types/booking/booking';
import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CommonModule, NgIf, NgForOf } from '@angular/common';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import prettyMilliseconds from 'pretty-ms';
import { formatDate, formatTime } from '@/utils/date';
import { FlightCardComponent } from './components/flight-card/flight-card.component';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmIconDirective } from '@spartan-ng/ui-icon-helm';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideEllipsis } from '@ng-icons/lucide';
import { PopoverComponent } from '@/app/components/ui/popover/popover.component';
import { PopoverTriggerDirective } from '@/app/components/ui/popover/popover-trigger.directive';
import {
  BrnAlertDialogContentDirective,
  BrnAlertDialogTriggerDirective,
} from '@spartan-ng/brain/alert-dialog';
import {
  HlmAlertDialogActionButtonDirective,
  HlmAlertDialogCancelButtonDirective,
  HlmAlertDialogComponent,
  HlmAlertDialogContentComponent,
  HlmAlertDialogDescriptionDirective,
  HlmAlertDialogFooterComponent,
  HlmAlertDialogHeaderComponent,
  HlmAlertDialogTitleDirective,
} from '@spartan-ng/ui-alertdialog-helm';

import { HlmSpinnerComponent } from '@spartan-ng/ui-spinner-helm';

@Component({
  selector: 'app-booking-details',
  imports: [
    CommonModule,
    NgIf,
    HlmCardDirective,
    FlightCardComponent,
    HlmButtonDirective,
    NgIcon,
    HlmIconDirective,
    RouterLink,
    PopoverComponent,
    PopoverTriggerDirective,
    HlmAlertDialogComponent,
    HlmAlertDialogContentComponent,
    HlmAlertDialogHeaderComponent,
    HlmAlertDialogTitleDirective,
    HlmAlertDialogDescriptionDirective,
    HlmAlertDialogFooterComponent,
    HlmAlertDialogActionButtonDirective,
    HlmSpinnerComponent,
    BrnAlertDialogContentDirective,
    BrnAlertDialogTriggerDirective,
    HlmAlertDialogCancelButtonDirective,
  ],
  providers: [provideIcons({ lucideArrowLeft, lucideEllipsis })],
  templateUrl: './booking-details.component.html',
  host: {
    class: 'w-full h-fit',
  },
})
export class BookingDetailsComponent {
  protected booking!: IBooking;

  protected isCancelBookingLoading = false;

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

  protected formatDate(date: string): string {
    return formatDate(new Date(date), 'specific');
  }


  protected cancelBooking(id: string, modalCtx: any) {
    this.isCancelBookingLoading = true;
    firstValueFrom(this.bookingFetchService.deleteBooking(id))
      .then(() => {
        console.log('booking cancelled');
        this.router.navigate(['/bookings/cancelled'], { queryParams: { reimbursement: this.booking.is_insurance_purchased } });
      })
      .catch(() => {
        console.error('error cancelling booking');
      })
      .finally(() => {
        modalCtx.close();
        this.isCancelBookingLoading = false;
      });
  }

}
