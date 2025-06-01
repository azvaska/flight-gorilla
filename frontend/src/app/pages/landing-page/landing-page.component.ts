import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FlightSearchBarComponent } from '@/app/components/search/search-bar/search-bar.component';
import {
  HlmCardContentDirective,
  HlmCardDescriptionDirective,
  HlmCardDirective,
  HlmCardFooterDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
} from '@spartan-ng/ui-card-helm';
import { dateToString } from '@/utils/date';
@Component({
  selector: 'app-landing-page',
  imports: [
    RouterModule,
    FlightSearchBarComponent,
    HlmCardDirective,
    HlmCardContentDirective,
  ],
  templateUrl: './landing-page.component.html',
  host: {
    class: 'block w-full h-fit',
  },
  standalone: true,
})
export class LandingPageComponent {}
