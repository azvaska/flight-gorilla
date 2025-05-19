import { Component, Input } from '@angular/core';
import {
  HlmCardDirective,
  HlmCardContentDirective,
} from '@spartan-ng/ui-card-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { IJourney } from '@/types/search/flight';

@Component({
  selector: 'flight-card',
  imports: [HlmCardDirective, HlmCardContentDirective, HlmButtonDirective],
  templateUrl: './flight-card.component.html',
})
export class FlightCardComponent {

  @Input() journey!: IJourney;
  @Input() onSelect: () => void = () => {};
  

}
