import { Component, Input } from '@angular/core';
import {
  HlmCardDirective,
  HlmCardContentDirective,
} from '@spartan-ng/ui-card-helm';
import prettyMilliseconds from 'pretty-ms';
import { IFlight } from '@/types/flight';

@Component({
  selector: 'flight-card',
  imports: [HlmCardDirective, HlmCardContentDirective],
  templateUrl: './flight-card.component.html',
})
export class FlightCardComponent {
  @Input() flights!: {
    details: IFlight;
    airlineName: string;
  }[];
  @Input() title: string = "";

  protected formatDate(date: string) {
    return new Date(date).toISOString().slice(11, 16);
  } 

  protected formatDuration(minutes: number) {
    return prettyMilliseconds(minutes * 60 * 1000);
  }
}
