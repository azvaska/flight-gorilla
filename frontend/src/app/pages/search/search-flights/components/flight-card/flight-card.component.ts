import { Component, Input } from '@angular/core';
import {
  HlmCardDirective,
  HlmCardContentDirective,
} from '@spartan-ng/ui-card-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';

@Component({
  selector: 'flight-card',
  imports: [HlmCardDirective, HlmCardContentDirective, HlmButtonDirective],
  templateUrl: './flight-card.component.html',
})
export class FlightCardComponent {
  @Input() departureCity: string = 'Paris';
  @Input() arrivalCity: string = 'London';

  @Input() firstDepartureTime: string = '10:00';
  @Input() firstArrivalTime: string = '11:30';

  @Input() secondDepartureTime: string = '12:00';
  @Input() secondArrivalTime: string = '13:30';

  @Input() firstDuration: string = '1h 30m';
  @Input() secondDuration: string = '1h 30m';

  @Input() firstAirline: string = 'Ryanair';
  @Input() secondAirline: string = 'Ryanair';

  @Input() price: string = '100';

  @Input() firstStops: number = 0;
  @Input() secondStops: number = 0;

  @Input() firstStopLocations: string[] = [];
  @Input() secondStopLocations: string[] = [];
}
