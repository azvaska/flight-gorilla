import { Component, Input } from '@angular/core';
import {
  HlmCardDirective,
  HlmCardContentDirective,
} from '@spartan-ng/ui-card-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { IJourney } from '@/types/search/flight';
import prettyMilliseconds from 'pretty-ms';

@Component({
  selector: 'flight-card',
  imports: [HlmCardDirective, HlmCardContentDirective, HlmButtonDirective],
  templateUrl: './flight-card.component.html',
})
export class FlightCardComponent {
  @Input() journey!: IJourney;
  @Input() title: string = "";

  protected formatDate(date: string) {
    return new Date(date).toISOString().slice(11, 16);
  } 

  protected formatDuration(minutes: number) {
    return prettyMilliseconds(minutes * 60 * 1000);
  }
}
