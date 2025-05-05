import { Component } from '@angular/core';
import {
  HlmCardContentDirective,
  HlmCardDescriptionDirective,
  HlmCardDirective,
  HlmCardFooterDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
} from '@spartan-ng/ui-card-helm';
import { HlmCalendarComponent } from '@spartan-ng/ui-calendar-helm';

@Component({
  selector: 'app-search-dates',
  imports: [
    // HlmCardDirective,
    // HlmCardHeaderDirective,
    // HlmCardTitleDirective,
    // HlmCardDescriptionDirective,
    // HlmCardContentDirective,
    // HlmCardFooterDirective,
    // HlmCalendarComponent,
  ],
  templateUrl: './search-dates.component.html',
  host: {
    class: 'block w-full h-full',
  },
})
export class SearchDatesComponent {}
