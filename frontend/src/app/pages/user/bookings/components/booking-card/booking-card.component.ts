import { Component, Input } from '@angular/core';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { IBooking, IBookingSegment } from '@/types/booking/booking';
import { CommonModule } from '@angular/common';
import { formatTime, formatDate } from '@/utils/date';
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
import { BookingFetchService } from '@/app/services/booking/booking-fetch.service';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { HlmSpinnerComponent } from '@spartan-ng/ui-spinner-helm';

@Component({
  selector: 'booking-card',
  imports: [
    CommonModule,
    HlmCardDirective,
    HlmButtonDirective,
    HlmAlertDialogActionButtonDirective,
    HlmAlertDialogCancelButtonDirective,
    HlmAlertDialogComponent,
    HlmAlertDialogContentComponent,
    HlmAlertDialogDescriptionDirective,
    HlmAlertDialogFooterComponent,
    HlmAlertDialogHeaderComponent,
    HlmAlertDialogTitleDirective,
    BrnAlertDialogContentDirective,
    BrnAlertDialogTriggerDirective,
    HlmSpinnerComponent,
  ],
  templateUrl: './booking-card.component.html',
})
export class BookingCardComponent {
  @Input() booking!: IBooking;

  protected isCancelBookingLoading = false;

  constructor(private bookingFetchService: BookingFetchService, private router: Router) {}

  protected formatTime(date: string) {
    return formatTime(new Date(date));
  }

  protected formatDate(date: string) {
    return formatDate(new Date(date), 'specific');
  }

  protected modifyDateReservation(id: string) {
    console.log('modify date reservation', id);
  }

  protected modifyExtrasReservation(id: string) {
    console.log('modify extras reservation', id);
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
