import { Component } from '@angular/core';
import { SearchInputComponent } from '@/app/components/search-input/search-input.component';
import { DateInputComponent } from '@/app/components/date-input/date-input.component';
import { RouterModule, Router } from '@angular/router';
import { FlightSearchBarComponent } from '@/app/components/flight-search/search-bar/search-bar.component';
import {
  HlmCardContentDirective,
  HlmCardDescriptionDirective,
  HlmCardDirective,
  HlmCardFooterDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
} from '@spartan-ng/ui-card-helm';
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
    class: 'block w-full h-full', // oppure qualsiasi combinazione tu voglia
  },
  standalone: true,
})
export class LandingPageComponent {
  public departurePlace: string | undefined = undefined;
  public arrivalPlace: string | undefined = undefined;
  public departureDate: Date | undefined = undefined;
  public returnDate: Date | undefined = undefined;

  public dateType: 'specific' | 'flexible' = 'specific';

  constructor(private router: Router) {}

  public formatDate(date: Date, dateType: 'specific' | 'flexible') {
    const dd = date.toLocaleString('en-GB', { day: '2-digit' });
    const mm = date.toLocaleString('en-GB', { month: '2-digit' });
    const yyyy = date.getFullYear();
    if (dateType === 'specific') {
      return `${dd}-${mm}-${yyyy}`;
    } else {
      //Only month and year
      return `${mm}-${yyyy}`;
    }
  }

  public submitFlightSearch() {
    // TODO: Mock logic.
    const from_type = 'city';
    const to_type = 'city';

    // /search?from_type=city&to_type=city&from_id=Rome&to_id=Milan&departure_date=2025-05-11&return_date=2025-05-12&date_type=specific

    this.router.navigate(['/search'], {
      queryParams: {
        from_type: from_type,
        to_type: to_type,
        from_id: this.departurePlace,
        to_id: this.arrivalPlace,
        departure_date: this.formatDate(this.departureDate!, this.dateType),
        return_date: this.formatDate(this.returnDate!, this.dateType),
        date_type: this.dateType,
      },
    });
  }
}
