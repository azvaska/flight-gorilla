import { Component, Input } from '@angular/core';
import {
  HlmCardDescriptionDirective,
  HlmCardDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
} from '@spartan-ng/ui-card-helm';
import { Router } from '@angular/router';
import { INation } from '@/types/search/location';

@Component({
  selector: 'country-card',
  imports: [
    HlmCardDirective,
    HlmCardHeaderDirective,
    HlmCardTitleDirective,
    HlmCardDescriptionDirective,
  ],
  templateUrl: './country-card.component.html',
})
export class CountryCardComponent {
  @Input() nation!: INation;
  @Input() startingPrice: string = '23';
  @Input() handleCountrySelection: (countryId: number) => void = () => {};

  constructor(private router: Router) {}

  handleClick() {
    this.handleCountrySelection(this.nation.id);
  }
}
