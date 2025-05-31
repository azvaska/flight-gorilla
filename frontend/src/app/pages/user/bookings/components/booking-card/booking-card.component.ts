import { Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { HlmCardContentDirective } from '@spartan-ng/ui-card-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { IBooking, IBookingSegment } from '@/types/booking/booking';
import { CommonModule } from '@angular/common';
import { formatTime, formatDate } from '@/utils/date';

@Component({
  selector: 'booking-card',
  imports: [
    HlmCardDirective,
    HlmButtonDirective,
    CommonModule
  ],
  templateUrl: './booking-card.component.html'
})
export class BookingCardComponent {
  @Input() booking!: IBooking;

  protected formatTime(date: string) {
    return formatTime(new Date(date));
  }

  protected formatDate(date: string) {
    return formatDate(new Date(date), 'specific');
  }

  protected modifyDateReservation(id: string) {
    console.log("modify date reservation", id);
  }

  protected modifyExtrasReservation(id: string) {
    console.log("modify extras reservation", id);
  }

  protected cancelReservation(id: string) {
    console.log("cancel reservation", id);
  }
}

