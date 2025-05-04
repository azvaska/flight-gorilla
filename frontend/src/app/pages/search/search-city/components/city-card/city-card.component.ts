import { Component, Input } from '@angular/core';
import {
  HlmCardContentDirective,
  HlmCardDescriptionDirective,
  HlmCardDirective,
  HlmCardFooterDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
} from '@spartan-ng/ui-card-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';

@Component({
  selector: 'city-card',
  imports: [HlmCardDirective, HlmCardHeaderDirective, HlmCardTitleDirective, HlmCardDescriptionDirective, HlmCardContentDirective, HlmCardFooterDirective, HlmButtonDirective],
  templateUrl: './city-card.component.html'
})
export class CityCardComponent {
  @Input() cityName: string = "Rome";
  @Input() cityId: string = "1";
  @Input() startingPrice: string = "23";
  @Input() handleCitySelection: (cityId: string) => void = () => {};


  handleClick() {
    this.handleCitySelection(this.cityId);
  }
}
