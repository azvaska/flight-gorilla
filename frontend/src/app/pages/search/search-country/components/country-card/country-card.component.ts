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
import { Router } from '@angular/router';

@Component({
  selector: 'country-card',
  imports: [HlmCardDirective, HlmCardHeaderDirective, HlmCardTitleDirective, HlmCardDescriptionDirective, HlmCardContentDirective, HlmCardFooterDirective, HlmButtonDirective],
  templateUrl: './country-card.component.html'
})
export class CountryCardComponent {
  @Input() countryName: string = "Italy";
  @Input() countryId: string = "1";
  @Input() startingPrice: string = "23";
  @Input() handleCountrySelection: (countryId: string) => void = () => {};


  constructor(private router: Router) {}


  handleClick() {
    this.handleCountrySelection(this.countryId);
  }
}
