import { IBookingExtra, IBookingSegment } from '@/types/booking/booking';
import { IFlight } from '@/types/flight';
import { Component, Input } from '@angular/core';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import prettyMilliseconds from 'pretty-ms';
import { CommonModule } from '@angular/common';
import { beautifyFlightClass } from '@/utils/booking';

@Component({
  selector: 'flight-card',
  imports: [HlmCardDirective, CommonModule],
  templateUrl: './flight-card.component.html',
})
export class FlightCardComponent {

  protected beautifyFlightClass = beautifyFlightClass;

  @Input() segment!: IBookingSegment;

  protected formatDate(date: string) {
    return new Date(date).toISOString().slice(11, 16);
  }

  protected formatDuration(minutes: number) {
    return prettyMilliseconds(minutes * 60 * 1000);
  }
}
